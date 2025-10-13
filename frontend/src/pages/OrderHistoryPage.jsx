import { useEffect, useState } from "react"; 
import axios from "../lib/axios"; 
import { motion } from "framer-motion";
import {RefreshCw} from "lucide-react"
import GoBackButton from "../components/GoBackButton";
import { div } from "framer-motion/client";

const OrderHistoryPage = () => { 
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true); 
    const [refreshing, setRefreshing] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState({});
  
    const fetchOrders = async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
  
        const { data } = await axios.get("/orders/my-orders", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOrders(data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        if (isRefresh) setRefreshing(false);
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchOrders();
    }, []);
  
    const toggleExpand = (orderId) => {
      setExpandedOrders((prev) => ({
        ...prev,
        [orderId]: !prev[orderId],
      }));
    };
  
    if (loading)
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      );
  
    return (
      <>
      <motion.div
                className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0  flex items-center justify-center bg-white  z-40 py-5"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="absolute left-4 text-black">
                  <GoBackButton  />
                </div>
               
              </motion.div>
        
        <div className="flex flex-col py-12 sm:px-6 lg:px-8">
          <motion.div
            className=" flex justify-center text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <button
              className="bg-black  px-4 py-2 gap-2 rounded-2xl mb-6 disabled:opacity-50 hover:bg-gray-800 transition "
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <div className=" border-2 border-white border-t-transparent rounded-full animate-spin tracking-widest"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <div className="flex justify-center gap-2 tracking-widest">
                  <RefreshCw />
                  <span>Refresh</span>
                </div>
              )}
            </button>
          </motion.div>

          <motion.div
            className=" mt-8 sm:mx-auto sm:w-full sm:max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {orders.length === 0 ? (
              <div className="text-gray-500 tracking-widest items-center flex justify-center">
                <p >You have no orders yet.</p>
              </div>
              
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const isExpanded = expandedOrders[order._id];
                  return (
                    <div
                      key={order._id}
                      className=" rounded-lg bg-gray-50 shadow-2xl"
                    >
                      {/* Order Header */}
                      <div
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => toggleExpand(order._id)}
                      >
                        <div>
                          <p className="font-semibold text-emerald-800 ">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          {order.status === "Delivered" && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Delivered on{" "}
                              {new Date(order.deliveredAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-600 text-white"
                                : order.status === "Cancelled"
                                ? "bg-red-600 text-white"
                                : "bg-yellow-500 text-white"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="font-bold text-yellow-800 tracking-wide">
                            Total: ₦
                            {order.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                            })}
                          </span>
                          <button className="text-gray-700">
                            {isExpanded ? "▲" : "▼"}
                          </button>
                        </div>
                      </div>
                      {/* Collapsible Products */}
                      {isExpanded && (
                        <ul className="divide-y divide-gray-200">
                          {order.products.map((item) => (
                            <li
                              key={item._id}
                              className="flex items-center justify-between p-4 bg-gray-100 rounded-lg mb-2"
                            >
                              <img
                                src={
                                  item.image ||
                                  item.product?.image ||
                                  "/placeholder.png"
                                }
                                alt={
                                  item.name || item.product?.name || "Product"
                                }
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1 ml-4">
                                <div className="flex justify-between items-center">
                                  <p className="font-semibold text-gray-800 tracking-widest">
                                    {item.name ||
                                      item.product?.name ||
                                      "Unknown Product"}
                                  </p>
                                  <p className="text-yellow-800 font-semibold tracking-widest">
                                    ₦
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-700">
                                  {item.size && (
                                    <span className="bg-gray-200 px-2 py-1 rounded font-semibold tracking-widest">
                                      Size: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="bg-gray-200 px-2 py-1 rounded font-semibold tracking-widest">
                                      Color: {item.color}
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between text-sm mt-2 text-gray-700">
                                  <span>Qty: {item.quantity}</span>
                                  {item.quantity > 1 && (
                                    <span>
                                      ₦{item.price.toLocaleString()} each
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className=" rounded-lg p-2 font-bold">
                        <p className="text-sm">
                          Subtotal: ₦{order.subtotal.toLocaleString()}
                        </p>
                        {order.discount > 0 && (
                          <><p>
                              Coupon Applied:{" "}
                              <span className="text-red-500">-10%</span>{" "}
                              <span className="text-green-500">
                                {order.coupon.code}
                              </span>
                            </p>{" "}
                            <p className="text-sm">
                              Discount: -₦
                              {order.discount.toLocaleString()}
                            </p>
                            
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </>
    );
  };
  export default OrderHistoryPage;

