import { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore.js";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard.jsx";
import GoBackButton from "../components/GoBackButton";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "../components/StoreSettingsContext.jsx";

const CategoryPage = () => {
  const { fetchProductsByCategory, products } = useProductStore();
  const { category } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Adjust items per page based on screen size
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

  //  Fetch category products
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchProductsByCategory(category);
      setCurrentPage(1); // Reset to first page when category changes
      setIsLoading(false);
    };
    fetchData();
  }, [fetchProductsByCategory, category]);

  useEffect(() => {
    console.log("Category:", category);
    console.log("Products:", products);
  }, [products, category]);

  const { settings } = useStoreSettings();

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  //  Pagination logic
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
             className="fixed top-0 left-0 right-0 z-40 bg-white backdrop-blur-md"
             style={{ borderBottom: "none", boxShadow: "none" }}
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, ease: "easeOut" }}
           >
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex items-center justify-between h-16 sm:h-20">
                 {/* Back Button - Left aligned */}
                 <div className="flex items-center">
                   <motion.div
                     whileHover={{ x: -2 }}
                     whileTap={{ scale: 0.95 }}
                     className="p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
                   >
                     <GoBackButton />
                   </motion.div>
                 </div>
     
                 {/* Page Title - Centered with subtle styling */}
                 <div className="absolute left-1/2 transform -translate-x-1/2">
                   <div className="flex flex-col items-center">
                     <h2 className="text-[1.1rem] md:text-xl  font-semibold text-gray-900 tracking-tight">
                      {category.charAt(0).toUpperCase() +
            category
              .slice(1)
              .toUpperCase()
              .replace(/\s+/g, "-")
              .replace(/&/g, " & ")}
                     </h2>
                   </div>
                 </div>
               </div>
             </div>
           </motion.div>

      {/* Products Grid */}
      <div className="min-h-screen mt-3">
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 smd:grid-cols-4 smd:bg-yellow-500
           md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {displayedProducts?.length === 0 && (
              <h2 className="text-2xl font-semibold text-black text-center col-span-full">
                No products found
              </h2>
            )}
            {displayedProducts?.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>

          {/*  Pagination Controls */}
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










