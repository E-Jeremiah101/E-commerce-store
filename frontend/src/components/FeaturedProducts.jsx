import React, { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

const FeaturedProducts = ({ featuredProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Track selected options for each product
  const [selectedOptions, setSelectedOptions] = useState({});

  const { addToCart } = useCartStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1020) setItemsPerPage(2);
      else if (window.innerWidth < 1280) setItemsPerPage(3);
      else setItemsPerPage(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
  };

  const isStartDisabled = currentIndex === 0;
  const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

  // Handle dropdown changes
  const handleOptionChange = (productId, type, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type]: value,
      },
    }));
  };

  return (
    <div className="py-12 mt-17">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-4xl sm:text-6xl font-bold font-bebas text-gray-900 mc-4 tracking-widest ">
          FEATURED PRODUCTS
        </h2>
        <div className="flex justify-center mb-10 mt-5">
          <div className="border w-60"></div>
        </div>
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / itemsPerPage)
                }%)`,
              }}
            >
              {featuredProducts?.map((product) => {
                const selectedSize = selectedOptions[product._id]?.size || "";
                const selectedColor = selectedOptions[product._id]?.color || "";

                return (
                  <div
                    key={product._id}
                    className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2"
                  >
                    <div className="bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-2 border-gray-200/30">
                      <div className="overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2 text-white">
                          {product.name}
                        </h3>

                        {/* Size Dropdown */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="mb-2">
                            <label className="text-sm text-black mr-2">
                              Size:
                            </label>
                            <select
                              value={selectedSize}
                              onChange={(e) =>
                                handleOptionChange(
                                  product._id,
                                  "size",
                                  e.target.value
                                )
                              }
                              className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600"
                            >
                              <option value="">Select Size</option>
                              {product.sizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Color Dropdown */}
                        {product.colors && product.colors.length > 0 && (
                          <div className="mb-2">
                            <label className="text-sm text-black mr-2">
                              Color:
                            </label>
                            <select
                              value={selectedColor}
                              onChange={(e) =>
                                handleOptionChange(
                                  product._id,
                                  "color",
                                  e.target.value
                                )
                              }
                              className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600"
                            >
                              <option value="">Select Color</option>
                              {product.colors.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <p className="text-emerald-300 font-medium mb-4">
                          ₦{" "}
                          {product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
                        </p>

                        <button
                          onClick={() =>
                            addToCart({
                              ...product,
                              selectedSize,
                              selectedColor,
                            })
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded transition-colors duration-300 flex items-center justify-center"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Add to cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              isStartDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            disabled={isEndDisabled}
            className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              isEndDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
