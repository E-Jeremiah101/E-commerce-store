import React, { useState } from "react";
import axios from "../lib/axios";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore.js";

const Recovery = () => {
  const [searchMethod, setSearchMethod] = useState("transaction_ref");
  const [formData, setFormData] = useState({
    transaction_ref: "",
    flutterwave_ref: "",
    customer_email: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user } = useUserStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(
        "/admin/orders/recover-order",
        formData
      );

      if (response.data.success) {
        const hasOutOfStock =
          response.data.stockDeductionSummary?.outOfStock > 0;

        setResult({
          type: hasOutOfStock ? "warning" : "success",
          message: `✅ ${response.data.message}`,
          data: response.data,
          details: `
ORDER RECOVERED SUCCESSFULLY!

Order Number: ${response.data.orderNumber}
Customer: ${response.data.customerEmail}
Amount: ${response.data.currency} ${response.data.amount}
Payment Method: ${response.data.recoveredDetails?.paymentType || "N/A"}
Paid: ${response.data.recoveredDetails?.paidAt || "N/A"}

RECOVERED PRODUCTS (${response.data.products?.length || 0}):
${(response.data.products || [])
  .map(
    (p, i) =>
      `• ${p.name} - ${response.data.currency} ${p.price} × ${p.quantity}`
  )
  .join("\n")}

NEXT STEPS:
• Contact customer to confirm delivery address
• Verify product details
• Update order status as needed
          `,
        });
      }
    } catch (error) {
      console.error("Recovery error:", error);

      if (error.response?.data?.orderDetails) {
        setResult({
          type: "info",
          message: "Order Already Exists",
          details: `
Order Number: ${error.response.data.orderDetails.orderNumber}
Status: ${error.response.data.orderDetails.status}
Customer: ${error.response.data.orderDetails.customer}
Email: ${error.response.data.orderDetails.customerEmail}
Amount: ₦${error.response.data.orderDetails.totalAmount}

This order already exists in the system.
          `,
        });
      } else {
        setResult({
          type: "error",
          message: `❌ ${error.response?.data?.error || "Recovery failed"}`,
          details: `
Error: ${error.response?.data?.error || error.message}
${
  error.response?.data?.tips
    ? `\nTips:\n• ${error.response.data.tips.join("\n• ")}`
    : ""
}
${
  error.response?.data?.debug
    ? `\nDebug:\n${JSON.stringify(error.response.data.debug, null, 2)}`
    : ""
}
          `,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="max-w-2xl mx-auto mt-19 p-6 bg-white rounded-lg shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Automatic Order Recovery
        </h2>

        {/* Reference Guide */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Reference Guide:</h3>
          <div className="text-sm text-blue-700">
            <div className="mb-2">
              <strong>Transaction Reference:</strong> ECOSTORE-1764xxxx
            </div>
            <div>
              <strong>Flutterwave Reference:</strong> JayyTech_xxx
            </div>
          </div>
        </div>

        {/* Search Method Selector */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="transaction_ref"
                checked={searchMethod === "transaction_ref"}
                onChange={(e) => setSearchMethod(e.target.value)}
                className="mr-2"
              />
              <span>
                <strong>Transaction Reference</strong>
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="flutterwave_ref"
                checked={searchMethod === "flutterwave_ref"}
                onChange={(e) => setSearchMethod(e.target.value)}
                className="mr-2"
              />
              <span>
                <strong>Flutterwave Reference</strong>
              </span>
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Transaction Reference Field */}
          {searchMethod === "transaction_ref" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference *
              </label>
              <input
                type="text"
                value={formData.transaction_ref}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_ref: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="ECOSTORE-1764257590757"
              />
            </div>
          )}

          {/* Flutterwave Reference Field */}
          {searchMethod === "flutterwave_ref" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flutterwave Reference *
              </label>
              <input
                type="text"
                value={formData.flutterwave_ref}
                onChange={(e) =>
                  setFormData({ ...formData, flutterwave_ref: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="JayyTech_VTVIKF176425766668140070"
              />
            </div>
          )}

          {/* Customer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email *
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) =>
                setFormData({ ...formData, customer_email: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="customer@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? "Recovering Order..." : "Recover Order"}
          </button>
        </form>

        {/* Results Display */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-md ${
              result.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : result.type === "warning"
                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                : result.type === "info"
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            <div className="font-semibold text-lg mb-2">{result.message}</div>

            {/* Basic Details */}
            {result.details && (
              <div className="mt-2 text-sm whitespace-pre-line">
                {result.details}
              </div>
            )}

            {/* Coupon/Discount Info */}
            {result.data?.discountDetails?.couponCode && (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <div className="font-medium">🎉 Coupon Applied!</div>
                <div className="text-sm">
                  Coupon:{" "}
                  <strong>{result.data.discountDetails.couponCode}</strong>
                  <br />
                  Discount:{" "}
                  <strong>₦{result.data.discountDetails.discountAmount}</strong>
                  <br />
                  Subtotal: ₦{result.data.discountDetails.subtotal}
                  <br />
                  Delivery: ₦{result.data.discountDetails.deliveryFee}
                  <br />
                  Total: ₦{result.data.discountDetails.totalAmount}
                </div>
              </div>
            )}

            {/* Stock Deduction Summary */}
            {result.data?.stockDeductionSummary && (
              <div className="mt-4">
                <div className="font-medium mb-2">
                  📊 Stock Deduction Summary:
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold">
                      {result.data.stockDeductionSummary.totalItems}
                    </div>
                    <div className="text-xs">Total Items</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold">
                      {result.data.stockDeductionSummary.deducted}
                    </div>
                    <div className="text-xs">Deducted</div>
                  </div>
                  <div
                    className={`text-center p-2 rounded ${
                      result.data.stockDeductionSummary.outOfStock > 0
                        ? "bg-yellow-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="text-lg font-bold">
                      {result.data.stockDeductionSummary.outOfStock}
                    </div>
                    <div className="text-xs">Out of Stock</div>
                  </div>
                  <div
                    className={`text-center p-2 rounded ${
                      result.data.stockDeductionSummary.errors > 0
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="text-lg font-bold">
                      {result.data.stockDeductionSummary.errors}
                    </div>
                    <div className="text-xs">Errors</div>
                  </div>
                </div>

                {/* Out of Stock Warning */}
                {result.data.stockDeductionSummary.outOfStock > 0 && (
                  <div className="p-3 bg-yellow-100 rounded mb-3">
                    <div className="font-medium text-yellow-800">
                      ⚠️ Admin Attention Required
                    </div>
                    <div className="text-sm mt-1">
                      {result.data.stockDeductionSummary.adminNote}
                    </div>

                    <div className="mt-3">
                      <div className="font-medium text-sm">
                        Out of Stock Items:
                      </div>
                      <ul className="mt-1 space-y-1">
                        {result.data.stockDeductionSummary.outOfStockItems.map(
                          (item, index) => (
                            <li
                              key={index}
                              className="text-sm p-2 bg-white/50 rounded"
                            >
                              • {item.replace("❌ ", "")}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {result.data.stockDeductionSummary.outOfStock === 0 && (
                  <div className="p-3 bg-green-100 rounded">
                    <div className="font-medium text-green-800">
                      ✅ All items were in stock and deducted successfully
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            {result.data?.nextSteps && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="font-medium mb-2">Next Steps:</div>
                <ul className="space-y-1">
                  {result.data.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span>•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            {result.type !== "error" && result.data?.orderId && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      result.data.orderNumber || ""
                    );
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Copy Order #
                </button>
                <button
                  onClick={() => {
                    window.open(
                      `/admin/orders/${result.data.orderId}`,
                      "_blank"
                    );
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  View Order Details
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Recovery;
