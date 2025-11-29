// import Order from "../models/order.model.js";
// import axios from "axios";
// import { sendEmail } from "../lib/mailer.js";

// //  Generate a consistent fallback ID for deleted products
// const getDeletedProductId = (p, orderId) => {
//   return `deleted-${orderId}-${p.name?.replace(/\s+/g, "_")?.trim()}-${
//     p.price
//   }`;
// };

// export const requestRefund = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { productId, quantity, reason } = req.body;
//     const user = req.user;

//     if (!reason?.trim()) {
//       return res.status(400).json({ message: "Refund reason is required." });
//     }

//     const order = await Order.findById(orderId)
//       .populate("products.product")
//       .populate("user", "firstname lastname email");
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     const allowedStatuses = ["Delivered", "Partially Refunded", "Refunded"];
//     if (!allowedStatuses.includes(order.status)) {
//       return res.status(400).json({
//         message: "Refunds are only allowed for delivered or refunded orders",
//       });
//     }

//     // Consistent helper for deleted product IDs
//     const getDeletedProductId = (p) => {
//       const safeName = (p.name || p.product?.name || "")
//         .trim()
//         .replace(/\s+/g, "_");
//       const price = p.price || p.product?.price || 0;
//       return `deleted-${orderId}-${safeName}-${price}`;
//     }; 

//     // Find product (even if deleted)
//     const product = order.products.find(
//       (p) =>
//         p.product?._id?.toString() === productId ||
//         getDeletedProductId(p) === productId
//     );

//     if (!product) {
//       return res
//         .status(400)
//         .json({ message: "This item was not part of your original order." });
//     }

//     if (quantity > product.quantity || quantity <= 0) {
//       return res.status(400).json({ message: "Invalid refund quantity." });
//     }

//     // Create consistent refundKey
//     const refundKey =
//       product.product?._id?.toString() || getDeletedProductId(product);

//     //  STRONG duplicate check
//     const duplicateRefund = order.refunds.some((r) => {
//       const existingKey =
//         r.product?.toString() ||
//         r.productSnapshot?._id ||
//         getDeletedProductId(r.productSnapshot || {});
//       return existingKey === refundKey;
//     });

//     if (duplicateRefund) {
//       return res
//         .status(400)
//         .json({ message: "Refund already requested for this product." });
//     }

//     // Create product snapshot
//     const snapshot = {
//       _id: refundKey,
//       name: product.product?.name || product.name || "Deleted Product",
//       image:
//         product.product?.images?.[0] || product.image || "/images/deleted.png",
//       price: product.product?.price || product.price || 0,
//     };

//     // Calculate refund amount
//     const refundAmount = snapshot.price * quantity;

//     // Push refund
//     order.refunds.push({
//       product: product.product?._id || null,
//       quantity,
//       amount: refundAmount,
//       reason,
//       productSnapshot: snapshot,
//       status: "Pending",
//     });

//     order.refundStatus =
//       order.refunds.length === order.products.length
//         ? "Full Refund Requested"
//         : "Partial Refund Requested";

//     await order.save({ validateBeforeSave: false });

//     // Respond immediately so the client isn't blocked by email delivery
//     res.status(200).json({
//       success: true,
//       message: "Refund requested successfully",
//       order,
//     });

//     // Send notification email in background (fire-and-forget)
//     (async () => {
//       try {
//         const emailContent = `
//           <h2>Refund Request Received</h2>
//           <p>Hi ${order.user?.firstname || "Customer"},</p>
//           <p>We’ve received your refund request for the following item:</p>
//           <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0; border-radius: 8px;">
//             <img src="${snapshot.image}" alt="${
//           snapshot.name
//         }" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>
//             <p><strong>Product:</strong> ${snapshot.name}</p>
//             <p><strong>Quantity:</strong> ${quantity}</p>
//             <p><strong>Refund Amount:</strong> ₦${refundAmount.toLocaleString()}</p>
//           </div>
//           <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
//     <p><strong>Refund Reference ID:</strong></p>
//     <p style="font-size: 15px; font-weight: bold; color: #2c5aa0; background: white; padding: 10px; border-radius: 5px;">
//       ${order.refunds[order.refunds.length - 1]._id}
//     </p>
//     <p><strong>Keep this ID for your records</strong></p>
//   </div>
//           <p>Our team will review your request and an agent will visit to inspect the item.</p>
//           <p><strong>Important:</strong> Please make sure the item is in its original condition and packaging.</p>
//           <p>This process usually takes up to <b>7 working days</b>.</p>
//           <p>We’ll notify you once your request is approved or rejected.</p>
//           <br />
//           <p>Thank you for shopping with us!</p>
//         `;

