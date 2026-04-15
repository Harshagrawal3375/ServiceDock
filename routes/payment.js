const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const { authenticate } = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "your_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_key_secret",
});

router.post("/create-order", authenticate, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "Order ID and amount are required" });
    }

    const order = await Order.findOne({ _id: orderId, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.payment.status === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    const receipt = `receipt_${order._id}_${Date.now()}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      notes: {
        orderId: order._id.toString(),
        userId: req.user.id.toString(),
      },
    });

    return res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create payment order", error: error.message });
  }
});

router.post("/verify", authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const order = await Order.findOne({ _id: orderId, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_key_secret")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const paidAmount = razorpayOrder.amount / 100;

    const transaction = new Transaction({
      order: order._id,
      client: req.user.id,
      type: "payment",
      method: "upi",
      status: "success",
      amount: paidAmount,
      gatewayReference: razorpay_payment_id,
      notes: `Payment for order ${order.orderNumber}`,
    });
    await transaction.save();

    order.payment.status = "paid";
    order.payment.amountPaid = paidAmount;
    order.payment.lastPaidAt = new Date();
    if (paidAmount >= order.pricing.finalPrice) {
      order.status = "accepted";
    }
    await order.save();

    return res.json({
      success: true,
      message: "Payment verified successfully",
      transactionId: transaction._id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
});

router.post("/request-refund", authenticate, async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId || !amount || !reason) {
      return res.status(400).json({ message: "Order ID, amount and reason are required" });
    }

    const order = await Order.findOne({ _id: orderId, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.payment.status !== "paid") {
      return res.status(400).json({ message: "Order is not paid" });
    }

    if (order.status === "completed" || order.status === "returned") {
      return res.status(400).json({ message: "Cannot refund completed order" });
    }

    order.returnRequest = {
      status: "pending",
      reason,
      requestedAt: new Date(),
    };
    await order.save();

    return res.json({
      success: true,
      message: "Refund request submitted",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to request refund", error: error.message });
  }
});

router.post("/offline", authenticate, async (req, res) => {
  try {
    const { orderId, method, transactionRef, amount, note } = req.body;

    if (!orderId || !method || !transactionRef || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const order = await Order.findOne({ _id: orderId, client: req.user.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.payment.status === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    order.payment.pendingPayment = {
      method,
      transactionRef,
      amount: Number(amount),
      note: note || "",
      submittedAt: new Date(),
    };
    await order.save();

    return res.json({
      success: true,
      message: "Payment proof submitted. Awaiting admin verification.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to submit payment", error: error.message });
  }
});

module.exports = router;