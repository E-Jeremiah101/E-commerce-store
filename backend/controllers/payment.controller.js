// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import axios from "axios";
// import mongoose from "mongoose";
// import {
//   acquireWebhookLock,
//   releaseWebhookLock,
//   storeReservation,
//   getReservation,
//   deleteReservation,
//   storeReleasedReservation,
//   getReleasedReservation,
// } from "../lib/redis.js";
// import Coupon from "../models/coupon.model.js";
// import Order from "../models/order.model.js";
// import User from "../models/user.model.js";
// import Product from "../models/product.model.js";
// import { sendEmail } from "../lib/mailer.js";
// import { flw } from "../lib/flutterwave.js";
// import redis from "../lib/redis.js";
// import { calculateDeliveryFee } from "../service/deliveryConfig.js";
// import { calculateEstimatedDeliveryDate } from "../utils/deliveryCalculator.js";
// import storeSettings from "../models/storeSettings.model.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "../../.env") });

// async function reserveInventory(products, reservationId, timeoutMinutes = 4) {
//   const session = await mongoose.startSession();

//   try {
//     await session.withTransaction(async () => {
//       for (const item of products) {
//         if (!item._id) continue;

        

//         const product = await Product.findById(item._id).session(session);
//         if (!product) throw new Error(`Product ${item.name} not found`);

//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size
//               ? v.size === item.size
//               : !v.size || v.size === "" || v.size === "Standard";
//             const colorMatches = item.color
//               ? v.color === item.color
//               : !v.color || v.color === "" || v.color === "Standard";
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex === -1) {
//             throw new Error(
//               `Variant ${item.size || "Any"}/${
//                 item.color || "Any"
//               } not found for ${item.name}`
//             );
//           }

//           const variant = product.variants[variantIndex];
          
//           if (variant.countInStock < item.quantity) {
//             throw new Error(
//               `Only ${variant.countInStock} available, but ${item.quantity} requested`
//             );
//           }

//           variant.countInStock -= item.quantity;
//           variant.reserved = (variant.reserved || 0) + item.quantity;

//           product.countInStock = product.variants.reduce(
//             (total, v) => total + v.countInStock,
//             0
//           );
//         }

//         else {

//           if (product.countInStock < item.quantity) {
//             throw new Error(
//               `Only ${product.countInStock} available, but ${item.quantity} requested`
//             );
//           }

//           product.countInStock -= item.quantity;
//           product.reserved = (product.reserved || 0) + item.quantity;

//         }

//         await product.save({ session });
//       }
//     });

//     await storeReservation(reservationId, {
//       products,
//       createdAt: new Date(),
//       expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
//       timeoutMinutes: timeoutMinutes,
//     });

    
//     return true;
//   } catch (error) {
//     console.error("Reservation failed:", error);


//     try {
//       await releaseInventory(reservationId);
//     } catch (releaseError) {
//       console.error("Failed to release inventory after failure:", releaseError);
//     }

//     throw error;
//   } finally {
//     await session.endSession();
//   }
// }

// async function releaseInventory(reservationId) {

//   const alreadyReleased = await getReleasedReservation(reservationId);
//   if (alreadyReleased) {
//     return;
//   }


//   await releaseCoupon(reservationId);

//   const reservation = await getReservation(reservationId);
//   if (!reservation) {
//     return;
//   }

//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       for (const item of reservation.products) {
//         if (!item._id) continue;

//         const product = await Product.findById(item._id).session(session);
//         if (!product) {
          
//           continue;
//         }

//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size
//               ? v.size === item.size
//               : !v.size || v.size === "" || v.size === "Standard";
//             const colorMatches = item.color
//               ? v.color === item.color
//               : !v.color || v.color === "" || v.color === "Standard";
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex !== -1) {
//             const variant = product.variants[variantIndex];

//             const reservedToRelease = Math.min(
//               item.quantity,
//               variant.reserved || 0
//             );

//             if (reservedToRelease > 0) {
//               variant.countInStock += reservedToRelease;
//               variant.reserved = Math.max(
//                 0,
//                 (variant.reserved || 0) - reservedToRelease
//               );

//             } else {
//               console.log(
//                 ` No reserved stock to release for ${item.name} ${
//                   item.size || ""
//                 }/${item.color || ""}`
//               );
//             }

//             // Update total product stock
//             product.countInStock = product.variants.reduce(
//               (total, v) => total + v.countInStock,
//               0
//             );
//           }
//         } else {
//           // Simple product - add safety check
//           const reservedToRelease = Math.min(
//             item.quantity,
//             product.reserved || 0
//           );

//           if (reservedToRelease > 0) {
//             product.countInStock += reservedToRelease;
//             product.reserved = Math.max(
//               0,
//               (product.reserved || 0) - reservedToRelease
//             );
           
//           } else {
//             console.log(`No reserved stock to release for ${item.name}`);
//           }
//         }

//         await product.save({ session });
//       }
//     });

//     //  Mark this reservation as released to prevent duplicate processing
//     await storeReleasedReservation(reservationId, {
//       releasedAt: new Date(),
//       originalReservation: reservation,
//     });

//     // Remove the original reservation
//     await deleteReservation(reservationId);

//     console.log(` Successfully released reservation: ${reservationId}`);
//   } catch (error) {
//     console.error(" Release failed:", error);
//   } finally {
//     await session.endSession();
//   }
// }

// async function confirmInventory(reservationId) {
//   const reservation = await getReservation(reservationId);
//   if (!reservation) {
//     console.log(`No reservation found to confirm: ${reservationId}`);
//     return;
//   }

  

//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       for (const item of reservation.products) {
//         if (!item._id) continue;

//         const product = await Product.findById(item._id).session(session);
//         if (!product) continue;

//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size
//               ? v.size === item.size
//               : !v.size || v.size === "" || v.size === "Standard";
//             const colorMatches = item.color
//               ? v.color === item.color
//               : !v.color || v.color === "" || v.color === "Standard";
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex !== -1) {
//             const variant = product.variants[variantIndex];

          
//             variant.reserved = Math.max(
//               0,
//               (variant.reserved || 0) - item.quantity
//             );

//           } else {
//             console.log(
//               ` Variant not found for confirmation: ${item.name} ${
//                 item.size || ""
//               }/${item.color || ""}`
//             );
//           }
//         } else {

//           product.reserved = Math.max(
//             0,
//             (product.reserved || 0) - item.quantity
//           );

//         }

//         await product.save({ session });
//       }
//     });

//     await deleteReservation(reservationId);
//   } catch (error) {
//     console.error(" Confirmation failed:", error);
//     throw error;
//   } finally {
//     await session.endSession();
//   }
// }

// async function releaseCheckoutResources(reservationId) {
//   if (!reservationId) return;

//   try {
//     console.log(`🔄 Releasing checkout resources for: ${reservationId}`);


//     await releaseCoupon(reservationId);

//     await releaseInventory(reservationId);

//     console.log(` Successfully released all resources for: ${reservationId}`);
//   } catch (error) {
//     console.error(" Error releasing checkout resources:", error);
//   }
// }
// setInterval(async () => {

//   try {
//     const keys = await redis.keys("reservation:*");

//     let releasedCount = 0;
//     let expiredButStuckCount = 0;

//     const activeReservationIds = new Set();
//     for (const key of keys) {
//       const reservationId = key.replace("reservation:", "");
//       activeReservationIds.add(reservationId);

//       const reservationData = await getReservation(reservationId);
//       if (reservationData) {
//         const now = new Date();
//         const expiresAt = new Date(reservationData.expiresAt);

//         // If reservation has expired, release it
//         if (now > expiresAt) {
          
//           try {
//             await releaseInventory(reservationId);
//             releasedCount++;
//           } catch (error) {
//             console.error(` Failed to release ${reservationId}:`, error);
//           }
//         } else {
//           const ttl = Math.floor((expiresAt - now) / 1000);
//         }
//       }
//     }

//     // ONLY check for stuck reservations that are NOT in Redis
//     const stuckProducts = await Product.find({
//       $or: [{ reserved: { $gt: 0 } }, { "variants.reserved": { $gt: 0 } }],
//     });

//     for (const product of stuckProducts) {
//       let needsFix = false;

//       // Check if  product has any active Redis reservations
//       const hasActiveReservation = await checkProductHasActiveReservation(
//         product,
//         activeReservationIds
//       );

//       if (!hasActiveReservation) {
//         // Only fix reservations that don't have active Redis entries
//         if (product.reserved > 0) {

//           product.countInStock += product.reserved;
//           product.reserved = 0;
//           needsFix = true;
//         }

//         // Check variants
//         if (product.variants && product.variants.length > 0) {
//           product.variants.forEach((variant, index) => {
//             if (variant.reserved > 0) {
//               product.variants[index].countInStock += variant.reserved;
//               product.variants[index].reserved = 0;
//               needsFix = true;
//             }
//           });
//         }
//       }

//       if (needsFix) {
//         await product.save();
//         expiredButStuckCount++;
//         console.log(`Fixed STUCK reservations for ${product.name}`);
//       }
//     }

//     if (releasedCount > 0 || expiredButStuckCount > 0) {
//     } else {
//       console.log(" No expired or stuck reservations found");
//     }

//     const expiredCoupons = await Coupon.updateMany(
//       {
//         isReserved: true,
//         reservationExpiresAt: { $lt: new Date() },
//         usedAt: null,
//       },
//       {
//         isReserved: false,
//         reservationId: null,
//         reservationExpiresAt: null,
//       }
//     );

//     if (expiredCoupons.modifiedCount > 0) {
//       console.log(
//         ` Released ${expiredCoupons.modifiedCount} expired coupon reservations`
//       );
//     }
//   } catch (error) {
//     console.error(" Error in reservation cleanup:", error);
//   }
// }, 300000);
// async function reserveCoupon(
//   userId,
//   couponCode,
//   reservationId,
//   timeoutMinutes = 4
// ) {
//   if (!couponCode || !couponCode.trim()) return null;

//   const couponCodeUpper = couponCode.trim().toUpperCase();
//   const session = await mongoose.startSession();

//   try {
//     await session.withTransaction(async () => {
//       const coupon = await Coupon.findOne({
//         code: couponCodeUpper,
//         userId: userId,
//         isActive: true,
//         expirationDate: { $gt: new Date() },
//         usedAt: null,
//         isReserved: false, 
//       }).session(session);

//       if (!coupon) {
//         throw new Error(`Coupon ${couponCode} not available`);
//       }

//       coupon.isReserved = true;
//       coupon.reservationId = reservationId;
//       coupon.reservationExpiresAt = new Date(
//         Date.now() + timeoutMinutes * 60 * 1000
//       );

//       await coupon.save({ session });
//     });

//     return true;
//   } catch (error) {
//     console.error(" Coupon reservation failed:", error);
//     throw error;
//   } finally {
//     await session.endSession();
//   }
// }

// async function releaseCoupon(reservationId) {
//   try {
//     const coupon = await Coupon.findOneAndUpdate(
//       {
//         reservationId: reservationId,
//         isReserved: true,
//         usedAt: null,
//       },
//       {
//         isReserved: false,
//         reservationId: null,
//         reservationExpiresAt: null,
//       },
//       { new: true }
//     );

//     if (coupon) {
//       console.log(
//         ` Coupon ${coupon.code} released from reservation `
//       );
//     }
//   } catch (error) {
//     console.error(" Error releasing coupon:", error);
//   }
// }

// async function confirmCouponUsage(userId, couponCode, orderNumber) {
//   if (!couponCode || !couponCode.trim()) return null;

//   const couponCodeUpper = couponCode.trim().toUpperCase();

//   try {
//     const usedCoupon = await Coupon.findOneAndUpdate(
//       {
//         code: couponCodeUpper,
//         userId: userId,
//         isActive: true,
//         isReserved: true,
//         usedAt: null,
//       },
//       {
//         isActive: false,
//         isReserved: false,
//         usedAt: new Date(),
//         usedInOrder: orderNumber,
//         reservationId: null,
//         reservationExpiresAt: null,
//       },
//       { new: true }
//     );

//     if (usedCoupon) {
//       console.log(
//         ` Coupon ${couponCode} confirmed as used for order ${orderNumber}`
//       );
//       return usedCoupon;
//     }
//     return null;
//   } catch (error) {
//     console.error(" Error confirming coupon usage:", error);
//     return null;
//   }
// }

// async function checkProductHasActiveReservation(product, activeReservationIds) {
//   return activeReservationIds.size > 0;
// }

// async function checkCouponEligibility(userId, orderAmount) {
//   try {

//     const existingActiveCoupons = await Coupon.find({
//       userId: userId,
//       isActive: true,
//       expirationDate: { $gt: new Date() },
//       usedAt: null,
//     });

//     if (existingActiveCoupons.length > 0) {
     
//       return null;
//     }

//     const orderCount = await Order.countDocuments({
//       user: userId,
//       flutterwaveTransactionId: { $exists: true, $ne: null },
//     });

//     const hasReceivedFirstOrderCoupon = await Coupon.exists({
//       userId: userId,
//       couponReason: "first_order",
//     });

   
//     if (orderCount === 0 && !hasReceivedFirstOrderCoupon) {
      
//       return {
//         discountPercentage: 2,
//         codePrefix: "WELCOME",
//         reason: "first_order",
//         emailType: "welcome_coupon",
//       };
//     }

//     const highValueThreshold = 300000;

//     if (orderAmount > highValueThreshold) {
      
//       return {
//         discountPercentage: 10,
//         codePrefix: "BIGSPEND",
//         reason: "high_value_order",
//         emailType: "bigspender_coupon",
//       };
//     }

//     return null;
//   } catch (error) {
//     console.error(" Error checking coupon eligibility:", error);
//     return null;
//   }
// }

// async function createNewCoupon(userId, options = {}) {
//   const {
//     discountPercentage = 10,
//     daysValid = 30,
//     reason = "first_order",
//   } = options;

//   try {
//     console.log(` Creating coupon, reason: ${reason}`);

//     await Coupon.updateMany(
//       {
//         userId: userId,
//         isActive: true,
//         usedAt: null, 
//       },
//       {
//         isActive: false,
//         deactivatedAt: new Date(),
//         deactivationReason: `Replaced by new ${reason} coupon`,
//       }
//     );

//     let codePrefix = "GIFT";
//     if (reason === "first_order") {
//       codePrefix = "WELCOME";
//     } else if (reason === "high_value_order") {
//       codePrefix = "BIGSPEND";
//     }

//     let newCode;
//     let isUnique = false;
//     let attempts = 0;
//     const maxAttempts = 5;

//     while (!isUnique && attempts < maxAttempts) {
//       attempts++;
//       const randomSuffix = Math.random()
//         .toString(36)
//         .substring(2, 8)
//         .toUpperCase();
//       newCode = `${codePrefix}${randomSuffix}`;

//       const existingCoupon = await Coupon.findOne({ code: newCode });
//       if (!existingCoupon) {
//         isUnique = true;
//       } else if (attempts >= maxAttempts) {
//         throw new Error(
//           "Failed to generate unique coupon code after multiple attempts"
//         );
//       }
//     }

//     console.log(` Generated coupon code: ${newCode} for ${reason}`);

//     const coupon = new Coupon({
//       code: newCode,
//       discountPercentage,
//       expirationDate: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
//       userId: userId,
//       couponReason: reason,
//       isActive: true,
//     });

//     await coupon.save();

//     console.log(
//       ` Successfully created coupon: ${coupon.code} `
//     );
//     return coupon;
//   } catch (error) {
//     console.error(" Failed to create coupon:", error);
//     return null;
//   }
// }

// function generateOrderNumber() {
//   return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
// }

// function createPaymentMethodData(flutterwaveData) {
//   const paymentType = flutterwaveData.payment_type || "card";

//   return {
//     method: paymentType,
//     status: "PAID",
//     card: {
//       brand: flutterwaveData.card?.brand || "Unknown",
//       last4: flutterwaveData.card?.last_4digits || null,
//       exp_month: flutterwaveData.card?.exp_month || null,
//       exp_year: flutterwaveData.card?.exp_year || null,
//       type: flutterwaveData.card?.type || null,
//       issuer: flutterwaveData.card?.issuer || null,
//     },
//   };
// }

// async function processOrderCreation(transactionData) {
//   const {
//     transaction_id,
//     tx_ref,
//     data,
//     meta,
//     userId,
//     parsedProducts,
//     couponCode,
//     reservationId,
//   } = transactionData;

//   const existingOrder = await Order.findOne({
//     $or: [
//       { flutterwaveTransactionId: transaction_id },
//       { flutterwaveRef: tx_ref },
//     ],
//   });

//   if (existingOrder) {
//     console.log(` ORDER ALREADY EXISTS: ${existingOrder.orderNumber}`);
//     return { order: existingOrder, isNew: false };
//   }

//   try {
  

//     const user = await User.findById(userId);
//     if (!user) throw new Error("User not found");

//     const products = parsedProducts.map((p) => ({
//       product: p._id,
//       name: p.name || "Unknown Product",
//       image: (p.images && p.images[0]) || "/placeholder.png",
//       quantity: p.quantity || 1,
//       price: p.price || 0,
//       selectedSize: p.size || "",
//       selectedColor: p.color || "",
//       selectedCategory: p.category || "",
//     }));

//     const order = new Order({
//       user: user._id,
//       products,
//       subtotal: Number(meta.originalTotal) || Number(data.amount) || 0,
//       discount: Number(meta.discountAmount) || 0,
//       deliveryFee: Number(meta.deliveryFee) || 0,
//       deliveryZone: meta.deliveryZone || "Same City",
//       estimatedDeliveryDate: calculateEstimatedDeliveryDate(
//         meta.deliveryZone || "Same City"
//       ).estimatedDeliveryDate,
//       totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
//       orderNumber: generateOrderNumber(),
//       couponCode: couponCode || null,
//       coupon: couponCode
//         ? {
//             code: couponCode,
//             discount: Number(meta.discountAmount) || 0,
//           }
//         : undefined,
//       deliveryAddress: meta.deliveryAddress || "No address provided",
//       phone: meta.phoneNumber || "No phone provided",
//       flutterwaveRef: tx_ref,
//       flutterwaveTransactionId: transaction_id,
//       paymentStatus: "paid",
//       status: "Pending",
//       paymentMethod: createPaymentMethodData(data),
//       isProcessed: false,
//     });

//     await order.save();

//     if (reservationId) {
//       await confirmInventory(reservationId);
//     }

//     if (couponCode?.trim()) {
//       await confirmCouponUsage(userId, couponCode, order.orderNumber);
//     }
//     await User.findByIdAndUpdate(userId, { cartItems: [] });

//     return { order, isNew: true };
//   } catch (error) {


//     if (error.code === 11000) {

//       const existingOrder = await Order.findOne({
//         $or: [
//           { flutterwaveTransactionId: transaction_id },
//           { flutterwaveRef: tx_ref },
//         ],
//       });

//       if (existingOrder) {
//         console.log(` Found existing order: ${existingOrder.orderNumber}`);
//         return { order: existingOrder, isNew: false };
//       }
//     }

//     console.error(` ORDER CREATION FAILED:`, error);
//     throw error;
//   }
// }

// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { products, couponCode, deliveryAddress, deliveryFee, deliveryZone } =
//       req.body;
//     const userId = req.user._id;

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ error: "Invalid or empty products array" });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const defaultPhone =
//       user.phones?.find((p) => p.isDefault) || user.phones?.[0];
//     const defaultAddress =
//       user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

