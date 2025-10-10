import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        selectedSize: { type: String },
        selectedColor: { type: String },
        selectedCategory: { type: String },
        name: { type: String, required: true },
        image: { type: String, required: true },
      },
    ],
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    deliveredAt: Date,
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: { type: Number, required: false, default: 0 },
    discount: { type: Number, required: false, default: 0 },
    coupon: {
      code: String,
      discount: Number,
    },
    couponCode: { type: String, default: null },
    stripeSessionId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
