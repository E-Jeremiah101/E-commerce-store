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
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Refunded",
        "Partially Refunded",
        "Fully Refunded",
        "Cancelled",
      ],
      default: "Pending",
    },
    isProcessed: { type: Boolean, default: false },
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
    paymentMethod: {
      method: {
        type: String,
        enum: [
          "card",
          "bank_transfer",
          "ussd",
          "mobile_money",
          "qr",
          "barter",
          "account",
          "flutterwave",
        ],
        required: true,
      },
      status: { type: String },
      card: {
        brand: { type: String },
        last4: { type: String },
        exp_month: { type: String },
        exp_year: { type: String },
        type: { type: String },
        issuer: { type: String },
      },
    },

    subtotal: { type: Number, required: false, default: 0 },
    discount: { type: Number, required: false, default: 0 },
    coupon: {
      code: String,
      discount: Number,
    },
    couponCode: { type: String, default: null },

    flutterwaveRef: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    flutterwaveTransactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    totalRefunded: { type: Number, default: 0 },
    refunds: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // refunded product
        quantity: Number, // how many were refunded
        amount: Number, // total refunded for this item
        reason: String, // user reason for refund
        status: {
          type: String,
          enum: ["Pending", "Processing", "Approved", "Rejected"],
          default: "Pending",
        },
        requestedAt: { type: Date, default: Date.now },
        processedAt: Date,
        productSnapshot: {
          name: String,
          image: String,
          price: Number,
        },
      },
    ],

    refundStatus: {
      type: String,
      enum: [
        "No Refund",
        "Partial Refund Requested",
        "Partially Refunded",
        "Full Refund Requested",
        "Refunded",
        "Fully Refunded",
      ],
      default: "No Refund",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
