// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import axios from "axios";
// import mongoose from "mongoose";
// import { acquireWebhookLock, releaseWebhookLock, } from "../lib/redis.js";
// import Coupon from "../models/coupon.model.js";
// import Order from "../models/order.model.js";
// import User from "../models/user.model.js";
// import Product from "../models/product.model.js";
// import { sendEmail } from "../lib/mailer.js";
// import { flw } from "../lib/flutterwave.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "../../.env") });



// const inventoryReservations = new Map();


// // 1. First define all helper functions

// async function clearStaleDatabaseReservations() {
//   console.log("🔍 Checking for stale database reservations...");

//   try {
//     const productsWithReservations = await Product.find({
//       $or: [{ reserved: { $gt: 0 } }, { "variants.reserved": { $gt: 0 } }],
//     });

//     // ✅ FIXED: Add null check for inventoryReservations
//     const activeReservations = inventoryReservations
//       ? Array.from(inventoryReservations.values())
//       : [];

//     for (const product of productsWithReservations) {
//       let needsUpdate = false;

//       // Check if reservations match any active in-memory reservations
//       if (product.reserved > 0) {
//         const hasActiveReservation =
//           activeReservations.length > 0 &&
//           activeReservations.some(
//             (reservation) =>
//               reservation &&
//               reservation.products &&
//               reservation.products.some(
//                 (item) =>
//                   item &&
//                   item._id === product._id.toString() &&
//                   !item.size &&
//                   !item.color
//               )
//           );

//         if (!hasActiveReservation) {
//           console.log(
//             `🔄 Releasing orphaned main reservation for ${product.name}: ${product.reserved} units`
//           );
//           product.countInStock += product.reserved;
//           product.reserved = 0;
//           needsUpdate = true;
//         }
//       }

//       // Check variant reservations
//       if (product.variants && product.variants.length > 0) {
//         product.variants.forEach((variant, index) => {
//           if (variant.reserved > 0) {
//             const hasActiveVariantReservation =
//               activeReservations.length > 0 &&
//               activeReservations.some(
//                 (reservation) =>
//                   reservation &&
//                   reservation.products &&
//                   reservation.products.some((item) => {
//                     if (!item) return false;
//                     const sizeMatch = item.size
//                       ? variant.size === item.size
//                       : !variant.size || variant.size === "";
//                     const colorMatch = item.color
//                       ? variant.color === item.color
//                       : !variant.color || variant.color === "";
//                     return (
//                       item._id === product._id.toString() &&
//                       sizeMatch &&
//                       colorMatch
//                     );
//                   })
//               );

//             if (!hasActiveVariantReservation) {
//               console.log(
//                 `🔄 Releasing orphaned variant reservation for ${product.name} ${variant.size}/${variant.color}: ${variant.reserved} units`
//               );
//               product.variants[index].countInStock += variant.reserved;
//               product.variants[index].reserved = 0;
//               needsUpdate = true;
//             }
//           }
//         });

//         if (needsUpdate) {
//           product.countInStock = product.variants.reduce(
//             (total, v) => total + (v.countInStock || 0),
//             0
//           );
//         }
//       }

//       if (needsUpdate) {
//         await product.save();
//         console.log(`✅ Cleared orphaned reservations for ${product.name}`);
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error checking for stale database reservations:", error);
//   }
// }

// // 2. Then define the main reservation functions (reserveInventory, releaseInventory, confirmInventory)
// // ... your existing reserveInventory, releaseInventory, confirmInventory functions here ...

// // 3. Then set up the cleanup interval
// // Enhanced cleanup - runs every 30 seconds and clears expired reservations
// setInterval(async () => {
//   const now = new Date();
//   let releasedCount = 0;
  
//   console.log(`🕒 Running reservation cleanup (${inventoryReservations.size} active reservations)...`);

//   // Release expired reservations
//   for (const [reservationId, reservation] of inventoryReservations.entries()) {
//     if (reservation.expiresAt < now) {
//       console.log(`⏰ Releasing expired reservation: ${reservationId}`);
//       try {
//         await releaseInventory(reservationId);
//         releasedCount++;
//       } catch (error) {
//         console.error(`❌ Failed to release reservation ${reservationId}:`, error);
//       }
//     }
//   }

//   if (releasedCount > 0) {
//     console.log(`✅ Released ${releasedCount} expired reservations`);
//   }

//   // Periodically check for database inconsistencies (every 5 minutes)
//   if (Date.now() % 300000 < 60000) { // Run roughly every 5 minutes
//     await clearStaleDatabaseReservations();
//   }

//   for (const [key, value] of inventoryReservations.entries()) {
//     if (
//       key.startsWith("released_") &&
//       value.releasedAt < now - 60 * 60 * 1000
//     ) {
//       inventoryReservations.delete(key); 
//     }
//   }
// }, 30000); // Run every 30 seconds instead of 60
 
// // 4. Add the immediate cleanup function (run this once)
// async function clearAllReservations() {
//   console.log('🧹 Clearing all stale reservations from database...');
  
//   try {
//     const session = await mongoose.startSession();
    
//     await session.withTransaction(async () => {
//       // Find all products with reserved inventory
//       const productsWithReservations = await Product.find({
//         $or: [
//           { reserved: { $gt: 0 } },
//           { 'variants.reserved': { $gt: 0 } }
//         ]
//       }).session(session);

//       console.log(`📊 Found ${productsWithReservations.length} products with reservations`);

//       for (const product of productsWithReservations) {
//         let changed = false;

//         // Clear main product reservations
//         if (product.reserved > 0) {
//           console.log(`🔄 Clearing main reservation for ${product.name}: ${product.reserved} units`);
//           product.countInStock += product.reserved;
//           product.reserved = 0;
//           changed = true;
//         }

//         // Clear variant reservations
//         if (product.variants && product.variants.length > 0) {
//           product.variants.forEach((variant, index) => {
//             if (variant.reserved > 0) {
//               console.log(`🔄 Clearing variant reservation for ${product.name} ${variant.size}/${variant.color}: ${variant.reserved} units`);
//               product.variants[index].countInStock += variant.reserved;
//               product.variants[index].reserved = 0;
//               changed = true;
//             }
//           });

//           // Update total stock
//           if (changed) {
//             product.countInStock = product.variants.reduce(
//               (total, v) => total + v.countInStock,
//               0
//             );
//           }
//         }

//         if (changed) {
//           await product.save({ session });
//           console.log(`✅ Cleared reservations for ${product.name}`);
//         }
//       }
//     });

//     await session.endSession();
//     console.log('🎉 All stale reservations cleared successfully');
    
//     // Also clear the in-memory reservations
//     inventoryReservations.clear();
//     console.log('🧹 Cleared in-memory reservation map');
    
//   } catch (error) {
//     console.error('❌ Failed to clear reservations:', error);
//   }
// }

// // 5. Run the immediate cleanup once
// mongoose.connection.on('connected', async () => {
//   console.log('✅ MongoDB connected - starting reservation cleanup...');
//   await clearAllReservations();
// });

// mongoose.connection.on('error', (err) => {
//   console.error('❌ MongoDB connection error:', err);
// });



// // Reserve inventory atomically - FIXED VERSION
// async function reserveInventory(products, reservationId, timeoutMinutes = 4) {
//   const session = await mongoose.startSession();

//   try {
//     await session.withTransaction(async () => {
//       for (const item of products) {
//         if (!item._id) continue;

//         console.log(`🔄 Reserving ${item.quantity} of ${item.name}`);

//         const product = await Product.findById(item._id).session(session);
//         if (!product) throw new Error(`Product ${item.name} not found`);

