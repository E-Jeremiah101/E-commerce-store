// In OrderSummary.js - Fixed version
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { MoveRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore.js";
import toast from "react-hot-toast";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
const OrderSummary = () => {
  const { user, setUser } = useUserStore();
  const { total, subtotal, coupon, cart, isCouponApplied } = useCartStore();
  const [loading, setIsLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [backendDeliveryZone, setBackendDeliveryZone] = useState("");
  const [availabilityCheck, setAvailabilityCheck] = useState({
    allAvailable: true,
    unavailableItems: [],
    checked: false,
  });
  useEffect(() => {
    console.log(
      "🛒 Cart item structure:",
      cart.map((item) => ({
        name: item.name,
        keys: Object.keys(item),
        countInStock: item.countInStock,
        hasCountInStock: "countInStock" in item,
      }))
    );
  }, [cart]);

  // Calculate delivery fee based on user's address
  const { settings } = useStoreSettings();

  //  useEffect(() => {
  //    if (!user?.addresses?.length) return;

  //    const defaultAddress =
  //      user.addresses.find((a) => a.isDefault) || user.addresses[0];
  //    if (!defaultAddress) return;

  //    // Helper function to determine region
  //    const getRegionByState = (stateName) => {
  //      const regions = {
  //        SOUTH_SOUTH: [
  //          "Delta",
  //          "Edo",
  //          "Bayelsa",
  //          "Cross River",
  //          "Akwa Ibom",
  //          "Rivers",
  //        ],
  //        SOUTH_EAST: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  //        SOUTH_WEST: ["Lagos", "Ogun", "Ondo", "Osun", "Oyo", "Ekiti"],
  //        NORTH_CENTRAL: [
  //          "Benue",
  //          "Kogi",
  //          "Kwara",
  //          "Nasarawa",
  //          "Niger",
  //          "Plateau",
  //          "FCT",
  //        ],
  //        NORTH_EAST: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  //        NORTH_WEST: [
  //          "Jigawa",
  //          "Kaduna",
  //          "Kano",
  //          "Katsina",
  //          "Kebbi",
  //          "Sokoto",
  //          "Zamfara",
  //        ],
  //      };

  //      for (const [region, states] of Object.entries(regions)) {
  //        if (states.includes(stateName)) {
  //          return region;
  //        }
  //      }
  //      return null;
  //    };

  //    // Get admin's warehouse location (with defaults if not set)
  //    const adminWarehouse = settings?.warehouseLocation || {
  //      state: "Edo",
  //      city: "Benin City",
  //      lga: "Oredo",
  //    };

  //    const adminState = adminWarehouse.state || "Edo";
  //    const adminCity = adminWarehouse.city || "Benin City";
  //    const adminLGA = adminWarehouse.lga || "Oredo";

  //    const customerState = defaultAddress.state;
  //    const customerCity = defaultAddress.city || "";
  //    const customerLGA = defaultAddress.lga || "";

  //    let fee = 0;
  //    let zone = ""; // This will use the exact backend enum values

  //    // Use the shipping fees from settings (with defaults)
  //    const shippingFees = settings?.shippingFees || {
  //      sameCity: 500,
  //      sameLGA: 1000,
  //      sameState: 1500,
  //      sameRegion: 2500,
  //      southern: 3500,
  //      northern: 5000,
  //    };

  //    // 1. Same City (exact match or contains admin city name)
  //    if (
  //      customerState === adminState &&
  //      customerCity.toLowerCase().includes(adminCity.toLowerCase())
  //    ) {
  //      fee = shippingFees.sameCity;
  //      zone = "Same City"; // ✅ Exact backend enum value
  //    }
  //    // 2. Same LGA (different city but same LGA)
  //    else if (customerState === adminState && customerLGA === adminLGA) {
  //      fee = shippingFees.sameLGA || shippingFees.sameState;
  //      zone = "Same LGA"; // ✅ Exact backend enum value
  //    }
  //    // 3. Same State (different LGA)
  //    else if (customerState === adminState) {
  //      fee = shippingFees.sameState;
  //      zone = "Same State"; // ✅ Exact backend enum value
  //    }
  //    // 4. Same Region (based on Nigerian geopolitical zones)
  //    else {
  //      const adminRegion = getRegionByState(adminState);
  //      const customerRegion = getRegionByState(customerState);

  //      if (adminRegion && customerRegion && adminRegion === customerRegion) {
  //        fee = shippingFees.sameRegion;
  //        zone = "Same Region"; // ✅ Exact backend enum value
  //      }
  //      // 5. Southern States (South-South, South-East, South-West)
  //      else if (
  //        customerRegion &&
  //        ["SOUTH_SOUTH", "SOUTH_EAST", "SOUTH_WEST"].includes(customerRegion)
  //      ) {
  //        fee = shippingFees.southern;
  //        zone = "Southern Region"; // ✅ Exact backend enum value
  //      }
  //      // 6. Northern States
  //      else {
  //        fee = shippingFees.northern;
  //        zone = "Northern Region"; // ✅ Exact backend enum value
  //      }
  //    }

  //    setDeliveryFee(fee);
  //    setDeliveryZone(zone);

  //    console.log("📦 Dynamic Delivery Calculation:", {
  //      adminWarehouse,
  //      customerAddress: defaultAddress,
  //      calculatedFee: fee,
  //      zone,
  //    });
  //  }, [user, settings]);

  // In OrderSummary.js - Update the delivery calculation useEffect
  useEffect(() => {
    if (!user?.addresses?.length || !settings) return;

    const defaultAddress =
      user.addresses.find((a) => a.isDefault) || user.addresses[0];
    if (!defaultAddress) return;

    // Helper function to get region by state
    const getRegionByState = (stateName) => {
      const regions = {
        SOUTH_SOUTH: [
          "DELTA",
          "EDO",
          "BAYELSA",
          "CROSS_RIVER",
          "AKWA_IBOM",
          "RIVERS",
        ],
        SOUTH_EAST: ["ABIA", "ANAMBRA", "EBONYI", "ENUGU", "IMO"],
        SOUTH_WEST: ["LAGOS", "OGUN", "ONDO", "OSUN", "OYO", "EKITI"],
        NORTH_CENTRAL: [
          "BENUE",
          "KOGI",
          "KWARA",
          "NASARAWA",
          "NIGER",
          "PLATEAU",
          "FCT",
        ],
        NORTH_EAST: ["ADAMAWA", "BAUCHI", "BORNO", "GOMBE", "TARABA", "YOBE"],
        NORTH_WEST: [
          "JIGAWA",
          "KADUNA",
          "KANO",
          "KATSINA",
          "KEBBI",
          "SOKOTO",
          "ZAMFARA",
        ],
      };

      for (const [region, states] of Object.entries(regions)) {
        if (states.includes(stateName.toUpperCase())) {
          return region;
        }
      }
      return null;
    };

    // Get admin's warehouse location
    const adminWarehouse = settings?.warehouseLocation || {
      state: "EDO",
      city: "Benin City",
      lga: "Oredo",
    };

    const adminState = adminWarehouse.state || "EDO";
    const adminLGA = adminWarehouse.lga || "Oredo";

    const customerState = defaultAddress.state;
    const customerLGA = defaultAddress.lga;

    let fee = 0;
    let zone = "";

    const shippingFees = settings?.shippingFees || {
      sameCity: 500,
      sameLGA: 1000,
      sameState: 1500,
      sameRegion: 2500,
      southern: 3500,
      northern: 5000,
    };

    // 1. Same LGA (most precise - auto-derived from city)
    if (
      customerState.toUpperCase() === adminState.toUpperCase() &&
      customerLGA === adminLGA
    ) {
      fee = shippingFees.sameCity;
      zone = "Same City";
    }
    // 2. Same State, different LGA
    else if (customerState.toUpperCase() === adminState.toUpperCase()) {
      fee = shippingFees.sameState;
      zone = "Same State";
    }
    // 3. Same Region
    else {
      const adminRegion = getRegionByState(adminState);
      const customerRegion = getRegionByState(customerState);

      if (adminRegion && customerRegion && adminRegion === customerRegion) {
        fee = shippingFees.sameRegion;
        zone = "Same Region";
      }
      // 4. Southern States
      else if (
        customerRegion &&
        ["SOUTH_SOUTH", "SOUTH_EAST", "SOUTH_WEST"].includes(customerRegion)
      ) {
        fee = shippingFees.southern;
        zone = "Southern Region";
      }
      // 5. Northern States
      else {
        fee = shippingFees.northern;
        zone = "Northern Region";
      }
    }

    setDeliveryFee(fee);
    setDeliveryZone(zone);

    console.log("📦 Delivery Calculation:", {
      warehouse: adminWarehouse,
      customer: defaultAddress,
      calculatedFee: fee,
      zone,
    });
  }, [user, settings]);
  const finalDeliveryFee = deliveryFee;
  const newTotal =
    subtotal -
    (coupon && isCouponApplied
      ? subtotal * (coupon.discountPercentage / 100)
      : 0);
  const grandTotal = newTotal + finalDeliveryFee;

  // Add one-click protection
  const isProcessing = useRef(false);

  // Fetch fresh profile when OrderSummary mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/users/profile");
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
      // Check which items are out of stock
      const unavailableItems = cart.filter((item) => {
        // Handle various possible stock properties
        const stock =
          item.countInStock || item.stock || item.quantityAvailable || 0;
        return stock === 0 || stock === "0" || !stock;
      });

      // Check if ANY items are out of stock (not just ALL)
      const hasOutOfStockItems = unavailableItems.length > 0;

      // Check if ANY items are in stock
      const hasInStockItems = cart.some((item) => {
        const stock =
          item.countInStock || item.stock || item.quantityAvailable || 0;
        return stock > 0;
      });

      console.log("📊 Stock check results:", {
        cartLength: cart.length,
        unavailableItemsCount: unavailableItems.length,
        hasOutOfStockItems,
        hasInStockItems,
        cartItems: cart.map((item) => ({
          name: item.name,
          stock: item.countInStock,
          hasStock: item.countInStock > 0,
        })),
      });

      setAvailabilityCheck({
        hasOutOfStockItems,
        hasInStockItems,
        unavailableItems,
        checked: true,
      });
    } else {
      setAvailabilityCheck({
        hasOutOfStockItems: false,
        hasInStockItems: false,
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
    if (availabilityCheck.checked && !availabilityCheck.hasInStockItems) {
      toast.error(
        "All items in your cart are out of stock. Please remove them before checkout."
      );
      return;
    }

    const anyItemsInStock = cart.some((item) => {
      const stock =
        item.countInStock || item.stock || item.quantityAvailable || 0;
      return stock > 0;
    });

    if (!anyItemsInStock) {
      toast.error("Cannot proceed: All items in your cart are out of stock.");
      return;
    }

    try {
      // Set processing flag immediately
      isProcessing.current = true;
      setIsLoading(true);

      console.log("🔄 Proceeding with payment...");

      const defaultAddressObj =
        user.addresses.find((a) => a.isDefault) || user.addresses[0];

      // Proceed with payment - backend will handle availability checks
      const res = await axios.post("/payments/flutterwave-pay", {
        products: cart,
        user,
        couponCode: coupon ? coupon.code : null,
        deliveryAddress: defaultAddressObj,
        deliveryFee: finalDeliveryFee,
        deliveryZone: deliveryZone,
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
  const formattedSubtotal = subtotal;
  const formattedSavings = savings;

  const isButtonDisabled = () => {
    // If no items in cart
    if (cart.length === 0) {
      console.log("❌ Button disabled: Cart is empty");
      return true;
    }

    // If NO items have stock (all are out of stock)
    if (availabilityCheck.checked && !availabilityCheck.hasInStockItems) {
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

    // Additional safety check
    const anyItemsInStock = cart.some((item) => {
      const stock =
        item.countInStock || item.stock || item.quantityAvailable || 0;
      return stock > 0;
    });

    if (!anyItemsInStock) {
      console.log("❌ Button disabled: Safety check - no items in stock");
      return true;
    }

    console.log("✅ Button enabled - has items with stock");
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
            <dt className="text-base font-normal text-gray-600">Sub-Total</dt>
            <dt className="text-sm font-medium text-black">
              {formatPrice(Math.round(formattedSubtotal, settings?.currency))}
            </dt>
          </dl>

          {coupon && isCouponApplied && (
            <dl className="flex items-center justify-between gap-4">
              <dt className="text-base font-normal text-gray-600">Savings</dt>
              <dt className="text-base font-medium text-black">
                {formatPrice(Math.round(formattedSavings, settings?.currency))}
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

          {/* Delivery Fee */}
          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-600">Shipping</dt>
            <dd
              className="text-base font-medium  text-black
              "
            >
              {formatPrice(finalDeliveryFee, settings?.currency)}
            </dd>
          </dl>

          <dl className="flex items-center justify-between gap-4">
            <dt className="text-base font-normal text-gray-600">Total </dt>
            <dt className="text-lg font-medium text-black-">
              {formatPrice(Math.round(grandTotal, settings?.currency))}
            </dt>
          </dl>
        </div>

        {/* FIXED: Show warning if SOME items are out of stock (but not all) */}
        {availabilityCheck.checked &&
          availabilityCheck.unavailableItems.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              <AlertTriangle size={16} />
              <div>
                <p className="font-medium">
                  {availabilityCheck.unavailableItems.length} item(s) out of
                  stock
                </p>
                <p className="text-xs mt-1">
                  {availabilityCheck.hasInStockItems
                    ? "You can still checkout with available items"
                    : "All items are out of stock - please remove them to continue"}
                </p>
              </div>
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
          ) : !defaultPhone || !defaultAddress ? (
            <>Update Info to Checkout</>
          ) : !availabilityCheck.hasInStockItems ? (
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
              <Link to="/Personal-info" className=" underline">
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
