import express from "express";
import {
  login,
  logout,
  signup,
  refreshToken,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { loginRateLimiter, signupRateLimiter, forgotPasswordRateLimiter } from "../middleware/rateLimiter.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signupRateLimiter, signup);
router.post("/login", loginRateLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile",protectRoute ,getProfile);
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", protectRoute, changePassword);


export default router;