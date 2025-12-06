import AuditLog from "../models/auditLog.model.js";
import { ENTITY_TYPES } from "../constants/auditLog.constants.js";

class AuditLogger {
  static async log({
    adminId,
    adminName,
    action,
    entityType,
    entityId,
    entityName,
    changes,
    ipAddress,
    userAgent,
    additionalInfo
  }) {
    try {
      // Validate entityType is one of our constants
      const validEntityType = Object.values(ENTITY_TYPES).includes(entityType) 
        ? entityType 
        : ENTITY_TYPES.OTHER;

      const logEntry = await AuditLog.create({
        adminId,
        adminName,
        action,
        entityType: validEntityType,
        entityId,
        entityName: entityName || "N/A",
        changes: changes || {},
        ipAddress: ipAddress || "",
        userAgent: userAgent || "",
        additionalInfo: additionalInfo || ""
      });

      console.log(`📝 Audit logged: ${action} by ${adminName}`);
      return logEntry;
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  static getRequestInfo(req) {
    return {
      ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || ""
    };
  }
}



export default AuditLogger;