//     const addressString = defaultAddress
//       ? (defaultAddress.address && defaultAddress.address.trim()) ||
//         `${defaultAddress.landmark ? defaultAddress.landmark + ", " : ""}${
//           defaultAddress.lga ? defaultAddress.lga + ", " : ""
//         }${defaultAddress.city ? defaultAddress.city + ", " : ""}${
//           defaultAddress.state || ""
//         }`.trim()
//       : "";

//     if (!defaultPhone?.number?.trim() || !addressString) {
//       return res.status(400).json({
//         error: "You must add a phone number and address before checkout.",
//       });
//     }

//     try {
//       for (const item of products) {
//         if (!item._id) continue;

//         const product = await Product.findById(item._id);
//         if (!product) {
//           throw new Error(`Product ${item.name} not found`);
//         }

//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size
//               ? v.size === item.size
//               : !v.size || v.size === "" || v.size === "Standard";
//             const colorMatches = item.color
//               ? v.color === item.color
//               : !v.color || v.color === "" || v.color === "Standard";
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex === -1) {
//             throw new Error(
//               `Variant ${item.size || "Any"}/${
//                 item.color || "Any"
//               } not found for ${item.name}`
//             );
//           }

//           const variant = product.variants[variantIndex];

//           if (variant.countInStock < item.quantity) {
//             throw new Error(
//               ` ${item.name} ${item.size || ""}/${
//                 item.color || ""
//               }, is out of stock, please update you cart`
//             );
//           }
//         }
 
//         else {

//           if (product.countInStock < item.quantity) {
//             throw new Error(
//               `Only ${product.countInStock} available for ${item.name}, but ${item.quantity} requested`
//             );
//           }
//         }
//       }
//     } catch (availabilityError) {
//       console.error(" Availability check failed:", availabilityError.message);
//       return res.status(400).json({
//         error: availabilityError.message,
//       });
//     }
//     let calculatedDeliveryFee = 0;
//     let finalDeliveryFee = 0;

//     if (deliveryAddress && deliveryAddress.state) {

//       if (deliveryFee !== undefined && deliveryFee !== null) {
//         calculatedDeliveryFee = Number(deliveryFee);
//       } else {
        
//         calculatedDeliveryFee = calculateDeliveryFee(
//           deliveryAddress.state,
//           deliveryAddress.city || "",
//           deliveryAddress.lga || ""
//         );
//       }
//     }

//     const originalTotal = products.reduce((acc, p) => {
//       const qty = p.quantity || 1;
//       const price = Number(p.price) || 0;
//       return acc + price * qty;
//     }, 0);

//     let discountAmount = 0;
//     let validCoupon = null;

//     if (couponCode && couponCode.trim() !== "") {
//       try {
//         const couponCodeUpper = couponCode.trim().toUpperCase();

//         validCoupon = await Coupon.findOne({
//           code: couponCodeUpper,
//           userId: userId,
//           isActive: true,
//           expirationDate: { $gt: new Date() },
//           usedAt: null,
//           isReserved: false, 
//         });

//         if (validCoupon) {
//           discountAmount = Math.round(
//             (originalTotal * validCoupon.discountPercentage) / 100
//           );

//         } else {

//         }
//       } catch (error) {
//         console.error("Error validating coupon:", error);
//       }
//     }
//     finalDeliveryFee = calculatedDeliveryFee;


//     const finalTotal = Math.max(
//       0,
//       originalTotal - discountAmount + finalDeliveryFee
//     );
//     const tx_ref = `ECOSTORE-${Date.now()}`;

//     const reservationId = `res_${tx_ref}`;
//     try {
//       await reserveInventory(products, reservationId, 25);


//       if (validCoupon) {
//         await reserveCoupon(userId, couponCode, reservationId, 25);
//       }
//     } catch (reservationError) {
//       console.error(" Inventory reservation failed:", reservationError);

      
//       try {
//         await releaseInventory(reservationId);
//         await releaseCoupon(reservationId);
//       } catch (releaseError) {
//         console.error("Failed to release after failure:", releaseError);
//       }

//       return res.status(400).json({
//         error:
//           "Some items in your cart are no longer available. Please refresh your cart and try again.",
//       });
//     }

//     if (validCoupon) {
//       console.log(`   Coupon Details: ${validCoupon.discountPercentage}% off`);
//     }

//     const payload = {
//       tx_ref,
//       amount: finalTotal,
//       currency: "NGN",
//       redirect_url: `${process.env.CLIENT_URL}/purchase-success`,
//       customer: {
//         email: user.email,
//         phonenumber: defaultPhone.number,
//         firstname: user.firstname || "",
//         lastname: user.lastname || "",
//         name:
//           (user.firstname || "") + (user.lastname ? ` ${user.lastname}` : ""),
//       },
//       payment_options: "card, banktransfer",
//       meta: {
//         userId: userId.toString(),
//         products: JSON.stringify(
//           products.map((p) => ({
//             _id: p._id || p.id || null,
//             name: p.name,
//             images: p.images || [],
//             quantity: p.quantity || 1,
//             price: p.price,
//             size: p.size || null,
//             color: p.color || null,
//             category: p.category || null,
//           }))
//         ),
//         couponCode: couponCode || "",
//         originalTotal,
//         discountAmount,
//         deliveryFee: finalDeliveryFee,
//         deliveryZone: deliveryZone || "",
//         finalTotal,
//         deliveryAddress: addressString || "",
//         phoneNumber: defaultPhone.number || "",
//         reservationId: reservationId,
//       },
//       customizations: {
//         title: "EcoStore Purchase",
//         description: "Payment for items in your cart",
//         logo: process.env.STORE_LOGO || "https://yourstore.com/logo.png",
//       },
//     };

//     const response = await axios.post(
//       "https://api.flutterwave.com/v3/payments",
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
//           "Content-Type": "application/json",
//         },
//         timeout: 20000,
//       }
//     );

//     const link =
//       response?.data?.data?.link || response?.data?.data?.authorization_url;

//     if (!link) {
//       await releaseCheckoutResources(reservationId);
//       console.error("No payment link returned by Flutterwave:", response.data);
//       return res.status(500).json({ message: "Failed to initialize payment" });
//     }

//     return res.status(200).json({ link, tx_ref });
//   } catch (err) {
//     console.error("Error initializing Flutterwave payment:", err);
//     return res.status(500).json({
//       message: "Payment initialization failed",
//       error: err?.message || String(err),
//     });
//   }
// };

// export const handleFlutterwaveWebhook = async (req, res) => {
//   let transaction_id;
//   let lockAcquired = false;
//   let reservationId;

//   try {
//     const signature = req.headers["verif-hash"];

//     if (!signature) {
//       console.warn("Missing verif-hash header");
//       return res.status(401).send("Missing signature");
//     }

//     if (signature !== process.env.FLW_WEBHOOK_HASH) {
//       console.warn("Invalid webhook signature - possible forgery attempt");
//       return res.status(401).send("Invalid signature");
//     }


//     const event = req.body;
//     if (!event) {
//       console.warn("Empty webhook event body");
//       return res.status(400).send("No event body");
//     }


//     const paymentCompletionEvents = [
//       "charge.completed",
//       "transfer.completed",
//       "bank_transfer.completed",
//     ];

//     if (!paymentCompletionEvents.includes(event.event)) {
//       console.log(
//         `Ignoring non-payment-completion webhook event: ${event.event}`
//       );
//       return res.status(200).send("Ignored event type");
//     }

    
//     transaction_id = event.data?.id; 
//     const tx_ref = event.data?.tx_ref;
//     const status = event.data?.status;
//     const paymentType = event.data?.payment_type;
//     reservationId = event.data?.meta?.reservationId;

//     if (paymentType === "banktransfer" || paymentType === "bank_transfer") {
//       const isBankTransferSuccessful =
//         status === "successful" ||
//         status === "success" ||
//         status === "completed" ||
//         status === "credited";
//       if (!isBankTransferSuccessful) {
//         console.log(
//           `Bank transfer not successful: ${status} for ${event.data?.tx_ref}`
//         );

//         const reservationId = event.data?.meta?.reservationId;
//         if (reservationId) {
//           await releaseCheckoutResources(reservationId);
//         }

//         return res.status(200).send("Bank transfer not completed");
//       }
//     } else {
      
//       if (status !== "successful") {
//         console.log(
//           `Payment failed: ${status} for ${event.data?.tx_ref}`
//         );

//         const reservationId = event.data?.meta?.reservationId;
//         if (reservationId) {
//           await releaseCheckoutResources(reservationId);
//         }

//         return res.status(200).send("Payment not successful");
//       }
//     }

//     if (!transaction_id) {
//       console.error("No transaction_id in webhook data");
//       return res.status(400).send("Missing transaction_id");
//     }

//     console.log(
//       ` ENTERING ORDER PROCESSING - Source: ${
//         req.path
//       }, TX: ${transaction_id}, Time: ${new Date().toISOString()}`
//     );

//     console.log(`Processing transaction: ${transaction_id}, status: ${status}`);

//     lockAcquired = await acquireWebhookLock(transaction_id, 45000);

//     if (!lockAcquired) {
//       console.log(`Webhook already being processed: ${transaction_id}`);
//       return res.status(200).send("Webhook already being processed");
//     }
   
//     const existingOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//     });

//     if (existingOrder) {
//       console.log(
//         ` DUPLICATE: Order ${existingOrder.orderNumber} already exists`
//       );

//       if (reservationId) {
//         await releaseCheckoutResources(reservationId);
//       }

//       return res.status(200).send("Order already processed");
//     }

//     if (status !== "successful") {
//       console.log(`Payment not successful: ${status} for ${tx_ref}`);

//       const reservationId = event.data?.meta?.reservationId;
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       return res.status(200).send("Payment not successful");
//     }

//     console.log(`Processing webhook for successful payment: ${tx_ref}`);

//     let data;

//     const verifyResp = await flw.Transaction.verify({ id: transaction_id });

//     if (!verifyResp?.data || verifyResp.data.status !== "successful") {
//       console.error(`Webhook verification failed for: ${transaction_id}`);

//       if (reservationId) {
//         await releaseCheckoutResources(reservationId);
//       }

//       return res.status(400).send("Payment verification failed");
//     }

//     data = verifyResp.data;
 

//     const meta_data = data.meta || event.meta_data || {};

//     const deliveryFee = Number(meta_data.deliveryFee) || 0;
//     const deliveryZone = meta_data.deliveryZone || "";

//     let parsedProducts = [];
//     if (meta_data.products) {
//       try {
//         if (typeof meta_data.products === "string") {
//           parsedProducts = JSON.parse(meta_data.products);
//         } else {
//           parsedProducts = meta_data.products;
//         }
//         parsedProducts = parsedProducts.map((p) => ({
//           _id: p._id || p.id || null,
//           name: p.name,
//           images: p.images || [],
//           quantity: p.quantity || 1,
//           price: p.price,
//           size: p.size || null,
//           color: p.color || null,
//           category: p.category || null,
//         }));
//       } catch (error) {
//         console.error("Error parsing products:", error);
//         parsedProducts = [];
//       }
//     }

//     let userId = meta_data.userId;
//     const couponCode = meta_data.couponCode || "";
//     reservationId = meta_data.reservationId || reservationId;
//     const originalTotal =
//       Number(meta_data.originalTotal) || Number(data.amount) || 0;
//     const discountAmount = Number(meta_data.discountAmount) || 0;
//     const finalTotal = Number(meta_data.finalTotal) || Number(data.amount) || 0;
//     const deliveryAddress = meta_data.deliveryAddress || "";
//     const phoneNumber = data.customer?.phone_number || "";


//     if (!userId) {
//       console.error("Missing userId in webhook data");

//       if (reservationId) {
//         await releaseCheckoutResources(reservationId);
//       }

//       return res.status(400).send("Missing userId");
//     }

//     const finalDuplicateCheck = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//     });

//     if (finalDuplicateCheck) {
//       console.log(
//         `LATE DUPLICATE: Order ${finalDuplicateCheck.orderNumber} created during processing`
//       );

//       if (reservationId) {
//         await releaseCheckoutResources(reservationId);
//       }

//       return res.status(200).send("Order already processed");
//     }

//     const session = await mongoose.startSession();

//     try {
//       await session.withTransaction(async () => {
//         const transactionData = {
//           transaction_id,
//           tx_ref,
//           data,
//           meta: {
//             userId: userId,
//             products: meta_data.products,
//             couponCode: couponCode,
//             originalTotal: originalTotal,
//             discountAmount: discountAmount,
//             deliveryFee: deliveryFee,
//             deliveryZone: deliveryZone,
//             finalTotal: finalTotal,
//             deliveryAddress: deliveryAddress || "No address provided",
//             phoneNumber:
//               data.customer?.phone_number || phoneNumber || "No phone number",
//           },
//           userId,
//           parsedProducts,
//           couponCode,
//           reservationId,
//         };

//         const { order, isNew } = await processOrderCreation(transactionData);

//         console.log(
//           `${isNew ? "Created new" : "Updated existing"} order: ${
//             order.orderNumber
//           } for user: ${userId}`
//         );

//         if (isNew) {
//           try {
//             console.log(`STARTING COUPON PROCESS FOR USER: ${userId}`);
//             const couponEligibility = await checkCouponEligibility(
//               userId,
//               order.totalAmount
//             );

//             if (couponEligibility) {
//               console.log(
//                 `User eligible for ${couponEligibility.reason} coupon`
//               );
//               const newCoupon = await createNewCoupon(userId, {
//                 discountPercentage: couponEligibility.discountPercentage,
//                 couponType: couponEligibility.codePrefix,
//                 reason: couponEligibility.reason,
//                 daysValid: 30,
//               });

//               if (newCoupon && newCoupon.isActive) {
//                 console.log(
//                   `Successfully created ACTIVE coupon: ${newCoupon.code}`
//                 );
//                 try {
//                   const user = await User.findById(userId);
//                   if (user && user.email) {
//                     await sendCouponEmail({
//                       to: user.email,
//                       coupon: newCoupon,
//                       couponType: couponEligibility.emailType,
//                     });
//                     console.log(`Coupon email sent for: ${newCoupon.code}`);
//                   }
//                 } catch (emailErr) {
//                   console.error("Coupon email send failed:", emailErr);
//                 }
//               }
//             }
//           } catch (error) {
//             console.error("Coupon creation failed:", error);
//           }

//           try {
//             const user = await User.findById(userId);
//             if (user && user.email) {
//               await sendDetailedOrderEmail({
//                 to: user.email,
//                 order,
//                 flutterwaveData: data,
//               });
//             }
//           } catch (emailErr) {
//             console.error("Email send failed (webhook):", emailErr);
//           }
//         } 
//       });

//     } catch (transactionError) {
//       console.error("Transaction failed:", transactionError);

//       if (reservationId) {
//         await releaseCheckoutResources(reservationId);
//       }

//       throw transactionError;
//     } finally {
//       await session.endSession();
//     }

//     return res.status(200).send("Order processed successfully");
//   } catch (err) {
//     console.error(`Webhook processing error:`, err);

//     if (reservationId) {
//       await releasereleaseCheckoutResourcesInventory(reservationId);
//     }

//     return res.status(500).send("Webhook processing failed");
//   } finally {

//     if (lockAcquired && transaction_id) {
//       await releaseWebhookLock(transaction_id);
      
//     }
//   }
// };

// async function withRetry(fn, retries = 3, delay = 200) {
//   for (let attempt = 1; attempt <= retries; attempt++) {
//     try {
//       return await fn();
//     } catch (err) {
//       const transient =
//         err?.codeName === "WriteConflict" ||
//         (err?.errorLabels &&
//           err.errorLabels.includes("TransientTransactionError"));

//       if (transient && attempt < retries) {
//         console.warn(`Transient error, retrying ${attempt}/${retries}...`);
//         await new Promise((r) => setTimeout(r, delay * attempt));
//         continue;
//       }
//       throw err;
//     }
//   }
// }

// export const checkoutSuccess = async (req, res) => {
//   let lockAcquired = false;
//   const { tx_ref, transaction_id } = req.body;

//   if (!transaction_id) {
//     return res.status(400).json({
//       error: "transaction_id is required",
//       received: req.body,
//     });
//   }


//   try {
//     const existingPaidOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//       paymentStatus: "paid",
//     });

//     if (existingPaidOrder) {
//       console.log(
//         `CheckoutSuccess: Order already processed: ${existingPaidOrder.orderNumber}`
//       );
//       return res.status(200).json({
//         success: true,
//         message: "Order already processed",
//         orderId: existingPaidOrder._id,
//         orderNumber: existingPaidOrder.orderNumber,
//       });
//     }

//     lockAcquired = await acquireWebhookLock(transaction_id, 30000);
//     if (!lockAcquired) {
//       console.log(
//         `checkoutSuccess: Lock already acquired for ${transaction_id}`
//       );

//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const orderNow = await Order.findOne({
//         $or: [
//           { flutterwaveTransactionId: transaction_id },
//           { flutterwaveRef: tx_ref },
//         ],
//         paymentStatus: "paid",
//       });

//       if (orderNow) {
//         return res.status(200).json({
//           success: true,
//           orderId: orderNow._id,
//           orderNumber: orderNow.orderNumber,
//         });
//       }

//       return res.status(200).json({
//         success: false,
//         message: "Please wait a moment and refresh the page",
//       });
//     }

//     const verifyResp = await flw.Transaction.verify({ id: transaction_id });
//     const data = verifyResp?.data;

//     if (!data || data.status !== "successful") {
//       return res.status(400).json({ error: "Payment verification failed" });
//     }

//     const meta = data.meta || {};
//     const userId = meta.userId;
//     const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
//     const couponCode = meta.couponCode || "";
//     const reservationId = meta.reservationId;

//     if (!userId) {
//       return res
//         .status(400)
//         .json({ error: "Missing userId in payment metadata" });
//     }

//     let finalOrder;
//     let isNewOrder = false;

//     await withRetry(async () => {
//       const session = await mongoose.startSession();

//       try {
//         await session.withTransaction(async () => {
//           const transactionData = {
//             transaction_id,
//             tx_ref,
//             data,
//             meta,
//             userId,
//             parsedProducts,
//             couponCode,
//             reservationId,
//           };

//           const { order, isNew } = await processOrderCreation(transactionData);
//           finalOrder = order;
//           isNewOrder = isNew; 

//           if (isNew) {    
            
//             const couponEligibility = await checkCouponEligibility(
//               userId,
//               finalOrder.totalAmount
//             );
//             if (couponEligibility) {
//               const newCoupon = await createNewCoupon(userId, {
//                 discountPercentage: couponEligibility.discountPercentage,
//                 couponType: couponEligibility.codePrefix,
//                 reason: couponEligibility.reason,
//                 daysValid: 30,
//               }); 

//               if (newCoupon) {
//                 try {
//                   const user = await User.findById(userId);
//                   if (user && user.email) {
//                     await sendCouponEmail({
//                       to: user.email,
//                       coupon: newCoupon,
//                       couponType: couponEligibility.emailType,
//                       orderCount: await Order.countDocuments({
//                         user: userId,
//                         paymentStatus: "paid",
//                       }),
//                     });
//                   }
//                 } catch (emailErr) {
//                   console.error("Coupon email send failed:", emailErr);
//                 }
//               }
//             }

//             try {
//               const user = await User.findById(userId);
//               await sendDetailedOrderEmail({
//                 to: user.email,
//                 order,
//                 flutterwaveData: data,
//               });
//             } catch (emailErr) {
//               console.error("Email send failed (checkoutSuccess):", emailErr);
//             }
//           } else {
//             console.log(
//               `Skipping email for existing order: ${order.orderNumber}`
//             );
//           }
//         });
//       } finally {
//         await session.endSession();
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Payment verified and order finalized",
//       orderId: finalOrder._id,
//       orderNumber: finalOrder.orderNumber,
//       estimatedDeliveryDate: finalOrder.estimatedDeliveryDate,
//       isNew: isNewOrder,
//     });
//   } catch (error) {
//     console.error("checkoutSuccess failed:", error);

//     const reservationId = req.body.meta?.reservationId;
//     if (reservationId) {
//       await releaseCheckoutResources(reservationId);
//     }

//     return res.status(500).json({
//       error: error.message || "Checkout failed",
//     });
//   } finally {

//     if (lockAcquired) {
//       await releaseWebhookLock(transaction_id);
//     }
//   }
// };

// export const sendDetailedOrderEmail = async ({ to, order }) => {
//   if (!to || !order) return;

//   let customerName = "";
//   try {
//     const userDoc = await User.findById(order.user).select(
//       "firstname lastname"
//     );
//     if (userDoc) {
//       customerName =
//         userDoc.firstname || userDoc.lastname || order.user?.name || "Customer";
//     }
//   } catch (err) {
//     console.error("Error fetching user name for email:", err);
//   }

//   const paymentMethod = order.paymentMethod || {};
//   const tx_ref = order.flutterwaveRef || "N/A";
//   const transaction_id = order.flutterwaveTransactionId || "N/A";
//   const payment_type = paymentMethod.method || "N/A";
//   const settings = await storeSettings.findOne();
//   const formatter = new Intl.NumberFormat(undefined, {
//     style: "currency",
//     currency: settings.currency,
//   });

//   const items = order.products || order.items || [];

//   const productRows = items
//     .map((item) => {
//       let details = "";
//       if (item.selectedSize) details += `Size: ${item.selectedSize} `;
//       if (item.selectedColor) details += `| Color: ${item.selectedColor}`;

//       return `
//         <tr>
//           <td style="padding: 8px 12px; border:1px solid #eee;">
//           <p display:block; margin-top: 1; margin-bottom:1>${
//             item.name || item.productName || "Item"
//           }</p>
//             <img src="${item.image}" alt="${
//         item.name
//       }" width="60" height="60" style="border-radius: 6px; object-fit: cover;" />
           
//             ${
//               details
//                 ? `<br/><small style="color:#666;">${details || ""}</small>`
//                 : ""
//             }
//           </td>
//           <td style="padding: 8px 12px; text-align:center; border:1px solid #eee;">${
//             item.quantity || 1
//           }</td>
//           <td style="padding: 8px 12px; text-align:right; border:1px solid #eee;">${formatter.format(
//             item.price || item.unitPrice || 0
//           )}
            
//           </td>
//         </tr>`;
//     })
//     .join("");

//   const totalAmount = order.totalAmount || order.totalPrice || order.total || 0;
//   const subtotal = order.subtotal || order.subTotal || 0;
//   const discount = order.discount || 0;

//   const html = `
//     <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px;">
//       <div style="max-width: 700px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);">
//         <div style="background: #10b981; padding: 22px; text-align: center; color: #fff;">
//           <img src="${settings?.logo}" alt="${
//     settings?.storeName
//   }" style="max-height:50px; display:block; margin: 0 auto 8px;" />
//           <h1 style="margin:0; font-size:20px;">Order Confirmation</h1>
//           <div style="margin-top:6px; font-size:15px;">${
//             order.orderNumber || "N/A"
//           }</div>
//         </div>

//         <div style="padding: 22px; color:#333;">
//           <p style="margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
//           <p style="margin:0 0 16px;">Thank you for your order! We've received your payment and are now processing your purchase. Below are your order details.</p>

//           <h3 style="margin:18px 0 8px;"> Order Summary</h3>
//           <table style="width:100%; border-collapse: collapse; margin-top:8px;">
//             <thead>
//               <tr style="background:#f7faf7;">
//                 <th style="padding:10px; text-align:left; border:1px solid #eee;">Product</th>
//                 <th style="padding:10px; text-align:center; border:1px solid #eee;">Qty</th>
//                 <th style="padding:10px; text-align:right; border:1px solid #eee;">Price</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${
//                 productRows ||
//                 `<tr><td colspan="3" style="padding:12px;text-align:center;color:#777;">No items listed</td></tr>`
//               }
//             </tbody>
//           </table>
//           <p style="margin-top: 20px; font-size: 16px;">
//             <strong>Original Subtotal:</strong> ${formatter.format(
//               subtotal
//             )} <br>
//                     ${
//                       discount > 0
//                         ? `
                  
//                       <strong>Coupon Discount:</strong> - ${formatter.format(
//                         discount
//                       )}
                   
//           `
//                         : ""
//                     }<br>
//             <strong>Delivery Fee:</strong> ${formatter.format(
//               order.deliveryFee
//             )}<br>
//             <strong>Final Total:</strong> ${formatter.format(totalAmount)}
//           </p>

//           <p style="margin:0;">
//             <strong>Address:</strong> ${
//               order.deliveryAddress || "No address provided"
//             }<br/>
//             <strong>Phone:</strong> ${order.phone || "No phone provided"}<br/>
//             <strong>Email:</strong> ${to}
//           </p>

//           <h3 style="margin:18px 0 8px;"> Payment Details</h3>
//           <p style="margin:0 0 6px;">
//             <strong>Payment Status:</strong> ${
//               order.paymentStatus || "Confirmed"
//             }<br/>
//             <strong>Payment Type:</strong> ${payment_type}<br/>
//             <strong>Transaction Ref:</strong> ${tx_ref}<br/>
//             <strong>Transaction ID:</strong> ${transaction_id}
//           </p>


//           <p style="margin-top:20px; color:#555;">We'll send another email once your order ships.</p>

          
//         </div>

//         <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
//           <p style="margin: 0 0 10px 0;"><p style="margin-top:18px;">Thanks for choosing <strong> ${
//             settings?.storeName
//           }</strong> </p>
//           <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
//             settings?.supportEmail
//           }" 
//              style="color: #10b981; text-decoration: none;">${
//                settings?.supportEmail
//              }</a></p>
//         </div>
//       </div>
//     </div>
//   `;

  
//   const text = [
//     `EcoStore — Order Confirmation`,
//     ` ${order.orderNumber || "N/A"}`,
//     `Customer: ${customerName}`,
//     `Total: ${formatter.format(totalAmount)}`,
//     `Delivery Address: ${order.deliveryAddress || "No address provided"}`,
//     `Phone: ${order.phone || "No phone provided"}`,
//     `Payment Status: ${order.paymentStatus || "Confirmed"}`,
//     `Payment Type: ${payment_type}`,
//     `Transaction Ref: ${tx_ref}`,
//     `Transaction ID: ${transaction_id}`,
//     ``,
//     `Items:`,
//     ...items.map(
//       (it) =>
//         ` - ${it.quantity || 1} x ${it.name || "Item"} — ${formatter.format(
//           it.price
//         )}`
//     ),
//     ``,
//     `Thanks for shopping with  ${settings?.storeName}!`,
//   ].join("\n");


//   await sendEmail({
//     to,
//     subject: ` ${settings?.storeName} — Order Confirmation ${
//       order.orderNumber || "N/A"
//     }`,
//     html,
//     text,
//   });
// };

// export const sendCouponEmail = async ({
//   to,
//   coupon,
//   couponType = "welcome_coupon", 
// }) => {
//   if (!to || !coupon) return;
//   const settings = await storeSettings.findOne();

//   let subject = "";
//   let title = "";
//   let message = "";
//   let couponValue = `${coupon.discountPercentage}% OFF`;

//   if (couponType === "welcome_coupon") {
//     subject = `🎉 Welcome to ${settings.storeName}! Here's Your ${couponValue} Welcome Gift`;
//     title = `Welcome to ${settings.storeName}!`;
//     message = `
//       <p>Welcome to our eco-friendly community! As a thank you for your first order, 
//       we're giving you a special welcome discount for your next purchase.</p>
//       <p>We hope you enjoyed your first experience with us and look forward to serving you again!</p>
//     `;
//   } else if (couponType === "bigspender_coupon") {
//     subject = `💎 Thank You! ${couponValue} Reward for Your Generous Order`;
//     title = "Thank You for Your Generous Purchase!";
//     message = `
//       <p>We truly appreciate your generous order! Your support helps us continue 
//       our mission of providing eco-friendly products.</p>
//       <p>As a token of our appreciation, please enjoy this special discount on your next purchase.</p>
//     `;
//   } else {
//     subject = `🎁 Special ${couponValue} Gift from ${settings.storeName}`;
//     title = "Here's a Special Gift For You!";
//     message = `
//       <p>Thank you for being a valued ${settings.storeName} customer!</p>
//       <p>Enjoy this discount on your next purchase of eco-friendly products.</p>
//     `;
//   }

//   const html = `
//     <div style="font-family: Arial, sans-serif; background-color: #f0f9f4; padding: 20px;">
//       <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
//         <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #fff;">
//           <img src="${settings?.logo}" alt="${
//     settings.storeName
//   } Logo" style="max-height: 50px; display:block; margin: 0 auto 15px;" />
//           <h1 style="margin:0; font-size: 28px; font-weight: bold;">${title}</h1>
//           <div style="margin-top: 10px; font-size: 18px; opacity: 0.9;">Your Exclusive Discount Awaits!</div>
//         </div>

//         <div style="padding: 30px; color:#333;">
//           ${message}

//           <!-- Coupon Code Box -->
//           <div style="background: linear-gradient(135deg, #fffbeb, #fed7aa); border: 2px dashed #d97706; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
//             <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">YOUR DISCOUNT CODE</div>
//             <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 3px; margin: 10px 0;">
//               ${coupon.code}
//             </div>
//             <div style="font-size: 20px; color: #dc2626; font-weight: bold; margin: 8px 0;">
//               ${couponValue}
//             </div>
//             <div style="font-size: 14px; color: #92400e;">
//               Valid until: ${new Date(
//                 coupon.expirationDate
//               ).toLocaleDateString()}
//             </div>
//           </div>

//           <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="margin:0 0 12px 0; color: #1e293b;">✨ How to Use Your Coupon:</h3>
//             <ol style="margin: 0; padding-left: 20px; color: #475569;">
//               <li>Shop your favorite eco-friendly products</li>
//               <li>Proceed to checkout</li>
//               <li>Enter code <strong style="color: #ea580c;">${
//                 coupon.code
//               }</strong> in the coupon field</li>
//               <li>Enjoy your ${
//                 coupon.discountPercentage
//               }% discount instantly!</li>
//             </ol>
//           </div>

//           <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 25px;">
//             This coupon is exclusively for you and cannot be transferred.
//           </p>

//           <div style="text-align: center; margin-top: 30px;">
//             <a href="${process.env.CLIENT_URL}" 
//                style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
//               🛍️ Start Shopping Now
//             </a>
//           </div>
//         </div>

//         <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
//           <p style="margin: 0 0 10px 0;">Thank you for choosing sustainable shopping with ${
//             settings.storeName
//           }</p>
//           <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
//             settings.supportEmail
//           }" 
//              style="color: #10b981; text-decoration: none;">${
//                settings.supportEmail
//              }</a></p>
//         </div>
//       </div>
//     </div>
//   `;

//   const text = `
// ${title}

// ${message.replace(/<[^>]*>/g, "").trim()}

// YOUR DISCOUNT CODE: ${coupon.code}
// DISCOUNT: ${couponValue}
// VALID UNTIL: ${new Date(coupon.expirationDate).toLocaleDateString()}

// How to Use:
// 1. Shop your favorite eco-friendly products
// 2. Proceed to checkout
// 3. Enter code ${coupon.code} in the coupon field
// 4. Enjoy your ${coupon.discountPercentage}% discount instantly!

// Shop now: ${process.env.CLIENT_URL}

// This coupon is exclusively for you and cannot be transferred.

// Thank you for choosing sustainable shopping with ${settings.storeName}
//   `.trim();

//   await sendEmail({
//     to,
//     subject,
//     html,
//     text,
//   });
// };
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import axios from "axios";
import mongoose from "mongoose";
import {
  acquireWebhookLock,
  releaseWebhookLock,
  storeReservation,
  getReservation,
  deleteReservation,
  storeReleasedReservation,
  getReleasedReservation,
} from "../lib/redis.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import { sendEmail } from "../lib/mailer.js";
import { flw } from "../lib/flutterwave.js";
import redis from "../lib/redis.js";
import { calculateDeliveryFee } from "../service/deliveryConfig.js";
import { calculateEstimatedDeliveryDate } from "../utils/deliveryCalculator.js";
import storeSettings from "../models/storeSettings.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });
const INVENTORY_RESERVATION_TIMEOUT_MINUTES = 25;

async function reserveInventory(
  products,
  reservationId,
  timeoutMinutes = INVENTORY_RESERVATION_TIMEOUT_MINUTES
) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) throw new Error(`Product ${item.name} not found`);

        if (item.size || item.color) {
          const variantIndex = product.variants.findIndex((v) => {
            const sizeMatches = item.size
              ? v.size === item.size
              : !v.size || v.size === "" || v.size === "Standard";
            const colorMatches = item.color
              ? v.color === item.color
              : !v.color || v.color === "" || v.color === "Standard";
            return sizeMatches && colorMatches;
          });

          if (variantIndex === -1) {
            throw new Error(
              `Variant ${item.size || "Any"}/${
                item.color || "Any"
              } not found for ${item.name}`
            );
          }

          const variant = product.variants[variantIndex];

          if (variant.countInStock < item.quantity) {
            throw new Error(
              `Only ${variant.countInStock} available, but ${item.quantity} requested`
            );
          }

          variant.countInStock -= item.quantity;
          variant.reserved = (variant.reserved || 0) + item.quantity;

          product.countInStock = product.variants.reduce(
            (total, v) => total + v.countInStock,
            0
          );
        } else {
          if (product.countInStock < item.quantity) {
            throw new Error(
              `Only ${product.countInStock} available, but ${item.quantity} requested`
            );
          }

          product.countInStock -= item.quantity;
          product.reserved = (product.reserved || 0) + item.quantity;
        }

        await product.save({ session });
      }
    });

    await storeReservation(reservationId, {
      products,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
      timeoutMinutes: timeoutMinutes,
    });

    return true;
  } catch (error) {
    console.error("Reservation failed:", error);

    try {
      await releaseInventory(reservationId);
    } catch (releaseError) {
      console.error("Failed to release inventory after failure:", releaseError);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}

async function releaseInventory(reservationId) {
  const alreadyReleased = await getReleasedReservation(reservationId);
  if (alreadyReleased) {
    return;
  }

  await releaseCoupon(reservationId);

  const reservation = await getReservation(reservationId);
  if (!reservation) {
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) {
          continue;
        }

        if (item.size || item.color) {
          const variantIndex = product.variants.findIndex((v) => {
            const sizeMatches = item.size
              ? v.size === item.size
              : !v.size || v.size === "" || v.size === "Standard";
            const colorMatches = item.color
              ? v.color === item.color
              : !v.color || v.color === "" || v.color === "Standard";
            return sizeMatches && colorMatches;
          });

          if (variantIndex !== -1) {
            const variant = product.variants[variantIndex];

            const reservedToRelease = Math.min(
              item.quantity,
              variant.reserved || 0
            );

            if (reservedToRelease > 0) {
              variant.countInStock += reservedToRelease;
              variant.reserved = Math.max(
                0,
                (variant.reserved || 0) - reservedToRelease
              );
            } else {
              console.log(
                ` No reserved stock to release for ${item.name} ${
                  item.size || ""
                }/${item.color || ""}`
              );
            }

            product.countInStock = product.variants.reduce(
              (total, v) => total + v.countInStock,
              0
            );
          }
        } else {
          const reservedToRelease = Math.min(
            item.quantity,
            product.reserved || 0
          );

          if (reservedToRelease > 0) {
            product.countInStock += reservedToRelease;
            product.reserved = Math.max(
              0,
              (product.reserved || 0) - reservedToRelease
            );
          } else {
            console.log(`No reserved stock to release for ${item.name}`);
          }
        }

        await product.save({ session });
      }
    });

    await storeReleasedReservation(reservationId, {
      releasedAt: new Date(),
      originalReservation: reservation,
    });

    await deleteReservation(reservationId);

    console.log(` Successfully released reservation: ${reservationId}`);
  } catch (error) {
    console.error(" Release failed:", error);
  } finally {
    await session.endSession();
  }
}