//         // FIXED: Use flexible matching for variants (same as frontend)
//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size 
//               ? v.size === item.size 
//               : (!v.size || v.size === "" || v.size === "Standard");
//             const colorMatches = item.color 
//               ? v.color === item.color 
//               : (!v.color || v.color === "" || v.color === "Standard");
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex === -1) {
//             throw new Error(
//               `Variant ${item.size || 'Any'}/${item.color || 'Any'} not found for ${item.name}`
//             );
//           }

//           const variant = product.variants[variantIndex];
//           console.log(
//             `📦 BEFORE - ${item.name} ${item.size || ''}/${item.color || ''}: Stock=${
//               variant.countInStock
//             }, Reserved=${variant.reserved || 0}`
//           );

//           // Check stock
//           if (variant.countInStock < item.quantity) {
//             throw new Error(
//               `Only ${variant.countInStock} available, but ${item.quantity} requested`
//             );
//           }

//           // ACTUALLY DEDUCT INVENTORY HERE
//           variant.countInStock -= item.quantity;
//           variant.reserved = (variant.reserved || 0) + item.quantity;

//           console.log(
//             `📦 AFTER - ${item.name} ${item.size || ''}/${item.color || ''}: Stock=${variant.countInStock}, Reserved=${variant.reserved}`
//           );

//           // Update total product stock
//           product.countInStock = product.variants.reduce(
//             (total, v) => total + v.countInStock,
//             0
//           );
//         }
//         // Handle simple products (no variants)
//         else {
//           console.log(
//             `📦 BEFORE - ${item.name}: Stock=${
//               product.countInStock
//             }, Reserved=${product.reserved || 0}`
//           );

//           if (product.countInStock < item.quantity) {
//             throw new Error(
//               `Only ${product.countInStock} available, but ${item.quantity} requested`
//             );
//           }

//           // ACTUALLY DEDUCT INVENTORY HERE
//           product.countInStock -= item.quantity;
//           product.reserved = (product.reserved || 0) + item.quantity;

//           console.log(
//             `📦 AFTER - ${item.name}: Stock=${product.countInStock}, Reserved=${product.reserved}`
//           );
//         }

//         await product.save({ session });
//         console.log(
//           `✅ Successfully reserved ${item.quantity} of ${item.name}`
//         );
//         console.log(`💾 Storing reservation: ${reservationId}`, {
//           products: products.map((p) => ({
//             _id: p._id,
//             name: p.name,
//             size: p.size,
//             color: p.color,
//             quantity: p.quantity,
//           })),
//           createdAt: new Date(),
//           expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
//         });
//       }
//     });

//     // Store reservation
//     inventoryReservations.set(reservationId, {
//       products,
//       createdAt: new Date(),
//       expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
//     });

//     console.log(`🎉 ALL inventory reserved successfully: ${reservationId}`);
//     return true;
//   } catch (error) {
//     console.error("❌ Reservation failed:", error);

//     // Release any partial reservations
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


// // Release reserved inventory - FIXED VERSION

// // FIXED: releaseInventory with idempotency protection
// async function releaseInventory(reservationId) {
//   // Check if we've already processed this release
//   if (inventoryReservations.has(`released_${reservationId}`)) {
//     console.log(`🔄 Release already processed for: ${reservationId}`);
//     return;
//   }

//   const reservation = inventoryReservations.get(reservationId);
//   if (!reservation) {
//     console.log(`No reservation found: ${reservationId}`);
//     return;
//   }

//   console.log(`🔄 Releasing reservation: ${reservationId}`);

//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       for (const item of reservation.products) {
//         if (!item._id) continue;

//         const product = await Product.findById(item._id).session(session);
//         if (!product) {
//           console.log(`Product not found for ID: ${item._id}`);
//           continue;
//         }

//         // FIXED: Use flexible matching for variants
//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size 
//               ? v.size === item.size 
//               : (!v.size || v.size === "" || v.size === "Standard");
//             const colorMatches = item.color 
//               ? v.color === item.color 
//               : (!v.color || v.color === "" || v.color === "Standard");
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex !== -1) {
//             const variant = product.variants[variantIndex];
            
//             // ✅ FIXED: Add safety check - only release if we have enough reserved
//             const reservedToRelease = Math.min(item.quantity, variant.reserved || 0);
            
//             if (reservedToRelease > 0) {
//               variant.countInStock += reservedToRelease;
//               variant.reserved = Math.max(0, (variant.reserved || 0) - reservedToRelease);
              
//               console.log(
//                 `✅ Released ${reservedToRelease} of ${item.name} variant - Stock now: ${variant.countInStock}, Reserved: ${variant.reserved}`
//               );
//             } else {
//               console.log(
//                 `⚠️ No reserved stock to release for ${item.name} ${item.size || ''}/${item.color || ''}`
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
//           const reservedToRelease = Math.min(item.quantity, product.reserved || 0);
          
//           if (reservedToRelease > 0) {
//             product.countInStock += reservedToRelease;
//             product.reserved = Math.max(0, (product.reserved || 0) - reservedToRelease);
//             console.log(
//               `✅ Released ${reservedToRelease} of ${item.name} - Stock now: ${product.countInStock}, Reserved: ${product.reserved}`
//             );
//           } else {
//             console.log(`⚠️ No reserved stock to release for ${item.name}`);
//           }
//         }

//         await product.save({ session });
//       }
//     });

//     // ✅ Mark this reservation as released to prevent duplicate processing
//     inventoryReservations.set(`released_${reservationId}`, {
//       releasedAt: new Date(),
//       originalReservation: reservation
//     });
    
//     // Remove the original reservation
//     inventoryReservations.delete(reservationId);
    
//     console.log(`🎉 Successfully released reservation: ${reservationId}`);
//   } catch (error) {
//     console.error("❌ Release failed:", error);
//   } finally {
//     await session.endSession();
//   }
// }


// // FIXED: Confirm inventory - Permanently reduce stock
// async function confirmInventory(reservationId) {
//   const reservation = inventoryReservations.get(reservationId);
//   if (!reservation) {
//     console.log(`No reservation found to confirm: ${reservationId}`);
//     return;
//   }

//   console.log(`🔄 Confirming reservation: ${reservationId}`);

//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       for (const item of reservation.products) {
//         if (!item._id) continue;

//         const product = await Product.findById(item._id).session(session);
//         if (!product) continue;

//         // FIXED: Use flexible matching for variants
//         if (item.size || item.color) {
//           const variantIndex = product.variants.findIndex((v) => {
//             const sizeMatches = item.size 
//               ? v.size === item.size 
//               : (!v.size || v.size === "" || v.size === "Standard");
//             const colorMatches = item.color 
//               ? v.color === item.color 
//               : (!v.color || v.color === "" || v.color === "Standard");
//             return sizeMatches && colorMatches;
//           });

//           if (variantIndex !== -1) {
//             const variant = product.variants[variantIndex];
            
//             // ✅ CRITICAL FIX: Actually reduce the stock permanently
//             // The inventory was temporarily reduced in reserveInventory, but we need to make it permanent
//             // by keeping the reduced countInStock and just removing the reservation
            
//             console.log(
//               `📊 BEFORE CONFIRMATION - ${item.name} ${item.size || ''}/${item.color || ''}: Stock=${variant.countInStock}, Reserved=${variant.reserved || 0}`
//             );
            
//             // Remove reservation flag - stock is already at the reduced level from reservation
//             variant.reserved = Math.max(
//               0,
//               (variant.reserved || 0) - item.quantity
//             );
            
//             console.log(
//               `✅ CONFIRMED ${item.name} ${item.size || ''}/${item.color || ''} - Final: Stock=${variant.countInStock}, Reserved=${variant.reserved}`
//             );
            
//             console.log(
//               `📊 INVENTORY REDUCTION: ${item.name} ${item.size || ''}/${item.color || ''} - Stock permanently reduced by ${item.quantity} units`
//             );
//           } else {
//             console.log(`❌ Variant not found for confirmation: ${item.name} ${item.size || ''}/${item.color || ''}`);
//           }
//         } else {
//           // Simple product - remove reservation flag only (stock already reduced)
//           console.log(
//             `📊 BEFORE CONFIRMATION - ${item.name}: Stock=${product.countInStock}, Reserved=${product.reserved || 0}`
//           );
          
//           product.reserved = Math.max(
//             0,
//             (product.reserved || 0) - item.quantity
//           );
          
//           console.log(
//             `✅ CONFIRMED ${item.name} - Final: Stock=${product.countInStock}, Reserved=${product.reserved}`
//           );
          
//           console.log(
//             `📊 INVENTORY REDUCTION: ${item.name} - Stock permanently reduced by ${item.quantity} units`
//           );
//         }

//         await product.save({ session });
//       }
//     });

//     inventoryReservations.delete(reservationId);
//     console.log(`🎉 Successfully CONFIRMED reservation: ${reservationId}`);
    
//   } catch (error) {
//     console.error("❌ Confirmation failed:", error);
//     throw error;
//   } finally {
//     await session.endSession();
//   }
// }


// async function checkCouponEligibility(userId, orderAmount) {
//   try {
//     const orderCount = await Order.countDocuments({
//       user: userId,
//       paymentStatus: "paid",
//     });

//     console.log(
//       `Checking coupon eligibility for user ${userId}: ${orderCount} orders, ₦${orderAmount}`
//     );

//     const activeCoupon = await Coupon.findOne({
//       userId: userId,
//       isActive: true,
//       expirationDate: { $gt: new Date() },
//     });

//     if (activeCoupon) {
//       console.log(
//         `User ${userId} already has active coupon: ${activeCoupon.code}`
//       );
//       return null;
//     }

//     if (orderCount === 1) {
//       console.log(`User ${userId} eligible for FIRST ORDER coupon`);
//       return {
//         discountPercentage: 10,
//         codePrefix: "WELCOME",
//         reason: "first_order",
//         emailType: "welcome_coupon",
//       };
//     } else if (orderCount === 3) {
//       console.log(`User ${userId} eligible for THIRD ORDER coupon`);
//       return {
//         discountPercentage: 15,
//         codePrefix: "LOYAL",
//         reason: "third_order_milestone",
//         emailType: "loyalty_coupon",
//       };
//     } else if (orderCount >= 5 && orderCount % 5 === 0) {
//       console.log(
//         `User ${userId} eligible for VIP coupon (${orderCount} orders)`
//       );
//       return {
//         discountPercentage: 20,
//         codePrefix: "VIP",
//         reason: "every_five_orders",
//         emailType: "vip_coupon",
//       };
//     } else if (orderAmount > 175000) {
//       console.log(
//         `User ${userId} eligible for BIG SPENDER coupon (₦${orderAmount})`
//       );
//       return {
//         discountPercentage: 15,
//         codePrefix: "BIGSPEND",
//         reason: "high_value_order",
//         emailType: "bigspender_coupon",
//       };
//     }

//     console.log(
//       `User ${userId} not eligible for coupon (${orderCount} orders, ₦${orderAmount})`
//     );
//     return null;
//   } catch (error) {
//     console.error("Error checking coupon eligibility:", error);
//     return null;
//   }
// }

// async function createNewCoupon(userId, options = {}) {
//   const {
//     discountPercentage = 10,
//     daysValid = 30,
//     couponType = "GIFT",
//     reason = "general",
//   } = options;

//   try {
//     console.log(`Starting coupon creation for user ${userId}...`);

//     const newCode =
//       couponType + Math.random().toString(36).substring(2, 8).toUpperCase();

//     console.log(`Generated coupon code: ${newCode}`);

//     const coupon = await Coupon.findOneAndUpdate(
//       { userId: userId },
//       {
//         code: newCode,
//         discountPercentage,
//         expirationDate: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
//         isActive: true,
//         couponReason: reason,
//         deactivatedAt: null,
//         deactivationReason: null,
//         usedAt: null,
//         usedInOrder: null,
//       },
//       {
//         upsert: true,
//         new: true,
//         runValidators: true,
//         setDefaultsOnInsert: true,
//       }
//     );

//     console.log(
//       `Successfully ${coupon.$isNew ? "CREATED" : "UPDATED"} coupon: ${
//         coupon.code
//       } for user ${userId}`
//     );
//     return coupon;
//   } catch (error) {
//     console.error("Failed to create/update coupon:", error);
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

//   console.log(` STARTING order processing for: ${tx_ref}`);

//   // 1. IMMEDIATE DUPLICATE CHECK
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

//   // 2. CREATE ORDER (inventory already reserved)
//   try {
//     console.log(` CREATING NEW ORDER for user: ${userId}`);

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
//       totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
//       orderNumber: generateOrderNumber(),
//       couponCode: couponCode || null,
//       deliveryAddress: meta.deliveryAddress || "No address provided",
//       phone: meta.phoneNumber || "No phone provided",
//       flutterwaveRef: tx_ref,
//       flutterwaveTransactionId: transaction_id,
//       paymentStatus: "paid",
//       status: "Pending",
//       paymentMethod: createPaymentMethodData(data),
//       isProcessed: true,
//     });

//     await order.save();
//     console.log(` SUCCESS: Created order ${order.orderNumber}`);

//     // 3. CONFIRM INVENTORY (convert reservation to permanent)
//     if (reservationId) {
//       await confirmInventory(reservationId);
//     }

//     // 4. CLEAR CART
//     await User.findByIdAndUpdate(userId, { cartItems: [] });

//     // 5. HANDLE COUPON APPLICATION (if coupon was used in this order)
//     if (couponCode?.trim()) {
//       await Coupon.findOneAndUpdate(
//         { code: couponCode.trim().toUpperCase(), userId, isActive: true },
//         { isActive: false, usedAt: new Date(), usedInOrder: tx_ref }
//       );
//       console.log(` Coupon applied: ${couponCode}`);
//     }

//     // NOTE: Coupon eligibility check for NEW coupons is handled in the webhook handler
//     // This function only handles applying existing coupons used in the purchase

//     return { order, isNew: true };
//   } catch (error) {
//     // Handle duplicate order error
//     if (error.code === 11000) {
//       console.log(`🔄 Duplicate key error - finding existing order...`);
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

//     console.error(`❌ ORDER CREATION FAILED:`, error);
//     throw error;
//   }
// }
 

// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { products, couponCode } = req.body;
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

// // === CHECK AVAILABILITY BEFORE RESERVATION ===
//     console.log('🔍 Checking availability before reservation...');
//     try {
//       for (const item of products) {
//         if (!item._id) continue;

//         const product = await Product.findById(item._id);
//         if (!product) {
//           throw new Error(`Product ${item.name} not found`);
//         }

//         // Handle variants
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
//           console.log(
//             `📊 Availability check - ${item.name} ${item.size || ""}/${
//               item.color || ""
//             }: Stock=${variant.countInStock}, Requested=${item.quantity}`
//           );

//           if (variant.countInStock < item.quantity) {
//             throw new Error(
//               ` ${item.name} ${item.size || ""}/${
//                 item.color || ""
//               }, is out of stock, please update you cart`
//             );
//           }
//         }
//         // Handle simple products
//         else {
//           console.log(
//             `📊 Availability check - ${item.name}: Stock=${product.countInStock}, Requested=${item.quantity}`
//           );

//           if (product.countInStock < item.quantity) {
//             throw new Error(
//               `Only ${product.countInStock} available for ${item.name}, but ${item.quantity} requested`
//             );
//           }
//         }
//       }
//       console.log('✅ All items available for reservation');
//     } catch (availabilityError) {
//       console.error('❌ Availability check failed:', availabilityError.message);
//       return res.status(400).json({
//         error: availabilityError.message,
//       });
//     }
//     // Calculate totals
//     const originalTotal = products.reduce((acc, p) => {
//       const qty = p.quantity || 1;
//       const price = Number(p.price) || 0;
//       return acc + price * qty;
//     }, 0);

//     let discountAmount = 0;
//     let validCoupon = null;

//     if (couponCode && couponCode.trim() !== "") {
//       try {
//         validCoupon = await Coupon.findOne({
//           code: couponCode.trim().toUpperCase(),
//           userId,
//           isActive: true,
//           expirationDate: { $gt: new Date() },
//         });

//         if (validCoupon) {
//           discountAmount = Math.round(
//             (originalTotal * validCoupon.discountPercentage) / 100
//           );
//           console.log(
//             `Coupon applied: ${couponCode} - Discount: ₦${discountAmount}`
//           );
//         } else {
//           console.log(`Invalid or expired coupon: ${couponCode}`);
//         }
//       } catch (error) {
//         console.error("Error validating coupon:", error);
//       }
//     }

//     const finalTotal = Math.max(0, originalTotal - discountAmount);
//     const tx_ref = `ECOSTORE-${Date.now()}`;

//     // === CRITICAL: RESERVE INVENTORY BEFORE PAYMENT ===
//     const reservationId = `res_${tx_ref}`;
//     try {
//       await reserveInventory(products, reservationId, 4); // Reserve for 10 minutes
//       console.log(`✅ Inventory reserved: ${reservationId}`);
//     } catch (reservationError) {
//       console.error("❌ Inventory reservation failed:", reservationError);
//       return res.status(400).json({
//         error:
//           "Some items in your cart are no longer available. Please refresh your cart and try again.",
//       });
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
//         finalTotal,
//         deliveryAddress: addressString || "",
//         phoneNumber: defaultPhone.number || "",
//         reservationId: reservationId, // Include reservation ID
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
//       // Release inventory if payment initialization fails
//       await releaseInventory(reservationId);
//       console.error("No payment link returned by Flutterwave:", response.data);
//       return res.status(500).json({ message: "Failed to initialize payment" });
//     }

//     console.log("Flutterwave payment initialized:", tx_ref, "link:", link);
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
//   console.log("🔔 WEBHOOK CALLED - LIVE MODE");
//   console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
//   console.log("🔐 Headers:", req.headers);

//   const signature = req.headers["verif-hash"];
//   console.log("Signature received:", signature ? "YES" : "NO");

//   let transaction_id; // DECLARE IT HERE
//   let lockAcquired = false;

//   try {
//     const signature = req.headers["verif-hash"];
//     console.log("Signature received:", signature);

//     if (!signature) {
//       console.warn("Missing verif-hash header");
//       return res.status(401).send("Missing signature");
//     }

//     if (signature !== process.env.FLW_WEBHOOK_HASH) {
//       console.warn("Invalid webhook signature - possible forgery attempt");
//       return res.status(401).send("Invalid signature");
//     }

//     console.log("Webhook signature validated successfully");

//     const event = req.body;
//     if (!event) {
//       console.warn("Empty webhook event body");
//       return res.status(400).send("No event body");
//     }

//     console.log(`Webhook received: ${event.event} for ${event.data?.tx_ref}`);

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

//     // MOVE THIS OUTSIDE OF NESTED TRY
//     transaction_id = event.data?.id; // ASSIGN VALUE HERE
//     const tx_ref = event.data?.tx_ref;
//     const status = event.data?.status;
//     const paymentType = event.data?.payment_type;

//     // For bank transfers, be more flexible with status values
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

//         // Release inventory
//         const reservationId = event.data?.meta?.reservationId;
//         if (reservationId) {
//           await releaseInventory(reservationId);
//         }

//         return res.status(200).send("Bank transfer not completed");
//       }
//     } else {
//       // For other payment types, use strict checking
//       if (status !== "successful") {
//         console.log(
//           `Payment not successful: ${status} for ${event.data?.tx_ref}`
//         );

//         const reservationId = event.data?.meta?.reservationId;
//         if (reservationId) {
//           await releaseInventory(reservationId);
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

//     // === REDIS-BASED DISTRIBUTED LOCKING ===
//     console.log(`🔒 Attempting to acquire Redis lock for: ${transaction_id}`);
//     lockAcquired = await acquireWebhookLock(transaction_id, 45000);

//     if (!lockAcquired) {
//       console.log(`⏳ Webhook already being processed: ${transaction_id}`);
//       return res.status(200).send("Webhook already being processed");
//     }
//     console.log(`✅ Acquired Redis lock for: ${transaction_id}`);

//     // === ENHANCED DUPLICATE PROTECTION ===
//     const existingOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//     });

//     if (existingOrder) {
//       console.log(
//         `🔄 DUPLICATE: Order ${existingOrder.orderNumber} already exists`
//       );

//       // Release any reserved inventory
//       const reservationId = event.data?.meta?.reservationId;
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       return res.status(200).send("Order already processed");
//     }

//     if (status !== "successful") {
//       console.log(`Payment not successful: ${status} for ${tx_ref}`);

//       // Release inventory if payment failed
//       const reservationId = event.data?.meta?.reservationId;
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       return res.status(200).send("Payment not successful");
//     }

//     console.log(`Processing webhook for successful payment: ${tx_ref}`);

//     let data;

//     console.log(
//       `Verifying real transaction with Flutterwave: ${transaction_id}`
//     );
//     const verifyResp = await flw.Transaction.verify({ id: transaction_id });

//     if (!verifyResp?.data || verifyResp.data.status !== "successful") {
//       console.error(`Webhook verification failed for: ${transaction_id}`);

//       // Release inventory if verification fails
//       const reservationId = event.data?.meta?.reservationId;
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       return res.status(400).send("Payment verification failed");
//     }

//     data = verifyResp.data;
//     console.log("Real transaction verified successfully");

//     const meta_data = data.meta || event.meta_data || {};

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
//     const reservationId = meta_data.reservationId;
//     const originalTotal =
//       Number(meta_data.originalTotal) || Number(data.amount) || 0;
//     const discountAmount = Number(meta_data.discountAmount) || 0;
//     const finalTotal = Number(meta_data.finalTotal) || Number(data.amount) || 0;
//     const deliveryAddress = meta_data.deliveryAddress || "";
//     const phoneNumber = data.customer?.phone_number || "";

//     console.log("UserId from meta_data:", userId);
//     console.log("Reservation ID:", reservationId);
//     console.log("Parsed products count:", parsedProducts.length);

//     if (!userId) {
//       console.error("Missing userId in webhook data");

//       // Release inventory if no user ID
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       return res.status(400).send("Missing userId");
//     }

//     // 2. FINAL DUPLICATE CHECK (in case order was created between first check and now)
//     const finalDuplicateCheck = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//     });

//     if (finalDuplicateCheck) {
//       console.log(
//         `🔄 LATE DUPLICATE: Order ${finalDuplicateCheck.orderNumber} created during processing`
//       );

//       // Release inventory
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       return res.status(200).send("Order already processed");
//     }

//     console.log("Starting database transaction...");
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

//         console.log("Processing order creation...");
//         const { order, isNew } = await processOrderCreation(transactionData);

//         console.log(
//           `${isNew ? "Created new" : "Updated existing"} order: ${
//             order.orderNumber
//           } for user: ${userId}`
//         );

//         // ONLY send email and check coupons for NEW orders

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
//                       orderCount: await Order.countDocuments({
//                         user: userId,
//                         paymentStatus: "paid",
//                       }),
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

//           // SEND ORDER CONFIRMATION EMAIL ONLY FOR NEW ORDERS
//           try {
//             const user = await User.findById(userId);
//             if (user && user.email) {
//               await sendDetailedOrderEmail({
//                 to: user.email,
//                 order,
//                 flutterwaveData: data,
//               });
//               console.log(
//                 `✅ Confirmation email sent for NEW order: ${order.orderNumber}`
//               );
//             }
//           } catch (emailErr) {
//             console.error("Email send failed (webhook):", emailErr);
//           }
//         } else {
//           console.log(
//             `📧 Skipping email and coupons for existing order: ${order.orderNumber}`
//           );
//         }
//       });

//       console.log("Database transaction committed successfully");
//     } catch (transactionError) {
//       console.error("Transaction failed:", transactionError);

//       // Release inventory if transaction fails
//       if (reservationId) {
//         await releaseInventory(reservationId);
//       }

//       throw transactionError;
//     } finally {
//       await session.endSession();
//     }

//     console.log(`Webhook processing completed successfully`);
//     return res.status(200).send("Order processed successfully");
//   } catch (err) {
//     console.error(`Webhook processing error:`, err);

//     // Release inventory on error
//     const reservationId = req.body?.data?.meta?.reservationId;
//     if (reservationId) {
//       await releaseInventory(reservationId);
//     }

//     return res.status(500).send("Webhook processing failed");
//   } finally {
//     // Always release lock if we acquired it
//     if (lockAcquired && transaction_id) {
//       await releaseWebhookLock(transaction_id);
//       console.log(`🔓 Webhook lock released for: ${transaction_id}`);
//     }
//   }
// };

// // ✅ HELPER FUNCTIONS
// function isPaymentSuccessful(status, paymentType) {
//   if (paymentType === "banktransfer" || paymentType === "bank_transfer") {
//     return ["successful", "success", "completed", "credited"].includes(status);
//   }
//   return status === "successful";
// }

// function parseProducts(productsData) {
//   if (!productsData) return [];

//   try {
//     const products =
//       typeof productsData === "string"
//         ? JSON.parse(productsData)
//         : productsData;

//     return products.map((p) => ({
//       _id: p._id || p.id || null,
//       name: p.name,
//       images: p.images || [],
//       quantity: p.quantity || 1,
//       price: p.price,
//       size: p.size || null,
//       color: p.color || null,
//       category: p.category || null,
//     }));
//   } catch (error) {
//     console.error("Error parsing products:", error);
//     return [];
//   }
// }

// async function handlePostOrderActions(userId, order, flutterwaveData) {
//   try {
//     // Handle coupon eligibility
//     const couponEligibility = await checkCouponEligibility(
//       userId,
//       order.totalAmount
//     );

//     if (couponEligibility) {
//       const newCoupon = await createNewCoupon(userId, {
//         discountPercentage: couponEligibility.discountPercentage,
//         couponType: couponEligibility.codePrefix,
//         reason: couponEligibility.reason,
//         daysValid: 30,
//       });

//       if (newCoupon) {
//         const user = await User.findById(userId);
//         if (user?.email) {
//           await sendCouponEmail({
//             to: user.email,
//             coupon: newCoupon,
//             couponType: couponEligibility.emailType,
//             orderCount: await Order.countDocuments({
//               user: userId,
//               paymentStatus: "paid",
//             }),
//           });
//         }
//       }
//     }

//     // Send order confirmation
//     const user = await User.findById(userId);
//     if (user?.email) {
//       await sendDetailedOrderEmail({
//         to: user.email,
//         order,
//         flutterwaveData,
//       });
//     }
//   } catch (error) {
//     console.error("Post-order actions failed:", error);
//   }
// }
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

//   console.log(
//     ` ENTERING ORDER PROCESSING - Source: ${
//       req.path
//     }, TX: ${transaction_id}, Time: ${new Date().toISOString()}`
//   );

//   // ADD VALIDATION
//   if (!transaction_id) {
//     return res.status(400).json({
//       error: "transaction_id is required",
//       received: req.body,
//     });
//   }

//   console.log(`🔄 checkoutSuccess called for transaction: ${transaction_id}`);

//   try {
//     // Duplicate protection
//     const existingPaidOrder = await Order.findOne({
//       $or: [
//         { flutterwaveTransactionId: transaction_id },
//         { flutterwaveRef: tx_ref },
//       ],
//       paymentStatus: "paid",
//     });

//     if (existingPaidOrder) {
//       console.log(
//         `🔄 CheckoutSuccess: Order already processed: ${existingPaidOrder.orderNumber}`
//       );
//       return res.status(200).json({
//         success: true,
//         message: "Order already processed",
//         orderId: existingPaidOrder._id,
//         orderNumber: existingPaidOrder.orderNumber,
//       });
//     }

//     // Acquire lock
//     lockAcquired = await acquireWebhookLock(transaction_id, 30000);
//     if (!lockAcquired) {
//       console.log(
//         `⏳ checkoutSuccess: Lock already acquired for ${transaction_id}`
//       );

//       // Wait 1 second and check if order exists now
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
//           isNewOrder = isNew; // Store whether this is a new order

//           // ONLY process coupons and send emails for NEW orders
//           if (isNew) {
//             // Handle coupon eligibility
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
//                 console.log(
//                   `Created ${couponEligibility.reason} coupon: ${newCoupon.code}`
//                 );
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

//             // Send confirmation email ONLY for new orders
//             try {
//               const user = await User.findById(userId);
//               await sendDetailedOrderEmail({
//                 to: user.email,
//                 order,
//                 flutterwaveData: data,
//               });
//               console.log(
//                 `✅ Confirmation email sent for NEW order: ${order.orderNumber}`
//               );
//             } catch (emailErr) {
//               console.error("Email send failed (checkoutSuccess):", emailErr);
//             }
//           } else {
//             console.log(
//               `📧 Skipping email for existing order: ${order.orderNumber}`
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
//       isNew: isNewOrder, // Optional: include for debugging
//     });
//   } catch (error) {
//     console.error("checkoutSuccess failed:", error);

//     // Release inventory on failure
//     const reservationId = req.body.meta?.reservationId;
//     if (reservationId) {
//       await releaseInventory(reservationId);
//     }

//     return res.status(500).json({
//       error: error.message || "Checkout failed",
//     });
//   } finally {
//     // RELEASE LOCK
//     if (lockAcquired) {
//       await releaseWebhookLock(transaction_id);
//     }
//   }
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

// 1. First define all helper functions

async function clearStaleDatabaseReservations() {
  console.log("🔍 Checking for VERY stale reservations (30+ minutes old)...");

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const productsWithReservations = await Product.find({
      $or: [{ reserved: { $gt: 0 } }, { "variants.reserved": { $gt: 0 } }],
      updatedAt: { $lt: thirtyMinutesAgo }, // Only very old reservations
    });

    for (const product of productsWithReservations) {
      // Only release reservations that are 30+ minutes old
      // This handles true edge cases without interfering with normal flow
    }
  } catch (error) {
    console.error("❌ Error in cleanup:", error);
  }
}


