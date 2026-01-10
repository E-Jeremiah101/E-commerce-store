import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateCoupon, getCoupon } from "../controllers/coupon.controller.js";
import {
  validateBody,
  couponSchemas,
} from "../middleware/validateInput.middleware.js";

const router = express.Router();
router.get("/", protectRoute, getCoupon);
router.post(
  "/validate",
  protectRoute,
  validateBody(couponSchemas.validate),
  validateCoupon
);

export default router;
