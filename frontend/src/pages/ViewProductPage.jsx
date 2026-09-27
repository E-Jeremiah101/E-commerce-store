// import { useEffect, useState } from "react";
// import { useParams, Link, useLocation } from "react-router-dom";
// import { motion } from "framer-motion";
// import { useProductStore } from "../stores/useProductStore.js";
// import toast from "react-hot-toast";
// import ErrorBoundary from "../components/ErrorBoundary.jsx";
// import { ShoppingCart, Heart } from "lucide-react";
// import { useCartStore } from "../stores/useCartStore";
// import { useUserStore } from "../stores/useUserStore";
// import { SEO, ProductSEO } from "../components/SEO";
// import GoBackButton from "../components/GoBackButton";
// import { ChevronUp, ChevronDown } from "lucide-react";
// import DOMPurify from "dompurify";
// import ProductReviews from "../components/ProductReviews";
// import { formatPrice } from "../utils/currency.js";
// import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
// import RecentlyViewed from "../components/RecentlyViewed.jsx";

// const ViewProductPageContent = () => {
//   const { id } = useParams();
//   const { fetchProductById } = useProductStore();
//   const { addToCart, isLoading, cart } = useCartStore();
//   const { user } = useUserStore();

//   const [product, setProduct] = useState(null);
//   const [selectedImage, setSelectedImage] = useState("");
//   const [selectedColor, setSelectedColor] = useState("");
//   const [selectedSize, setSelectedSize] = useState("");
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [isSaved, setIsSaved] = useState(false);
//   const [isLoadingSave, setIsLoadingSave] = useState(false);
//   const location = useLocation();

//   const PriceDisplay = () => {
//     if (!product) return null;

//     if (product.isPriceSlashed && product.previousPrice) {
//       const discountPercentage =
//         product.discountPercentage ||
//         (
//           ((product.previousPrice - product.price) / product.previousPrice) *
//           100
//         ).toFixed(0);

//       const { settings } = useStoreSettings();

//       return (
//         <div className="flex flex-col gap-2">
//           <div className="flex items-center gap-3">
//             <span className="text-[1.5rem] text-black font-bold tracking-tight">
//               {formatPrice(product.price, settings?.currency)}
//             </span>
//             <span className="text-gray-500 line-through text-lg">
//               {formatPrice(product.previousPrice, settings?.currency)}
//             </span>
//             <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
//               {Math.round(discountPercentage)}% off
//             </span>
//           </div>
//           <p className="text-xs text-green-600 font-medium">
//              You save {" "}
//             {formatPrice(Math.round(product.previousPrice - product.price), settings?.currency)}
//           </p>
//         </div>
//       );
//     }
//     return (
//       <span className="text-[1.2rem] text-black font-medium tracking-tight">
//         {formatPrice(product.price, settings?.currency)}
//       </span>
//     );
//   };

//   useEffect(() => {
//     if (user && product) {
//       checkSavedStatus();
//     }
//   }, [user, product]);

//   const checkSavedStatus = async () => {
//     try {
//       const response = await fetch(`/api/saved-products/check/${product._id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       const data = await response.json();
//       setIsSaved(data.isSaved);
//     } catch (error) {
//       console.error("Error checking saved status:", error);
//     }
//   };

//   const toggleSave = async () => {
//     if (!user) {
//       toast.error("Please login to add product to wishlist");
//       return;
//     }

//     setIsLoadingSave(true);
//     try {
//       if (isSaved) {

//         await fetch(`/api/saved-products/${product._id}`, {
//           method: "DELETE",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setIsSaved(false);
//         toast.success("Removed from wishlist");
//       } else {

//         await fetch("/api/saved-products", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify({ productId: product._id }),
//         });
//         setIsSaved(true);
//         toast.success("Product successfully added to your wishlist!");
//       }
//     } catch (error) {
//       console.error("Error toggling save:", error);
//       toast.error("Failed to update saved items");
//     } finally {
//       setIsLoadingSave(false);
//     }
//   };

//   useEffect(() => {
//     const loadProduct = async () => {
//       setLoading(true);
//       try {
//         const data = await fetchProductById(id);
//         if (data) {
//           setProduct(data);
//           setSelectedImage(data?.images?.[0] || "");
//           console.log("Product loaded with slash data:", {
//             price: data.price,
//             previousPrice: data.previousPrice,
//             isPriceSlashed: data.isPriceSlashed,
//             discountPercentage: data.discountPercentage,
//           });
//         }
//       } catch (error) {
//         console.error("Error loading product:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadProduct();
//   }, [id, fetchProductById]);

