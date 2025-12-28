import Order from "../models/order.model.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { flw } from "../lib/flutterwave.js";
import { sendEmail } from "../lib/mailer.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import storeSettings from "../models/storeSettings.model.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Audit log helper (unchanged from your original)
const logRefundAction = async (req, action, orderId, refundId = null, changes = {}, additionalInfo = "") => {
  try {
    if (!req.user || req.user.role !== "admin") return;
    
    const order = await Order.findById(orderId).populate("user", "firstname lastname email");
    if (!order) return;
    
    const refund = refundId ? order.refunds.id(refundId) : null;
    const refundInfo = refund ? {
      refundId: refund._id,
      amount: refund.amount,
      product: refund.productSnapshot?.name || "Unknown Product",
      status: refund.status,
    } : null;
    
    await AuditLogger.log({
      adminId: req.user._id,
      adminName: `${req.user.firstname} ${req.user.lastname}`,
      action,
      entityType: ENTITY_TYPES.ORDER,
      entityId: order._id,
      entityName: `Order #${order.orderNumber}`,
      changes: { ...changes, refund: refundInfo },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo,
    });
  } catch (error) {
    console.error("Failed to log refund action:", error);
  }
};
const getEmailStyles = () => `
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      color: #374151;
      line-height: 1.6;
    }
    .container {
      max-width: 700px;
      margin: auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 28px 24px;
      text-align: center;
      background-color: #047857;
      color: white;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 12px;
      background-color: rgba(255, 255, 255, 0.15);
      color: white;
    }
    .content {
      padding: 32px 24px;
    }
    .details-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
      background: #fafafa;
    }
    .refund-info {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    .product-image {
      width: 90px;
      height: 90px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid #e5e7eb;
    }
    .product-details {
      flex: 1;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 16px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .timeline {
      background-color: #f0f9ff;
      padding: 20px;
      border-radius: 6px;
      margin: 24px 0;
      border-left: 4px solid #047857;
    }
    .timeline-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .timeline-number {
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-weight: bold;
      font-size: 12px;
      color: #047857;
      border: 1px solid #047857;
    }
    .footer {
      background: #1f2937;
      padding: 24px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }
    .action-button {
      display: inline-block;
      padding: 12px 28px;
      background: #047857;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 16px 0;
      transition: background-color 0.2s;
    }
    .action-button:hover {
      background-color: #065f46;
    }
    .secondary-button {
      display: inline-block;
      padding: 12px 28px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 16px 0 16px 12px;
      transition: background-color 0.2s;
    }
    .secondary-button:hover {
      background-color: #2563eb;
    }
    .highlight-box {
      background: #d1fae5;
      padding: 24px;
      border-radius: 6px;
      text-align: center;
      margin: 24px 0;
    }
    .note-box {
      background: #fef3c7;
      padding: 16px;
      border-radius: 6px;
      margin: 24px 0;
      border-left: 4px solid #d97706;
    }
    .error-box {
      background: #fef2f2;
      padding: 20px;
      border-radius: 6px;
      margin: 24px 0;
      border-left: 4px solid #dc2626;
    }
    @media (max-width: 480px) {
      .refund-info {
        flex-direction: column;
        text-align: center;
      }
      .product-image {
        width: 120px;
        height: 120px;
        margin: 0 auto;
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
      .action-button, .secondary-button {
        display: block;
        margin: 12px 0;
        width: 100%;
        text-align: center;
      }
    }
  </style>
`;
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

