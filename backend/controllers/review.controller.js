import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

// Add or update a review
export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    //  Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    //  Check if user has purchased and received the product
    const hasPurchased = await Order.findOne({
      user: userId,
      "products.product": productId,
      status: "Delivered",
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message:
          "You can only review products you’ve purchased and received (Delivered).",
      });
    }

    // Check if user has already reviewed
    const existingReviewIndex = product.reviews.findIndex(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReviewIndex >= 0) {
      // Update existing review
      product.reviews[existingReviewIndex].rating = rating;
      product.reviews[existingReviewIndex].comment = comment;
      product.reviews[existingReviewIndex].createdAt = Date.now();
    } else {
      // Add new review
      product.reviews.push({
        user: userId,
        name: req.user.name,
        rating,
        comment,
      });
    }

    //  Recalculate average rating and number of reviews
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.numReviews;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
      product,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Check if user can review a product
export const canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const hasPurchased = await Order.findOne({
      user: userId,
      "products.product": productId,
      status: { $regex: /^Delivered$/i },
    });

    res.json({ canReview: !!hasPurchased });
  } catch (error) {
    console.error("Review eligibility check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate(
      "reviews.user",
      "name email"
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ reviews: product.reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { productId, userId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Remove review by user
    product.reviews = product.reviews.filter(
      (r) => r.user.toString() !== userId
    );
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.numReviews > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.numReviews
        : 0;

    await product.save();
    res.status(200).json({ success: true, message: "Review deleted", product });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
