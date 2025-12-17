// routes/webhook.routes.js
import express from "express";
import { flutterwaveWebhook } from "../controllers/refund.controller.js";

const router = express.Router();

// Public endpoint - NO auth middleware!
router.post("/flutterwave", flutterwaveWebhook);

export default router;
