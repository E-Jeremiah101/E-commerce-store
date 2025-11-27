import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";

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

  return (
    <div className="flex-w-full relative flex-col h-full overflow-hidden border-gray-700">
      <button
        onClick={toggleSave}
        disabled={isLoading}
        className="absolute top-1 right-1 z-10 p-1 bg-white rounded-full shadow-md  hover:bg-gray-100 transition-colors"
      >
        {isSaved ? (
          <Heart size={15} className="text-black fill-current" />
        ) : (
          <Heart size={15} className="text-gray-600" />
        )}
      </button>
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

        {/* Product Info */}
        <div className="mt-1 px-2 pb-1 space-y-2  flex flex-col ">
          <h3 className="text-sm truncate w-45 lg:text-md text-gray-600 mb-1 tracking-wider">
            {product.name}
          </h3>

          <div className="flex justify-between w-full text-gray-900">
            <div className="text-sm lg:text-md text-gray-900">
              ₦{" "}
              {product.price.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </div>
            <div>
              <ShoppingCart size={20} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
