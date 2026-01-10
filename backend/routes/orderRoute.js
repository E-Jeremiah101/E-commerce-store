import express from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
} from "../controllers/orderController.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateQuery, validateParams, validateBody, orderSchemas } from "../middleware/validateInput.middleware.js";



const router = express.Router();
router.get("/my-orders", protectRoute, validateQuery(orderSchemas.pagination), getUserOrders);
router.post("/", protectRoute, validateBody(orderSchemas.create), createOrder);
router.get("/vieworders/:id", protectRoute, validateParams(orderSchemas.getById), getOrderById);
router.get("/:id", protectRoute, validateParams(orderSchemas.getById), getOrderById);
 



export default router;