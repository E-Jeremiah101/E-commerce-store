import axiosInstance from "../lib/axios";

// Get all reviews for a product
export const getProductReviews = async (productId) => {
  const { data } = await axiosInstance.get(`/reviews/${productId}`);
  return data;
};

// Add or update a review
export const addReview = async (productId, rating, comment) => {
  const { data } = await axiosInstance.post(`/reviews`, {
    productId,
    rating,
    comment,
  });
  return data;
};

// Delete review
export const deleteReview = async (productId, userId) => {
  const { data } = await axiosInstance.delete(
    `/reviews/${productId}/${userId}`
  );
  return data;
};

// ✅ FIXED: Use axiosInstance + correct route order
export const canReviewProduct = async (productId) => {
  const { data } = await axiosInstance.get(`/reviews/${productId}/can-review`);
  return data;
};
