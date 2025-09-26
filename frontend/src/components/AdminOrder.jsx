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
    <div className="flex justify-center items-center">
      <p className="text-gray-500">Loading orders</p>
    </div>
  );

  return (
    <div className="p-6">
      <div className="text-2xl font-bold flex justify-center mb-6">
        <h1>All Orders</h1>
      </div>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-4 bg-gray-800 text-gray-100"
            >
              <div className="flex justify-between mb-2">
                <span className="text-emerald-500">
                  Order #{order.orderNumber}
                </span>
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

              <p className="text-sm text-gray-400 mb-2">
                Customer Name: {order.user.name}
              </p>
              <p className="text-sm text-gray-400 mb-2">
                Customer Email: {order.user.email}
              </p>
              <p className="text-sm text-gray-400 mb-2">
                Customer Phone: {order.phone || "Not provided"}
              </p>
              <p className="text-sm text-gray-400 mb-2">
                Delivery Address: {order.deliveryAddress || "Not provided"}
              </p>

              <ul className="space-y-4 mb-4">
                {order.products.map((item) => (
                  <li
                    key={item._id}
                    className="flex gap-4 p-4 bg-gray-700 rounded-lg shadow"
                  >
                    {/* Product Image */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />

                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      {/* Product Name & Total Price */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-white font-medium">
                          {item.product.name}
                        </h3>
                        <p className="text-emerald-400 font-semibold">
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
                      <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                        <span className="bg-gray-600 px-2 py-1 rounded">
                          Size: {item.size || "N/A"}
                        </span>
                        <span className="bg-gray-600 px-2 py-1 rounded">
                          Color: {item.color || "N/A"}
                        </span>
                        <span className="bg-gray-600 px-2 py-1 rounded">
                          Category: {item.selectedCategory || "N/A"}
                        </span>
                      </div>

                      {/* Quantity & Unit Price */}
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Qty: {item.quantity}</span>
                        {item.quantity > 1 && (
                          <span className="italic">
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

              <p className="font-bold text-green-500 p-4 rounded">
                Total: ₦ {""}
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

export default AdminOrdersPage;

// import { useEffect, useState } from "react";
// import axios from "../lib/axios";
// import { motion } from "framer-motion";
// const AdminOrdersPage = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchOrders = async () => {
//     try {
//       setLoading(true);
//       const { data } = await axios.get("/admin/orders", {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       setOrders(data.orders);
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStatusChange = async (orderId, newStatus) => {
//     try {
//       await axios.put(
//         `/admin/orders/${orderId}/status`,
//         { status: newStatus },
//         {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         }
//       );
//       fetchOrders(); // refresh after update
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchOrders();
//   }, []);

//   if (loading) return <p>Loading orders...</p>;

//   return (
//     <div className="p-6">
//       <div className="text-2xl font-bold flex justify-center mb-6"><h1>All Orders</h1></div>

//       {orders.length === 0 ? (
//         <p>No orders yet.</p>
//       ) : (
//         <div className="space-y-6">
//           {orders.map((order) => (
//             <div
//               key={order._id}
//               className="border rounded-lg p-4 bg-gray-800 text-gray-100"
//             >
//               <div className="flex justify-between mb-2">
//                 <span className="text-emerald-500">
//                   Order #{order.orderNumber}
//                 </span>
//                 <span>
//                   <select
//                     value={order.status}
//                     onChange={(e) =>
//                       handleStatusChange(order._id, e.target.value)
//                     }
//                     className="bg-gray-700 text-white px-2 py-1 rounded"
//                   >
//                     <option className="text-yellow-600" value="Pending">
//                       Pending
//                     </option>
//                     <option className="text-yellow-600" value="Processing">
//                       Processing
//                     </option>
//                     <option className="text-yellow-600" value="Shipped">
//                       Shipped
//                     </option>
//                     <option className="text-green-600" value="Delivered">
//                       Delivered
//                     </option>
//                     <option className="text-red-600" value="Cancelled">
//                       Cancelled
//                     </option>
//                   </select>
//                 </span>
//               </div>

//               <p className="text-sm text-gray-400 mb-2">
//                 Customer Name: {order.user.name}
//               </p>
//               <p className="text-sm text-gray-400 mb-2">
//                 Customer Email: {order.user.email}
//               </p>
//               <p className="text-sm text-gray-400 mb-2">
//                 Customer Phone: {order.phone || "Not provided"}
//               </p>
//               <p className="text-sm text-gray-400 mb-2">
//                 Delivery Address: {order.deliveryAddress || "Not provided"}
//               </p>

//               <ul className="space-y-2 mb-2">
//                 {order.products.map((item) => (
//                   <li
//                     key={item._id}
//                     className="flex justify-between items-center"
//                   >
//                     <img
//                       src={item.product.image}
//                       alt={item.product.name}
//                       className="w-16 h-16 object-cover rounded mr-4"
//                     />
//                     <div className="flex-1">
//                       <h3>{item.product.name}</h3>
//                       <p>
//                         ₦{" "}
//                         {item.price.toLocaleString(undefined, {
//                           minimumFractionDigits: 0,
//                         })}{" "}
//                       </p>
//                       <p className="text-yellow-300">Qty ({item.quantity})</p>
//                     </div>
//                   </li>
//                 ))}
//               </ul>

//               <p className="font-bold text-green-500">
//                 Total: ₦ {""}
//                 {order.totalAmount.toLocaleString(undefined, {
//                   minimumFractionDigits: 0,
//                 })}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminOrdersPage;