async function confirmInventory(reservationId) {
  const reservation = await getReservation(reservationId);
  if (!reservation) {
    console.log(`No reservation found to confirm: ${reservationId}`);
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) continue;

        if (item.size || item.color) {
          const variantIndex = product.variants.findIndex((v) => {
            const sizeMatches = item.size
              ? v.size === item.size
              : !v.size || v.size === "" || v.size === "Standard";
            const colorMatches = item.color
              ? v.color === item.color
              : !v.color || v.color === "" || v.color === "Standard";
            return sizeMatches && colorMatches;
          });

          if (variantIndex !== -1) {
            const variant = product.variants[variantIndex];

            variant.reserved = Math.max(
              0,
              (variant.reserved || 0) - item.quantity
            );
          } else {
            console.log(
              ` Variant not found for confirmation: ${item.name} ${
                item.size || ""
              }/${item.color || ""}`
            );
          }
        } else {
          product.reserved = Math.max(
            0,
            (product.reserved || 0) - item.quantity
          );
        }

        await product.save({ session });
      }
    });

    await deleteReservation(reservationId);
  } catch (error) {
    console.error(" Confirmation failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}

async function releaseCheckoutResources(reservationId) {
  if (!reservationId) return;

  try {
    console.log(` Releasing checkout resources for: ${reservationId}`);

    await releaseCoupon(reservationId);

    await releaseInventory(reservationId);

    console.log(` Successfully released all resources for: ${reservationId}`);
  } catch (error) {
    console.error(" Error releasing checkout resources:", error);
  }
}
setInterval(async () => {
  try {
    const keys = await redis.keys("reservation:*");

    let releasedCount = 0;
    let expiredButStuckCount = 0;

    const activeReservationIds = new Set();
    for (const key of keys) {
      const reservationId = key.replace("reservation:", "");
      activeReservationIds.add(reservationId);

      const reservationData = await getReservation(reservationId);
      if (reservationData) {
        const now = new Date();
        const expiresAt = new Date(reservationData.expiresAt);

        if (now > expiresAt) {
          try {
            await releaseInventory(reservationId);
            releasedCount++;
          } catch (error) {
            console.error(` Failed to release ${reservationId}:`, error);
          }
        } else {
          const ttl = Math.floor((expiresAt - now) / 1000);
        }
      }
    }

    const stuckProducts = await Product.find({
      $or: [{ reserved: { $gt: 0 } }, { "variants.reserved": { $gt: 0 } }],
    });

    for (const product of stuckProducts) {
      let needsFix = false;

      const hasActiveReservation = await checkProductHasActiveReservation(
        product,
        activeReservationIds
      );

      if (!hasActiveReservation) {
        if (product.reserved > 0) {
          product.countInStock += product.reserved;
          product.reserved = 0;
          needsFix = true;
        }

        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant, index) => {
            if (variant.reserved > 0) {
              product.variants[index].countInStock += variant.reserved;
              product.variants[index].reserved = 0;
              needsFix = true;
            }
          });
        }
      }

      if (needsFix) {
        await product.save();
        expiredButStuckCount++;
        console.log(`Fixed STUCK reservations for ${product.name}`);
      }
    }

    if (releasedCount > 0 || expiredButStuckCount > 0) {
    } else {
      console.log(" No expired or stuck reservations found");
    }

    const expiredCoupons = await Coupon.updateMany(
      {
        isReserved: true,
        reservationExpiresAt: { $lt: new Date() },
        usedAt: null,
      },
      {
        isReserved: false,
        reservationId: null,
        reservationExpiresAt: null,
      }
    );

    if (expiredCoupons.modifiedCount > 0) {
      console.log(
        ` Released ${expiredCoupons.modifiedCount} expired coupon reservations`
      );
    }
  } catch (error) {
    console.error(" Error in reservation cleanup:", error);
  }
}, 300000);
async function reserveCoupon(
  userId,
  couponCode,
  reservationId,
  timeoutMinutes = INVENTORY_RESERVATION_TIMEOUT_MINUTES
) {
  if (!couponCode || !couponCode.trim()) return null;

  const couponCodeUpper = couponCode.trim().toUpperCase();
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const coupon = await Coupon.findOne({
        code: couponCodeUpper,
        userId: userId,
        isActive: true,
        expirationDate: { $gt: new Date() },
        usedAt: null,
        isReserved: false,
      }).session(session);

      if (!coupon) {
        throw new Error(`Coupon ${couponCode} not available`);
      }

      coupon.isReserved = true;
      coupon.reservationId = reservationId;
      coupon.reservationExpiresAt = new Date(
        Date.now() + timeoutMinutes * 60 * 1000
      );

      await coupon.save({ session });
    });

    return true;
  } catch (error) {
    console.error(" Coupon reservation failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}

async function releaseCoupon(reservationId) {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      {
        reservationId: reservationId,
        isReserved: true,
        usedAt: null,
      },
      {
        isReserved: false,
        reservationId: null,
        reservationExpiresAt: null,
      },
      { new: true }
    );

    if (coupon) {
      console.log(` Coupon ${coupon.code} released from reservation `);
    }
  } catch (error) {
    console.error(" Error releasing coupon:", error);
  }
}

