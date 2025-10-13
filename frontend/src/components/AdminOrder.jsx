import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { motion } from "framer-motion";
const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/admin/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months start from 0
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };
  

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `/admin/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchOrders(); // refresh after update
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
    </div>
  );

  return (
    <motion.div
      className="px-4 lg:px-28 "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-2xl font-bold flex justify-center mb-6">
        <h1>All Orders</h1>
      </div>

      {orders.length === 0 ? (
        <p className="items-center flex justify-center mt-7 tracking-widest ">
          No orders yet.
        </p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-4 bg-gray-800 text-gray-100"
            >
              <div className="flex justify-between mb-2">
                <span className="text-yellow-600">{order.orderNumber}</span>
                <span>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order._id, e.target.value)
                    }
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                  >
                    <option className="text-yellow-600" value="Pending">
                      Pending
                    </option>
                    <option className="text-yellow-600" value="Processing">
                      Processing
                    </option>
                    <option className="text-yellow-600" value="Shipped">
                      Shipped
                    </option>
                    <option className="text-green-600" value="Delivered">
                      Delivered
                    </option>
                    <option className="text-red-600" value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                </span>
              </div>

              <div className="grid md:grid-cols-3 grid-cols-2 gap-3 md:gap-5 py-4 pr-7 pl-3 bg-gray-700 rounded-lg shadow overflow-x-scroll scrollbar-hide md:overflow-x-hidden mb-2 font-bold">
                <div className=" text-gray-200 mb-2">
                  Customer Name:
                  <p> {order.user.name}</p>
                </div>
                <div className=" text-gray-200 mb-2">
                  Customer Email:
                  <p> {order.user.email}</p>
                </div>
                <div className=" text-gray-200 mb-2">
                  Customer Phone:
                  <p>{order.phone || "Not provided"}</p>
                </div>
                <div className=" text-gray-200 mb-2">
                  Order date:
                  <p>
                    {" "}
                    {new Date(order.createdAt).toLocaleString() ||
                      "Not provided"}
                  </p>
                </div>
                <div className=" text-gray-200 mb-2">
                  Updated to{" "}
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
                  <p>
                    {new Date(order.updatedAt).toLocaleString() ||
                      "Not provided"}
                  </p>
                </div>
                {order.status === "Delivered" && (
                  <p className=" text-gray-200 mb-2">
                    Package delivered:{" "}
                    {new Date(order.deliveredAt).toLocaleString() ||
                      "Not provided"}
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-4">
                {order.products.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-4 p-4 bg-gray-700 rounded-lg shadow"
                  >
                    {/* Product Image */}
                    <img
                      src={item.image || item.product.image}
                      alt={item.name || item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />

                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      {/* Product Name & Total Price */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium tracking-widest">
                          {item.name || item.product.name}
                        </h3>
                        <p className="text-yellow-100 font-semibold tracking-widest">
                          ₦
                          {(item.price * item.quantity).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 0,
                            }
                          )}
                        </p>
                      </div>

                      {/* Extra Details (size, color, category) */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-200">
                        <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                          Size: {item.size || "N/A"}
                        </span>
                        <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                          Color: {item.color || "N/A"}
                        </span>
                        <span className="bg-gray-600 px-2 py-1 rounded tracking-widest">
                          Category: {item.selectedCategory || "N/A"}
                        </span>
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Qty: {item.quantity}</span>
                        {item.quantity > 1 && (
                          <span className="">
                            ₦
                            {item.price.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                            })}{" "}
                            each
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="bg-gray-700 rounded-lg p-2 text-sm font-bold">
                <p className="">Subtotal: ₦{order.subtotal.toLocaleString()}</p>
                {order.discount > 0 && (
                  <>
                    <p>
                      Coupon Applied: <span className="text-red-500">-10%</span>{" "}
                      <span className="text-green-500">
                        {order.coupon.code}
                      </span>
                    </p>{" "}
                    <p className="text-sm my-1 font-bold">
                      {" "}
                      Discount: -₦
                      {order.discount.toLocaleString()}{" "}
                    </p>
                  </>
                )}

                <p className="font-bold text-yellow-100 text-lg ">
                  Total: ₦ {""}
                  {order.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminOrdersPage;
