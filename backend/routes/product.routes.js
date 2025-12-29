// import express from "express";
// import {
//   getAllProducts,
//   getFeaturedProducts,
//   getProductsByCategory,
//   getRecommendedProducts,
//   createProduct,
//   toggleFeaturedProduct,
//   deleteProduct,
//   searchProducts,
//   getSearchSuggestions,
//   getProductById,
//   reduceProduct,
//   updateVariantStock,
//   getProductVariants,
//   getVariantStock,
//   updateVariantInventory,
//   clearFeaturedCache,
//   checkVariantAvailability,
//   checkCartAvailability,
//   debugProductStock,
//   permanentDeleteProduct, 
//   restoreProduct,
//   getArchivedProducts,
// } from "../controllers/product.controller.js";

// import { slashProductPrice, resetProductPrice,updateProductPrice,getPriceHistory } from "../controllers/price.controller.js";
// import { protectRoute } from "../middleware/auth.middleware.js";
// import { adminRoute } from "../middleware/auth.middleware.js";
// import { requirePermission } from "../middleware/permission.middleware.js";


// const router = express.Router();

// router.patch("/:id/price/slash", protectRoute, adminRoute, slashProductPrice);
// router.patch("/:id/price/reset", protectRoute, adminRoute, resetProductPrice);
// router.patch("/:id/price", protectRoute, adminRoute, updateProductPrice);
// router.get("/:id/price-history", protectRoute, adminRoute, getPriceHistory);

// // Public routes
// router.get("/featured", getFeaturedProducts);
// router.get("/category/:category", getProductsByCategory);
// router.get("/recommendations", getRecommendedProducts);
// router.get("/search", searchProducts);
// router.get("/suggestions", getSearchSuggestions);
// router.get("/:id", getProductById);

// // Variant-specific routes (public)
// router.get("/:id/variants", getProductVariants);
// router.get("/stock/:productId", getVariantStock); 
// router.get('/debug-stock/:productId', debugProductStock);

// router.get("/:productId/check-availability", checkVariantAvailability);
// router.post("/check-cart-availability", checkCartAvailability);

// // Admin protected routes
// router.get(
//   "/",
//   protectRoute,
//   adminRoute,
//   requirePermission("product:read"),
//   getAllProducts
// );
// router.post("/", protectRoute, adminRoute, requirePermission("product:write"), createProduct);
// router.patch(
//   "/:id",
//   protectRoute,
//   adminRoute,
//   requirePermission("product:write"),
//   toggleFeaturedProduct
// );
// router.delete("/:id", protectRoute, adminRoute, deleteProduct);

// router.patch('/:id/restore', protectRoute, adminRoute, restoreProduct);
// router.delete('/:id/permanent', protectRoute, adminRoute, permanentDeleteProduct);
// //end 
// router.put("/:id/reduce-stock", protectRoute, adminRoute, reduceProduct);
// router.put("/:id/variants", protectRoute, adminRoute, updateVariantStock);
// router.put(
//   "/:productId/variants/:variantId/inventory",
//   protectRoute,
//   adminRoute,
//   updateVariantInventory
// );
// router.delete("/cache/featured", protectRoute, adminRoute, clearFeaturedCache);

 

// export default router; 
import express from "express";
import {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getRecommendedProducts,
  createProduct,
  toggleFeaturedProduct,
  deleteProduct,
  searchProducts,
  getSearchSuggestions,
  getProductById,
  reduceProduct,
  updateVariantStock,
  getProductVariants,
  getVariantStock,
  updateVariantInventory,
  clearFeaturedCache,
  checkVariantAvailability,
  checkCartAvailability,
  debugProductStock,
  permanentDeleteProduct,
  restoreProduct,
  getArchivedProducts,
} from "../controllers/product.controller.js";

import {
  slashProductPrice,
  resetProductPrice,
  updateProductPrice,
  getPriceHistory,
} from "../controllers/price.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();

// ✅ REORDER: Static routes BEFORE parameterized routes

// Public static routes
router.get("/featured", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts);
router.get("/search", searchProducts);
router.get("/suggestions", getSearchSuggestions);

// Category route (has specific pattern /category/)
router.get("/category/:category", getProductsByCategory);

// Admin static routes
router.get(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  getAllProducts
);

// ✅ IMPORTANT: Put /archived BEFORE all /:id routes
router.get("/archived", protectRoute, adminRoute, getArchivedProducts);

// Other admin POST route
router.post(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  createProduct
);

// Cart availability (static POST route)
router.post("/check-cart-availability", checkCartAvailability);

// Cache route (static)
router.delete("/cache/featured", protectRoute, adminRoute, clearFeaturedCache);

// Variant-specific routes (these have patterns but come before generic :id)
router.get("/:id/variants", getProductVariants);
router.get("/stock/:productId", getVariantStock);
router.get("/debug-stock/:productId", debugProductStock);
router.get("/:productId/check-availability", checkVariantAvailability);

// Price routes (specific patterns with /price)
router.patch("/:id/price/slash", protectRoute, adminRoute, slashProductPrice);
router.patch("/:id/price/reset", protectRoute, adminRoute, resetProductPrice);
router.patch("/:id/price", protectRoute, adminRoute, updateProductPrice);
router.get("/:id/price-history", protectRoute, adminRoute, getPriceHistory);

// Product-specific routes with /restore and /permanent patterns
router.patch("/:id/restore", protectRoute, adminRoute, restoreProduct);
router.delete(
  "/:id/permanent",
  protectRoute,
  adminRoute,
  permanentDeleteProduct
);

// Other product-specific routes
router.put("/:id/reduce-stock", protectRoute, adminRoute, reduceProduct);
router.put("/:id/variants", protectRoute, adminRoute, updateVariantStock);
router.put(
  "/:productId/variants/:variantId/inventory",
  protectRoute,
  adminRoute,
  updateVariantInventory
);

// ✅ FINALLY: Generic /:id routes (should come LAST)
router.get("/:id", getProductById);
router.patch(
  "/:id",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  toggleFeaturedProduct
);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;