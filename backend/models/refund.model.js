import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
  // Link to order if it was created but refunded
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
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
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "NGN",
  },

  // Flutterwave refund details
  refundId: {
    type: String,
    
  },
  status: {
    type: String,
    enum: ["initiated", "processed", "failed", "pending"],
    default: "initiated",
  },

  // Refund context
  type: {
    type: String,
    enum: ["automatic", "manual", "partial", "full"],
    default: "automatic",
  },
  reason: {
    type: String,
    required: true,
  },

  // Customer info
  customerEmail: {
    type: String,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // System tracking
  orderAttempted: {
    type: Boolean,
    default: false,
  },
  errorDetails: {
    type: String,
  },

  // Flutterwave response data
  flutterwaveResponse: {
    type: mongoose.Schema.Types.Mixed,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
refundSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for common queries
refundSchema.index({ transactionId: 1 });
refundSchema.index({ tx_ref: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ createdAt: -1 });

const Refund = mongoose.model("Refund", refundSchema);

export default Refund;
