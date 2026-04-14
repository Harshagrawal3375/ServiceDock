const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  serviceType: {
    type: String,
    enum: ["assignment", "task", "ppt", "project", "resume", "other"],
    required: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  instructions: {
    type: String,
    trim: true,
    default: "",
  },
  files: [{
    type: String,
    trim: true,
  }],
  urgency: {
    type: String,
    enum: ["normal", "urgent", "express"],
    default: "normal",
  },
  deadline: Date,
  status: {
    type: String,
    enum: ["pending", "accepted", "in-progress", "completed", "returned", "refunded", "cancelled"],
    default: "pending",
    index: true,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  pricing: {
    quotedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
  },
  payment: {
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    lastPaidAt: Date,
  },
  delivery: {
    note: {
      type: String,
      trim: true,
      default: "",
    },
    files: [{
      type: String,
      trim: true,
    }],
    deliveredAt: Date,
  },
  returnRequest: {
    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    requestedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    adminComment: {
      type: String,
      trim: true,
      default: "",
    },
    contentReturned: {
      type: Boolean,
      default: false,
    },
    moneyReturned: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
}, { timestamps: true });

orderSchema.pre("validate", function setDerivedPrice(next) {
  if (this.pricing && (this.pricing.finalPrice === undefined || this.pricing.finalPrice === null)) {
    this.pricing.finalPrice = this.pricing.quotedPrice;
  }
  next();
});

orderSchema.pre("save", function setOrderNumber(next) {
  if (!this.orderNumber) {
    const suffix = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
    this.orderNumber = `ORD-${new Date().getFullYear()}-${suffix}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
