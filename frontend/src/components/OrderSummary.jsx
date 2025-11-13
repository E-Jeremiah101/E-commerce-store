import React, { useEffect, useState } from "react";
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
  const [loading, setIsLoading] = useState(false)

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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border-1 border-gray-500  p-4 shadow-sm sm:p-6 lg:px-5 "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-black tracking-widest">
        Order summary
      </p>

      <div className="space-y-4">
        <div className="space-y-2 ">
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-600">
              Original price
            </dt>
            <dt className="text-sm font-medium text-black">
              ₦{formattedSubtotal}
            </dt>
          </dl>

          {savings > 0 && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-600">Savings</dt>
              <dt className="text-base font-medium text-black">
                ₦{formattedSavings}
              </dt>
            </dl>
          )}

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-600">
                Coupon ({coupon.code})
              </dt>
              <dt className="text-base font-medium text-red-500">
                -{coupon.discountPercentage}%
              </dt>
            </dl>
          )}

          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-600">Total </dt>
            <dt className="text-lg font-medium text-black-">
              ₦{formattedTotal}
            </dt>
          </dl>
        </div>

        <motion.button
          className="flex w-full items-center justify-center rounded-lg  bg-black/90 px-5 py-2.5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePayment}
          disabled={!defaultPhone || !defaultAddress || loading}
        >
          {loading ? <>Processing...</> : <>Proceed to Checkout</>}
        </motion.button>

        {(!defaultPhone || !defaultAddress) && (
          <>
            <div className=" text-black p-3 rounded-md text-sm mb-3">
              Please provide a <strong>valid phone number</strong> and{" "}
              <strong>address</strong> before checkout.
              <br />
            </div>
            <Link to="/Personal-info" className="text-black underline">
              Update your Profile
            </Link>
          </>
        )}
        {(defaultPhone || defaultAddress) && (
          <>
            <div className=" space-y-2">
              <dl className="flex items-center justify-between gap-4">
                <dt className="text-base font-normal text-gray-600">Address:</dt>
                <dt
                  className="text-xs font-thin text-black truncate"
                  title={defaultAddress}
                >
                  {defaultAddress}
                </dt>
              </dl>
              <dl className="flex items-center justify-between gap-4">
                <dt className="text-base font-normal text-gray-600">Phone:</dt>
                <dt className="text-sm font-thin text-black">
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
