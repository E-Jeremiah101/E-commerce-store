import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  checkoutSuccess,
  createCheckoutSession,
  handleFlutterwaveWebhook,
  testWebhook,
  checkRecentOrders,
  validateWebhookEnv,
  getTestUserId,
  getTestProducts,
  getPublicRecentOrders,
  
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/flutterwave-pay", protectRoute, createCheckoutSession);
router.post("/flutterwave-webhook", handleFlutterwaveWebhook);
router.post("/checkout-success", protectRoute, checkoutSuccess);


// ADD THESE NEW DEBUGGING ROUTES:
router.get("/webhooks/test", testWebhook);
router.get("/webhooks/recent-orders", protectRoute, checkRecentOrders);
router.get("/webhooks/env-check", validateWebhookEnv, (req, res) => {
  res.json({ message: "Environment variables are properly configured" });
});
router.get("/test-user-id", getTestUserId);
router.get("/test-products", getTestProducts);
router.get("/public-recent-orders", getPublicRecentOrders);
// router.get("/webhooks/debug-env", debugEnv);


export default router;
 