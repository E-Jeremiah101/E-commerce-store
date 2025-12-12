import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { Check, Loader } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { requestRefund } from "../stores/refundRequestStore";
import GoBackButton from "../components/GoBackButton";


const ViewOrderPage = () => {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
   const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [refundData, setRefundData] = useState({
      productId: "",
      quantity: 1,
      reason: "",
    });
    const [saving, setSaving] = useState(false);
    const getDeletedProductId = (p, orderId) => {
      const safeName = (p.name || p.product?.name || "")
        .trim()
        .replace(/\s+/g, "_");
      const price = p.price || p.product?.price || 0;
      return `deleted-${orderId}-${safeName}-${price}`;
    };

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

    const handleRefundClick = (order) => {
      setSelectedOrder(order);
      setShowRefundModal(true);
    };
  
    const handleRefundSubmit = async (e) => {
      e.preventDefault()
  
      if (!refundData.productId || !refundData.reason.trim()) {
        toast.error("Please select product and provide a reason");
        return;
      }
  
      if (!refundData.productId || !refundData.reason.trim()) {
        toast.error("Please select product and provide a reason");
        return;
      }
   
      try {
        setSaving(true);
  
        await requestRefund(selectedOrder._id, refundData);
  
        toast.success("Refund request submitted successfully!");
        setRefundData({ productId: "", quantity: 1, reason: "" });
        setShowRefundModal(false);
  
        //  Re-fetch updated orders right after success
       const { data } = await axios.get(`/orders/vieworders/${id}`, {
         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
       });
       setOrder(data.order);
      } catch (err) {
        console.error(err);
        toast.error(
          err.response?.data?.message || "Failed to submit refund request"
        );
      } finally {
        // Always stop loading, even if modal closes early
        setSaving(false);
      }
    };
  

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
               <span
                 onClick={() => navigate(`/vieworders/${order._id}`)}
                 className="cursor-pointer"
               >
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
                         ₦{(item.price * item.quantity).toLocaleString()}
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
                           ₦{item.price.toLocaleString()} each
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
                                 refundProductId =
                                   refund.product._id?.toString();
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
               </span>
             ))}
           </ul>
         </div>
       </div>
       {/* {(order.status === "Delivered" ||
         order.status === "Partially Refunded") && (
           <div className="flex">
             {order.products.some((product) => {
               const productRefunds =
                 order.refunds?.filter((refund) => {
                   // Multiple ways to extract the refund product ID
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
                 onClick={() => handleRefundClick(order)}
                 className="hover:text-red-600 text-red-500 px-2 py-2 rounded-lg text-[1rem] cursor-pointer"
               >
                 <span className="p-1 rounded">
                   Request a Return
                 </span>
               </button>
             )}
           </div>
         )} */}

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
           Items total: <span> ₦{order.subtotal.toLocaleString()}</span>
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
                 -₦{order.discount.toLocaleString()}
               </span>
             </p>
           </>
         )}
         {order.deliveryFee && (
           <p className="pb-1 text-gray-600">
             Delivery Fees: <span>₦{order.deliveryFee.toLocaleString()}</span>
           </p>
         )}

         <p className="tracking-wider font-bold text-lg mt-2">
           Total: ₦{order.totalAmount.toLocaleString()}
         </p>
       </div>

       {showRefundModal && selectedOrder && (
         <div className="fixed inset-0 flex no-scroll items-center justify-center bg-black/90 bg-opacity-700 z-50">
           <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
             <h3 className="text-lg font-semibold mb-4">Request Refund </h3>
             <form onSubmit={handleRefundSubmit}>
               <label className="block text-sm font-medium mb-2">
                 Select Product
               </label>
               <select
                 value={refundData.productId}
                 onChange={(e) =>
                   setRefundData({ ...refundData, productId: e.target.value })
                 }
                 className="w-full border border-gray-500 focus:outline-none rounded-lg p-2 mb-3"
               >
                 <option value="" disabled>
                   Select product
                 </option>
                 {selectedOrder.products.map((p) => {
                   // Convert ObjectId to string
                   const productId =
                     p.product?._id?.toString() ||
                     getDeletedProductId(p, selectedOrder._id);
                   const productName =
                     p.product?.name || p.name || "Deleted Product";
                   const productPrice = p.product?.price || p.price || 0;

                   return (
                     <option key={productId} value={productId}>
                       {`${productName} — ₦${productPrice.toLocaleString()}`}
                     </option>
                   );
                 })}
               </select>

               <label className="block text-sm font-medium mb-2">
                 Quantity
               </label>
               <input
                 type="number"
                 min="1"
                 max={
                   selectedOrder.products.find(
                     (p) => p.product?._id === refundData.productId
                   )?.quantity || 1
                 }
                 value={refundData.quantity}
                 onChange={(e) =>
                   setRefundData({ ...refundData, quantity: e.target.value })
                 }
                 className="w-full border border-gray-500 focus:outline-none rounded-lg p-2 mb-3"
               />

               <label className="block text-sm font-medium mb-2">
                 Reason for Refund
               </label>
               <textarea
                 rows="3"
                 value={refundData.reason}
                 onChange={(e) =>
                   setRefundData({ ...refundData, reason: e.target.value })
                 }
                 placeholder="Describe the issue..."
                 className="w-full resize-none border-1 rounded-lg p-2 mb-3 focus:outline-none   border-gray-500"
               ></textarea>

               <div className="flex justify-end gap-2">
                 <button
                   type="button"
                   onClick={() => setShowRefundModal(false)}
                   className="px-4 py-2 border rounded-lg"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60"
                   disabled={saving}
                 >
                   {saving ? (
                     <span className="flex items-center gap-2">
                       <Loader className="animate-spin" size={15} />
                       Submitting...
                     </span>
                   ) : (
                     "Submit"
                   )}
                 </button>
               </div>

               <div className="mt-4 max-h-54 overflow-y-auto border border-gray-200 p-3 rounded-md text-gray-700 whitespace-pre-wrap no-scroll">
                 <h1 className="text-lg font-bold mb-2">Refund Policy</h1>
                 <span>
                   At <span className="text-gray-900">Eco~Store</span>, we want
                   you to be completely satisfied with your purchase. If you are
                   not happy with your order, please review our refund policy
                   below:
                 </span>

                 <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                   <li>
                     Refund requests must be made within 48 hours of receiving
                     your order.
                   </li>
                   <li>
                     Items must be unworn, unwashed, and returned in their
                     original packaging with all tags attached.
                   </li>
                   <li>
                     Certain items such as custom-made, personalized, or sale
                     items may not be eligible for a refund.
                   </li>
                   <li>
                     Refunds will be processed to your original payment method
                     within 5–10 business days after approval.
                   </li>
                   <li>
                     For defective or damaged items, please provide a photo as
                     proof.
                   </li>
                 </ul>

                 <ol className="list-decimal list-inside mt-2 text-sm text-gray-700">
                   <li>
                     Submit a refund request through this form selecting the
                     product and quantity.
                   </li>
                   <li>You will receive an email confirmation upon request.</li>
                   <li>Wait for confirmation from our support team.</li>
                   <li>
                     Ship the product back if required, using the instructions
                     provided.
                   </li>
                   <li>
                     Receive your refund once the returned item is received and
                     approved.
                   </li>
                 </ol>

                 <p className="text-sm text-gray-900 mt-2">
                   Note: Shipping fees are non-refundable unless the item is
                   incorrect.
                 </p>
               </div>
             </form>
           </div>
         </div>
       )}
     </motion.div>
   );
};

export default ViewOrderPage;
