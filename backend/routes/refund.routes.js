// routes/refund.routes.js
import express from "express";
import {
  requestRefund,
  getAllRefundRequests,
  approveRefund,
  rejectRefund, 
  retryWebhook,
  checkRefundStatus,
  pollRefundStatus,
  fixStuckRefunds,
} from "../controllers/refund.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// User — request refund
router.post("/:orderId/request", protectRoute, requestRefund);

// Admin — view + approve + reject
router.get("/", protectRoute, adminRoute, getAllRefundRequests);
router.put(
  "/:orderId/:refundId/approve",
  protectRoute,
  adminRoute,
  approveRefund
);
router.put(
  "/:orderId/:refundId/reject",
  protectRoute,
  adminRoute, 
  rejectRefund
);
router.post("/webhook/retry", adminRoute, retryWebhook);
router.get(
  "/:orderId/:refundId/status",
  protectRoute,
  adminRoute,
  checkRefundStatus
);
router.get(
  "/:orderId/:refundId/poll",
  protectRoute,
  adminRoute,
  pollRefundStatus
);
router.post("/fix-stuck", protectRoute, adminRoute, fixStuckRefunds);

export default router;
