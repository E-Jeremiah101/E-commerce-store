// import express from "express";
// import { getProfile, updateProfile } from "../controllers/user.controller.js";
// import { protectRoute } from "../middleware/auth.middleware.js";
// import {
//   getAllUsers,
//   makeAdmin,
//   updateUserRole,
// } from "../controllers/user.controller.js";
// import { adminRoute } from "../middleware/auth.middleware.js";
// import { requirePermission } from "../middleware/permission.middleware.js";



// const router = express.Router();

// // GET /api/users/me → fetch profile
// router.get("/me", protectRoute, getProfile);

// // PUT /api/users/me → update profile
// router.put("/me", protectRoute, updateProfile);

// router.get(
//   "/users",
//   protectRoute,
//   adminRoute,
//   requirePermission("user:read"),
//   getAllUsers
// );

// router.patch(
//   "/users/:userId/make-admin",
//   protectRoute,
//   adminRoute,
//   requirePermission("user:write"),
//   makeAdmin
// );

// router.put("/users/:id/role", protectRoute, adminRoute, updateUserRole);
// export default router;

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

// User profile routes (for authenticated users)
router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, updateProfile);

// Admin user management routes
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