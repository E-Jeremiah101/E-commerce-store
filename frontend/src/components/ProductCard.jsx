import React, { useState } from "react";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const ProductCard = ({ product }) => {
  const { user } = useUserStore();
  const { addToCart } = useCartStore();

  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add products to cart", { id: "login" });
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }

    addToCart(
      product, selectedSize || null, selectedColor || null
    );
   
  };

  return (
    <div className="flex-w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg">
      {/* Product Image */}
      <div className="relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl">
        <img
          className="object-cover w-full"
          src={product.image}
          alt={product.name}
        />
        <div className="absolute inset-0 bg-black opacity-10" />
      </div>

      {/* Product Info */}
      <div className="mt-4 px-5 pb-5 space-y-3">
        <h5 className="text-xl font-semibold tracking-tight text-white">
          {product.name}
        </h5>

        <p className="text-3xl font-bold text-emerald-400">
          ₦{" "}
          {product.price.toLocaleString(undefined, {
            minimumFractionDigits: 0,
          })}
        </p>

        {/* Size Selection */}
        {product.sizes?.length > 0 && (
          <div>
            <label className="text-sm text-gray-300 mr-2">Size:</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded"
            >
              {product.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Color Selection */}
        {product.colors?.length > 0 && (
          <div>
            <label className="text-sm text-gray-300 mr-2">Color:</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded"
            >
              {product.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          className="w-full mt-3 flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={22} className="mr-2" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