// 1REFUND REQUESTED EMAIL
const getRequestedEmailContent = (order, refund, settings, formatter) => {
  const productSnapshot = refund.productSnapshot || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Request Received - ${settings?.storeName}</title>
    ${getEmailStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height: 50px; display: block; margin: 0 auto 12px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 500;">Refund Request Received</h1>
            <div class="status-badge">
                Request Submitted
            </div>
        </div>

        <div class="content">
            <p style="font-size: 16px;">Dear <strong>${
              order.user?.firstname || "Customer"
            }</strong>,</p>
            <p style="color: #6b7280;">We have received your refund request and it is now in our processing queue. Here is what happens next:</p>

            <div class="details-card">
                <h3 style="margin-top: 0; color: #047857;">Refund Details</h3>
                <div class="refund-info">
                    <img src="${
                      productSnapshot.image || "/images/deleted.png"
                    }" alt="${productSnapshot.name}" class="product-image">
                    <div class="product-details">
                        <h4 style="margin: 0 0 8px 0; color: #1f2937;">${
                          productSnapshot.name || "Deleted Product"
                        }</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span style="color: #6b7280;">Quantity:</span>
                                <span style="font-weight: 600;">${
                                  refund.quantity
                                }</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Amount:</span>
                                <span style="font-weight: 600; color: #047857;">${formatter.format(
                                  refund.amount
                                )}</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Refund ID:</span>
                                <span style="font-family: monospace; font-size: 13px;">${refund._id
                                  .toString()
                                  .slice(-12)
                                  .toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Order:</span>
                                <span style="font-weight: 600;">${
                                  order.orderNumber
                                }</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="timeline">
                <h4 style="margin-top: 0; color: #047857;">What Happens Next</h4>
                <div class="timeline-item">
                    <div class="timeline-number">1</div>
                    <div>Our team reviews your request (1-2 business days)</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">2</div>
                    <div>Item inspection by delivery agent (if required)</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">3</div>
                    <div>Refund processing via payment gateway</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">4</div>
                    <div>Funds returned to original payment method</div>
                </div>
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #047857;">
                    <strong>Estimated total time:</strong> 7-10 business days
                </p>
            </div>

            <div class="note-box">
                <h4 style="margin-top: 0; color: #92400e;">Important Notes</h4>
                <ul style="margin: 8px 0; padding-left: 20px; color: #92400e;">
                    <li>Keep the item in original condition</li>
                    <li>Preserve packaging and accessories</li>
                    <li>Have your receipt/order number ready</li>
                    <li>Be available for agent inspection if required</li>
                </ul>
            </div>

            <p style="text-align: center; margin: 24px 0;">
                <a href="${
                  process.env.CLIENT_URL
                }/account/orders" class="action-button">
                    Track Your Refund
                </a>
            </p>

            <p style="color: #6b7280; text-align: center; font-size: 14px;">
                Need help? Contact our support team:<br>
                <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #047857; font-weight: 600;">
                    ${settings?.supportEmail}
                </a>
            </p>
        </div>

        <div class="footer">
            <p style="margin: 0 0 12px 0;">
                <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height: 30px; opacity: 0.8;">
            </p>
            <p style="margin: 0 0 8px 0;">${
              settings?.storeName
            } • Refund Management System</p>
            <p style="margin: 0; font-size: 12px;">
                This is an automated message. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
`;
};

// REFUND PROCESSING EMAIL
const getProcessingEmailContent = (order, refund, settings, formatter) => {
  const productSnapshot = refund.productSnapshot || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Processing Started - ${settings?.storeName}</title>
    ${getEmailStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height: 50px; display: block; margin: 0 auto 12px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 500;">Refund Processing Started</h1>
            <div class="status-badge">
                Processing
            </div>
        </div>

        <div class="content">
            <p style="font-size: 16px;">Dear <strong>${
              order.user?.firstname || "Customer"
            }</strong>,</p>
            <p style="color: #6b7280;">Your refund request has been approved by our team and is now being processed by our payment gateway.</p>

            <div class="details-card">
                <h3 style="margin-top: 0; color: #047857;">Payment Processing</h3>
                <div class="refund-info">
                    <img src="${
                      productSnapshot.image || "/images/deleted.png"
                    }" alt="${productSnapshot.name}" class="product-image">
                    <div class="product-details">
                        <h4 style="margin: 0 0 8px 0; color: #1f2937;">${
                          productSnapshot.name || "Deleted Product"
                        }</h4>
                        <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #1e40af;">Refund Amount:</span>
                                <span style="font-size: 20px; font-weight: 700; color: #1e40af;">${formatter.format(
                                  refund.amount
                                )}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="timeline">
                <h4 style="margin-top: 0; color: #047857;">Current Status Timeline</h4>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #047857; background-color: #d1fae5;">✓</div>
                    <div><strong style="color: #047857;">Request Approved</strong> - ${new Date(
                      refund.processedAt
                    ).toLocaleDateString()}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">2</div>
                    <div><strong style="color: #047857;">Payment Processing</strong> - With ${
                      settings?.paymentGateway || "payment gateway"
                    }</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">3</div>
                    <div>Funds Returned - To original payment method</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">4</div>
                    <div>Completion Notification - Email confirmation</div>
                </div>
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #047857;">
                    <strong>Expected completion:</strong> 3-7 business days
                </p>
            </div>

            <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 24px 0;">
                <h4 style="margin-top: 0; color: #047857;">What You Need to Know</h4>
                <ul style="margin: 8px 0; padding-left: 20px; color: #065f46;">
                    <li>Refunds are processed to your <strong>original payment method</strong></li>
                    <li>Processing time depends on your bank/payment provider</li>
                    <li>You will receive another email when the refund is complete</li>
                    <li>No further action is required from you</li>
                </ul>
            </div>

            <p style="color: #6b7280; text-align: center; font-size: 14px;">
                <strong>Refund ID:</strong> ${refund._id}<br>
                <strong>Need help?</strong> Contact: 
                <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #047857; font-weight: 600;">
                    ${settings?.supportEmail}
                </a>
            </p>
        </div>

        <div class="footer">
            <p style="margin: 0 0 8px 0;">${
              settings?.storeName
            } • Payment Processing</p>
            <p style="margin: 0; font-size: 12px;">
                This is an automated status update. Please allow 3-7 business days for processing.
            </p>
        </div>
    </div>
</body>
</html>
`;
};

