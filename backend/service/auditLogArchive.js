// services/auditLogArchive.service.js
import mongoose from "mongoose";
import AuditLog from "../models/auditLog.model.js";
import AuditLogArchive from "../models/auditLogArchive.model.js";
import { promisify } from "util";
import zlib from "zlib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gzip = promisify(zlib.gzip);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

class AuditLogArchiveService {
  constructor() {
    this.archiveDir = path.join(__dirname, "../archives/audit-logs");
    this.ensureArchiveDirectory();
  }

  async ensureArchiveDirectory() {
    try {
      await mkdir(this.archiveDir, { recursive: true });
    } catch (error) {
      console.error("Error creating archive directory:", error);
    }
  }

  /**
   * Calculate date range for archive period
   */
  getArchivePeriod() {
    const now = new Date();
    const periodEnd = new Date(now);

    // Go back 2 months for period start
    const periodStart = new Date(now);
    periodStart.setMonth(periodStart.getMonth() - 2);

    // Set to start of month
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    // Set period end to end of previous month
    periodEnd.setMonth(periodEnd.getMonth() - 1);
    periodEnd.setDate(0); // Last day of previous month
    periodEnd.setHours(23, 59, 59, 999);

    return { periodStart, periodEnd };
  }

  /**
   * Archive logs older than 2 months
   */
  async archiveOldLogs(autoArchive = false) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { periodStart, periodEnd } = this.getArchivePeriod();

      console.log(
        `Archiving logs from ${periodStart.toISOString()} to ${periodEnd.toISOString()}`
      );

      // Find logs within the period
      const logs = await AuditLog.find({
        timestamp: {
          $gte: periodStart,
          $lte: periodEnd,
        },
      }).session(session);

      if (logs.length === 0) {
        console.log("No logs to archive for this period");
        await session.abortTransaction();
        session.endSession();
        return { success: true, message: "No logs to archive" };
      }

      // Create archive record
      const archiveRecord = new AuditLogArchive({
        periodStart,
        periodEnd,
        totalLogs: logs.length,
        archivedBy: autoArchive ? null : this.currentUserId,
        status: "pending",
        metadata: {
          actionCounts: this.countActions(logs),
          entityTypeCounts: this.countEntityTypes(logs),
        },
      });

      await archiveRecord.save({ session });

      // Create JSON file
      const archiveData = logs.map((log) => log.toObject());
      const jsonData = JSON.stringify(archiveData, null, 2);

      // Compress the data
      const compressedData = await gzip(jsonData);

      // Save to file
      const filename = `audit_logs_${
        periodStart.toISOString().split("T")[0]
      }_to_${periodEnd.toISOString().split("T")[0]}.json.gz`;
      const filepath = path.join(this.archiveDir, filename);
      await writeFile(filepath, compressedData);

      // Calculate file size
      const stats = fs.statSync(filepath);
      const fileSize = this.formatFileSize(stats.size);
      const originalSize = Buffer.byteLength(jsonData, "utf8");
      const compressionRatio = (
        ((originalSize - stats.size) / originalSize) *
        100
      ).toFixed(2);

      // Update archive record
      archiveRecord.archiveFileUrl = `/api/archives/download/${archiveRecord._id}`;
      archiveRecord.fileSize = fileSize;
      archiveRecord.compressionRatio = parseFloat(compressionRatio);
      archiveRecord.status = "completed";
      await archiveRecord.save({ session });

      // Delete archived logs from main collection
      await AuditLog.deleteMany({
        _id: { $in: logs.map((log) => log._id) },
      }).session(session);

      await session.commitTransaction();
      session.endSession();

      console.log(`Successfully archived ${logs.length} logs`);

