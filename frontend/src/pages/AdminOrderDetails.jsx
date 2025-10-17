import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import GoBackButton from "../components/GoBackButton";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/admin/orders/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOrder(data.order);
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  if (!order)
    return (
      <div className="text-center mt-20 text-gray-400">Order not found.</div>
    );

  return (
    <motion.div
      className="px-4 lg:px-28 py-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="flex items-center   py-5 fixed top-0 left-0 right-0 z-40 shadow-sm px-6 bg-gradient-to-br from-white via-gray-100 to-gray-300"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="">
          <GoBackButton />
        </div>
        <span className="text-lg font-semibold tracking-wider text-gray-900">
          {order.orderNumber}
        </span>
      </motion.div>
      {/* Order Info */}
      <div className=" grid grid-cols-2 text-black gap-5 my-12 ">
        <div>
          <h1 className="text-gray-600">Order ID</h1>
          <p className="font-semibold">{order.orderNumber}</p>
        </div>

        <div>
          <h1 className="text-gray-600">Order Placed</h1>
          <p className="font-semibold">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div>
          <h1 className="text-gray-600">Order ID</h1>
          <p className="font-semibold">{order.orderNumber}</p>
        </div>

        <div>
          {order.deliveredAt && (
            <>
              <h1 className="text-gray-600">Order Delivered:</h1>{" "}
              <p className="font-semibold">
                {new Date(order.deliveredAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="t text-3xl border-t-1 font-bold my-5"></div>

      {/* Customer Info */}
      <div className=" text-black rounded-lg  mb-6">
        <h2 className="text-lg font-semibold mb-4  border-gray-600 pb-2">
          RECEIVER INFO
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex">
            <span className="text-gray-600">Name:</span>{" "}
            <span className="font-semibold ">{order.user?.name}</span>
          </div>
          <div className="flex ">
            <span className="text-gray-600">Email:</span>{" "}
            <span className="font-semibold"> {order.user?.email}</span>
          </div>
          <p className="flex ">
            <span className="text-gray-600">Phone:</span>{" "}
            <span className="font-semibold">
              {order.phone || "Not provided"}
            </span>
          </p>
          <div className="flex">
            <span className="text-gray-600">Address:</span>{" "}
            <span className="font-semibold">
              {" "}
              {order.deliveryAddress || "Not provided"}
            </span>
          </div>
        </div>
      </div>

      <div className="t text-3xl border-t-1 font-bold my-5"></div>

      <div className=" text-black rounded-lg  mb-6">
        <h2 className="text-lg font-semibold mb-4  border-gray-600 pb-2">
          PAYMENT METHOD
        </h2>

        <div>
          <h1 className="text-gray-600">Debit/Credit</h1>
          <p className="font-semibold">Payment on Order</p>
        </div>
      </div>

      <div className="t text-3xl border-t-1 font-bold my-5"></div>
      {/* Products */}
      <div className=" text-black rounded-lg  mb-6">
        <h2 className="text-lg font-semibold mb-4  pb-2">PRODUCTS</h2>
        <div className="space-y-4">
          {order.products.map((item) => (
            <div key={item._id} className="flex gap-4  p-4 rounded-lg">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1 space-y-2">
                <h3 className="text-white font-medium">{item.name}</h3>
                <div className="text-sm text-gray-700">
                  <p>Qty: {item.quantity}</p>
                  <p>Price: ₦{item.price.toLocaleString()}</p>
                  <p>Total: ₦{(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-gray-600 px-2 py-1 rounded">
                    Size: {item.selectedSize || "N/A"}
                  </span>
                  <span className="bg-gray-600 px-2 py-1 rounded">
                    Color: {item.selectedColor || "N/A"}
                  </span>
                  <span className="bg-gray-600 px-2 py-1 rounded">
                    Category: {item.selectedCategory || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Totals */}
      <div className="bg-gray-800 text-gray-100 rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-600 pb-2">
          Payment Summary
        </h2>
        <p>Subtotal: ₦{order.subtotal.toLocaleString()}</p>
        {order.discount > 0 && (
          <>
            <p>Coupon: {order.coupon?.code}</p>
            <p>Discount: -₦{order.discount.toLocaleString()}</p>
          </>
        )}
        <p className="text-yellow-400 font-bold text-lg mt-2">
          Total: ₦{order.totalAmount.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
};

export default AdminOrderDetails;