// 2. Reservation functions using Redis
async function reserveInventory(products, reservationId, timeoutMinutes = 4) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of products) {
        if (!item._id) continue;

        console.log(`🔄 Reserving ${item.quantity} of ${item.name}`);

        const product = await Product.findById(item._id).session(session);
        if (!product) throw new Error(`Product ${item.name} not found`);

        // FIXED: Use flexible matching for variants (same as frontend)
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
          console.log(
            `📦 BEFORE - ${item.name} ${item.size || ""}/${
              item.color || ""
            }: Stock=${variant.countInStock}, Reserved=${variant.reserved || 0}`
          );

          // Check stock
          if (variant.countInStock < item.quantity) {
            throw new Error(
              `Only ${variant.countInStock} available, but ${item.quantity} requested`
            );
          }

          // ACTUALLY DEDUCT INVENTORY HERE
          variant.countInStock -= item.quantity;
          variant.reserved = (variant.reserved || 0) + item.quantity;

          console.log(
            `📦 AFTER - ${item.name} ${item.size || ""}/${
              item.color || ""
            }: Stock=${variant.countInStock}, Reserved=${variant.reserved}`
          );

          // Update total product stock
          product.countInStock = product.variants.reduce(
            (total, v) => total + v.countInStock,
            0
          );
        }
        // Handle simple products (no variants)
        else {
          console.log(
            `📦 BEFORE - ${item.name}: Stock=${
              product.countInStock
            }, Reserved=${product.reserved || 0}`
          );

          if (product.countInStock < item.quantity) {
            throw new Error(
              `Only ${product.countInStock} available, but ${item.quantity} requested`
            );
          }

          // ACTUALLY DEDUCT INVENTORY HERE
          product.countInStock -= item.quantity;
          product.reserved = (product.reserved || 0) + item.quantity;

          console.log(
            `📦 AFTER - ${item.name}: Stock=${product.countInStock}, Reserved=${product.reserved}`
          );
        }

        await product.save({ session });
        console.log(
          `✅ Successfully reserved ${item.quantity} of ${item.name}`
        );
      }
    });

    // Store reservation in Redis
    await storeReservation(reservationId, {
      products,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + timeoutMinutes * 60 * 1000),
      timeoutMinutes: timeoutMinutes,
    });

    console.log(`🎉 ALL inventory reserved successfully: ${reservationId}`);
    return true;
  } catch (error) {
    console.error("❌ Reservation failed:", error);

    // Release any partial reservations
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
  // Check if we've already processed this release
  const alreadyReleased = await getReleasedReservation(reservationId);
  if (alreadyReleased) {
    console.log(`🔄 Release already processed for: ${reservationId}`);
    return;
  }

  const reservation = await getReservation(reservationId);
  if (!reservation) {
    console.log(`No reservation found: ${reservationId}`);
    return;
  }

  console.log(`🔄 Releasing reservation: ${reservationId}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) {
          console.log(`Product not found for ID: ${item._id}`);
          continue;
        }

        // FIXED: Use flexible matching for variants
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

            // ✅ FIXED: Add safety check - only release if we have enough reserved
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

              console.log(
                `✅ Released ${reservedToRelease} of ${item.name} variant - Stock now: ${variant.countInStock}, Reserved: ${variant.reserved}`
              );
            } else {
              console.log(
                `⚠️ No reserved stock to release for ${item.name} ${
                  item.size || ""
                }/${item.color || ""}`
              );
            }

            // Update total product stock
            product.countInStock = product.variants.reduce(
              (total, v) => total + v.countInStock,
              0
            );
          }
        } else {
          // Simple product - add safety check
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
            console.log(
              `✅ Released ${reservedToRelease} of ${item.name} - Stock now: ${product.countInStock}, Reserved: ${product.reserved}`
            );
          } else {
            console.log(`⚠️ No reserved stock to release for ${item.name}`);
          }
        }

        await product.save({ session });
      }
    });

    // ✅ Mark this reservation as released to prevent duplicate processing
    await storeReleasedReservation(reservationId, {
      releasedAt: new Date(),
      originalReservation: reservation,
    });

    // Remove the original reservation
    await deleteReservation(reservationId);

    console.log(`🎉 Successfully released reservation: ${reservationId}`);
  } catch (error) {
    console.error("❌ Release failed:", error);
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

  console.log(`🔄 Confirming reservation: ${reservationId}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of reservation.products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id).session(session);
        if (!product) continue;

        // FIXED: Use flexible matching for variants
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

            console.log(
              `📊 BEFORE CONFIRMATION - ${item.name} ${item.size || ""}/${
                item.color || ""
              }: Stock=${variant.countInStock}, Reserved=${
                variant.reserved || 0
              }`
            );

            // Remove reservation flag - stock is already at the reduced level from reservation
            variant.reserved = Math.max(
              0,
              (variant.reserved || 0) - item.quantity
            );

            console.log(
              `✅ CONFIRMED ${item.name} ${item.size || ""}/${
                item.color || ""
              } - Final: Stock=${variant.countInStock}, Reserved=${
                variant.reserved
              }`
            );

            console.log(
              `📊 INVENTORY REDUCTION: ${item.name} ${item.size || ""}/${
                item.color || ""
              } - Stock permanently reduced by ${item.quantity} units`
            );
          } else {
            console.log(
              `❌ Variant not found for confirmation: ${item.name} ${
                item.size || ""
              }/${item.color || ""}`
            );
          }
        } else {
          // Simple product - remove reservation flag only (stock already reduced)
          console.log(
            `📊 BEFORE CONFIRMATION - ${item.name}: Stock=${
              product.countInStock
            }, Reserved=${product.reserved || 0}`
          );

          product.reserved = Math.max(
            0,
            (product.reserved || 0) - item.quantity
          );

          console.log(
            `✅ CONFIRMED ${item.name} - Final: Stock=${product.countInStock}, Reserved=${product.reserved}`
          );

          console.log(
            `📊 INVENTORY REDUCTION: ${item.name} - Stock permanently reduced by ${item.quantity} units`
          );
        }

        await product.save({ session });
      }
    });

    await deleteReservation(reservationId);
    console.log(`🎉 Successfully CONFIRMED reservation: ${reservationId}`);
  } catch (error) {
    console.error("❌ Confirmation failed:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}
setInterval(async () => {
  console.log("🕒 Running Redis reservation cleanup...");

  try {
    // Get all Redis reservation keys
    const keys = await redis.keys("reservation:*");
    console.log(`📊 Found ${keys.length} Redis reservations`);

    let releasedCount = 0;
    let expiredButStuckCount = 0;

    // Get all active reservation IDs from Redis
    const activeReservationIds = new Set();
    for (const key of keys) {
      const reservationId = key.replace("reservation:", "");
      activeReservationIds.add(reservationId);

      const reservationData = await getReservation(reservationId);
      if (reservationData) {
        const now = new Date();
        const expiresAt = new Date(reservationData.expiresAt);

        // If reservation has expired, release it
        if (now > expiresAt) {
          console.log(`⏰ Releasing expired reservation: ${reservationId}`);
          try {
            await releaseInventory(reservationId);
            releasedCount++;
          } catch (error) {
            console.error(`❌ Failed to release ${reservationId}:`, error);
          }
        } else {
          const ttl = Math.floor((expiresAt - now) / 1000);
          console.log(`⏰ ${reservationId}: ${ttl} seconds remaining`);
        }
      }
    }

    // ONLY check for stuck reservations that are NOT in Redis
    const stuckProducts = await Product.find({
      $or: [{ reserved: { $gt: 0 } }, { "variants.reserved": { $gt: 0 } }],
    });

    for (const product of stuckProducts) {
      let needsFix = false;

      // Check if this product has any active Redis reservations
      const hasActiveReservation = await checkProductHasActiveReservation(
        product,
        activeReservationIds
      );

      if (!hasActiveReservation) {
        // Only fix reservations that don't have active Redis entries
        if (product.reserved > 0) {
          console.log(
            `🔄 Found STUCK main reservation for ${product.name}: ${product.reserved} units (no active Redis reservation)`
          );
          product.countInStock += product.reserved;
          product.reserved = 0;
          needsFix = true;
        }

        // Check variants
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant, index) => {
            if (variant.reserved > 0) {
              console.log(
                `🔄 Found STUCK variant reservation for ${product.name} ${variant.size}/${variant.color}: ${variant.reserved} units (no active Redis reservation)`
              );
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
        console.log(`✅ Fixed STUCK reservations for ${product.name}`);
      }
    }

    if (releasedCount > 0 || expiredButStuckCount > 0) {
      console.log(
        `✅ Released ${releasedCount} expired reservations and fixed ${expiredButStuckCount} stuck reservations`
      );
    } else {
      console.log("✅ No expired or stuck reservations found");
    }
  } catch (error) {
    console.error("❌ Error in reservation cleanup:", error);
  }
}, 30000);

// Helper function to check if a product has active Redis reservations
async function checkProductHasActiveReservation(product, activeReservationIds) {
  // This would require storing product IDs in Redis reservations
  // For now, we'll assume any reservation in Redis might be for this product
  // and be conservative (don't release if there are any active reservations)
  return activeReservationIds.size > 0;
}
 
// 4. Add the immediate cleanup function (run this once)
async function clearAllReservations() {
  console.log("🧹 Clearing all stale reservations from database...");

  try {
    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      // Find all products with reserved inventory
      const productsWithReservations = await Product.find({
        $or: [{ reserved: { $gt: 0 } }, { "variants.reserved": { $gt: 0 } }],
      }).session(session);

      console.log(
        `📊 Found ${productsWithReservations.length} products with reservations`
      );

      for (const product of productsWithReservations) {
        let changed = false;

        // Clear main product reservations
        if (product.reserved > 0) {
          console.log(
            `🔄 Clearing main reservation for ${product.name}: ${product.reserved} units`
          );
          product.countInStock += product.reserved;
          product.reserved = 0;
          changed = true;
        }

        // Clear variant reservations
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant, index) => {
            if (variant.reserved > 0) {
              console.log(
                `🔄 Clearing variant reservation for ${product.name} ${variant.size}/${variant.color}: ${variant.reserved} units`
              );
              product.variants[index].countInStock += variant.reserved;
              product.variants[index].reserved = 0;
              changed = true;
            }
          });

          // Update total stock
          if (changed) {
            product.countInStock = product.variants.reduce(
              (total, v) => total + v.countInStock,
              0
            );
          }
        }

        if (changed) {
          await product.save({ session });
          console.log(`✅ Cleared reservations for ${product.name}`);
        }
      }
    });

    await session.endSession();
    console.log("🎉 All stale reservations cleared successfully");
  } catch (error) {
    console.error("❌ Failed to clear reservations:", error);
  }
}

