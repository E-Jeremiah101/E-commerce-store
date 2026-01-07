import Order from "../models/order.model.js";
import OrderArchive from "../models/orderArchive.model.js";
import cron from "node-cron";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import { SYSTEM_USER } from "../utils/systemUtils.js";
import mongoose from "mongoose";

export const archiveOldOrders = async ({
  olderThanMonths = 6,
  limit = 5000,
}) => {
  try {

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - olderThanMonths);

    const query = {
      status: { $in: ["Delivered", "Cancelled", "Refunded", "Fully Refunded"] },
      createdAt: { $lt: cutoffDate },
      isArchived: { $ne: true },
    };


    const orders = await Order.find(query).limit(limit);

    console.log(`Found ${orders.length} orders to archive`);

    if (!orders.length) {
      console.log("No orders found matching criteria");
      return { archived: 0 };
    }

    // Prepare archived documents
    const archivedDocs = orders.map((order) => ({
      ...order.toObject(),
      archivedAt: new Date(),
      archivedReason: "AUTO_MONTHLY_ARCHIVE",
      originalId: order._id,
    }));

    console.log("Inserting into archive collection...");

    // Use session for atomic operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Insert into archive collection
      await OrderArchive.insertMany(archivedDocs, { session });

      //  mark them as archived in the main collection
      const ids = orders.map((o) => o._id);
      await Order.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
            archivedReason: "AUTO_MONTHLY_ARCHIVE",
          },
        },
        { session }
      );

      await session.commitTransaction();

      return { archived: orders.length };
    } catch (transactionError) {
      await session.abortTransaction();
      console.error("Transaction failed:", transactionError.message);
      throw transactionError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Archive function error:", error.message);
    throw error;
  }
};
export const startOrderArchiveCron = () => {
  // 2AM on the 1st of every month
  cron.schedule("0 2 1 * *", async () => {
    try {
      console.log(
        "\n Monthly order archive started at",
        new Date().toISOString()
      );
      console.log("=".repeat(50));

      const result = await archiveOldOrders({
        olderThanMonths: 6,
      });

      if (result.archived > 0) {
        try {
          await AuditLogger.log({
            adminId: SYSTEM_USER.id, 
            adminName: SYSTEM_USER.name,
            action: "AUTO_ORDER_ARCHIVE",
            entityType: ENTITY_TYPES.ORDER,
            entityId: null,
            entityName: "Monthly Order Archive",
            changes: result,
            ipAddress: "127.0.0.1",
            userAgent: "node-cron/system",
            additionalInfo: `Automatically archived ${result.archived} orders older than 6 months`,
          });
          
        } catch (auditError) {
          console.warn(" Audit log not created:", auditError.message);
          
        }
      }
    } catch (error) {
      console.error("Monthly archive failed:", error.message);
    }
  });

  console.log("Monthly archive cron scheduled (2AM on 1st of every month)");
};
  
