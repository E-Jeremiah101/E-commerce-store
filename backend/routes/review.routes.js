
import express from "express";
import {
  addReview,
  getProductReviews,
  deleteReview,
  canReviewProduct,
} from "../controllers/review.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();


router.get("/:productId/can-review", protectRoute, canReviewProduct);
router.get("/:productId", getProductReviews);
router.post("/", protectRoute, addReview);
router.delete("/:productId/:userId", protectRoute, deleteReview);

export default router;
