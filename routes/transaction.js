const router = require("express").Router();
const Transaction = require("../models/Transaction");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  try {
    const query = {};
    const { orderId, type, status } = req.query;

    if (req.user.role !== "admin") {
      query.client = req.user.id;
    }

    if (orderId) {
      query.order = orderId;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .populate("client", "name email")
      .populate("order", "orderNumber title status")
      .sort({ createdAt: -1 });

    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch transactions", error: error.message });
  }
});

router.get("/summary", authenticate, async (req, res) => {
  try {
    const match = req.user.role === "admin" ? {} : { client: req.user.id };
    const [paidAgg, refundedAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...match, type: "payment", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { ...match, type: "refund", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalPaid = paidAgg[0]?.total || 0;
    const totalRefunded = refundedAgg[0]?.total || 0;

    return res.json({
      totalPaid,
      totalRefunded,
      netPaid: totalPaid - totalRefunded,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch transaction summary", error: error.message });
  }
});

module.exports = router;
