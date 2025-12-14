import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Bookmark } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import GoBackButton from "../components/GoBackButton";
import { motion } from "framer-motion";
const SavedProductsPage = () => {
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchSavedProducts();
    }
  }, [user]);

  const fetchSavedProducts = async () => {
    try {
      const response = await fetch("/api/saved-products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setSavedProducts(data.savedProducts || []);
    } catch (error) {
      console.error("Error fetching saved products:", error);
      toast.error("Failed to load saved products");
    } finally {
      setLoading(false);
    }
  };

  const removeSavedProduct = async (productId) => {
    try {
      await fetch(`/api/saved-products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setSavedProducts((prev) =>
        prev.filter((sp) => sp.product._id !== productId)
      );
      toast.success("Product removed from saved items");
    } catch (error) {
      console.error("Error removing saved product:", error);
      toast.error("Failed to remove product");
    }
  };

  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className=" fixed top-0 left-0 right-0 flex z-40 items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-200 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <span className="text-center text-xl text-gray-900 tracking-widest">
          Wishlist ({savedProducts.length})
        </span>
      </motion.div>

      <div className="min-h-screen bg-gray-50 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          {savedProducts.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-gray-500 mb-6">
                Save products you love to your wishlist!
              </p>
              <Link
                to="/"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-black/80 transition"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
              {savedProducts.map(({ product, _id }) => (
                <div
                  key={_id}
                  className=" rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <Link to={`/product/${product._id}`}>
                    <img
                      src={product.images?.[0]}
                      alt={product.name}
                      className="w-full h-50 object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="p-2">
                    <Link to={`/product/${product._id}`}>
                      <h3 className=" text-sm truncate w-45 lg:text-md text-gray-600 mb-1 tracking-widert">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-sm lg:text-md text-black">
                      ₦{product.price.toLocaleString()}
                    </p>

                    <div className="text-right">
                      <button
                        onClick={() => removeSavedProduct(product._id)}
                        className="bg-bla px-4 py-2 rounded text-sm"
                      >
                        <Bookmark className=" fill-current"/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SavedProductsPage;
