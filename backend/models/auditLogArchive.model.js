
import mongoose from "mongoose";

const auditLogArchiveSchema = new mongoose.Schema(
  {
    archivedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    totalLogs: {
      type: Number,
      required: true,
    },
    archiveFileUrl: {
      type: String,
      default: null,
    },
    fileSize: {
      type: String,
      default: null,
    },
    compressionRatio: {
      type: Number,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "partial"],
      default: "completed",
    },
    errorLog: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying archives by period
auditLogArchiveSchema.index({ periodStart: -1, periodEnd: -1 });
auditLogArchiveSchema.index({ archivedAt: -1 });
auditLogArchiveSchema.index({ status: 1 });

const AuditLogArchive = mongoose.model(
  "AuditLogArchive",
  auditLogArchiveSchema
);

export default AuditLogArchive;
