// routes/webhook.routes.js
import express from "express";
import { flutterwaveWebhook } from "../controllers/refund.controller.js";

const router = express.Router();

router.post("/flutterwave", flutterwaveWebhook);

export default router;
