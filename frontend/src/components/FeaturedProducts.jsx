// import { useEffect, useState } from "react";
// import { ShoppingCart, ChevronLeft, ChevronRight, } from "lucide-react";
// import { useCartStore } from "../stores/useCartStore.js";
// import { toast } from "react-hot-toast";
// import { Link } from "react-router-dom";
// import ScrollReveal from "./ScrollReveal.jsx";

// const FeaturedProducts = ({ featuredProducts }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [itemsPerPage, setItemsPerPage] = useState(4);

//   // store selected size & color per product
//   const [selectedOptions, setSelectedOptions] = useState({});

//   const { addToCart } = useCartStore();

//   useEffect(() => {
//     if (featuredProducts?.length > 0) {
//       const defaults = {};
//       featuredProducts.forEach((product) => {
//         defaults[product._id] = {
//           size: product.sizes?.[0] || "",
//           color: product.colors?.[0] || "",
//         };
//       });
//       setSelectedOptions(defaults);
//     }
//   }, [featuredProducts]);

 
//   useEffect(() => {
//     const handleResize = () => {
//       if (window.innerWidth < 640) setItemsPerPage(2);
//       else if (window.innerWidth > 840) setItemsPerPage(3);
      
//     };
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   const nextSlide = () => {
//     setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
//   };

//   const prevSlide = () => {
//     setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
//   };

//   const isStartDisabled = currentIndex === 0;
//   const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

//   return (
//     <ScrollReveal direction="up" delay={0.6} duration={1}>
//       <div className="py-19 mt-5">
//         <div className="container mx-auto px-1">
//           <div className="  text-center ">
//             <h1 className="text-3xl md:text-4xl font-medium tracking-normal mb-5 text-gray-900">
//               Just For You
//             </h1>
//             <div className="h-px w-16 bg-gray-400 mx-auto mb-6"></div>
//           </div>
//           <div className="relative">
//             <div className="overflow-hidden">
//               <div
//                 className="flex transition-transform duration-300 ease-in-out"
//                 style={{
//                   transform: `translateX(-${
//                     currentIndex * (100 / itemsPerPage)
//                   }%)`,
//                 }}
//               >
//                 {featuredProducts?.map((product) => {
//                   const { size, color } = selectedOptions[product._id] || {};
//                   return (
//                     <div
//                       key={product._id}
//                       className="w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-1"
//                     >
//                       <div className=" backdrop-blur-sm  overflow-hidden h-full transition-all duration-300 hover:shadow-xl ">
//                         <div className="absolute top-1 right-1 z-10">
//                           {product.isPriceSlashed && product.previousPrice && (
//                             <span className="bg-red-100 text-red-800 rounded text-[0.70rem] font-medium px-1 py-1">
//                               {Math.round(product.discountPercentage)}% OFF
//                             </span>
//                           )}
//                         </div>
//                         <Link to={`/product/${product._id}`}>
//                           <div className="overflow-hidden">
//                             <img
//                               src={product.images?.[0]}
//                               alt={product.name}
//                               className="w-full h-43 sm:h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
//                             />
//                           </div>
//                           <div className="px-2 text-sm truncate w-45">
//                             <h3 className="  text-gray-900 tracking-wider mb-1 ">
//                               {product.name}
//                             </h3>
//                           </div>
//                           <div className="flex justify-between w-full text-gray-900 px-2">
//                             {product.isPriceSlashed && product.previousPrice ? (
//                               <div className="flex items-center gap-2">
//                                 <span className="text-black font-medium text-[1rem]">
//                                   ₦{" "}
//                                   {product.price.toLocaleString(undefined, {
//                                     minimumFractionDigits: 0,
//                                   })}
//                                 </span>
//                                 <span className="text-gray-500 line-through text-[0.82rem]">
//                                   ₦{product.previousPrice.toLocaleString()}
//                                 </span>
//                               </div>
//                             ) : (
//                               <span className="text-sm lg:text-md text-gray-900 font-semibold">
//                                 ₦{" "}
//                                 {product.price.toLocaleString(undefined, {
//                                   minimumFractionDigits: 0,
//                                 })}
//                               </span>
//                             )}
//                             <div>
//                               <ShoppingCart size={20} />
//                             </div>
//                           </div>
//                         </Link>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Navigation buttons */}
//             <button
//               onClick={prevSlide}
//               disabled={isStartDisabled}
//               className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
//                 isStartDisabled
//                   ? "bg-gray-400 cursor-not-allowed"
//                   : "bg-black hover:bg-black/60"
//               }`}
//             >
//               <ChevronLeft className="w-6 h-6" />
//             </button>

//             <button
//               onClick={nextSlide}
//               disabled={isEndDisabled}
//               className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
//                 isEndDisabled
//                   ? "bg-gray-400 cursor-not-allowed"
//                   : "bg-black hover:bg-black/60"
//               }`}
//             >
//               <ChevronRight className="w-6 h-6" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </ScrollReveal>
//   );
// };

// export default FeaturedProducts;
import { useEffect, useState, useRef } from "react";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import { useCartStore } from "../stores/useCartStore.js";
import { useUserStore } from "../stores/useUserStore";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal.jsx";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const FeaturedProducts = ({ featuredProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [savedProducts, setSavedProducts] = useState({});

  // Touch swipe state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const sliderRef = useRef(null);
  const { user } = useUserStore();
  const { settings } = useStoreSettings();

  // store selected size & color per product
  const [selectedOptions, setSelectedOptions] = useState({});

  const { addToCart } = useCartStore();

  useEffect(() => {
    if (featuredProducts?.length > 0) {
      const defaults = {};
      featuredProducts.forEach((product) => {
        defaults[product._id] = {
          size: product.sizes?.[0] || "",
          color: product.colors?.[0] || "",
        };
      });
      setSelectedOptions(defaults);
    }
  }, [featuredProducts]);

  // Check saved status for all products
  useEffect(() => {
    if (user && featuredProducts?.length > 0) {
      featuredProducts.forEach((product) => {
        checkSavedStatus(product._id);
      });
    }
  }, [user, featuredProducts]);

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

  const nextSlide = () => {
    if (currentIndex >= featuredProducts.length - itemsPerPage) return;
    setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
  };

  const prevSlide = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

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

    // Update touch end for swipe detection
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

    // Update touch end for swipe detection
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
    const baseTransform = currentIndex * (100 / itemsPerPage);
    const dragTransform =
      (dragOffset / (sliderRef.current?.offsetWidth || 1)) * 100;

    // If dragging, add the drag offset to the transform
    if (isDragging && dragOffset !== 0) {
      return `translateX(-${baseTransform}%) translateX(${dragTransform}px)`;
    }

    return `translateX(-${baseTransform}%)`;
  };

  return (
    <ScrollReveal direction="up" delay={0.6} duration={1}>
      <div className="py-19 mt-5">
        <div className="container mx-auto px-1 sm:px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-medium tracking-normal mb-5 text-gray-900">
              Just For You
            </h1>
            <div className="h-px w-16 bg-gray-400 mx-auto mb-6"></div>
          </div>

          <div className="relative">
            <div
              className="overflow-hidden"
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
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: calculateTransform(),
                  transition: isDragging
                    ? "none"
                    : "transform 300ms ease-in-out",
                }}
              >
                {featuredProducts?.map((product) => {
                  const { size, color } = selectedOptions[product._id] || {};
                  const isSaved = savedProducts[product._id] || false;

                  return (
                    <div
                      key={product._id}
                      className={`${
                        isMobile ? "w-1/2" : isTablet ? "w-1/3" : "w-1/4"
                      } flex-shrink-0 px-2 sm:px-3`}
                      style={{ userSelect: "none", touchAction: "pan-y" }}
                    >
                      <div className="flex flex-col h-full overflow-hidden border-gray-700">
                        {/* Product Image */}
                        <Link to={`/product/${product._id}`}>
                          <div className="relative flex overflow-hidden h-48 sm:h-56 rounded-xs">
                            <img
                              className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                              src={product.images?.[0]}
                              alt={product.name}
                            />

                            {/* Dark overlay for better contrast */}
                            <div className="absolute inset-0 bg-black opacity-10" />

                            {/* Out of Stock Overlay */}
                            {product.countInStock === 0 && (
                              <div className="absolute top-0 left-0 w-full h-full bg-black/40 bg-opacity-50 flex items-start justify-start p-1">
                                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-md">
                                  OUT OF STOCK
                                </span>
                              </div>
                            )}

                            {/* Discount Badge */}
                            <div className="absolute top-0 right-0 h-full  bg-opacity-50 flex items-start justify-start p-1">
                              {product.isPriceSlashed &&
                                product.previousPrice && (
                                  <span className="bg-red-100 text-red-800 rounded text-xs px-2 py-1">
                                    {Math.round(product.discountPercentage)}%
                                    OFF
                                  </span>
                                )}
                            </div>
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="mt-1 px-2 pb-1 space-y-2 flex flex-col flex-grow">
                          <Link to={`/product/${product._id}`} className="m-0">
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
                                    addToCart({
                                      ...product,
                                      selectedSize: size,
                                      selectedColor: color,
                                    });
                                    toast.success("Added to cart!");
                                  } else {
                                    toast.error("This product is out of stock");
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
            {showChevrons && (
              <>
                <button
                  onClick={prevSlide}
                  disabled={isStartDisabled}
                  className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
                    isStartDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-black/60"
                  }`}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={nextSlide}
                  disabled={isEndDisabled}
                  className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
                    isEndDisabled
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-black/60"
                  }`}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Mobile/Tablet navigation dots */}
            {(isMobile || isTablet) && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from(
                  { length: Math.ceil(featuredProducts.length / itemsPerPage) },
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index * itemsPerPage)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentIndex === index * itemsPerPage
                          ? "bg-black"
                          : "bg-gray-300"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default FeaturedProducts;