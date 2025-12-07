
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Product actions
        "CREATE_PRODUCT",
        "UPDATE_PRODUCT",
        "DELETE_PRODUCT",
        "RESTORE_PRODUCT",
        "PERMANENT_DELETE_PRODUCT",
        "TOGGLE_FEATURED",
        "UPDATE_INVENTORY",

        // Inventory actions
        "BULK_INVENTORY_UPDATE",
        "BULK_INVENTORY_UPDATE_FAILED",
        "INVENTORY_SYNC",
        "INVENTORY_SYNC_FAILED",
        "AUTO_INVENTORY_ADJUSTMENT",

        // Refund actions
        "REFUND_APPROVED",
        "REFUND_REJECTED",
        "REFUND_APPROVAL_FAILED",
        "REFUND_APPROVAL_ERROR",
        "REFUND_REJECTION_ERROR",
        "VIEW_REFUND_REQUESTS",

        // Order actions
        "UPDATE_ORDER_STATUS",
        "ORDER_RECOVERY_ATTEMPT",
        "ORDER_RECOVERY_SUCCESS",
        "ORDER_RECOVERY_FAILED",
        "ORDER_RECOVERY_DUPLICATE",
        "CREATE_ORDER",
        "CREATE_ORDER_FAILED",
        "VIEW_ORDERS_SEARCH",
        "VIEW_ORDER_DETAILS",
        "VIEW_USER_ORDERS",
        "VIEW_USER_ORDER", // Add this

        // Category actions
        "CREATE_CATEGORY",
        "UPDATE_CATEGORY",

        // User actions
        "UPDATE_USER_ROLE",

        // Auth actions
        "LOGIN",
        "LOGOUT",
        "OTHER",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Product", "Order", "User", "Category", "System", "Other"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "entityType",
    },
    entityName: {
      type: String,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    additionalInfo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({
  adminName: "text",
  entityName: "text",
  additionalInfo: "text",
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
