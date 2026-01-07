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
  exportInventoryCSV,
} from "../controllers/inventory.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";


const router = express.Router();


router.use(
  protectRoute,
  adminRoute,
  adminRoute,
  requirePermission("product:read")
);

 
router.get("/dashboard", getInventoryDashboard);


router.get("/stock-levels", getStockLevels);

router.get("/low-stock", getLowStockAlerts);

router.post("/adjust/:productId", adjustStock);

router.get("/locations", getInventoryByLocation);

router.get("/valuation", getInventoryValuation);
router.get("/export-csv", exportInventoryCSV);

router.post("/sync-orders", syncOrdersWithInventory);
router.get("/aging-report",  getInventoryAgingReport);


 
export default router;
