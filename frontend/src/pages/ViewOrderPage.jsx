import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import GoBackButton from "../components/GoBackButton";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";


const ViewOrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await axios.get(`/orders/vieworders/${id}`, {
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

    const { settings } = useStoreSettings();
   return (
     <motion.div
       className="px-4 lg:px-28 py-8 bg-white "
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
         <span
           className={`px-1 py-1 rounded text-xs ml-2 font-medium ${
             order.status === "Delivered"
               ? "bg-green-600 text-white"
               : order.status === "Cancelled"
               ? "bg-red-600 text-white"
               : order.status === "Refunded"
               ? "bg-purple-600 text-white"
               : order.status === "Partially Refunded"
               ? "bg-pink-600 text-white"
               : "bg-yellow-500 text-white"
           }`}
         >
           {order.status}
         </span>
       </motion.div>
       {/* Order Info */}
       <div className=" grid grid-cols-2 text-black gap-5 mt-12 py-6 px-2  ">
         <div>
           <h1 className="text-gray-600">Order Placed</h1>
           <p className="font-semibold">
             {new Date(order.createdAt).toLocaleString()}
           </p>
         </div>

         <div>
           <h1 className="text-gray-600">Order {order.status}:</h1>{" "}
           <p className="font-semibold">
             {new Date(order.updatedAt).toLocaleString()}
           </p>
         </div>
       </div>
       <div className="py-5 text-3xl border-t-1 border-gray-300  "></div>
       {/* Customer Info */}
       <div className=" text-black rounded-lg  py-6 px-2">
         <h2 className="text-lg font-semibold mb-4  border-gray-600 pb-2">
           SHIPPING ADDRESS
         </h2>
         <div className="flex flex-col gap-4 text-sm text-gray-600">
           {" "}
           <span className="font-semibold break-words">
             {order.user?.firstname + " " + order.user?.lastname}
           </span>
           <span className="font-semibold break-words">
             {" "}
             {order.user?.email}
           </span>
           <span className="font-semibold">
             {order.phone || "Not provided"}
           </span>
           <span className="font-semibold break-words">
             {" "}
             {order.deliveryAddress || "Not provided"}
           </span>
         </div>
       </div>

       <div className="py-5 text-3xl border-t-1 border-gray-300"></div>
       {/* Products */}
       <div className=" text-black rounded-lg  pt-6  ">
         <h2 className="text-lg font-semibold mb-4  pb-2">PRODUCTS</h2>
         <div className="space-y-4">
           <ul>
             {order.products.map((item) => (
               <li
                 key={item._id}
                 className="flex gap-4 p-4 bg-gray-50 rounded-lg shadow mt-2"
               >
                 {" "}
                 <img
                   src={item.image}
                   alt={item.name}
                   className="w-20 h-20 object-cover rounded"
                 />
                 <div className="flex-1 space-y-3">
                   <div className="flex justify-between items-center">
                     <h3 className="text-gray-900 text-sm break-words w-40 md:w-fit">
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
                     {item.selectedSize && (
                       <span className="bg-gray-100 px-2 py-1 rounded tracking-widest">
                         Size: {item.selectedSize || "NA"}
                       </span>
                     )}
                     {item.selectedColor && (
                       <span className="bg-gray-100 px-2 py-1 rounded tracking-widest">
                         Color: {item.selectedColor || "N/A"}
                       </span>
                     )}
                   </div>
                   <div className="flex  justify-between text-sm text-gray-900">
                     <span className="bg-gray-100 h-fit px-2 py-1 rounded text-xs ">
                       Qty: {item.quantity}
                     </span>
                     {item.quantity > 1 && (
                       <span className="text-gray-700 text-xs">
                         {formatPrice(item.price, settings?.currency)} each
                       </span>
                     )}
                     {(() => {
                       // Find refunds that belong to this specific product
                       const productRefunds =
                         order.refunds?.filter((refund) => {
                           // Get the product ID from the refund
                           let refundProductId;

                           if (refund.product) {
                             if (typeof refund.product === "object") {
                               refundProductId = refund.product._id?.toString();
                             } else {
                               refundProductId = refund.product.toString();
                             }
                           } else if (refund.productSnapshot?._id) {
                             // Handle deleted products
                             refundProductId = refund.productSnapshot._id;
                           }

                           // Get the product ID from the current item
                           const currentProductId =
                             item.product?._id?.toString();

                           // Compare IDs
                           return refundProductId === currentProductId;
                         }) || [];

                       // If this product has refunds, show them
                       if (productRefunds.length > 0) {
                         return productRefunds.map((refund, index) => (
                           <div key={index} className="mt-2 p-2 rounded">
                             <span
                               className={`inline-block px-2 py-1 text-xs rounded ${
                                 refund.status === "Approved" ||
                                 refund.status === "Refunded"
                                   ? "bg-green-100 text-green-700"
                                   : refund.status === "Processing"
                                   ? "bg-blue-100 text-blue-700"
                                   : refund.status === "Rejected"
                                   ? "bg-red-100 text-red-700"
                                   : "bg-yellow-100 text-yellow-700"
                               }`}
                             >
                               {refund.status === "Approved" ||
                               refund.status === "Refunded"
                                 ? "Refunded"
                                 : refund.status === "Processing"
                                 ? "Refund Processing"
                                 : refund.status === "Rejected"
                                 ? "Refund Rejected"
                                 : "Refund Pending"}
                             </span>
                           </div>
                         ));
                       }

                       return null;
                     })()}
                   </div>
                 </div>
               </li>
             ))}
           </ul>
         </div>
       </div>

       {(order.status === "Delivered" ||
         order.status === "Partially Refunded") && (
         <div className="flex">
           {order.products.some((product) => {
             const productRefunds =
               order.refunds?.filter((refund) => {
                 let refundProductId;
                 if (refund.product) {
                   if (typeof refund.product === "object") {
                     refundProductId = refund.product._id?.toString();
                   } else {
                     refundProductId = refund.product.toString();
                   }
                 } else if (refund.productSnapshot?._id) {
                   refundProductId = refund.productSnapshot._id;
                 }
                 const currentProductId = product.product?._id?.toString();
                 return refundProductId === currentProductId;
               }) || [];

             return productRefunds.length === 0;
           }) && (
             <button
               onClick={() =>
                 navigate(`/vieworders/${order._id}/return`, {
                   state: { order },
                 })
               }
               className="hover:text-red-600 text-red-500 px-4 py-3 rounded-lg text-[1rem] cursor-pointer border border-red-200 hover:bg-red-50 transition-colors"
             >
               <span className="flex items-center gap-2">Request a Return</span>
             </button>
           )}
         </div>
       )}

       <div className="py-5 text-3xl border-t-1 border-gray-300"></div>
       <h1 className="text-lg font-semibold m  border-gray-600 pb-2">
         PAYMENT INFORMATION
       </h1>

       <div className=" text-black rounded-lg py-6 px-2">
         <h2 className="text-lg font-semibold mb-4  border-gray-600 text-black/80">
           Payment Method ({order.paymentMethod.method})
         </h2>
         {order.paymentMethod.method === "bank_transfer" && (
           <div>
             <h1 className="text-gray-600">
               Status:{" "}
               <span className="text-gray-800">
                 {order.paymentMethod.status}
               </span>
             </h1>
             <h1 className="text-gray-600">
               Transaction ID:{" "}
               <span className="text-gray-800">
                 {order.flutterwaveTransactionId}
               </span>
             </h1>
             <h1 className="text-gray-600">
               FlutterwaveRef:{" "}
               <span className="text-gray-800">{order.flutterwaveRef}</span>
             </h1>
           </div>
         )}
         {order.paymentMethod.method === "card" && (
           <div>
             <h1 className="text-gray-600">
               Status:{" "}
               <span className="text-gray-800">
                 {order.paymentMethod.status}
               </span>
             </h1>

             <h1 className="text-gray-600">
               Card Type:{" "}
               <span className="text-gray-800">
                 {order.paymentMethod.card.type}
               </span>
             </h1>
             <h1 className="text-gray-600">
               Transaction ID:{" "}
               <span className="text-gray-800">
                 {order.flutterwaveTransactionId}
               </span>
             </h1>
             <h1 className="text-gray-600">
               FlutterwaveRef:{" "}
               <span className="text-gray-800">{order.flutterwaveRef}</span>
             </h1>
           </div>
         )}
       </div>

       {/* Totals */}
       <div className=" text-black rounded-lg py-6 px-2 ">
         <h2 className="text-lg font-semibold mb-4  text-black/80">
           Payment Summary
         </h2>

         <p className="pb-1 text-gray-600">
           Items total:{" "}
           <span> {formatPrice(order.subtotal, settings?.currency)}</span>
         </p>
         {order.discount > 0 && (
           <>
             <p className="pb-1 text-gray-600">
               Coupon:{" "}
               <span className="text-green-600 ">{order.couponCode}</span>
             </p>
             <p className="pb-1 text-gray-600">
               Discount:{" "}
               <span className="text-red-500">
                 -{formatPrice(order.discount, settings?.currency)}
               </span>
             </p>
           </>
         )}
         {order.deliveryFee > 0 && (
           <p className="pb-1 text-gray-600">
             Delivery Fees:{" "}
             <span>{formatPrice(order.deliveryFee, settings?.currency)}</span>
           </p>
         )}

         <p className="tracking-wider font-bold text-lg mt-2">
           Total: ₦{order.totalAmount.toLocaleString()}
         </p>
       </div>
     </motion.div>
   );
};

export default ViewOrderPage;
