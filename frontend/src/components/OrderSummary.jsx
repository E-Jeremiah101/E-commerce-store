import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { MoveRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

const OrderSummary = () => {
  const { user, setUser } = useUserStore();
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
  const defaultAddressObj = user?.addresses?.find((a) => a.isDefault);

  const defaultAddress = defaultAddressObj
    ? `${defaultAddressObj.landmark ? defaultAddressObj.landmark + ", " : ""}${
        defaultAddressObj.lga ? defaultAddressObj.lga + ", " : ""
      }${defaultAddressObj.city ? defaultAddressObj.city + ", " : ""}${
        defaultAddressObj.state || ""
      }`
    : "";

  const handlePayment = async () => {
    if (!defaultPhone || !defaultAddress) {
      alert(
        "Please provide a phone number and address before checkout. Please update your Profile Page."
      );
      return;
    }

    try {
      const res = await axios.post("/payments/flutterwave-pay", {
        products: cart,
        user,
        couponCode: coupon ? coupon.code : null,
      });

      const { link } = res.data;
      if (link) {
        // Redirect user to Flutterwave payment page
        window.location.href = link;
      } else {
        alert("Unable to initialize payment. Please try again.");
      }
    } catch (error) {
      console.error("Payment initialization failed:", error);
      alert("Payment initialization failed. Please try again.");
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-800 bg-black p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-white tracking-widest">
        Order summary
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-200">
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
            <dt className="text-base font-normal text-gray-200">Total </dt>
            <dt className="text-lg font-medium text-yellow-100">
              ₦ {formattedTotal}
            </dt>
          </dl>
        </div>

        <motion.button
          className="flex w-full items-center justify-center rounded-lg  bg-gradient-to-br from-white via-gray-100 to-gray-300 px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-300 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          disabled={!defaultPhone || !defaultAddress}
        >
          Proceed to Checkout
        </motion.button>

        {(!defaultPhone || !defaultAddress) && (
          <>
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-3">
              Please provide a <strong>valid phone number</strong> and{" "}
              <strong>address</strong> before checkout.
              <br />
            </div>
            <Link to="/Personal-info" className="text-white underline">
              Update your Profile
            </Link>
          </>
        )}
        {(defaultPhone || defaultAddress) && (
          <>
            <div className=" space-y-2">
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
                <dt className="text-sm font-thin text-gray-100">
                  {defaultPhone}
                </dt>
              </dl>
            </div>
          </>
        )}

        <div className="hidden space-y-2">
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

        <div className="flex items-center justify-between gap-2"></div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;
