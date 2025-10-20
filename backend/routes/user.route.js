import express from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getAllUsers,
  makeAdmin,
  updateUserRole,
} from "../controllers/user.controller.js";
import { adminRoute } from "../middleware/auth.middleware.js";



const router = express.Router();

// GET /api/users/me → fetch profile
router.get("/me", protectRoute, getProfile);

// PUT /api/users/me → update profile
router.put("/me", protectRoute, updateProfile);

router.get("/users", protectRoute, adminRoute, getAllUsers);

router.patch("/users/:userId/make-admin", protectRoute, adminRoute, makeAdmin);

router.put("/users/:id/role", protectRoute, adminRoute, updateUserRole);
export default router;
