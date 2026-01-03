import { AuditLogArchiveService } from "../service/auditLogArchive.js";
import AuditLogArchive from "../models/auditLogArchive.model.js";

// Create an instance of the service
const auditLogArchiveService = new AuditLogArchiveService();
export const getArchives = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status,
      search,
    } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Status filter (skip "ALL")
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Search filter (search in metadata or filename)
    if (search) {
      query.$or = [
        { "metadata.actionCounts": { $regex: search, $options: "i" } },
        { "metadata.entityTypeCounts": { $regex: search, $options: "i" } },
        { archiveFileUrl: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLogArchive.countDocuments(query);

    const archives = await AuditLogArchive.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("archivedBy", "firstname lastname email")
      .lean();

    res.json({
      success: true,
      archives,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching archives:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch archives",
      error: error.message,
    });
  }
};
export const getArchiveById = async (req, res) => {
  try {
    const archive = await auditLogArchiveService.getArchiveById(req.params.id);

    if (!archive) {
      return res.status(404).json({
        success: false,
        message: "Archive not found",
      });
    }

    res.json({
      success: true,
      archive,
    });
  } catch (error) {
    console.error("Error fetching archive:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch archive",
      error: error.message,
    });
  } 
};

export const downloadArchive = async (req, res) => {
  try {
    const { filepath, filename, contentType } =
      await auditLogArchiveService.downloadArchive(req.params.id);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.download(filepath, filename);
  } catch (error) {
    console.error("Error downloading archive:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download archive",
      error: error.message,
    });
  }
};

export const deleteArchive = async (req, res) => {
  try {
    const result = await auditLogArchiveService.deleteArchive(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error deleting archive:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete archive",
      error: error.message,
    });
  }
};

export const restoreArchive = async (req, res) => {
  try {
    const result = await auditLogArchiveService.restoreArchive(req.params.id);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error restoring archive:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore archive",
      error: error.message,
    });
  }
};

export const triggerManualArchive = async (req, res) => {
  try {
    // Check if archive is needed
    const check = await auditLogArchiveService.checkArchiveStatus();

    if (!check.needed) {
      return res.json({
        success: true,
        message: check.message,
        ...check,
      });
    }

    // Run manual archive
    const result = await auditLogArchiveService.archiveOldLogs(false);

    res.json({
      success: true,
      message: "Manual archive completed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error triggering manual archive:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger archive",
      error: error.message,
    });
  }
};

export const checkArchiveStatus = async (req, res) => {
  try {
    const check = await auditLogArchiveService.checkArchiveStatus();

    res.json({
      success: true,
      ...check,
    });
  } catch (error) {
    console.error("Error checking archive status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check archive status",
      error: error.message,
    });
  }
};
