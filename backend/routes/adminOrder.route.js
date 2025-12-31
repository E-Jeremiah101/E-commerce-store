import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminRoute } from "../middleware/auth.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  supportRecoverOrder,
} from "../controllers/orderController.js";
import {
  unarchiveOrders,
  unarchiveOrdersByIds,
  recoverSingleOrder,
} from "../service/orderArchive.service.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { getArchivedOrders, archiveOldOrders, } from "../service/orderArchive.service.js";


const router = express.Router();
router.get(
  "/archived",
  protectRoute,
  adminRoute,
  // requirePermission("order:read"),
  getArchivedOrders
); 
router.post(
  "/recover-order",
  protectRoute,
  adminRoute,
  requirePermission("recovery:write"),
  supportRecoverOrder
);

router.get(
  "/",
  protectRoute,
  adminRoute,
  requirePermission("order:read"),
  getAllOrders
);

router.put(
  "/:orderId/status",
  protectRoute,
  adminRoute,
  requirePermission("order:write"),
  updateOrderStatus
);



//Im forcing th days orders to archive
router.post("/force-archive", async (req, res) => {
  const result = await archiveOldOrders({ olderThanMonths: 0.03 });
  res.json(result);
});

router.post("/unarchive/recent", protectRoute, adminRoute, async (req, res) => {
  try {
    const { daysAgo = 1, limit = 100 } = req.body;
    const result = await unarchiveOrders({ daysAgo, limit });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/unarchive/by-ids", protectRoute, adminRoute, async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide an array of order IDs",
      });
    }

    const result = await unarchiveOrdersByIds(orderIds);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recover single order from archive
router.post(
  "/recover/:archiveId",
  protectRoute,
  adminRoute,
  async (req, res) => {
    try {
      const { archiveId } = req.params;
      const result = await recoverSingleOrder(archiveId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Search archived orders (for admin UI)
router.get(
  "/:id",
  protectRoute,
  adminRoute,
  requirePermission("order:read"),
  getOrderById
);

export default router