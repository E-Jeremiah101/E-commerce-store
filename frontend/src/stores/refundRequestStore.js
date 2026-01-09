import axios from "../lib/axios";

export const requestRefund = (orderId, data) =>
  axios.post(`/refunds/${orderId}/request`, data);

export const getAllRefundRequests = () => axios.get(`/refunds`);

export const approveRefund = (orderId, refundId) =>
  axios.put(`/refunds/${orderId}/${refundId}/approve`);

export const rejectRefund = (orderId, refundId) =>
  axios.put(`/refunds/${orderId}/${refundId}/reject`);