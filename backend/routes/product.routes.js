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
} from "../controllers/product.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

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

// Admin protected routes
router.get("/", protectRoute, adminRoute, getAllProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);
router.put("/:id/reduce-stock", protectRoute, adminRoute, reduceProduct);
router.put("/:id/variants", protectRoute, adminRoute, updateVariantStock);
router.put(
  "/:productId/variants/:variantId/inventory",
  protectRoute,
  adminRoute,
  updateVariantInventory
);
router.delete("/cache/featured", protectRoute, adminRoute, clearFeaturedCache);

export default router;
