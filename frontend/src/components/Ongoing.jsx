import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../lib/axios.js";
import { requestRefund } from "../stores/refundRequestStore.js";
import GoBackButton from "./GoBackButton.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Ongoing = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()

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

 


  if (loading)
    return (
      <div className="flex justify-center items-center h-screen ">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  return (
    <>
      <motion.div
        className=" fixed top-0 left-0 right-0 flex z-40 items-center justify-center bg-gradient-to-br from-white via-gray-100 to-gray-300 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <h2 className="text-2xl font-semibold  text-center">My Orders</h2>
      </motion.div>

      <motion.div
        className=" max-w-4xl mx-auto mt-7 no-scroll"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ToastContainer position="top-center" autoClose={3000} />

        {orders.filter(
          (order) =>
            order.status === "Pending" ||
            order.status === "Processing" ||
            order.status === "Shipped"
        ).length === 0 ? (
          <p className="text-center text-gray-500">No ongoing orders.</p>
        ) : (
          orders
            .filter(
              (order) =>
                order.status === "Pending" ||
                order.status === "Processing" ||
                order.status === "Shipped"
            )

            .map((order) => (
              <div
                key={order._id}
                className="border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm"
              >
                <span
                  onClick={() => navigate(`/vieworders/${order._id}`)}
                  className="cursor-pointer"
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

                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="text-gray-900 text-sm">
                              {item.name}
                            </h3>
                            <p className="text-gray-800 font-semibold ">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-900">
                            {item.size && (
                              <span className="bg-gray-200 px-2 py-1 rounded tracking-widest">
                              Size: {item.size || "N/A"}
                            </span>
                            )}
                            
                            {item.color && (
                              <span className="bg-gray-200  rounded tracking-widest">
                              Color: {item.color || "N/A"}
                            </span>
                            )}
                            
                          </div>

                          <div className="flex  justify-between text-sm text-gray-900">
                            <span className="bg-gray-200 px-2 py-1 rounded text-xs ">
                              Qty: {item.quantity}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-gray-700 text-xs">
                                ₦{item.price.toLocaleString()}
                              </span>
                            )}                       
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </span>
              </div>
            ))
        )}
      </motion.div>
    </>
  );
};

export default Ongoing;