//         await sendEmail({
//           to: order.user.email,
//           subject: "Refund Request Received",
//           html: emailContent,
//         });
//       } catch (emailErr) {
//         console.error("Background refund request email failed:", emailErr);
//       }
//     })();
//   } catch (err) {
//     console.error("Refund request error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// /**
//  *  ADMIN: View all refund requests
//  */

// export const getAllRefundRequests = async (req, res) => {
//   try {
//     const orders = await Order.find({ "refunds.0": { $exists: true } })
//       .populate("user", "firstname lastname email")
//       .populate("refunds.product", "name images price")
//       .sort({ createdAt: -1 });

//     const refunds = orders.flatMap((order) =>
//       order.refunds.map((refund) => {
//         const productData = refund.product || {};
//         const snapshot = refund.productSnapshot || {};

//         return {
//           orderId: order._id,
//           user: order.user,
//           orderNumber: order.orderNumber,
//           refundId: refund._id,
//           productId: refund.product?._id || snapshot._id,
//           productName: productData.name || snapshot.name || "Deleted Product",
//           productImage:
//             productData.images?.[0] || snapshot.image || "/images/deleted.png",
//           productPrice: productData.price || snapshot.price || 0,
//           quantity: refund.quantity,
//           amount: refund.amount,
//           reason: refund.reason,
//           status: refund.status,
//           requestedAt: refund.requestedAt,
//           processedAt: refund.processedAt,
//         };
//       })
//     );

//     res.status(200).json(refunds);
//   } catch (err) {
//     console.error("Error fetching refund requests:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// /**
//  *  ADMIN: Approve Refund (Flutterwave API)
//  */
// export const approveRefund = async (req, res) => {
//   try {
//     const { orderId, refundId } = req.params;

//     const order = await Order.findById(orderId).populate("user", "firstname lastname email");
//     const productImages = await Order.findById(orderId).populate(
//       "products",
//       "image"
//     );
//     if (!order) return res.status(404).json({ message: "Order not found" });

    

//     const refund = order.refunds.id(refundId);
//     if (!refund) return res.status(404).json({ message: "Refund not found" });

//     if (refund.status !== "Pending")
//       return res.status(400).json({ message: "Refund already processed" });

//     // Approve refund
//     refund.status = "Approved";
//     refund.processedAt = Date.now();
    
//     order.totalRefunded = (order.totalRefunded || 0) + refund.amount;


//     // Save updated refund state to DB
//     const approvedRefunds = order.refunds.filter(
//       (r) => r.status === "Approved"
//     ).length;
//     order.refundStatus =
//       approvedRefunds === order.products.length
//         ? "Fully Refunded"
//         : "Partial Refunded";

//     if (order.refundStatus === "Fully Refunded") {
//       order.status = "Refunded";
//     } else if (order.refundStatus === "Partial Refunded") {
//       order.status = "Partially Refunded";
//     }

//     await order.save({ validateBeforeSave: false });

//     // Respond quickly so admin UI isn't blocked by external calls
//     res.status(200).json({
//       success: true,
//       message: "Refund approved successfully",
//       refund,
//     });
// const productSnapshot = refund.productSnapshot || {};
// const productName = productSnapshot.name || "Deleted Product";
// const productImage = productSnapshot.image || "/images/deleted.png";
// const productPrice = productSnapshot.price || 0;
//     // Fire-and-forget: call Flutterwave refund API and send email in background
//     (async () => {
//       try {
//         const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
//         const transactionId = order.flutterwaveTransactionId;

//         if (transactionId) {
//           try {
//             await axios.post(
//               "https://api.flutterwave.com/v3/refunds",
//               { transaction_id: transactionId, amount: refund.amount },
//               {
//                 headers: {
//                   Authorization: `Bearer ${FLW_SECRET_KEY}`,
//                   "Content-Type": "application/json",
//                 },
//                 timeout: 15000,
//               }
//             );
//           } catch (fwErr) {
//             console.error(
//               "Flutterwave refund failed (background):",
//               fwErr?.response?.data || fwErr
//             );
//           }
//         } else {
//           console.log("Skipping Flutterwave refund: no transaction ID");
//         }

