import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";


export const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (user.adminType === "super_admin") return next();

    const permissions = ADMIN_ROLE_PERMISSIONS[user.adminType] || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        message: "You do not have permission for this action",
      });
    }

    next();
  };
};