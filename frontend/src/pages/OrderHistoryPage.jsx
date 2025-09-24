import { useEffect, useState } from "react";
import axios from "../lib/axios";

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
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        My Orders
      </h1>

      <button
        onClick={() => fetchOrders(true)}
        disabled={refreshing}
        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded mb-6 disabled:opacity-50 hover:bg-emerald-700 transition"
      >
        {refreshing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Refreshing...</span>
          </>
        ) : (
          <span>Refresh Orders</span>
        )}
      </button>

      {orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrders[order._id];
            return (
              <div
                key={order._id}
                className="border rounded-lg bg-gray-50 dark:bg-gray-800 shadow-sm"
              >
                {/* Order Header */}
                <div
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => toggleExpand(order._id)}
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
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
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      Total: ₦
                      {order.totalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}
                    </span>
                    <button className="text-gray-500 dark:text-gray-300">
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {/* Collapsible Products */}
                {isExpanded && (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                    {order.products.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-700"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 ml-4">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {item.product.name}
                          </p>
                          {item.selectedSize && (
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              Size: {item.selectedSize}
                            </p>
                          )}
                          {item.selectedColor && (
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              Color: {item.selectedColor}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            Price: ₦
                            {item.price.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