//         try {
//           await sendEmail({
//             to: order.user?.email,
//             subject: `Refund Approved — ${order.orderNumber}`,
//             html: `
//     <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//       <h2 style="color: #2c3e50;">Refund Approved</h2>
//       <p>Dear ${order.user?.firstname || "Customer"},</p>
//       <p>Your refund request has been <strong>approved</strong> for the following item:</p>
//       <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0; border-radius: 8px;">
//             <img src="${
//              productImage
//             }"  style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>
//             <p><strong>Product:</strong> ${productName }</p>
//             <p><strong>Refund ID:</strong> ${refund._id}</p>
//             <p><strong>Quantity:</strong> ${refund.quantity}</p>
//             <p><strong>Refund Amount:</strong> ₦${refund.amount.toLocaleString()}</p>
//           </div>
//       <p>Our delivery agent has confirmed the item collection. Your refund will be processed to your original payment method within <strong>3–7 working days</strong>.</p>
//       <p>Thank you for your patience and trust.</p>
//       <p>Best regards,<br/><strong>Eco Store Support Team</strong></p>
//     </div>
//   `,
//           });
//         } catch (emailErr) {
//           console.error("Background refund approval email failed:", emailErr);
//         }
//       } catch (bgErr) {
//         console.error("Background approveRefund tasks failed:", bgErr);
//       }
//     })();
//   } catch (err) {
//     console.error("Approve refund error:", err.response?.data || err);
//     res.status(500).json({ message: "Failed to approve refund" });
//   }
// };

// /**
//  *  ADMIN: Reject Refund
//  */
// export const rejectRefund = async (req, res) => {
//   try {
//     const { orderId, refundId } = req.params;

//     // Find order with user populated
//     const order = await Order.findById(orderId).populate("user", "firstname lastname email");
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     const refund = order.refunds.id(refundId);
//     if (!refund) {
//       return res.status(404).json({ message: "Refund not found" });
//     }

//     if (refund.status !== "Pending") {
//       return res
//         .status(400)
//         .json({ message: "Refund has already been processed" });
//     }

//     // Update refund fields
//     refund.status = "Rejected";
//     refund.processedAt = new Date();

//     // Optionally update order refund status
//     const rejectedCount = order.refunds.filter(
//       (r) => r.status === "Rejected"
//     ).length;
//     order.refundStatus =
//       rejectedCount === order.refunds.length
//         ? "Fully Rejected"
//         : "Partially Rejected";

//     await order.save({ validateBeforeSave: false });

    

//     // Respond immediately so the admin UI isn't blocked by email delivery
//     res.status(200).json({
//       success: true,
//       message: "Refund rejected successfully",
//       refund,
//     });
//     const productSnapshot = refund.productSnapshot || {};
//     const productName = productSnapshot.name || "Deleted Product";
//     const productImage = productSnapshot.image || "/images/deleted.png";
//     const productPrice = productSnapshot.price || 0;

//     // Send rejection email in background
//     (async () => {
//       try {
//         await sendEmail({
//           to: order.user?.email,
//           subject: `Refund Denied — ${order.orderNumber}`,
//           html: `
//             <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//               <h2 style="color: #e74c3c;">Refund Request Rejected</h2>
//               <p>Dear ${order.user?.firstname || "Customer"},</p>
//               <p>We regret to inform you that your refund request for the following item has been <strong>rejected</strong> after review:</p>
//               <img src="${productImage}"  style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;"/>
//             <p><strong>Product:</strong> ${productName}</p>
//             <p><strong>Refund ID:</strong> ${refund._id}</p>
//             <p><strong>Quantity:</strong> ${refund.quantity}</p>
//             <p><strong>Refund Amount:</strong> ₦${refund.amount.toLocaleString()}</p>
//           </div>
//               <p>Reason for rejection may include product not being in original condition or policy violation. If you believe this was a mistake, please contact our support team.</p>
//               <p>Best regards,<br/><strong>Eco Store Support Team</strong></p>
//             </div>
//           `,
//         });
//       } catch (emailErr) {
//         console.error("Background rejection email failed:", emailErr);
//       }

