import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  checkoutSuccess,
  createCheckoutSession,handleFlutterwaveWebhook
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/flutterwave-pay", protectRoute, createCheckoutSession);
router.post("/flutterwave-webhook", handleFlutterwaveWebhook);
router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
