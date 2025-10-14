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

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ✅ Adjust items per page based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setItemsPerPage(8); // md and above
      } else {
        setItemsPerPage(10); // mobile
      }
    };

    handleResize(); // Run on load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Fetch category products
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchProductsByCategory(category);
      setCurrentPage(1); // Reset to first page when category changes
      setIsLoading(false);
    };
    fetchData();
  }, [fetchProductsByCategory, category]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  // ✅ Pagination logic
  const totalProducts = products?.length || 0;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProducts = products?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  return (
    <>
      {/* Header */}
      <motion.div
        className="sm:mx-auto sm:w-full sm:max-w-md fixed top-0 left-0 right-0 flex items-center justify-center bg-white z-40 py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-4 text-black">
          <GoBackButton />
        </div>
        <span className="text-center text-xl text-gray-900 tracking-widest">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </span>
      </motion.div>

      {/* Products Grid */}
      <div className="min-h-screen">
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 smd:grid-cols-4 smd:bg-yellow-500
           md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {displayedProducts?.length === 0 && (
              <h2 className="text-3xl font-semibold text-black text-center col-span-full">
                No products found
              </h2>
            )}
            {displayedProducts?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>

          {/* ✅ Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-10">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-800 text-white rounded disabled:opacity-40"
              >
                Prev
              </button>

              {[...Array(totalPages).keys()].map((num) => {
                const page = num + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? "bg-yellow-700 text-white"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-800 text-white rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
