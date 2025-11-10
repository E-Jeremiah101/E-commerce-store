
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore.jsx";
import axios from "../lib/axios";
import toast from "react-hot-toast";

import CategoryItem from "../components/CategoryItem.jsx";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Fetch random recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("/products/recommendations");
        setRecommendations(res.data);
      } catch (error) {
        setRecommendations([]); 
        console.error(error)
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
        className="relative pt-16 pb-5 md:py-0"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <HeroSlider />
      </motion.div>

      <CollectionTab />

      <div className="relative z-10 max-w-7xl mx-auto px-4 root lg:px-25 bg-gradient-to-br from-white via-gray-100 to-gray-300">
        {isLoadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-300 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="">{<LandingProducts />}</div>
        ) : (
          
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-300 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          
        )}

        {/* TITLE SECTION */}
        <div className="text-black flex justify-center items-center my-17 lg:mt-25 look">
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

        <div>
          <h1 className="text-2xl tracking-widest mb-4 text-black drop-shadow-lg text-center">
            EXPLORE CATEGORY
          </h1>
          {/* CATEGORY GRID */}
          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-300 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 md:gap-6 gap-5 look">
              {categories.map((category) => (
                <CategoryItem category={category} key={category.name} />
              ))}
            </div>
          ) : (
            
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-gray-300 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
           
          )}
        </div>

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

