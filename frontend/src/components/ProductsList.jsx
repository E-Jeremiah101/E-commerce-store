import { motion } from "framer-motion";
import { Trash, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore.jsx";
import { useState } from "react";
import toast from "react-hot-toast";

const ProductsList = () => {
  const {
    deleteProduct,
    toggleFeaturedProduct,
    products,
    reduceStock,
    updateVariantInventory,
    fetchVariantStock,
    fetchProductById,
  } = useProductStore();
  const {loading} = useProductStore()

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [reduceQuantity, setReduceQuantity] = useState(1);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const productsPerPage = 15;
   

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

  const handleReduceStockClick = (product) => {
    if (product.variants?.length > 0) {
      // Show variant selection modal for products with variants
      setSelectedProduct(product);
      setSelectedVariant("");
      setReduceQuantity(1);
      setShowVariantModal(true);
    } else {
      // For products without variants, reduce stock directly
      reduceStockDirectly(product._id);
    }
  };

  const reduceStockDirectly = async (
    productId,
    variantId = null,
    quantity = 1
  ) => {
    try {
      if (variantId) {
        // Reduce specific variant stock
        await updateVariantInventory(productId, variantId, -quantity);
        toast.success(`Reduced ${quantity} from variant stock!`);
      } else {
        // Reduce main product stock
        await reduceStock(productId, quantity);
        toast.success(`Reduced ${quantity} from main product stock!`);
      }
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const handleVariantReduce = async () => {
    if (!selectedProduct) return;

    if (selectedVariant) {
      // Reduce specific variant
      await reduceStockDirectly(
        selectedProduct._id,
        selectedVariant,
        reduceQuantity
      );
    } else {
      // Reduce main product stock (no variant selected)
      await reduceStockDirectly(selectedProduct._id, null, reduceQuantity);
    }

    setShowVariantModal(false);
    setSelectedProduct(null);
    setSelectedVariant("");
    setReduceQuantity(1);
  };

  const getVariantName = (variant) => {
    const size = variant.size ? `Size: ${variant.size}` : "";
    const color = variant.color ? `Color: ${variant.color}` : "";
    return [size, color].filter(Boolean).join(" | ");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );

  return (
    <>
      <motion.div
        className="bg-gray-800 shadow-lg rounded-lg flex flex-col justify-center max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Table */}
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Sizes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Colors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                In-Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Variants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Featured
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {displayedProducts?.map((product) => (
              <tr
                key={product._id}
                className="hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={product.images?.[0]}
                      alt={product.name}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ₦
                  {product.price.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                  })}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {product.sizes?.join(", ") || "N/A"}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {product.colors?.join(", ") || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <span>{product.countInStock}</span>
                    <button
                      onClick={() => handleReduceStockClick(product)}
                      disabled={product.countInStock === 0}
                      className={`px-2 py-1 rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-50`}
                    >
                      Reduce Stock
                    </button>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {product.variants?.length > 0 ? (
                    <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                      {product.variants.length} variants
                    </span>
                  ) : (
                    "No variants"
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {product.category}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleFeaturedProduct(product._id)}
                    className={`p-1 rounded-full ${
                      product.isFeatured
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-gray-600 text-gray-300"
                    } hover:bg-yellow-500 transition-colors duration-200`}
                  >
                    <Star className="h-5 w-5" />
                  </button>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => deleteProduct(product._id)}
                    className="text-red-400 hover:text-red-300"
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

      {/* Variant Selection Modal */}
      {showVariantModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Reduce Stock - {selectedProduct.name}
            </h3>

            {/* Quantity Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity to Reduce
              </label>
              <input
                type="number"
                min="1"
                value={reduceQuantity}
                onChange={(e) =>
                  setReduceQuantity(parseInt(e.target.value) || 1)
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Variant Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Variant (Optional)
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">Main Product Stock</option>
                {selectedProduct.variants?.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {getVariantName(variant)} (Stock: {variant.countInStock})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowVariantModal(false)}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleVariantReduce}
                disabled={reduceQuantity < 1}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50"
              >
                Reduce Stock
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ProductsList;
