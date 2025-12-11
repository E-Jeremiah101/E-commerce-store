import AuditLog from "../models/auditLog.model.js";
import mongoose from "mongoose";
import { ENTITY_TYPES, ACTION_LABELS, ENTITY_TYPE_LABELS } from "../constants/auditLog.constants.js";

export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      action,
      entityType,
      adminId,
      search,
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Filter by action (frontend sends "ALL" for all)
    if (action && action !== "ALL") {
      query.action = action;
    }

    // Filter by entity type (map frontend to backend)
    if (entityType && entityType !== "ALL") {
      // Frontend sends uppercase, we need proper model name
      const entityTypeMap = {
        PRODUCT: ENTITY_TYPES.PRODUCT,
        ORDER: ENTITY_TYPES.ORDER,
        USER: ENTITY_TYPES.USER,
        CATEGORY: ENTITY_TYPES.CATEGORY,
        SYSTEM: ENTITY_TYPES.SYSTEM,
        OTHER: ENTITY_TYPES.OTHER,
      };
      query.entityType = entityTypeMap[entityType] || entityType;
    }

    if (adminId) {
      query.adminId = new mongoose.Types.ObjectId(adminId);
    }

    if (search) {
      query.$or = [
        { entityName: { $regex: search, $options: "i" } },
        { adminName: { $regex: search, $options: "i" } },
        { additionalInfo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(query);

    // Get logs with pagination
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("adminId", "firstname lastname email")
      .lean();

    // Add human-readable labels
    const enrichedLogs = logs.map((log) => ({
      ...log,
      actionLabel: ACTION_LABELS[log.action] || log.action,
      entityTypeLabel: ENTITY_TYPE_LABELS[log.entityType] || log.entityType,
    }));

    res.json({
      success: true,
      logs: enrichedLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuditLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const stats = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Actions by type
          actionsByType: [
            {
              $group: {
                _id: "$action",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          // Entities by type
          entitiesByType: [
            {
              $group: {
                _id: "$entityType",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          // Most active admins
          topAdmins: [
            {
              $group: {
                _id: "$adminId",
                adminName: { $first: "$adminName" },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          // Activity by hour
          activityByHour: [
            {
              $group: {
                _id: { $hour: "$timestamp" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Total count
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate("adminId", "firstname lastname email")
      .lean();

    // Convert to CSV format
    const csvData = logs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      Admin: log.adminName,
      Action: log.action,
      EntityType: log.entityType,
      EntityName: log.entityName || "N/A",
      Changes: JSON.stringify(log.changes || {}),
      IPAddress: log.ipAddress,
      AdditionalInfo: log.additionalInfo || "",
    }));

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit_logs.csv");

    // Simple CSV generation
    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) =>
            typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val
          )
          .join(",")
      ),
    ].join("\n");

    res.send(csvString);
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate("adminId", "firstname lastname email")
      .populate("entityId")
      .lean();

    if (!log) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Add this to your auditLog.controller.js
export const getPriceHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Fetch all price-related audit logs for this product
    const priceLogs = await AuditLog.find({
      entityId: productId,
      entityType: ENTITY_TYPES.PRODUCT,
      action: { 
        $in: [
          ACTIONS.PRICE_SLASH, 
          ACTIONS.PRICE_UPDATE, 
          ACTIONS.PRICE_RESET,
          ACTIONS.UPDATE_PRODUCT // If regular product updates include price changes
        ] 
      }
    })
    .sort({ timestamp: -1 })
    .populate('adminId', 'firstname lastname email')
    .lean();

    // Format the logs for display
    const formattedLogs = priceLogs.map(log => ({
      id: log._id,
      timestamp: log.timestamp,
      adminName: log.adminName,
      adminEmail: log.adminId?.email || '',
      action: log.action,
      oldPrice: log.changes?.oldPrice || log.changes?.price?.before || 'N/A',
      newPrice: log.changes?.newPrice || log.changes?.price?.after || 'N/A',
      changeType: log.changes?.priceChange?.type || 
                 (log.action === 'PRICE_SLASH' ? 'slash' : 
                  log.action === 'PRICE_RESET' ? 'reset' : 'update'),
      percentage: log.changes?.priceChange?.percentage || 
                 log.changes?.priceChange?.discount || 
                 log.changes?.price?.discount || 'N/A',
      reason: log.additionalInfo || 'No reason provided',
      ipAddress: log.ipAddress,
      discount: log.changes?.priceChange?.discount || 
               log.changes?.price?.discount || null
    }));

    res.json({
      success: true,
      priceHistory: formattedLogs,
      total: formattedLogs.length
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch price history' 
    });
  }
};

// export const getPriceHistory = async (req, res) => {
//   try {
//     const { productId, startDate, endDate, action } = req.query;

//     // Build filter
//     const filter = {
//       entityType: "Product",
//       action: {
//         $in: ["PRICE_SLASH", "PRICE_UPDATE", "PRICE_RESET", "UPDATE_PRODUCT"],
//       },
//     };

//     // Add product filter if provided
//     if (productId) {
//       filter.entityId = productId;
//     }

//     // Add date filters if provided
//     if (startDate || endDate) {
//       filter.timestamp = {};
//       if (startDate) {
//         filter.timestamp.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         filter.timestamp.$lte = new Date(endDate);
//       }
//     }

//     // Add action filter if provided
//     if (action && action !== "ALL" && action !== "") {
//       filter.action = action;
//     }

//     console.log("🔍 Fetching price history with filter:", filter);

//     // Fetch audit logs
//     const priceLogs = await AuditLog.find(filter)
//       .sort({ timestamp: -1 })
//       .populate("adminId", "firstname lastname email")
//       .lean();

//     // Format the logs for display
//     const formattedLogs = priceLogs.map((log) => {
//       // Extract price information from changes object
//       let oldPrice = "N/A";
//       let newPrice = "N/A";
//       let discount = null;
//       let changeType = log.action.toLowerCase().replace("price_", "");

//       if (log.changes) {
//         // Check different possible structures
//         if (
//           log.changes.oldPrice !== undefined &&
//           log.changes.newPrice !== undefined
//         ) {
//           oldPrice = log.changes.oldPrice;
//           newPrice = log.changes.newPrice;
//         } else if (log.changes.price) {
//           oldPrice = log.changes.price.before || "N/A";
//           newPrice = log.changes.price.after || "N/A";
//           discount = log.changes.price.discount || null;
//         }
//       }

//       // Calculate percentage if not provided
//       let percentage = discount;
//       if (
//         !percentage &&
//         oldPrice !== "N/A" &&
//         newPrice !== "N/A" &&
//         oldPrice > 0
//       ) {
//         const change = ((newPrice - oldPrice) / oldPrice) * 100;
//         percentage = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
//       }

//       return {
//         id: log._id,
//         _id: log._id,
//         timestamp: log.timestamp,
//         adminName: log.adminName,
//         adminId: log.adminId,
//         action: log.action,
//         oldPrice: oldPrice,
//         newPrice: newPrice,
//         changeType: changeType,
//         percentage: percentage || "N/A",
//         discount: discount,
//         entityName: log.entityName || "Unknown Product",
//         entityId: log.entityId,
//         additionalInfo: log.additionalInfo || "No reason provided",
//         ipAddress: log.ipAddress,
//         createdAt: log.createdAt,
//       };
//     });

//     res.json({
//       success: true,
//       priceHistory: formattedLogs,
//       total: formattedLogs.length,
//       filters: {
//         productId,
//         startDate,
//         endDate,
//         action,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching price history:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch price history",
//       error: error.message,
//     });
//   }
// };

// // Add this function for single product price history
// export const getProductPriceHistory = async (req, res) => {
//   try {
//     const { productId } = req.params;

//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "Product ID is required",
//       });
//     }

//     const priceLogs = await AuditLog.find({
//       entityType: "Product",
//       entityId: productId,
//       action: {
//         $in: ["PRICE_SLASH", "PRICE_UPDATE", "PRICE_RESET", "UPDATE_PRODUCT"],
//       },
//     })
//       .sort({ timestamp: -1 })
//       .populate("adminId", "firstname lastname email")
//       .lean();

//     const formattedLogs = priceLogs.map((log) => {
//       let oldPrice = "N/A";
//       let newPrice = "N/A";
//       let discount = null;

//       if (log.changes) {
//         if (
//           log.changes.oldPrice !== undefined &&
//           log.changes.newPrice !== undefined
//         ) {
//           oldPrice = log.changes.oldPrice;
//           newPrice = log.changes.newPrice;
//         } else if (log.changes.price) {
//           oldPrice = log.changes.price.before || "N/A";
//           newPrice = log.changes.price.after || "N/A";
//           discount = log.changes.price.discount || null;
//         }
//       }

//       let percentage = discount;
//       if (
//         !percentage &&
//         oldPrice !== "N/A" &&
//         newPrice !== "N/A" &&
//         oldPrice > 0
//       ) {
//         const change = ((newPrice - oldPrice) / oldPrice) * 100;
//         percentage = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
//       }

//       return {
//         id: log._id,
//         _id: log._id,
//         timestamp: log.timestamp,
//         adminName: log.adminName,
//         adminId: log.adminId,
//         action: log.action,
//         oldPrice: oldPrice,
//         newPrice: newPrice,
//         changeType: log.action.toLowerCase().replace("price_", ""),
//         percentage: percentage || "N/A",
//         discount: discount,
//         entityName: log.entityName || "Unknown Product",
//         entityId: log.entityId,
//         additionalInfo: log.additionalInfo || "No reason provided",
//         ipAddress: log.ipAddress,
//       };
//     });

//     res.json({
//       success: true,
//       priceHistory: formattedLogs,
//       total: formattedLogs.length,
//       productId: productId,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching product price history:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch product price history",
//       error: error.message,
//     });
//   }
// };