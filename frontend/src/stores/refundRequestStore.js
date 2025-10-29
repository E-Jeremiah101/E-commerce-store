import axios from "../lib/axios";
//  User: Request refund
export const requestRefund = (orderId, data) =>
  axios.post(`/refunds/${orderId}/request`, data);

//  Admin: Get all refund requests
export const getAllRefundRequests = () => axios.get(`/refunds`);

//  Admin: Approve refund
export const approveRefund = (orderId, refundId) =>
  axios.put(`/refunds/${orderId}/${refundId}/approve`);

// Admin: Reject refund
export const rejectRefund = (orderId, refundId) =>
  axios.put(`/refunds/${orderId}/${refundId}/reject`);