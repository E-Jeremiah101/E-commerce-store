// In CartItem.js - Update stock display
import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore.js";
import { useProductStore } from "../stores/useProductStore.jsx";
import { motion } from "framer-motion";
import { useEffect, useState } from "react"; 
import { Link } from "react-router-dom";

const CartItem = ({ item, product }) => {
  const { removeFromCart, updateQuantity } = useCartStore();
  const { fetchVariantStock } = useProductStore(); // ADD THIS
  const [availableStock, setAvailableStock] = useState(item.countInStock || 0); // ADD STATE

  // Fetch current variant stock when component mounts
  useEffect(() => {
    const getCurrentStock = async () => {
      try {
        const stock = await fetchVariantStock(item._id, item.size, item.color);
        setAvailableStock(stock);
      } catch (error) {
        console.error("Error fetching current stock:", error);
      }
    };

    getCurrentStock();
  }, [item._id, item.size, item.color, fetchVariantStock]);

  const canIncrease = item.quantity < availableStock;

  const handleIncrease = () => {
    if (canIncrease) {
      updateQuantity(item._id, item.quantity + 1, item.size, item.color);
    } else {
      alert(`Only ${availableStock} left in stock for this variant`);
    }
  };

  return (
    <motion.div
      className="px-1 lg:pr-28 text-lg "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="space-y-6">
        <div className="border-amber-100 rounded-lg shadow p-4  text-black">
         

          <ul className="space-y-4">
            <li className="flex gap-4 py-4 px-2">
              {/* Product Image */}
              <Link to={`/product/${item._id}`} className="">
                <img
                  src={item.images?.[0]}
                  alt={item.name}
                  className="w-25 h-25 object-cover rounded"
                />
              </Link>

              {/* Product Info */}
              <div className="flex-1 space-y-1">
                {/* Product Name & Total Price */}
                <div className="px-2 flex justify-between items-center">
                  <h3 className="text-black text-sm font-medium tracking-wider">
                    {item.name}
                  </h3>
                  <button
                    className="inline-flex items-center text-sm font-medium text-red-400 hover:text-red-300 hover:underline"
                    onClick={() =>
                      removeFromCart(item._id, item.size, item.color)
                    }
                  >
                    <Trash size={20} />
                  </button>
                </div>

                {/* Extra Details (size, color, category) */}
                <div className="flex flex-col flex-wrap gap-1 text-xs text-gray-600">
                  {item.size && (
                    <span className=" px-2 rounded tracking-wider">
                      Size: {item.size}
                    </span>
                  )}

                  {item.color && (
                    <span className=" px-2  rounded  tracking-wider">
                      Color: {item.color}
                    </span>
                  )}
                </div>

                {/* Quantity & Unit Price */}
                <div className="flex justify-between text-sm">
                  {/* quantity */}
                  <div className="px-2  rounded  text-lg flex justify-between items-center ">
                    <p className="text-black font-semibold ">
                      ₦
                      {(item.price * item.quantity).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className=" bg-gray-300 px-2 py-1 rounded-2xl tracking-widest text-lg flex justify-between items-center gap-3">
                    <button
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center "
                      onClick={() =>
                        updateQuantity(
                          item._id,
                          item.quantity - 1,
                          item.size,
                          item.color
                        )
                      }
                    >
                      <Minus className="text-black w-12 h-8 " />
                    </button>
                    <span> {item.quantity}</span>
                    <button
                      disabled={!canIncrease}
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${
                        !canIncrease
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-black/800"
                      }`}
                      onClick={handleIncrease}
                    >
                      <Plus className="text-black w-12 h-8 " />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;
