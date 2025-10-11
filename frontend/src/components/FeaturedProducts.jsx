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
          <h2
            className="rounded mb-1 text-2xl"
            style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.4)" }}
          >
            Just For You
          </h2>
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
                    className="w-1/2 sm:w-1/2 md:w-1/3 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2"
                  >
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl ">
                      <div className="overflow-hidden">
                        <img
                          src={product.images?.[0]}
                          alt={product.name}
                          className="w-full h-43 sm:h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm h-13  mb-2 text-black tracking-widest">
                          {product.name}
                        </h3>
                        <p className="text-black font-medium mb-4 text-lg tracking-widest">
                          ₦{" "}
                          {product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                          })}
                        </p>
{/* 
                        <Link to={`/product/${product._id}`}>
                          <button className="w-full  flex items-center justify-center rounded-lg bg-black px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900 tracking-widest">
                            {/* <ShoppingCart size={22} className="mr-2" /> */}
                            {/* View Product
                          </button>
                        </Link> */} 
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
