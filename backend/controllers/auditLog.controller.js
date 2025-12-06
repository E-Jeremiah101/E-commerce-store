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
