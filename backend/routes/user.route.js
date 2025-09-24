import express from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/users/me → fetch profile
router.get("/me", protectRoute, getProfile);

// PUT /api/users/me → update profile
router.put("/me", protectRoute, updateProfile);

export default router;