// 5. Run the immediate cleanup once
mongoose.connection.on("connected", async () => {
  console.log("✅ MongoDB connected - starting reservation cleanup...");
  await clearAllReservations();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

async function checkCouponEligibility(userId, orderAmount) {
  try {
    const orderCount = await Order.countDocuments({
      user: userId,
      paymentStatus: "paid",
    });

    console.log(
      `Checking coupon eligibility for user ${userId}: ${orderCount} orders, ₦${orderAmount}`
    );

    const activeCoupon = await Coupon.findOne({
      userId: userId,
      isActive: true,
      expirationDate: { $gt: new Date() },
    });

    if (activeCoupon) {
      console.log(
        `User ${userId} already has active coupon: ${activeCoupon.code}`
      );
      return null;
    }

    if (orderCount === 1) {
      console.log(`User ${userId} eligible for FIRST ORDER coupon`);
      return {
        discountPercentage: 10,
        codePrefix: "WELCOME",
        reason: "first_order",
        emailType: "welcome_coupon",
      };
    } else if (orderCount === 3) {
      console.log(`User ${userId} eligible for THIRD ORDER coupon`);
      return {
        discountPercentage: 15,
        codePrefix: "LOYAL",
        reason: "third_order_milestone",
        emailType: "loyalty_coupon",
      };
    } else if (orderCount >= 5 && orderCount % 5 === 0) {
      console.log(
        `User ${userId} eligible for VIP coupon (${orderCount} orders)`
      );
      return {
        discountPercentage: 20,
        codePrefix: "VIP",
        reason: "every_five_orders",
        emailType: "vip_coupon",
      };
    } else if (orderAmount > 175000) {
      console.log(
        `User ${userId} eligible for BIG SPENDER coupon (₦${orderAmount})`
      );
      return {
        discountPercentage: 15,
        codePrefix: "BIGSPEND",
        reason: "high_value_order",
        emailType: "bigspender_coupon",
      };
    }

    console.log(
      `User ${userId} not eligible for coupon (${orderCount} orders, ₦${orderAmount})`
    );
    return null;
  } catch (error) {
    console.error("Error checking coupon eligibility:", error);
    return null;
  }
}

async function createNewCoupon(userId, options = {}) {
  const {
    discountPercentage = 10,
    daysValid = 30,
    couponType = "GIFT",
    reason = "general",
  } = options;

  try {
    console.log(`Starting coupon creation for user ${userId}...`);

    const newCode =
      couponType + Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log(`Generated coupon code: ${newCode}`);

    const coupon = await Coupon.findOneAndUpdate(
      { userId: userId },
      {
        code: newCode,
        discountPercentage,
        expirationDate: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000),
        isActive: true,
        couponReason: reason,
        deactivatedAt: null,
        deactivationReason: null,
        usedAt: null,
        usedInOrder: null,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      `Successfully ${coupon.$isNew ? "CREATED" : "UPDATED"} coupon: ${
        coupon.code
      } for user ${userId}`
    );
    return coupon;
  } catch (error) {
    console.error("Failed to create/update coupon:", error);
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

  console.log(` STARTING order processing for: ${tx_ref}`);

  // 1. IMMEDIATE DUPLICATE CHECK
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

  // 2. CREATE ORDER (inventory already reserved)
  try {
    console.log(` CREATING NEW ORDER for user: ${userId}`);

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
      totalAmount: Number(meta.finalTotal) || Number(data.amount) || 0,
      orderNumber: generateOrderNumber(),
      couponCode: couponCode || null,
      deliveryAddress: meta.deliveryAddress || "No address provided",
      phone: meta.phoneNumber || "No phone provided",
      flutterwaveRef: tx_ref,
      flutterwaveTransactionId: transaction_id,
      paymentStatus: "paid",
      status: "Pending",
      paymentMethod: createPaymentMethodData(data),
      isProcessed: true,
    });

    await order.save();
    console.log(` SUCCESS: Created order ${order.orderNumber}`);

    // 3. CONFIRM INVENTORY (convert reservation to permanent)
    if (reservationId) {
      await confirmInventory(reservationId);
    }

    // 4. CLEAR CART
    await User.findByIdAndUpdate(userId, { cartItems: [] });

    // 5. HANDLE COUPON APPLICATION (if coupon was used in this order)
    if (couponCode?.trim()) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.trim().toUpperCase(), userId, isActive: true },
        { isActive: false, usedAt: new Date(), usedInOrder: tx_ref }
      );
      console.log(` Coupon applied: ${couponCode}`);
    }

    return { order, isNew: true };
  } catch (error) {
    // Handle duplicate order error
    if (error.code === 11000) {
      console.log(`🔄 Duplicate key error - finding existing order...`);
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

    console.error(`❌ ORDER CREATION FAILED:`, error);
    throw error;
  }
}

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;
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

    // === CHECK AVAILABILITY BEFORE RESERVATION ===
    console.log("🔍 Checking availability before reservation...");
    try {
      for (const item of products) {
        if (!item._id) continue;

        const product = await Product.findById(item._id);
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }

        // Handle variants
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
          console.log(
            `📊 Availability check - ${item.name} ${item.size || ""}/${
              item.color || ""
            }: Stock=${variant.countInStock}, Requested=${item.quantity}`
          );

          if (variant.countInStock < item.quantity) {
            throw new Error(
              ` ${item.name} ${item.size || ""}/${
                item.color || ""
              }, is out of stock, please update you cart`
            );
          }
        }
        // Handle simple products
        else {
          console.log(
            `📊 Availability check - ${item.name}: Stock=${product.countInStock}, Requested=${item.quantity}`
          );

          if (product.countInStock < item.quantity) {
            throw new Error(
              `Only ${product.countInStock} available for ${item.name}, but ${item.quantity} requested`
            );
          }
        }
      }
      console.log("✅ All items available for reservation");
    } catch (availabilityError) {
      console.error("❌ Availability check failed:", availabilityError.message);
      return res.status(400).json({
        error: availabilityError.message,
      });
    }
    // Calculate totals
    const originalTotal = products.reduce((acc, p) => {
      const qty = p.quantity || 1;
      const price = Number(p.price) || 0;
      return acc + price * qty;
    }, 0);

    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode && couponCode.trim() !== "") {
      try {
        validCoupon = await Coupon.findOne({
          code: couponCode.trim().toUpperCase(),
          userId,
          isActive: true,
          expirationDate: { $gt: new Date() },
        });

        if (validCoupon) {
          discountAmount = Math.round(
            (originalTotal * validCoupon.discountPercentage) / 100
          );
          console.log(
            `Coupon applied: ${couponCode} - Discount: ₦${discountAmount}`
          );
        } else {
          console.log(`Invalid or expired coupon: ${couponCode}`);
        }
      } catch (error) {
        console.error("Error validating coupon:", error);
      }
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);
    const tx_ref = `ECOSTORE-${Date.now()}`;

    // === CRITICAL: RESERVE INVENTORY BEFORE PAYMENT ===
    const reservationId = `res_${tx_ref}`;
    try {
      await reserveInventory(products, reservationId, 4); // Reserve for 10 minutes
      console.log(`✅ Inventory reserved: ${reservationId}`);
    } catch (reservationError) {
      console.error("❌ Inventory reservation failed:", reservationError);
      return res.status(400).json({
        error:
          "Some items in your cart are no longer available. Please refresh your cart and try again.",
      });
    }

    const payload = {
      tx_ref,
      amount: finalTotal,
      currency: "NGN",
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
        finalTotal,
        deliveryAddress: addressString || "",
        phoneNumber: defaultPhone.number || "",
        reservationId: reservationId, // Include reservation ID
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
      // Release inventory if payment initialization fails
      await releaseInventory(reservationId);
      console.error("No payment link returned by Flutterwave:", response.data);
      return res.status(500).json({ message: "Failed to initialize payment" });
    }

    console.log("Flutterwave payment initialized:", tx_ref, "link:", link);
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
  console.log("🔔 WEBHOOK CALLED - LIVE MODE");
  console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
  console.log("🔐 Headers:", req.headers);

  const signature = req.headers["verif-hash"];
  console.log("Signature received:", signature ? "YES" : "NO");

  let transaction_id; // DECLARE IT HERE
  let lockAcquired = false;

  try {
    const signature = req.headers["verif-hash"];
    console.log("Signature received:", signature);

    if (!signature) {
      console.warn("Missing verif-hash header");
      return res.status(401).send("Missing signature");
    }

    if (signature !== process.env.FLW_WEBHOOK_HASH) {
      console.warn("Invalid webhook signature - possible forgery attempt");
      return res.status(401).send("Invalid signature");
    }

    console.log("Webhook signature validated successfully");

    const event = req.body;
    if (!event) {
      console.warn("Empty webhook event body");
      return res.status(400).send("No event body");
    }

    console.log(`Webhook received: ${event.event} for ${event.data?.tx_ref}`);

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

    // MOVE THIS OUTSIDE OF NESTED TRY
    transaction_id = event.data?.id; // ASSIGN VALUE HERE
    const tx_ref = event.data?.tx_ref;
    const status = event.data?.status;
    const paymentType = event.data?.payment_type;

    // For bank transfers, be more flexible with status values
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

        // Release inventory
        const reservationId = event.data?.meta?.reservationId;
        if (reservationId) {
          await releaseInventory(reservationId);
        }

        return res.status(200).send("Bank transfer not completed");
      }
    } else {
      // For other payment types, use strict checking
      if (status !== "successful") {
        console.log(
          `Payment not successful: ${status} for ${event.data?.tx_ref}`
        );

        const reservationId = event.data?.meta?.reservationId;
        if (reservationId) {
          await releaseInventory(reservationId);
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

    // === REDIS-BASED DISTRIBUTED LOCKING ===
    console.log(`🔒 Attempting to acquire Redis lock for: ${transaction_id}`);
    lockAcquired = await acquireWebhookLock(transaction_id, 45000);

    if (!lockAcquired) {
      console.log(`⏳ Webhook already being processed: ${transaction_id}`);
      return res.status(200).send("Webhook already being processed");
    }
    console.log(`✅ Acquired Redis lock for: ${transaction_id}`);

    // === ENHANCED DUPLICATE PROTECTION ===
    const existingOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
    });

    if (existingOrder) {
      console.log(
        `🔄 DUPLICATE: Order ${existingOrder.orderNumber} already exists`
      );

      // Release any reserved inventory
      const reservationId = event.data?.meta?.reservationId;
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(200).send("Order already processed");
    }

    if (status !== "successful") {
      console.log(`Payment not successful: ${status} for ${tx_ref}`);

      // Release inventory if payment failed
      const reservationId = event.data?.meta?.reservationId;
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(200).send("Payment not successful");
    }

    console.log(`Processing webhook for successful payment: ${tx_ref}`);

    let data;

    console.log(
      `Verifying real transaction with Flutterwave: ${transaction_id}`
    );
    const verifyResp = await flw.Transaction.verify({ id: transaction_id });

    if (!verifyResp?.data || verifyResp.data.status !== "successful") {
      console.error(`Webhook verification failed for: ${transaction_id}`);

      // Release inventory if verification fails
      const reservationId = event.data?.meta?.reservationId;
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(400).send("Payment verification failed");
    }

    data = verifyResp.data;
    console.log("Real transaction verified successfully");

    const meta_data = data.meta || event.meta_data || {};

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
    const reservationId = meta_data.reservationId;
    const originalTotal =
      Number(meta_data.originalTotal) || Number(data.amount) || 0;
    const discountAmount = Number(meta_data.discountAmount) || 0;
    const finalTotal = Number(meta_data.finalTotal) || Number(data.amount) || 0;
    const deliveryAddress = meta_data.deliveryAddress || "";
    const phoneNumber = data.customer?.phone_number || "";

    console.log("UserId from meta_data:", userId);
    console.log("Reservation ID:", reservationId);
    console.log("Parsed products count:", parsedProducts.length);

    if (!userId) {
      console.error("Missing userId in webhook data");

      // Release inventory if no user ID
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(400).send("Missing userId");
    }

    // 2. FINAL DUPLICATE CHECK (in case order was created between first check and now)
    const finalDuplicateCheck = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
    });

    if (finalDuplicateCheck) {
      console.log(
        `🔄 LATE DUPLICATE: Order ${finalDuplicateCheck.orderNumber} created during processing`
      );

      // Release inventory
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      return res.status(200).send("Order already processed");
    }

    console.log("Starting database transaction...");
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

        console.log("Processing order creation...");
        const { order, isNew } = await processOrderCreation(transactionData);

        console.log(
          `${isNew ? "Created new" : "Updated existing"} order: ${
            order.orderNumber
          } for user: ${userId}`
        );

        // ONLY send email and check coupons for NEW orders

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
                      orderCount: await Order.countDocuments({
                        user: userId,
                        paymentStatus: "paid",
                      }),
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

          // SEND ORDER CONFIRMATION EMAIL ONLY FOR NEW ORDERS
          try {
            const user = await User.findById(userId);
            if (user && user.email) {
              await sendDetailedOrderEmail({
                to: user.email,
                order,
                flutterwaveData: data,
              });
              console.log(
                `✅ Confirmation email sent for NEW order: ${order.orderNumber}`
              );
            }
          } catch (emailErr) {
            console.error("Email send failed (webhook):", emailErr);
          }
        } else {
          console.log(
            `📧 Skipping email and coupons for existing order: ${order.orderNumber}`
          );
        }
      });

      console.log("Database transaction committed successfully");
    } catch (transactionError) {
      console.error("Transaction failed:", transactionError);

      // Release inventory if transaction fails
      if (reservationId) {
        await releaseInventory(reservationId);
      }

      throw transactionError;
    } finally {
      await session.endSession();
    }

    console.log(`Webhook processing completed successfully`);
    return res.status(200).send("Order processed successfully");
  } catch (err) {
    console.error(`Webhook processing error:`, err);

    // Release inventory on error
    const reservationId = req.body?.data?.meta?.reservationId;
    if (reservationId) {
      await releaseInventory(reservationId);
    }

    return res.status(500).send("Webhook processing failed");
  } finally {
    // Always release lock if we acquired it
    if (lockAcquired && transaction_id) {
      await releaseWebhookLock(transaction_id);
      console.log(`🔓 Webhook lock released for: ${transaction_id}`);
    }
  }
};

