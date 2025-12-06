// models/auditLog.model.js
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
        "CREATE_PRODUCT",
        "UPDATE_PRODUCT",
        "DELETE_PRODUCT",
        "RESTORE_PRODUCT",
        "PERMANENT_DELETE_PRODUCT",
        "TOGGLE_FEATURED",
        "UPDATE_INVENTORY",
        "CREATE_CATEGORY",
        "UPDATE_CATEGORY",
        "UPDATE_ORDER_STATUS",
        "UPDATE_USER_ROLE",
        "LOGIN",
        "LOGOUT",
        "OTHER",
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["Product", "Order", "User", "Category", "System", "Other"], // Match model names
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
