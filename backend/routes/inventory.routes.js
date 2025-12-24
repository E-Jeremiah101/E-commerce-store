import express from "express";
import {
  getInventoryDashboard,
  getStockLevels,
  getLowStockAlerts,
  adjustStock,
  getInventoryByLocation,
  getInventoryValuation,
  syncOrdersWithInventory,
  getInventoryAgingReport,
} from "../controllers/inventory.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";


const router = express.Router();

// All routes are protected and admin only
router.use(
  protectRoute,
  adminRoute,
  adminRoute,
  requirePermission("product:read")
);

//  Stock Dashboard  
router.get("/dashboard", getInventoryDashboard);

//  Stock Levels
router.get("/stock-levels", getStockLevels);

//  Low Stock Alerts
router.get("/low-stock", getLowStockAlerts);

//  Stock Adjustments
router.post("/adjust/:productId", adjustStock);

//  Multi-location Inventory
router.get("/locations", getInventoryByLocation);


//  Inventory Valuation
router.get("/valuation", getInventoryValuation);

router.post("/sync-orders", syncOrdersWithInventory);
router.get("/aging-report",  getInventoryAgingReport);


 
export default router;