async function confirmCouponUsage(userId, couponCode, orderNumber) {
  if (!couponCode || !couponCode.trim()) return null;

  const couponCodeUpper = couponCode.trim().toUpperCase();

  try {
    const usedCoupon = await Coupon.findOneAndUpdate(
      {
        code: couponCodeUpper,
        userId: userId,
        isActive: true,
        isReserved: true,
        usedAt: null,
      },
      {
        isActive: false,
        isReserved: false,
        usedAt: new Date(),
        usedInOrder: orderNumber,
        reservationId: null,
        reservationExpiresAt: null,
      },
      { new: true }
    );

    if (usedCoupon) {
      console.log(
        ` Coupon ${couponCode} confirmed as used for order ${orderNumber}`
      );
      return usedCoupon;
    }
    return null;
  } catch (error) {
    console.error(" Error confirming coupon usage:", error);
    return null;
  }
}

async function checkProductHasActiveReservation(product, activeReservationIds) {
  return activeReservationIds.size > 0;
}

async function checkCouponEligibility(userId, orderAmount) {
  try {
    const existingActiveCoupons = await Coupon.find({
      userId: userId,
      isActive: true,
      expirationDate: { $gt: new Date() },
      usedAt: null,
    });

    if (existingActiveCoupons.length > 0) {
      return null;
    }

    const orderCount = await Order.countDocuments({
      user: userId,
      flutterwaveTransactionId: { $exists: true, $ne: null },
    });

    const hasReceivedFirstOrderCoupon = await Coupon.exists({
      userId: userId,
      couponReason: "first_order",
    });

    if (orderCount === 0 && !hasReceivedFirstOrderCoupon) {
      return {
        discountPercentage: 2,
        codePrefix: "WELCOME",
        reason: "first_order",
        emailType: "welcome_coupon",
      };
    }

    const highValueThreshold = 300000;

    if (orderAmount > highValueThreshold) {
      return {
        discountPercentage: 10,
        codePrefix: "BIGSPEND",
        reason: "high_value_order",
        emailType: "bigspender_coupon",
      };
    }

    return null;
  } catch (error) {
    console.error(" Error checking coupon eligibility:", error);
    return null;
  } 
}

