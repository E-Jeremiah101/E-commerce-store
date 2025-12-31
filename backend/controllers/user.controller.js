// import Order from "../models/order.model.js";
// import OrderArchive from "../models/orderArchive.model.js";
// import cron from "node-cron";
// import AuditLogger from "../lib/auditLogger.js";
// import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
// import mongoose from "mongoose";




// // export const archiveOldOrders = async ({
// //   olderThanMonths = 6,
// //   limit = 5000,
// // }) => {
// //   const cutoffDate = new Date();
// //   cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

// //   const orders = await Order.find({
// //     status: { $in: ["Delivered", "Cancelled", "Refunded", "Fully Refunded"] },
// //     createdAt: { $lt: cutoffDate },
// //   }).limit(limit);

// //   if (!orders.length) return { archived: 0 };

// //   const archivedDocs = orders.map((order) => ({
// //     ...order.toObject(),
// //     archivedAt: new Date(),
// //     archivedReason: "AUTO_MONTHLY_ARCHIVE",
// //   }));

// //   await OrderArchive.insertMany(archivedDocs);

// //   const ids = orders.map((o) => o._id);
// //   await Order.deleteMany({ _id: { $in: ids } });

// //   return { archived: orders.length };
// // };


// //Because my orders are new, im testing for days
// export const archiveOldOrders = async ({ olderThanDays = 1, limit = 5000 }) => {
//   try {
//     console.log("🔄 Starting archive process...");

//     const cutoffDate = new Date();
//     cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

//     console.log("📅 Cutoff date:", cutoffDate.toISOString());
//     console.log("📊 Looking for orders older than:", olderThanDays, "days");

//     // Query with better logging
//     const query = {
//       status: { $in: ["Delivered", "Cancelled", "Refunded", "Fully Refunded"] },
//       createdAt: { $lt: cutoffDate },
//     };

//     console.log("🔍 Query criteria:", JSON.stringify(query, null, 2));

//     const orders = await Order.find(query).limit(limit);

//     console.log(`✅ Found ${orders.length} orders to archive`);

//     if (!orders.length) {
//       console.log("📭 No orders found matching criteria");
//       return { archived: 0 };
//     }

//     // Log sample order details for debugging
//     console.log("Sample order to archive:");
//     console.log("- Status:", orders[0].status);
//     console.log("- Created:", orders[0].createdAt);
//     console.log("- ID:", orders[0]._id);

//     // Prepare archived documents
//     const archivedDocs = orders.map((order) => ({
//       ...order.toObject(),
//       archivedAt: new Date(),
//       archivedReason: "AUTO_ARCHIVE",
//       originalId: order._id, // Keep reference to original ID
//     }));

//     console.log("📝 Inserting into archive collection...");

//     // Use session for atomic operation
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//       // Insert into archive
//       await OrderArchive.insertMany(archivedDocs, { session });

//       // Delete from main collection
//       const ids = orders.map((o) => o._id);
//       await Order.deleteMany({ _id: { $in: ids } }, { session });

//       await session.commitTransaction();
//       console.log(`✅ Successfully archived ${orders.length} orders`);

//       return { archived: orders.length };
//     } catch (transactionError) {
//       await session.abortTransaction();
//       console.error("❌ Transaction failed:", transactionError);
//       throw transactionError;
//     } finally {
//       session.endSession();
//     }
//   } catch (error) {
//     console.error("❌ Archive function error:", error);
//     throw error;
//   }
// };


// // export const startOrderArchiveCron = () => {
// //   // ⏰ 2AM on the 1st of every month
// //   cron.schedule("0 2 1 * *", async () => {
// //     try {
// //       console.log("🗄️ Monthly order archive started");

// //       const result = await archiveOldOrders({
// //         olderThanMonths: 6,
// //       });

// //       await AuditLogger.log({
// //         adminId: null,
// //         adminName: "System",
// //         action: "AUTO_ORDER_ARCHIVE",
// //         entityType: ENTITY_TYPES.ORDER,
// //         entityId: null,
// //         entityName: "Monthly Order Archive",
// //         changes: result,
// //         additionalInfo: "Automatic monthly archive",
// //       });

