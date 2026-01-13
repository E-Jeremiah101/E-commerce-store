import React from "react";
import { Link } from "react-router-dom";

import { useCartStore } from "../stores/useCartStore";
import { formatPrice } from "../utils/currency";
import { ShoppingCart } from "lucide-react";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const MiniCartWidget = () => {
  const { cart, total } = useCartStore();
  const { settings } = useStoreSettings();
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cart.length === 0) return null;

  return (
    <div className="fixed z-50 bottom-6 right-6 md:bottom-8 md:right-8 bg-white/90 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-4 backdrop-blur-md animate-fade-in-up">
      <ShoppingCart className="text-blue-600" size={28} />
      <div className="flex flex-col">
        <span className="text-base font-semibold text-gray-900">
          {itemCount} item{itemCount > 1 ? "s" : ""} in cart
        </span>
        <span className="text-sm text-gray-500">
          Subtotal: {formatPrice(total, settings?.currency || "NGN")}
        </span>
      </div>
      <Link
        to="/cart"
        className="ml-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition-colors"
      >
        View Cart
      </Link>
    </div>
  );
};

export default MiniCartWidget;
