import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
  Bookmark,
} from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import ScrollReveal from "./ScrollReveal.jsx";
import { useStoreSettings } from "./StoreSettingsContext";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";
import { formatPrice } from "../utils/currency";

const RecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [savedProducts, setSavedProducts] = useState({});

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const { user } = useUserStore();
  const { settings } = useStoreSettings();
  const { addToCart } = useCartStore();

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      console.log(" Fetching recently viewed:", {
        user: !!user,
        userId: user?._id,
      });

      try {
        setLoading(true);
        const response = await axios.get("/products/recently-viewed");
        console.log(" Recently viewed response:", {
          count: response.data.products?.length,
          products: response.data.products?.map((p) => p.name),
        });

        setRecentlyViewed(response.data.products || []);
      } catch (error) {
        console.error(" Error fetching recently viewed:", error);
        setRecentlyViewed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [user]);


  useEffect(() => {
    if (user && recentlyViewed?.length > 0) {
      recentlyViewed.forEach((product) => {
        checkSavedStatus(product._id);
      });
    }
  }, [user, recentlyViewed]);

  const checkSavedStatus = async (productId) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/saved-products/check/${productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setSavedProducts((prev) => ({ ...prev, [productId]: data.isSaved }));
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const toggleSave = async (product) => {
    if (!user) {
      toast.error("Please login to add product to wishlist");
      return;
    }

    const productId = product._id;
    const currentlySaved = savedProducts[productId] || false;

    try {
      if (currentlySaved) {
        // Unsave
        await fetch(`/api/saved-products/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setSavedProducts((prev) => ({ ...prev, [productId]: false }));
        toast.success("Removed from wishlist");
      } else {
        // Save
        await fetch("/api/saved-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ productId }),
        });
        setSavedProducts((prev) => ({ ...prev, [productId]: true }));
        toast.success("Product successfully added to your wishlist!");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update saved items");
    }
  };

  // Handle responsive items per page
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerPage(2);
        setIsMobile(true);
        setIsTablet(false);
      } else if (width >= 640 && width < 1024) {
        setItemsPerPage(3);
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setItemsPerPage(4);
        setIsMobile(false);
        setIsTablet(false);
      }
      // Reset current index when itemsPerPage changes
      setCurrentIndex(0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Navigation functions
  const nextSlide = () => {
    if (currentIndex >= recentlyViewed.length - itemsPerPage) return;
    setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
  };

  const prevSlide = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= recentlyViewed.length - itemsPerPage;

  // Show chevrons only on desktop (1024px and above)
  const showChevrons = !isMobile && !isTablet;

  // Minimum swipe distance (px) to trigger slide change
  const minSwipeDistance = 50;

  // Touch event handlers
  const handleTouchStart = (e) => {
    if (!isMobile && !isTablet) return; // Only for mobile/tablet
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if ((!isMobile && !isTablet) || !touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    const distance = touchStart - currentTouch;
    setDragOffset(distance);
    setTouchEnd(currentTouch);
  };

  const handleTouchEnd = () => {
    if ((!isMobile && !isTablet) || !touchStart || !touchEnd) {
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  // Mouse drag handlers for desktop testing
  const handleMouseDown = (e) => {
    if (!isMobile && !isTablet) return;
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if ((!isMobile && !isTablet) || !touchStart || !isDragging) return;

    const currentPosition = e.clientX;
    const distance = touchStart - currentPosition;
    setDragOffset(distance);
    setTouchEnd(currentPosition);
  };

  const handleMouseUp = () => {
    if ((!isMobile && !isTablet) || !touchStart || !touchEnd || !isDragging) {
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    // Reset states
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  // Calculate the transform for the slider with drag offset
  const calculateTransform = () => {
    if (recentlyViewed.length === 0) return "translateX(0%)";

    const baseTransform = currentIndex * (100 / itemsPerPage);
    const dragTransform =
      (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100;

    // If dragging, add the drag offset to the transform
    if (isDragging && dragOffset !== 0) {
      return `translateX(-${baseTransform}%) translateX(${-dragTransform}px)`;
    }

    return `translateX(-${baseTransform}%)`;
  };

  // Don't show at all if no recently viewed
  if (recentlyViewed.length === 0 && !loading) {
    return null;
  }

  return (
    <ScrollReveal direction="up" delay={0.9} duration={1}>
      <div className="mb-8 bg-white py-10 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-center items-center mb-5">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-medium tracking-normal mb-5 text-gray-900">
                Recently Viewed
              </h1>
              <div className="h-px w-16 bg-gray-400 mx-auto mb-2"></div>
            </div>
          </div>

          {/* Products Carousel */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentlyViewed.length > 0 ? (
            <div className="relative">
              <div
                className="overflow-hidden"
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
              >
                <div
                  ref={sliderRef}
                  className="flex transition-transform duration-300 ease-out"
                  style={{
                    transform: calculateTransform(),
                    transition: isDragging
                      ? "none"
                      : "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                >
                  {recentlyViewed.slice(0, 12).map((product) => {
                    const isSaved = savedProducts[product._id] || false;

                    return (
                      <div
                        key={product._id}
                        className={`${
                          isMobile ? "w-1/2" : isTablet ? "w-1/3" : "w-1/4"
                        } flex-shrink-0 px-2 sm:px-3`}
                        style={{ userSelect: "none", touchAction: "pan-y" }}
                      >
                        <div className="flex flex-col h-full overflow-hidden">
                          {/* Product Image */}
                          <Link to={`/product/${product._id}`}>
                            <div className="relative flex overflow-hidden h-48 sm:h-56 rounded-xs">
                              <img
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                src={product.images?.[0]}
                                alt={product.name}
                              />

                              
                              <div className="absolute inset-0 bg-black opacity-10" />

                              {/* Out of Stock Overlay */}
                              {product.countInStock === 0 && (
                                <div className="absolute inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center">
                                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-sm shadow-lg">
                                    OUT OF STOCK
                                  </span>
                                </div>
                              )}

                              {/* Discount Badge */}
                              <div className="absolute top-0 right-0 h-full bg-opacity-50 flex items-start justify-start ">
                                {product.isPriceSlashed &&
                                  product.previousPrice && (
                                    <span className="bg-red-100 text-red-800  text-xs px-2 py-1">
                                      {Math.round(product.discountPercentage)}%
                                      OFF
                                    </span>
                                  )}
                              </div>
                            </div>
                          </Link>

                          {/* Product Info */}
                          <div className="mt-1 px-2 pb-1 space-y-2 flex flex-col flex-grow">
                            <Link
                              to={`/product/${product._id}`}
                              className="m-0"
                            >
                              <h3 className="text-sm truncate w-full lg:text-md text-gray-600 mb-1 tracking-wider">
                                {product.name}
                              </h3>
                            </Link>

                            <div className="flex justify-between w-full text-gray-900 mt-auto">
                              <Link
                                to={`/product/${product._id}`}
                                className="m-0"
                              >
                                {product.isPriceSlashed &&
                                product.previousPrice ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-black font-medium text-base">
                                      {formatPrice(
                                        product.price,
                                        settings?.currency
                                      )}
                                    </span>
                                    <span className="text-gray-500 line-through text-sm">
                                      {formatPrice(
                                        product.previousPrice,
                                        settings?.currency
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm lg:text-md text-gray-900 font-semibold">
                                    {formatPrice(
                                      product.price,
                                      settings?.currency
                                    )}
                                  </span>
                                )}
                              </Link>

                              <div className="flex gap-3">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (product.countInStock > 0) {
                                      addToCart(product);
                                      toast.success("Added to cart!");
                                    } else {
                                      toast.error(
                                        "This product is out of stock"
                                      );
                                    }
                                  }}
                                  disabled={product.countInStock === 0}
                                  className={`${
                                    product.countInStock === 0
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <ShoppingCart size={20} />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleSave(product);
                                  }}
                                >
                                  {isSaved ? (
                                    <Bookmark
                                      size={20}
                                      className="text-black fill-current"
                                    />
                                  ) : (
                                    <Bookmark
                                      size={20}
                                      className="text-gray-600"
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation buttons - Only show on desktop (1024px and above) */}
              {showChevrons && recentlyViewed.length > itemsPerPage && (
                <>
                  <button
                    onClick={prevSlide}
                    disabled={isStartDisabled}
                    className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                      isStartDisabled
                        ? "bg-gray-200 cursor-not-allowed opacity-50"
                        : "bg-white shadow-lg hover:shadow-xl hover:scale-110 border border-gray-200"
                    }`}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>

                  <button
                    onClick={nextSlide}
                    disabled={isEndDisabled}
                    className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                      isEndDisabled
                        ? "bg-gray-200 cursor-not-allowed opacity-50"
                        : "bg-white shadow-lg hover:shadow-xl hover:scale-110 border border-gray-200"
                    }`}
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>
                </>
              )}

        
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                Your recently viewed products will appear here as you browse
              </p>
            </div>
          )}
        </div>
      </div>
    </ScrollReveal>
  );
};

export default RecentlyViewed;
