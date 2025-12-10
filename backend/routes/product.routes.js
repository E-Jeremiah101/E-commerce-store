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

import { slashProductPrice, resetProductPrice,updateProductPrice,getPriceHistory } from "../controllers/price.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.use((req, res, next) => {
  console.log(`🔍 [ROUTE DEBUG] ${req.method} ${req.originalUrl}`);
  console.log(`🔍 [ROUTE DEBUG] Params:`, req.params);
  next();
});

router.patch("/:id/price/slash", protectRoute, adminRoute, slashProductPrice);
router.patch("/:id/price/reset", protectRoute, adminRoute, resetProductPrice);
router.patch("/:id/price", protectRoute, adminRoute, updateProductPrice);
router.get("/:id/price-history", protectRoute, adminRoute, getPriceHistory);

// Public routes
router.get("/featured", getFeaturedProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.get("/search", searchProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/:id", getProductById);

// Variant-specific routes (public)
router.get("/:id/variants", getProductVariants);
router.get("/stock/:productId", getVariantStock); // ADD THIS ROUTE
// In product.routes.js
router.get('/debug-stock/:productId', debugProductStock);

router.get("/:productId/check-availability", checkVariantAvailability);
router.post("/check-cart-availability", checkCartAvailability);

// Admin protected routes
router.get("/", protectRoute, adminRoute, getAllProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);
// In your product routes
router.get('/archived', protectRoute, adminRoute, getArchivedProducts);
router.patch('/:id/restore', protectRoute, adminRoute, restoreProduct);
router.delete('/:id/permanent', protectRoute, adminRoute, permanentDeleteProduct);
//end 
router.put("/:id/reduce-stock", protectRoute, adminRoute, reduceProduct);
router.put("/:id/variants", protectRoute, adminRoute, updateVariantStock);
router.put(
  "/:productId/variants/:variantId/inventory",
  protectRoute,
  adminRoute,
  updateVariantInventory
);
router.delete("/cache/featured", protectRoute, adminRoute, clearFeaturedCache);

// Price management routes (admin only)


export default router; 