//   // Calculate variant-specific stock
//   const getVariantStock = () => {
//     if (!product) return 0;

//     // If no variants exist, use overall stock
//     if (!product.variants || product.variants.length === 0) {
//       return product.countInStock;
//     }

//     // Find variant that matches the selected options with FLEXIBLE matching
//     const variant = product.variants.find((v) => {
//       const sizeMatches = selectedSize
//         ? v.size === selectedSize
//         : !v.size || v.size === "" || v.size === "Standard";
//       const colorMatches = selectedColor
//         ? v.color === selectedColor
//         : !v.color || v.color === "" || v.color === "Standard";
//       return sizeMatches && colorMatches;
//     });

//     return variant ? variant.countInStock : 0;
//   };

//   // Check if current variant is in cart
//   const getVariantInCart = () => {
//     return cart.find((item) => {
//       const productMatch = item?._id === product?._id;
//       const sizeMatch = selectedSize
//         ? item?.size === selectedSize
//         : !item?.size || item?.size === "" || item?.size === "Standard";
//       const colorMatch = selectedColor
//         ? item?.color === selectedColor
//         : !item?.color || item?.color === "" || item?.color === "Standard";
//       return productMatch && sizeMatch && colorMatch;
//     });
//   };

//   const variantStock = getVariantStock();
//   const variantInCart = getVariantInCart();
//   const currentQuantity = variantInCart?.quantity || 0;
//   const availableStock = variantStock - currentQuantity;
//   const isOutOfStock = availableStock <= 0;

//   // Check if variant exists
//   const variantExists = () => {
//     if (!product || !product.variants || product.variants.length === 0)
//       return true;

//     const variant = product.variants.find((v) => {
//       const sizeMatches = selectedSize
//         ? v.size === selectedSize
//         : !v.size || v.size === "" || v.size === "Standard";
//       const colorMatches = selectedColor
//         ? v.color === selectedColor
//         : !v.color || v.color === "" || v.color === "Standard";
//       return sizeMatches && colorMatches;
//     });

//     return !!variant;
//   };

//   useEffect(() => {
//     if (!product) return;
//     const params = new URLSearchParams(location.search);
//     if (params.get("rate") === "true") {
//       setTimeout(() => {
//         const el = document.getElementById("product-reviews");
//         if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
//       }, 300);
//     }
//   }, [product, location.search]);

//   const handleAddToCart = () => {

//     if (product.colors?.length > 0 && !selectedColor) {
//       toast.error("Please select a color");
//       return;
//     }
//     if (product.sizes?.length > 0 && !selectedSize) {
//       toast.error("Please select a size");
//       return;
//     }

//     if (!variantExists()) {
//       toast.error("This variant is not available");
//       return;
//     }

//     if (isOutOfStock) {
//       toast.error("This variant is out of stock");
//       return;
//     }

//     addToCart(product, selectedSize, selectedColor);
//   };

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-screen ">
//         <div className="w-12 h-12 border-4  border-gray-300 border-t-black rounded-full animate-spin"></div>
//       </div>
//     );

//   if (!product) return <p className="text-center mt-10">Product not found.</p>;

//   const { settings } = useStoreSettings();

//   return (
//     <div className="min-h-screen ">
//       {/* SEO Meta Tags */}
//       <ProductSEO
//         productName={product.name}
//         productDescription={
//           product.description?.slice(0, 160) || `Shop ${product.name}`
//         }
//         productImage={product.images?.[0] || settings?.logo}
//         productPrice={product.price}
//         productUrl={window.location.href}
//         inStock={getVariantStock() > 0}
//         rating={product.averageRating || 4.5}
//         reviewCount={product.reviews?.length || 0}
//         brand={settings?.storeName}
//       />
//       {/* Header */}
//       <motion.div
//         className="flex items-center justify-between  py-5 fixed top-0 left-0 right-0 z-40  px-7   bg-white"
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//       >
//         <div className="">
//           <GoBackButton />
//         </div>
//         <span className="text-lg font-semibold tracking-wider text-gray-900">
//           {product.name}
//         </span>

//         <div className="flex items-center gap-4">
//           {/* Cart Link */}
//           <Link
//             to="/cart"
//             className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//             aria-label="Shopping Cart"
//           >
//             <ShoppingCart size={20} />
//             {cart.length > 0 && (
//               <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
//                 {cart.length}
//               </span>
//             )}
//           </Link>
//         </div>
//       </motion.div>

