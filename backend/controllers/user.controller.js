// import User from "../models/user.model.js";

// // GET profile
// export const getProfile = async (req, res) => {
//   const user = await User.findById(req.user._id).select("-password");
//   res.json(user);
// };

// // UPDATE profile (only phone & addresses)
// export const updateProfile = async (req, res) => {
//   const user = await User.findById(req.user._id);

//   if (!user) return res.status(404).json({ message: "User not found" });

//   if (req.body.phones) user.phones = req.body.phones;
//   if (req.body.addresses) user.addresses = req.body.addresses;

//   await user.save();
//   res.json({ message: "Profile updated", user });
// };

// // GET all users (for admin)
// export const getAllUsers = async (req, res) => {
//   try {
//      const { role, search } = req.query;
//      const query = {};

//      if (role) query.role = role;
//      if (search){
//        query.$or = [
//          { firstname: new RegExp(search, "i") },
//          { lastname: new RegExp(search, "i") },
//          { email: new RegExp(search, "i") },
//          //  { _id: new RegExp(search, "i") },
//        ];
//         // If search looks like a MongoDB ObjectId (24 hex characters), add it directly
//       if (/^[0-9a-fA-F]{24}$/.test(search)) {
//         query.$or.push({ _id: search });
//       }
//     }

//      const users = await User.find(query)
//        .populate("cartItems.product", "name price images")
//        .select("-password");
       

//      res.json(users);
//   } catch (err) {
//     console.error("Error fetching users:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// //  Promote user to admin
// export const makeAdmin = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);

//     if (!user) return res.status(404).json({ message: "User not found" });

//     user.role = "admin";
//     await user.save({ validateBeforeSave: false });

//     res.json({ success: true, message: `${user.firstname} is now an admin`, user });
//   } catch (err) {
//     console.error("Error promoting user:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const updateUserRole = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     user.role = user.role === "admin" ? "customer" : "admin"; // toggle role
//     await user.save();

//     res.json({ message: `User role updated to ${user.role}`, user });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error updating role", error: error.message });
//   }
// };

import User from "../models/user.model.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES } from "../constants/auditLog.constants.js";
import { ADMIN_ROLE_PERMISSIONS } from "../constants/adminRoles.js";
import { PERMISSIONS } from "../constants/permissions.js";

// GET profile - UPDATED
export const getProfile = async (req, res) => {
  try {
    // If req.user is already populated by protectRoute, return it directly
    if (req.user) {
      // Ensure permissions are included
      if (!req.user.permissions) {
        // Calculate permissions if not already set
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

    // Fallback: query database if req.user not set (shouldn't happen with protectRoute)
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

// UPDATE profile (only phone & addresses)
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

// GET all users (for admin) - UPDATED
// GET all users (for admin) - UPDATED with order counts
export const getAllUsers = async (req, res) => {
  try {
    console.log("🔍 getAllUsers called by:", req.user?.email);

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

      // If search looks like a MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(search.trim())) {
        query.$or.push({ _id: search.trim() });
      }
    }

    console.log("Query:", query);

    // First, get users with basic info
    const users = await User.find(query)
      .populate("cartItems.product", "name price images")
      .select("-password")
      .sort({ createdAt: -1 });

    console.log(`Found ${users.length} users`);

    // Import Order model to get order counts
    const Order = (await import("../models/order.model.js")).default;

    // Get order counts for each user
    const usersWithOrderCounts = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();
        
        // Get order statistics for this user
        const orderStats = await Order.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]);
        
        // Convert array to object for easier access
        const statsObj = {};
        orderStats.forEach(stat => {
          statsObj[stat._id] = stat.count;
        });
        
        // Calculate completed orders (assuming status "delivered" means completed)
        const completedOrders = statsObj["Delivered"] || 0;
        const totalOrders = orderStats.reduce((total, stat) => total + stat.count, 0);
        
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
            total: totalOrders,
            byStatus: statsObj
          }
        };
      })
    );

    res.json(usersWithOrderCounts);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
      details: err.stack,
    });
  }
};

// Update user role and adminType - UPDATED
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, adminType } = req.body;

    console.log("🔧 Updating user:", {
      userId: id,
      newRole: role,
      newAdminType: adminType,
      updatedBy: req.user?.email,
    });

    const user = await User.findById(id);
    if (!user) {
      console.log("❌ User not found:", id);
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

    console.log("✅ User updated:", {
      userId: user._id,
      email: user.email,
      oldRole: previousRole,
      newRole: user.role,
      oldAdminType: previousAdminType,
      newAdminType: user.adminType,
    });

    // Audit log
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
    console.error("❌ Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Get available admin types (for dropdown)
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