import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import axios from "../lib/axios";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import FeaturedProducts from "../components/FeaturedProducts.jsx";
import { Link } from "react-router-dom";
import FAQSection from "../components/FAQSection.jsx";
import Footer from "../components/Footer.jsx";
import HeroSlider from "../components/HeroSlider.jsx";
import ClassicSpinDisplay from "../components/ClassicSpinDisplay.jsx";
import LandingProducts from "../components/LandingProducts.jsx";
import { SEO, OrganizationSchema } from "../components/SEO";
import MiniCartWidget from "../components/MiniCartWidget.jsx";
import RecentlyViewed from "../components/RecentlyViewed.jsx";
import BrandStory from "../components/BrandStory.jsx";
import EditorsPicks from "../components/EditorsPicks.jsx";

const HomePageContent = () => {
  const { settings } = useStoreSettings();
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const hasShownInitialRecommendations = useRef(false);

  const {
    fetchFeaturedProducts,
    featuredProducts,
    loading: isLoadingProducts,
  } = useProductStore();
  

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

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  useEffect(() => {
    const CACHE_KEY = "cached_recommendations";
    const CACHE_TIME_KEY = "cached_recommendations_time";
    const REFRESH_INTERVAL = 2 * 60 * 1000;

    const fetchRecommendations = async () => {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

      if (cached) {
        setRecommendations(JSON.parse(cached));
        hasShownInitialRecommendations.current = true;
      }

      const isCacheExpired =
        !cachedTime || Date.now() - parseInt(cachedTime) > REFRESH_INTERVAL;

      if (!cached || isCacheExpired) {
        try {
          const res = await axios.get("/products/recommendations");
          const freshData = res.data;
          setRecommendations(freshData);
          localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (error) {
          console.error("Error fetching fresh recommendations:", error);

          if (!cached) {
            setRecommendations([]);
          }
        }
      }

      setIsLoadingRecommendations(false);
    };

    fetchRecommendations();
  }, []);

  useEffect(() => {
    if (
      !isLoadingCategories &&
      !isLoadingRecommendations &&
      !isLoadingProducts
    ) {
      setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 100);
    }
  }, [isLoadingCategories, isLoadingRecommendations, isLoadingProducts]);

  if (!isInitialLoadComplete) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero skeleton */}
        <div className="h-64 md:h-96 bg-gray-200 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Categories skeleton */}
          <div className="hidden md:flex justify-center gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"
              ></div>
            ))}
          </div>

          {/* Mobile categories skeleton */}
          <div className="md:hidden mb-6">
            <div className="flex gap-3 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          {/* Products skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-gray-100 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>

          {/* Featured products skeleton */}
          <div className="mb-12">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-100 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 text-gray-900 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* SEO Meta Tags */}
      <SEO
        title={`${
          settings?.storeName || "Store"
        } - Quality Products at Great Prices`}
        description={`Shop at ${
          settings?.storeName || "Store"
        } for quality products with fast shipping and secure payments. Discover great deals on trending items.`}
        image={settings?.logo || "/logo-buz.jpg"}
      />

      {/* Organization Schema */}
      <OrganizationSchema />

      {/* HERO SLIDER */}
      <motion.div
        className="relative pt-2 md:py-0 drop-shadow-xl rounded-2xl overflow-hidden mb-8"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <HeroSlider />
      </motion.div>

      {/* Mobile Categories */}
      <div className=" pb-4 py-6  md:hidden">
        <div className="max-w-7xl mx-auto px-4">
          {categories.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scroll">
              {/* Category Buttons */}
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={`/category/${category.name}`}
                  className="flex-shrink-0"
                >
                  <button className="px-4 rounded py-2  shadow text-white bg-black/100 hover:text-black hover:bg-white transition-colors whitespace-nowrap uppercase font-semibold">
                    {category.name}
                  </button>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded-full animate-pulse min-w-20"
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 root lg:px-25">
        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="bg-white/80 rounded-2xl shadow-lg p-2 md:p-5">
              <FeaturedProducts
                className="look"
                featuredProducts={featuredProducts}
              />
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl text-center font-light tracking-tight text-gray-900 mb-4">
              <span className="font-medium">Recommended</span> For You
            </h2>
            <div className="bg-white/80 rounded-2xl shadow-lg p-3 md:p-5">
              <LandingProducts
                recommendations={recommendations}
                isLoading={false}
              />
            </div>
          </div>
        )}

        {/* Editors Picks Section */}
        <div className="mb-16">
          <div className="bg-white/80 rounded-2xl shadow-lg p-2 md:p-5">
            <EditorsPicks className="look" products={recommendations} />
          </div>
        </div>

        {/* Brand Story Section */}
        <div className="mb-16">
          <div className="bg-white/80 rounded-2xl shadow-lg p-2 md:p-5">
            <BrandStory className="look" />
          </div>
        </div>

        {/* classic display Section */}
        <div className="mb-16">
          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <ClassicSpinDisplay className="look" />
          </div>
        </div>

        {/* Recently Viewed Section */}
        <div className="mb-16">
          
            <RecentlyViewed className="look" />
         
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-extrabold text-gray-700 mb-6 text-center tracking-tight drop-shadow">
            Frequently Asked Questions
          </h2>
          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <FAQSection className="look" />
          </div>
        </div>
      </div>

      <MiniCartWidget />
      <Footer />
    </motion.div>
  );
};

export default function HomePage() {
  return (
    <ErrorBoundary>
      <HomePageContent />
    </ErrorBoundary>
  );
}