async function createNewCoupon(userId, options = {}) {
  const {
    discountPercentage = 10,
    daysValid = 30,
    reason = "first_order",
  } = options;

  try {
    console.log(` Creating coupon, reason: ${reason}`);

    await Coupon.updateMany(
      {
        userId: userId,
        isActive: true,
        usedAt: null,
      },
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivationReason: `Replaced by new ${reason} coupon`,
      }
    );

    let codePrefix = "GIFT";
    if (reason === "first_order") {
      codePrefix = "WELCOME";
    } else if (reason === "high_value_order") {
      codePrefix = "BIGSPEND";
    }

    let newCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      newCode = `${codePrefix}${randomSuffix}`;

      const existingCoupon = await Coupon.findOne({ code: newCode });
      if (!existingCoupon) {
        isUnique = true;
      } else if (attempts >= maxAttempts) {
        throw new Error(
          "Failed to generate unique coupon code after multiple attempts"
        );
      }
    }

    console.log(` Generated coupon code: ${newCode} for ${reason}`);

    const coupon = new Coupon({
      code: newCode,
      discountPercentage,
      expirationDate: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
      userId: userId,
      couponReason: reason,
      isActive: true,
    });

    await coupon.save();

    console.log(` Successfully created coupon: ${coupon.code} `);
    return coupon;
  } catch (error) {
    console.error(" Failed to create coupon:", error);
    return null;
  }
}

