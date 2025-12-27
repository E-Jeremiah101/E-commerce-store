export const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // ✅ super_admin already has all permissions
    if (user.permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission for this action",
    });
  };
};
