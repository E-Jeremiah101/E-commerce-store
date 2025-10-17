import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,getOrderById,
} from "../controllers/orderController.js";


const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllOrders);

router.put("/:orderId/status", protectRoute, adminRoute,updateOrderStatus);

router.get("/:id", protectRoute, adminRoute, getOrderById);
export default router