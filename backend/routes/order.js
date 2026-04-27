const router = require("express").Router();
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const { authenticate, authorize } = require("../middleware/auth");

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculatePaymentStatus = (amountPaid, finalPrice, amountRefunded = 0) => {
  if (amountRefunded >= amountPaid && amountPaid > 0) return "refunded";
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid < finalPrice) return "partial";
  return "paid";
};

router.post("/", authenticate, authorize("client", "admin"), async (req, res) => {
  try {
    const {
      clientId,
      title,
      serviceType,
      subject,
      description = "",
      instructions = "",
      files = [],
      urgency = "normal",
      deadline,
      quotedPrice,
      finalPrice,
      amountPaid = 0,
      paymentMethod = "upi",
      paymentGatewayReference = "",
    } = req.body;

    if (!title || !serviceType || !subject) {
      return res.status(400).json({ message: "title, serviceType and subject are required" });
    }

    const normalizedQuotedPrice = asNumber(quotedPrice, -1);
    if (normalizedQuotedPrice < 0) {
      return res.status(400).json({ message: "quotedPrice must be a non-negative number" });
    }

    const normalizedFinalPrice = asNumber(finalPrice, normalizedQuotedPrice);
    const normalizedAmountPaid = asNumber(amountPaid, 0);
    const effectiveClientId = req.user.role === "admin" && clientId ? clientId : req.user.id;
    const paymentStatus = calculatePaymentStatus(normalizedAmountPaid, normalizedFinalPrice);

    const order = await Order.create({
      client: effectiveClientId,
      title: String(title).trim(),
      serviceType,
      subject: String(subject).trim(),
      description: String(description).trim(),
      instructions: String(instructions).trim(),
      files: Array.isArray(files) ? files : [],
      urgency,
      deadline: deadline ? new Date(deadline) : undefined,
      pricing: {
        quotedPrice: normalizedQuotedPrice,
        finalPrice: normalizedFinalPrice,
      },
      payment: {
        status: paymentStatus,
        amountPaid: normalizedAmountPaid,
        amountRefunded: 0,
        currency: "INR",
        lastPaidAt: normalizedAmountPaid > 0 ? new Date() : undefined,
      },
      status: "pending",
    });

    if (normalizedAmountPaid > 0) {
      await Transaction.create({
        order: order._id,
        client: effectiveClientId,
        processedBy: req.user.id,
        type: "payment",
        method: paymentMethod,
        status: "success",
        amount: normalizedAmountPaid,
        currency: "INR",
        gatewayReference: paymentGatewayReference,
        notes: "Initial payment captured at order creation",
      });
    }

    const populatedOrder = await Order.findById(order._id).populate("client", "name email role");
    return res.status(201).json(populatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create order", error: error.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const query = {};
    const { status, returnStatus } = req.query;

    if (req.user.role !== "admin") {
      query.client = req.user.id;
    }

    if (status) {
      query.status = status;
    }

    if (returnStatus) {
      query["returnRequest.status"] = returnStatus;
    }

    const orders = await Order.find(query)
      .populate("client", "name email role")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch orders", error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("client", "name email role");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.client && order.client._id.toString() === req.user.id;
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "You can only view your own order" });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch order", error: error.message });
  }
});

router.patch("/:id/status", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { status, progress, deliveryNote, deliveryFiles } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status) {
      order.status = status;
      if (status === "completed") {
        order.progress = 100;
        order.delivery = order.delivery || {};
        order.delivery.deliveredAt = order.delivery.deliveredAt || new Date();
      }
    }

    if (progress !== undefined) {
      order.progress = asNumber(progress, order.progress);
    }

    if (deliveryNote !== undefined) {
      order.delivery = order.delivery || {};
      order.delivery.note = String(deliveryNote);
    }

    if (deliveryFiles !== undefined && Array.isArray(deliveryFiles)) {
      order.delivery = order.delivery || {};
      order.delivery.files = deliveryFiles;
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id).populate("client", "name email role");
    return res.json(populatedOrder);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update order status", error: error.message });
  }
});

