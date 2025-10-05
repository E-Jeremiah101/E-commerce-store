import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";

const FeaturedProducts = ({ featuredProducts }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

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

  const handleAddToCart = (product) => {
    const { size, color } = selectedOptions[product._id] || {};

    if (product.sizes?.length > 0 && !size) {
      toast.error("Please select a size");
      return;
    }
    if (product.colors?.length > 0 && !color) {
      toast.error("Please select a color");
      return;
    }

    addToCart(product, size || null, color || null);
  };
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

  return (
    <div className="py-12 mt-8">
      <div className="container mx-auto px-4">
        <div className=" flex text-center align-middle text-3xl sm:text-6xl  font-bebas text-black mc-4 tracking-widest justify-center mb-5">
          <h2 className="rounded mb-1">Just For You</h2>
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
                const { size, color } = selectedOptions[product._id] || {};
                return (
                  <div
                    key={product._id}
                    className='w-1/2 sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2'
                  >
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl ">
                      <div className="overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-43 sm:h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg h-13  mb-2 text-black tracking-widest">
                          {product.name}
                        </h3>
                        <p className="text-black font-medium mb-4 tracking-widest">
                          ₦{" "}
                          {product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
                        </p>

                        {/* Size Selector */}
                        {product.sizes?.length > 0 && (
                          <div className="mb-2">
                            <label className="text-sm text-gray-900 mr-2 tracking-widest"></label>
                            <select
                              value={size}
                              onChange={(e) =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [product._id]: {
                                    ...prev[product._id],
                                    size: e.target.value,
                                  },
                                }))
                              }
                              className="bg-gray-700 text-white px-2 py-1 rounded text-sm tracking-widest"
                            >
                              {product.sizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Color Selector */}
                        {product.colors?.length > 0 && (
                          <div className="mb-2">
                            <label className="text-sm text-gray-800 mr-2 tracking-widest"></label>
                            <select
                              value={color}
                              onChange={(e) =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [product._id]: {
                                    ...prev[product._id],
                                    color: e.target.value,
                                  },
                                }))
                              }
                              className="bg-gray-700 text-white text-sm px-2 py-1 rounded tracking-widest"
                            >
                              {product.colors.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded transition-colors duration-300 items-center justify-center "
                        >
                
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
              isStartDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-black/60"
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
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
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;
