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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">My Orders</h1>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 border-3 rounded-4xl mb-6 disabled:opacity-50 hover:bg-emerald-700 transition"
        >
          {refreshing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Refreshing...</span>
            </>
          ) : (
            <span>Refresh</span>
          )}
        </button>
        {orders.length === 0 ? (
          <p className="text-gray-500">You have no orders yet.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isExpanded = expandedOrders[order._id];
              return (
                <div
                  key={order._id}
                  className="border rounded-lg bg-gray-50 shadow-sm"
                >
                  {/* Order Header */}
                  <div
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => toggleExpand(order._id)}
                  >
                    <div>
                      <p className="font-semibold text-emerald-500">
                        Order #{order.orderNumber}
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
                      <span className="font-bold text-gray-800">
                        Total: ₦
                        {order.totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                      <button className="text-gray-500">
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
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1 ml-4">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-gray-800">
                                {item.product.name}
                              </p>
                              <p className="text-emerald-400 font-semibold">
                                ₦{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-700">
                              {item.size && (
                                <span className="bg-gray-200 px-2 py-1 rounded font-semibold">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="bg-gray-200 px-2 py-1 rounded font-semibold">
                                  Color: {item.color}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between text-sm mt-2 text-gray-700">
                              <span>Qty: {item.quantity}</span>
                              <span>₦{item.price.toLocaleString()} each</span>
                            </div>
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

