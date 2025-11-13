import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import GoBackButton from "../components/GoBackButton";
import { ChevronUp, ChevronDown } from "lucide-react";
import DOMPurify from "dompurify";
import ProductReviews from "../components/ProductReviews";

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
  const location = useLocation();

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      const data = await fetchProductById(id);
      setProduct(data);
      setSelectedImage(data?.images?.[0]);
      setLoading(false);
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

    // Find the specific variant
    const variant = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );

    return variant ? variant.countInStock : 0;
  };

  // Check if current variant is in cart
  const getVariantInCart = () => {
    return cart.find(
      (item) =>
        item?._id === product?._id &&
        item?.size === selectedSize &&
        item?.color === selectedColor
    );
  };

  const variantStock = getVariantStock();
  const variantInCart = getVariantInCart();
  const currentQuantity = variantInCart?.quantity || 0;
  const availableStock = variantStock - currentQuantity;

  const isOutOfStock = availableStock <= 0;

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
    if (product.colors?.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    // Additional variant validation
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

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between  py-5 fixed top-0 left-0 right-0 z-40 shadow-sm px-6   bg-gradient-to-br from-white via-gray-100 to-gray-300"
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

        <Link to={"/cart"} className="relative text-black ">
          <ShoppingCart size={22} />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-black text-white rounded-full px-2 text-xs">
              {cart.length}
            </span>
          )}
        </Link>
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
            <span className="text-2xl tracking-widest text-black m-0 mb-2">
              {product.name}
            </span>
            <span className="text-1xl text-gray-900 tracking-tight">
              ₦{" "}
              {product.price.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </span>

            {/* Color Options */}
            {product.colors?.length > 0 && (
              <div>
                <h3 className="text-gray-800 tracking-widest mb-2">Colors:</h3>
                <div className="flex gap-2 flex-wrap tracking-widest">
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
                <h3 className="text-gray-800  mb-2 tracking-widest">Sizes:</h3>
                <div className="flex gap-2 flex-wrap tracking-widest ">
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
              {/* Only show variant-specific stock if both color and size are selected (when applicable) */}
              {product.variants?.length > 0 &&
              ((product.colors?.length > 0 && !selectedColor) ||
                (product.sizes?.length > 0 && !selectedSize)) ? (
                <p className="text-gray-500 text-sm italic"></p>
              ) : availableStock > 0 ? (
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
                ""
              )}
            </div>

            {/* Add to Cart Button - UPDATED */}
            {/* Add to Cart Button - FINAL CLEAN UX */}
            <button
              onClick={handleAddToCart}
              disabled={
                isLoading ||
                // disable until required options are selected
                (product.colors?.length > 0 && !selectedColor) ||
                (product.sizes?.length > 0 && !selectedSize) ||
                // disable only if selected variant is out of stock
                (selectedColor || selectedSize ? isOutOfStock : false) ||
                // disable if entire product has no stock
                product.countInStock <= 0
              }
              className={`w-full py-3 rounded-lg transition tracking-widest ${
                isLoading ||
                (product.colors?.length > 0 && !selectedColor) ||
                (product.sizes?.length > 0 && !selectedSize) ||
                (selectedColor || selectedSize ? isOutOfStock : false) ||
                product.countInStock <= 0
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              {isLoading
                ? "Adding to Cart..."
                : product.countInStock <= 0
                ? "Out of Stock"
                : selectedColor && selectedSize && isOutOfStock
                ? "This variant is out of stock"
                : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same */}
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
        </div>
      </div>

      <div id="product-reviews">
        <ProductReviews productId={product._id} />
      </div>
    </div>
  );
};

export default ViewProductPage;