router.post("/:id/return-request", authenticate, authorize("client"), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, client: req.user.id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ message: "Return can only be requested for completed orders" });
    }

    order.returnRequest = order.returnRequest || {};

    if (order.returnRequest.status === "pending") {
      return res.status(409).json({ message: "Return request already pending" });
    }

    order.returnRequest.status = "pending";
    order.returnRequest.reason = String(reason || "").trim();
    order.returnRequest.requestedAt = new Date();
    order.returnRequest.reviewedBy = undefined;
    order.returnRequest.reviewedAt = undefined;
    order.returnRequest.adminComment = "";
    order.returnRequest.contentReturned = false;
    order.returnRequest.moneyReturned = false;
    order.returnRequest.refundAmount = 0;

    await order.save();

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create return request", error: error.message });
  }
});

router.patch("/:id/return-decision", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { decision, adminComment = "", refundAmount, returnContent = true, refundMethod = "bank-transfer" } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.returnRequest = order.returnRequest || {};

    if (order.returnRequest.status !== "pending") {
      return res.status(400).json({ message: "No pending return request for this order" });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approved or rejected" });
    }

    order.returnRequest.reviewedBy = req.user.id;
    order.returnRequest.reviewedAt = new Date();
    order.returnRequest.adminComment = String(adminComment).trim();

    if (decision === "rejected") {
      order.returnRequest.status = "rejected";
      await order.save();
      return res.json(order);
    }

    const maxRefund = Math.max(order.payment.amountPaid - order.payment.amountRefunded, 0);
    const normalizedRefund = Math.min(
      Math.max(asNumber(refundAmount, maxRefund), 0),
      maxRefund
    );

    order.returnRequest.status = "approved";
    order.returnRequest.contentReturned = Boolean(returnContent);
    order.returnRequest.moneyReturned = normalizedRefund > 0;
    order.returnRequest.refundAmount = normalizedRefund;

    if (returnContent) {
      order.delivery = order.delivery || {};
      order.delivery.files = [];
      order.delivery.note = order.delivery.note
        ? `${order.delivery.note}\n[Admin] Content returned due to approved return request.`
        : "[Admin] Content returned due to approved return request.";
    }

    if (normalizedRefund > 0) {
      order.payment.amountRefunded += normalizedRefund;
      order.payment.status = calculatePaymentStatus(
        order.payment.amountPaid,
        order.pricing.finalPrice,
        order.payment.amountRefunded
      );

      await Transaction.create({
        order: order._id,
        client: order.client,
        processedBy: req.user.id,
        type: "refund",
        method: refundMethod,
        status: "success",
        amount: normalizedRefund,
        currency: order.payment.currency || "INR",
        notes: `Refund processed for order ${order.orderNumber}`,
      });
    }

    if (order.payment.status === "refunded") {
      order.status = "refunded";
    } else {
      order.status = "returned";
    }

    await order.save();
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: "Unable to process return decision", error: error.message });
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    await Order.findByIdAndDelete(req.params.id);
    return res.json({ message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete order", error: error.message });
  }
});

router.delete("/:id/cancel", authenticate, authorize("client"), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "completed" || order.status === "returned" || order.status === "refunded") {
      return res.status(400).json({ message: "Cannot cancel completed order" });
    }

    const refundAmount = order.payment.amountPaid;
    
    order.status = "cancelled";
    
    if (refundAmount > 0) {
      order.payment.status = "refunded";
      order.payment.amountRefunded = refundAmount;
      order.returnRequest = {
        status: "approved",
        reason: "Order cancelled by client",
        requestedAt: new Date(),
        reviewedAt: new Date(),
        refundAmount: refundAmount,
        contentReturned: false,
        moneyReturned: true,
      };
    }
    
    await order.save();
    return res.json({ message: "Order cancelled", refunded: refundAmount > 0, refundAmount });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel order", error: error.message });
  }
});

module.exports = router;
