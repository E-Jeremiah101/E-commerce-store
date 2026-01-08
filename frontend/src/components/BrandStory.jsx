
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "../lib/axios";
import { Star, Heart, Sparkles, Check, Award, Zap } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import toast from "react-hot-toast";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import ScrollReveal from "./ScrollReveal.jsx";


const BrandStory = ({ className = "" }) => {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const { user } = useUserStore();
  const { settings } = useStoreSettings();

  // Track saved status for each product
  const [savedStatus, setSavedStatus] = useState({});
  const [loadingSave, setLoadingSave] = useState({});

  // Use refs to track rotation state
  const rotationIndexRef = useRef(0);
  const rotationIntervalRef = useRef(null);

  // Fetch picks function
  const fetchPicks = async () => {
    try {
      setLoading(true);
      // Try to get featured products - get more products for better rotation
      const response = await axios.get("/products/featured?limit=12");
      const products = response.data.products || response.data || [];
      
      console.log("Products fetched for Editors Picks:", products.length);
      
      // Transform products into curated picks
      const curatedPicks = products.map((product, index) => {
        // Different styling based on position
        const styles = [
          { accent: "from-amber-500 to-orange-500", badge: "Trending Now" },
          { accent: "from-blue-500 to-cyan-500", badge: "Quality Pick" },
          { accent: "from-purple-500 to-pink-500", badge: "Style Award" },
          { accent: "from-emerald-500 to-green-500", badge: "Eco Choice" },
          { accent: "from-rose-500 to-red-500", badge: "New Arrival" },
          { accent: "from-indigo-500 to-violet-500", badge: "Staff Favorite" },
          { accent: "from-yellow-500 to-amber-500", badge: "Best Value" },
          { accent: "from-cyan-500 to-blue-500", badge: "Editor's Choice" },
          { accent: "from-red-500 to-pink-500", badge: "Hot Pick" },
          { accent: "from-green-500 to-emerald-500", badge: "Sustainable" },
          { accent: "from-violet-500 to-purple-500", badge: "Innovative" },
          { accent: "from-orange-500 to-red-500", badge: "Limited Edition" }
        ];
        
        const style = styles[index] || styles[0];
        
        // Handle undefined description
        const productDescription = product.description || 
                                "A carefully selected piece from our collection.";
        const shortDescription = productDescription.length > 120 
          ? productDescription.substring(0, 120) + '...'
          : productDescription;
        
        // Use real rating or show "No reviews yet"
        const hasReviews = product.numReviews && product.numReviews > 0;
        const rating = hasReviews ? (product.averageRating || 4.0) : 0;
        const reviewCount = hasReviews ? product.numReviews : 0;
        
        return {
          id: product._id || product.id,
          name: product.name || "Featured Product",
          description: shortDescription,
          price: product.price || 0,
          previousPrice: product.previousPrice,
          image: product.images?.[0] || "/placeholder.jpg",
          category: product.category || "Featured",
          rating: rating,
          reviewCount: reviewCount,
          hasReviews: hasReviews,
          tags: ["Premium", "Quality", "Design"],
          accentColor: style.accent,
          badge: style.badge,
          badgeIcon: index % 3 === 0 ? <Sparkles className="w-3 h-3" /> : 
                     index % 3 === 1 ? <Award className="w-3 h-3" /> : 
                     <Zap className="w-3 h-3" />,
          isFeatured: index === 0,
          lastFeatured: null
        };
      });
      
      setPicks(curatedPicks);
      rotationIndexRef.current = 0;
      
      // Check saved status for all products
      if (user) {
        checkAllSavedStatus(curatedPicks);
      }
      
      // Start rotation immediately
      startRotation(curatedPicks);
    } catch (error) {
      console.error("Error fetching picks:", error);
      // Use fallback design data
      setPicks(getFallbackPicks());
      startRotation(getFallbackPicks());
    } finally {
      setLoading(false);
    }
  };

  // Start rotation function
  const startRotation = (products) => {
    // Clear existing interval
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }
    
    if (products.length > 0) {
      rotationIntervalRef.current = setInterval(() => {
        // Rotate through ALL products, not just first 3
        rotationIndexRef.current = (rotationIndexRef.current + 1) % products.length;
        
        // Force re-render by updating state
        setPicks(prev => {
          const updated = [...prev];
          // Mark current as last featured (for tracking)
          updated[rotationIndexRef.current] = {
            ...updated[rotationIndexRef.current],
            lastFeatured: new Date().toISOString()
          };
          return updated;
        });
      }, 15000); // 15 seconds instead of 10
    }
  };

  // Check saved status for all products
  const checkAllSavedStatus = async (products) => {
    try {
      const statusUpdates = {};
      const token = localStorage.getItem("token");
      
      if (!token) return;
      
      // Create promises for all products
      const promises = products.map(async (product) => {
        try {
          const response = await fetch(`/api/saved-products/check/${product.id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            statusUpdates[product.id] = data.isSaved || false;
          }
        } catch (error) {
          console.error(`Error checking saved status for ${product.id}:`, error);
          statusUpdates[product.id] = false;
        }
      });
      
      await Promise.all(promises);
      setSavedStatus(prev => ({ ...prev, ...statusUpdates }));
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const getFallbackPicks = () => {
    const fallbacks = [
      {
        id: 1,
        name: "Premium Collection Item",
        description: "Handpicked by our editors for exceptional quality and design.",
        price: 89.99,
        previousPrice: 119.99,
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Featured",
        rating: 0,
        reviewCount: 0,
        hasReviews: false,
        tags: ["Editor's Choice", "Best Seller", "Premium"],
        accentColor: "from-amber-500 to-orange-500",
        badge: "Trending Now",
        badgeIcon: <Sparkles className="w-3 h-3" />,
        isFeatured: true,
        lastFeatured: new Date().toISOString()
      },
      // Add more fallbacks for rotation
      {
        id: 2,
        name: "Limited Edition Piece",
        description: "Exclusive design available for a limited time only.",
        price: 129.99,
        previousPrice: null,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Limited",
        rating: 4.5,
        reviewCount: 24,
        hasReviews: true,
        tags: ["Exclusive", "Limited", "Premium"],
        accentColor: "from-purple-500 to-pink-500",
        badge: "Limited Edition",
        badgeIcon: <Award className="w-3 h-3" />,
        isFeatured: false,
        lastFeatured: null
      },
      {
        id: 3,
        name: "Eco-Friendly Product",
        description: "Sustainable materials with minimal environmental impact.",
        price: 74.99,
        previousPrice: 89.99,
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Eco",
        rating: 4.8,
        reviewCount: 42,
        hasReviews: true,
        tags: ["Sustainable", "Eco-Friendly", "Green"],
        accentColor: "from-emerald-500 to-green-500",
        badge: "Eco Choice",
        badgeIcon: <Zap className="w-3 h-3" />,
        isFeatured: false,
        lastFeatured: null
      },
      {
        id: 4,
        name: "Staff Favorite",
        description: "Our team's personal favorite from the collection.",
        price: 99.99,
        previousPrice: 129.99,
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Staff Picks",
        rating: 4.9,
        reviewCount: 56,
        hasReviews: true,
        tags: ["Staff Pick", "Popular", "Quality"],
        accentColor: "from-indigo-500 to-violet-500",
        badge: "Staff Favorite",
        badgeIcon: <Sparkles className="w-3 h-3" />,
        isFeatured: false,
        lastFeatured: null
      },
      {
        id: 5,
        name: "Best Value Item",
        description: "Exceptional quality at an unbeatable price point.",
        price: 49.99,
        previousPrice: 79.99,
        image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "Value",
        rating: 4.6,
        reviewCount: 38,
        hasReviews: true,
        tags: ["Value", "Affordable", "Quality"],
        accentColor: "from-yellow-500 to-amber-500",
        badge: "Best Value",
        badgeIcon: <Award className="w-3 h-3" />,
        isFeatured: false,
        lastFeatured: null
      },
      {
        id: 6,
        name: "New Arrival",
        description: "Freshly added to our collection this week.",
        price: 159.99,
        previousPrice: null,
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        category: "New",
        rating: 0,
        reviewCount: 0,
        hasReviews: false,
        tags: ["New", "Latest", "Fresh"],
        accentColor: "from-rose-500 to-red-500",
        badge: "New Arrival",
        badgeIcon: <Zap className="w-3 h-3" />,
        isFeatured: false,
        lastFeatured: null
      }
    ];
    
    return fallbacks;
  };

  // Wishlist toggle function
  const toggleSave = async (productId) => {
    if (!user) {
      toast.error("Please login to add product to wishlist");
      return;
    }

    setLoadingSave(prev => ({ ...prev, [productId]: true }));
    
    try {
      const token = localStorage.getItem("token");
      
      if (savedStatus[productId]) {
        // Remove from wishlist
        await fetch(`/api/saved-products/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSavedStatus(prev => ({ ...prev, [productId]: false }));
        toast.success("Removed from wishlist");
      } else {
        // Add to wishlist
        await fetch("/api/saved-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: productId }),
        });
        setSavedStatus(prev => ({ ...prev, [productId]: true }));
        toast.success("Product successfully added to your wishlist!");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setLoadingSave(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPicks();
    
    // Auto-refresh picks every 10 minutes (instead of 30)
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing Editors Picks...");
      fetchPicks();
    }, 10 * 60 * 1000); // 10 minutes
    
    // Manual refresh from localStorage (if other pages trigger it)
    const handleStorageChange = () => {
      const shouldRefresh = localStorage.getItem('refreshEditorsPicks');
      if (shouldRefresh === 'true') {
        fetchPicks();
        localStorage.removeItem('refreshEditorsPicks');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(refreshInterval);
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Get current featured pick
  const getFeaturedPick = () => {
    if (picks.length === 0) return null;
    
    // Get the pick at current rotation index
    const currentIndex = rotationIndexRef.current % picks.length;
    return picks[currentIndex] || picks[0];
  };

  // Get unique categories from picks
  const categories = ["all", ...new Set(picks.map(pick => pick.category).filter(Boolean))];

  const filteredPicks = selectedTab === "all" 
    ? picks 
    : picks.filter(pick => pick.category && pick.category.toLowerCase() === selectedTab.toLowerCase());

  // Format price with currency
  const formatPrice = (price) => {
    if (!price && price !== 0) return "$0.00";
    const currency = settings?.currency || "USD";
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    });
    return formatter.format(price);
  };

  // Manual refresh function
  const manualRefresh = () => {
    setLoading(true);
    fetchPicks();
    toast.success("Editors Picks refreshed!");
  };

  // Manual rotation function (for testing)
  const nextPick = () => {
    if (picks.length > 0) {
      rotationIndexRef.current = (rotationIndexRef.current + 1) % picks.length;
      setPicks(prev => [...prev]); // Force re-render
      toast.success("Showing next pick!");
    }
  };

  const featuredPick = getFeaturedPick();

  if (loading) {
    return (
      <div className={`${className} py-16`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-10 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollReveal direction="up" delay={0.7} duration={1}>
      <div className={`${className} py-16 md:py-24 overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with rotation controls */}
          <div className="relative mb-12">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {/* <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div> */}
                  </div>

                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                    <span className="block">Editor's</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      Curated Picks
                    </span>
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Pick - Now rotates through ALL products */}
          {featuredPick && (
            <motion.div
              key={`${featuredPick.id}-${rotationIndexRef.current}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/70"></div>

                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{ backgroundImage: `url(${featuredPick.image})` }}
                ></div>

                <div className="relative z-10 p-8 md:p-12 lg:p-16">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                        <div className="p-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                          {featuredPick.badgeIcon}
                        </div>
                        <span className="text-white font-medium">
                          {featuredPick.badge}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                      {featuredPick.name}
                    </h3>

                    <p className="text-gray-200 text-lg mb-8 max-w-xl">
                      {featuredPick.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 mb-8">
                      {/* Rating - Only show if has reviews */}
                      {featuredPick.hasReviews ? (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(featuredPick.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-gray-400 text-gray-400"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-white">
                            {featuredPick.rating.toFixed(1)} (
                            {featuredPick.reviewCount} reviews)
                          </span>
                        </div>
                      ) : (
                        <div className="text-white/70">No reviews yet</div>
                      )}

                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white">
                          {formatPrice(featuredPick.price, settings?.currency)}
                        </span>
                        {featuredPick.previousPrice &&
                          featuredPick.previousPrice > featuredPick.price && (
                            <span className="text-lg text-gray-300 line-through">
                              {formatPrice(
                                featuredPick.previousPrice,
                                settings?.currency
                              )}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Link
                        to={`/product/${featuredPick.id}`}
                        className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                      >
                        Shop This Pick
                      </Link>
                      <button
                        onClick={() => toggleSave(featuredPick.id)}
                        disabled={loadingSave[featuredPick.id]}
                        className="px-6 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingSave[featuredPick.id] ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : savedStatus[featuredPick.id] ? (
                          <>
                            <Heart className="w-5 h-5 fill-white" />
                            <span className="hidden sm:inline">Saved</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-5 h-5" />
                            <span className="hidden sm:inline">
                              Add to Wishlist
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Other Picks Grid - Show all except current featured */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPicks
              .filter((pick) => pick.id !== (featuredPick?.id || null))
              .slice(0, Math.min(6, filteredPicks.length - 1))
              .map((pick, index) => (
                <motion.div
                  key={pick.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 group-hover:border-gray-300 group-hover:shadow-xl transition-all duration-500 overflow-hidden">
                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-sm border border-white/20 shadow-sm">
                        <div
                          className={`p-1 rounded-full bg-gradient-to-r ${pick.accentColor}`}
                        >
                          {pick.badgeIcon}
                        </div>
                        <span className="text-xs font-semibold text-gray-900">
                          {pick.badge}
                        </span>
                      </div>
                    </div>

                    {/* Wishlist button */}
                    <button
                      onClick={() => toggleSave(pick.id)}
                      disabled={loadingSave[pick.id]}
                      className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-700 hover:text-rose-500 hover:border-rose-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingSave[pick.id] ? (
                        <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                      ) : savedStatus[pick.id] ? (
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      ) : (
                        <Heart className="w-4 h-4" />
                      )}
                    </button>

                    {/* Product Image */}
                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url(${pick.image})` }}
                      ></div>
                      {!pick.image && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

                      {/* Quick view overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Link
                          to={`/product/${pick.id}`}
                          className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors transform translate-y-4 group-hover:translate-y-0  duration-300"
                        >
                          Quick View
                        </Link>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <div className="mb-3">
                        {pick.category && (
                          <span className="inline-block px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium mb-2">
                            {pick.category}
                          </span>
                        )}
                        <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {pick.name}
                        </h4>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {pick.description}
                        </p>
                      </div>

                      {/* Rating - Only show if has reviews */}
                      {pick.hasReviews ? (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(pick.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-gray-300 text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {pick.rating.toFixed(1)} ({pick.reviewCount})
                          </span>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <span className="text-sm text-gray-400">
                            No reviews yet
                          </span>
                        </div>
                      )}

                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(pick.price)}
                            </span>
                            {pick.previousPrice &&
                              pick.previousPrice > pick.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(pick.previousPrice)}
                                </span>
                              )}
                          </div>
                        </div>

                        <Link
                          to={`/product/${pick.id}`}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-black text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
          {/* Why Choose Section */}
          <div className="mt-20 pt-12 border-t border-gray-200">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Why Trust Our Picks?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our curation process ensures every product meets our high
                standards for quality, design, and value.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Quality Tested
                </h4>
                <p className="text-gray-600">
                  Each product undergoes rigorous testing and evaluation by our
                  team.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Design Focused
                </h4>
                <p className="text-gray-600">
                  Selected for exceptional design that combines form and
                  function.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Value Driven
                </h4>
                <p className="text-gray-600">
                  We find products that offer the best quality at their price
                  point.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default BrandStory;