export const getArchivedOrders = async (req, res) => {
  try {
    const {
      search,
      sortBy = "archivedAt",
      sortOrder = "desc",
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50,
    } = req.query;

    
    const query = {};

    // Search functionality
    if (search && search.trim() !== "") {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);

      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { flutterwaveRef: { $regex: search, $options: "i" } },
        { flutterwaveTransactionId: { $regex: search, $options: "i" } },
        ...(isObjectId ? [{ _id: search }] : []),
        { "user.firstname": { $regex: search, $options: "i" } },
        { "user.lastname": { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
      ];

      if (isObjectId) {
        query.$or.push({ _id: search });
        query.$or.push({ originalId: search });
      }
    }

    // Filter by status
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Filter by archive date range
    const dateFilter = {};
    if (startDate && startDate.trim() !== "") {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
    }

    if (endDate && endDate.trim() !== "") {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }

    if (Object.keys(dateFilter).length > 0) {
      query.archivedAt = dateFilter;
    }


    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await OrderArchive.countDocuments(query);

    // Determine sort field and order
    let sortField = "archivedAt";
    if (sortBy === "date") sortField = "createdAt";
    if (sortBy === "totalAmount") sortField = "totalAmount";
    if (sortBy === "status") sortField = "status";

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const orders = await OrderArchive.find(query)
      .populate("user", "firstname lastname email")
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      count: orders.length,
      total, // Total matching documents
      orders: orders.map((order) => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        user: order.user,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        archivedAt: order.archivedAt,
        archivedReason: order.archivedReason,
        products:
          order.products?.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            price: p.price,
            image: p.image,
          })) || [],
        deliveryAddress: order.deliveryAddress,
        phone: order.phone,
        isArchived: true, 
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unarchiveOrders = async ({ daysAgo = 1, limit = 5000 }) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Find orders in archive
    const archivedOrders = await OrderArchive.find({
      archivedAt: { $gte: cutoffDate },
      archivedReason: "AUTO_ARCHIVE",
    }).limit(limit);

    console.log(` Found ${archivedOrders.length} orders to unarchive`);

    if (!archivedOrders.length) {
      console.log(" No orders found matching criteria");
      return { unarchived: 0 };
    }

    // Check which orders actually need to be unarchived
    const idsToCheck = archivedOrders.map((o) => o.originalId || o._id);

    
    const existingOrders = await Order.find({
      _id: { $in: idsToCheck },
    }).select("_id");

    const existingIds = existingOrders.map((o) => o._id.toString());


    const ordersToUpdate = archivedOrders.filter((o) =>
      existingIds.includes((o.originalId || o._id).toString())
    );

   
    const ordersToCreate = archivedOrders.filter(
      (o) => !existingIds.includes((o.originalId || o._id).toString())
    );

    console.log(
      ` ${ordersToUpdate.length} orders to update (remove archived flag)`
    );
    console.log(` ${ordersToCreate.length} orders to create (insert new)`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      //  Update existing orders: remove archived flag
      if (ordersToUpdate.length > 0) {
        const updateIds = ordersToUpdate.map((o) => o.originalId || o._id);
        await Order.updateMany(
          { _id: { $in: updateIds } },
          {
            $set: {
              isArchived: false,
              archivedAt: null,
              archivedReason: null,
            },
          },
          { session }
        );
        console.log(` Updated ${ordersToUpdate.length} existing orders`);
      }

      // Create orders that don't exist
      if (ordersToCreate.length > 0) {
        const ordersToInsert = ordersToCreate.map((order) => {
          const orderObj = order.toObject();
          delete orderObj.archivedAt;
          delete orderObj.archivedReason;
          delete orderObj.originalId;
          delete orderObj._id; // Remove _id to let MongoDB create new one
          return orderObj;
        });

        await Order.insertMany(ordersToInsert, { session });
        console.log(`✅ Created ${ordersToCreate.length} new orders`);
      }

      // 3. Delete from archive collection
      const allArchiveIds = archivedOrders.map((o) => o._id);
      await OrderArchive.deleteMany(
        { _id: { $in: allArchiveIds } },
        { session }
      );

      console.log(
        `  Deleted ${allArchiveIds.length} orders from archive collection`
      );

      await session.commitTransaction();
      console.log(`Successfully unarchived ${archivedOrders.length} orders`);

      return {
        unarchived: archivedOrders.length,
        updated: ordersToUpdate.length,
        created: ordersToCreate.length,
      };
    } catch (transactionError) {
      await session.abortTransaction();
      console.error("Transaction failed:", transactionError.message);
      throw transactionError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error(" Unarchive function error:", error.message);
    throw error;
  }
};
// More specific unarchive function by order IDs
export const unarchiveOrdersByIds = async (orderIds) => {
  try {
    console.log(" Unarchiving specific orders...");

    // Find orders in archive by IDs
    const archivedOrders = await OrderArchive.find({
      _id: { $in: orderIds },
    });

    console.log(`Found ${archivedOrders.length} orders to unarchive`);

    if (!archivedOrders.length) {
      return { unarchived: 0, message: "No orders found with given IDs" };
    }

    // Prepare for restoration
    const ordersToRestore = archivedOrders.map((order) => {
      const orderObj = order.toObject();

      // Remove archive-specific fields
      delete orderObj.archivedAt;
      delete orderObj.archivedReason;
      delete orderObj.originalId;

      return orderObj;
    });

    // Insert back into main collection
    await Order.insertMany(ordersToRestore);

    // Delete from archive
    await OrderArchive.deleteMany({ _id: { $in: orderIds } });

    console.log(`Successfully unarchived ${archivedOrders.length} orders`);

    return {
      unarchived: archivedOrders.length,
      orderNumbers: archivedOrders.map((o) => o.orderNumber),
    };
  } catch (error) {
    console.error("Unarchive by IDs error:", error.message);
    throw error;
  }
};

export const recoverSingleOrder = async (archiveId) => {
  try {

    const archivedOrder = await OrderArchive.findById(archiveId);

    if (!archivedOrder) {
      throw new Error("Order not found in archive");
    }

    // Check if order already exists in main collection
    const existingOrder = await Order.findById(
      archivedOrder.originalId || archivedOrder._id
    );

    if (existingOrder) {
      // Order exists, just remove the archived flag
      await Order.findByIdAndUpdate(existingOrder._id, {
        $set: {
          isArchived: false,
          archivedAt: null,
          archivedReason: null,
        },
      });
      console.log(
        `Removed archived flag from existing order: ${archivedOrder.orderNumber}`
      );
    } else {
    
      const orderToRestore = archivedOrder.toObject();
      delete orderToRestore.archivedAt;
      delete orderToRestore.archivedReason;
      delete orderToRestore.originalId;
      delete orderToRestore._id;

      const restoredOrder = new Order(orderToRestore);
      await restoredOrder.save();
      console.log(` Created new order: ${archivedOrder.orderNumber}`);
    }

    // Delete from archive collection
    await OrderArchive.findByIdAndDelete(archiveId);
    console.log(`  Deleted from archive: ${archivedOrder.orderNumber}`);

    return {
      success: true,
      orderNumber: archivedOrder.orderNumber,
      message: "Order restored successfully",
    };
  } catch (error) {
    console.error(" Recover order error:", error.message);
    throw error;
  }
};