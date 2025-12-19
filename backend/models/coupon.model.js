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
      unique: true,
    },
     couponReason: {
      type: String,
      enum: ["first_order", "third_order_milestone", "every_five_orders", "high_value_order", "general"],
      default: "general"
    },
    usedAt: {
      type: Date,
      default: null
    },
    usedInOrder: {
      type: String,
      default: null
    },
    deactivatedAt: {
      type: Date,
      default: null
    },
    deactivationReason: {
      type: String,
      default: null
    } 
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;