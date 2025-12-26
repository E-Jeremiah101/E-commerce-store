import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} from "../controllers/adminCoupon.controller.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.use(protectRoute, requirePermission("coupon:read"), adminRoute);

router.post("/", createCoupon);
router.post("/:id/", deleteCoupon);
router.get("/", getAllCoupons);
router.put("/:id", updateCoupon);
router.patch("/:id/toggle", toggleCoupon);

export default router;
