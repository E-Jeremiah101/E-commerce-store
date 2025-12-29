// import { useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Trash,
//   Star,
//   X,
//   AlertTriangle,
//   Archive,
//   Loader,
//   AlertCircle,
// } from "lucide-react";
// import { useProductStore } from "../stores/useProductStore.js";
// import { Link } from "react-router-dom";
// import { useState } from "react";
// import { formatPrice } from "../utils/currency.js";
// import { useStoreSettings } from "./StoreSettingsContext.jsx";

// const ProductsList = () => {
//   const { fetchAllProducts, loading } = useProductStore();
//   const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();

//   useEffect(() => {
//     fetchAllProducts();
//   }, []);

//   const [currentPage, setCurrentPage] = useState(1);
//   const productsPerPage = 15;

//   // Delete confirmation state
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [productToDelete, setProductToDelete] = useState(null);
//   const [deleteType, setDeleteType] = useState("archive"); // "archive" or "permanent"
//   const [deleting, setDeleting] = useState(false);
//   const [deleteError, setDeleteError] = useState(null);

//   const { settings } = useStoreSettings();

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

//   // Open delete confirmation
//   const openDeleteConfirm = (productId, productName) => {
//     const product = products.find((p) => p._id === productId);
//     if (!product) return;

//     setProductToDelete({
//       id: productId,
//       name: productName,
//       variantsCount: product.variants?.length || 0,
//       stock: product.countInStock,
//       isFeatured: product.isFeatured,
//       category: product.category,
//     });
//     setDeleteType("archive"); // Reset to default
//     setDeleteError(null);
//     setShowDeleteConfirm(true);
//   };

//   // Handle product deletion
//   const handleDelete = async () => {
//     if (!productToDelete) return;

//     setDeleting(true);
//     setDeleteError(null);

//     try {
//       // First, update the deleteProduct function in your store to accept deleteType
//       const success = await deleteProduct(productToDelete.id, deleteType);

//       if (success) {
//         setShowDeleteConfirm(false);
//         setProductToDelete(null);
//         // Refresh the products list
//         fetchAllProducts();
//       } else {
//         setDeleteError("Failed to delete product. Please try again.");
//       }
//     } catch (error) {
//       setDeleteError(error.message || "An error occurred during deletion.");
//       console.error("Delete error:", error);
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // Close delete modal
//   const closeDeleteModal = () => {
//     if (!deleting) {
//       setShowDeleteConfirm(false);
//       setProductToDelete(null);
//       setDeleteError(null);
//     }
//   };

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
//         <Link
//           to="/admin/products/archived-product"
//           className="inline-block px-4 py-3  "
//         >
//           <button className=" flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors gap-2 cursor-pointer">
//           <Archive size={15} />  <span>Archived Products</span>
//           </button>
          
//         </Link>
//         <div className="py-5"></div>
//         <motion.div
//           className="shadow-lg rounded-lg flex flex-col justify-center max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           {/* Table */}
//           <table className="min-w-full divide-y divide-gray-700">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                   Product
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
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

//             <tbody className="bg-white divide-y divide-gray-200">
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
//                         <div className="text-sm font-medium text-gray-800">
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
//                       onClick={() =>
//                         openDeleteConfirm(product._id, product.name)
//                       }
//                       className="text-red-600 hover:text-red-800 transition-colors"
//                       title="Delete product"
//                     >
//                       <Trash className="h-5 w-5" />
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

//       {/* Delete Confirmation Modal */}
//       <AnimatePresence>
//         {showDeleteConfirm && productToDelete && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.9 }}
//               className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-3">
//                   <AlertTriangle className="h-6 w-6 text-red-500" />
//                   <h3 className="text-lg font-bold text-gray-900">
//                     Delete Product
//                   </h3>
//                 </div>
//                 <button
//                   onClick={closeDeleteModal}
//                   disabled={deleting}
//                   className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="mb-6">
//                 <p className="text-gray-700 mb-4">
//                   Are you sure you want to delete{" "}
//                   <span className="font-bold text-gray-900">
//                     "{productToDelete.name}"
//                   </span>
//                   ?
//                 </p>

//                 <div className="bg-gray-50 p-4 rounded-lg mb-4">
//                   <p className="text-sm text-gray-600 mb-2">Product Details:</p>
//                   <ul className="text-sm text-gray-700 space-y-1">
//                     <li>• Category: {productToDelete.category}</li>
//                     <li>• Stock: {productToDelete.stock} units</li>
//                     <li>• Variants: {productToDelete.variantsCount}</li>
//                     {productToDelete.isFeatured && (
//                       <li className="text-yellow-600 font-medium">
//                         ⚠️ This product is currently featured
//                       </li>
//                     )}
//                   </ul>
//                 </div>

