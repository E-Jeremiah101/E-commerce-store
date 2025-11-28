import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    firstname: { type: String, required: true }, // store author name for convenience
    lastname: { type: String, required: true }, // store author name for convenience
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

const productVariantSchema = new mongoose.Schema({
  size: { type: String, default: "" },
  color: { type: String, default: "" },
  countInStock: { type: Number, required: true, default: 0, min: 0 },
  reserved: { type: Number, default: 0 }, // For variants - ADDED THIS
  sku: { type: String, unique: true, sparse: true },
  price: { type: Number, min: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    // REMOVED DUPLICATE countInStock FIELD
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
    }, 

    variants: [productVariantSchema],

    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    images: [
      {
        type: String,
        required: true,
        validate: [(val) => val.length > 0, "Must have at least one image"],
      },
    ],
    sizes: [{ type: String }],
    colors: [{ type: String }],
    category: {
      type: String,
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

//  index for better performance on variant searches
productSchema.index({ "variants.size": 1, "variants.color": 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
