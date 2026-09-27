// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "../lib/axios";
// import { STATUS_STYLES } from "../components/statusStyle.jsx";
// import { motion } from "framer-motion";
// import GoBackButton from "../components/GoBackButton";
// import { formatPrice } from "../utils/currency.js";
// import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
// import ErrorBoundary from "../components/ErrorBoundary.jsx";

// const REFUND_LABELS = {
//   Approved: {
//     label: "Refunded",
//     tone: "bg-purple-50 text-purple-700 ring-purple-600/20",
//   },
//   "Partially Refunded": {
//     label: "Partially Refunded",
//     tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
//   },
//   Processing: {
//     label: "Refund Processing",
//     tone: "bg-purple-50 text-purple-700 ring-purple-600/20",
//   },
//   Rejected: {
//     label: "Refund Rejected",
//     tone: "bg-red-50 text-red-700 ring-red-600/20",
//   },
//   Pending: {
//     label: "Refund Pending",
//     tone: "bg-amber-50 text-amber-700 ring-amber-600/20",
//   },
// };

// const getRefundProductId = (refund) => {
//   if (refund.product) {
//     return typeof refund.product === "object"
//       ? refund.product._id?.toString()
//       : refund.product.toString();
//   }
//   return refund.productSnapshot?._id?.toString();
// };

// const getProductRefunds = (order, product) => {
//   const productId = product.product?._id?.toString();
//   return (
//     order.refunds?.filter(
//       (refund) => getRefundProductId(refund) === productId,
//     ) || []
//   );
// };

// /* ---------------- Subcomponents ---------------- */

// const Section = ({ title, children, className = "" }) => (
//   <section className={`py-8 border-t border-neutral-200 ${className}`}>
//     {title && (
//       <h2 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-5">
//         {title}
//       </h2>
//     )}
//     {children}
//   </section>
// );

// const StatusBadge = ({ status }) => (
//   <span
//     className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
//       STATUS_STYLES[status]
//     }`}
//   >
//     {status}
//   </span>
// );

// const InfoRow = ({ label, value, mono = false }) => (
//   <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 py-2.5 border-b border-neutral-100 last:border-0">
//     <span className="text-sm text-neutral-500">{label}</span>
//     <span
//       className={`text-sm font-medium text-neutral-900 break-all ${
//         mono ? "font-mono text-xs sm:text-sm" : ""
//       }`}
//     >
//       {value}
//     </span>
//   </div>
// );

// /* ---------------- Main ---------------- */

// const AdminOrderDetailsContent = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const { settings } = useStoreSettings();

//   useEffect(() => {
//     const fetchOrder = async () => {
//       try {
//         const { data } = await axios.get(`/admin/orders/${id}`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setOrder(data.order);
//       } catch (err) {
//         console.error("Error fetching order details:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchOrder();
//   }, [id]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen bg-neutral-50">
//         <div className="w-10 h-10 border-[3px] border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
//         <p className="text-lg">Order not found.</p>
//         <button
//           onClick={() => navigate(-1)}
//           className="text-sm text-neutral-900 underline underline-offset-4"
//         >
//           Go back
//         </button>
//       </div>
//     );
//   }

//   const paymentMethod = order.paymentMethod?.method?.replace("_", " ") || "—";

//   return (
//     <div className="min-h-screen bg-neutral-50">
//       <motion.div
//         initial={{ opacity: 0, y: 12 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
//       >
//         {/* Header */}
//         <motion.header
//           initial={{ opacity: 0, y: -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.3 }}
//           className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-6 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/60"
//         >
//           <div className="flex items-center gap-3">
//             <GoBackButton />
//             <div className="flex items-center gap-3 flex-wrap">
//               <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
//                 {order.orderNumber}
//               </h1>
//               <StatusBadge status={order.status} />
//             </div>
//           </div>
//         </motion.header>

//         <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
//           <div className="p-6 sm:p-8">
//             {/* Order meta */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <div>
//                 <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase mb-1.5">
//                   Order Placed
//                 </p>
//                 <p className="text-sm font-medium text-neutral-900">
//                   {new Date(order.createdAt).toLocaleString()}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase mb-1.5">
//                   Last {order.status}
//                 </p>
//                 <p className="text-sm font-medium text-neutral-900">
//                   {new Date(order.updatedAt).toLocaleString()}
//                 </p>
//               </div>
//             </div>