//       {/* Content */}
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
//           {/* Image Gallery */}
//           <div>
//             <img
//               src={selectedImage}
//               alt={product.name}
//               className="w-full h-96 object-cover rounded-lg shadow-md"
//             />

//             <div className="flex mt-4 gap-2 overflow-x-auto">
//               {product.images.map((img, index) => (
//                 <img
//                   key={index}
//                   src={img}
//                   alt={`thumb-${index}`}
//                   className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
//                     selectedImage === img
//                       ? "border-yellow-600"
//                       : "border-gray-300"
//                   }`}
//                   onClick={() => setSelectedImage(img)}
//                 />
//               ))}
//             </div>
//           </div>

//           {/* Details */}
//           <div className="flex flex-col space-y-5">
//             <div className="flex justify-between items-start">
//               <span className="text-2xl tracking-wider text-black m-0 ">
//                 {product.name}
//               </span>
//             </div>

//             {/* Price Display */}
//             <PriceDisplay />

//             {/* Product Badges */}
//             <div className="flex gap-2">
//               {product.isPriceSlashed && (
//                 <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
//                   Limited Time Offer
//                 </span>
//               )}
//             </div>

//             {/* Color Options */}
//             {product.colors?.length > 0 && (
//               <div>
//                 <h3 className="text-gray-800 tracking-widest ">Colors:</h3>
//                 <div className="flex gap-2 flex-wrap tracking-wider">
//                   {product.colors.map((color, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setSelectedColor(color)}
//                       className={`px-3 py-1  hover:bg-gray-300  border-2 ${
//                         selectedColor === color
//                           ? "border-black bg-black text-white"
//                           : "border-gray-300"
//                       }`}
//                     >
//                       {color}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Size Options */}
//             {product.sizes?.length > 0 && (
//               <div>
//                 <h3 className="text-gray-800  tracking-widest">Sizes:</h3>
//                 <div className="flex gap-2 flex-wrap tracking-wider ">
//                   {product.sizes.map((size, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setSelectedSize(size)}
//                       className={`px-3 py-1 hover:bg-gray-300 border-2 ${
//                         selectedSize === size
//                           ? "border-black bg-black text-white"
//                           : "border-gray-300"
//                       }`}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div>
//               {/* Stock information */}
//               {product.variants?.length > 0 ? (
//                 (selectedSize ||
//                   selectedColor ||
//                   (product.sizes?.length === 0 &&
//                     product.colors?.length === 0)) &&
//                 variantExists() ? (
//                   availableStock > 0 ? (
//                     <p className="text-gray-500 text-xs mt-1">
//                       In Stock:{" "}
//                       <span className="">{availableStock} available</span>
//                       {currentQuantity > 0 && (
//                         <span className="text-gray-600 text-xs ml-2">
//                           {currentQuantity} in cart
//                         </span>
//                       )}
//                     </p>
//                   ) : (
//                     <p className="text-red-500 text-xs mt-1">Out of stock</p>
//                   )
//                 ) :
//                 (product.colors?.length > 0 && !selectedColor) ||
//                   (product.sizes?.length > 0 && !selectedSize) ? (
//                   <p className="text-gray-400 text-xs mt-1">
//                     Select options to see availability
//                   </p>
//                 ) : null
//               ) :
//               product.countInStock > 0 ? (
//                 <p className="text-gray-500 text-xs mt-1">
//                   In Stock:{" "}
//                   <span className="">{product.countInStock} available</span>
//                 </p>
//               ) : (
//                 ""
//               )}
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3">
//               {/* Add to Cart Button */}
//               <button
//                 onClick={handleAddToCart}
//                 disabled={
//                   isLoading ||
//                   (product.colors?.length > 0 && !selectedColor) ||
//                   (product.sizes?.length > 0 && !selectedSize) ||
//                   !variantExists() ||
//                   isOutOfStock ||
//                   product.countInStock <= 0
//                 }
//                 className={`flex-1 py-3 rounded-lg transition tracking-widest ${
//                   isLoading ||
//                   (product.colors?.length > 0 && !selectedColor) ||
//                   (product.sizes?.length > 0 && !selectedSize) ||
//                   !variantExists() ||
//                   isOutOfStock ||
//                   product.countInStock <= 0
//                     ? "bg-gray-400 text-white cursor-not-allowed"
//                     : "bg-black text-white hover:bg-black/80"
//                 }`}
//               >
//                 {isLoading
//                   ? "Adding to Cart..."
//                   : product.countInStock <= 0
//                   ? "Out of Stock"
//                   : !variantExists()
//                   ? "Add to Cart"
//                   : isOutOfStock
//                   ? "This variant is out of stock"
//                   : "Add to Cart"}
//               </button>

