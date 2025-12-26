import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // unique: true,
    },
    couponReason: {
      type: String,
      enum: [
        "first_order",
        "high_value_order",
        "special_reward", // manual (best name)
        "loyalty_bonus", // manual
        "customer_support",
      ],
      required: true,
    },
    isReserved: { type: Boolean, default: false },
    reservedForOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    reservationId: { type: String, default: null },
    reservationExpiresAt: { type: Date, default: null },
    usedAt: {
      type: Date,
      default: null,
    },
    usedInOrder: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// couponSchema.index({ userId: 1, isActive: 1 });
// couponSchema.index({ code: 1 });
const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;