//       console.log(`✅ Refund ${refund._id} rejected successfully.`);
//     })();
//   } catch (err) {
//     console.error("Reject refund error:", err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error rejecting refund" });
//   }
// };
// controllers/refund.controller.js
import Order from "../models/order.model.js";
import { flw } from "../lib/flutterwave.js";

// Request refund
export const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ 
        message: "Refunds can only be requested for delivered orders" 
      });
    }

    // Find the product in order
    let refundProduct = null;

    if (productId.startsWith("deleted-")) {
      order.products.forEach((p) => {
        const generatedId = `deleted-${orderId}-${p.name.replace(/\s+/g, "_")}-${p.price}`;
        if (generatedId === productId) {
          refundProduct = p;
        }
      });
    } else {
      order.products.forEach((p) => {
        if (p.product?.toString() === productId) {
          refundProduct = p;
        }
      });
    }

    if (!refundProduct) {
      return res.status(404).json({ message: "Product not found in order" });
    }

    const refundQuantity = Math.min(quantity || refundProduct.quantity, refundProduct.quantity);
    const refundAmount = refundProduct.price * refundQuantity;

    if (refundAmount < 100) {
      return res.status(400).json({
        message: "Refund amount must be at least ₦100",
      });
    }

    // Check for existing pending refund
    const existingRefund = order.refunds.find(refund => 
      refund.product?.toString() === refundProduct.product?.toString() && 
      refund.status === "Pending"
    );

    if (existingRefund) {
      return res.status(400).json({ 
        message: "Refund already pending for this product" 
      });
    }

    // Create refund entry
    const refundData = {
      product: refundProduct.product,
      quantity: refundQuantity,
      amount: refundAmount,
      reason: reason,
      status: "Pending",
      requestedAt: new Date(),
      productSnapshot: {
        name: refundProduct.name,
        image: refundProduct.image,
        price: refundProduct.price
      }
    };

    order.refunds.push(refundData);

    // Update order refund status
    const pendingRefunds = order.refunds.filter(r => r.status === "Pending");
    if (pendingRefunds.length === order.products.length) {
      order.refundStatus = "Full Refund Requested";
    } else if (pendingRefunds.length > 0) {
      order.refundStatus = "Partial Refund Requested";
    }

    await order.save();

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully"
    });

  } catch (error) {
    console.error("Refund request error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all refund requests for admin
export const getAllRefundRequests = async (req, res) => {
  try {
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

    res.json(allRefunds);

  } catch (error) {
    console.error("Get refunds error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Approve and process refund
export const approveRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const refund = order.refunds.id(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    if (refund.status !== "Pending") {
      return res.status(400).json({ 
        message: `Refund is already ${refund.status}` 
      });
    }
    if (refund.amount < 100) {
      return res.status(400).json({
        message:
          "Refund amount must be at least ₦100 (Flutterwave requirement)",
      });
    }
    // PROCESS THROUGH FLUTTERWAVE
    try {
      const refundData = {
        id: order.flutterwaveTransactionId, // Use transaction ID from order
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

        console.log("✅ Refund processed successfully in Flutterwave");

      } else {
        throw new Error(flutterwaveResponse.message || "Flutterwave refund failed");
      }

    } catch (flutterwaveError) {
      console.error("Flutterwave refund error:", flutterwaveError);
      
      refund.status = "Rejected";
      refund.processedAt = new Date();
      refund.errorDetails = flutterwaveError.message;
      
      await order.save();
      
      return res.status(400).json({
        message: "Flutterwave refund failed",
        error: flutterwaveError.message
      });
    }

    // Update order status
    order.totalRefunded = (order.totalRefunded || 0) + refund.amount;

    const approvedRefunds = order.refunds.filter(r => r.status === "Approved");
    if (approvedRefunds.length === order.products.length) {
      order.refundStatus = "Fully Refunded";
    } else if (approvedRefunds.length > 0) {
      order.refundStatus = "Partial Refunded";
    }

    await order.save();

    res.json({
      success: true,
      message: "Refund approved and processed successfully"
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

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const refund = order.refunds.id(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund request not found" });
    }

    refund.status = "Rejected";
    refund.processedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Refund rejected successfully"
    });

  } catch (error) {
    console.error("Reject refund error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
