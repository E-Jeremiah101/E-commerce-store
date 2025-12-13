import Order from "../models/order.model.js";
import { flw } from "../lib/flutterwave.js";
import { sendEmail } from "../lib/mailer.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";

const logRefundAction = async (
  req,
  action,
  orderId,
  refundId = null,
  changes = {},
  additionalInfo = ""
) => {
  try {
    // Only log if user is an admin
    if (!req.user || req.user.role !== "admin") {
      return;
    }

    const order = await Order.findById(orderId).populate(
      "user",
      "firstname lastname email"
    );
    if (!order) return;

    const refund = refundId ? order.refunds.id(refundId) : null;
    const refundInfo = refund
      ? {
          refundId: refund._id,
          amount: refund.amount,
          product: refund.productSnapshot?.name || "Unknown Product",
          status: refund.status,
        }
      : null;

    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action,
      entityType: ENTITY_TYPES.ORDER,
      entityId: order._id,
      entityName: `Order #${order.orderNumber}`,
      changes: {
        ...changes,
        refund: refundInfo,
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo,
    });
  } catch (error) {
    console.error("Failed to log refund action:", error);
  }
};

// Request refund
export const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(orderId)
      .populate("products.product")
      .populate("user", "firstname lastname email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Authorization check
    if (!order.user._id.equals(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const allowedStatuses = ["Delivered", "Partially Refunded"];
    if (!allowedStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Refunds can only be requested for Delivered orders`,
      });
    }

    const deliveredTime = new Date(order.deliveredAt || order.updatedAt);
    const currentTime = new Date();
    const hoursSinceDelivery = (currentTime - deliveredTime) / (1000 * 60 * 60);

    if (hoursSinceDelivery > 48) {
      return res.status(400).json({
        success: false,
        message: "Returns must be requested within 48 hours of delivery.",
      });
    }

    let refundProduct = null;
    let productSnapshot = null;

    if (productId.startsWith("deleted-")) {
      // Handle already deleted products
      order.products.forEach((p) => {
        const generatedId = `deleted-${orderId}-${p.name.replace(
          /\s+/g,
          "_"
        )}-${p.price}`;
        if (generatedId === productId) {
          refundProduct = p;
          productSnapshot = {
            name: p.name,
            image: p.image,
            price: p.price,
            quantity: p.quantity,
          };
        }
      });
    } else {
      // Handle existing products with snapshot
      order.products.forEach((p) => {
        if (p.product?._id?.toString() === productId) {
          refundProduct = p;
          productSnapshot = {
            name: p.product?.name || p.name,
            image: p.product?.images?.[0] || p.image,
            price: p.price,
            quantity: p.quantity,
          };
        }
      });
    }

    if (!refundProduct) {
      return res.status(404).json({ message: "Product not found in order" });
    }

    const refundQuantity = Math.min(
      quantity || refundProduct.quantity,
      refundProduct.quantity
    );
    const refundAmount = refundProduct.price * refundQuantity;

    if (refundAmount < 100) {
      return res.status(400).json({
        message: "Refund amount must be at least ₦100",
      });
    }

    
    // Check for ANY existing refund for this product (all statuses)
    const hasExistingRefund = order.refunds.some((refund) => {
      const refundProductId =
        refund.product?.toString() ||
        refund.product?._id?.toString() ||
        refund.productSnapshot?._id;

      const currentProductId =
        refundProduct.product?._id?.toString() ||
        refundProduct.product?.toString();

      return refundProductId === currentProductId;
    });

    if (hasExistingRefund) {
      // Find the existing refund to get its status
      const existingRefund = order.refunds.find((refund) => {
        const refundProductId =
          refund.product?.toString() ||
          refund.product?._id?.toString() ||
          refund.productSnapshot?._id;

        const currentProductId =
          refundProduct.product?._id?.toString() ||
          refundProduct.product?.toString();

        return refundProductId === currentProductId;
      });

      return res.status(400).json({
        message: `Cannot submit another refund request for this product. A refund is already ${existingRefund.status.toLowerCase()}.`,
        existingStatus: existingRefund.status,
      });
    }

    // Create refund entry
    const refundData = {
      product: refundProduct.product?._id || refundProduct.product,
      quantity: refundQuantity,
      amount: refundAmount,
      reason: reason,
      status: "Pending",
      requestedAt: new Date(),
      productSnapshot: productSnapshot,
    };

    order.refunds.push(refundData);

    // Update order refund status
    const pendingRefunds = order.refunds.filter((r) => r.status === "Pending");
    if (pendingRefunds.length === order.products.length) {
      order.refundStatus = "Full Refund Requested";
    } else if (pendingRefunds.length > 0) {
      order.refundStatus = "Partial Refund Requested";
    }

    await order.save();

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
    });

    (async () => {
      const newRefund = order.refunds[order.refunds.length - 1];
      try {
        const emailContent = `
        <h2>Refund Request Received</h2>
        <p>Hi ${order.user?.firstname || "Customer"},</p>
        <p>We've received your refund request for the following item:</p>
        <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0; border-radius: 8px;">
          <img src="${productSnapshot.image}" alt="${
          productSnapshot.name
        }" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>
          <p><strong>Product:</strong> ${productSnapshot.name}</p>
          <p><strong>Quantity:</strong> ${refundQuantity}</p>
          <p><strong>Refund Amount:</strong> ₦${refundAmount.toLocaleString()}</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Refund Reference ID:</strong></p>
          <p style="font-size: 15px; font-weight: bold; color: #2c5aa0; background: white; padding: 10px; border-radius: 5px;">
            ${newRefund._id}
          </p>
          <p><strong>Keep this ID for your records</strong></p>
        </div>
        <p>Our team will review your request and an agent will visit to inspect the item.</p>
        <p><strong>Important:</strong> Please make sure the item is in its original condition and packaging.</p>
        <p>This process usually takes up to <b>7 working days</b>.</p>
        <p>We'll notify you once your request is approved or rejected.</p>
        <br />
        <p>Thank you for shopping with us!</p>
      `;

        await sendEmail({
          to: order.user.email,
          subject: "Refund Request Received",
          html: emailContent,
        });
      } catch (emailErr) {
        console.error("Background refund request email failed:", emailErr);
      }
    })();
  } catch (error) {
    console.error("Refund request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all refund requests for admin
export const getAllRefundRequests = async (req, res) => {
  try {

     console.log(
       `📝 [AUDIT] Admin ${req.user.email} viewing all refund requests`
     );

    const ordersWithRefunds = await Order.find({
      "refunds.0": { $exists: true }
    })
    .populate("user", "firstname lastname email")
    .populate("products.product", "name image price")
    .sort({ createdAt: -1 });

    const allRefunds = [];
    
    ordersWithRefunds.forEach(order => {
      order.refunds.forEach(refund => {
        const product = order.products.find(p => 
          p.product?._id?.toString() === refund.product?.toString()
        );

        allRefunds.push({
          refundId: refund._id.toString(),
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          user: {
            firstname: order.user?.firstname,
            lastname: order.user?.lastname,
            email: order.user?.email
          },
          productName: refund.productSnapshot?.name || product?.name || "Deleted Product",
          productImage: refund.productSnapshot?.image || product?.image || "/images/deleted.png",
          productPrice: refund.productSnapshot?.price || product?.price || refund.amount / refund.quantity,
          amount: refund.amount,
          reason: refund.reason,
          quantity: refund.quantity,
          status: refund.status,
          requestedAt: refund.requestedAt,
          processedAt: refund.processedAt
        });
      });
    });

    allRefunds.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    if (req.user && req.user.role === "admin") {
      await AuditLogger.log({
        adminId: req.user._id,
        adminName: `${req.user.firstname} ${req.user.lastname}`,
        action: "VIEW_REFUND_REQUESTS",
        entityType: ENTITY_TYPES.SYSTEM,
        entityId: null,
        entityName: "Refund Management",
        changes: {
          viewed: {
            totalRefunds: allRefunds.length,
            pendingRefunds: allRefunds.filter((r) => r.status === "Pending")
              .length,
            approvedRefunds: allRefunds.filter((r) => r.status === "Approved")
              .length,
          },
        },
        ...AuditLogger.getRequestInfo(req),
        additionalInfo: "Admin viewed all refund requests",
      });
    }

    res.json(allRefunds);

  } catch (error) {
    console.error("Get refunds error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const approveRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    console.log(
      `📝 [AUDIT] Admin ${req.user.email} attempting to approve refund ${refundId}`
    );

    const order = await Order.findById(orderId).populate(
      "user",
      "firstname lastname email"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const refund = order.refunds.id(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    if (refund.status !== "Pending") {
      return res.status(400).json({
        message: `Refund is already ${refund.status}`, 
      });
    }

    // Store old status for audit log
    const oldRefundStatus = refund.status;
    const oldOrderStatus = order.status;
    const oldRefundAmount = refund.amount;

    // PROCESS THROUGH FLUTTERWAVE
    try {
      const refundData = {
        id: order.flutterwaveTransactionId,
        amount: refund.amount,
      };

      console.log("Processing Flutterwave refund:", refundData);

      const flutterwaveResponse = await flw.Transaction.refund(refundData);

      console.log("Flutterwave response:", flutterwaveResponse);

      if (flutterwaveResponse.status === "success") {
        refund.status = "Approved";
        refund.processedAt = new Date();

        if (flutterwaveResponse.data?.id) {
          refund.flutterwaveRefundId = flutterwaveResponse.data.id;
        }

        refund.flutterwaveResponse = flutterwaveResponse.data;
      } else {
        throw new Error(
          flutterwaveResponse.message || "Flutterwave refund failed"
        );
      }
    } catch (flutterwaveError) {
      console.error("Flutterwave refund error:", flutterwaveError);

      refund.status = "Rejected";
      refund.processedAt = new Date();
      refund.errorDetails = flutterwaveError.message;

      await order.save();
      await logRefundAction(
        req,
        "REFUND_APPROVAL_FAILED",
        orderId,
        refundId,
        {
          before: {
            refundStatus: oldRefundStatus,
            orderStatus: oldOrderStatus,
          },
          after: {
            refundStatus: "Rejected",
            error: flutterwaveError.message,
          },
          paymentGateway: "Flutterwave",
          error: flutterwaveError.message,
        },
        "Refund approval failed - Flutterwave error"
      );

      return res.status(400).json({
        message: "Flutterwave refund failed",
        error: flutterwaveError.message,
      });
    }

    // ✅ CRITICAL FIX: UPDATE THE MAIN ORDER STATUS
    order.totalRefunded = (order.totalRefunded || 0) + refund.amount;

    const approvedRefunds = order.refunds.filter(
      (r) => r.status === "Approved" || r.status === "Refunded"
    );

    if (approvedRefunds.length === order.products.length) {
      // All products refunded - mark as Refunded
      order.refundStatus = "Fully Refunded";
      order.status = "Refunded"; // ✅ UPDATE MAIN STATUS
    } else if (approvedRefunds.length > 0) {
      // Some products refunded
      order.refundStatus = "Partially Refunded";
      order.status = "Partially Refunded"; // ✅ UPDATE MAIN STATUS
    }

    await order.save();

    await logRefundAction(
      req,
      "REFUND_APPROVED",
      orderId,
      refundId,
      {
        before: {
          refundStatus: oldRefundStatus,
          orderStatus: oldOrderStatus,
        },
        after: {
          refundStatus: "Approved",
          orderStatus: order.status,
          refundAmount: refund.amount,
        },
        paymentGateway: "Flutterwave",
        transactionId: order.flutterwaveTransactionId,
        flutterwaveRefundId: refund.flutterwaveRefundId,
      },
      `Refund approved for ₦${refund.amount.toLocaleString()} via Flutterwave`
    );

    (async () => {
      try {
        const productSnapshot = refund.productSnapshot || {};
        const productName = productSnapshot.name || "Deleted Product";
        const productImage = productSnapshot.image || "/images/deleted.png";

        await sendEmail({
          to: order.user?.email,
          subject: `Refund Approved — ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #2c3e50;">Refund Approved</h2>
              <p>Dear ${order.user?.firstname || "Customer"},</p>
              <p>Your refund request has been <strong>approved</strong> for the following item:</p>
              <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0; border-radius: 8px;">
                <img src="${productImage}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>
                <p><strong>Product:</strong> ${productName}</p>
                <p><strong>Refund ID:</strong> ${refund._id}</p>
                <p><strong>Quantity:</strong> ${refund.quantity}</p>
                <p><strong>Refund Amount:</strong> ₦${refund.amount.toLocaleString()}</p>
              </div>
              <p>Our delivery agent has confirmed the item collection. Your refund will be processed to your original payment method within <strong>3–7 working days</strong>.</p>
              <p>Thank you for your patience and trust.</p>
              <p>Best regards,<br/><strong>Eco Store Support Team</strong></p>
            </div>
          `,
        });
        console.log("✅ Refund approval email sent successfully");
      } catch (emailErr) {
        console.error("Background refund approval email failed:", emailErr);
      }
    })();

    res.json({
      success: true,
      message: "Refund approved and processed successfully",
    });
  } catch (error) {
    console.error("Approve refund error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reject refund
export const rejectRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    const order = await Order.findById(orderId).populate(
      "user",
      "firstname lastname email"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const refund = order.refunds.id(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    // Store old status for audit log
    const oldRefundStatus = refund.status;
    const oldOrderStatus = order.status;

    refund.status = "Rejected";
    refund.processedAt = new Date();

    await order.save();
    const productSnapshot = refund.productSnapshot || {};
    const productName = productSnapshot.name || "Deleted Product";
    const productImage = productSnapshot.image || "/images/deleted.png";
    const productPrice = productSnapshot.price || 0;

    await logRefundAction(
      req,
      "REFUND_REJECTED",
      orderId,
      refundId,
      {
        before: {
          refundStatus: oldRefundStatus,
          orderStatus: oldOrderStatus,
        },
        after: {
          refundStatus: "Rejected",
        },
        refundDetails: {
          amount: refund.amount,
          product: productName,
          quantity: refund.quantity,
          reason: refund.reason,
        },
      },
      `Refund rejected for ₦${refund.amount.toLocaleString()}`
    );

    res.json({
      success: true,
      message: "Refund rejected successfully",
    });

    (async () => {
      try {
        await sendEmail({
          to: order.user?.email,
          subject: `Refund Denied — ${order.orderNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #e74c3c;">Refund Request Rejected</h2>
              <p>Dear ${order.user?.firstname || "Customer"},</p>
              <p>We regret to inform you that your refund request for the following item has been <strong>rejected</strong> after review:</p>
              <img src="${productImage}"  style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>
            <p><strong>Product:</strong> ${productName}</p>
            <p><strong>Refund ID:</strong> ${refund._id}</p>
            <p><strong>Quantity:</strong> ${refund.quantity}</p>
            <p><strong>Refund Amount:</strong> ₦${refund.amount.toLocaleString()}</p>
          </div>
              <p>Reason for rejection may include product not being in original condition or policy violation. If you believe this was a mistake, please contact our support team.</p>
              <p>Best regards,<br/><strong>Eco Store Support Team</strong></p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Background rejection email failed:", emailErr);
      }

      console.log(`✅ Refund ${refund._id} rejected successfully.`);
    })();
  } catch (error) {
    console.error("Reject refund error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