// ✅ HELPER FUNCTIONS
function isPaymentSuccessful(status, paymentType) {
  if (paymentType === "banktransfer" || paymentType === "bank_transfer") {
    return ["successful", "success", "completed", "credited"].includes(status);
  }
  return status === "successful";
}

function parseProducts(productsData) {
  if (!productsData) return [];

  try {
    const products =
      typeof productsData === "string"
        ? JSON.parse(productsData)
        : productsData;

    return products.map((p) => ({
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
    return [];
  }
}

async function handlePostOrderActions(userId, order, flutterwaveData) {
  try {
    // Handle coupon eligibility
    const couponEligibility = await checkCouponEligibility(
      userId,
      order.totalAmount
    );

    if (couponEligibility) {
      const newCoupon = await createNewCoupon(userId, {
        discountPercentage: couponEligibility.discountPercentage,
        couponType: couponEligibility.codePrefix,
        reason: couponEligibility.reason,
        daysValid: 30,
      });

      if (newCoupon) {
        const user = await User.findById(userId);
        if (user?.email) {
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
      }
    }

    // Send order confirmation
    const user = await User.findById(userId);
    if (user?.email) {
      await sendDetailedOrderEmail({
        to: user.email,
        order,
        flutterwaveData,
      });
    }
  } catch (error) {
    console.error("Post-order actions failed:", error);
  }
}


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

  console.log(
    ` ENTERING ORDER PROCESSING - Source: ${
      req.path
    }, TX: ${transaction_id}, Time: ${new Date().toISOString()}`
  );

  // ADD VALIDATION
  if (!transaction_id) {
    return res.status(400).json({
      error: "transaction_id is required",
      received: req.body,
    });
  }

  console.log(`🔄 checkoutSuccess called for transaction: ${transaction_id}`);

  try {
    // Duplicate protection
    const existingPaidOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: transaction_id },
        { flutterwaveRef: tx_ref },
      ],
      paymentStatus: "paid",
    });

    if (existingPaidOrder) {
      console.log(
        `🔄 CheckoutSuccess: Order already processed: ${existingPaidOrder.orderNumber}`
      );
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: existingPaidOrder._id,
        orderNumber: existingPaidOrder.orderNumber,
      });
    }

    // Acquire lock
    lockAcquired = await acquireWebhookLock(transaction_id, 30000);
    if (!lockAcquired) {
      console.log(
        `⏳ checkoutSuccess: Lock already acquired for ${transaction_id}`
      );

      // Wait 1 second and check if order exists now
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
          isNewOrder = isNew; // Store whether this is a new order

          // ONLY process coupons and send emails for NEW orders
          if (isNew) {
            // Handle coupon eligibility
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
                console.log(
                  `Created ${couponEligibility.reason} coupon: ${newCoupon.code}`
                );
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

            // Send confirmation email ONLY for new orders
            try {
              const user = await User.findById(userId);
              await sendDetailedOrderEmail({
                to: user.email,
                order,
                flutterwaveData: data,
              });
              console.log(
                `✅ Confirmation email sent for NEW order: ${order.orderNumber}`
              );
            } catch (emailErr) {
              console.error("Email send failed (checkoutSuccess):", emailErr);
            }
          } else {
            console.log(
              `📧 Skipping email for existing order: ${order.orderNumber}`
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
      isNew: isNewOrder, // Optional: include for debugging
    });
  } catch (error) {
    console.error("checkoutSuccess failed:", error);

    // Release inventory on failure
    const reservationId = req.body.meta?.reservationId;
    if (reservationId) {
      await releaseInventory(reservationId);
    }

    return res.status(500).json({
      error: error.message || "Checkout failed",
    });
  } finally {
    // RELEASE LOCK
    if (lockAcquired) {
      await releaseWebhookLock(transaction_id);
    }
  }
};

