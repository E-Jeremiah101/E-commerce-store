import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore.jsx";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import CategoryItem from "../components/CategoryItem.jsx";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
import { Link } from "react-router-dom";
import FAQSection from "../components/FAQSection.jsx";
import Footer from "../components/Footer.jsx";
import HeroSlider from "../components/HeroSlider.jsx";
import CollectionTab from "../components/CollectionTab.jsx";
import OtherFeatures from "../components/OtherFeatures.jsx";
import LandingProducts from "../components/LandingProducts.jsx";
const HomePage = () => {
  
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);

  const {
    fetchFeaturedProducts,
    products,
    loading: isLoadingProducts,
  } = useProductStore();

  // Fetch dynamic categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/categories-with-images");
        setCategories(res.data);
      } catch (error) {
        setCategories([]);
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch featured products
  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  // Fetch random recommendations - ONLY ONCE
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/products/recommendations");
        setRecommendations(res.data);
      } catch (error) {
        setRecommendations([]); 
        console.error(error);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <motion.div
      className="relative min-h-screen text-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* HERO SLIDER */}
      <motion.div
        className="relative pt-16  md:py-0"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <HeroSlider />
      </motion.div>

      <div className="bg-white pb-4 py-6 border-b md:hidden">
        <div className="max-w-7xl mx-auto px-4">
          {isLoadingCategories ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded-full animate-pulse min-w-20"
                ></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scroll">
              {/* All Categories Button */}
              <button className="flex-shrink-0 px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors whitespace-nowrap">
                All Products
              </button>

              {/* Category Buttons */}
              {categories.map((category) => (
                <Link
      to={`/category/${category.name}`} >
                <button
                  key={category.name}
                  className="flex-shrink-0 px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  {category.name}
                </button>
                </Link>
              ))}
            </div>
          ) : (
            ""
          )}
        </div>
      </div>

      <CollectionTab />

      <div className="relative z-10 max-w-7xl mx-auto px-4 root lg:px-25 bg-gradient-to-br from-white via-gray-100 to-gray-300">
        {isLoadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(14)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <LandingProducts
            recommendations={recommendations}
            isLoading={isLoadingRecommendations}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No categories found
            </div>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
              Refresh
            </button>
          </div>
        )}

        {/* TITLE SECTION */}
        <div className="text-black flex justify-center items-center my-14 lg:mt-25 look">
          <div className="text-center">
            <h1 className="text-3xl tracking-widest mb-4 text-black drop-shadow-lg">
              CLASSIC WEARS
            </h1>
            <p className="text-1xl lg:text-sm tracking-widest">
              Stay Relaxed, Stay Stylish: Redefine Comfort with the Perfect
              style Fit!
            </p>
          </div>
        </div>

        <OtherFeatures className="look" />

        
        {/* FEATURED PRODUCTS */}
        {!isLoadingProducts && products.length > 0 && (
          <FeaturedProducts className="look" featuredProducts={products} />
        )}

        <FAQSection className="look" />
      </div>

      <Footer />
    </motion.div>
  );
};

export default HomePage;
