import { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore.jsx";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard.jsx";
import GoBackButton from "../components/GoBackButton";

const CategoryPage = () => {
  const { fetchProductsByCategory, products } = useProductStore();

  const { category } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchProductsByCategory(category);
      setIsLoading(false);
    };
    fetchData();
  }, [fetchProductsByCategory, category]);;

  console.log("products:", products);
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin "></div>
      </div>
    );
  return (
    <>
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0  flex items-center justify-center bg-white  z-40 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <span
          className="text-center text-xl  text-gray-900 tracking-widest"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </span>
      </motion.div>

      <div className="min-h-screen">
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 ">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {products?.length === 0 && (
              <h2 className="text-3xl font-semibold text-black text-center col-span-full">
                No products found
              </h2>
            )}
            {products?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