// Update your email function to use paymentMethod instead of paymentData
export const sendDetailedOrderEmail = async ({
  to,
  order,
  flutterwaveData,
}) => {
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

  // Use paymentMethod from order instead of paymentData
  const paymentMethod = order.paymentMethod || {};
  const tx_ref = order.flutterwaveRef || "N/A";
  const transaction_id = order.flutterwaveTransactionId || "N/A";
  const payment_type = paymentMethod.method || "N/A";
  const card = paymentMethod.card || {};

  // Prepare items array
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
          <td style="padding: 8px 12px; text-align:right; border:1px solid #eee;">₦${Number(
            item.price || item.unitPrice || 0
          ).toLocaleString()}</td>
        </tr>`;
    })
    .join("");

  const totalAmount = order.totalAmount || order.totalPrice || order.total || 0;
  const subtotal = order.subtotal || order.subTotal || 0;
  const discount = order.discount || 0;

  // Card info block (masked)
  const maskedLast4 = card.last4 || card.last_4digits || "****";
  const cardBrand = card.type || "Card";

  const cardInfo = card.last4
    ? `
    <div style="margin-top:10px;font-size:14px;color:#333;">
      <strong>Payment Method:</strong> ${cardBrand} **** ${maskedLast4}<br/>
    </div>`
    : "";

  // HTML email (your existing email template with paymentMethod adjustments)
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 20px;">
      <div style="max-width: 700px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);">
        <div style="background: #10b981; padding: 22px; text-align: center; color: #fff;">
          <img src="${
            process.env.STORE_LOGO || ""
          }" alt="Store Logo" style="max-height:50px; display:block; margin: 0 auto 8px;" />
          <h1 style="margin:0; font-size:20px;">Order Confirmation</h1>
          <div style="margin-top:6px; font-size:15px;">${
            order.orderNumber || "N/A"
          }</div>
        </div>

        <div style="padding: 22px; color:#333;">
          <p style="margin:0 0 8px;">Hi <strong>${customerName}</strong>,</p>
          <p style="margin:0 0 16px;">Thank you for your order! We've received your payment and are now processing your purchase. Below are your order details.</p>

          <h3 style="margin:18px 0 8px;">🧾 Order Summary</h3>
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
            <strong>Original Subtotal:</strong> ₦${Number(
              subtotal
            ).toLocaleString()} <br>
            <strong>Coupon Discount:</strong> -₦${Number(
              discount
            ).toLocaleString()}<br>
            <strong>Final Total:</strong> ₦${Number(
              totalAmount
            ).toLocaleString()}
          </p>

          <p style="margin:0;">
            <strong>Address:</strong> ${
              order.deliveryAddress || "No address provided"
            }<br/>
            <strong>Phone:</strong> ${order.phone || "No phone provided"}<br/>
            <strong>Email:</strong> ${to}
          </p>

          <h3 style="margin:18px 0 8px;">💳 Payment Details</h3>
          <p style="margin:0 0 6px;">
            <strong>Payment Status:</strong> ${
              order.paymentStatus || "Confirmed"
            }<br/>
            <strong>Payment Type:</strong> ${payment_type}<br/>
            <strong>Transaction Ref:</strong> ${tx_ref}<br/>
            <strong>Transaction ID:</strong> ${transaction_id}
          </p>

          ${cardInfo}

          <p style="margin-top:20px; color:#555;">We'll send another email once your order ships.</p>

          
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;"><p style="margin-top:18px;">Thanks for choosing <strong>Eco~Store</strong> 🌱</p>
          <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
            process.env.SUPPORT_EMAIL || "support@ecostore.example"
          }" 
             style="color: #10b981; text-decoration: none;">${
               process.env.SUPPORT_EMAIL || "support@ecostore.example"
             }</a></p>
        </div>
      </div>
    </div>
  `;

  // Plain text fallback
  const text = [
    `EcoStore — Order Confirmation`,
    ` ${order.orderNumber || "N/A"}`,
    `Customer: ${customerName}`,
    `Total: ₦${Number(totalAmount).toLocaleString()}`,
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
        ` - ${it.quantity || 1} x ${it.name || "Item"} — ₦${Number(
          it.price || 0
        ).toLocaleString()}`
    ),
    ``,
    `Thanks for shopping with Eco~Store!`,
  ].join("\n");

  // Send email
  await sendEmail({
    to,
    subject: `EcoStore — Order Confirmation #${order.orderNumber || "N/A"}`,
    html,
    text,
  });
};