// //       console.log(`✅ Archived ${result.archived} orders`);
// //     } catch (error) {
// //       console.error("❌ Archive cron failed:", error.message);
// //     }
// //   });
// // };

// export const startOrderArchiveCron = () => {
//   // For testing: Run every 5 minutes
//   cron.schedule("*/5 * * * *", async () => {
//     try {
//       console.log(
//         "🔄 Testing archive cron job started at",
//         new Date().toISOString()
//       );

//       // Use days for testing instead of months
//       const result = await archiveOldOrders({
//         olderThanDays: 1, // Archive orders older than 1 day
//       });

//       console.log(`✅ Archive cron completed. Archived: ${result.archived}`);

//       if (result.archived > 0) {
//         await AuditLogger.log({
//           adminId: "system",
//           adminName: "System",
//           action: "AUTO_ORDER_ARCHIVE",
//           entityType: ENTITY_TYPES.ORDER,
//           entityId: null,
//           entityName: "Test Archive",
//           changes: result,
//           additionalInfo: "Automatic test archive",
//         });
//       }
//     } catch (error) {
//       console.error("❌ Archive cron failed:", error.message);
//     }
//   });

//   console.log("📅 Archive cron job scheduled (every 5 minutes for testing)");
// };

// export const getArchivedOrders = async (req, res) => {
//   try {
//     const orders = await OrderArchive.find()
//       .populate("user", "firstname lastname email")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.json({
//       success: true,
//       count: orders.length,
//       orders,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // Add to your orderArchive.service.js
// export const testArchiveFunction = async (req, res) => {
//   try {
//     console.log("🔍 Testing archive function...");
    
//     // Test 1: Check if we can find orders to archive
//     const cutoffDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
//     console.log("Cutoff Date:", cutoffDate);
    
//     const testOrders = await Order.find({
//       status: { $in: ["Delivered", "Cancelled", "Refunded", "Fully Refunded"] },
//       createdAt: { $lt: cutoffDate },
//     }).limit(5);
    
//     console.log("Found test orders:", testOrders.length);
    
//     if (testOrders.length > 0) {
//       console.log("Sample order status:", testOrders[0].status);
//       console.log("Sample order createdAt:", testOrders[0].createdAt);
//       console.log("Is createdAt < cutoffDate?", testOrders[0].createdAt < cutoffDate);
//     }
    
//     // Test 2: Run actual archive function
//     const result = await archiveOldOrders({
//       olderThanDays: 1,
//       limit: 10
//     });
    
//     res.json({
//       success: true,
//       message: `Archived ${result.archived} orders`,
//       testData: {
//         cutoffDate,
//         testOrdersCount: testOrders.length,
//         archivedCount: result.archived
//       }
//     });
    
//   } catch (error) {
//     console.error("Test error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };


// //archive
// export const unarchiveOrders = async ({
//   daysAgo = 1, // Unarchive orders archived in the last X days
//   limit = 5000,
// }) => {
//   try {
//     console.log("🔄 Starting unarchive process...");

//     const cutoffDate = new Date();
//     cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

//     console.log(
//       "📅 Looking for orders archived after:",
//       cutoffDate.toISOString()
//     );

//     // Find orders in archive
//     const archivedOrders = await OrderArchive.find({
//       archivedAt: { $gte: cutoffDate },
//       archivedReason: "AUTO_ARCHIVE", // Only unarchive auto-archived orders
//     }).limit(limit);

//     console.log(`✅ Found ${archivedOrders.length} orders to unarchive`);

//     if (!archivedOrders.length) {
//       console.log("📭 No orders found matching criteria");
//       return { unarchived: 0 };
//     }

//     // Log sample order details
//     console.log("Sample order to unarchive:");
//     console.log("- Order Number:", archivedOrders[0].orderNumber);
//     console.log("- Archived At:", archivedOrders[0].archivedAt);
//     console.log("- Status:", archivedOrders[0].status);

