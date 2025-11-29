import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  supportRecoverOrder,
} from "../controllers/orderController.js";


const router = express.Router();

router.post("/recover-order", protectRoute, adminRoute, supportRecoverOrder);

router.get("/", protectRoute, adminRoute, getAllOrders);

router.put("/:orderId/status", protectRoute, adminRoute,updateOrderStatus);

router.get("/:id", protectRoute, adminRoute, getOrderById);

export default router