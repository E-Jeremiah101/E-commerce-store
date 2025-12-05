import express from "express";
import {
  getInventoryDashboard,
  getStockLevels,
  getLowStockAlerts,
  adjustStock,
  getStockHistory,
  getInventoryByLocation,
  getReorderSuggestions,
  getInventoryValuation,
  bulkUpdateStock,

} from "../controllers/inventory.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected and admin only
router.use(protectRoute, adminRoute);

// 📊 Stock Dashboard
router.get("/dashboard", getInventoryDashboard);

// 📦 Stock Levels
router.get("/stock-levels", getStockLevels);

// 🚨 Low Stock Alerts
router.get("/low-stock", getLowStockAlerts);

// 🔄 Stock Adjustments
router.post("/adjust/:productId", adjustStock);
router.post("/bulk-adjust", bulkUpdateStock);

// 📈 Stock History
router.get("/history", getStockHistory);

// 📍 Multi-location Inventory
router.get("/locations", getInventoryByLocation);

// 📋 Reorder Management
router.get("/reorder-suggestions", getReorderSuggestions);

// 💰 Inventory Valuation
router.get("/valuation", getInventoryValuation);
// Change from:


export default router;
