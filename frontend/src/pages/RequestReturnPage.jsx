import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { SEO } from "../components/SEO";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { requestRefund } from "../stores/refundRequestStore";
import GoBackButton from "../components/GoBackButton";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

const RequestReturnPageContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refundData, setRefundData] = useState({
    productId: "",
    quantity: 1,
    reason: "",
  });

  // Get order data from location state or fetch it
  useEffect(() => {
    if (location.state?.order) {
      // If order data was passed via navigation state
      setOrder(location.state.order);
      setLoading(false);
    } else {
      // Otherwise fetch the order
      const fetchOrder = async () => {
        try {
          const { data } = await axios.get(`/orders/vieworders/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setOrder(data.order);
        } catch (err) {
          console.error("Error fetching order details:", err);
          toast.error("Failed to load order details");
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, location.state]);

  const getDeletedProductId = (p, orderId) => {
    const safeName = (p.name || p.product?.name || "")
      .trim()
      .replace(/\s+/g, "_");
    const price = p.price || p.product?.price || 0;
    return `deleted-${orderId}-${safeName}-${price}`;
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();

    if (!refundData.productId || !refundData.reason.trim()) {
      toast.error("Please select product and provide a reason");
      return;
    }

    try {
      setSaving(true);
      await requestRefund(id, refundData);

      toast.success("Refund request submitted successfully!");
      setRefundData({ productId: "", quantity: 1, reason: "" });

      setTimeout(() => navigate(`/vieworders/${id}`), 1500);
    } catch (err) {
      console.error(err);

      // Handle specific error cases
      if (err.response?.data?.details?.maxAllowed) {
        // Show quantity error with suggestion
        const { maxAllowed, requested, suggestion } = err.response.data.details;
        toast.error(
          `You can only refund ${maxAllowed} item(s). ${suggestion}`,
          { autoClose: 5000 }
        );

        // Auto-update quantity field
        setRefundData((prev) => ({
          ...prev,
          quantity: Math.min(prev.quantity, maxAllowed),
        }));
      } else {
        toast.error(
          err.response?.data?.message || "Failed to submit refund request"
        );
      }
    } finally {
      setSaving(false);
    }
  };
  const { settings } = useStoreSettings();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center mt-20 text-gray-400">
        Order not found. Please go back and try again.
      </div>
    );
  }

  return (
    <motion.div
      className="px-4 lg:px-28 py-8 bg-white min-h-screen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <SEO
        title={`Request Return for Order #${order.orderNumber} | Returns & Refunds`}
        description={`Submit a return request for your order #${order.orderNumber}. Fast and easy returns process with secure refunds.`}
        canonicalUrl={window.location.href}
      />
      <ToastContainer />

      <div className="max-w-2xl mx-auto">
        <div className="mb-5 flex align-middle text-c">
          <div className="mb-6">
            <GoBackButton />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 ">
              Request a Return
            </h1>
          </div>
        </div>
        <p className="text-gray-600 mb-5">
          <span className="text-gray-900 font-medium">{order.orderNumber}</span>
          • Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>

        <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Select Item to Return
          </h2>

          <form onSubmit={handleRefundSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product *
              </label>
              <select
                value={refundData.productId}
                onChange={(e) =>
                  setRefundData({ ...refundData, productId: e.target.value })
                }
                className="w-full border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg p-3 bg-white"
                required
              >
                <option value="" disabled>
                  Choose a product to return
                </option>
                {order.products.map((p) => {
                  const productId =
                    p.product?._id?.toString() ||
                    getDeletedProductId(p, order._id);
                  const productName =
                    p.product?.name || p.name || "Deleted Product";
                  const productPrice = p.product?.price || p.price || 0;
                  const availableQuantity = p.quantity || 1;

                  // Check if this product already has refunds
                  const existingRefunds =
                    order.refunds?.filter((refund) => {
                      let refundProductId;
                      if (refund.product) {
                        refundProductId =
                          typeof refund.product === "object"
                            ? refund.product._id?.toString()
                            : refund.product.toString();
                      } else if (refund.productSnapshot?._id) {
                        refundProductId = refund.productSnapshot._id;
                      }
                      return (
                        refundProductId ===
                        (p.product?._id?.toString() || productId)
                      );
                    }) || [];

                  const totalRefunded = existingRefunds.reduce(
                    (sum, refund) => sum + (refund.quantity || 0),
                    0
                  );
                  const remainingQuantity = availableQuantity - totalRefunded;

                  return (
                    <option
                      key={productId}
                      value={productId}
                      disabled={remainingQuantity <= 0}
                    >
                      {`${productName} — ${formatPrice(
                        productPrice,
                        settings?.currency
                      )} 
                      (Available: ${remainingQuantity} of ${availableQuantity})`}
                      {remainingQuantity <= 0 && " — Already requested"}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={refundData.quantity}
                onChange={(e) =>
                  setRefundData({
                    ...refundData,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg p-3"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Return *
              </label>
              <textarea
                rows="4"
                value={refundData.reason}
                onChange={(e) =>
                  setRefundData({ ...refundData, reason: e.target.value })
                }
                placeholder="Please describe why you want to return this item..."
                className="w-full border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-lg p-3 resize-none"
                required
              />
            </div>

            {/* Refund Policy */}
            <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">
                Return Policy
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                  Returns must be requested within 48 hours of delivery
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                  Items must be unworn, unwashed, and in original packaging
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                  Refunds are processed within 5-10 business days after approval
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-1 mr-2"></span>
                  Shipping fees are non-refundable unless the item is incorrect
                  or defective
                </li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(`/vieworders/${id}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Submitting Request...
                  </>
                ) : (
                  "Submit Return Request"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order Summary Preview */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-4">
            {order.products.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Qty: {item.quantity}</span>
                    <span className="font-medium">
                      {formatPrice(
                        item.price * item.quantity,
                        settings?.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  {formatPrice(order.subtotal, settings?.currency) || 0}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span className="text-red-500">
                    -{formatPrice(order.discount, settings?.currency) || 0}
                  </span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>
                    {formatPrice(order.deliveryFee, settings?.currency) || 0}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span>
                  {formatPrice(order.totalAmount, settings?.currency) || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function RequestReturnPage() {
  return (
    <ErrorBoundary>
      <RequestReturnPageContent />
    </ErrorBoundary>
  );
}