//               {/* Save Button - Side by Side */}
//               <button
//                 onClick={toggleSave}
//                 disabled={isLoadingSave}
//                 className={`p-3 border rounded-lg transition flex items-center justify-center ${
//                   isSaved
//                     ? "border-red-300 bg-red-50 text-black"
//                     : "border-gray-300 hover:bg-gray-50 text-gray-600"
//                 } ${isLoadingSave ? "opacity-50 cursor-not-allowed" : ""}`}
//                 title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
//               >
//                 {isLoadingSave ? (
//                   <div className="w-5 h-5 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
//                 ) : isSaved ? (
//                   <Heart size={20} className="fill-current" />
//                 ) : (
//                   <Heart size={20} />
//                 )}
//               </button>
//             </div>

//             {/* Shipping Info */}

//             {product.isPriceSlashed && (
//               <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//                 <div className="flex items-center gap-2 mb-2">
//                   <div className="w-6 h-6 rounded-full flex items-center justify-center">
//                     <span className=" text-sm">🎁</span>
//                   </div>
//                   <span className="text-sm font-medium text-green-600">
//                     Enjoy your purchase on discount sale
//                   </span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Product Details Accordion */}
//       <div className=" border-gray-700 py-3 lg:pr-80  px-4 sm:px-6">
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="flex items-center w-full text-left focus:outline-none"
//         >
//           <span className="text-1xl text-black hover:text-black/60 transition-colors whitespace-nowrap tracking-widest">
//             Product details
//           </span>

//           <span className="text-gray-600 rounded-4xl mr-3 transition-transform duration-300 h-7 w-7 flex items-center justify-center">
//             {isOpen ? <ChevronDown size={22} /> : <ChevronUp size={20} />}
//           </span>
//         </button>
//         <div className="border-b-1 text-gray-400"></div>

//         <div
//           className={`overflow-hidden transition-all duration-300 ${
//             isOpen ? " mt-2" : "max-h-0"
//           }`}
//         >
//           <div
//             className="text-black text-sm pl-9 pr-3 leading-relaxed"
//             dangerouslySetInnerHTML={{
//               __html: DOMPurify.sanitize(product.description),
//             }}
//           ></div>
//         </div>
//       </div>

//       {/* Reviews Section */}
//       <div id="product-reviews">
//         <ProductReviews productId={product._id} />
//       </div>

//       <RecentlyViewed className="look" />
//     </div>
//   );
// };

// export default function ViewProductPage() {
//   return (
//     <ErrorBoundary>
//       <ViewProductPageContent />
//     </ErrorBoundary>
//   );
// }

import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore.js";
import toast from "react-hot-toast";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import {
  ShoppingCart,
  Heart,
  ChevronDown,
  ChevronUp,
  Package,
  Tag,
} from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { ProductSEO } from "../components/SEO";
import GoBackButton from "../components/GoBackButton";
import DOMPurify from "dompurify";
import ProductReviews from "../components/ProductReviews";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";
import RecentlyViewed from "../components/RecentlyViewed.jsx";

/* ---------- Primitives ---------- */

