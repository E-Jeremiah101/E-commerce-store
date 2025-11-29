
import React, { useState } from "react";
import axios from "../lib/axios";
const Support = () => {
  const [searchMethod, setSearchMethod] = useState("transaction_ref");
  const [formData, setFormData] = useState({
    transaction_ref: "",
    flutterwave_ref: "",
    customer_email: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

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
        setResult({
          type: "success",
          message: `✅ ${response.data.message}`,
          details: `
Order Number: ${response.data.orderNumber}
Customer: ${response.data.customerEmail}
Amount: ₦${response.data.amount}
Search Method: ${response.data.searchMethod}

Payment Details:
• Transaction Ref: ${response.data.paymentDetails.transactionReference}
• Flutterwave Ref: ${response.data.paymentDetails.flutterwaveReference}
• Paid: ${new Date(response.data.paymentDetails.paidAt).toLocaleString()}

Next Steps:
• Contact customer with order number
• Add products to the order
• Confirm delivery address
          `,
        });
        // Clear form
        setFormData({
          transaction_ref: "",
          flutterwave_ref: "",
          customer_email: "",
          amount: "",
        });
      }
    } catch (error) {
      console.error("Recovery error:", error);

      if (error.response?.data?.orderDetails) {
        // Order already exists case
        setResult({
          type: "info",
          message: "🔄 Order Already Exists",
          details: `
Order Number: ${error.response.data.orderDetails.orderNumber}
Status: ${error.response.data.orderDetails.status}
Customer: ${error.response.data.orderDetails.customer}
Email: ${error.response.data.orderDetails.customerEmail}
Created: ${new Date(
            error.response.data.orderDetails.createdAt
          ).toLocaleString()}
Amount: ₦${error.response.data.orderDetails.totalAmount}

${error.response.data.action}
          `,
        });
      } else {
        setResult({
          type: "error",
          message: `❌ ${error.response?.data?.error || "Recovery failed"}`,
          details: Array.isArray(error.response?.data?.tips)
            ? "Tips:\n• " + error.response.data.tips.join("\n• ")
            : error.response?.data?.details || error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🛠️ Advanced Order Recovery
      </h2>

      {/* Search Method Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Method:
        </label>
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
              <div className="text-xs text-gray-500">
                From customer receipt (ECOSTORE-...)
              </div>
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
              <div className="text-xs text-gray-500">
                From webhook logs (JayyTech_...)
              </div>
            </span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ECOSTORE-1764348309107"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found on customer's receipt or bank alert notification
            </p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="JayyTech_PZBXZJ1764348466589204262"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in Flutterwave dashboard or webhook logs (starts with
              JayyTech_)
            </p>
          </div>
        )}

        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Charged *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="500"
              min="1"
              step="0.01"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? "🔍 Searching Payments..." : " Recover Order"}
        </button>
      </form>

      {/* Results Display */}
      {result && (
        <div
          className={`mt-6 p-4 rounded-md ${
            result.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : result.type === "info"
              ? "bg-blue-100 text-blue-800 border border-blue-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          <div className="font-semibold text-lg mb-2">{result.message}</div>
          {result.details && (
            <div className="mt-2 text-sm whitespace-pre-line font-mono">
              {result.details}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Support