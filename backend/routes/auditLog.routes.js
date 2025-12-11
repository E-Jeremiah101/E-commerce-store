// routes/audit.routes.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import {
  getAuditLogs,
  getAuditLogStats,
  exportAuditLogs,
  getAuditLogById,
  getPriceHistory,
} from "../controllers/auditLog.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAuditLogs);
router.get("/stats", protectRoute, adminRoute, getAuditLogStats);
router.get("/export", protectRoute, adminRoute, exportAuditLogs);
router.get("/:id", protectRoute, adminRoute, getAuditLogById);
router.get("/price-history", protectRoute, adminRoute, getPriceHistory);
// router.get("/price-history", protectRoute, adminRoute, getPriceHistory);
// router.get(
//   "/price-history/:productId",
//   protectRoute,
//   adminRoute,
//   getProductPriceHistory
// );

export default router;
