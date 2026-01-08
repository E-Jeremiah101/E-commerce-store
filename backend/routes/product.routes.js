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
  permanentDeleteProduct,
  restoreProduct,
  getArchivedProducts,
  exportProductsCSV,
  exportProductsDetailedCSV,
  trackProductView,
  getRecentlyViewedProducts,
} from "../controllers/product.controller.js";

import {
  slashProductPrice,
  resetProductPrice,
  updateProductPrice,
  getPriceHistory,
} from "../controllers/price.controller.js";
import { protectRoute, adminRoute} from "../middleware/auth.middleware.js";
import { authenticateOptional } from "../middleware/authOptional.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();



router.get("/featured", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts);
router.get("/search", searchProducts);
router.get("/suggestions", getSearchSuggestions);


router.get("/category/:category", getProductsByCategory);


router.get(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  getAllProducts
);


router.get(
  "/archived",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  getArchivedProducts
);

router.post(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  createProduct
);


router.post("/check-cart-availability", checkCartAvailability);


router.delete(
  "/cache/featured",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  clearFeaturedCache
);
router.get("/recently-viewed", authenticateOptional, getRecentlyViewedProducts);

router.get(
  "/export/csv",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  exportProductsCSV
);


router.get(
  "/export/detailed-csv",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  exportProductsDetailedCSV
);


router.get("/:id/variants", getProductVariants);
router.get("/stock/:productId", getVariantStock);
// router.get("/debug-stock/:productId", debugProductStock);
router.get("/:productId/check-availability", checkVariantAvailability);


router.patch(
  "/:id/price/slash",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  slashProductPrice
);
router.patch(
  "/:id/price/reset",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  resetProductPrice
);
router.patch(
  "/:id/price",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  updateProductPrice
);
router.get(
  "/:id/price-history",
  protectRoute,
  adminRoute,
  requirePermission("product:read"),
  getPriceHistory
);

router.patch("/:id/restore", protectRoute, adminRoute, restoreProduct);
router.delete(
  "/:id/permanent",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  permanentDeleteProduct
);

router.put(
  "/:id/reduce-stock",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  reduceProduct
);
router.put(
  "/:id/variants",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  updateVariantStock
);
router.put(
  "/:productId/variants/:variantId/inventory",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  updateVariantInventory
);

router.get("/:id", authenticateOptional, trackProductView, getProductById);
router.patch(
  "/:id",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  toggleFeaturedProduct
);
router.delete(
  "/:id",
  protectRoute,
  adminRoute,
  requirePermission("product:write"),
  deleteProduct
);

export default router;