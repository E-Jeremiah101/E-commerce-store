import express from "express";

import { getAllTransactions } from "../controllers/admin.Transaction.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = express.Router();


router.get("/transactions", protectRoute, adminRoute, requirePermission("audit:read"), getAllTransactions);

export default router;