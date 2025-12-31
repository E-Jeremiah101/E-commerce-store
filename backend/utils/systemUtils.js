import mongoose from "mongoose";

// Create a valid ObjectId for system
export const SYSTEM_USER = {
  id: new mongoose.Types.ObjectId("000000000000000000000000"), // Valid ObjectId
  name: "System",
  email: "system@auto.archive",
};

// Check if ID is system ID
export const isSystemId = (id) => {
  const idStr = id?.toString();
  return idStr === "000000000000000000000000" || idStr === "system";
};

// Get system user info for audit logs
export const getSystemAuditInfo = () => ({
  adminId: SYSTEM_USER.id,
  adminName: SYSTEM_USER.name,
  ipAddress: "127.0.0.1",
  userAgent: "system/cron-job",
});
