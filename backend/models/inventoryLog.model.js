import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      default: null,
    },
    adjustmentType: {
      type: String,
      enum: ["add", "remove", "set", "return", "damage", "transfer"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    oldStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: [
        "sale",
        "return",
        "damage",
        "restock",
        "adjustment",
        "transfer_in",
        "transfer_out",
        "initial",
        "other",
      ],
      required: true,
    },
    notes: {
      type: String,
      maxLength: 500,
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referenceId: {
      type: String, // Could be orderId, transferId, etc.
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
inventoryLogSchema.index({ productId: 1, createdAt: -1 });
inventoryLogSchema.index({ adjustedBy: 1 });
inventoryLogSchema.index({ createdAt: -1 });
inventoryLogSchema.index({ reason: 1 });

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

export default InventoryLog;
