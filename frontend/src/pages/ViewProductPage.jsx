import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore.js";
import toast from "react-hot-toast";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { SEO, ProductSEO } from "../components/SEO";
import GoBackButton from "../components/GoBackButton";
import { ChevronUp, ChevronDown } from "lucide-react";
import DOMPurify from "dompurify";
import ProductReviews from "../components/ProductReviews";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";

const ViewProductPage = () => {
  const { id } = useParams();
  const { fetchProductById } = useProductStore();
  const { addToCart, isLoading, cart } = useCartStore();
  const { user } = useUserStore();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const location = useLocation();

  // Price display component
  const PriceDisplay = () => {
    if (!product) return null;

    if (product.isPriceSlashed && product.previousPrice) {
      const discountPercentage =
        product.discountPercentage ||
        (
          ((product.previousPrice - product.price) / product.previousPrice) *
          100
        ).toFixed(0);

      const { settings } = useStoreSettings();

      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[1.5rem] text-black font-bold tracking-tight">
              {formatPrice(product.price, settings?.currency)}
            </span>
            <span className="text-gray-500 line-through text-lg">
              {formatPrice(product.previousPrice, settings?.currency)}
            </span>
            <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
              {discountPercentage}% OFF
            </span>
          </div>
          <p className="text-xs text-green-600 font-medium">
            🎉 You save ₦
            {(product.previousPrice - product.price).toLocaleString()}
          </p>
        </div>
      );
    }
    const { settings } = useStoreSettings();
    return (
      <span className="text-[1.2rem] text-black font-medium tracking-tight">
        {formatPrice(product.price, settings?.currency)}
      </span>
    );
  };

  // Check if product is saved when component loads
  useEffect(() => {
    if (user && product) {
      checkSavedStatus();
    }
  }, [user, product]);

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
      console.error("Error checking saved status:", error);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      toast.error("Please login to add product to wishlist");
      return;
    }

    setIsLoadingSave(true);
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
      setIsLoadingSave(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await fetchProductById(id);
        if (data) {
          setProduct(data);
          setSelectedImage(data?.images?.[0] || "");
          console.log("Product loaded with slash data:", {
            price: data.price,
            previousPrice: data.previousPrice,
            isPriceSlashed: data.isPriceSlashed,
            discountPercentage: data.discountPercentage,
          });
        }
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, fetchProductById]);

  // Calculate variant-specific stock
  const getVariantStock = () => {
    if (!product) return 0;

    // If no variants exist, use overall stock
    if (!product.variants || product.variants.length === 0) {
      return product.countInStock;
    }

    // Find variant that matches the selected options with FLEXIBLE matching
    const variant = product.variants.find((v) => {
      const sizeMatches = selectedSize
        ? v.size === selectedSize
        : !v.size || v.size === "" || v.size === "Standard";
      const colorMatches = selectedColor
        ? v.color === selectedColor
        : !v.color || v.color === "" || v.color === "Standard";
      return sizeMatches && colorMatches;
    });

    return variant ? variant.countInStock : 0;
  };

  // Check if current variant is in cart
  const getVariantInCart = () => {
    return cart.find((item) => {
      const productMatch = item?._id === product?._id;
      const sizeMatch = selectedSize
        ? item?.size === selectedSize
        : !item?.size || item?.size === "" || item?.size === "Standard";
      const colorMatch = selectedColor
        ? item?.color === selectedColor
        : !item?.color || item?.color === "" || item?.color === "Standard";
      return productMatch && sizeMatch && colorMatch;
    });
  };

  const variantStock = getVariantStock();
  const variantInCart = getVariantInCart();
  const currentQuantity = variantInCart?.quantity || 0;
  const availableStock = variantStock - currentQuantity;
  const isOutOfStock = availableStock <= 0;

  // Check if variant exists
  const variantExists = () => {
    if (!product || !product.variants || product.variants.length === 0)
      return true;

    const variant = product.variants.find((v) => {
      const sizeMatches = selectedSize
        ? v.size === selectedSize
        : !v.size || v.size === "" || v.size === "Standard";
      const colorMatches = selectedColor
        ? v.color === selectedColor
        : !v.color || v.color === "" || v.color === "Standard";
      return sizeMatches && colorMatches;
    });

    return !!variant;
  };

  // If user was redirected to rate the product
  useEffect(() => {
    if (!product) return;
    const params = new URLSearchParams(location.search);
    if (params.get("rate") === "true") {
      setTimeout(() => {
        const el = document.getElementById("product-reviews");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [product, location.search]);

  const handleAddToCart = () => {
    // Validation for required selections
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    // Check if variant exists
    if (!variantExists()) {
      toast.error("This variant is not available");
      return;
    }

    // Check available stock
    if (isOutOfStock) {
      toast.error("This variant is out of stock");
      return;
    }

    addToCart(product, selectedSize, selectedColor);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen ">
        <div className="w-12 h-12 border-4  border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  if (!product) return <p className="text-center mt-10">Product not found.</p>;

  const { settings } = useStoreSettings();

  return (
    <div className="min-h-screen ">
      {/* SEO Meta Tags */}
      <ProductSEO
        productName={product.name}
        productDescription={
          product.description?.slice(0, 160) || `Shop ${product.name}`
        }
        productImage={product.images?.[0] || settings?.logo}
        productPrice={product.price}
        productUrl={window.location.href}
        inStock={getVariantStock() > 0}
        rating={product.averageRating || 4.5}
        reviewCount={product.reviews?.length || 0}
        brand={settings?.storeName}
      />
      {/* Header */}
      <motion.div
        className="flex items-center justify-between  py-5 fixed top-0 left-0 right-0 z-40  px-7   bg-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="">
          <GoBackButton />
        </div>
        <span className="text-lg font-semibold tracking-wider text-gray-900">
          {product.name}
        </span>

        <div className="flex items-center gap-4">
          {/* Cart Link */}
          <Link to={"/cart"} className="relative text-black ">
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white rounded-full px-2 text-xs">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg shadow-md"
            />

            <div className="flex mt-4 gap-2 overflow-x-auto">
              {product.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`thumb-${index}`}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border ${
                    selectedImage === img
                      ? "border-yellow-600"
                      : "border-gray-300"
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col space-y-5">
            <div className="flex justify-between items-start">
              <span className="text-2xl tracking-wider text-black m-0 ">
                {product.name}
              </span>
            </div>

            {/* Price Display */}
            <PriceDisplay />

            {/* Product Badges */}
            <div className="flex gap-2">
              {product.isPriceSlashed && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Limited Time Offer
                </span>
              )}
            </div>

            {/* Color Options */}
            {product.colors?.length > 0 && (
              <div>
                <h3 className="text-gray-800 tracking-widest ">Colors:</h3>
                <div className="flex gap-2 flex-wrap tracking-wider">
                  {product.colors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1  hover:bg-gray-300  border-2 ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Options */}
            {product.sizes?.length > 0 && (
              <div>
                <h3 className="text-gray-800  tracking-widest">Sizes:</h3>
                <div className="flex gap-2 flex-wrap tracking-wider ">
                  {product.sizes.map((size, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 hover:bg-gray-300 border-2 ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              {/* Stock information */}
              {product.variants?.length > 0 ? (
                (selectedSize ||
                  selectedColor ||
                  (product.sizes?.length === 0 &&
                    product.colors?.length === 0)) &&
                variantExists() ? (
                  availableStock > 0 ? (
                    <p className="text-gray-500 text-xs mt-1">
                      In Stock:{" "}
                      <span className="">{availableStock} available</span>
                      {currentQuantity > 0 && (
                        <span className="text-gray-600 text-xs ml-2">
                          {currentQuantity} in cart
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-red-500 text-xs mt-1">Out of stock</p>
                  )
                ) : // Show nothing or hint when selection is incomplete
                (product.colors?.length > 0 && !selectedColor) ||
                  (product.sizes?.length > 0 && !selectedSize) ? (
                  <p className="text-gray-400 text-xs mt-1">
                    Select options to see availability
                  </p>
                ) : null
              ) : // For products without variants
              product.countInStock > 0 ? (
                <p className="text-gray-500 text-xs mt-1">
                  In Stock:{" "}
                  <span className="">{product.countInStock} available</span>
                </p>
              ) : (
                ""
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={
                  isLoading ||
                  (product.colors?.length > 0 && !selectedColor) ||
                  (product.sizes?.length > 0 && !selectedSize) ||
                  !variantExists() ||
                  isOutOfStock ||
                  product.countInStock <= 0
                }
                className={`flex-1 py-3 rounded-lg transition tracking-widest ${
                  isLoading ||
                  (product.colors?.length > 0 && !selectedColor) ||
                  (product.sizes?.length > 0 && !selectedSize) ||
                  !variantExists() ||
                  isOutOfStock ||
                  product.countInStock <= 0
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-black text-white hover:bg-black/80"
                }`}
              >
                {isLoading
                  ? "Adding to Cart..."
                  : product.countInStock <= 0
                  ? "Out of Stock"
                  : !variantExists()
                  ? "Add to Cart"
                  : isOutOfStock
                  ? "This variant is out of stock"
                  : "Add to Cart"}
              </button>

              {/* Save Button - Side by Side */}
              <button
                onClick={toggleSave}
                disabled={isLoadingSave}
                className={`p-3 border rounded-lg transition flex items-center justify-center ${
                  isSaved
                    ? "border-red-300 bg-red-50 text-black"
                    : "border-gray-300 hover:bg-gray-50 text-gray-600"
                } ${isLoadingSave ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isLoadingSave ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-current rounded-full animate-spin"></div>
                ) : isSaved ? (
                  <Heart size={20} className="fill-current" />
                ) : (
                  <Heart size={20} />
                )}
              </button>
            </div>

            {/* Shipping Info */}

            {product.isPriceSlashed && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    <span className=" text-sm">🎁</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    Enjoy your purchase on discount sale
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Accordion */}
      <div className=" border-gray-700 py-3 lg:pr-80  px-4 sm:px-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center w-full text-left focus:outline-none"
        >
          <span className="text-1xl text-black hover:text-black/60 transition-colors whitespace-nowrap tracking-widest">
            Product details
          </span>

          <span className="text-gray-600 rounded-4xl mr-3 transition-transform duration-300 h-7 w-7 flex items-center justify-center">
            {isOpen ? <ChevronDown size={22} /> : <ChevronUp size={20} />}
          </span>
        </button>
        <div className="border-b-1 text-gray-400"></div>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? " mt-2" : "max-h-0"
          }`}
        >
          <div
            className="text-black text-sm pl-9 pr-3 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(product.description),
            }}
          ></div>

          {/* Price History Section (Admin only or for transparency) */}
          {user?.role === "admin" && product.isPriceSlashed && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Price History (Admin View)
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">Current Price:</span>
                  <span className="font-medium">
                    {formatPrice(product.price, settings?.currency)}
                    {product.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Original Price:</span>
                  <span className="line-through">
                    {formatPrice(product.price, settings?.currency)}
                    {product.previousPrice?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Discount:</span>
                  <span className="text-red-600 font-medium">
                    {(
                      ((product.previousPrice - product.price) /
                        product.previousPrice) *
                      100
                    ).toFixed(1)}
                    % OFF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">You Save:</span>
                  <span className="text-green-600 font-medium">
                    ₦{(product.previousPrice - product.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div id="product-reviews">
        <ProductReviews productId={product._id} />
      </div>
    </div>
  );
};

export default ViewProductPage;
