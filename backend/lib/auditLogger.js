import AuditLog from "../models/auditLog.model.js";
import { ENTITY_TYPES } from "../constants/auditLog.constants.js";
import { SYSTEM_USER, isSystemId } from "../utils/systemUtils.js";


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
    additionalInfo,
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
        additionalInfo: additionalInfo || "",
      });

      console.log(`📝 Audit logged: ${action} by ${adminName}`);
      return logEntry;
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  static getRequestInfo(req) {
    return {
      ipAddress:
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || "",
    };
  }

  static async logCouponCreation(adminId, adminName, coupon, req) {
    return await this.log({
      adminId,
      adminName,
      action: "CREATE_COUPON",
      entityType: ENTITY_TYPES.COUPON,
      entityId: coupon._id,
      entityName: `Coupon: ${coupon.code}`,
      changes: {
        discountPercentage: coupon.discountPercentage,
        expirationDate: coupon.expirationDate,
        couponReason: coupon.couponReason,
        userId: coupon.userId,
        isActive: coupon.isActive,
      },
      ...this.getRequestInfo(req),
      additionalInfo: `Created coupon ${coupon.code} with ${coupon.discountPercentage}% discount`,
    });
  }

  static async logCouponDeletion(adminId, adminName, coupon, forceDelete, req) {
    return await this.log({
      adminId,
      adminName,
      action: "DELETE_COUPON",
      entityType: ENTITY_TYPES.COUPON,
      entityId: coupon._id,
      entityName: `Coupon: ${coupon.code}`,
      changes: {
        forceDelete,
        usedAt: coupon.usedAt,
        wasActive: coupon.isActive,
        discountPercentage: coupon.discountPercentage,
      },
      ...this.getRequestInfo(req),
      additionalInfo: `Deleted coupon ${coupon.code}${
        forceDelete ? " (forced)" : ""
      }`,
    });
  }

  static async logCouponUpdate(adminId, adminName, coupon, updates, req) {
    return await this.log({
      adminId,
      adminName,
      action: "UPDATE_COUPON",
      entityType: ENTITY_TYPES.COUPON,
      entityId: coupon._id,
      entityName: `Coupon: ${coupon.code}`,
      changes: updates,
      ...this.getRequestInfo(req),
      additionalInfo: `Updated coupon ${coupon.code}`,
    });
  }

  static async logCouponToggle(adminId, adminName, coupon, newStatus, req) {
    return await this.log({
      adminId,
      adminName,
      action: "TOGGLE_COUPON",
      entityType: ENTITY_TYPES.COUPON,
      entityId: coupon._id,
      entityName: `Coupon: ${coupon.code}`,
      changes: {
        oldStatus: !newStatus,
        newStatus: newStatus,
      },
      ...this.getRequestInfo(req),
      additionalInfo: `${newStatus ? "Activated" : "Deactivated"} coupon ${
        coupon.code
      }`,
    });
  }
}

export default AuditLogger;
