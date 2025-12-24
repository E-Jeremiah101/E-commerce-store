import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  supportRecoverOrder,
} from "../controllers/orderController.js";
import { requirePermission } from "../middleware/permission.middleware.js";


const router = express.Router();

router.post(
  "/recover-order",
  protectRoute,
  adminRoute,
  requirePermission("recovery:write"),
  supportRecoverOrder
);

router.get(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("order:read"),
  getAllOrders
);

router.put(
  "/:orderId/status",
  protectRoute,
  adminRoute,
  requirePermission("order:write"),
  updateOrderStatus
);

router.get(
  "/:id",
  protectRoute,
  adminRoute,
  requirePermission("order:read"),
  getOrderById
);

export default router