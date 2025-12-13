// middleware/adminVerify.js
export const requireAdminVerification = (req, res, next) => {
  // Your existing admin check first
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied - Admin only",
    });
  }

  // NEW: Check if admin session is verified
  // Keep using your JWT, just add one more field
  try {
    const decoded = jwt.decode(req.cookies.accessToken);

    if (!decoded.adminVerified) {
      // Return special status code to trigger verification
      return res.status(428).json({
        message: "Admin verification required",
        requiresVerification: true,
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
