// In OrderSummary.js - Fixed version
import React, { useEffect, useState, useRef } from "react";
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

  // Add one-click protection
  const isProcessing = useRef(false);

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

  useEffect(() => {
    console.log("🛒 Current cart items:", cart);
    console.log(
      "🛒 Cart item details:",
      cart.map((item) => ({
        id: item._id,
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        countInStock: item.countInStock,
      }))
    );
  }, [cart]);

  // FIXED: Check cart availability when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      // Debug log to see what's in cart
      console.log("🔍 Checking cart availability:", cart);

      // Check if ALL items are out of stock - more defensive check
      const allOutOfStock = cart.every((item) => {
        // Handle various possible stock properties
        const stock =
          item.countInStock || item.stock || item.quantityAvailable || 0;
        return stock === 0 || stock === "0" || !stock;
      });

      // Check if any items are out of stock
      const unavailableItems = cart.filter((item) => {
        const stock =
          item.countInStock || item.stock || item.quantityAvailable || 0;
        return stock === 0 || stock === "0" || !stock;
      });

      console.log("📊 Stock check results:", {
        cartLength: cart.length,
        allOutOfStock,
        unavailableItemsCount: unavailableItems.length,
        firstItem: cart[0]
          ? {
              name: cart[0].name,
              hasCountInStock: "countInStock" in cart[0],
              countInStock: cart[0].countInStock,
              allKeys: Object.keys(cart[0]),
            }
          : null,
      });

      setAvailabilityCheck({
        allAvailable: !allOutOfStock, // true if NOT all items are out of stock
        unavailableItems,
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
  // Reset processing state when component unmounts or cart changes
  useEffect(() => {
    return () => {
      isProcessing.current = false;
    };
  }, [cart]);

  const handlePayment = async () => {
    // One-click protection
    if (isProcessing.current) {
      console.log("🛑 Payment already processing, ignoring click");
      return;
    }

    if (!defaultPhone || !defaultAddress) {
      alert(
        "Please provide a phone number and address before checkout. Please update your Profile Page."
      );
      return;
    }

    // FIXED: Prevent checkout when ALL items are out of stock
    if (availabilityCheck.checked && !availabilityCheck.allAvailable) {
      toast.error(
        "All items in your cart are out of stock. Please remove them before checkout."
      );
      return;
    }

    try {
      // Set processing flag immediately
      isProcessing.current = true;
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
        // Success - redirect to payment
        console.log("✅ Payment initialized, redirecting...");
        window.location.href = link;
      } else {
        toast.error("Unable to initialize payment. Please try again.");
        // Reset processing state on error
        isProcessing.current = false;
      }
    } catch (error) {
      console.error("❌ Payment initialization failed:", error);

      // Reset processing state on error
      isProcessing.current = false;

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

  // FIXED: hasUnavailableItems should be true when ALL items are out of stock
  // (not when SOME items are out of stock - which your requirement allows)
  const hasUnavailableItems =
    availabilityCheck.checked && !availabilityCheck.allAvailable; // This means ALL items are out of stock

  console.log("🔄 Availability state:", {
    hasUnavailableItems,
    allAvailable: availabilityCheck.allAvailable,
    unavailableCount: availabilityCheck.unavailableItems.length,
    checked: availabilityCheck.checked,
    cartLength: cart.length,
    cartDetails: cart.map((item) => ({
      name: item.name,
      inStock: item.countInStock > 0,
      countInStock: item.countInStock,
    })),
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

  // Determine if button should be disabled
const isButtonDisabled = () => {
  // If no items in cart
  if (cart.length === 0) {
    console.log("❌ Button disabled: Cart is empty");
    return true;
  }

  // If availability check says all items are out of stock
  if (availabilityCheck.checked && !availabilityCheck.allAvailable) {
    console.log("❌ Button disabled: All items out of stock");
    return true;
  }

  // If missing contact info
  if (!defaultPhone || !defaultAddress) {
    console.log("❌ Button disabled: Missing contact info");
    return true;
  }

  // If loading
  if (loading || isProcessing.current) {
    console.log("❌ Button disabled: Processing");
    return true;
  }

  // Safety check: manually verify ALL items are actually out of stock
  const allItemsOutOfStock = cart.every((item) => {
    const stock =
      item.countInStock || item.stock || item.quantityAvailable || 0;
    return stock === 0 || stock === "0" || !stock;
  });

  if (allItemsOutOfStock) {
    console.log("❌ Button disabled: Manual check - all items out of stock");
    return true;
  }

  console.log("✅ Button enabled");
  return false;
};

// Use the function
const buttonDisabled = isButtonDisabled();

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

        {/* FIXED: Show warning if SOME items are out of stock (but not all) */}
        {availabilityCheck.checked &&
          availabilityCheck.unavailableItems.length > 0 &&
          availabilityCheck.allAvailable && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              <AlertTriangle size={16} />
              <span>
                Some items in your cart are out of stock. Please remove to
                proceed
              </span>
            </div>
          )}

        <motion.button
          className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white ${
            buttonDisabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black/90 hover:bg-black/80"
          } disabled:opacity-50`}
          whileHover={!buttonDisabled ? { scale: 1.05 } : {}}
          whileTap={!buttonDisabled ? { scale: 0.95 } : {}}
          onClick={handlePayment}
          disabled={buttonDisabled}
        >
          {loading || isProcessing.current ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : cart.length === 0 ? (
            <>Cart is Empty</>
          ) : buttonDisabled && !defaultPhone && !defaultAddress ? (
            <>Proceed to Checkout</>
          ) : buttonDisabled ? (
            <>All Items Out of Stock</>
          ) : (
            <>
              Proceed to Checkout
              <MoveRight className="ml-2" size={16} />
            </>
          )}
        </motion.button>

        {(!defaultPhone || !defaultAddress) && (
          <>
            <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              <AlertTriangle size={16} />
              <Link
              to="/Personal-info"
              className=" underline"
            >
              <span>
                Please provide a <strong>valid phone number</strong> and{" "}
                <strong>address</strong> before checkout.
              </span>
              </Link>
            </div>
            
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