//             {/* Shipping / Customer */}
//             <Section title="Customer & Shipping">
//               <div className="space-y-1.5 text-sm">
//                 <p className="font-medium text-neutral-900">
//                   {order.user?.firstname} {order.user?.lastname}
//                 </p>
//                 <p className="text-neutral-600 break-all">
//                   {order.user?.email}
//                 </p>
//                 <p className="text-neutral-600">
//                   {order.phone || "No phone provided"}
//                 </p>
//                 <p className="text-neutral-600">
//                   {order.deliveryAddress || "No address provided"}
//                 </p>
//               </div>
//             </Section>

//             {/* Products */}
//             <Section title={`Products (${order.products.length})`}>
//               <ul className="space-y-3">
//                 {order.products.map((item) => {
//                   const productRefunds = getProductRefunds(order, item);
//                   return (
//                     <li
//                       key={item._id}
//                       className="flex gap-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50/50"
//                     >
//                       <img
//                         src={item.image}
//                         alt={item.name}
//                         className="w-20 h-20 object-cover rounded-md border border-neutral-200 flex-shrink-0"
//                       />
//                       <div className="flex-1 min-w-0">
//                         <div className="flex justify-between items-start gap-4">
//                           <h3 className="text-sm font-medium text-neutral-900 break-words">
//                             {item.name}
//                           </h3>
//                           <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
//                             {formatPrice(
//                               item.price * item.quantity,
//                               settings?.currency,
//                             )}
//                           </p>
//                         </div>

//                         <div className="mt-2 flex flex-wrap gap-2 text-xs">
//                           {item.selectedSize && (
//                             <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
//                               Size: {item.selectedSize}
//                             </span>
//                           )}
//                           {item.selectedColor && (
//                             <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
//                               Color: {item.selectedColor}
//                             </span>
//                           )}
//                           <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
//                             Qty: {item.quantity}
//                           </span>
//                         </div>

//                         {productRefunds.length > 0 && (
//                           <div className="mt-3 flex flex-wrap gap-2">
//                             {productRefunds.map((refund, i) => {
//                               const meta =
//                                 REFUND_LABELS[refund.status] ||
//                                 REFUND_LABELS.Pending;
//                               return (
//                                 <span
//                                   key={i}
//                                   className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${meta.tone}`}
//                                 >
//                                   {meta.label}
//                                 </span>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     </li>
//                   );
//                 })}
//               </ul>
//             </Section>

//             {/* Payment */}
//             <Section title="Payment Information">
//               <p className="text-sm text-neutral-500 mb-3">
//                 Method:{" "}
//                 <span className="font-medium text-neutral-900 capitalize">
//                   {paymentMethod}
//                 </span>
//               </p>
//               <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
//                 <div className="px-4">
//                   <InfoRow
//                     label="Status"
//                     value={order.paymentMethod?.status || "—"}
//                   />
//                 </div>
//                 {order.paymentMethod?.method === "card" &&
//                   order.paymentMethod?.card?.type && (
//                     <div className="px-4">
//                       <InfoRow
//                         label="Card Type"
//                         value={order.paymentMethod.card.type}
//                       />
//                     </div>
//                   )}
//                 {order.flutterwaveTransactionId && (
//                   <div className="px-4">
//                     <InfoRow
//                       label="Transaction ID"
//                       value={order.flutterwaveTransactionId}
//                       mono
//                     />
//                   </div>
//                 )}
//                 {order.flutterwaveRef && (
//                   <div className="px-4">
//                     <InfoRow
//                       label="Flutterwave Ref"
//                       value={order.flutterwaveRef}
//                       mono
//                     />
//                   </div>
//                 )}
//               </div>
//             </Section>

//             {/* Summary */}
//             <Section title="Payment Summary">
//               <div className="space-y-2 text-sm">
//                 <div className="flex justify-between text-neutral-600">
//                   <span>Items subtotal</span>
//                   <span className="text-neutral-900 font-medium">
//                     {formatPrice(order.subtotal, settings?.currency)}
//                   </span>
//                 </div>

//                 {order.discount > 0 && (
//                   <>
//                     <div className="flex justify-between text-neutral-600">
//                       <span>
//                         Coupon{" "}
//                         <span className="text-emerald-600 font-medium">
//                           {order.couponCode}
//                         </span>
//                       </span>
//                       <span className="text-emerald-600 font-medium">
//                         −{formatPrice(order.discount, settings?.currency)}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 {order.deliveryFee > 0 && (
//                   <div className="flex justify-between text-neutral-600">
//                     <span>Delivery fee</span>
//                     <span className="text-neutral-900 font-medium">
//                       {formatPrice(order.deliveryFee, settings?.currency)}
//                     </span>
//                   </div>
//                 )}

