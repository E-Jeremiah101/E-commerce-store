import axiosInstance from "../lib/axios";

export const getProductReviews = async (productId) => {
  const { data } = await axiosInstance.get(`/reviews/${productId}`);
  return data;
};

export const addReview = async (productId, rating, comment) => {
  const { data } = await axiosInstance.post(`/reviews`, {
    productId,
    rating,
    comment,
  });
  return data;
};

export const deleteReview = async (productId, userId) => {
  const { data } = await axiosInstance.delete(
    `/reviews/${productId}/${userId}`
  );
  return data;
};

export const canReviewProduct = async (productId) => {
  const { data } = await axiosInstance.get(`/reviews/${productId}/can-review`);
  return data;
};