//                 {/* Delete Type Selection */}
//                 <div className="mb-4">
//                   <p className="text-sm font-medium text-gray-700 mb-2">
//                     Choose deletion type:
//                   </p>
//                   <div className="flex gap-3">
//                     <button
//                       type="button"
//                       onClick={() => setDeleteType("archive")}
//                       className={`flex-1 p-3 rounded-lg border transition-all ${
//                         deleteType === "archive"
//                           ? "bg-blue-50 border-blue-300 text-blue-700"
//                           : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
//                       }`}
//                     >
//                       <div className="flex items-center gap-2">
//                         <Archive className="h-4 w-4" />
//                         <div className="text-left">
//                           <p className="font-medium">Archive</p>
//                           <p className="text-xs">Can be restored later</p>
//                         </div>
//                       </div>
//                     </button>

//                     <button
//                       type="button"
//                       onClick={() => setDeleteType("permanent")}
//                       className={`flex-1 p-3 rounded-lg border transition-all ${
//                         deleteType === "permanent"
//                           ? "bg-red-50 border-red-300 text-red-700"
//                           : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
//                       }`}
//                     >
//                       <div className="flex items-center gap-2">
//                         <Trash className="h-4 w-4" />
//                         <div className="text-left">
//                           <p className="font-medium">Permanent</p>
//                           <p className="text-xs">Cannot be undone</p>
//                         </div>
//                       </div>
//                     </button>
//                   </div>
//                 </div>

//                 {/* Warning for permanent delete */}
//                 {deleteType === "permanent" && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                     <div className="flex items-start gap-2">
//                       <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
//                       <p className="text-red-700 text-sm">
//                         This will permanently delete the product and all its
//                         images from the database. This action cannot be undone.
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Error message */}
//                 {deleteError && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
//                     <p className="text-red-700 text-sm">{deleteError}</p>
//                   </div>
//                 )}
//               </div>

//               <div className="flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={closeDeleteModal}
//                   disabled={deleting}
//                   className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleDelete}
//                   disabled={deleting}
//                   className={`px-4 py-2 text-white rounded-lg transition-colors ${
//                     deleteType === "permanent"
//                       ? "bg-red-600 hover:bg-red-700"
//                       : "bg-blue-600 hover:bg-blue-700"
//                   } disabled:opacity-50 flex items-center gap-2`}
//                 >
//                   {deleting ? (
//                     <>
//                       <Loader className="h-4 w-4 animate-spin" />
//                       Deleting...
//                     </>
//                   ) : deleteType === "permanent" ? (
//                     "Delete Permanently"
//                   ) : (
//                     "Archive Product"
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
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
  Eye,
  Edit,
  Package,
  Search,
  Filter,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Tag,
  DollarSign,
  Layers,
  Palette,
  Grid,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore.js";
import { Link } from "react-router-dom";
import { useState } from "react";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";

