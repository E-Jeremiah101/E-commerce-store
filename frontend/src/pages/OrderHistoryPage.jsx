// import { useEffect, useState } from "react"; 
// import axios from "../lib/axios"; 
// import { motion } from "framer-motion";
// import {RefreshCw} from "lucide-react"
// import GoBackButton from "../components/GoBackButton";
// import { div } from "framer-motion/client";

// const OrderHistoryPage = () => { 
//   const [orders, setOrders] = useState([]); 
//   const [loading, setLoading] = useState(true); 
//     const [refreshing, setRefreshing] = useState(false);
//     const [expandedOrders, setExpandedOrders] = useState({});
  
//     const fetchOrders = async (isRefresh = false) => {
//       try {
//         if (isRefresh) setRefreshing(true);
//         else setLoading(true);
  
//         const { data } = await axios.get("/orders/my-orders", {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setOrders(data.orders);
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//       } finally {
//         if (isRefresh) setRefreshing(false);
//         setLoading(false);
//       }
//     };
  
//     useEffect(() => {
//       fetchOrders();
//     }, []);
  
//     const toggleExpand = (orderId) => {
//       setExpandedOrders((prev) => ({
//         ...prev,
//         [orderId]: !prev[orderId],
//       }));
//     };
  
//     if (loading)
//       return (
//         <div className="flex justify-center items-center h-screen ">
//           <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
//         </div>
//       );
  
//     return (
//       <>
//         <motion.div
//           className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0  flex items-center justify-center  bg-gradient-to-br from-white via-gray-100 to-gray-300 z-40 py-5"
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           <div className="absolute left-4 text-black">
//             <GoBackButton />
//           </div>
//         </motion.div>

//         <div className="flex flex-col py-12 sm:px-6 lg:px-8">
//           <motion.div
//             className=" flex justify-center text-white"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8 }}
//           >
//             <button
//               className="bg-black  px-4 py-2 gap-2 rounded-2xl mb-6 disabled:opacity-50 hover:bg-gray-800 transition "
//               onClick={() => fetchOrders(true)}
//               disabled={refreshing}
//             >
//               {refreshing ? (
//                 <>
//                   <div className=" border-2 border-white border-t-transparent rounded-full animate-spin tracking-widest"></div>
//                   <span>Refreshing...</span>
//                 </>
//               ) : (
//                 <div className="flex justify-center gap-2 tracking-widest">
//                   <RefreshCw />
//                   <span>Refresh</span>
//                 </div>
//               )}
//             </button>
//           </motion.div>

