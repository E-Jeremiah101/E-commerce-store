import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {  ShoppingCart, Bookmark } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const ProductCard = ({ product }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUserStore();

  // Check if product is saved
  useEffect(() => {
    if (user) {
      checkSavedStatus();
    }
  }, [user, product._id]);

  const checkSavedStatus = async () => {
    try {
      const response = await fetch(`/api/saved-products/check/${product._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setIsSaved(data.isSaved);
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      toast.error("Please login to add product to wishlist");
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Unsave
        await fetch(`/api/saved-products/${product._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setIsSaved(false);
        toast.success("Removed from wishlist");
      } else {
        // Save
        await fetch("/api/saved-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ productId: product._id }),
        });
        setIsSaved(true);
        toast.success("Product successfully added to your wishlist!");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update saved items");
    } finally {
      setIsLoading(false);
    }
  };
  const { settings } = useStoreSettings();

  return (
    <div className="flex-w-full relative flex-col h-full overflow-hidden border-gray-700">
      <div className="absolute top-1 right-1 z-10">
        {product.isPriceSlashed && product.previousPrice && (
          <span className="bg-red-100 text-red-800 rounded text-[0.70rem] font-medium px-1 py-1">
            {Math.round(product.discountPercentage)}% OFF
          </span>
        )}
      </div>
      {/* Product Image */}
      <Link to={`/product/${product._id}`}>
        <div className="relative flex overflow-hidden h-50 rounded-xs">
          <img
            className="object-cover w-full h-full hover:scale-105 transition-transform"
            src={product.images?.[0]}
            alt={product.name}
          />

          {/* Dark overlay for better contrast */}
          <div className="absolute inset-0 bg-black opacity-10" />

          {/* Out of Stock Overlay */}
          {product.countInStock === 0 && (
            <div className="absolute top-0 left-0 w-full h-full bg-black/40 bg-opacity-50 flex items-start justify-start p-1">
              <span className="bg-red-600 text-white text-xs  px-2 py-1 rounded shadow-md">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-1 px-2 pb-1 space-y-2  flex flex-col ">
        <Link to={`/product/${product._id}`} className="m-0">
          <h3 className="text-sm truncate w-45 lg:text-md text-gray-600 mb-1 tracking-wider">
            {product.name}
          </h3>
        </Link>

        <div className="flex justify-between w-full text-gray-900">
          <Link to={`/product/${product._id}`} className="m-0">
            {product.isPriceSlashed && product.previousPrice ? (
              <div className="flex items-center gap-1">
                <span className="text-black font-medium text-[1rem]">
                  {formatPrice(product.price, settings?.currency)}
                </span>
                <span className="text-gray-500 line-through text-[0.82rem]">
                  {formatPrice(product.previousPrice, settings?.currency)}
                </span>
              </div>
            ) : (
              <span className="text-sm lg:text-md text-gray-900 font-semibold">
                {formatPrice(product.price, settings?.currency)}
              </span>
            )}
          </Link>{" "}
          <div className="flex gap-3">
            <Link to={`/product/${product._id}`} className="m-0">
              <ShoppingCart size={20} />
            </Link>
            <button onClick={toggleSave} disabled={isLoading}>
              {isSaved ? (
                <Bookmark size={20} className="text-black fill-current" />
              ) : (
                <Bookmark size={20} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