//     // Prepare documents for main collection
//     // Remove archive-specific fields
//     const ordersToRestore = archivedOrders.map((order) => {
//       const orderObj = order.toObject();

//       // Remove archive-specific fields
//       delete orderObj.archivedAt;
//       delete orderObj.archivedReason;
//       delete orderObj.originalId;

//       // Ensure _id is preserved if needed, or let MongoDB create new one
//       // If you want to keep the same _id, make sure it doesn't conflict

//       return orderObj;
//     });

//     console.log("📝 Inserting back into main collection...");

//     // Insert back into main collection
//     await Order.insertMany(ordersToRestore);

//     // Delete from archive collection
//     const ids = archivedOrders.map((o) => o._id);
//     console.log(`🗑️  Deleting ${ids.length} orders from archive collection...`);
//     await OrderArchive.deleteMany({ _id: { $in: ids } });

//     console.log(`✅ Successfully unarchived ${archivedOrders.length} orders`);

//     return { unarchived: archivedOrders.length };
//   } catch (error) {
//     console.error("❌ Unarchive function error:", error.message);
//     throw error;
//   }
// };

// // More specific unarchive function by order IDs
// export const unarchiveOrdersByIds = async (orderIds) => {
//   try {
//     console.log("🔄 Unarchiving specific orders...");

//     // Find orders in archive by IDs
//     const archivedOrders = await OrderArchive.find({
//       _id: { $in: orderIds },
//     });

//     console.log(`✅ Found ${archivedOrders.length} orders to unarchive`);

//     if (!archivedOrders.length) {
//       return { unarchived: 0, message: "No orders found with given IDs" };
//     }

//     // Prepare for restoration
//     const ordersToRestore = archivedOrders.map((order) => {
//       const orderObj = order.toObject();

//       // Remove archive-specific fields
//       delete orderObj.archivedAt;
//       delete orderObj.archivedReason;
//       delete orderObj.originalId;

//       return orderObj;
//     });

//     // Insert back into main collection
//     await Order.insertMany(ordersToRestore);

//     // Delete from archive
//     await OrderArchive.deleteMany({ _id: { $in: orderIds } });

//     console.log(`✅ Successfully unarchived ${archivedOrders.length} orders`);

//     return {
//       unarchived: archivedOrders.length,
//       orderNumbers: archivedOrders.map((o) => o.orderNumber),
//     };
//   } catch (error) {
//     console.error("❌ Unarchive by IDs error:", error.message);
//     throw error;
//   }
// };

// export const recoverSingleOrder = async (archiveId) => {
//   try {
//     console.log(`🔄 Recovering order from archive ID: ${archiveId}`);

//     // Find the archived order
//     const archivedOrder = await OrderArchive.findById(archiveId);

//     if (!archivedOrder) {
//       throw new Error("Order not found in archive");
//     }

//     // Check if order already exists in main collection
//     const existingOrder = await Order.findOne({
//       orderNumber: archivedOrder.orderNumber,
//     });

//     if (existingOrder) {
//       throw new Error(
//         `Order ${archivedOrder.orderNumber} already exists in main collection`
//       );
//     }

//     // Prepare order for restoration
//     const orderToRestore = archivedOrder.toObject();

//     // Remove archive-specific fields
//     delete orderToRestore.archivedAt;
//     delete orderToRestore.archivedReason;
//     delete orderToRestore.originalId;

//     // Create in main collection
//     const restoredOrder = new Order(orderToRestore);
//     await restoredOrder.save();

//     // Delete from archive
//     await OrderArchive.findByIdAndDelete(archiveId);

//     console.log(
//       `✅ Successfully recovered order: ${archivedOrder.orderNumber}`
//     );

//     return {
//       success: true,
//       orderId: restoredOrder._id,
//       orderNumber: restoredOrder.orderNumber,
//       message: "Order recovered successfully",
//     };
//   } catch (error) {
//     console.error("❌ Recover order error:", error.message);
//     throw error;
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
            coupons: coupons.slice(0, 5) // Include recent 5 coupons for details
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