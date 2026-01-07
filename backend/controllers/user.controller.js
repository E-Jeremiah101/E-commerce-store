import User from "../models/user.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES } from "../constants/auditLog.constants.js";
import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const getProfile = async (req, res) => {
  try {

    if (req.user) {
      // include permissions 
      if (!req.user.permissions) {

        let permissions = [];
        if (req.user.role === "admin" && req.user.adminType) {
          permissions =
            req.user.adminType === "super_admin"
              ? Object.values(PERMISSIONS)
              : ADMIN_ROLE_PERMISSIONS[req.user.adminType] || [];
        }
        req.user.permissions = permissions;
      }
      return res.json(req.user);
    }

  
    const user = await User.findById(req.userId || req.user?._id)
      .select("-password")
      .populate("cartItems.product", "name price images");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate permissions
    let permissions = [];
    if (user.role === "admin" && user.adminType) {
      permissions =
        user.adminType === "super_admin"
          ? Object.values(PERMISSIONS)
          : ADMIN_ROLE_PERMISSIONS[user.adminType] || [];
    }

    const userWithPermissions = {
      ...user.toObject(),
      permissions,
    };

    res.json(userWithPermissions);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.phones) user.phones = req.body.phones;
    if (req.body.addresses) user.addresses = req.body.addresses;

    await user.save();

    // Re-fetch with cart populated
    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("cartItems.product", "name price images");

    res.json({
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getAllUsers = async (req, res) => {
  try {

    const { role, search } = req.query;
    const query = {};

    if (role && role !== "all") query.role = role;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstname: searchRegex },
        { lastname: searchRegex },
        { email: searchRegex },
      ];

      if (/^[0-9a-fA-F]{24}$/.test(search.trim())) {
        query.$or.push({ _id: search.trim() });
      }
    }

    // Get users with basic info
    const users = await User.find(query)
      .populate("cartItems.product", "name price images")
      .select("-password")
      .sort({ createdAt: -1 });

    // Import models
    const Order = (await import("../models/order.model.js")).default;
    const Coupon = (await import("../models/coupon.model.js")).default;

    // Get order counts and coupon data for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        // Get order statistics
        const orderStats = await Order.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]);
        
        // Convert array to object
        const statsObj = {};
        orderStats.forEach(stat => {
          statsObj[stat._id] = stat.count;
        });
        
        // Calculate completed orders
        const completedOrders = statsObj["Delivered"] || 0;
        const CancelledOrders = statsObj["Cancelled"] || 0;
        const totalOrders = orderStats.reduce((total, stat) => total + stat.count, 0);
        
        // Get coupon data for this user
        const coupons = await Coupon.find({ userId: user._id });
        
        // Calculate coupon statistics
        const activeCoupons = coupons.filter(c => c.isActive && new Date(c.expirationDate) > new Date()).length;
        const usedCoupons = coupons.filter(c => c.usedAt).length;
        const totalCoupons = coupons.length;
        
        // Add permissions for admin users
        let permissions = [];
        if (userObj.role === "admin" && userObj.adminType) {
          permissions =
            userObj.adminType === "super_admin"
              ? Object.values(PERMISSIONS)
              : ADMIN_ROLE_PERMISSIONS[userObj.adminType] || [];
        }

        return {
          ...userObj,
          permissions,
          orderStats: {
            completed: completedOrders,
            cancelled:CancelledOrders,
            total: totalOrders,
            byStatus: statsObj
          },
          couponStats: {
            active: activeCoupons,
            used: usedCoupons,
            total: totalCoupons,
            coupons: coupons.slice(0, 5) 
          }
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
      details: err.stack,
    });
  }
};


export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, adminType } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousRole = user.role;
    const previousAdminType = user.adminType;

    // Update role
    user.role = role || previousRole;

    // Update adminType based on role
    if (role === "admin" && adminType) {
      user.adminType = adminType;
    } else if (role === "customer") {
      user.adminType = undefined;
    }

    await user.save();

  
    if (req.user && req.user.role === "admin") {
      await AuditLogger.log({
        adminId: req.user._id,
        adminName: `${req.user.firstname} ${req.user.lastname}`,
        action: "UPDATE_USER_ROLE",
        entityType: ENTITY_TYPES.USER,
        entityId: user._id,
        entityName: `${user.firstname} ${user.lastname}`,
        changes: {
          previousRole,
          newRole: user.role,
          previousAdminType,
          newAdminType: user.adminType,
        },
        ipAddress: req.ip || req.headers["x-forwarded-for"],
        userAgent: req.headers["user-agent"] || "",
        additionalInfo: `User role updated by ${req.user.email}`,
      });
    }

    // Calculate permissions for the response
    let permissions = [];
    if (user.role === "admin" && user.adminType) {
      permissions =
        user.adminType === "super_admin"
          ? Object.values(PERMISSIONS)
          : ADMIN_ROLE_PERMISSIONS[user.adminType] || [];
    }

    res.json({
      success: true,
      message: `User role updated successfully`,
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        adminType: user.adminType,
        permissions,
      },
    });
  } catch (error) {
    console.error(" Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

export const getAdminTypes = (req, res) => {
  const adminTypes = [
    { value: "product_manager", label: "Product Manager" },
    { value: "order_manager", label: "Order Manager" },
    { value: "customer_support", label: "Customer Support" },
    { value: "supervisor", label: "Supervisor" },
    { value: "super_admin", label: "Super Admin" },
  ];

  res.json(adminTypes);
};