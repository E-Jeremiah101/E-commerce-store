import express from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
} from "../controllers/orderController.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();
router.get("/my-orders", protectRoute, getUserOrders);
router.post("/", protectRoute, createOrder);
router.get("/vieworders/:id", protectRoute, getOrderById);
router.get("/:id", protectRoute, getOrderById);




export default router;