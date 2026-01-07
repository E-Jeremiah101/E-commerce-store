import express from "express";
import {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserRole,
  getAdminTypes,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.get("/profile", protectRoute, getProfile);
router.put("/update-profile", protectRoute, updateProfile);

router.get(
  "/users",
  protectRoute,
  adminRoute,
  requirePermission("user:read"),
  getAllUsers
);

router.get(
  "/users/admin-types",
  protectRoute,
  adminRoute,
  requirePermission("user:write"),
  getAdminTypes
);

router.put(
  "/users/:id/role",
  protectRoute,
  adminRoute,
  requirePermission("user:write"),
  updateUserRole
);

export default router;