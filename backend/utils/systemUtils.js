import mongoose from "mongoose";

export const SYSTEM_USER = {
  id: new mongoose.Types.ObjectId("000000000000000000000000"),
  name: "System",
  email: "system@auto.archive",
};


export const isSystemId = (id) => {
  const idStr = id?.toString();
  return idStr === "000000000000000000000000" || idStr === "system";
};

export const getSystemAuditInfo = () => ({
  adminId: SYSTEM_USER.id,
  adminName: SYSTEM_USER.name,
  ipAddress: "127.0.0.1",
  userAgent: "system/cron-job",
});
