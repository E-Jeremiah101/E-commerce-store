import mongoose from "mongoose";

const savedProductSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate saves
savedProductSchema.index({ user: 1, product: 1 }, { unique: true });

const SavedProduct = mongoose.model("SavedProduct", savedProductSchema);

export default SavedProduct;
