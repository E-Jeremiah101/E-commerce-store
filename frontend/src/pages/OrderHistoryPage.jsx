import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../lib/axios";
import { requestRefund } from "../stores/refundRequestStore.js";
import GoBackButton from "../components/GoBackButton";
import { motion } from "framer-motion";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundData, setRefundData] = useState({
    productId: "",
    quantity: 1,
    reason: "",
  });
  const getDeletedProductId = (p, orderId) => {
    const safeName = (p.name || p.product?.name || "")
      .trim()
      .replace(/\s+/g, "_");
    const price = p.price || p.product?.price || 0;
    return `deleted-${orderId}-${safeName}-${price}`;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get("/orders/my-orders");
        setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleRefundClick = (order) => {
    setSelectedOrder(order);
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!refundData.productId || !refundData.reason.trim()) {
        toast.error("Please select product and provide a reason");
        return;
      }

      await requestRefund(selectedOrder._id, refundData);
      toast.success("Refund request submitted successfully!");
      setShowRefundModal(false);
      setRefundData({ productId: "", quantity: 1, reason: "" });
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to submit refund request"
      );
    }
  };

      if (loading)
        return (
          <div className="flex justify-center items-center h-screen ">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          </div>
        );

  return (
    <>
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0 flex z-40 items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-300 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
      </motion.div>
      <motion.div
        className="p-6 max-w-4xl mx-auto mt-5 no-scroll"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ToastContainer position="top-center" autoClose={3000} />
        <h2 className="text-2xl font-semibold mb-6 text-center">My Orders</h2>

        {orders.length === 0 ? (
          <p className="text-center text-gray-500">You have no orders yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold"> {order.orderNumber}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : order.status === "Cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.displayStatus || order.status}
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>

              {order.status === "Delivered" && (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {order.status} on{" "}
                  {new Date(order.deliveredAt).toLocaleDateString()}
                </p>
              )}

              <ul className="space-y-4 mb-4">
                {order.products.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-4 p-4 bg-gray-100 rounded-lg shadow"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-gray-800 font-semibold ">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-900">
                        <span className="bg-gray-200 px-2 py-1 rounded tracking-widest">
                          Size: {item.size || "N/A"}
                        </span>
                        <span className="bg-gray-200 px-2 py-1 rounded tracking-widest">
                          Color: {item.color || "N/A"}
                        </span>
                        <span className="bg-gray-200  px-2 py-1 rounded tracking-widest">
                          Category: {item.selectedCategory || "N/A"}
                        </span>
                      </div>
                      <div className="flex  justify-between text-sm text-gray-900">
                        <span className="bg-gray-200 px-2 py-1 rounded text-xs ">
                          Qty: {item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-gray-700 text-xs">
                            ₦{item.price.toLocaleString()} each
                          </span>
                        )}
                        {item.refundStatus && (
                          <span
                            className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                              item.refundStatus === "Approved"
                                ? "bg-green-100 text-green-700"
                                : item.refundStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.refundStatus === "Approved"
                              ? "Refunded"
                              : item.refundStatus === "Pending"
                              ? "Refund Pending"
                              : "Refund Rejected"}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between align-middle">
                <div>
                  {order.discount > 0 && (
                    <>
                      <p className="text-xs text-gray-500 mb-1">
                        Subtotal: ₦{order.subtotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        Coupon Applied:{" "}
                        <span className="text-red-500 text-xs">-10%</span>{" "}
                        <span className="text-green-500 text-xs">
                          {order.coupon.code}
                        </span>
                      </p>{" "}
                      <p className="text-xs text-gray-500 mb-1">
                        Discount: -₦
                        {order.discount.toLocaleString()}
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-500 mb-2">
                    Total: ₦{order.totalAmount.toLocaleString()}
                  </p>
                </div>

                <div className="flex">
                  {order.status === "Delivered" && (
                    <button
                      onClick={() => handleRefundClick(order)}
                      className="hover:text-red-600 text-red-500 px-2 py-2 rounded-lg text-xs"
                    >
                      Request Refund?
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedOrder && (
          <div className="fixed inset-0 flex no-scroll items-center justify-center bg-black/90 bg-opacity-700 z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Request Refund </h3>
              <form onSubmit={handleRefundSubmit}>
                <label className="block text-sm font-medium mb-2">
                  Select Product
                </label>
                <select
                  value={refundData.productId}
                  onChange={(e) =>
                    setRefundData({ ...refundData, productId: e.target.value })
                  }
                  className="w-full border border-gray-500 focus:outline-none rounded-lg p-2 mb-3"
                >
                  <option value="" disabled>
                    Select product
                  </option>
                  {selectedOrder.products.map((p) => {
                    //  Generate the same ID format as backend
                    const productId =
                      p.product?._id ||
                      getDeletedProductId(p, selectedOrder._id);

                    const productName =
                      p.product?.name || p.name || "Deleted Product";

                    const productPrice = p.product?.price || p.price || 0;

                    return (
                      <option key={productId} value={productId}>
                        {`${productName} — ₦${productPrice.toLocaleString()}`}
                      </option>
                    );
                  })}
                </select>

                <label className="block text-sm font-medium mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    selectedOrder.products.find(
                      (p) => p.product?._id === refundData.productId
                    )?.quantity || 1
                  }
                  value={refundData.quantity}
                  onChange={(e) =>
                    setRefundData({ ...refundData, quantity: e.target.value })
                  }
                  className="w-full border border-gray-500 focus:outline-none rounded-lg p-2 mb-3"
                />

                <label className="block text-sm font-medium mb-2">
                  Reason for Refund
                </label>
                <textarea
                  rows="3"
                  value={refundData.reason}
                  onChange={(e) =>
                    setRefundData({ ...refundData, reason: e.target.value })
                  }
                  placeholder="Describe the issue..."
                  className="w-full resize-none border-1 rounded-lg p-2 mb-3 focus:outline-none   border-gray-500"
                ></textarea>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Submit
                  </button>
                </div>

                <div className="mt-4 max-h-54 overflow-y-auto border border-gray-200 p-3 rounded-md text-gray-700 whitespace-pre-wrap no-scroll">
                  <h1 className="text-lg font-bold mb-2">Refund Policy</h1>
                  <span>
                    At <span className="text-gray-900">Eco~Store</span>, we want
                    you to be completely satisfied with your purchase. If you
                    are not happy with your order, please review our refund
                    policy below:
                  </span>

                  <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                    <li>
                      Refund requests must be made within 48 hours of receiving
                      your order.
                    </li>
                    <li>
                      Items must be unworn, unwashed, and returned in their
                      original packaging with all tags attached.
                    </li>
                    <li>
                      Certain items such as custom-made, personalized, or sale
                      items may not be eligible for a refund.
                    </li>
                    <li>
                      Refunds will be processed to your original payment method
                      within 5–10 business days after approval.
                    </li>
                    <li>
                      For defective or damaged items, please provide a photo as
                      proof.
                    </li>
                  </ul>

                  <ol className="list-decimal list-inside mt-2 text-sm text-gray-700">
                    <li>
                      Submit a refund request through this form selecting the
                      product and quantity.
                    </li>
                    <li>
                      You will receive an email confirmation upon request.
                    </li>
                    <li>Wait for confirmation from our support team.</li>
                    <li>
                      Ship the product back if required, using the instructions
                      provided.
                    </li>
                    <li>
                      Receive your refund once the returned item is received and
                      approved.
                    </li>
                    <li>
                      Receive your refund once the returned item is received and
                      approved.
                    </li>
                  </ol>

                  <p className="text-sm text-gray-900 mt-2">
                    Note: Shipping fees are non-refundable unless the item is
                    incorrect.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default OrderHistoryPage;
