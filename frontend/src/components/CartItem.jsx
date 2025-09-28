import React from "react";
import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore.js";

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCartStore();

  return (
    <div className="rounded-lg border p-4 shadow-sm border-black bg-black md:p-6">
      <div className="space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0 ">
        {/* Product Image */}
        <div className="shrink-0 md:order-1">
          <img
            className="h-20 md:h-32 rounded object-cover"
            src={item.image}
            alt={item.name}
          />
        </div>

        {/* Product Info */}
        <div className="inline-block w-full min-w-0 flex-1 space-y-2 md:order-2 md:max-w-md">
          <p className="text-base font-medium text-white hover:text-emerald-400 hover:underline tracking-widest">
            {item.name}
          </p>
          <p className="text-sm text-gray-400 tracking-widest">
            {item.description}
          </p>

          {/* Size and Color */}
          <div className="flex gap-4 text-sm text-gray-300 tracking-widest">
            {item.size && <span>Size: {item.size}</span>}
            {item.color && <span>Color: {item.color}</span>}
          </div>

          <div className="flex items-center gap-4 mt-5">
            <button
              className="inline-flex items-center text-sm font-medium text-red-400 hover:text-red-300 hover:underline"
              onClick={() => removeFromCart(item._id, item.size, item.color)}
            >
              <Trash />
            </button>
          </div>
        </div>

        {/* Quantity + Price */}
        <div className="flex items-center justify-between md:order-3 md:justify-end w-full md:w-auto gap-6">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() =>
                updateQuantity(
                  item._id,
                  item.quantity - 1,
                  item.size,
                  item.color
                )
              }
            >
              <Minus className="text-gray-300 w-4 h-4" />
            </button>

            <p className="text-white font-medium">{item.quantity}</p>

            <button
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() =>
                updateQuantity(
                  item._id,
                  item.quantity + 1,
                  item.size,
                  item.color
                )
              }
            >
              <Plus className="text-gray-300 w-4 h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="text-end md:order-4 md:w-40">
            <p className="text-base font-bold text-yellow-100">
              ₦{" "}
              {(item.price * item.quantity).toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </p>

            {/* Show unit price only if quantity > 1 */}
            {item.quantity > 1 && (
              <p className="text-sm text-gray-300">
                ₦
                {item.price.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                })}{" "}
                each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
