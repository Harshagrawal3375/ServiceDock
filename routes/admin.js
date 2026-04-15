const router = require("express").Router();
const User = require("../models/User");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const { authenticate, authorize } = require("../middleware/auth");

const buildClientOverview = async () => {
  const [clients, orderStats] = await Promise.all([
    User.find({ role: "client" }).select("_id name email phone createdAt").sort({ createdAt: -1 }),
    Order.aggregate([
      {
        $group: {
          _id: "$client",
          totalOrders: { $sum: 1 },
          totalQuoted: { $sum: "$pricing.finalPrice" },
          totalPaid: { $sum: "$payment.amountPaid" },
          totalRefunded: { $sum: "$payment.amountRefunded" },
        },
      },
    ]),
  ]);

  const statsByClientId = new Map(orderStats.map((item) => [item._id?.toString(), item]));

  return clients.map((client) => {
    const stats = statsByClientId.get(client._id.toString());
    return {
      id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      joinedAt: client.createdAt,
      totalOrders: stats?.totalOrders || 0,
      totalQuoted: stats?.totalQuoted || 0,
      totalPaid: stats?.totalPaid || 0,
      totalRefunded: stats?.totalRefunded || 0,
    };
  });
};

router.get("/dashboard", authenticate, authorize("admin"), async (req, res) => {
  try {
    const [
      totalClients,
      totalOrders,
      activeOrders,
      pendingReturns,
      completedOrders,
      paymentSummary,
      refundSummary,
      recentOrders,
      returnRequests,
      clientOverview,
    ] = await Promise.all([
      User.countDocuments({ role: "client" }),
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ["pending", "accepted", "in-progress"] } }),
      Order.countDocuments({ "returnRequest.status": "pending" }),
      Order.countDocuments({ status: "completed" }),
      Transaction.aggregate([
        { $match: { type: "payment", status: "success" } },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "refund", status: "success" } },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]),
      Order.find()
        .populate("client", "name email")
        .sort({ createdAt: -1 })
        .limit(8),
      Order.find({ "returnRequest.status": "pending" })
        .populate("client", "name email")
        .sort({ "returnRequest.requestedAt": -1 })
        .limit(8),
      buildClientOverview(),
    ]);

    const totalRevenue = paymentSummary[0]?.amount || 0;
    const totalRefunds = refundSummary[0]?.amount || 0;

    return res.json({
      metrics: {
        totalClients,
        totalOrders,
        activeOrders,
        completedOrders,
        pendingReturns,
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
      },
      recentOrders,
      returnRequests,
      clients: clientOverview,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load admin dashboard", error: error.message });
  }
});

router.get("/clients", authenticate, authorize("admin"), async (req, res) => {
  try {
    const clients = await buildClientOverview();
    return res.json(clients);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch clients", error: error.message });
  }
});

router.get("/orders", authenticate, authorize("admin"), async (req, res) => {
  try {
    const query = {};
    const { status, returnStatus, clientId } = req.query;

    if (status) {
      query.status = status;
    }

    if (returnStatus) {
      query["returnRequest.status"] = returnStatus;
    }

    if (clientId) {
      query.client = clientId;
    }

    const orders = await Order.find(query)
      .populate("client", "name email")
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch admin orders", error: error.message });
  }
});

router.get("/pending-payments", authenticate, authorize("admin"), async (req, res) => {
  try {
    const orders = await Order.find({
      "payment.pendingPayment": { $exists: true, $ne: null },
    })
      .populate("client", "name email phone")
      .sort({ "payment.pendingPayment.submittedAt": -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch pending payments", error: error.message });
  }
});

router.post("/verify-payment", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { orderId, action, amount } = req.body;

    if (!orderId || !action) {
      return res.status(400).json({ message: "Order ID and action are required" });
    }

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.payment.pendingPayment) {
      return res.status(400).json({ message: "No pending payment found" });
    }

    const pending = order.payment.pendingPayment;
    const verifyAmount = amount || pending.amount;

    if (action === "approve") {
      const transaction = new Transaction({
        order: order._id,
        client: order.client,
        type: "payment",
        method: pending.method,
        status: "success",
        amount: verifyAmount,
        gatewayReference: pending.transactionRef,
        notes: `Offline payment verified - ${pending.method}`,
      });
      await transaction.save();

      order.payment.status = "paid";
      order.payment.amountPaid = verifyAmount;
      order.payment.lastPaidAt = new Date();
      order.payment.pendingPayment = undefined;
      if (verifyAmount >= order.pricing.finalPrice) {
        order.status = "accepted";
      }
    } else if (action === "reject") {
      order.payment.pendingPayment = undefined;
    }

    await order.save();

    return res.json({
      success: true,
      message: action === "approve" ? "Payment verified successfully" : "Payment rejected",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to verify payment", error: error.message });
  }
});

router.delete("/orders", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await Order.deleteMany({});
    return res.json({ message: `${result.deletedCount} orders deleted` });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete orders", error: error.message });
  }
});

router.delete("/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await User.deleteMany({ role: "client" });
    return res.json({ message: `${result.deletedCount} client users deleted` });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete users", error: error.message });
  }
});

router.delete("/transactions", authenticate, authorize("admin"), async (req, res) => {
  try {
    const result = await Transaction.deleteMany({});
    return res.json({ message: `${result.deletedCount} transactions deleted` });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete transactions", error: error.message });
  }
});

module.exports = router;
