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
import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute,adminRoute, requirePermission("audit:read"), getAuditLogs);
router.get("/stats", protectRoute, adminRoute, getAuditLogStats);
router.get("/export", protectRoute, adminRoute, exportAuditLogs);
router.get("/:id", protectRoute, adminRoute, getAuditLogById);
router.get("/price-history", protectRoute, adminRoute, getPriceHistory);

export default router;
