import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore.js";
import { motion } from "framer-motion";

const CartItem = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCartStore();
   


  return (
    <motion.div
      className="px-1 lg:pr-28 text-lg "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="space-y-6">
        <div className="border rounded-lg p-4 bg-black text-gray-100">
          <div className="flex justify-between mb-2"></div>

          <ul className="space-y-4 mb-4">
            <li className="flex gap-4 p-4  bg-gradient-to-br from-white via-gray-100 to-gray-300 rounded-lg shadow">
              {/* Product Image */}
              <img
                src={item.images?.[0]}
                alt={item.name}
                className="w-23 h-23 object-cover rounded"
              />

              {/* Product Info */}
              <div className="flex-1 space-y-3">
                {/* Product Name & Total Price */}
                <div className="flex justify-between items-center">
                  <h3 className="text-black text-sm font-medium tracking-widest">
                    {item.name}
                  </h3>
                </div>

                {/* Extra Details (size, color, category) */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-100">
                  {item.size && (
                    <span className="bg-black px-2 py-1 rounded tracking-widest">
                      Size: {item.size}
                    </span>
                  )}

                  {item.color && (
                    <span className="bg-black px-2 py-1 rounded  tracking-widest">
                      Color: {item.color}
                    </span>
                  )}
                </div>

                {/* Quantity & Unit Price */}
                <div className="flex justify-between text-sm text-gray-300">
                  {/* quantity */}

                  <div className="bg-black px-2 py-1 rounded tracking-widest text-lg flex justify-between items-center gap-3">
                    <button
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-400  hover:bg-black/900 focus:outline-none focus:ring-2 "
                      onClick={() =>
                        updateQuantity(
                          item._id,
                          item.quantity - 1,
                          item.size,
                          item.color
                        )
                      }
                    >
                      <Minus className="text-gray-300 w-12 h-8 " />
                    </button>
                    <span> {item.quantity}</span>
                    <button
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-gray-400  hover:bg-black/900 focus:outline-none focus:ring-2 "
                      onClick={() =>
                        updateQuantity(
                          item._id,
                          item.quantity + 1,
                          item.size,
                          item.color
                        )
                      }
                    >
                      <Plus className="text-gray-300 w-4 h-4 " />
                    </button>
                  </div>

                  {item.quantity > 1 && (
                    <span className=" text-xs mt-2 text-gray-800">
                      ₦
                      {item.price.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}{" "}
                      each
                    </span>
                  )}
                </div>
              </div>
            </li>
          </ul>
          <div className="flex justify-between">
            <p className="text-gray-200 font-semibold tracking-widest">
              ₦
              {(item.price * item.quantity).toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </p>

            <button
              className="inline-flex items-center text-sm font-medium text-red-400 hover:text-red-300 hover:underline"
              onClick={() => removeFromCart(item._id, item.size, item.color)}
            >
              <Trash />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