//                 <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-neutral-200">
//                   <span className="text-sm font-semibold text-neutral-900">
//                     Total
//                   </span>
//                   <span className="text-lg font-bold text-neutral-900 tracking-tight">
//                     {formatPrice(order.totalAmount, settings?.currency)}
//                   </span>
//                 </div>
//               </div>
//             </Section>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default function AdminOrderDetails() {
//   return (
//     <ErrorBoundary>
//       <AdminOrderDetailsContent />
//     </ErrorBoundary>
//   );
// }

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { Copy, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import GoBackButton from "../components/GoBackButton";
import StatusStepper from "../components/statusStepper.jsx";
import { STATUS_STYLES } from "../components/statusStyle.jsx";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

/* ---------------- Constants ---------------- */

const REFUND_LABELS = {
  Approved: {
    label: "Refunded",
    tone: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  "Partially Refunded": {
    label: "Partially Refunded",
    tone: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  Processing: {
    label: "Refund Processing",
    tone: "bg-purple-50 text-purple-700 ring-purple-600/20",
  },
  Rejected: {
    label: "Refund Rejected",
    tone: "bg-red-50 text-red-700 ring-red-600/20",
  },
  Pending: {
    label: "Refund Pending",
    tone: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
};

/* ---------------- Helpers ---------------- */

const getRefundProductId = (refund) => {
  if (refund.product) {
    return typeof refund.product === "object"
      ? refund.product._id?.toString()
      : refund.product.toString();
  }
  return refund.productSnapshot?._id?.toString();
};

const getProductRefunds = (order, product) => {
  const productId = product.product?._id?.toString();
  return (
    order.refunds?.filter(
      (refund) => getRefundProductId(refund) === productId,
    ) || []
  );
};

/* ---------------- Primitives ---------------- */

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-neutral-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Section = ({ title, children, action, className = "" }) => (
  <section
    className={`py-6 border-t border-neutral-200 first:border-t-0 first:pt-0 ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h2 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">
            {title}
          </h2>
        )}
        {action}
      </div>
    )}
    {children}
  </section>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
      STATUS_STYLES[status] || STATUS_STYLES.Pending
    }`}
  >
    {status}
  </span>
);

const InfoRow = ({ label, value, mono = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 py-2.5 border-b border-neutral-100 last:border-0">
    <span className="text-sm text-neutral-500">{label}</span>
    <span
      className={`text-sm font-medium text-neutral-900 break-all ${
        mono ? "font-mono text-xs sm:text-sm" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

const CopyButton = ({ value, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
      aria-label={label}
    >
      <Copy size={12} />
      {copied ? "Copied" : label}
    </button>
  );
};

/* ---------------- Main ---------------- */

const AdminOrderDetailsContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useStoreSettings();

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50">
        <div className="w-10 h-10 border-[3px] border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-400 gap-3">
        <p className="text-lg">Order not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-neutral-900 underline underline-offset-4"
        >
          Go back
        </button>
      </div>
    );
  }

  const paymentMethod = order.paymentMethod?.method?.replace("_", " ") || "—";
  const customerName = `${order.user?.firstname || ""} ${
    order.user?.lastname || ""
  }`.trim();

  return (
    <div className="min-h-screen bg-neutral-50">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 mb-6 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/60"
        >
          <div className="flex items-center gap-3">
            <GoBackButton fallback="/admin/orders" />
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
          </div>
        </motion.header>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---------- Main column ---------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status stepper */}
            <Card>
              <div className="px-6 py-4">
                <StatusStepper status={order.status} />
              </div>
            </Card>

            {/* Products */}
            <Card>
              <div className="p-6">
                <Section title={`Products (${order.products.length})`}>
                  <ul className="space-y-3">
                    {order.products.map((item) => {
                      const productRefunds = getProductRefunds(order, item);
                      return (
                        <li
                          key={item._id}
                          className="flex gap-4 p-4 rounded-lg border border-neutral-200 bg-neutral-50/50"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-md border border-neutral-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="text-sm font-medium text-neutral-900 break-words">
                                {item.name}
                              </h3>
                              <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
                                {formatPrice(
                                  item.price * item.quantity,
                                  settings?.currency,
                                )}
                              </p>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {item.selectedSize && (
                                <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              {item.selectedColor && (
                                <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                  Color: {item.selectedColor}
                                </span>
                              )}
                              <span className="px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                                Qty: {item.quantity}
                              </span>
                            </div>

                            {productRefunds.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {productRefunds.map((refund, i) => {
                                  const meta =
                                    REFUND_LABELS[refund.status] ||
                                    REFUND_LABELS.Pending;
                                  return (
                                    <span
                                      key={i}
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${meta.tone}`}
                                    >
                                      {meta.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              </div>
            </Card>

            {/* Payment info */}
            <Card>
              <div className="p-6">
                <Section title="Payment Information">
                  <p className="text-sm text-neutral-500 mb-3">
                    Method:{" "}
                    <span className="font-medium text-neutral-900 capitalize">
                      {paymentMethod}
                    </span>
                  </p>
                  <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                    <div className="px-4">
                      <InfoRow
                        label="Status"
                        value={order.paymentMethod?.status || "—"}
                      />
                    </div>
                    {order.paymentMethod?.method === "card" &&
                      order.paymentMethod?.card?.type && (
                        <div className="px-4">
                          <InfoRow
                            label="Card Type"
                            value={order.paymentMethod.card.type}
                          />
                        </div>
                      )}
                    {order.flutterwaveTransactionId && (
                      <div className="px-4">
                        <InfoRow
                          label="Transaction ID"
                          value={order.flutterwaveTransactionId}
                          mono
                        />
                      </div>
                    )}
                    {order.flutterwaveRef && (
                      <div className="px-4">
                        <InfoRow
                          label="Flutterwave Ref"
                          value={order.flutterwaveRef}
                          mono
                        />
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            </Card>

            {/* Payment summary */}
            <Card>
              <div className="p-6">
                <Section title="Payment Summary">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>Items subtotal</span>
                      <span className="text-neutral-900 font-medium">
                        {formatPrice(order.subtotal, settings?.currency)}
                      </span>
                    </div>

                    {order.discount > 0 && (
                      <div className="flex justify-between text-neutral-600">
                        <span>
                          Coupon{" "}
                          <span className="text-emerald-600 font-medium">
                            {order.couponCode}
                          </span>
                        </span>
                        <span className="text-emerald-600 font-medium">
                          −{formatPrice(order.discount, settings?.currency)}
                        </span>
                      </div>
                    )}

                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-neutral-600">
                        <span>Delivery fee</span>
                        <span className="text-neutral-900 font-medium">
                          {formatPrice(order.deliveryFee, settings?.currency)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-neutral-200">
                      <span className="text-sm font-semibold text-neutral-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-neutral-900 tracking-tight">
                        {formatPrice(order.totalAmount, settings?.currency)}
                      </span>
                    </div>
                  </div>
                </Section>
              </div>
            </Card>
          </div>

          {/* ---------- Sticky sidebar ---------- */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* At-a-glance */}
              <Card>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-medium tracking-widest text-neutral-500 uppercase mb-1">
                        Order
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-neutral-900">
                          {order.orderNumber}
                        </p>
                        <CopyButton value={order.orderNumber} label="" />
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Placed</span>
                      <span className="text-neutral-900 font-medium">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Updated</span>
                      <span className="text-neutral-900 font-medium">
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-neutral-100">
                      <span className="text-neutral-500">Total</span>
                      <span className="text-neutral-900 font-semibold">
                        {formatPrice(order.totalAmount, settings?.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Customer card */}
              <Card>
                <div className="p-6">
                  <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-4">
                    Customer
                  </h3>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-semibold">
                      {(order.user?.firstname?.[0] || "?").toUpperCase()}
                      {(order.user?.lastname?.[0] || "").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {customerName || "Unknown customer"}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {order.user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {order.user?.email && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-neutral-600 min-w-0">
                          <Mail size={14} className="flex-shrink-0" />
                          <span className="truncate">{order.user.email}</span>
                        </div>
                        <CopyButton value={order.user.email} label="" />
                      </div>
                    )}
                    {order.phone && (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Phone size={14} className="flex-shrink-0" />
                          <span>{order.phone}</span>
                        </div>
                        <CopyButton value={order.phone} label="" />
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 text-neutral-600">
                        <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                        <span className="text-sm leading-snug">
                          {order.deliveryAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Quick actions */}
              <Card>
                <div className="p-6">
                  <h3 className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {order.user?.email && (
                      <a
                        href={`mailto:${order.user.email}`}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
                      >
                        <Mail size={14} />
                        Email customer
                        <ExternalLink
                          size={12}
                          className="ml-auto text-neutral-400"
                        />
                      </a>
                    )}
                    {order.phone && (
                      <a
                        href={`tel:${order.phone}`}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
                      >
                        <Phone size={14} />
                        Call customer
                        <ExternalLink
                          size={12}
                          className="ml-auto text-neutral-400"
                        />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminOrderDetails() {
  return (
    <ErrorBoundary>
      <AdminOrderDetailsContent />
    </ErrorBoundary>
  );
}