function generateOrderNumber() {
  return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function createPaymentMethodData(flutterwaveData) {
  const paymentType = flutterwaveData.payment_type || "card";

  return {
    method: paymentType,
    status: "PAID",
    card: {
      brand: flutterwaveData.card?.brand || "Unknown",
      last4: flutterwaveData.card?.last_4digits || null,
      exp_month: flutterwaveData.card?.exp_month || null,
      exp_year: flutterwaveData.card?.exp_year || null,
      type: flutterwaveData.card?.type || null,
      issuer: flutterwaveData.card?.issuer || null,
    },
  };
}

async function processOrderCreation(transactionData) {
  const {
    transaction_id,
    tx_ref,
    data,
    meta,
    userId,
    parsedProducts,
    couponCode,
    reservationId,
  } = transactionData;

  const existingOrder = await Order.findOne({
    $or: [
      { flutterwaveTransactionId: transaction_id },
      { flutterwaveRef: tx_ref },
    ],
  });

  if (existingOrder) {
    console.log(` ORDER ALREADY EXISTS: ${existingOrder.orderNumber}`);
    return { order: existingOrder, isNew: false };
  }

  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const products = parsedProducts.map((p) => ({
      product: p._id,
      name: p.name || "Unknown Product",
      image: (p.images && p.images[0]) || "/placeholder.png",
      quantity: p.quantity || 1,
      price: p.price || 0,
      selectedSize: p.size || "",
      selectedColor: p.color || "",
      selectedCategory: p.category || "",
    }));

    const order = new Order({
      user: user._id,
      products,
      subtotal: Number(meta.originalTotal) || Number(data.amount) || 0,
      discount: Number(meta.discountAmount) || 0,
      deliveryFee: Number(meta.deliveryFee) || 0,
      deliveryZone: meta.deliveryZone || "Same City",
      estimatedDeliveryDate: calculateEstimatedDeliveryDate(
        meta.deliveryZone || "Same City"
      ).estimatedDeliveryDate,
      totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
      orderNumber: generateOrderNumber(),
      couponCode: couponCode || null,
      coupon: couponCode
        ? {
            code: couponCode,
            discount: Number(meta.discountAmount) || 0,
          }
        : undefined,
      deliveryAddress: meta.deliveryAddress || "No address provided",
      phone: meta.phoneNumber || "No phone provided",
      flutterwaveRef: tx_ref,
      flutterwaveTransactionId: transaction_id,
      paymentStatus: "paid",
      status: "Pending",
      paymentMethod: createPaymentMethodData(data),
      isProcessed: false,
    });

    await order.save();

    if (reservationId) {
      await confirmInventory(reservationId);
    }

    if (couponCode?.trim()) {
      await confirmCouponUsage(userId, couponCode, order.orderNumber);
    }
    await User.findByIdAndUpdate(userId, { cartItems: [] });

    return { order, isNew: true };
  } catch (error) {
    if (error.code === 11000) {
      const existingOrder = await Order.findOne({
        $or: [
          { flutterwaveTransactionId: transaction_id },
          { flutterwaveRef: tx_ref },
        ],
      });

      if (existingOrder) {
        console.log(` Found existing order: ${existingOrder.orderNumber}`);
        return { order: existingOrder, isNew: false };
      }
    }

    console.error(` ORDER CREATION FAILED:`, error);
    throw error;
  }
}

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode, deliveryAddress, deliveryFee, deliveryZone } =
      req.body;
    const userId = req.user._id;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const defaultPhone =
      user.phones?.find((p) => p.isDefault) || user.phones?.[0];
    const defaultAddress =
      user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

    const addressString = defaultAddress
      ? (defaultAddress.address && defaultAddress.address.trim()) ||
        `${defaultAddress.landmark ? defaultAddress.landmark + ", " : ""}${
          defaultAddress.lga ? defaultAddress.lga + ", " : ""
        }${defaultAddress.city ? defaultAddress.city + ", " : ""}${
          defaultAddress.state || ""
        }`.trim()
      : "";

    if (!defaultPhone?.number?.trim() || !addressString) {
      return res.status(400).json({
        error: "You must add a phone number and address before checkout.",
      });
    }

    try {
      for (const item of products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id);
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }

        if (item.size || item.color) {
          const variantIndex = product.variants.findIndex((v) => {
            const sizeMatches = item.size
              ? v.size === item.size
              : !v.size || v.size === "" || v.size === "Standard";
            const colorMatches = item.color
              ? v.color === item.color
              : !v.color || v.color === "" || v.color === "Standard";
            return sizeMatches && colorMatches;
          });

          if (variantIndex === -1) {
            throw new Error(
              `Variant ${item.size || "Any"}/${
                item.color || "Any"
              } not found for ${item.name}`
            );
          }

          const variant = product.variants[variantIndex];

          if (variant.countInStock < item.quantity) {
            throw new Error(
              ` ${item.name} ${item.size || ""}/${
                item.color || ""
              }, is out of stock, please update you cart`
            );
          }
        } else {
          if (product.countInStock < item.quantity) {
            throw new Error(
              `Only ${product.countInStock} available for ${item.name}, but ${item.quantity} requested`
            );
          }
        }
      }
    } catch (availabilityError) {
      console.error(" Availability check failed:", availabilityError.message);
      return res.status(400).json({
        error: availabilityError.message,
      });
    }
    let calculatedDeliveryFee = 0;
    let finalDeliveryFee = 0;

    if (deliveryAddress && deliveryAddress.state) {
      if (deliveryFee !== undefined && deliveryFee !== null) {
        calculatedDeliveryFee = Number(deliveryFee);
      } else {
        calculatedDeliveryFee = calculateDeliveryFee(
          deliveryAddress.state,
          deliveryAddress.city || "",
          deliveryAddress.lga || ""
        );
      }
    }

    const originalTotal = products.reduce((acc, p) => {
      const qty = p.quantity || 1;
      const price = Number(p.price) || 0;
      return acc + price * qty;
    }, 0);

    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode && couponCode.trim() !== "") {
      try {
        const couponCodeUpper = couponCode.trim().toUpperCase();

        validCoupon = await Coupon.findOne({
          code: couponCodeUpper,
          userId: userId,
          isActive: true,
          expirationDate: { $gt: new Date() },
          usedAt: null,
          isReserved: false,
        });

        if (validCoupon) {
          discountAmount = Math.round(
            (originalTotal * validCoupon.discountPercentage) / 100
          );
        } else {
        }
      } catch (error) {
        console.error("Error validating coupon:", error);
      }
    }
    finalDeliveryFee = calculatedDeliveryFee;

    const finalTotal = Math.max(
      0,
      originalTotal - discountAmount + finalDeliveryFee
    );
    const tx_ref = `ECOSTORE-${Date.now()}`;

    const reservationId = `res_${tx_ref}`;
    try {
      await reserveInventory(
        products,
        reservationId,
        INVENTORY_RESERVATION_TIMEOUT_MINUTES
      );

      if (validCoupon) {
        await reserveCoupon(
          userId,
          couponCode,
          reservationId,
          INVENTORY_RESERVATION_TIMEOUT_MINUTES
        );
      }
    } catch (reservationError) {
      console.error(" Inventory reservation failed:", reservationError);

      try {
        await releaseInventory(reservationId);
        await releaseCoupon(reservationId);
      } catch (releaseError) {
        console.error("Failed to release after failure:", releaseError);
      }

      return res.status(400).json({
        error:
          "Some items in your cart are no longer available. Please refresh your cart and try again.",
      });
    }

    if (validCoupon) {
      console.log(`   Coupon Details: ${validCoupon.discountPercentage}% off`);
    }

    const settings = await storeSettings.findOne();
    const storeCurrency = settings?.currency || "NGN";

    const payload = {
      tx_ref,
      amount: finalTotal,
      currency: storeCurrency,
      redirect_url: `${process.env.CLIENT_URL}/purchase-success`,
      customer: {
        email: user.email,
        phonenumber: defaultPhone.number,
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        name:
          (user.firstname || "") + (user.lastname ? ` ${user.lastname}` : ""),
      },
      payment_options: "card, banktransfer",
      meta: {
        userId: userId.toString(),
        products: JSON.stringify(
          products.map((p) => ({
            _id: p._id || p.id || null,
            name: p.name,
            images: p.images || [],
            quantity: p.quantity || 1,
            price: p.price,
            size: p.size || null,
            color: p.color || null,
            category: p.category || null,
          }))
        ),
        couponCode: couponCode || "",
        originalTotal,
        discountAmount,
        deliveryFee: finalDeliveryFee,
        deliveryZone: deliveryZone || "",
        finalTotal,
        deliveryAddress: addressString || "",
        phoneNumber: defaultPhone.number || "",
        reservationId: reservationId,
      },
      customizations: {
        title: "EcoStore Purchase",
        description: "Payment for items in your cart",
        logo: process.env.STORE_LOGO || "https://yourstore.com/logo.png",
      },
    };

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const link =
      response?.data?.data?.link || response?.data?.data?.authorization_url;

    if (!link) {
      await releaseCheckoutResources(reservationId);
      console.error("No payment link returned by Flutterwave:", response.data);
      return res.status(500).json({ message: "Failed to initialize payment" });
    }

    return res.status(200).json({ link, tx_ref });
  } catch (err) {
    console.error("Error initializing Flutterwave payment:", err);
    return res.status(500).json({
      message: "Payment initialization failed",
      error: err?.message || String(err),
    });
  }
};

