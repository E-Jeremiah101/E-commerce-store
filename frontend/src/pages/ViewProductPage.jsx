import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import toast from "react-hot-toast";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import GoBackButton from "../components/GoBackButton";

const ViewProductPage = () => {
  const { id } = useParams();
  const { fetchProductById } = useProductStore();
  const { addToCart, isLoading } = useCartStore();
  const { user } = useUserStore();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  const [loading, setLoading] = useState(true);

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

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add products to cart", { id: "login" });
      return;
    }
    if (!selectedColor || !selectedSize) {
      toast.error("Please select a color and size");
      return;
    }
    addToCart(
      product,
      selectedColor,
      selectedSize,
    
    );
    

  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  if (!product) return <p className="text-center mt-10">Product not found.</p>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.div
        className="flex items-center justify-center bg-white py-5 fixed top-0 left-0 right-0 z-40 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute left-4">
          <GoBackButton />
        </div>
        <span className="text-lg font-semibold tracking-wider text-gray-900">
          {product.name}
        </span>
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
            <h2 className="text-2xl tracking-widest text-gray-900">
              {product.name}
            </h2>
            <p className="text-xl font-bold text-black tracking-tight">
              ₦{" "}
              {product.price.toLocaleString(undefined, {
                minimumFractionDigits: 0,
              })}
            </p>

            {/* Color Options */}
            {product.colors?.length > 0 && (
              <div>
                <h3 className="text-gray-800 font-medium tracking-widest mb-2">
                  Colors:
                </h3>
                <div className="flex gap-2 flex-wrap tracking-widest">
                  {product.colors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded-full border ${
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
                <h3 className="text-gray-800 font-medium mb-2 tracking-widest">
                  Sizes:
                </h3>
                <div className="flex gap-2 flex-wrap tracking-widest">
                  {product.sizes.map((size, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded-full border ${
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
            <p className="text-gray-700">{product.description}</p>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className={`w-full bg-black text-white py-3 rounded-lg hover:bg-black/80 transition tracking-widest ${
                isLoading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              {isLoading ? "Adding to Cart..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductPage;
