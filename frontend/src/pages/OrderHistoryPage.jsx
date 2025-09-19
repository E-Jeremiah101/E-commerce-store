import { useEffect, useState } from "react";
import axios from "../lib/axios";

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

 const fetchOrders = async () => {
      try {
        const { data } = await axios.get("/orders/my-orders", {headers:{Authorization: `Bearer ${localStorage.getItem("token")}`}});
        setOrders(data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
   

    fetchOrders();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <button
        onClick={fetchOrders}
        className="bg-emerald-600 text-white px-4 py-2 rounded mb-4"
      >
        Refresh Orders
      </button>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-4 bg-gray-800 text-gray-100"
            >
              <div className="flex justify-between mb-2">
                <span>Order #{order.orderNumber}</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    order.status === "Delivered"
                      ? "bg-green-600"
                      : order.status === "Cancelled"
                      ? "bg-red-600"
                      : "bg-yellow-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>

              <ul className="space-y-2">
                {order.products.map((item) => (
                  <li key={item._id} className="flex justify-between">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <span>{item.product?.name}</span>
                    <span>
                      <span className="mt-4 font-bold">{item.quantity}</span>x
                      {"   "}
                      <span className="mt-4 font-bold">
                        {" "}
                        #
                        {item.price.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                        })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 font-bold">
                Total: #
                {order.totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;