export const handleFlutterwaveWebhook = async (req, res) => {
  let transaction_id;
  let lockAcquired = false;
  let reservationId;

  try {
    const signature = req.headers["verif-hash"];

    if (!signature) {
      console.warn("Missing verif-hash header");
      return res.status(401).send("Missing signature");
    }

    if (signature !== process.env.FLW_WEBHOOK_HASH) {
      console.warn("Invalid webhook signature - possible forgery attempt");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;
    if (!event) {
      console.warn("Empty webhook event body");
      return res.status(400).send("No event body");
    }

    const paymentCompletionEvents = [
      "charge.completed",
      "transfer.completed",
      "bank_transfer.completed",
    ];

    if (!paymentCompletionEvents.includes(event.event)) {
      console.log(
        `Ignoring non-payment-completion webhook event: ${event.event}`
      );
      return res.status(200).send("Ignored event type");
    }

    transaction_id = event.data?.id;
    const tx_ref = event.data?.tx_ref;
    const status = event.data?.status;
    const paymentType = event.data?.payment_type;
    reservationId = event.data?.meta?.reservationId;

    if (paymentType === "banktransfer" || paymentType === "bank_transfer") {
      const isBankTransferSuccessful =
        status === "successful" ||
        status === "success" ||
        status === "completed" ||
        status === "credited";
      if (!isBankTransferSuccessful) {
        console.log(
          `Bank transfer not successful: ${status} for ${event.data?.tx_ref}`
        );

        const reservationId = event.data?.meta?.reservationId;
        if (reservationId) {
          await releaseCheckoutResources(reservationId);
        }

        return res.status(200).send("Bank transfer not completed");
      }
    } else {
      if (status !== "successful") {
        console.log(`Payment failed: ${status} for ${event.data?.tx_ref}`);

        const reservationId = event.data?.meta?.reservationId;
        if (reservationId) {
          await releaseCheckoutResources(reservationId);
        }

        return res.status(200).send("Payment not successful");
      }
    }

    if (!transaction_id) {
      console.error("No transaction_id in webhook data");
      return res.status(400).send("Missing transaction_id");
    }

    console.log(
      ` ENTERING ORDER PROCESSING - Source: ${
        req.path
      }, TX: ${transaction_id}, Time: ${new Date().toISOString()}`
    );

    console.log(`Processing transaction: ${transaction_id}, status: ${status}`);

    lockAcquired = await acquireWebhookLock(transaction_id, 45000);

    if (!lockAcquired) {
      console.log(`Webhook already being processed: ${transaction_id}`);
      return res.status(200).send("Webhook already being processed");
    }

    const existingOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
    });

    if (existingOrder) {
      console.log(
        ` DUPLICATE: Order ${existingOrder.orderNumber} already exists`
      );

      if (reservationId) {
        await releaseCheckoutResources(reservationId);
      }

      return res.status(200).send("Order already processed");
    }

    if (status !== "successful") {
      console.log(`Payment not successful: ${status} for ${tx_ref}`);

      const reservationId = event.data?.meta?.reservationId;
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(200).send("Payment not successful");
    }

    console.log(`Processing webhook for successful payment: ${tx_ref}`);

    let data;

    const verifyResp = await flw.Transaction.verify({ id: transaction_id });

    if (!verifyResp?.data || verifyResp.data.status !== "successful") {
      console.error(`Webhook verification failed for: ${transaction_id}`);

      if (reservationId) {
        await releaseCheckoutResources(reservationId);
      }

      return res.status(400).send("Payment verification failed");
    }

    data = verifyResp.data;

    const meta_data = data.meta || event.meta_data || {};

    const deliveryFee = Number(meta_data.deliveryFee) || 0;
    const deliveryZone = meta_data.deliveryZone || "";

    let parsedProducts = [];
    if (meta_data.products) {
      try {
        if (typeof meta_data.products === "string") {
          parsedProducts = JSON.parse(meta_data.products);
        } else {
          parsedProducts = meta_data.products;
        }
        parsedProducts = parsedProducts.map((p) => ({
          _id: p._id || p.id || null,
          name: p.name,
          images: p.images || [],
          quantity: p.quantity || 1,
          price: p.price,
          size: p.size || null,
          color: p.color || null,
          category: p.category || null,
        }));
      } catch (error) {
        console.error("Error parsing products:", error);
        parsedProducts = [];
      }
    }

    let userId = meta_data.userId;
    const couponCode = meta_data.couponCode || "";
    reservationId = meta_data.reservationId || reservationId;
    const originalTotal =
      Number(meta_data.originalTotal) || Number(data.amount) || 0;
    const discountAmount = Number(meta_data.discountAmount) || 0;
    const finalTotal = Number(meta_data.finalTotal) || Number(data.amount) || 0;
    const deliveryAddress = meta_data.deliveryAddress || "";
    const phoneNumber = data.customer?.phone_number || "";

    if (!userId) {
      console.error("Missing userId in webhook data");

      if (reservationId) {
        await releaseCheckoutResources(reservationId);
      }

      return res.status(400).send("Missing userId");
    }

    const finalDuplicateCheck = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
    });

    if (finalDuplicateCheck) {
      console.log(
        `LATE DUPLICATE: Order ${finalDuplicateCheck.orderNumber} created during processing`
      );

      if (reservationId) {
        await releaseCheckoutResources(reservationId);
      }

      return res.status(200).send("Order already processed");
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const transactionData = {
          transaction_id,
          tx_ref,
          data,
          meta: {
            userId: userId,
            products: meta_data.products,
            couponCode: couponCode,
            originalTotal: originalTotal,
            discountAmount: discountAmount,
            deliveryFee: deliveryFee,
            deliveryZone: deliveryZone,
            finalTotal: finalTotal,
            deliveryAddress: deliveryAddress || "No address provided",
            phoneNumber:
              data.customer?.phone_number || phoneNumber || "No phone number",
          },
          userId,
          parsedProducts,
          couponCode,
          reservationId,
        };

        const { order, isNew } = await processOrderCreation(transactionData);

        console.log(
          `${isNew ? "Created new" : "Updated existing"} order: ${
            order.orderNumber
          } for user: ${userId}`
        );

        if (isNew) {
          try {
            console.log(`STARTING COUPON PROCESS FOR USER: ${userId}`);
            const couponEligibility = await checkCouponEligibility(
              userId,
              order.totalAmount
            );

            if (couponEligibility) {
              console.log(
                `User eligible for ${couponEligibility.reason} coupon`
              );
              const newCoupon = await createNewCoupon(userId, {
                discountPercentage: couponEligibility.discountPercentage,
                couponType: couponEligibility.codePrefix,
                reason: couponEligibility.reason,
                daysValid: 30,
              });

              if (newCoupon && newCoupon.isActive) {
                console.log(
                  `Successfully created ACTIVE coupon: ${newCoupon.code}`
                );
                try {
                  const user = await User.findById(userId);
                  if (user && user.email) {
                    await sendCouponEmail({
                      to: user.email,
                      coupon: newCoupon,
                      couponType: couponEligibility.emailType,
                    });
                    console.log(`Coupon email sent for: ${newCoupon.code}`);
                  }
                } catch (emailErr) {
                  console.error("Coupon email send failed:", emailErr);
                }
              }
            }
          } catch (error) {
            console.error("Coupon creation failed:", error);
          }

          try {
            const user = await User.findById(userId);
            if (user && user.email) {
              await sendDetailedOrderEmail({
                to: user.email,
                order,
                flutterwaveData: data,
              });
            }
          } catch (emailErr) {
            console.error("Email send failed (webhook):", emailErr);
          }
        }
      });
    } catch (transactionError) {
      console.error("Transaction failed:", transactionError);

      if (reservationId) {
        await releaseCheckoutResources(reservationId);
      }

      throw transactionError;
    } finally {
      await session.endSession();
    }

    return res.status(200).send("Order processed successfully");
  } catch (err) {
    console.error(`Webhook processing error:`, err);

    if (reservationId) {
      await releasereleaseCheckoutResourcesInventory(reservationId);
    }

    return res.status(500).send("Webhook processing failed");
  } finally {
    if (lockAcquired && transaction_id) {
      await releaseWebhookLock(transaction_id);
    }
  }
};

async function withRetry(fn, retries = 3, delay = 200) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const transient =
        err?.codeName === "WriteConflict" ||
        (err?.errorLabels &&
          err.errorLabels.includes("TransientTransactionError"));

      if (transient && attempt < retries) {
        console.warn(`Transient error, retrying ${attempt}/${retries}...`);
        await new Promise((r) => setTimeout(r, delay * attempt));
        continue;
      }
      throw err;
    }
  }
}

