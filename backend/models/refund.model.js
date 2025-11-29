// models/refund.model.js - UPDATED
import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
  // Order reference
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },

  // Product reference (for partial refunds)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null,
  },

  // Flutterwave transaction details
  transactionId: {
    type: String,
    required: true,
  },
  tx_ref: {
    type: String,
    required: true,
  },
  flw_ref: {
    type: String, // Flutterwave transaction reference
    required: true,
  },

  // Refund amounts
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "NGN",
  },

  // Flutterwave refund details
  flutterwaveRefundId: {
    type: String, // Flutterwave's refund ID
    sparse: true,
  },
  refundReference: {
    type: String, // Your refund reference
  },

  // Status tracking
  status: {
    type: String,
    enum: ["pending", "approved", "processed", "failed", "rejected"],
    default: "pending",
  },

  // Refund context
  type: {
    type: String,
    enum: ["full", "partial"],
    default: "full",
  },
  reason: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },

  // Customer info
  customerEmail: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Flutterwave response data
  flutterwaveResponse: mongoose.Schema.Types.Mixed,
  webhookData: mongoose.Schema.Types.Mixed,

  // Error handling
  errorDetails: String,
  retryCount: {
    type: Number,
    default: 0,
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  approvedAt: Date,
  processedAt: Date,
  updatedAt: { type: Date, default: Date.now },
});

refundSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Generate refund reference if not exists
  if (!this.refundReference) {
    this.refundReference = `REF-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  next();
});

refundSchema.index({ transactionId: 1 });
refundSchema.index({ flw_ref: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ refundReference: 1 });
refundSchema.index({ createdAt: -1 });

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;