// REFUND APPROVED EMAIL
const getApprovedEmailContent = (order, refund, settings, formatter) => {
  const productSnapshot = refund.productSnapshot || {};
  const refundDate = refund.processedAt || new Date();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Completed - ${settings?.storeName}</title>
    ${getEmailStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height: 50px; display: block; margin: 0 auto 12px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 500;">Refund Successfully Completed</h1>
            <div class="status-badge">
                Refunded
            </div>
        </div>

        <div class="content">
            <p style="font-size: 16px;">Dear <strong>${
              order.user?.firstname || "Customer"
            }</strong>,</p>
            <p style="color: #6b7280;">Your refund has been successfully processed and the funds are on their way back to you.</p>

            <div class="highlight-box">
                <div style="font-size: 14px; color: #065f46; margin-bottom: 8px;">REFUND AMOUNT</div>
                <div style="font-size: 36px; font-weight: 700; color: #047857;">${formatter.format(
                  refund.amount
                )}</div>
                <div style="font-size: 14px; color: #065f46; margin-top: 8px;">
                    Completed on ${new Date(refundDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                </div>
            </div>

            <div class="details-card">
                <h3 style="margin-top: 0; color: #047857;">Transaction Summary</h3>
                <div class="refund-info">
                    <img src="${
                      productSnapshot.image || "/images/deleted.png"
                    }" alt="${productSnapshot.name}" class="product-image">
                    <div class="product-details">
                        <h4 style="margin: 0 0 8px 0; color: #1f2937;">${
                          productSnapshot.name || "Deleted Product"
                        }</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span style="color: #6b7280;">Refund ID:</span>
                                <span style="font-family: monospace; font-weight: 600;">${refund._id
                                  .toString()
                                  .slice(-12)
                                  .toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Order Number:</span>
                                <span style="font-weight: 600;">${
                                  order.orderNumber
                                }</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Quantity Refunded:</span>
                                <span style="font-weight: 600;">${
                                  refund.quantity
                                }</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Payment Method:</span>
                                <span style="font-weight: 600;">Original payment method</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="timeline" style="background: #f0fdf4; border-left-color: #047857;">
                <h4 style="margin-top: 0; color: #047857;">Refund Timeline</h4>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #047857; background-color: #d1fae5;">✓</div>
                    <div><strong>Request Submitted</strong> - ${new Date(
                      refund.requestedAt
                    ).toLocaleDateString()}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #047857; background-color: #d1fae5;">✓</div>
                    <div><strong>Approval & Processing</strong> - ${new Date(
                      refund.processedAt
                    ).toLocaleDateString()}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #047857; background-color: #d1fae5;">✓</div>
                    <div><strong>Payment Gateway Completed</strong> - Today</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #047857; background-color: #d1fae5;">✓</div>
                    <div><strong>Funds Returned</strong> - Transaction complete</div>
                </div>
            </div>

            <div class="note-box">
                <h4 style="margin-top: 0; color: #92400e;">Funds Information</h4>
                <ul style="margin: 8px 0; padding-left: 20px; color: #92400e;">
                    <li>Funds are returned to your <strong>original payment method</strong></li>
                    <li>Bank deposits typically appear within <strong>3-7 business days</strong></li>
                    <li>Credit card refunds may take <strong>5-10 business days</strong> to appear</li>
                    <li>Contact your bank/payment provider if you don't see the refund after 10 days</li>
                </ul>
            </div>

            <p style="text-align: center; margin: 24px 0;">
                <a href="${
                  process.env.CLIENT_URL
                }/account/orders" class="action-button">
                    View Order Details
                </a>
                <a href="${
                  process.env.CLIENT_URL
                }/products" class="secondary-button">
                    Continue Shopping
                </a>
            </p>

            <p style="color: #6b7280; text-align: center; font-size: 14px;">
                Thank you for shopping with ${settings?.storeName}.<br>
                Questions? Contact <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #047857;">${settings?.supportEmail}</a>
            </p>
        </div>

        <div class="footer">
            <p style="margin: 0 0 12px 0;">
                <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height: 30px; opacity: 0.8;">
            </p>
            <p style="margin: 0 0 8px 0; color: #d1d5db;">${
              settings?.storeName
            } • Customer Support</p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                This transaction is complete. Receipt available in your account.
            </p>
        </div>
    </div>
</body>
</html>
`;
};

//  REFUND REJECTED EMAIL
const getRejectedEmailContent = (
  order,
  refund,
  settings,
  formatter,
  rejectionReason = "Refund request rejected"
) => {
  const productSnapshot = refund.productSnapshot || {};
  const isAdminRejected = refund.adminRejected === true;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refund Request Update - ${settings?.storeName}</title>
    ${getEmailStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height: 50px; display: block; margin: 0 auto 12px;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 500;">Refund Request Not Approved</h1>
            <div class="status-badge">
                Not Approved
            </div>
        </div>

        <div class="content">
            <p style="font-size: 16px;">Dear <strong>${
              order.user?.firstname || "Customer"
            }</strong>,</p>
            <p style="color: #6b7280;">After reviewing your refund request, we are unable to proceed with the refund at this time.</p>

            <div class="details-card" style="border-color: #fca5a5;">
                <h3 style="margin-top: 0; color: #dc2626;">Request Details</h3>
                <div class="refund-info">
                    <img src="${
                      productSnapshot.image || "/images/deleted.png"
                    }" alt="${productSnapshot.name}" class="product-image">
                    <div class="product-details">
                        <h4 style="margin: 0 0 8px 0; color: #1f2937;">${
                          productSnapshot.name || "Deleted Product"
                        }</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <span style="color: #6b7280;">Requested Amount:</span>
                                <span style="font-weight: 600;">${formatter.format(
                                  refund.amount
                                )}</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Refund ID:</span>
                                <span style="font-family: monospace;">${refund._id
                                  .toString()
                                  .slice(-12)
                                  .toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Order Number:</span>
                                <span style="font-weight: 600;">${
                                  order.orderNumber
                                }</span>
                            </div>
                            <div class="info-item">
                                <span style="color: #6b7280;">Decision Date:</span>
                                <span style="font-weight: 600;">${new Date(
                                  refund.processedAt || new Date()
                                ).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="error-box">
                <h4 style="margin-top: 0; color: #dc2626;">Decision Details</h4>
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 12px 0;">
                    <div style="font-weight: bold; color: #7f1d1d; margin-bottom: 8px;">
                        Reason for Rejection:
                    </div>
                    <div style="color: #7f1d1d; line-height: 1.5; padding: 10px; background: #fafafa; border-radius: 4px;">
                        ${rejectionReason}
                    </div>
                </div>
                <p style="color: #7f1d1d; font-size: 14px; margin-top: 10px;">
                    This decision was made by our customer service team after reviewing your request.
                </p>
            </div>

            <div class="timeline" style="background: #fef2f2; border-left-color: #dc2626;">
                <h4 style="margin-top: 0; color: #dc2626;">Request Timeline</h4>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #047857; background-color: #d1fae5;">✓</div>
                    <div>Request Submitted - ${new Date(
                      refund.requestedAt
                    ).toLocaleDateString()}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number" style="color: #dc2626; background-color: #fecaca;">X</div>
                    <div><strong>Not Approved</strong> - ${new Date(
                      refund.processedAt || new Date()
                    ).toLocaleDateString()}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-number">3</div>
                    <div>Notification Sent - This email</div>
                </div>
            </div>

            <div class="note-box">
                <h4 style="margin-top: 0; color: #92400e;">Common Reasons for Rejection</h4>
                <ul style="margin: 8px 0; padding-left: 20px; color: #92400e;">
                    <li>Item not in original condition</li>
                    <li>Outside return policy timeframe</li>
                    <li>Missing original packaging/accessories</li>
                    <li>Signs of wear, damage, or use</li>
                    <li>Return initiated after usage period</li>
                </ul>
                <p style="color: #92400e; font-size: 14px; margin-top: 8px;">
                    Note: Your specific reason is listed above.
                </p>
            </div>

            <div style="background: #e0f2fe; padding: 16px; border-radius: 6px; margin: 24px 0; text-align: center;">
                <h4 style="margin-top: 0; color: #0369a1;">Need Assistance?</h4>
                <p style="color: #0c4a6e;">
                    If you believe this was an error or have questions,<br>
                    our support team is ready to help.
                </p>
                <a href="mailto:${
                  settings?.supportEmail
                }" style="color: #0369a1; font-weight: 600; font-size: 16px;">
                    ${settings?.supportEmail}
                </a>
                <p style="margin-top: 12px;">
                    <a href="${
                      process.env.CLIENT_URL
                    }/contact" style="color: #3b82f6; text-decoration: underline;">
                        Contact Support Form
                    </a>
                </p>
            </div>

            <p style="color: #6b7280; text-align: center; font-size: 14px;">
                We appreciate your understanding and thank you for shopping with ${
                  settings?.storeName
                }.
            </p>
        </div>

        <div class="footer">
            <p style="margin: 0 0 8px 0;">${
              settings?.storeName
            } • Customer Service</p>
            <p style="margin: 0; font-size: 12px;">
                This decision is final. For inquiries, contact support within 7 days.
            </p>
        </div>
    </div>
</body>
</html>
`;
};

// EMAIL SENDING FUNCTIONS

export const sendRefundRequestedEmail = async (order, refund, settings, formatter) => {
  try {
    const emailContent = getRequestedEmailContent(order, refund, settings, formatter);
    await sendEmail({
      to: order.user.email,
      subject: `Refund Request Received - ${settings?.storeName}`,
      html: emailContent,
    });
    console.log("✅ Refund request email sent to:", order.user.email);
  } catch (emailErr) {
    console.error("Refund request email failed:", emailErr);
  }
};

export const sendRefundProcessingEmail = async (order, refund, settings, formatter) => {
  try {
    const emailContent = getProcessingEmailContent(order, refund, settings, formatter);
    await sendEmail({
      to: order.user.email,
      subject: `Refund Processing Started - ${settings?.storeName}`,
      html: emailContent,
    });
    console.log("✅ Refund processing email sent to:", order.user.email);
  } catch (emailErr) {
    console.error("Refund processing email failed:", emailErr);
  }
};

export const sendRefundApprovedEmail = async (order, refund, settings, formatter) => {
  try {
    const emailContent = getApprovedEmailContent(order, refund, settings, formatter);
    await sendEmail({
      to: order.user.email,
      subject: `Refund Successfully Completed - ${settings?.storeName}`,
      html: emailContent,
    });
    console.log("✅ Refund approved email sent to:", order.user.email);
  } catch (emailErr) {
    console.error("Refund approved email failed:", emailErr);
  }
};

export const sendRefundRejectedEmail = async (order, refund, settings, formatter, reason) => {
  try {
    const emailContent = getRejectedEmailContent(order, refund, settings, formatter, reason);
    await sendEmail({
      to: order.user.email,
      subject: `Refund Request Update - ${settings?.storeName}`,
      html: emailContent,
    });
    console.log("✅ Refund rejected email sent to:", order.user.email);
  } catch (emailErr) {
    console.error("Refund rejected email failed:", emailErr);
  }
};
 
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
        const generatedId = `deleted-${orderId}-${p.name.replace(/\s+/g, "_")}-${p.price}`;
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
      if (existingRefund) {
        // Calculate total quantity already refunded/requested for this product
        const totalRefundedQuantity = order.refunds
          .filter((r) => {
            const rProductId =
              r.product?.toString() ||
              r.product?._id?.toString() ||
              r.productSnapshot?._id;
            const currentProductId =
              refundProduct.product?._id?.toString() ||
              refundProduct.product?.toString();
            return rProductId === currentProductId;
          })
          .reduce((sum, r) => sum + r.quantity, 0);

        // Calculate remaining quantity that can still be refunded
        const remainingQuantity =
          refundProduct.quantity - totalRefundedQuantity;

        if (remainingQuantity <= 0) {
          // All items already refunded/requested
          return res.status(400).json({
            message: `Cannot submit another refund request. All ${
              refundProduct.quantity
            } items have already been ${existingRefund.status.toLowerCase()}.`,
            existingStatus: existingRefund.status,
            totalRequested: totalRefundedQuantity,
            originalQuantity: refundProduct.quantity,
          });
        }

        // Check if requested quantity exceeds remaining quantity
        const requestedQuantity = quantity || refundProduct.quantity;
        if (requestedQuantity > remainingQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot refund ${requestedQuantity} items. Only ${remainingQuantity} available.`,
            details: {
              maxAllowed: remainingQuantity,
              requested: requestedQuantity,
              original: refundProduct.quantity,
              alreadyRefunded: totalRefundedQuantity,
              suggestion: `Try requesting ${remainingQuantity} or less`,
            },
          });
        }
      }

      // return res.status(400).json({
      //   message: `Cannot submit another refund request for this product. A refund is already ${existingRefund.status.toLowerCase()}.`,
      //   existingStatus: existingRefund.status,
      // });
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

    // Send email using the new consistent function
    const newRefund = order.refunds[order.refunds.length - 1];
    await sendRefundRequestedEmail(order, newRefund, settings, formatter);

  } catch (error) {
    console.error("Refund request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const approveRefund = async (req, res) => {
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

    if (refund.status !== "Pending") {
      return res.status(400).json({
        message: `Refund is already ${refund.status}`,
        currentStatus: refund.status,
      });
    }

    // ==============================================
    // UPDATE STATUS TO PROCESSING IMMEDIATELY
    // ==============================================
    const oldRefundStatus = refund.status;
    refund.status = "Processing";
    refund.processedAt = new Date();
    await order.save();

    console.log(`✅ Set refund to Processing: ${refundId}`);

    // ==============================================
    // INITIATE FLUTTERWAVE REFUND
    // ==============================================
    const refundData = {
      id: order.flutterwaveTransactionId,
      amount: refund.amount,
    };

    console.log("🔄 Initiating Flutterwave refund:", refundData);

    let flutterwaveResponse;
    try {
      flutterwaveResponse = await flw.Transaction.refund(refundData);
      console.log("Flutterwave response:", flutterwaveResponse);

      // ==============================================
      // ✅ CRITICAL FIX: CHECK IMMEDIATE COMPLETION
      // ==============================================
      if (flutterwaveResponse.status === "success") {
        // Store Flutterwave data
        if (flutterwaveResponse.data?.id) {
          refund.flutterwaveRefundId = flutterwaveResponse.data.id.toString();
        }
        if (flutterwaveResponse.data?.flw_ref) {
          refund.flw_ref = flutterwaveResponse.data.flw_ref;
        }
        refund.flutterwaveResponse = flutterwaveResponse.data;

        // 🔥 CHECK IF REFUND IS ALREADY COMPLETED
        const refundStatus = flutterwaveResponse.data?.status?.toLowerCase();
        const isCompleted =
          refundStatus === "completed" ||
          refundStatus === "successful" ||
          flutterwaveResponse.data?.status === "successful";

        if (isCompleted) {
          // ✅ REFUND COMPLETED IMMEDIATELY - UPDATE NOW
          console.log(`🎉 Refund completed immediately via API`);
          refund.status = "Approved";

          // Update order totals
          order.totalRefunded = (order.totalRefunded || 0) + refund.amount;

          // Update order status
          const approvedRefunds = order.refunds.filter(
            (r) => r.status === "Approved"
          );
          if (approvedRefunds.length === order.products.length) {
            order.refundStatus = "Fully Refunded";
            order.status = "Refunded";
          } else if (approvedRefunds.length > 0) {
            order.refundStatus = "Partially Refunded";
            order.status = "Partially Refunded";
          }
        } else {
          // ⏳ Refund is still processing, wait for webhook
          console.log(`⏳ Refund still processing, waiting for webhook`);
          refund.status = "Processing";
        }

        await order.save();
      } else if (flutterwaveResponse.status === "error") {
        // Handle Flutterwave errors
        refund.status = "Rejected";
        refund.errorDetails = flutterwaveResponse.message;
        refund.processedAt = new Date();
        await order.save();

        return res.status(400).json({
          success: false,
          message: "Flutterwave refund failed",
          error: flutterwaveResponse.message,
          currentStatus: refund.status,
        });
      }
    } catch (flutterwaveError) {
      console.error("Flutterwave API error:", flutterwaveError);

      refund.status = "Rejected";
      refund.errorDetails = flutterwaveError.message;
      await order.save();

      return res.status(500).json({
        success: false,
        message: "Flutterwave API error",
        error: flutterwaveError.message,
        currentStatus: refund.status,
      });
    }

    // Get settings for email
    const settings = await storeSettings.findOne();
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: settings.currency,
    });

    // Send appropriate email
    if (refund.status === "Approved") {
      await sendRefundApprovedEmail(order, refund, settings, formatter);
      console.log("📧 Approval email sent");
    } else if (refund.status === "Processing") {
      await sendRefundProcessingEmail(order, refund, settings, formatter);
      console.log("📧 Processing email sent");
    }

    // Log audit
    await logRefundAction(
      req,
      refund.status === "Approved" ? "REFUND_COMPLETED" : "REFUND_PROCESSING",
      orderId,
      refundId,
      {
        before: { refundStatus: oldRefundStatus },
        after: {
          refundStatus: refund.status,
          flutterwaveRefundId: refund.flutterwaveRefundId,
        },
      },
      `Refund ${
        refund.status === "Approved" ? "completed" : "processing"
      }. Amount: ${formatter.format(refund.amount)}`
    );

    return res.json({
      success: true,
      message:
        refund.status === "Approved"
          ? "Refund completed successfully!"
          : "Refund submitted for processing. Status will update when payment gateway confirms.",
      currentStatus: refund.status,
      refundId: refund._id,
      flutterwaveRefundId: refund.flutterwaveRefundId,
      flw_ref: refund.flw_ref,
      note:
        refund.status === "Approved"
          ? "Refund completed immediately via Flutterwave API"
          : "Waiting for webhook confirmation",
    });
  } catch (error) {
    console.error("Approve refund error:", error);
    res.status(500).json({
      message: "Server error processing refund",
      error: error.message,
    });
  }
};

export const flutterwaveWebhook = async (req, res) => {
  console.log("=== 🚨 FLUTTERWAVE WEBHOOK RECEIVED ===");
  console.log("Event:", req.body.event);

  try {
    // 1. VERIFY SIGNATURE
    const signature = req.headers["verif-hash"];
    const secretHash = process.env.FLW_WEBHOOK_HASH;

    if (!signature || signature !== secretHash) {
      console.log("❌ Invalid signature");
      return res.status(401).send("Invalid signature");
    }

    console.log("✅ Signature verified");

    // 2. GET THE WEBHOOK DATA
    const event = req.body;
    const { id, status, transaction_ref, amount, flw_ref, tx_ref } =
      event.data || {};

    console.log(
      `🔍 Processing: Event=${event.event}, ID=${id}, Status=${status}`
    );

    // 3. SEND RESPONSE IMMEDIATELY (BEST PRACTICE)
    res.status(200).json({ success: true });

    // 4. PROCESS IN BACKGROUND
    setTimeout(async () => {
      try {
        console.log("🔄 Starting background processing...");

        let order, refund;

        // ============================================
        // TRY MULTIPLE METHODS TO FIND THE REFUND
        // ============================================

        // METHOD 1: Find by Flutterwave refund ID
        if (id) {
          console.log(`🔍 METHOD 1: Searching by flutterwaveRefundId: ${id}`);
          order = await Order.findOne({
            "refunds.flutterwaveRefundId": id.toString(),
          });

          if (order) {
            refund = order.refunds.find(
              (r) => r.flutterwaveRefundId === id.toString()
            );
            console.log(`✅ Found via flutterwaveRefundId`);
          }
        }

        // METHOD 2: Find by transaction ID (tx_ref from webhook)
        if (!order && (tx_ref || transaction_ref)) {
          const txId = tx_ref || transaction_ref;
          console.log(`🔍 METHOD 2: Searching by transaction ID: ${txId}`);

          order = await Order.findOne({
            flutterwaveTransactionId: txId,
          });

          if (order) {
            // Find Processing refund with similar amount (within 1 unit)
            refund = order.refunds.find(
              (r) =>
                r.status === "Processing" && Math.abs(r.amount - amount) <= 1
            );

            if (refund) {
              console.log(`✅ Found via transaction+amount`);
            }
          }
        }

        // METHOD 3: Find by flw_ref
        if (!order && flw_ref) {
          console.log(`🔍 METHOD 3: Searching by flw_ref: ${flw_ref}`);
          order = await Order.findOne({
            "refunds.flw_ref": flw_ref,
          });

          if (order) {
            refund = order.refunds.find((r) => r.flw_ref === flw_ref);
            console.log(`✅ Found via flw_ref`);
          }
        }

        // METHOD 4: Find all orders with Processing refunds and match by amount
        if (!order && amount) {
          console.log(
            `🔍 METHOD 4: Searching all Processing refunds with amount: ${amount}`
          );

          // Find all orders with Processing refunds
          const orders = await Order.find({
            "refunds.status": "Processing",
          });

          for (const o of orders) {
            // Check each Processing refund for amount match
            for (const r of o.refunds) {
              if (
                r.status === "Processing" &&
                Math.abs(r.amount - amount) <= 1
              ) {
                order = o;
                refund = r;
                console.log(`✅ Found via amount matching`);
                break;
              }
            }
            if (order) break;
          }
        }

        if (!order || !refund) {
          console.log(`❌ No matching order/refund found`);
          console.log(`   Event Data:`, event.data);
          return;
        }

        console.log(
          `✅ Found: Order ${order.orderNumber}, Refund ${refund._id}, Current status: ${refund.status}`
        );

        // Don't process if already finalized
        const finalStates = ["Approved", "Rejected", "Failed"];
        if (finalStates.includes(refund.status)) {
          console.log(`ℹ️ Refund already finalized as: ${refund.status}`);
          return;
        }

        // UPDATE STATUS BASED ON WEBHOOK
        const oldStatus = refund.status;

        if (status === "successful" || event.event === "refund.completed") {
          refund.status = "Approved";
          console.log(`🎉 Updated status to Approved`);

          // Update order totals
          order.totalRefunded = (order.totalRefunded || 0) + refund.amount;

          // Update order status
          const approvedRefunds = order.refunds.filter(
            (r) => r.status === "Approved"
          );
          if (approvedRefunds.length === order.products.length) {
            order.refundStatus = "Fully Refunded";
            order.status = "Refunded";
          } else if (approvedRefunds.length > 0) {
            order.refundStatus = "Partially Refunded";
            order.status = "Partially Refunded";
          }
        } else if (status === "failed" || event.event === "refund.failed") {
          refund.status = "Rejected";
          refund.errorDetails = event.data?.reason || "Refund failed";
          console.log(`❌ Updated status to Rejected`);
        } else {
          // If status is "pending" or something else, keep as Processing
          console.log(`ℹ️ Webhook status is ${status}, keeping as Processing`);
          return;
        }

        // Store additional Flutterwave data
        refund.flutterwaveResponse = event.data;

        // Ensure we have the refund ID
        if (id && !refund.flutterwaveRefundId) {
          refund.flutterwaveRefundId = id.toString();
        }
        if (flw_ref && !refund.flw_ref) {
          refund.flw_ref = flw_ref;
        }

        refund.processedAt = new Date();

        await order.save();
        console.log(`💾 Database updated successfully!`);

        // SEND EMAIL
        const settings = await storeSettings.findOne();
        const formatter = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: settings.currency,
        });

        if (refund.status === "Approved") {
          await sendRefundApprovedEmail(order, refund, settings, formatter);
          console.log("📧 Approval email sent");
        } else if (refund.status === "Rejected") {
          await sendRefundRejectedEmail(
            order,
            refund,
            settings,
            formatter,
            refund.errorDetails || "Refund rejected by payment gateway"
          );
          console.log("📧 Rejection email sent");
        }

        console.log(`✅ Webhook processing complete for refund ${refund._id}`);
      } catch (error) {
        console.error("❌ Webhook processing error:", error.message);
        console.error(error.stack);
      }
    }, 1000); // 1 second delay
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error.message);
    res.status(500).send("Webhook processing error");
  }
};

 

export const rejectRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    const { reason } = req.body;

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

    const rejectionReason = reason?.trim() || "Rejected by admin";
    if (rejectionReason.length < 5) {
      return res.status(400).json({
        message: "Rejection reason must be at least 5 characters",
      });
    }

    // Store old status
    const oldRefundStatus = refund.status;

    // Admin rejection (not payment gateway rejection)
    refund.status = "Rejected";
    refund.processedAt = new Date();
    refund.adminRejected = true;
    refund.errorDetails = rejectionReason;
    refund.rejectionSource = "admin"; 
    refund.rejectionReason = rejectionReason;

    await order.save();

    const settings = await storeSettings.findOne();
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: settings.currency,
    });

    await logRefundAction(
      req,
      "REFUND_ADMIN_REJECTED",
      orderId,
      refundId,
      {
        before: { refundStatus: oldRefundStatus },
        after: { refundStatus: "Rejected" },
      },
      `Refund rejected by admin for ${formatter.format(refund.amount)}`
    );

    // Send rejection email
    await sendRefundRejectedEmail(
      order,
      refund,
      settings,
      formatter,
      rejectionReason
    );

    res.json({
      success: true,
      message: "Refund rejected successfully",
    });

  } catch (error) {
    console.error("Reject refund error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const retryWebhook = async (req, res) => {
  try {
    const { flutterwaveRefundId } = req.body;

    console.log(`🔄 Retrying webhook for: ${flutterwaveRefundId}`);

    // Manually call Flutterwave to get refund status
    const refundDetails = await flw.Transaction.fetch_refund({
      id: flutterwaveRefundId,
    });

    console.log("Flutterwave refund details:", refundDetails);

    if (refundDetails.status === "success") {
      // Create mock webhook payload
      const mockPayload = {
        event: "refund.completed",
        data: {
          id: parseInt(flutterwaveRefundId),
          status: refundDetails.data.status,
          transaction_ref: refundDetails.data.tx_ref,
          amount: refundDetails.data.amount_refunded,
          created_at: refundDetails.data.created_at,
          flw_ref: refundDetails.data.flw_ref,
        },
      };

      // Process it
      const mockReq = {
        body: mockPayload,
        headers: {
          "verif-hash": process.env.FLW_WEBHOOK_HASH,
        },
      };

      const mockRes = {
        status: (code) => ({
          send: (msg) => console.log(`Retry response: ${code} - ${msg}`),
          json: (data) => console.log(`Retry response: ${code} -`, data),
        }),
      };

      await flutterwaveWebhook(mockReq, mockRes);

      res.json({
        success: true,
        message: "Webhook retry initiated",
        flutterwaveStatus: refundDetails.data.status,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Could not fetch refund details from Flutterwave",
      });
    }
  } catch (error) {
    console.error("Webhook retry error:", error);
    res.status(500).json({
      message: "Webhook retry failed",
      error: error.message,
    });
  }
};

export const checkRefundStatus = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const refund = order.refunds.id(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }
    
    res.json({
      refundId: refund._id,
      status: refund.status,
      flutterwaveRefundId: refund.flutterwaveRefundId,
      flw_ref: refund.flw_ref,
      amount: refund.amount,
      processedAt: refund.processedAt,
      flutterwaveResponse: refund.flutterwaveResponse,
    });
  } catch (error) {
    console.error("Check refund status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const pollRefundStatus = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const refund = order.refunds.id(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    // Only poll if status is Processing and we have a Flutterwave refund ID
    if (refund.status === "Processing" && refund.flutterwaveRefundId) {
      try {
        // Fetch refund status from Flutterwave
        const refundDetails = await flw.Transaction.fetch_refund({
          id: refund.flutterwaveRefundId,
        });

        console.log("Polling Flutterwave for refund status:", refundDetails);

        if (refundDetails.status === "success") {
          const flutterwaveStatus = refundDetails.data?.status?.toLowerCase();
          const isCompleted = flutterwaveStatus === "completed" || 
                             flutterwaveStatus === "successful";

          if (isCompleted && refund.status !== "Approved") {
            // Update to Approved
            refund.status = "Approved";
            refund.processedAt = new Date();
            
            // Update order totals
            order.totalRefunded = (order.totalRefunded || 0) + refund.amount;

            // Update order status
            const approvedRefunds = order.refunds.filter(
              (r) => r.status === "Approved"
            );
            if (approvedRefunds.length === order.products.length) {
              order.refundStatus = "Fully Refunded";
              order.status = "Refunded";
            } else if (approvedRefunds.length > 0) {
              order.refundStatus = "Partially Refunded";
              order.status = "Partially Refunded";
            }

            await order.save();

            // Send approval email
            const settings = await storeSettings.findOne();
            const formatter = new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: settings.currency,
            });
            
            await sendRefundApprovedEmail(order, refund, settings, formatter);

            return res.json({
              success: true,
              message: "Refund status updated to Approved",
              currentStatus: refund.status,
              updated: true,
            });
          }
        }
      } catch (pollError) {
        console.error("Polling error:", pollError);
        // Don't fail, just return current status
      }
    }

    res.json({
      success: true,
      message: "No update needed",
      currentStatus: refund.status,
      updated: false,
    });
  } catch (error) {
    console.error("Poll refund status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Add to refund.controller.js
export const fixStuckRefunds = async (req, res) => {
  try {
    console.log("🔧 Starting manual fix for stuck refunds...");
    
    // Find all orders with Processing refunds that have flutterwaveRefundId
    const orders = await Order.find({
      "refunds.status": "Processing",
      "refunds.flutterwaveRefundId": { $exists: true, $ne: null }
    });

    console.log(`📊 Found ${orders.length} orders with Processing refunds`);

    let fixedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const order of orders) {
      for (const refund of order.refunds) {
        if (refund.status === "Processing" && refund.flutterwaveRefundId) {
          try {
            console.log(`🔍 Checking refund: ${refund._id}, Flutterwave ID: ${refund.flutterwaveRefundId}`);
            
            // 1. Try to fetch status from Flutterwave
            let flutterwaveStatus = null;
            try {
              const refundDetails = await flw.Transaction.fetch_refund({
                id: refund.flutterwaveRefundId,
              });
              
              if (refundDetails.status === "success") {
                flutterwaveStatus = refundDetails.data?.status?.toLowerCase();
                console.log(`✅ Flutterwave status: ${flutterwaveStatus}`);
              }
            } catch (fwError) {
              console.log(`⚠️ Could not fetch from Flutterwave: ${fwError.message}`);
            }

            // 2. Check stored flutterwaveResponse for completion
            const storedStatus = refund.flutterwaveResponse?.status?.toLowerCase();
            const isCompleted = 
              flutterwaveStatus === 'completed' || 
              flutterwaveStatus === 'successful' ||
              storedStatus === 'completed' ||
              storedStatus === 'successful';

            if (isCompleted) {
              // Update to Approved
              refund.status = "Approved";
              refund.processedAt = new Date();
              
              // Update order totals
              order.totalRefunded = (order.totalRefunded || 0) + refund.amount;

              // Update order status
              const approvedRefunds = order.refunds.filter(
                (r) => r.status === "Approved"
              );
              if (approvedRefunds.length === order.products.length) {
                order.refundStatus = "Fully Refunded";
                order.status = "Refunded";
              } else if (approvedRefunds.length > 0) {
                order.refundStatus = "Partially Refunded";
                order.status = "Partially Refunded";
              }

              await order.save();
              
              // Send approval email
              const settings = await storeSettings.findOne();
              const formatter = new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: settings.currency,
              });
              
              await sendRefundApprovedEmail(order, refund, settings, formatter);
              
              fixedCount++;
              results.push({
                orderId: order._id,
                refundId: refund._id,
                orderNumber: order.orderNumber,
                amount: refund.amount,
                status: "Fixed → Approved",
                flutterwaveStatus: flutterwaveStatus || storedStatus,
              });
              
              console.log(`✅ Fixed refund ${refund._id} for order ${order.orderNumber}`);
            } else {
              console.log(`⏳ Refund ${refund._id} still processing at Flutterwave`);
              results.push({
                orderId: order._id,
                refundId: refund._id,
                orderNumber: order.orderNumber,
                amount: refund.amount,
                status: "Still Processing",
                flutterwaveStatus: flutterwaveStatus || storedStatus,
              });
            }
          } catch (error) {
            console.error(`❌ Error fixing refund ${refund._id}:`, error.message);
            failedCount++;
          }
        }
      }
    }

    console.log(`✅ Fix complete: ${fixedCount} fixed, ${failedCount} failed`);
    
    res.json({
      success: true,
      message: `Fixed ${fixedCount} refunds, ${failedCount} failed`,
      totalChecked: orders.length,
      fixedCount,
      failedCount,
      results,
    });

  } catch (error) {
    console.error("❌ Fix stuck refunds error:", error);
    res.status(500).json({ 
      message: "Server error fixing refunds", 
      error: error.message 
    });
  }
};