export const checkoutSuccess = async (req, res) => {
  let lockAcquired = false;
  const { tx_ref, transaction_id } = req.body;

  if (!transaction_id) {
    return res.status(400).json({
      error: "transaction_id is required",
      received: req.body,
    });
  }

  try {
    const existingPaidOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
      paymentStatus: "paid",
    });

    if (existingPaidOrder) {
      console.log(
        `CheckoutSuccess: Order already processed: ${existingPaidOrder.orderNumber}`
      );
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: existingPaidOrder._id,
        orderNumber: existingPaidOrder.orderNumber,
      });
    }

    lockAcquired = await acquireWebhookLock(transaction_id, 30000);
    if (!lockAcquired) {
      console.log(
        `checkoutSuccess: Lock already acquired for ${transaction_id}`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const orderNow = await Order.findOne({
        $or: [
          { flutterwaveTransactionId: transaction_id },
          { flutterwaveRef: tx_ref },
        ],
        paymentStatus: "paid",
      });

      if (orderNow) {
        return res.status(200).json({
          success: true,
          orderId: orderNow._id,
          orderNumber: orderNow.orderNumber,
        });
      }

      return res.status(200).json({
        success: false,
        message: "Please wait a moment and refresh the page",
      });
    }

    const verifyResp = await flw.Transaction.verify({ id: transaction_id });
    const data = verifyResp?.data;

    if (!data || data.status !== "successful") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const meta = data.meta || {};
    const userId = meta.userId;
    const parsedProducts = meta.products ? JSON.parse(meta.products) : [];
    const couponCode = meta.couponCode || "";
    const reservationId = meta.reservationId;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Missing userId in payment metadata" });
    }

    let finalOrder;
    let isNewOrder = false;

    await withRetry(async () => {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const transactionData = {
            transaction_id,
            tx_ref,
            data,
            meta,
            userId,
            parsedProducts,
            couponCode,
            reservationId,
          };

          const { order, isNew } = await processOrderCreation(transactionData);
          finalOrder = order;
          isNewOrder = isNew;

          if (isNew) {
            const couponEligibility = await checkCouponEligibility(
              userId,
              finalOrder.totalAmount
            );
            if (couponEligibility) {
              const newCoupon = await createNewCoupon(userId, {
                discountPercentage: couponEligibility.discountPercentage,
                couponType: couponEligibility.codePrefix,
                reason: couponEligibility.reason,
                daysValid: 30,
              });

              if (newCoupon) {
                try {
                  const user = await User.findById(userId);
                  if (user && user.email) {
                    await sendCouponEmail({
                      to: user.email,
                      coupon: newCoupon,
                      couponType: couponEligibility.emailType,
                      orderCount: await Order.countDocuments({
                        user: userId,
                        paymentStatus: "paid",
                      }),
                    });
                  }
                } catch (emailErr) {
                  console.error("Coupon email send failed:", emailErr);
                }
              }
            }

            try {
              const user = await User.findById(userId);
              await sendDetailedOrderEmail({
                to: user.email,
                order,
                flutterwaveData: data,
              });
            } catch (emailErr) {
              console.error("Email send failed (checkoutSuccess):", emailErr);
            }
          } else {
            console.log(
              `Skipping email for existing order: ${order.orderNumber}`
            );
          }
        });
      } finally {
        await session.endSession();
      }
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified and order finalized",
      orderId: finalOrder._id,
      orderNumber: finalOrder.orderNumber,
      estimatedDeliveryDate: finalOrder.estimatedDeliveryDate,
      isNew: isNewOrder,
    });
  } catch (error) {
    console.error("checkoutSuccess failed:", error);

    const reservationId = req.body.meta?.reservationId;
    if (reservationId) {
      await releaseCheckoutResources(reservationId);
    }

    return res.status(500).json({
      error: error.message || "Checkout failed",
    });
  } finally {
    if (lockAcquired) {
      await releaseWebhookLock(transaction_id);
    }
  }
};

export const sendDetailedOrderEmail = async ({ to, order }) => {
  if (!to || !order) return;

  let customerName = "";
  try {
    const userDoc = await User.findById(order.user).select(
      "firstname lastname"
    );
    if (userDoc) {
      customerName =
        userDoc.firstname || userDoc.lastname || order.user?.name || "Customer";
    }
  } catch (err) {
    console.error("Error fetching user name for email:", err);
  }

  const paymentMethod = order.paymentMethod || {};
  const tx_ref = order.flutterwaveRef || "N/A";
  const transaction_id = order.flutterwaveTransactionId || "N/A";
  const payment_type = paymentMethod.method || "N/A";
  const settings = await storeSettings.findOne();
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: settings.currency,
  });

  const items = order.products || order.items || [];

  const productRows = items
    .map((item) => {
      let details = "";
      if (item.selectedSize) details += `Size: ${item.selectedSize} `;
      if (item.selectedColor) details += `| Color: ${item.selectedColor}`;

      return `
        <tr>
          <td style="padding: 8px 12px; border:1px solid #eee;">
          <p display:block; margin-top: 1; margin-bottom:1>${
            item.name || item.productName || "Item"
          }</p>
            <img src="${item.image}" alt="${
        item.name
      }" width="60" height="60" style="border-radius: 6px; object-fit: cover;" />
           
            ${
              details
                ? `<br/><small style="color:#666;">${details || ""}</small>`
                : ""
            }
          </td>
          <td style="padding: 8px 12px; text-align:center; border:1px solid #eee;">${
            item.quantity || 1
          }</td>
          <td style="padding: 8px 12px; text-align:right; border:1px solid #eee;">${formatter.format(
            item.price || item.unitPrice || 0
          )}
            
          </td>
        </tr>`;
    })
    .join("");

  const totalAmount = order.totalAmount || order.totalPrice || order.total || 0;
  const subtotal = order.subtotal || order.subTotal || 0;
  const discount = order.discount || 0;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px;">
      <div style="max-width: 700px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);">
        <div style="background: #10b981; padding: 22px; text-align: center; color: #fff;">
          <img src="${settings?.logo}" alt="${
    settings?.storeName
  }" style="max-height:50px; display:block; margin: 0 auto 8px;" />
          <h1 style="margin:0; font-size:20px;">Order Confirmation</h1>
          <div style="margin-top:6px; font-size:15px;">${
            order.orderNumber || "N/A"
          }</div>
        </div>

        <div style="padding: 22px; color:#333;">
          <p style="margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
          <p style="margin:0 0 16px;">Thank you for your order! We've received your payment and are now processing your purchase. Below are your order details.</p>

          <h3 style="margin:18px 0 8px;"> Order Summary</h3>
          <table style="width:100%; border-collapse: collapse; margin-top:8px;">
            <thead>
              <tr style="background:#f7faf7;">
                <th style="padding:10px; text-align:left; border:1px solid #eee;">Product</th>
                <th style="padding:10px; text-align:center; border:1px solid #eee;">Qty</th>
                <th style="padding:10px; text-align:right; border:1px solid #eee;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${
                productRows ||
                `<tr><td colspan="3" style="padding:12px;text-align:center;color:#777;">No items listed</td></tr>`
              }
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 16px;">
            <strong>Original Subtotal:</strong> ${formatter.format(
              subtotal
            )} <br>
                    ${
                      discount > 0
                        ? `
                  
                      <strong>Coupon Discount:</strong> - ${formatter.format(
                        discount
                      )}
                   
          `
                        : ""
                    }<br>
            <strong>Delivery Fee:</strong> ${formatter.format(
              order.deliveryFee
            )}<br>
            <strong>Final Total:</strong> ${formatter.format(totalAmount)}
          </p>

          <p style="margin:0;">
            <strong>Address:</strong> ${
              order.deliveryAddress || "No address provided"
            }<br/>
            <strong>Phone:</strong> ${order.phone || "No phone provided"}<br/>
            <strong>Email:</strong> ${to}
          </p>

          <h3 style="margin:18px 0 8px;"> Payment Details</h3>
          <p style="margin:0 0 6px;">
            <strong>Payment Status:</strong> ${
              order.paymentStatus || "Confirmed"
            }<br/>
            <strong>Payment Type:</strong> ${payment_type}<br/>
            <strong>Transaction Ref:</strong> ${tx_ref}<br/>
            <strong>Transaction ID:</strong> ${transaction_id}
          </p>


          <p style="margin-top:20px; color:#555;">We'll send another email once your order ships.</p>

          
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;"><p style="margin-top:18px;">Thanks for choosing <strong> ${
            settings?.storeName
          }</strong> </p>
          <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
            settings?.supportEmail
          }" 
             style="color: #10b981; text-decoration: none;">${
               settings?.supportEmail
             }</a></p>
        </div>
      </div>
    </div>
  `;

  const text = [
    `EcoStore — Order Confirmation`,
    ` ${order.orderNumber || "N/A"}`,
    `Customer: ${customerName}`,
    `Total: ${formatter.format(totalAmount)}`,
    `Delivery Address: ${order.deliveryAddress || "No address provided"}`,
    `Phone: ${order.phone || "No phone provided"}`,
    `Payment Status: ${order.paymentStatus || "Confirmed"}`,
    `Payment Type: ${payment_type}`,
    `Transaction Ref: ${tx_ref}`,
    `Transaction ID: ${transaction_id}`,
    ``,
    `Items:`,
    ...items.map(
      (it) =>
        ` - ${it.quantity || 1} x ${it.name || "Item"} — ${formatter.format(
          it.price
        )}`
    ),
    ``,
    `Thanks for shopping with  ${settings?.storeName}!`,
  ].join("\n");

  await sendEmail({
    to,
    subject: ` ${settings?.storeName} — Order Confirmation ${
      order.orderNumber || "N/A"
    }`,
    html,
    text,
  });
};

export const sendCouponEmail = async ({
  to,
  coupon,
  couponType = "welcome_coupon",
}) => {
  if (!to || !coupon) return;
  const settings = await storeSettings.findOne();

  let subject = "";
  let title = "";
  let message = "";
  let couponValue = `${coupon.discountPercentage}% OFF`;

  if (couponType === "welcome_coupon") {
    subject = `🎉 Welcome to ${settings.storeName}! Here's Your ${couponValue} Welcome Gift`;
    title = `Welcome to ${settings.storeName}!`;
    message = `
      <p>Welcome to our eco-friendly community! As a thank you for your first order, 
      we're giving you a special welcome discount for your next purchase.</p>
      <p>We hope you enjoyed your first experience with us and look forward to serving you again!</p>
    `;
  } else if (couponType === "bigspender_coupon") {
    subject = `💎 Thank You! ${couponValue} Reward for Your Generous Order`;
    title = "Thank You for Your Generous Purchase!";
    message = `
      <p>We truly appreciate your generous order! Your support helps us continue 
      our mission of providing eco-friendly products.</p>
      <p>As a token of our appreciation, please enjoy this special discount on your next purchase.</p>
    `;
  } else {
    subject = `🎁 Special ${couponValue} Gift from ${settings.storeName}`;
    title = "Here's a Special Gift For You!";
    message = `
      <p>Thank you for being a valued ${settings.storeName} customer!</p>
      <p>Enjoy this discount on your next purchase of eco-friendly products.</p>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f0f9f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #fff;">
          <img src="${settings?.logo}" alt="${
    settings.storeName
  } Logo" style="max-height: 50px; display:block; margin: 0 auto 15px;" />
          <h1 style="margin:0; font-size: 28px; font-weight: bold;">${title}</h1>
          <div style="margin-top: 10px; font-size: 18px; opacity: 0.9;">Your Exclusive Discount Awaits!</div>
        </div>

        <div style="padding: 30px; color:#333;">
          ${message}

          <!-- Coupon Code Box -->
          <div style="background: linear-gradient(135deg, #fffbeb, #fed7aa); border: 2px dashed #d97706; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0;">
            <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">YOUR DISCOUNT CODE</div>
            <div style="font-size: 32px; font-weight: bold; color: #ea580c; letter-spacing: 3px; margin: 10px 0;">
              ${coupon.code}
            </div>
            <div style="font-size: 20px; color: #dc2626; font-weight: bold; margin: 8px 0;">
              ${couponValue}
            </div>
            <div style="font-size: 14px; color: #92400e;">
              Valid until: ${new Date(
                coupon.expirationDate
              ).toLocaleDateString()}
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin:0 0 12px 0; color: #1e293b;">✨ How to Use Your Coupon:</h3>
            <ol style="margin: 0; padding-left: 20px; color: #475569;">
              <li>Shop your favorite eco-friendly products</li>
              <li>Proceed to checkout</li>
              <li>Enter code <strong style="color: #ea580c;">${
                coupon.code
              }</strong> in the coupon field</li>
              <li>Enjoy your ${
                coupon.discountPercentage
              }% discount instantly!</li>
            </ol>
          </div>

          <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 25px;">
            This coupon is exclusively for you and cannot be transferred.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}" 
               style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🛍️ Start Shopping Now
            </a>
          </div>
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;">Thank you for choosing sustainable shopping with ${
            settings.storeName
          }</p>
          <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
            settings.supportEmail
          }" 
             style="color: #10b981; text-decoration: none;">${
               settings.supportEmail
             }</a></p>
        </div>
      </div>
    </div>
  `;

  const text = `
${title}

${message.replace(/<[^>]*>/g, "").trim()}

YOUR DISCOUNT CODE: ${coupon.code}
DISCOUNT: ${couponValue}
VALID UNTIL: ${new Date(coupon.expirationDate).toLocaleDateString()}

How to Use:
1. Shop your favorite eco-friendly products
2. Proceed to checkout
3. Enter code ${coupon.code} in the coupon field
4. Enjoy your ${coupon.discountPercentage}% discount instantly!

Shop now: ${process.env.CLIENT_URL}

This coupon is exclusively for you and cannot be transferred.

Thank you for choosing sustainable shopping with ${settings.storeName}
  `.trim();

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
};
