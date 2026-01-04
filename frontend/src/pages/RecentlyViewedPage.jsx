import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import ProductCard from "../components/ProductCard";
import { useStoreSettings } from "../components/StoreSettingsContext";
import { motion } from "framer-motion";

const RecentlyViewedPage = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();
  const { settings } = useStoreSettings();

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      if (!user) {
        setRecentlyViewed([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          "/products/recently-viewed?limit=20"
        );
        setRecentlyViewed(response.data.products || []);
      } catch (error) {
        console.error("Error fetching recently viewed:", error);
        setRecentlyViewed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Please Login
            </h2>
            <p className="text-gray-600 mb-8">
              Sign in to view your recently viewed products
            </p>
            <Link
              to="/login"
              className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Recently Viewed
              </h1>
              <p className="text-gray-600 mt-2">
                Products you've recently looked at
              </p>
            </div>

            {recentlyViewed.length > 0 && (
              <div className="text-sm text-gray-500">
                {recentlyViewed.length}{" "}
                {recentlyViewed.length === 1 ? "item" : "items"}
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-4/5 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentlyViewed.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {recentlyViewed.map((product) => (
                <div key={product._id} className="flex">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {recentlyViewed.length === 0 && (
              <div className="text-center py-12">
                <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No recently viewed products
                </h3>
                <p className="text-gray-500 mb-6">
                  Products you view will appear here
                </p>
                <Link
                  to="/products"
                  className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Your recently viewed is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Browse products and they'll appear here
            </p>
            <Link
              to="/products"
              className="inline-block bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RecentlyViewedPage;
