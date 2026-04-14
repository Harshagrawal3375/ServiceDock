const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    index: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["payment", "refund"],
    required: true,
  },
  method: {
    type: String,
    enum: ["upi", "card", "netbanking", "wallet", "bank-transfer", "cash", "other"],
    default: "upi",
  },
  status: {
    type: String,
    enum: ["initiated", "success", "failed"],
    default: "success",
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "INR",
  },
  gatewayReference: {
    type: String,
    trim: true,
    default: "",
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

transactionSchema.pre("save", function setTransactionId(next) {
  if (!this.transactionId) {
    const suffix = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
    this.transactionId = `TXN-${new Date().getFullYear()}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
