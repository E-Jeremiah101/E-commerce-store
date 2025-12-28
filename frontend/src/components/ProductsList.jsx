// import { useEffect } from "react";
// import { motion } from "framer-motion";
// import { Trash, Star } from "lucide-react";
// import { useProductStore } from "../stores/useProductStore.js";
// import { useState } from "react";
// import { formatPrice } from "../utils/currency.js";
// import { useStoreSettings } from "./StoreSettingsContext.jsx";

// const ProductsList = () => {
//   const { fetchAllProducts, loading } = useProductStore();
//   const {
//     deleteProduct,
//     toggleFeaturedProduct,
//     products,
//   } = useProductStore();
//  useEffect(() => {
//    fetchAllProducts(); 
//  }, []);

//   const [currentPage, setCurrentPage] = useState(1);;
//   const productsPerPage = 15;
   

//   // Pagination logic
//   const totalProducts = products?.length || 0;
//   const totalPages = Math.ceil(totalProducts / productsPerPage);
//   const startIndex = (currentPage - 1) * productsPerPage;
//   const displayedProducts = products?.slice(
//     startIndex,
//     startIndex + productsPerPage
//   );


//   const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
//   const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
//   const handlePageClick = (pageNum) => setCurrentPage(pageNum);
// const { settings } = useStoreSettings();
//   if (loading)
//     return (
//       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-white">
//         <div className="flex space-x-2 mb-6">
//           <div
//             className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
//             style={{ animationDelay: "0ms" }}
//           ></div>
//           <div
//             className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
//             style={{ animationDelay: "150ms" }}
//           ></div>
//           <div
//             className="h-4 w-4 bg-gray-700 rounded-full animate-bounce"
//             style={{ animationDelay: "300ms" }}
//           ></div>
//         </div>
//         <p className="text-gray-600 font-medium animate-pulse">
//           Please wait, Loading data...
//         </p>
//       </div>
//     );

//   return (
//     <>
//       <div className="bg-white">

// <div className="py-5"></div>
//         <motion.div
//           className=" shadow-lg rounded-lg flex flex-col justify-center max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           {/* Table */}
//           <table className="min-w-full divide-y divide-gray-700 ">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Product
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-widerr">
//                   Price
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Sizes
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Colors
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   In-Stock
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Variants
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Category
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Featured
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Action
//                 </th>
//               </tr>
//             </thead>

//             <tbody className=" bg-white divide-y divide-gray-200">
//               {displayedProducts?.map((product) => (
//                 <tr
//                   key={product._id}
//                   className="hover:bg-gray-50 transition-colors"
//                 >
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <img
//                         className="h-10 w-10 rounded-full object-cover"
//                         src={product.images?.[0]}
//                         alt={product.name}
//                       />
//                       <div className="ml-4">
//                         <div className="text-sm font-medium text-gray-800 ">
//                           {product.name}
//                         </div>
//                       </div>
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
//                     {formatPrice(product.price, settings?.currency)}
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
//                     {product.sizes?.join(", ") || "N/A"}
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
//                     {product.colors?.join(", ") || "N/A"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
//                     <div className="flex items-center gap-2">
//                       <span className="bg-blue-600 px-2 rounded">
//                         {product.countInStock}
//                       </span>
//                     </div>
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
//                     {product.variants?.length > 0 ? (
//                       <span className="bg-green-800 px-2 py-1 rounded text-xs">
//                         {product.variants.length} variants
//                       </span>
//                     ) : (
//                       "No variants"
//                     )}
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
//                     {product.category}
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <button
//                       onClick={() => toggleFeaturedProduct(product._id)}
//                       className={`p-1 rounded-full ${
//                         product.isFeatured
//                           ? "bg-yellow-500 text-black font-bold"
//                           : "bg-yellow-100 text-yellow-500"
//                       } hover:bg-yellow-500 hover:text-black transition-colors duration-200`}
//                     >
//                       <Star className="h-5 w-5" />
//                     </button>
//                   </td>

