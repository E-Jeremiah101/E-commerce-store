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

import {
  getArchives,
  getArchiveById,
  downloadArchive,
  deleteArchive,
  restoreArchive,
  triggerManualArchive,
  checkArchiveStatus,
} from "../controllers/auditLogArchive.controller.js";

import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.get(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("audit:read"),
  getAuditLogs
);
router.get("/stats", protectRoute, adminRoute, getAuditLogStats);
router.get("/export", protectRoute, adminRoute, exportAuditLogs);
router.get("/:id", protectRoute, adminRoute, getAuditLogById);
router.get("/price-history", protectRoute, adminRoute, getPriceHistory);

router.get(
  "/archives/list",
  protectRoute,
  adminRoute,
  requirePermission("audit:read"),
  getArchives
);
router.get(
  "/archives/status",
  protectRoute,
  adminRoute,
  requirePermission("audit:read"),
  checkArchiveStatus
);
router.post(
  "/archives/trigger",
  protectRoute,
  adminRoute,
  requirePermission("audit:write"),
  triggerManualArchive
);

router.get(
  "/archives/download/:id",
  protectRoute,
  adminRoute,
  requirePermission("audit:read"),
  downloadArchive
);
router.delete(
  "/archives/:id",
  protectRoute,
  adminRoute,
  requirePermission("audit:write"),
  deleteArchive
);
router.post(
  "/archives/restore/:id",
  protectRoute,
  adminRoute,
  requirePermission("audit:write"),
  restoreArchive
);
router.get(
  "/archives/:id",
  protectRoute,
  adminRoute,
  requirePermission("audit:read"),
  getArchiveById
);

export default router;
