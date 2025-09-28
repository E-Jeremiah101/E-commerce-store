import React, {useEffect} from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { MoveRight } from "lucide-react";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";


const OrderSummary = () => {
  const { user, setUser } = useUserStore();
  const stripePromise = loadStripe(
    "pk_test_51S3kJFJ8hCAIqKl90xm7Qf4GnPFdQC7HL0lLeIOpRxQcBFRUfcsjnNSVYCk5pddXPOadHQPjKqEeWv5C98VMT5ZL00QiKbylbA"
  );
  const { total, subtotal, coupon, cart, isCouponApplied } = useCartStore();

  const savings = subtotal - total;
  const formattedSubtotal = subtotal.toLocaleString(undefined, {
    minimumFractionDigits: 0,
  });
  const formattedTotal = total.toLocaleString(undefined, {
    minimumFractionDigits: 0,
  });
  const formattedSavings = savings.toLocaleString(undefined, {
    minimumFractionDigits: 0,
  });

  // Fetch fresh profile when OrderSummary mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/users/me");
        setUser(data);
      } catch (err) {
        console.error("Error refreshing user:", err);
      }
    };
    fetchUser();
  }, [setUser]);

  const defaultPhone = user?.phones?.find((p) => p.isDefault)?.number || "";
  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault)?.address || "";


  const handlePayment = async () => {
    if (!defaultPhone || !defaultAddress) {
      alert(
        "⚠️ You must add a phone number and address before checkout. Please update your Personal Information Page."
      );
      return;
    }
    const stripe = await stripePromise;
    const res = await axios.post("/payments/create-checkout-session", {
      products: cart,
      couponCode: coupon ? coupon.code : null,
    });

    const session = res.data;
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });
    if (result.error) {
      console.error("Error:", result.error);
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-black bg-black p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-white tracking-widest">Order summary</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">
              Original price
            </dt>
            <dt className="text-sm font-medium text-white">
              ₦ {formattedSubtotal}
            </dt>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-300">Savings</dt>
              <dt className="text-base font-medium text-white">
                ₦ {formattedSavings}
              </dt>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-white">
                Coupon ({coupon.code})
              </dt>
              <dt className="text-base font-medium text-white">
                -{coupon.discountPercentage}%
              </dt>
            </dl>
          )}
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-300">Total </dt>
            <dt className="text-lg font-medium text-yellow-100">
              ₦ {formattedTotal}
            </dt>
          </dl>
        </div>

        <motion.button
          className="flex w-full items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-300 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          disabled={!defaultPhone || !defaultAddress}
        >
          Proceed to Checkout
        </motion.button>
        {(!defaultPhone || !defaultAddress) && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-3">
            ⚠️ You must add a <strong>phone number</strong> and{" "}
            <strong>address</strong> before checkout. <br />
            <Link to="/Personal-info" className="text-white underline">
              Update your Personal Information
            </Link>
          </div>
        )}
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-white">Address:</dt>
            <dt
              className="text-xs font-thin text-gray-100 truncate"
              title={defaultAddress}
            >
              {defaultAddress}
            </dt>
          </dl>
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-white">Phone:</dt>
            <dt className="text-sm font-thin text-gray-100">{defaultPhone}</dt>
          </dl>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-normal text-gray-400">or</span>
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-white underline hover:text-gray-300 hover:no-underline">
            Continue Shopping
            <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