const PriceDisplay = ({ product, currency }) => {
  if (!product) return null;

  if (product.isPriceSlashed && product.previousPrice) {
    const discountPct =
      product.discountPercentage ??
      Math.round(
        ((product.previousPrice - product.price) / product.previousPrice) * 100,
      );
    const saved = product.previousPrice - product.price;

    return (
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl font-semibold tracking-tight text-neutral-900">
            {formatPrice(product.price, currency)}
          </span>
          <span className="text-base text-neutral-400 line-through">
            {formatPrice(product.previousPrice, currency)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
            −{discountPct}%
          </span>
        </div>
        <p className="text-xs text-green-500">
          You save {formatPrice(Math.round(saved), currency)}
        </p>
      </div>
    );
  }

  return (
    <span className="text-2xl font-semibold tracking-tight text-neutral-900">
      {formatPrice(product.price, currency)}
    </span>
  );
};

const OptionGroup = ({ label, options, selected, onSelect }) => {
  if (!options?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {selected && (
          <span className="text-xs text-neutral-500">{selected}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <button
              key={option}
              onClick={() => onSelect(option)}
              className={`px-3.5 py-2 text-sm font-medium rounded-md border transition-colors ${
                isActive
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Accordion = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-neutral-200">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full py-4 text-left group"
      >
        <span className="text-sm font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
          {title}
        </span>
        {open ? (
          <ChevronUp size={18} className="text-neutral-500" />
        ) : (
          <ChevronDown size={18} className="text-neutral-500" />
        )}
      </button>
      {open && (
        <div className="pb-5 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

/* ---------- Main ---------- */

const ViewProductPageContent = () => {
  const { id } = useParams();
  const location = useLocation();
  const { fetchProductById } = useProductStore();
  const { addToCart, isLoading, cart } = useCartStore();
  const { user } = useUserStore();
  const { settings } = useStoreSettings();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  /* ---------- Data loading ---------- */

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await fetchProductById(id);
        if (!cancelled && data) {
          setProduct(data);
          setSelectedImage(data.images?.[0] || "");
          // Auto-select if there's only one option
          if (data.colors?.length === 1) setSelectedColor(data.colors[0]);
          if (data.sizes?.length === 1) setSelectedSize(data.sizes[0]);
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id, fetchProductById]);

  /* Check wishlist status */
  useEffect(() => {
    if (!user || !product?._id) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/saved-products/check/${product._id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (!cancelled) setIsSaved(data.isSaved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [user, product?._id]);

  /* Scroll to reviews when ?rate=true */
  useEffect(() => {
    if (!product) return;
    const params = new URLSearchParams(location.search);
    if (params.get("rate") === "true") {
      setTimeout(() => {
        document
          .getElementById("product-reviews")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [product, location.search]);

  /* ---------- Variant logic ---------- */

  const variantInfo = useMemo(() => {
    if (!product) {
      return {
        stock: 0,
        inCart: 0,
        available: 0,
        exists: true,
        outOfStock: false,
      };
    }

    const hasVariants = product.variants?.length > 0;

    if (!hasVariants) {
      const inCart = cart
        .filter((i) => i._id === product._id)
        .reduce((sum, i) => sum + (i.quantity || 0), 0);
      const available = Math.max(0, (product.countInStock || 0) - inCart);
      return {
        stock: product.countInStock || 0,
        inCart,
        available,
        exists: true,
        outOfStock: available <= 0,
      };
    }

    const matches = (v) => {
      const sizeMatches = selectedSize
        ? v.size === selectedSize
        : !v.size || v.size === "" || v.size === "Standard";
      const colorMatches = selectedColor
        ? v.color === selectedColor
        : !v.color || v.color === "" || v.color === "Standard";
      return sizeMatches && colorMatches;
    };

    const variant = product.variants.find(matches);
    const inCart = cart
      .filter((item) => {
        const productMatch = item?._id === product._id;
        const sizeMatch = selectedSize
          ? item?.size === selectedSize
          : !item?.size || item?.size === "" || item?.size === "Standard";
        const colorMatch = selectedColor
          ? item?.color === selectedColor
          : !item?.color || item?.color === "" || item?.color === "Standard";
        return productMatch && sizeMatch && colorMatch;
      })
      .reduce((sum, i) => sum + (i.quantity || 0), 0);

    const stock = variant?.countInStock || 0;
    const available = Math.max(0, stock - inCart);

    return {
      stock,
      inCart,
      available,
      exists: !!variant,
      outOfStock: available <= 0,
    };
  }, [product, selectedSize, selectedColor, cart]);

  const requiresSelection =
    (product?.colors?.length > 0 && !selectedColor) ||
    (product?.sizes?.length > 0 && !selectedSize);

  const canAddToCart =
    !isLoading &&
    !requiresSelection &&
    variantInfo.exists &&
    !variantInfo.outOfStock;

  /* ---------- Actions ---------- */

  const handleAddToCart = () => {
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!variantInfo.exists) {
      toast.error("This variant is not available");
      return;
    }
    if (variantInfo.outOfStock) {
      toast.error("This variant is out of stock");
      return;
    }
    addToCart(product, selectedSize, selectedColor);
  };

  const toggleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save to your wishlist");
      return;
    }

    setIsLoadingSave(true);
    try {
      if (isSaved) {
        await fetch(`/api/saved-products/${product._id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setIsSaved(false);
        toast.success("Removed from wishlist");
      } else {
        await fetch("/api/saved-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ productId: product._id }),
        });
        setIsSaved(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setIsLoadingSave(false);
    }
  };

 
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-neutral-50">
        <div className="w-10 h-10 border-[3px] border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-500 gap-3">
        <p className="text-lg">Product not found</p>
        <Link
          to="/"
          className="text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Back to store
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-neutral-50">
      <ProductSEO
        productName={product.name}
        productDescription={
          product.description?.slice(0, 160) || `Shop ${product.name}`
        }
        productImage={product.images?.[0] || settings?.logo}
        productPrice={product.price}
        productUrl={window.location.href}
        inStock={variantInfo.stock > 0}
        rating={product.averageRating || 4.5}
        reviewCount={product.reviews?.length || 0}
        brand={settings?.storeName}
      />

      {/* Sticky header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-30 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200/60"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-14">
            <GoBackButton fallback="/" />

            <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-neutral-900 truncate max-w-[40%]">
              {product.name}
            </h1>

            <Link
              to="/cart"
              aria-label="Cart"
              className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-neutral-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-neutral-50">
                  {cart.length > 99 ? "99+" : cart.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <img
                src={selectedImage || product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, index) => {
                  const isActive = selectedImage === img;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      aria-label={`View image ${index + 1}`}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        isActive
                          ? "border-neutral-900"
                          : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 leading-snug">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-sm text-neutral-500 mt-1">
                  by {product.brand}
                </p>
              )}
            </div>

            <PriceDisplay product={product} currency={settings?.currency} />

            {product.isPriceSlashed && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-700 text-yellow-100 w-fit">
                <Tag size={14} />
                <span className="text-xs font-medium">On sale</span>
              </div>
            )}

            <OptionGroup
              label="Color"
              options={product.colors}
              selected={selectedColor}
              onSelect={setSelectedColor}
            />

            <OptionGroup
              label="Size"
              options={product.sizes}
              selected={selectedSize}
              onSelect={setSelectedSize}
            />

            {/* Stock line */}
            <div className="min-h-[20px]">
              {product.variants?.length > 0 ? (
                requiresSelection ? (
                  <p className="text-xs text-neutral-500">
                    Select options to see availability
                  </p>
                ) : variantInfo.exists ? (
                  variantInfo.available > 0 ? (
                    <p className="text-xs text-neutral-500">
                      <span className="text-neutral-900 font-medium">
                        In stock
                      </span>
                      {" · "}
                      {variantInfo.available} available
                      {variantInfo.inCart > 0 && (
                        <> · {variantInfo.inCart} in cart</>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-neutral-500">
                      <span className="text-neutral-900 font-medium">
                        Out of stock
                      </span>
                    </p>
                  )
                ) : (
                  <p className="text-xs text-neutral-500">
                    This combination isn't available
                  </p>
                )
              ) : product.countInStock > 0 ? (
                <p className="text-xs text-neutral-500">
                  <span className="text-neutral-900 font-medium">In stock</span>
                  {" · "}
                  {product.countInStock} available
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  <span className="text-neutral-900 font-medium">
                    Out of stock
                  </span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-lg text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  "Adding..."
                ) : requiresSelection ? (
                  "Select options"
                ) : !variantInfo.exists ? (
                  "Unavailable"
                ) : variantInfo.outOfStock ? (
                  "Out of stock"
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Add to cart
                  </>
                )}
              </button>

              <button
                onClick={toggleSave}
                disabled={isLoadingSave}
                aria-label={
                  isSaved ? "Remove from wishlist" : "Add to wishlist"
                }
                className={`w-12 h-12 flex items-center justify-center rounded-lg border transition-colors ${
                  isSaved
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoadingSave ? (
                  <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                ) : (
                  <Heart size={18} className={isSaved ? "fill-current" : ""} />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Description */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-6">
            <Accordion title="Product details">
              <div
                className="prose prose-sm max-w-none text-neutral-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(product.description || ""),
                }}
              />
            </Accordion>
            <Accordion title="Shipping & returns">
              <p className="text-sm text-neutral-600 leading-relaxed">
                Orders ship within 1–3 business days. Delivery typically takes
                3–7 business days depending on your location. Returns are
                accepted within 7 days of delivery for unused items in their
                original packaging.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div
        id="product-reviews"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <ProductReviews productId={product._id} />
        </div>
      </div>

      <RecentlyViewed className="look" />
    </div>
  );
};

export default function ViewProductPage() {
  return (
    <ErrorBoundary>
      <ViewProductPageContent />
    </ErrorBoundary>
  );
}