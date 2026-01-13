import express from "express";
import {
  getUserOrders,
  getOrderById,
  createOrder,
} from "../controllers/orderController.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  validateQuery,
  validateParams,
  orderSchemas,
} from "../middleware/validateInput.middleware.js";

const router = express.Router();
router.get(
  "/my-orders",
  protectRoute,
  validateQuery(orderSchemas.pagination),
  getUserOrders
);
router.post("/", protectRoute, createOrder);
router.get(
  "/vieworders/:id",
  protectRoute,
  getOrderById
);
router.get(
  "/:id",
  protectRoute,
  validateParams(orderSchemas.getById),
  getOrderById
);

export default router;
