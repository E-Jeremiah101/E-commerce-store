import express from "express";
import { getUserOrders, getOrderById } from "../controllers/orderController.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();
router.get("/my-orders", protectRoute, getUserOrders);
router.get("/vieworders/:id", getOrderById);
router.get("/:id", protectRoute, getOrderById);



export default router;