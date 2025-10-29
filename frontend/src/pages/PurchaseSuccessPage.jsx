import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState(null);
  const { clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transaction_id = params.get("transaction_id");
    const tx_ref = params.get("tx_ref");
    const status = params.get("status");

    // Redirect if failed or missing details
    if (status !== "successful" || !transaction_id) {
      navigate("/purchase-cancel");
      return;
    }

    // Proceed with verification
    const handleCheckoutSuccess = async (transaction_id, tx_ref) => {
      try {
        const response = await axios.post("/payments/checkout-success", {
          transaction_id,
          tx_ref,
        });

        clearCart();
        setOrderNumber(response.data.orderNumber);

        // Clean up URL
        const url = new URL(window.location);
        url.searchParams.delete("transaction_id");
        url.searchParams.delete("tx_ref");
        url.searchParams.delete("status");
        window.history.replaceState({}, document.title, url);
      } catch (error) {
        console.error("Verification failed:", error);
        setError("Could not verify payment. Please contact support.");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCheckoutSuccess(transaction_id, tx_ref);
  }, [navigate, clearCart]);

  // 🌀 Loading state
  if (isProcessing)
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-700">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );

  // ❌ Error state
  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-400 text-lg">
        <p>{error}</p>
        <Link
          to="/purchase-cancel"
          className="mt-4 underline text-emerald-400 hover:text-emerald-300"
        >
          Go to Cancel Page
        </Link>
      </div>
    );

  //  Success state
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
            Congratulations! Your order was successfully submitted. You will
            receive a confirmation email or SMS about your order. Please check
            your inbox for updates.
          </p>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Order number</span>
              <span className="text-sm font-semibold text-emerald-400">
                {orderNumber || "Processing..."}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Estimated delivery</span>
              <span className="text-sm font-semibold text-emerald-400">
                3–5 business days
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
