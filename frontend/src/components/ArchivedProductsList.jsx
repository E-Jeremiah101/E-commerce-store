import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Star,
  X,
  AlertTriangle,
  Archive,
  Loader,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore.js";
import { formatPrice } from "../utils/currency.js";
import { useStoreSettings } from "./StoreSettingsContext.jsx";
import toast from "react-hot-toast";
import axios from "../lib/axios.js";

const ArchivedProductsList = () => {
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  const { settings } = useStoreSettings();

  // Fetch archived products
  const fetchArchivedProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/products/archived");
      setArchivedProducts(response.data.products || []);
    } catch (error) {
      console.error("Error fetching archived products:", error);
      toast.error("Failed to load archived products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedProducts();
  }, []);

  // Pagination logic
  const totalProducts = archivedProducts?.length || 0;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const displayedProducts = archivedProducts?.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const handlePageClick = (pageNum) => setCurrentPage(pageNum);

  // Open delete confirmation for permanent deletion
  const openDeleteConfirm = (productId, productName) => {
    const product = archivedProducts.find((p) => p._id === productId);
    if (!product) return;

    setProductToDelete({
      id: productId,
      name: productName,
      variantsCount: product.variants?.length || 0,
      stock: product.countInStock,
      isFeatured: product.isFeatured,
      category: product.category,
      imagesCount: product.images?.length || 0,
    });
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  // Permanently delete product
  const handlePermanentDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await axios.delete(`/products/${productToDelete.id}/permanent`);

      // Update local state
      setArchivedProducts((prev) =>
        prev.filter((product) => product._id !== productToDelete.id)
      );

      toast.success("Product permanently deleted");
      closeDeleteModal();

      // Reset pagination if needed
      if (displayedProducts.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      setDeleteError(
        error.response?.data?.message || "Failed to delete product"
      );
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Restore product
  const handleRestore = async (productId) => {
    setRestoring(true);
    setRestoringId(productId);

    try {
      await axios.patch(`/products/${productId}/restore`);

      // Update local state
      setArchivedProducts((prev) =>
        prev.filter((product) => product._id !== productId)
      );

      toast.success("Product restored successfully");

      // Reset pagination if needed
      if (displayedProducts.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore product");
      console.error("Restore error:", error);
    } finally {
      setRestoring(false);
      setRestoringId(null);
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
          Loading archived products...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Archived Products
              </h1>
              <p className="text-gray-600 mt-2">
                Products that have been archived and can be restored or
                permanently deleted.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                {totalProducts} archived products
              </span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {archivedProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Archived Products
            </h3>
            <p className="text-gray-600 mb-6">
              When you archive products, they will appear here for safekeeping.
            </p>
            <a
              href="/admin/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Active Products
            </a>
          </div>
        ) : (
          <>
            {/* Products Table */}
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Archived At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                              src={product.images?.[0]}
                              alt={product.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">
                                    <Star className="h-3 w-3" />
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatPrice(product.price, settings?.currency)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {product.countInStock} units
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.variants?.length > 0 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {product.variants.length} variants
                            </span>
                          ) : (
                            "No variants"
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.archivedAt
                            ? new Date(product.archivedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "N/A"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(product._id)}
                              disabled={
                                restoring && restoringId === product._id
                              }
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              title="Restore product"
                            >
                              {restoring && restoringId === product._id ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              Restore
                            </button>
                            <button
                              onClick={() =>
                                openDeleteConfirm(product._id, product.name)
                              }
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                              title="Permanently delete"
                            >
                              <Trash className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(startIndex + productsPerPage, totalProducts)}
                      </span>{" "}
                      of <span className="font-medium">{totalProducts}</span>{" "}
                      products
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="flex items-center space-x-1">
                        {[...Array(totalPages).keys()].map((num) => {
                          const page = num + 1;
                          // Show limited pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageClick(page)}
                                className={`px-3 py-1 text-sm rounded ${
                                  currentPage === page
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                          // Show ellipsis
                          if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-1">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Information Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    About Archived Products
                  </h4>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>
                      • Archived products are hidden from customers but kept in
                      the database
                    </li>
                    <li>
                      • You can restore products at any time to make them active
                      again
                    </li>
                    <li>
                      • Permanently deleting removes products from the database
                      completely
                    </li>
                    <li>
                      • Featured status is preserved when restoring products
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Permanent Delete Confirmation Modal */}
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
                      Permanent Delete
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
                    Are you sure you want to{" "}
                    <span className="font-bold text-red-600">
                      permanently delete
                    </span>{" "}
                    <span className="font-bold text-gray-900">
                      "{productToDelete.name}"
                    </span>
                    ?
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      This will delete:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Product information and all variants</li>
                      <li>
                        • {productToDelete.imagesCount} product image(s) from
                        storage
                      </li>
                      <li>• All associated data from the database</li>
                      {productToDelete.isFeatured && (
                        <li className="text-yellow-600 font-medium">
                          ⚠️ This product is featured and will be removed from
                          featured products
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-red-700 text-sm">
                        <span className="font-bold">Warning:</span> This action
                        cannot be undone. The product will be permanently
                        removed and cannot be recovered.
                      </p>
                    </div>
                  </div>

                  {/* Error message */}
                  {deleteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
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
                    onClick={handlePermanentDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {deleting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Permanently Delete"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ArchivedProductsList;
