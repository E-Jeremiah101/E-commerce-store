import { ArrowRight, CheckCircle, HandHeart, RefreshCw } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(null);
  const [error, setError] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const { clearCart } = useCartStore();
  const navigate = useNavigate();
  const hasProcessed = useRef(false); // Prevent duplicate processing

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transaction_id = params.get("transaction_id");
    const tx_ref = params.get("tx_ref");
    const status = params.get("status");

    const hasPaymentAttempt = tx_ref && tx_ref.includes("ECOSTORE");

    if (!hasPaymentAttempt) {
      console.log("❌ No payment attempt detected");
      navigate("/purchase-cancel");
      return;
    }

    const shouldProceed = status === "successful" || hasPaymentAttempt;

    if (!shouldProceed || !transaction_id) {
      console.log("❌ Missing required parameters");
      navigate("/purchase-cancel");
      return;
    }

    // Prevent duplicate processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // Proceed with verification
    const handleCheckoutSuccess = async (transaction_id, tx_ref) => {
      try {
        const response = await axios.post("/payments/checkout-success", {
          transaction_id,
          tx_ref,
        });

        console.log("🔍 Backend response:", response.data);

        // ✅ FIX: Check if the request was actually successful
        if (response.data.success) {
          // Order completed successfully
          clearCart();
          setOrderNumber(response.data.orderNumber);
          setEstimatedDeliveryDate(response.data.estimatedDeliveryDate);
          setIsProcessing(false);

          // Clean up URL
          const url = new URL(window.location);
          url.searchParams.delete("transaction_id");
          url.searchParams.delete("tx_ref");
          url.searchParams.delete("status");
          window.history.replaceState({}, document.title, url);
        } else {
          // ❌ Backend says order is still processing or lock is busy
          // Wait longer and retry instead of immediate refresh
          console.log("Order still processing, waiting...");
          setTimeout(() => {
            handleCheckoutSuccess(transaction_id, tx_ref); // Retry same function
          }, 3000); // Wait 3 seconds before retry
        }
      } catch (error) {
        console.error("Verification failed:", error);
        setError("Could not verify payment. Please contact support.");
        setIsProcessing(false);
      }
    };

    handleCheckoutSuccess(transaction_id, tx_ref);
  }, [navigate, clearCart]);

  // Loading state
  if (isProcessing)
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-700">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Processing your order...</p>
          <p className="text-sm text-gray-400 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );

  // ❌ Error state
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-700 px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden p-6 text-center">
          <RefreshCw className="text-yellow-400 w-16 h-16 mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-yellow-400 mb-4">
            Verification Issue
          </h2>
          <p className="text-gray-300 mb-2">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 rounded-lg transition duration-300 block text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );

  // ✅ Success state
  return (
    <div className="h-screen w-screen bg-gray-700 flex items-center justify-center px-4 relative">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.1}
        style={{ zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />

      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center">
            <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2">
            Purchase Successful!
          </h1>

          <p className="text-gray-300 text-center mb-2">
            Thank you for your order on Eco~Store!
          </p>

          <p className="text-emerald-400 text-center text-sm mb-6">
            Your order was successfully submitted. You will receive a
            confirmation email about your order. Please check your inbox for
            updates.
          </p>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Order number</span>
              <span className="text-sm font-semibold text-emerald-400">
                {orderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Estimated delivery</span>
              <span className="text-sm font-semibold text-emerald-400">
                {estimatedDeliveryDate
                  ? new Date(estimatedDeliveryDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "Calculating..."}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4
             rounded-lg transition duration-300 flex items-center justify-center"
            >
              <HandHeart className="mr-2" size={18} />
              Thanks for trusting us!
            </button>

            <Link
              to="/"
              className="w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 
            rounded-lg transition duration-300 flex items-center justify-center"
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;
