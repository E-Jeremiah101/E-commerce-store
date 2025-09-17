import express from "express";
import { getUserOrders } from "../controllers/orderController.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my-orders", protectRoute, getUserOrders);

export default router;