const ProductsList = () => {
  const { fetchAllProducts, loading } = useProductStore();
  const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("archive");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const { settings } = useStoreSettings();

  // Get unique categories for filter
  const categories = [
    ...new Set(products?.map((p) => p.category).filter(Boolean)),
  ];

  // Filter and sort products
  const filteredProducts =
    products?.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "all" || product.category === filterCategory;

      const matchesStock =
        filterStock === "all" ||
        (filterStock === "in-stock" && product.countInStock > 0) ||
        (filterStock === "out-of-stock" && product.countInStock === 0) ||
        (filterStock === "low-stock" &&
          product.countInStock > 0 &&
          product.countInStock <= 10);

      return matchesSearch && matchesCategory && matchesStock;
    }) || [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "stock-low":
        return a.countInStock - b.countInStock;
      case "stock-high":
        return b.countInStock - a.countInStock;
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalProducts = sortedProducts.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const displayedProducts = sortedProducts.slice(
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
      image: product.images?.[0],
    });
    setDeleteType("archive");
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  // Handle product deletion
  const handleDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const success = await deleteProduct(productToDelete.id, deleteType);

      if (success) {
        setShowDeleteConfirm(false);
        setProductToDelete(null);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-10 w-10 text-gray-400 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-600">
            Loading your products...
          </p>
          <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Product Inventory
            </h1>
            <p className="text-gray-500 mt-1">
              Manage all your products in one place
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/admin/products/archived-product">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow">
                <Archive size={16} />
                <span>Archived Products</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products?.length || 0}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Featured</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products?.filter((p) => p.isFeatured).length || 0}
                </p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products?.filter(
                    (p) => p.countInStock > 0 && p.countInStock <= 10
                  ).length || 0}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {categories.length}
                </p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <Grid className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border  rounded-lg focus:ring-1  focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 border rounded-lg focus:ring-1 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filterStock}
                onChange={(e) => {
                  setFilterStock(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 border rounded-lg focus:ring-1 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (≤10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border rounded-lg focus:ring-1 focus:border-transparent outline-none bg-white"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock-low">Stock: Low to High</option>
                <option value="stock-high">Stock: High to Low</option>
              </select>

              <button className="px-4 py-2.5 border  rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Inventory
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {displayedProducts.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        <img
                          className="h-full w-full object-cover"
                          src={
                            product.images?.[0] ||
                            "https://via.placeholder.com/48"
                          }
                          alt={product.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/48";
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-[0.70rem] font-semibold text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(product.price, settings?.currency)}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      
                      <span
                        className={`ml-3 text-sm font-medium ${
                          product.countInStock === 0
                            ? "text-red-600"
                            : product.countInStock <= 10
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.countInStock}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex  flex-wrap gap-2">
                      {product.sizes?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          <Layers size={10} />
                          {product.sizes.length} sizes
                        </div>
                      )}
                      {product.colors?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded">
                          <Palette size={10} />
                          {product.colors.length} colors
                        </div>
                      )}
                      {product.variants?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                          <Tag size={10} />
                          {product.variants.length} variants
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category || "Uncategorized"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFeaturedProduct(product._id)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none ${
                          product.isFeatured ? "bg-yellow-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                            product.isFeatured
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">
                        {product.isFeatured ? "Featured" : "Standard"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* <Link to={`/admin/products/edit/${product._id}`}>
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                      </Link> */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            openDeleteConfirm(product._id, product.name)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displayedProducts.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No products found
            </h3>
            <p className="mt-1 text-gray-500 max-w-md mx-auto">
              {searchTerm || filterCategory !== "all" || filterStock !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "Get started by adding your first product to the inventory."}
            </p>
            <div className="mt-6">
              <Link to="/admin/products/add">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200">
                  <Plus size={16} />
                  Add New Product
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + productsPerPage, totalProducts)}
                </span>{" "}
                of <span className="font-medium">{totalProducts}</span> results
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages)).keys()].map((num) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = num + 1;
                    } else if (currentPage <= 3) {
                      pageNum = num + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + num;
                    } else {
                      pageNum = currentPage - 2 + num;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageClick(pageNum)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => handlePageClick(totalPages)}
                        className="w-10 h-10 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && productToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {deleteType === "archive"
                          ? "Archive Product"
                          : "Delete Product"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        This action will affect your inventory
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={
                        productToDelete.image ||
                        "https://via.placeholder.com/64"
                      }
                      alt={productToDelete.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {productToDelete.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {productToDelete.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Stock: {productToDelete.stock}
                      </span>
                      {productToDelete.isFeatured && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      {deleteType === "archive"
                        ? "Archiving will move this product to the archive where it can be restored later. The product will no longer be visible to customers."
                        : "Permanently deleting will remove this product and all its data from the system. This action cannot be undone."}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteType("archive")}
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          deleteType === "archive"
                            ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded ${
                              deleteType === "archive"
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Archive
                              className={`h-4 w-4 ${
                                deleteType === "archive"
                                  ? "text-blue-600"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">Archive</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Can be restored
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteType("permanent")}
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          deleteType === "permanent"
                            ? "bg-red-50 border-red-200 ring-2 ring-red-100"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded ${
                              deleteType === "permanent"
                                ? "bg-red-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Trash
                              className={`h-4 w-4 ${
                                deleteType === "permanent"
                                  ? "text-red-600"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">Delete</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Permanent
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {deleteType === "permanent" && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <div className="flex gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">
                          Warning: This will permanently delete the product and
                          all associated data including images, variants, and
                          inventory records. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  )}

                  {deleteError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-sm text-red-700">{deleteError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                      deleteType === "permanent"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {deleting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : deleteType === "permanent" ? (
                      "Delete Permanently"
                    ) : (
                      "Archive Product"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsList;