//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
//                     <button
//                       onClick={() => deleteProduct(product._id)}
//                       className=" text-red-600  hover:text-red-300"
//                     >
//                       <Trash className="h-5 w-5 " />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* Pagination Controls */}
//           {totalPages > 1 && (
//             <div className="flex justify-center items-center space-x-3 py-8">
//               <button
//                 onClick={handlePrev}
//                 disabled={currentPage === 1}
//                 className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
//               >
//                 Prev
//               </button>

//               {[...Array(totalPages).keys()].map((num) => {
//                 const page = num + 1;
//                 return (
//                   <button
//                     key={page}
//                     onClick={() => handlePageClick(page)}
//                     className={`px-4 py-2 text-sm rounded ${
//                       currentPage === page
//                         ? "bg-yellow-700 text-white"
//                         : "bg-gray-700 text-white hover:bg-gray-600"
//                     }`}
//                   >
//                     {page}
//                   </button>
//                 );
//               })}

//               <button
//                 onClick={handleNext}
//                 disabled={currentPage === totalPages}
//                 className="px-4 py-2 text-sm bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600"
//               >
//                 Next
//               </button>
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </>
//   );
// };

// export default ProductsList;
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Star,
  X,
  AlertTriangle,
  Archive,
  Loader,
  AlertCircle,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore.js";
import { useState } from "react";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const ProductsList = () => {
  const { fetchAllProducts, loading } = useProductStore();
  const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("archive"); // "archive" or "permanent"
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const { settings } = useStoreSettings();

  // Pagination logic
  const totalProducts = products?.length || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const displayedProducts = products?.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // Open delete confirmation
  const openDeleteConfirm = (productId, productName) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;

    setProductToDelete({
      id: productId,
      name: productName,
      variantsCount: product.variants?.length || 0,
      stock: product.countInStock,
      isFeatured: product.isFeatured,
      category: product.category,
    });
    setDeleteType("archive"); // Reset to default
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  // Handle product deletion
  const handleDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      // First, update the deleteProduct function in your store to accept deleteType
      const success = await deleteProduct(productToDelete.id, deleteType);

      if (success) {
        setShowDeleteConfirm(false);
        setProductToDelete(null);
        // Refresh the products list
        fetchAllProducts();
      } else {
        setDeleteError("Failed to delete product. Please try again.");
      }
    } catch (error) {
      setDeleteError(error.message || "An error occurred during deletion.");
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!deleting) {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setDeleteError(null);
    }
  };

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
          className="shadow-lg rounded-lg flex flex-col justify-center max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Table */}
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
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

            <tbody className="bg-white divide-y divide-gray-200">
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
                        <div className="text-sm font-medium text-gray-800">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {formatPrice(product.price, settings?.currency)}
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
                      onClick={() =>
                        openDeleteConfirm(product._id, product.name)
                      }
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete product"
                    >
                      <Trash className="h-5 w-5" />
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && productToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete Product
                  </h3>
                </div>
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-gray-900">
                    "{productToDelete.name}"
                  </span>
                  ?
                </p>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">Product Details:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Category: {productToDelete.category}</li>
                    <li>• Stock: {productToDelete.stock} units</li>
                    <li>• Variants: {productToDelete.variantsCount}</li>
                    {productToDelete.isFeatured && (
                      <li className="text-yellow-600 font-medium">
                        ⚠️ This product is currently featured
                      </li>
                    )}
                  </ul>
                </div>

                {/* Delete Type Selection */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Choose deletion type:
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteType("archive")}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        deleteType === "archive"
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        <div className="text-left">
                          <p className="font-medium">Archive</p>
                          <p className="text-xs">Can be restored later</p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteType("permanent")}
                      className={`flex-1 p-3 rounded-lg border transition-all ${
                        deleteType === "permanent"
                          ? "bg-red-50 border-red-300 text-red-700"
                          : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Trash className="h-4 w-4" />
                        <div className="text-left">
                          <p className="font-medium">Permanent</p>
                          <p className="text-xs">Cannot be undone</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Warning for permanent delete */}
                {deleteType === "permanent" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-sm">
                        This will permanently delete the product and all its
                        images from the database. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {deleteError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">{deleteError}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    deleteType === "permanent"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } disabled:opacity-50 flex items-center gap-2`}
                >
                  {deleting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : deleteType === "permanent" ? (
                    "Delete Permanently"
                  ) : (
                    "Archive Product"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductsList;