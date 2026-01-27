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
  Package,
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Tag,
  Layers,
  Palette,
  Grid,
  ShoppingBasket,
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


  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState("archive");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const { settings } = useStoreSettings();


  const categories = [
    ...new Set(products?.map((p) => p.category).filter(Boolean)),
  ];


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

  const handleExport = async (type = "summary") => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const endpoint =
        type === "detailed"
          ? "/api/products/export/detailed-csv"
          : "/api/products/export/csv";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export products");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "detailed"
          ? "products_detailed_export.csv"
          : "products_export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export products. Please try again.");
    }
  };

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
               <ShoppingBasket className="h-10 w-10 text-gray-400 animate-pulse" />
             </div>
           </div>
           <p className="mt-6 text-lg font-medium text-gray-600">
             Loading Products...
           </p>
           <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
         </div>
       </div>
     );

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900t">
                Product Inventory
              </h1>
            </div>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Manage and organize all your products with detailed insights and
              powerful controls
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/admin/products/archived-product">
              <button className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] group">
                <Archive
                  size={18}
                  className="group-hover:rotate-12 transition-transform"
                />
                <span>Archived Products</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {products?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active in catalog</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm">
                <Package className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-yellow-50 p-5 rounded-2xl shadow-lg border border-yellow-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Featured</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {products?.filter((p) => p.isFeatured).length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Highlighted items</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl shadow-sm">
                <Star className="h-7 w-7 text-white" fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-red-50 p-5 rounded-2xl shadow-lg border border-red-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Low Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {products?.filter(
                    (p) => p.countInStock > 0 && p.countInStock <= 10
                  ).length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Need restocking</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-sm">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 p-5 rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {categories.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Unique segments</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-sm">
                <Grid className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gradient-to-r from-white to-indigo-50 rounded-2xl shadow-lg border border-indigo-100 p-5 mb-8">
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-400" />
                <input
                  type="text"
                  placeholder="Search products by name, category, or SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-indigo-100 rounded-xl focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:ring-opacity-50 outline-none transition-all placeholder:text-gray-400"
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
                className="px-4 py-3.5 bg-white border-2 border-purple-100 rounded-xl focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition-all appearance-none bg-gradient-to-r from-white to-purple-50 font-medium text-gray-700"
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
                className="px-4 py-3.5 bg-white border-2 border-blue-100 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-gradient-to-r from-white to-blue-50 font-medium text-gray-700"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (≤10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all appearance-none font-medium text-gray-700"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock-low">Stock: Low to High</option>
                <option value="stock-high">Stock: High to Low</option>
              </select>

              <button
                onClick={() => handleExport("summary")}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <Download size={18} />
                <span>Export CSV</span>
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
        className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-indigo-50">
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Inventory
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {displayedProducts.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-white shadow-sm">
                        <img
                          className="h-full w-full object-cover"
                          src={
                            product.images?.[0] ||
                            "https://via.placeholder.com/56"
                          }
                          alt={product.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/56";
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 truncate w-40 ">
                          {product.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="text-lg font-bold text-gray-700">
                      {formatPrice(product.price, settings?.currency)}
                    </div>
                    {product.discountedPrice && (
                      <div className="text-sm text-gray-400 line-through mt-1">
                        {formatPrice(
                          product.discountedPrice,
                          settings?.currency
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex items-center">
                      <div
                        className={`h-3 w-3 rounded-full mr-3 ${
                          product.countInStock === 0
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : product.countInStock <= 10
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-600"
                        }`}
                      ></div>
                      <span
                        className={`text-sm font-semibold ${
                          product.countInStock === 0
                            ? "text-red-600"
                            : product.countInStock <= 10
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {product.countInStock} units
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {product.sizes?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200">
                          <Layers size={12} />
                          {product.sizes.length} sizes
                        </div>
                      )}
                      {product.colors?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 rounded-lg font-medium border border-purple-200">
                          <Palette size={12} />
                          {product.colors.length} colors
                        </div>
                      )}
                      {product.variants?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-700 rounded-lg font-medium border border-green-200">
                          <Tag size={12} />
                          {product.variants.length} variants
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
                      {product.category || "Uncategorized"}
                    </span>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFeaturedProduct(product._id)}
                        className={`relative inline-flex items-center h-7 rounded-full w-14 transition-all duration-300 focus:outline-none ${
                          product.isFeatured
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-gray-300 to-gray-400"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                            product.isFeatured
                              ? "translate-x-8"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-sm font-medium px-3 py-1 rounded-lg ${
                          product.isFeatured
                            ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-200"
                            : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300"
                        }`}
                      >
                        {product.isFeatured ? "Featured" : "Standard"}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          openDeleteConfirm(product._id, product.name)
                        }
                        className="p-2.5 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-200 hover:shadow-md border border-red-200 hover:border-transparent"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {displayedProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="mx-auto w-28 h-28 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
              <Package className="h-14 w-14 text-indigo-400" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-800">
              No products found
            </h3>
            <p className="mt-3 text-gray-600 max-w-md mx-auto">
              {searchTerm || filterCategory !== "all" || filterStock !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for."
                : "Start building your inventory by adding your first product!"}
            </p>
            <div className="mt-8">
              <Link to="/admin/products/add">
                <button className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                  <Plus size={20} />
                  Add Your First Product
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="text-sm font-medium text-gray-700">
                Showing{" "}
                <span className="font-bold text-indigo-700">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-indigo-700">
                  {Math.min(startIndex + productsPerPage, totalProducts)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900">{totalProducts}</span>{" "}
                products
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700 bg-gradient-to-r from-white to-gray-100 border-2 border-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <div className="flex items-center gap-2">
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
                        className={`w-11 h-11 text-sm font-bold rounded-xl transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:shadow-sm border border-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-400">•••</span>
                      <button
                        onClick={() => handlePageClick(totalPages)}
                        className="w-11 h-11 text-sm font-bold text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all duration-200 border border-gray-300"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-700 bg-gradient-to-r from-white to-gray-100 border-2 border-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-sm"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-300"
            >
              {/* Modal Header */}
              <div className="p-7 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-sm">
                      <AlertTriangle className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {deleteType === "archive"
                          ? "Archive Product"
                          : "Delete Product"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Confirm your action below
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-7">
                <div className="flex items-start gap-5 mb-7">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-gray-300 shadow-sm">
                    <img
                      src={
                        productToDelete.image ||
                        "https://via.placeholder.com/80"
                      }
                      alt={productToDelete.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {productToDelete.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
                        {productToDelete.category}
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                        Stock: {productToDelete.stock}
                      </span>
                      {productToDelete.isFeatured && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border border-amber-300">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-300">
                    <p className="text-sm text-gray-700 mb-4 font-medium">
                      {deleteType === "archive"
                        ? "Archiving will move this product to the archive section where it can be restored later. The product will be hidden from customers but preserved in your system."
                        : "Permanently deleting will completely remove this product and all associated data including images, variants, and inventory records. This action cannot be undone."}
                    </p>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setDeleteType("archive")}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                          deleteType === "archive"
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 ring-2 ring-blue-100"
                            : "bg-white border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-lg ${
                              deleteType === "archive"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                : "bg-gradient-to-r from-gray-300 to-gray-400"
                            }`}
                          >
                            <Archive
                              className={`h-5 w-5 ${
                                deleteType === "archive"
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Archive</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Safe & reversible
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteType("permanent")}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                          deleteType === "permanent"
                            ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-300 ring-2 ring-red-100"
                            : "bg-white border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-lg ${
                              deleteType === "permanent"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-gray-300 to-gray-400"
                            }`}
                          >
                            <Trash
                              className={`h-5 w-5 ${
                                deleteType === "permanent"
                                  ? "text-white"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Delete</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Permanent & irreversible
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {deleteType === "permanent" && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl">
                      <div className="flex gap-3">
                        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-red-700">
                          ⚠️ Critical Warning: This action will permanently
                          delete the product, all variants, images, and
                          inventory data. This cannot be undone. Consider
                          archiving instead.
                        </p>
                      </div>
                    </div>
                  )}

                  {deleteError && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl">
                      <p className="text-sm font-medium text-red-700">
                        {deleteError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-7 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="px-6 py-3.5 text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 disabled:opacity-50 border-2 border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-7 py-3.5 text-sm font-bold text-white rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-3 shadow-lg hover:shadow-xl ${
                      deleteType === "permanent"
                        ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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