import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../lib/axios.js";
import GoBackButton from "./GoBackButton.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
const CanceledTab = () => {
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

  
    const { settings } = useStoreSettings();


  if (loading)
    return (
      <div className="flex justify-center items-center h-screen ">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  return (
    <>
      <motion.div
        className=" max-w-4xl mx-auto mt-7 no-scroll"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <ToastContainer position="top-center" autoClose={3000} />

        {orders.filter((order) => order.status === "Cancelled").length === 0 ? (
          <p className="text-center text-gray-500">No Canceled orders</p>
        ) : (
          orders
            .filter((order) => order.status === "Cancelled")
            .map((order) => (
              <div
                key={order._id}
                className="border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold"> {order.orderNumber}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      order.status === "Cancelled"
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

                <ul className="space-y-4 mb-4">
                  {order.products.map((item) => (
                    <span
                      key={item._id}
                      onClick={() => navigate(`/vieworders/${order._id}`)}
                      className="cursor-pointer"
                    >
                      <li
                        key={item._id}
                        className="flex gap-4 p-4 bg-gray-100 rounded-lg shadow"
                      >
                        {" "}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-gray-900 text-sm">
                              {item.name}
                            </h3>
                            <p className="text-gray-800 font-semibold ">
                              {formatPrice(
                                item.price * item.quantity,
                                settings?.currency
                              )}
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
                          </div>
                        </div>
                      </li>
                    </span>
                  ))}
                </ul>
              </div>
            ))
        )}
      </motion.div>
    </>
  );
};

export default CanceledTab;
