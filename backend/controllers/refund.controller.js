import Order from "../models/order.model.js";
import { flw } from "../lib/flutterwave.js";
import { sendEmail } from "../lib/mailer.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import storeSettings from "../models/storeSettings.model.js"

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
    const settings = await storeSettings.findOne();
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: settings.currency,
    });

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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Request Received</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f8fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 700px;
            margin: auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }
        .header {
            background: #10b981;
            padding: 22px;
            text-align: center;
            color: white;
        }
        .header img {
            max-height: 50px;
            display: block;
            margin: 0 auto 8px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
        }
        .content {
            padding: 22px;
        }
        .refund-details {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            background: #f8faf7;
        }
        .refund-info {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .product-image {
            width: 80px;
            height: 80px;
            border-radius: 6px;
            object-fit: cover;
        }
        .product-info {
            flex: 1;
        }
        .reference-box {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .reference-id {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            color: #047857;
            margin: 10px 0;
        }
        .timeline {
            background: #f7faf7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .instructions {
            margin: 20px 0;
        }
        .checklist {
            list-style: none;
            padding: 0;
        }
        .checklist li {
            padding: 5px 0;
            padding-left: 25px;
            position: relative;
        }
        .checklist li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        .footer {
            background: #1e293b;
            padding: 20px;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
        }
        @media (max-width: 480px) {
            .refund-info {
                flex-direction: column;
                text-align: center;
            }
            .product-image {
                width: 120px;
                height: 120px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="${settings?.logo}" alt="${settings?.storeName}">
            <h1>Refund Request Received</h1>
            <div style="margin-top: 6px; font-size: 15px;">
                Reference: ${newRefund._id.toString().slice(-12).toUpperCase()}
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Hi <strong>${order.user?.firstname || "Customer"}</strong>,</p> 
            <p>We've received your refund request and will process it shortly.</p>

            <!-- Refund Details -->
            <div class="refund-details">
                <div class="refund-info">
                    <img src="${productSnapshot.image}" alt="${
          productSnapshot.name
        }" class="product-image">
                    <div class="product-info">
                        <p style="margin: 0 0 5px 0; font-weight: bold;">${
                          productSnapshot.name
                        }</p>
                        <p style="margin: 0 0 3px 0; color: #666;">Quantity: ${refundQuantity}</p>
                        <p style="margin: 0; color: #666;">Amount: ${formatter.format(
                          refundAmount
                        )}</p>
                    </div>
                </div>
            </div>

            <!-- Reference ID -->
            <div class="reference-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #047857;">
                     Your Refund Reference ID
                </p>
                <div class="reference-id">
                    ${newRefund._id}
                </div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                    Please keep this ID for tracking and inquiries.
                </p>
            </div>

            <!-- Timeline -->
            <div class="timeline">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #047857;">
                     Estimated Timeline
                </p>
                <p style="margin: 0 0 15px 0;">
                    Our team will review your request and an agent will contact you for inspection.
                </p>
                <p style="margin: 0; font-weight: 500;">
                    Processing Time: <span style="color: #10b981;">Up to 7 working days</span>
                </p>
            </div>

            <!-- Instructions -->
            <div class="instructions">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #047857;">
                     Preparation for Inspection
                </p>
                <ul class="checklist">
                    <li>Keep item in original condition</li>
                    <li>Preserve original packaging</li>
                    <li>Have receipt/invoice ready</li>
                    <li>Be available for agent visit</li>
                </ul>
            </div>

            <p style="margin-top: 25px;">
                We'll notify you once your request is approved or rejected.
            </p>
            
            <p style="color: #555;">
                Need help? Contact us at 
                <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #10b981;">
                    ${settings?.supportEmail}
                </a>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <p style="margin-top:18px;">Thanks for choosing <strong>${
                  settings?.storeName
                }</strong> </p>
            </p>
            <p style="margin: 0;">Need help? Contact us at 
                <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #10b981; text-decoration: none;">
                    ${settings?.supportEmail}
                </a>
            </p>
        </div>
    </div>
</body>
</html>
    `;

        await sendEmail({
          to: order.user.email,
          subject: `Refund Request Received - ${settings?.storeName}`,
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
  const settings = await storeSettings.findOne();
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: settings.currency,
  });
    //  CRITICAL FIX: UPDATE THE MAIN ORDER STATUS
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
      `Refund approved for ${formatter.format(
              refund.amount
            )} via Flutterwave`
    );
 
    (async () => {
      try {
        const productSnapshot = refund.productSnapshot || {};
        const productName = productSnapshot.name || "Deleted Product";
        const productImage = productSnapshot.image || "/images/deleted.png";

        await sendEmail({
          to: order.user?.email,
          subject: `Refund Approved — ${settings?.storeName}`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Approved</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f8fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 700px;
            margin: auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }
        .header {
            background: #10b981;
            padding: 22px;
            text-align: center;
            color: white;
        }
        .header img {
            max-height: 50px;
            display: block;
            margin: 0 auto 8px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
        }
        .content {
            padding: 22px;
        }
        .status-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .status-icon {
            font-size: 40px;
            margin-bottom: 10px;
        }
        .details-box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            background: #f8faf7;
        }
        .details-grid {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .product-image {
            width: 80px;
            height: 80px;
            border-radius: 6px;
            object-fit: cover;
        }
        .product-info {
            flex: 1;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #e5e7eb;
        }
        .label {
            color: #666;
        }
        .value {
            font-weight: 500;
        }
        .timeline-box {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .timeline-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .timeline-icon {
            width: 24px;
            text-align: center;
            margin-right: 10px;
            color: #10b981;
        }
        .payment-info {
            background: #fffbeb;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }
        .footer {
            background: #1e293b;
            padding: 20px;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
        }
        @media (max-width: 480px) {
            .details-grid {
                flex-direction: column;
                text-align: center;
            }
            .product-image {
                width: 120px;
                height: 120px;
            }
            .info-row {
                flex-direction: column;
                gap: 5px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="${settings?.logo}" alt="${settings?.storeName}">
            <h1>Refund Approved</h1>
            <div style="margin-top: 6px; font-size: 15px;">
                Order: ${order.orderNumber || "N/A"}
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Dear <strong>${order.user?.firstname || "Customer"}</strong>,</p>
            <p>Great news! Your refund request has been approved and is now being processed.</p>

            <!-- Status Box -->
            <div class="status-box">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #047857;">
                    REFUND APPROVED
                </p>
                <p style="margin: 10px 0 0 0; color: #065f46;">
                    Approved on: ${new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </p>
            </div>

            <!-- Refund Details -->
            <div class="details-box">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #047857;">
                    Refund Details
                </p>
                <div class="details-grid">
                    <img src="${productImage}" alt="${productName}" class="product-image">
                    <div class="product-info">
                        <div class="info-row">
                            <span class="label">Product:</span>
                            <span class="value">${productName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Refund ID:</span>
                            <span class="value">${refund._id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Quantity:</span>
                            <span class="value">${refund.quantity}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Refund Amount:</span>
                            <span class="value">${formatter.format(
                              refund.amount
                            )}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span>
                            <span class="value" style="color: #10b981; font-weight: bold;">Approved ✓</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline -->
            <div class="timeline-box">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #0c4a6e;">
                     What Happens Next
                </p>
                <div class="timeline-item">
                    <div class="timeline-icon">✓</div>
                    <div>Item collected by delivery agent</div>
                </div>
                <div class="timeline-item">
                    <div>Refund processing initiated</div>
                </div>
                <div class="timeline-item">
                    <div>Amount credited to original payment method</div>
                </div>
            </div>

            <!-- Payment Info -->
            <div class="payment-info">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">
                    Refund Processing
                </p>
                <p style="margin: 0 0 10px 0;">
                    Your refund of <strong>${formatter.format(
                      refund.amount
                    )}</strong> 
                    will be processed to your original payment method.
                </p>
                <p style="margin: 0; font-weight: 500; color: #b45309;">
                    Estimated Time: 3–7 working days
                </p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">
                    <em>Note: Processing time may vary depending on your bank or payment provider.</em>
                </p>
            </div>

            <!-- Contact Info -->
            <p style="margin-top: 25px; text-align: center;">
                <strong>Need help?</strong> Contact our support team at
                <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #10b981;">
                    ${settings?.supportEmail}
                </a>
            </p>

            <p style="margin-top: 20px; color: #555; text-align: center;">
                Thank you for your patience and trust in ${settings?.storeName}.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <p style="margin-top:18px;">Thank you for choosing <strong>${
                  settings?.storeName
                }</strong></p>
            </p>
            <p style="margin: 0;">
                <a href="${
                  process.env.CLIENT_URL
                }/orders" style="color: #10b981; text-decoration: none;">
                    View Your Orders
                </a> | 
                <a href="${
                  process.env.CLIENT_URL
                }/products" style="color: #10b981; text-decoration: none;">
                    Continue Shopping
                </a>
            </p>
        </div>
    </div>
</body>
</html>
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
    const settings = await storeSettings.findOne();
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: settings.currency,
    });

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
      `Refund rejected for ${formatter.format(
        refund.amount
      )}`
    );

    res.json({
      success: true,
      message: "Refund rejected successfully",
    });

   (async () => {
     try {
       await sendEmail({
         to: order.user?.email,
         subject: `Refund Request Denied — ${settings?.storeName}`,
         html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Request Denied</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f8fa;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 700px;
            margin: auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }
        .header {
            background: #ef4444;
            padding: 22px;
            text-align: center;
            color: white;
        }
        .header img {
            max-height: 50px;
            display: block;
            margin: 0 auto 8px;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
        }
        .content {
            padding: 22px;
        }
        .status-box {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .status-icon {
            font-size: 40px;
            margin-bottom: 10px;
        }
        .details-box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            background: #f8faf7;
        }
        .details-grid {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .product-image {
            width: 80px;
            height: 80px;
            border-radius: 6px;
            object-fit: cover;
        }
        .product-info {
            flex: 1;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #e5e7eb;
        }
        .label {
            color: #666;
        }
        .value {
            font-weight: 500;
        }
        .reasons-box {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .contact-box {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            background: #1e293b;
            padding: 20px;
            text-align: center;
            color: #94a3b8;
            font-size: 13px;
        }
        @media (max-width: 480px) {
            .details-grid {
                flex-direction: column;
                text-align: center;
            }
            .product-image {
                width: 120px;
                height: 120px;
            }
            .info-row {
                flex-direction: column;
                gap: 5px;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <img src="${settings?.logo}" alt="${settings?.storeName}">
            <h1>Refund Request Denied</h1>
            <div style="margin-top: 6px; font-size: 15px;">
                Order: ${order.orderNumber || "N/A"}
            </div>
        </div>

        <!-- Content -->
        <div class="content">
            <p>Dear <strong>${order.user?.firstname || "Customer"}</strong>,</p>
            <p>After careful review, we regret to inform you that your refund request has been denied.</p>

            <!-- Status Box -->
            <div class="status-box">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">
                    REFUND REQUEST DENIED
                </p>
                <p style="margin: 10px 0 0 0; color: #b91c1c;">
                    Decision Date: ${new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </p>
            </div>

            <!-- Refund Details -->
            <div class="details-box">
                <p style="margin: 0 0 15px 0; font-weight: bold; color: #047857;">
                     Request Details
                </p>
                <div class="details-grid">
                    <img src="${productImage}" alt="${productName}" class="product-image">
                    <div class="product-info">
                        <div class="info-row">
                            <span class="label">Product:</span>
                            <span class="value">${productName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Refund ID:</span>
                            <span class="value">${refund._id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Quantity:</span>
                            <span class="value">${refund.quantity}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Amount:</span>
                            <span class="value">${formatter.format(
                              refund.amount
                            )}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Common Reasons -->
            <div class="reasons-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e;">
                     Common Reasons for Denial
                </p>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Item not in original condition</li>
                    <li>Original packaging missing</li>
                    <li>Usage beyond trial period</li>
                    <li>Return outside policy timeframe</li>
                    <li>Signs of wear or damage</li>
                </ul>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #92400e;">
                    <em>Note: Specific reason details are available upon request.</em>
                </p>
            </div>

            <!-- Contact Information -->
            <div class="contact-box">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #047857;">
                     Have Questions?
                </p>
                <p style="margin: 0 0 15px 0;">
                    If you believe this was an error or need clarification, 
                    our support team is ready to assist you.
                </p>
                <p style="margin: 0; font-weight: 500;">
                    Contact: 
                    <a href="mailto:${
                      settings?.supportEmail
                    }" style="color: #10b981; text-decoration: none;">
                        ${settings?.supportEmail}
                    </a>
                </p>
            </div>

            <p style="margin-top: 25px; color: #555;">
                We appreciate your understanding and thank you for shopping with us.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <p style="margin-top:18px;">Thank you for choosing <strong>${
                  settings?.storeName
                }</strong></p>
            </p>
            <p style="margin: 0;">
                <a href="${
                  process.env.CLIENT_URL
                }/refund-policy" style="color: #10b981; text-decoration: none;">
                    View Refund Policy
                </a> | 
                <a href="${
                  process.env.CLIENT_URL
                }/contact" style="color: #10b981; text-decoration: none;">
                    Contact Support
                </a>
            </p>
        </div>
    </div>
</body>
</html>
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
