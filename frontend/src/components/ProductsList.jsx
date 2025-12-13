import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore.js";
import { useState } from "react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore.js";

const ProductsList = () => {
  const { fetchAllProducts, loading } = useProductStore();
  const {
    deleteProduct,
    toggleFeaturedProduct,
    products,
  } = useProductStore();
 useEffect(() => {
   fetchAllProducts(); 
 }, []);

  const [currentPage, setCurrentPage] = useState(1);;
  const productsPerPage = 15;
  // const [isloading,  setIsLoading] = useState(false)
   

  // Pagination logic
  const totalProducts = products?.length || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const displayedProducts = products?.slice(
    startIndex,
    startIndex + productsPerPage
  );

  // useEffect(() => {
  //   setIsLoading(true);

  //   // simulate a delay (optional)
  //   setTimeout(() => {
  //     setIsLoading(false);
  //   }, 1000);
  // }, []);

  const {user} = useUserStore();
  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="flex space-x-2 mb-6">
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
        <p className="text-gray-600 font-medium animate-pulse">
          Please wait, Loading data...
        </p>
      </div>
    );

  return (
    <>
      <div className="bg-white">

<div className="py-5"></div>
        <motion.div
          className=" shadow-lg rounded-lg flex flex-col justify-center max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Table */}
          <table className="min-w-full divide-y divide-gray-700 ">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-widerr">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Sizes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Colors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  In-Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className=" bg-white divide-y divide-gray-200">
              {displayedProducts?.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={product.images?.[0]}
                        alt={product.name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-800 ">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    ₦
                    {product.price.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                    })}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {product.sizes?.join(", ") || "N/A"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {product.colors?.join(", ") || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 px-2 rounded">
                        {product.countInStock}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {product.variants?.length > 0 ? (
                      <span className="bg-green-800 px-2 py-1 rounded text-xs">
                        {product.variants.length} variants
                      </span>
                    ) : (
                      "No variants"
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {product.category}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleFeaturedProduct(product._id)}
                      className={`p-1 rounded-full ${
                        product.isFeatured
                          ? "bg-yellow-500 text-black font-bold"
                          : "bg-yellow-100 text-yellow-500"
                      } hover:bg-yellow-500 hover:text-black transition-colors duration-200`}
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    <button
                      onClick={() => deleteProduct(product._id)}
                      className=" text-red-600  hover:text-red-300"
                    >
                      <Trash className="h-5 w-5 " />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3 py-8">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
              >
                Prev
              </button>

              {[...Array(totalPages).keys()].map((num) => {
                const page = num + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-4 py-2 text-sm rounded ${
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
                className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default ProductsList;