// Add this function after sendDetailedOrderEmail
export const sendCouponEmail = async ({
  to,
  coupon,
  couponType = "welcome_coupon",
  orderCount = 1,
}) => {
  if (!to || !coupon) return;

  let subject = "";
  let title = "";
  let message = "";
  let couponValue = `${coupon.discountPercentage}% OFF`;

  // Different email content based on coupon type
  switch (couponType) {
    case "welcome_coupon":
      subject = `🎉 Welcome to EcoStore! Here's Your ${couponValue} Gift`;
      title = "Welcome to the EcoStore Family!";
      message = `
        <p>Thank you for joining us! To welcome you to our eco-friendly community, 
        we're giving you a special discount on your next purchase.</p>
        <p>We're thrilled to have you as part of our mission to make the world greener, one purchase at a time.</p>
      `;
      break;

    case "loyalty_coupon":
      subject = `🌟 Loyalty Reward! ${couponValue} for Being an Amazing Customer`;
      title = "You're Amazing! Here's a Thank You Gift";
      message = `
        <p>Wow! You've already placed ${orderCount} orders with us. We're truly grateful 
        for your loyalty and trust in EcoStore.</p>
        <p>As a token of our appreciation, please enjoy this special discount on your next eco-friendly purchase.</p>
      `;
      break;

    case "vip_coupon":
      subject = `🏆 VIP Treatment! ${couponValue} Exclusive Reward`;
      title = "You're Now an EcoStore VIP!";
      message = `
        <p>Congratulations! With ${orderCount} orders, you've officially reached VIP status 
        in our eco-friendly community.</p>
        <p>Thank you for being such a dedicated supporter of sustainable living. 
        Enjoy this exclusive VIP reward!</p>
      `;
      break;

    case "bigspender_coupon":
      subject = `💎 Premium Reward! ${couponValue} for Your Generous Order`;
      title = "Thank You for Your Generous Purchase!";
      message = `
        <p>We noticed your recent substantial investment in eco-friendly products, 
        and we're deeply grateful for your support!</p>
        <p>Your commitment to sustainable shopping helps us continue our mission. 
        Please accept this special reward for your next purchase.</p>
      `;
      break;

    default:
      subject = `🎁 Special ${couponValue} Gift from EcoStore`;
      title = "Here's a Special Gift For You!";
      message = `
        <p>Thank you for being a valued EcoStore customer! We appreciate your support 
        in making sustainable choices.</p>
        <p>Enjoy this discount on your next purchase of eco-friendly products.</p>
      `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f0f9f4; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: #fff;">
          <img src="${
            process.env.STORE_LOGO || ""
          }" alt="EcoStore Logo" style="max-height: 50px; display:block; margin: 0 auto 15px;" />
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
            <a href="${process.env.CLIENT_URL || "https://your-ecostore.com"}" 
               style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
              🛍️ Start Shopping Now
            </a>
          </div>
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;">Thank you for choosing sustainable shopping with Eco~Store 🌱</p>
          <p style="margin: 0;">Need help? Contact us at <a href="mailto:${
            process.env.SUPPORT_EMAIL || "support@ecostore.example"
          }" 
             style="color: #10b981; text-decoration: none;">${
               process.env.SUPPORT_EMAIL || "support@ecostore.example"
             }</a></p>
        </div>
      </div>
    </div>
  `;

  // Plain text version
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

Shop now: ${process.env.CLIENT_URL || "https://your-ecostore.com"}

This coupon is exclusively for you and cannot be transferred.

Thank you for choosing sustainable shopping with EcoStore 🌱
  `.trim();

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
};