      return {
        success: true,
        message: `Archived ${logs.length} logs`,
        archiveId: archiveRecord._id,
        periodStart,
        periodEnd,
        fileSize,
        compressionRatio: `${compressionRatio}%`,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error("Error archiving logs:", error);

      // Update archive record with error
      await AuditLogArchive.findOneAndUpdate(
        { status: "pending" },
        {
          $set: {
            status: "failed",
            errorLog: error.message,
          },
        },
        { sort: { createdAt: -1 } }
      );

      throw error;
    }
  }

  /**
   * Count actions for metadata
   */
  countActions(logs) {
    return logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Count entity types for metadata
   */
  countEntityTypes(logs) {
    return logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get all archives
   */
  async getArchives(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [archives, total] = await Promise.all([
      AuditLogArchive.find()
        .sort({ periodStart: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogArchive.countDocuments(),
    ]);

    return {
      archives,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get single archive with details
   */
  async getArchiveById(id) {
    return await AuditLogArchive.findById(id)
      .populate("archivedBy", "firstname lastname email")
      .lean();
  }

  /**
   * Download archive file
   */
  async downloadArchive(archiveId) {
    const archive = await AuditLogArchive.findById(archiveId);
    if (!archive) {
      throw new Error("Archive not found");
    }

    const filename = `audit_logs_${
      archive.periodStart.toISOString().split("T")[0]
    }_to_${archive.periodEnd.toISOString().split("T")[0]}.json.gz`;
    const filepath = path.join(this.archiveDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error("Archive file not found");
    }

    return {
      filepath,
      filename,
      contentType: "application/gzip",
    };
  }

  /**
   * Delete archive (manual cleanup)
   */
  async deleteArchive(archiveId) {
    const archive = await AuditLogArchive.findById(archiveId);
    if (!archive) {
      throw new Error("Archive not found");
    }

    // Delete file
    const filename = `audit_logs_${
      archive.periodStart.toISOString().split("T")[0]
    }_to_${archive.periodEnd.toISOString().split("T")[0]}.json.gz`;
    const filepath = path.join(this.archiveDir, filename);

    if (fs.existsSync(filepath)) {
      await unlink(filepath);
    }

    // Delete record
    await AuditLogArchive.findByIdAndDelete(archiveId);

    return { success: true, message: "Archive deleted" };
  }

  /**
   * Restore archive to main collection
   */
  async restoreArchive(archiveId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const archive = await AuditLogArchive.findById(archiveId).session(
        session
      );
      if (!archive) {
        throw new Error("Archive not found");
      }

      // Read and decompress file
      const filename = `audit_logs_${
        archive.periodStart.toISOString().split("T")[0]
      }_to_${archive.periodEnd.toISOString().split("T")[0]}.json.gz`;
      const filepath = path.join(this.archiveDir, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error("Archive file not found");
      }

      const compressedData = fs.readFileSync(filepath);
      const decompressedData = zlib.gunzipSync(compressedData);
      const logs = JSON.parse(decompressedData.toString());

      // Insert logs back into main collection
      await AuditLog.insertMany(logs, { session });

      // Update archive status
      archive.status = "completed";
      archive.restoredAt = new Date();
      await archive.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: `Restored ${logs.length} logs`,
        logsRestored: logs.length,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats() {
    const [totalArchives, totalArchivedLogs, pendingCount, lastArchive] =
      await Promise.all([
        AuditLogArchive.countDocuments(),
        AuditLogArchive.aggregate([
          { $group: { _id: null, total: { $sum: "$totalLogs" } } },
        ]),
        this.getPendingArchiveCount(),
        AuditLogArchive.findOne({ status: "completed" }).sort({
          createdAt: -1,
        }),
      ]);

    const { periodStart, periodEnd } = this.getArchivePeriod();

    // Count logs eligible for archive
    const logsToArchive = await AuditLog.countDocuments({
      timestamp: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    });

    return {
      totalArchives,
      totalArchivedLogs: totalArchivedLogs[0]?.total || 0,
      logCount: logsToArchive,
      needed: logsToArchive > 0,
      periodStart,
      periodEnd,
      lastArchiveDate: lastArchive?.createdAt,
      message:
        logsToArchive > 0
          ? `${logsToArchive} logs need archiving`
          : "No logs need archiving",
    };
  }

  /**
   * Get count of pending archive operations
   */
  async getPendingArchiveCount() {
    const { periodStart, periodEnd } = this.getArchivePeriod();
    return await AuditLog.countDocuments({
      timestamp: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    });
  }

  /**
   * Check archive status
   */
  async checkArchiveStatus() {
    return await this.getArchiveStats();
  }
}

// Export the class directly
export  { AuditLogArchiveService };

