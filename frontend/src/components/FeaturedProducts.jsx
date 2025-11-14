import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

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

 
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(2);
      else if (window.innerWidth > 840) setItemsPerPage(3);
      
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
    <div className="py-19 mt-5">
      <div className="container mx-auto px-1">
        <div className=" flex text-center align-middle text-xl font-bebas text-black mc-4 tracking-wider justify-center mb-2">
          <span>
            Just For You
          </span>
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
                    className="w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-1"
                  >
                    <div className=" backdrop-blur-sm  overflow-hidden h-full transition-all duration-300 hover:shadow-xl ">
                      <Link to={`/product/${product._id}`}>
                        <div className="overflow-hidden">
                          <img
                            src={product.images?.[0]}
                            alt={product.name}
                            className="w-full h-43 sm:h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                          />
                        </div>
                        <div className="px-2 text-sm truncate w-45">
                          <h3 className="  text-gray-900 tracking-wider mb-1 ">
                            {product.name}
                          </h3>
                        </div>
                        <div className="flex justify-between w-full text-gray-900 px-2">
                          <div className="text-sm lg:text-md text-gray-900">
                            ₦{" "}
                            {product.price.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                            })}
                          </div>
                          <div>
                            <ShoppingCart size={20} />
                          </div>
                        </div>
                      </Link>
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
