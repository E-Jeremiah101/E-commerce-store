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
import {
  loginRateLimiter,
  signupRateLimiter,
  forgotPasswordRateLimiter,
} from "../middleware/rateLimiter.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
  authSchemas,
} from "../middleware/validateInput.middleware.js";

const router = express.Router();

router.post(
  "/signup",
  signupRateLimiter,
  validateBody(authSchemas.signup),
  signup
);
router.post("/login", loginRateLimiter, validateBody(authSchemas.login), login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validateBody(authSchemas.forgotPassword),
  forgotPassword
);
router.post(
  "/reset-password/:token",
  validateBody(authSchemas.resetPassword),
  resetPassword
);
router.post(
  "/change-password",
  protectRoute,
  validateBody(authSchemas.changePassword),
  changePassword
);

export default router;