//           <motion.div
//             className=" mt-8 sm:mx-auto sm:w-full sm:max-w-md"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.2 }}
//           >
//             {orders.length === 0 ? (
//               <div className="text-gray-500 tracking-widest items-center flex justify-center">
//                 <p>You have no orders yet.</p>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {orders.map((order) => {
//                   const isExpanded = expandedOrders[order._id];
//                   return (
//                     <div
//                       key={order._id}
//                       className=" rounded-lg bg-gray-50 shadow-2xl"
//                     >
//                       {/* Order Header */}
//                       <div
//                         className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 transition"
//                         onClick={() => toggleExpand(order._id)}
//                       >
//                         <div>
//                           <p className="font-semibold text-emerald-800 ">
//                             {order.orderNumber}
//                           </p>
//                           <p className="text-sm text-gray-500">
//                             Placed on{" "}
//                             {new Date(order.createdAt).toLocaleDateString()}
//                           </p>
//                           {order.status === "Delivered" && (
//                             <p className="text-sm text-gray-500 dark:text-gray-400">
//                               Delivered on{" "}
//                               {new Date(order.deliveredAt).toLocaleDateString()}
//                             </p>
//                           )}
//                         </div>
//                         <div className="flex items-center gap-4">
//                           <span
//                             className={`px-2 py-1 rounded text-sm font-medium ${
//                               order.status === "Delivered"
//                                 ? "bg-green-600 text-white"
//                                 : order.status === "Cancelled"
//                                 ? "bg-red-600 text-white"
//                                 : "bg-yellow-500 text-white"
//                             }`}
//                           >
//                             {order.status}
//                           </span>
//                           <span className="font-bold text-yellow-800 tracking-wide">
//                             Total: ₦
//                             {order.totalAmount.toLocaleString(undefined, {
//                               minimumFractionDigits: 0,
//                             })}
//                           </span>
//                           <button className="text-gray-700">
//                             {isExpanded ? "▲" : "▼"}
//                           </button>
//                         </div>
//                       </div>
//                       {/* Collapsible Products */}
//                       {isExpanded && (
//                         <ul className="divide-y divide-gray-200">
//                           {order.products.map((item) => (
//                             <li
//                               key={item._id}
//                               className="flex items-center justify-between p-4 bg-gray-100 rounded-lg mb-2"
//                             >
//                               <img
//                                 src={
//                                   item.image ||
//                                   item.product?.image ||
//                                   "/placeholder.png"
//                                 }
//                                 alt={
//                                   item.name || item.product?.name || "Product"
//                                 }
//                                 className="w-20 h-20 object-cover rounded"
//                               />
//                               <div className="flex-1 ml-4">
//                                 <div className="flex justify-between items-center">
//                                   <p className="font-semibold text-gray-800 tracking-widest">
//                                     {item.name ||
//                                       item.product?.name ||
//                                       "Unknown Product"}
//                                   </p>
//                                   <p className="text-yellow-800 font-semibold tracking-widest">
//                                     ₦
//                                     {(
//                                       item.price * item.quantity
//                                     ).toLocaleString()}
//                                   </p>
//                                 </div>
//                                 <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-700">
//                                   {item.size && (
//                                     <span className="bg-gray-200 px-2 py-1 rounded font-semibold tracking-widest">
//                                       Size: {item.size}
//                                     </span>
//                                   )}
//                                   {item.color && (
//                                     <span className="bg-gray-200 px-2 py-1 rounded font-semibold tracking-widest">
//                                       Color: {item.color}
//                                     </span>
//                                   )}
//                                 </div>
//                                 <div className="flex justify-between text-sm mt-2 text-gray-700">
//                                   <span>Qty: {item.quantity}</span>
//                                   {item.quantity > 1 && (
//                                     <span>
//                                       ₦{item.price.toLocaleString()} each
//                                     </span>
//                                   )}
//                                 </div>
//                               </div>
//                             </li>
//                           ))}
//                         </ul>
//                       )}

//                       <div className=" p-4 rounded-lg text-gray-600">
                        // <p className="text-sm">
                        //   Subtotal: ₦{order.subtotal.toLocaleString()}
                        // </p>
                        // {order.discount > 0 && (
                        //   <>
                        //     <p>
                        //       Coupon Applied:{" "}
                        //       <span className="text-red-500">-10%</span>{" "}
                        //       <span className="text-green-500">
                        //         {order.coupon.code}
                        //       </span>
                        //     </p>{" "}
                        //     <p className="text-sm">
                        //       Discount: -₦
                        //       {order.discount.toLocaleString()}
                        //     </p>
                        //   </>
                        // )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </motion.div>
//         </div>
//       </>
//     );
//   };
//   export default OrderHistoryPage;











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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get("/orders/my-orders");
        setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch orders");
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
        className="p-6 max-w-4xl mx-auto mt-5"
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
                  {order.status}
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
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 bg-opacity-700 z-50">
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
                  className="w-full border rounded-lg p-2 mb-3"
                >
                  <option value="" className="text-sm ">
                   
                  </option>
                  {selectedOrder.products.map((p) => (
                    <option key={p.product._id} value={p.product._id}>
                      {p.product.name}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    selectedOrder.products.find(
                      (p) => p.product._id === refundData.productId
                    )?.quantity || 1
                  }
                  value={refundData.quantity}
                  onChange={(e) =>
                    setRefundData({ ...refundData, quantity: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 mb-3"
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
                  className="w-full border rounded-lg p-2 mb-3"
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
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default OrderHistoryPage;
