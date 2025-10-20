import express from "express";
import {
  requestRefund,
  getAllRefundRequests,
  approveRefund,
  rejectRefund,
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

export default router;
