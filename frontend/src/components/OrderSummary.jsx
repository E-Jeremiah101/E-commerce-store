// In OrderSummary.js - Fixed version
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { MoveRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";
import { useProductStore } from "../stores/useProductStore";
import toast from "react-hot-toast";

const OrderSummary = () => {
  const { user, setUser } = useUserStore();
  const { total, subtotal, coupon, cart, isCouponApplied } = useCartStore();
  const { checkCartAvailability } = useProductStore();

  const [loading, setIsLoading] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState({
    allAvailable: true,
    unavailableItems: [],
    checked: false,
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

  // Check cart availability when cart changes
  useEffect(() => {
    // Just set as available since backend will handle the real check
    if (cart.length > 0) {
      setAvailabilityCheck({
        allAvailable: true,
        unavailableItems: [],
        checked: true,
      });
    } else {
      setAvailabilityCheck({
        allAvailable: true,
        unavailableItems: [],
        checked: false,
      });
    }
  }, [cart]);

  // In OrderSummary.js - Simplify the handlePayment function
  const handlePayment = async () => {
    if (!defaultPhone || !defaultAddress) {
      alert(
        "Please provide a phone number and address before checkout. Please update your Profile Page."
      );
      return;
    }

    try {
      setIsLoading(true);

      console.log("🔄 Proceeding with payment...");

      // Proceed with payment - backend will handle availability checks
      const res = await axios.post("/payments/flutterwave-pay", {
        products: cart,
        user,
        couponCode: coupon ? coupon.code : null,
      });

      const { link } = res.data;
      if (link) {
        window.location.href = link;
      } else {
        toast.error("Unable to initialize payment. Please try again.");
      }
    } catch (error) {
      console.error("❌ Payment initialization failed:", error);

      // Handle specific error messages from backend
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.response?.data?.message) {
        console.log(error.response.data.message);
      } else {
        toast.error("Payment initialization failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fix the logic here - only show unavailable if we have checked AND there are actually unavailable items
  const hasUnavailableItems =
    availabilityCheck.checked &&
    !availabilityCheck.allAvailable &&
    availabilityCheck.unavailableItems.length > 0;

  console.log("🔄 Availability state:", {
    hasUnavailableItems,
    allAvailable: availabilityCheck.allAvailable,
    unavailableCount: availabilityCheck.unavailableItems.length,
    checked: availabilityCheck.checked,
    cartLength: cart.length,
  });

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

  return (
    <motion.div
      className="space-y-4 rounded-lg border-1 border-gray-500 p-4 shadow-sm sm:p-6 lg:px-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-xl font-semibold text-black tracking-widest">
        Order summary
      </p>
    

      <div className="space-y-4">
        <div className="space-y-2">
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
          className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white ${
            hasUnavailableItems || !defaultPhone || !defaultAddress
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black/90 hover:bg-black/80"
          } disabled:opacity-50`}
          whileHover={
            !hasUnavailableItems && defaultPhone && defaultAddress
              ? { scale: 1.05 }
              : {}
          }
          whileTap={
            !hasUnavailableItems && defaultPhone && defaultAddress
              ? { scale: 0.95 }
              : {}
          }
          onClick={handlePayment}
          disabled={
            hasUnavailableItems || !defaultPhone || !defaultAddress || loading
          }
        >
          {loading ? (
            <>Processing...</>
          ) : hasUnavailableItems ? (
            <>Unavailable Items in Cart</>
          ) : (
            <>Proceed to Checkout</>
          )}
        </motion.button>

        {(!defaultPhone || !defaultAddress) && (
          <>
            <div className="text-black p-3 rounded-md text-sm mb-3">
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
            <div className="space-y-2">
              <dl className="flex items-center justify-between gap-4">
                <dt className="text-base font-normal text-gray-600">
                  Address:
                </dt>
                <dt
                  className="text-xs font-thin text-black truncate"
                  title={defaultAddress}
                >
                  {defaultAddress}
                </dt>
              </dl>
              <dl className="flex items-center justify-between gap-4">
                <dt className="text-base font-normal text-gray-600">Phone:</dt>
                <dt className="text-sm font-thin text-black">{defaultPhone}</dt>
              </dl>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default OrderSummary;
