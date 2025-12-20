import Order from "../models/order.model.js";
import { sendEmail } from "../lib/mailer.js";
import User from "../models/user.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import { flw } from "../lib/flutterwave.js";
import AuditLogger from "../lib/auditLogger.js";
import { ENTITY_TYPES, ACTIONS } from "../constants/auditLog.constants.js";
import storeSettings from "../models/storeSettings.model.js"

const logOrderAction = async (
  req,
  action,
  orderId,
  changes = {},
  additionalInfo = ""
) => {
  try {
    const order = await Order.findById(orderId).populate(
      "user",
      "firstname lastname email"
    );
    if (!order) return;

    await AuditLogger.log({
      adminId: req.user?._id,
      adminName: req.user
        ? `${req.user.firstname} ${req.user.lastname}`
        : "System",
      action,
      entityType: ENTITY_TYPES.ORDER,
      entityId: order._id,
      entityName: `Order #${order.orderNumber}`,
      changes,
      ...AuditLogger.getRequestInfo(req),
      additionalInfo,
    });
  } catch (error) {
    console.error("Failed to log order action:", error);
  }
};

const logUserAction = async (req, action, entityType, entityId, entityName, changes = {}, additionalInfo = "") => {
  try {
    await AuditLogger.log({
      adminId: req.user?._id,
      adminName: req.user ? `${req.user.firstname} ${req.user.lastname}` : "User",
      action,
      entityType,
      entityId,
      entityName,
      changes,
      ...AuditLogger.getRequestInfo(req),
      additionalInfo
    });
  } catch (error) {
    console.error("Failed to log user action:", error);
  }
};
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const orders = await Order.find({ user: userId })
      .populate("products.product", "name image price")
      .populate("refunds.product") 
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map((order) => {
       const refunds = order.refunds || [];

      let displayStatus = order.status;
      const totalProducts = order.products.length;
      const approvedCount =
        order.refunds?.filter((r) => r.status === "Approved").length || 0;

      if (approvedCount > 0 && approvedCount < totalProducts) {
        displayStatus = "Partially Refunded";
      } else if (approvedCount === totalProducts) {
        displayStatus = "Refunded";
      }

      const products = order.products.map((p) => {
        // Check if this product has a refund request
        const refund = order.refunds?.find(
          (r) => r.product?.toString() === p.product?._id?.toString()
        );

        return {
          _id: p._id,
          product: p.product || null,
          quantity: p.quantity,
          price: p.price,
          size: p.selectedSize || null,
          color: p.selectedColor || null,
          selectedCategory: p.selectedCategory || null,
          name: p.name || p.product?.name || "Unknown Product",
          image: p.image  || "/placeholder.png", //changes made here
          refundStatus: refund?.status || null,
        };
      });

      return {
        count: orders.length,
        displayStatus,
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveredAt: order.deliveredAt,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discount: order.discount,
        coupon: order.coupon,
        deliveryAddress: order.deliveryAddress,
        phone: order.phone,
        createdAt: order.createdAt,
        products,
        refunds: refunds,
      };
    });
    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Helper function for stock deduction during recovery
const deductStockForRecoveredItem = async (item) => {
  try {
    if (!item.product) {
      return {
        status: 'NO_PRODUCT_ID',
        message: `No product ID found for "${item.name}" - cannot deduct stock`,
        productName: item.name,
        quantity: item.quantity
      };
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return {
        status: 'PRODUCT_NOT_FOUND',
        message: `Product "${item.name}" not found in database`,
        productName: item.name,
        quantity: item.quantity
      };
    }

    // For products with variants
    if (product.variants && product.variants.length > 0) {
      // If no specific variant selected, try to find any available variant
      if (!item.selectedSize && !item.selectedColor) {
        // Find first variant with sufficient stock
        const availableVariant = product.variants.find(v => v.countInStock >= item.quantity);
        
        if (availableVariant) {
          // Update item with the variant details we found
          item.selectedSize = availableVariant.size;
          item.selectedColor = availableVariant.color;
          availableVariant.countInStock -= item.quantity;
          await product.save();
          
          return {
            status: 'DEDUCTED',
            message: `✅ Stock deducted from variant ${availableVariant.size || 'N/A'}/${availableVariant.color || 'N/A'} for ${item.name}: ${item.quantity} units`,
            productName: item.name,
            quantity: item.quantity,
            variantSize: availableVariant.size,
            variantColor: availableVariant.color,
            remainingStock: availableVariant.countInStock
          };
        } else {
          // Try to find any variant with at least some stock
          const totalVariantStock = product.variants.reduce((sum, v) => sum + v.countInStock, 0);
          return {
            status: 'OUT_OF_STOCK',
            message: `❌ No variant has sufficient stock for ${item.name}. Total variant stock: ${totalVariantStock}, Required: ${item.quantity}`,
            productName: item.name,
            quantity: item.quantity,
            availableStock: totalVariantStock
          };
        }
      }
      
      // Specific variant requested
      const variant = product.variants.find(v => 
        v.size === (item.selectedSize || '') && 
        v.color === (item.selectedColor || '')
      );
      
      if (!variant) {
        // Try fuzzy matching
        const fuzzyVariant = product.variants.find(v => {
          const sizeMatch = !item.selectedSize || v.size === item.selectedSize || 
                           v.size === '' || v.size === 'Standard';
          const colorMatch = !item.selectedColor || v.color === item.selectedColor || 
                            v.color === '' || v.color === 'Standard';
          return sizeMatch && colorMatch;
        });
        
        if (fuzzyVariant) {
          if (fuzzyVariant.countInStock >= item.quantity) {
            fuzzyVariant.countInStock -= item.quantity;
            // Update item with the actual variant details
            item.selectedSize = fuzzyVariant.size;
            item.selectedColor = fuzzyVariant.color;
            await product.save();
            
            return {
              status: 'DEDUCTED',
              message: `✅ Stock deducted from variant ${fuzzyVariant.size || 'N/A'}/${fuzzyVariant.color || 'N/A'} for ${item.name}: ${item.quantity} units`,
              productName: item.name,
              quantity: item.quantity,
              variantSize: fuzzyVariant.size,
              variantColor: fuzzyVariant.color,
              remainingStock: fuzzyVariant.countInStock
            };
          } else {
            return {
              status: 'OUT_OF_STOCK',
              message: `❌ Insufficient stock for ${item.name} ${fuzzyVariant.size || ''}/${fuzzyVariant.color || ''}. Available: ${fuzzyVariant.countInStock}, Required: ${item.quantity}`,
              productName: item.name,
              quantity: item.quantity,
              availableStock: fuzzyVariant.countInStock
            };
          }
        }
        
        return {
          status: 'VARIANT_NOT_FOUND',
          message: `❌ Variant not found for ${item.name} (Size: ${item.selectedSize || 'Any'}, Color: ${item.selectedColor || 'Any'})`,
          productName: item.name,
          quantity: item.quantity
        };
      }
      
      // Deduct from specific variant
      if (variant.countInStock >= item.quantity) {
        variant.countInStock -= item.quantity;
        await product.save();
        
        return {
          status: 'DEDUCTED',
          message: `✅ Stock deducted from variant ${variant.size || 'N/A'}/${variant.color || 'N/A'} for ${item.name}: ${item.quantity} units`,
          productName: item.name,
          quantity: item.quantity,
          variantSize: variant.size,
          variantColor: variant.color,
          remainingStock: variant.countInStock
        };
      } else {
        return {
          status: 'OUT_OF_STOCK',
          message: `❌ Insufficient stock for ${item.name} ${variant.size || ''}/${variant.color || ''}. Available: ${variant.countInStock}, Required: ${item.quantity}`,
          productName: item.name,
          quantity: item.quantity,
          availableStock: variant.countInStock
        };
      }
    } 
    // For products without variants
    else {
      if (product.countInStock >= item.quantity) {
        product.countInStock -= item.quantity;
        await product.save();
        
        return {
          status: 'DEDUCTED',
          message: `✅ Stock deducted for ${item.name}: ${item.quantity} units`,
          productName: item.name,
          quantity: item.quantity,
          remainingStock: product.countInStock
        };
      } else {
        return {
          status: 'OUT_OF_STOCK',
          message: `❌ Insufficient stock for ${item.name}. Available: ${product.countInStock}, Required: ${item.quantity}`,
          productName: item.name,
          quantity: item.quantity,
          availableStock: product.countInStock
        };
      }
    }
  } catch (error) {
    console.error(`❌ Error deducting stock for ${item.name}:`, error);
    return {
      status: 'ERROR',
      message: `Error deducting stock for ${item.name}: ${error.message}`,
      productName: item.name,
      quantity: item.quantity,
      error: error.message
    };
  }
};

// Original reduceVariantStock function (for regular orders)
export const supportRecoverOrder = async (req, res) => {
  function generateOrderNumber() {
    return "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  try {
    const { transaction_ref, flutterwave_ref, customer_email } = req.body;

    console.log("🔄 Order recovery attempt:", {
      transaction_ref,
      flutterwave_ref,
      customer_email,
    });

    // Validate input
    if (!transaction_ref && !flutterwave_ref) {
      return res.status(400).json({
        error:
          "Please provide either Transaction Reference or Flutterwave Reference",
      });
    }

    if (!customer_email) {
      return res.status(400).json({
        error: "Customer email is required",
      });
    }

    let payment = null;
    let searchMethod = "";
    let referenceUsed = "";

    // [Keep all your existing search logic here - it's already correct]
    // STRATEGY 1: Search by Transaction Reference
    if (transaction_ref && transaction_ref.trim() !== "") {
      console.log("🔍 Searching by Transaction Reference:", transaction_ref);
      searchMethod = "transaction_reference";
      referenceUsed = transaction_ref;

      try {
        const response = await flw.Transaction.fetch({
          tx_ref: transaction_ref.trim(),
        });

        if (response.data && response.data.length > 0) {
          const successfulPayments = response.data.filter(
            (p) => p.status === "successful"
          );

          if (successfulPayments.length > 0) {
            payment = successfulPayments[0];
            console.log("✅ Found payment via Transaction Reference:", payment.id);
          }
        }
      } catch (error) {
        console.error("Transaction Reference search failed:", error.message);
      }
    }

    // STRATEGY 2: Search by Flutterwave Reference
    if (!payment && flutterwave_ref && flutterwave_ref.trim() !== "") {
      console.log("🔍 Searching by Flutterwave Reference:", flutterwave_ref);
      searchMethod = "flutterwave_reference";
      referenceUsed = flutterwave_ref;

      try {
        // Try different verification methods
        if (flutterwave_ref.startsWith("JayyTech_")) {
          try {
            const verificationResponse = await flw.Transaction.verify({
              id: flutterwave_ref.trim(),
            });
            if (verificationResponse.data && verificationResponse.data.status === "successful") {
              payment = verificationResponse.data;
            }
          } catch (error) {}
        } else if (/^\d+$/.test(flutterwave_ref)) {
          try {
            const verificationResponse = await flw.Transaction.verify({
              id: parseInt(flutterwave_ref.trim()),
            });
            if (verificationResponse.data && verificationResponse.data.status === "successful") {
              payment = verificationResponse.data;
            }
          } catch (error) {}
        }
      } catch (error) {
        console.error("Flutterwave Reference search failed:", error.message);
      }
    }

    if (!payment) {
      return res.status(404).json({
        error: "No successful payment found with the provided details",
        debug: {
          transaction_ref_provided: transaction_ref,
          flutterwave_ref_provided: flutterwave_ref,
          search_method_used: searchMethod,
        },
      });
    }

    // ✅ Check if order already exists
    const existingOrder = await Order.findOne({
      $or: [
        { flutterwaveTransactionId: payment.id },
        { flutterwaveRef: payment.tx_ref },
      ],
    });

    if (existingOrder) {
      console.log("🔄 Order already exists:", existingOrder.orderNumber);
      const user = await User.findById(existingOrder.user);

      await logOrderAction(
        req,
        "ORDER_RECOVERY_DUPLICATE",
        existingOrder._id,
        {
          duplicateFound: {
            orderNumber: existingOrder.orderNumber,
            status: existingOrder.status,
          },
        },
        "Duplicate order detected during recovery attempt"
      );

      return res.status(400).json({
        error: "Order already exists in system",
        orderDetails: {
          orderNumber: existingOrder.orderNumber,
          status: existingOrder.status,
          createdAt: existingOrder.createdAt,
          totalAmount: existingOrder.totalAmount,
          customer: user ? `${user.firstname} ${user.lastname}` : "Unknown",
          customerEmail: user?.email,
        },
      });
    }

    // ✅ EXTRACT PRODUCT INFORMATION
    let recoveredProducts = [];

    console.log("📦 Payment metadata:", payment.meta);

    // Process products from metadata
    if (payment.meta) {
      console.log("🔍 Processing payment metadata...");

      let productsData = null;

      if (payment.meta.products) {
        console.log("📦 Found products in payment.meta.products");
        console.log("📦 Type of products:", typeof payment.meta.products);

        try {
          if (typeof payment.meta.products === "string") {
            console.log("🔄 Parsing products as JSON string...");
            productsData = JSON.parse(payment.meta.products);
          } else if (Array.isArray(payment.meta.products)) {
            console.log("🔄 Products is already an array");
            productsData = payment.meta.products;
          } else if (typeof payment.meta.products === "object") {
            console.log("🔄 Products is an object, converting to array");
            productsData = [payment.meta.products];
          }
        } catch (parseError) {
          console.error("❌ Error parsing products:", parseError.message);
        }
      }

      if (!productsData && Array.isArray(payment.meta)) {
        console.log("📦 Payment.meta is an array, searching for products...");
        const productsMeta = payment.meta.find((item) => item.products);
        if (productsMeta && productsMeta.products) {
          console.log("📦 Found products in meta array");
          try {
            if (typeof productsMeta.products === "string") {
              productsData = JSON.parse(productsMeta.products);
            } else if (Array.isArray(productsMeta.products)) {
              productsData = productsMeta.products;
            }
          } catch (parseError) {
            console.error("❌ Error parsing products from meta array:", parseError.message);
          }
        }
      }

      if (productsData) {
        console.log("✅ Products data to process:", productsData);

        if (Array.isArray(productsData) && productsData.length > 0) {
          recoveredProducts = productsData.map((product, index) => {
            console.log(`📦 Processing product ${index + 1}:`, product);
            return {
              product: product._id || product.productId || null,
              name: product.name || "Recovered Product",
              image: product.images?.[0] || product.image || "/placeholder.png",
              price: product.price || payment.amount / (product.quantity || 1),
              quantity: product.quantity || 1,
              selectedSize: product.size || null,
              selectedColor: product.color || null,
              selectedCategory: product.category || null,
            };
          });
          console.log(`✅ Successfully recovered ${recoveredProducts.length} products`);
        }
      }
    }

    // If no products found in metadata, create generic entry
    if (recoveredProducts.length === 0) {
      console.log("📦 No product metadata found, creating generic product");
      recoveredProducts = [
        {
          name: "Recovered Order - Products to be confirmed",
          image: "/placeholder.png",
          price: payment.amount,
          quantity: 1,
          selectedSize: null,
          selectedColor: null,
          selectedCategory: null,
        },
      ];
    }

    // ✅ Find or create user
    let user = await User.findOne({ email: customer_email });
    if (!user) {
      user = await User.create({
        email: customer_email,
        firstname: payment.customer?.firstname || "Recovery",
        lastname: payment.customer?.lastname || "Customer",
        phones: payment.customer?.phone_number
          ? [{ number: payment.customer.phone_number, isDefault: true }]
          : [],
      });
      console.log("✅ Created new user for recovery:", user.email);
    }

    // ✅ Extract delivery address, phone, delivery fee, coupon, and discount
    const deliveryAddress = payment.meta?.deliveryAddress || payment.meta?.delivery_address || "To be confirmed by customer";
    const phone = payment.meta?.phoneNumber || payment.meta?.phone_number || payment.customer?.phone_number || "To be confirmed";
    const deliveryFee = parseFloat(payment.meta?.deliveryFee) || 0;
    const originalTotal = parseFloat(payment.meta?.originalTotal) || 0;
    const discountAmount = parseFloat(payment.meta?.discountAmount) || 0;
    const couponCode = payment.meta?.couponCode || null;
    const finalTotal = parseFloat(payment.meta?.finalTotal) || payment.amount;

    // Calculate subtotal
    let subtotal = payment.amount;
    if (deliveryFee > 0 && originalTotal > 0) {
      subtotal = originalTotal;
    } else if (deliveryFee > 0) {
      subtotal = payment.amount - deliveryFee;
    }

    // ✅ DEDUCT STOCK FOR RECOVERED PRODUCTS
    const stockDeductionResults = [];
    const outOfStockMessages = [];

    for (const item of recoveredProducts) {
      const deductionResult = await deductStockForRecoveredItem(item);
      stockDeductionResults.push(deductionResult);

      if (deductionResult.status !== "DEDUCTED") {
        outOfStockMessages.push(deductionResult.message);
      }

      // Update the item with variant details if they were determined during deduction
      if (deductionResult.variantSize !== undefined) {
        item.selectedSize = deductionResult.variantSize;
      }
      if (deductionResult.variantColor !== undefined) {
        item.selectedColor = deductionResult.variantColor;
      }
    }

    console.log("📊 Stock deduction results:", stockDeductionResults);

    // ✅ Create the recovered order WITH COUPON AND DISCOUNT
    const order = new Order({
      user: user._id,
      products: recoveredProducts,
      orderNumber: generateOrderNumber(),
      subtotal: subtotal,
      discount: discountAmount,
      totalAmount: finalTotal,
      deliveryFee: deliveryFee,
      deliveryAddress: deliveryAddress,
      phone: phone,
      coupon: couponCode ? {
        code: couponCode,
        discount: discountAmount
      } : null,
      couponCode: couponCode,
      flutterwaveRef: payment.tx_ref,
      flutterwaveTransactionId: payment.id,
      paymentStatus: "paid",
      status: "Pending",
      paymentMethod: {
        method: payment.payment_type || "card",
        status: "PAID",
        ...(payment.card ? {
          card: {
            brand: payment.card.type || "Unknown",
            last4: payment.card.last_4digits || null,
            issuer: payment.card.issuer || null,
          },
        } : {}),
      },
      isProcessed: false,
      notes: `AUTO-RECOVERED - Found via ${searchMethod}. 
            Reference Used: ${referenceUsed}
            Flutterwave Ref: ${payment.flw_ref}
            Transaction Ref: ${payment.tx_ref}
            Transaction ID: ${payment.id}
            Amount: ₦${payment.currency} ${payment.amount}
            Customer: ${payment.customer?.name || "N/A"}
            Products: ${recoveredProducts.length} items
            Coupon: ${couponCode || 'None'}
            Discount: ${discountAmount > 0 ? `₦${discountAmount}` : 'None'}
            Delivery Fee: ₦${deliveryFee}
            Recovered on: ${new Date().toLocaleString()}
            
            STOCK DEDUCTION STATUS:
            ${outOfStockMessages.length > 0 ? '⚠️ SOME ITEMS OUT OF STOCK - ADMIN REVIEW REQUIRED ⚠️' : '✅ All items in stock'}
            ${outOfStockMessages.map(msg => `- ${msg}`).join('\n')}`,
    });

    await order.save();
    console.log("✅ Order recovered successfully:", order.orderNumber);

    // Send recovery email
    (async () => {
      try {
        const recoveryNote = `Recovered via ${searchMethod.replace("_", " ")} - Reference: ${referenceUsed}`;
        await sendRecoveryOrderEmail(customer_email, order, recoveryNote);
        console.log(`📧 Recovery email sent to: ${customer_email}`);
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError.message);
      }
    })();

    // Log the recovery
    await logOrderAction(
      req,
      "ORDER_RECOVERY_SUCCESS",
      order._id,
      {
        recoveryDetails: {
          searchMethod,
          referenceUsed,
          paymentId: payment.id,
          amount: payment.amount,
          couponCode: couponCode,
          discount: discountAmount,
        },
        stockDeduction: stockDeductionResults,
      },
      `Order recovered via ${searchMethod.replace("_", " ")}`
    );

       res.json({
         success: true,
         message: `Order recovered successfully via ${searchMethod.replace(
           "_",
           " "
         )}!`,
         orderNumber: order.orderNumber,
         orderId: order._id,
         customerEmail: customer_email,
         amount: payment.amount,
         currency: payment.currency || "NGN",
         searchMethod: searchMethod.replace("_", " "),
         referenceType: referenceUsed.startsWith("JayyTech_")
           ? "Flutterwave Reference"
           : /^\d+$/.test(referenceUsed)
           ? "Transaction ID"
           : "Reference",
         recoveredDetails: {
           productsCount: recoveredProducts.length,
           transactionReference: payment.tx_ref,
           flutterwaveReference: payment.flw_ref,
           transactionId: payment.id,
           paymentType: payment.payment_type || "card",
           paidAt: new Date(payment.created_at).toLocaleString(),
           customerName:
             payment.customer?.name ||
             `${payment.customer?.firstname || ""} ${
               payment.customer?.lastname || ""
             }`.trim() ||
             customer_email,
           deliveryAddress: deliveryAddress,
           phone: phone,
         },
         products: recoveredProducts,
         discountDetails: {
           couponCode: couponCode,
           discountAmount: discountAmount,
           subtotal: subtotal,
           deliveryFee: deliveryFee,
           totalAmount: finalTotal,
         },
         stockDeductionSummary: {
           totalItems: recoveredProducts.length,
           deducted: stockDeductionResults.filter(
             (r) => r.status === "DEDUCTED"
           ).length,
           outOfStock: stockDeductionResults.filter(
             (r) => r.status === "OUT_OF_STOCK"
           ).length,
           errors: stockDeductionResults.filter((r) => r.status === "ERROR")
             .length,
           adminNote:
             outOfStockMessages.length > 0
               ? "⚠️ SOME ITEMS ARE OUT OF STOCK. CONSIDER REFUNDING OR RE-STOCKING."
               : "✅ All items in stock and deducted",
           outOfStockItems: outOfStockMessages,
           detailedResults: stockDeductionResults, // Add this for debugging
         },
         nextSteps: [
           "Order automatically recovered with complete details!",
           ...(outOfStockMessages.length > 0
             ? [
                 "⚠️ REVIEW REQUIRED: Some items are out of stock. Consider contacting customer or processing refund.",
               ]
             : []),
           ...(couponCode
             ? [
                 `✅ Coupon applied: ${couponCode} (₦${discountAmount} discount)`,
               ]
             : []),
           "Verify the products and delivery address match customer expectation",
           "Update order status when ready to process",
         ],
       });
  } catch (error) {
    console.error("❌ Order recovery failed:", error);

    await AuditLogger.log({
      adminId: req.user?._id,
      adminName: req.user
        ? `${req.user.firstname} ${req.user.lastname}`
        : "System",
      action: "ORDER_RECOVERY_FAILED",
      entityType: ENTITY_TYPES.ORDER,
      entityId: null,
      entityName: "Failed Recovery",
      changes: {
        error: error.message,
      },
      ...AuditLogger.getRequestInfo(req),
      additionalInfo: "Order recovery process failed",
    });

    res.status(500).json({
      error: "Order recovery failed: " + error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { sortBy, sortOrder = "desc", search } = req.query;

    // Get date parameters safely with default values
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build search filter
    let searchFilter = {};
    if (search) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
      searchFilter = {
        $or: [
          { orderNumber: { $regex: search, $options: "i" } },
          { flutterwaveRef: { $regex: search, $options: "i" } },
          { flutterwaveTransactionId: { $regex: search, $options: "i" } },
          ...(isObjectId ? [{ _id: search }] : []),
          { "user.firstname": { $regex: search, $options: "i" } },
          { "user.lastname": { $regex: search, $options: "i" } },
        ],
      };
    }

    if (
      (startDate && startDate.trim() !== "") ||
      (endDate && endDate.trim() !== "")
    ) {
      console.log("Processing date filter...");
      const dateFilter = {};
      // Add date range filter if provided
      if (startDate && startDate.trim() !== "") {
        const start = new Date(startDate);
        console.log("Parsed start date:", start);
        if (!isNaN(start.getTime())) {
          start.setHours(0, 0, 0, 0);
          dateFilter.$gte = start;
          console.log("Valid start date:", dateFilter.$gte);
        } else {
          console.log("Invalid start date format:", startDate);
        }
      }

      if (endDate && endDate.trim() !== "") {
        const end = new Date(endDate);
        console.log("Parsed end date:", end);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateFilter.$lte = end;
          console.log("Valid end date:", dateFilter.$lte);
        } else {
          console.log("Invalid end date format:", endDate);
        }
      }

      // Only add date filter if we have valid dates
      if (Object.keys(dateFilter).length > 0) {
        searchFilter.createdAt = dateFilter;
        console.log("Final date filter applied:", dateFilter);
      } else {
        console.log("No valid dates for filter");
      }
    } else {
      console.log("No date parameters provided");
    }
console.log("Final search filter:", searchFilter);
    // Fetch all orders with basic sorting (newest first by default)
    let orders = await Order.find(searchFilter)
      .populate("user", "firstname lastname email phone address")
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 }) // Newest orders first by default
      .populate("refunds.product", "name image")
      .lean();
      console.log(`Found ${orders.length} orders with filter`);

    // Define priority: Pending orders always first, then sort by other criteria
    const statusOrder = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Refunded",
      "Partially Refunded",
    ];

    // Custom sorting function
    orders.sort((a, b) => {
      // 1. Pending orders ALWAYS come first (highest priority)
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (b.status === "Pending" && a.status !== "Pending") return 1;

      // 2. If both are Pending, sort by creation date (newest first)
      if (a.status === "Pending" && b.status === "Pending") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      // 3. For non-Pending orders, apply the requested sorting
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (sortBy === "totalAmount") {
        return sortOrder === "asc"
          ? a.totalAmount - b.totalAmount
          : b.totalAmount - a.totalAmount;
      }

      if (sortBy === "status") {
        const indexA = statusOrder.indexOf(a.status);
        const indexB = statusOrder.indexOf(b.status);
        return sortOrder === "asc" ? indexA - indexB : indexB - indexA;
      }

      // Default: newest non-Pending orders first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Map response
    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((order) => {
        // Compute refund status
        const totalProducts = order.products?.length || 0;
        const approvedCount =
          order.refunds?.filter((r) => r.status === "Approved").length || 0;

        let refundStatus = "No Refund";
        if (approvedCount > 0 && approvedCount < totalProducts) {
          refundStatus = "Partially Refunded";
        } else if (approvedCount === totalProducts && totalProducts > 0) {
          refundStatus = "Refunded";
        }

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          user: order.user,
          status: order.status,
          refundStatus,
          isProcessed: order.isProcessed || false,
          deliveredAt: order.deliveredAt,
          updatedAt: order.updatedAt,
          totalAmount: order.totalAmount,
          subtotal: order.subtotal,
          discount: order.discount,
          couponCode: order.coupon?.code || order.couponCode, // Use couponCode
          deliveryAddress: order.deliveryAddress,
          phone: order.phone,
          createdAt: order.createdAt,
          refunds: order.refunds || [],
          products: (order.products || []).map((p) => ({
            _id: p._id,
            product: p.product || null,
            quantity: p.quantity,
            price: p.price,
            size: p.selectedSize || null,
            color: p.selectedColor || null,
            selectedCategory: p.selectedCategory || null,
            name: p.name || p.product?.name || "Unknown Product",
            image: p.image || p.product?.image || "/placeholder.png",
          })),
        };
      }),
    });
  } catch (error) {
    console.error("getAllOrders error:", error);
    res.status(500).json({ message: error.message });
  }
};
export const updateOrderStatus = async (req, res) => {
  try {
    const settings = await storeSettings.findOne();
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const oldStatus = order.status;
    const oldIsProcessed = order.isProcessed;

    const newIsProcessed =
      oldStatus === "Pending" && status !== "Pending" ? true : oldIsProcessed;

    await logOrderAction(
      req,
      ACTIONS.UPDATE_ORDER_STATUS,
      orderId,
      {
        before: {
          status: oldStatus,
          isProcessed: oldIsProcessed,
          deliveredAt: order.deliveredAt,
        },
        after: {
          status,
          isProcessed: newIsProcessed,
          deliveredAt: status === "Delivered" ? new Date() : order.deliveredAt,
        },
      },
      `Status changed from "${oldStatus}" to "${status}"`
    );

    order.status = status;
    order.isProcessed = newIsProcessed;
    

    if (status === "Delivered") order.deliveredAt = Date.now();

    await order.save();

    // Styled HTML email
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
            <h2 style="color: #2c3e50; text-align: center;"> Order Status Update</h2>
            <p>Hi <strong>${order.user?.firstname || "Customer"}</strong>,</p>
            <p>Your order <strong>${
              order.orderNumber
            }</strong> has been updated.</p>
            
            <p style="font-size: 16px;">
              <strong>Current Status:</strong> 
              <span style="color: ${
                status === "Shipped"
                  ? "green"
                  : status === "Delivered"
                  ? "#2ecc71"
                  : status === "Cancelled"
                  ? "red"
                  : "orange"
              }; font-weight: bold;">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </p>

            ${
              status === "Delivered"
                ? `<p>Your package has been delivered. We hope you enjoy your purchase!</p>`
                : status === "Shipped"
                ? `<p>Your order is on the way! You’ll receive it soon.</p>`
                : status === "Processing"
                ? `<p>We’re currently preparing your order.</p>`
                : status === "Cancelled"
                ? `<p>Unfortunately, your order has been cancelled. Please contact support if this wasn’t expected.</p>`
                : ""
            }

            <p style="margin-top: 30px; font-size: 14px; color: #555;">
              Best regards, <br>
              <strong>The ${settings?.storeName} Team </strong>
            </p>
          </div>
        </body>
      </html>
    `;

    // Respond immediately so the client receives the update without waiting for email delivery
    console.log(" Order updated:", order);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });

    // Send notification email in background (fire-and-forget)
    (async () => {
      try {
        await sendEmail({
          to: order.user?.email,
          subject: `Update on your order ${order.orderNumber}`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error(
          "Background order update email failed:",
          emailError?.message || emailError
        );
      }
    })();
  } catch (error) {
    console.error(" Error updating order status:", error.message);
    res.status(500).json({ message: error.message });
  }
};
 

// Add this function to reduce variant stock when order is placed
const reduceVariantStock = async (orderItems) => {
  try {
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // If product has variants, reduce specific variant stock
      if (product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => 
          v.size === item.selectedSize && v.color === item.selectedColor
        );
        
        if (variant) {
          if (variant.countInStock < item.quantity) {
            throw new Error(`Not enough stock for ${product.name} - ${item.selectedSize}/${item.selectedColor}`);
          }
          variant.countInStock -= item.quantity;
        }
      } else {
        // Fallback to overall product stock
        if (product.countInStock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
        product.countInStock -= item.quantity;
      }

      await product.save();
    }
  } catch (error) {
    throw error;
  }
};

// Create new order

export const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "cartItems.product"
    );

    if (!user || !user.cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Get default phone & address
    const defaultPhone = user.phones.find((p) => p.isDefault) || user.phones[0];
    const defaultAddress =
      user.addresses.find((a) => a.isDefault) || user.addresses[0];

    // Build order items
    const orderItems = user.cartItems.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0] || item.product.image || "", 
      price: item.product.price,
      quantity: item.quantity,
      selectedSize: item.size || null,
      selectedColor: item.color || null,
      selectedCategory: item.category || null,
    }));

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discount = 0;
    let coupon = null;

    if (req.body.couponCode) {
      const foundCoupon = await Coupon.findOne({
        code: req.body.couponCode,
        isActive: true,
      });

      if (foundCoupon) {
        if (foundCoupon.type === "percentage") {
          discount = Math.round((subtotal * foundCoupon.value) / 100);
        } else if (foundCoupon.type === "fixed") {
          discount = Math.min(foundCoupon.value, subtotal);
        }

        coupon = {
          code: foundCoupon.code,
          discountPercentage:
            foundCoupon.type === "percentage" ? foundCoupon.value : 0,
          discountAmount: discount,
        };
      }
    }
    const totalAmount = Math.max(subtotal - discount, 0);

    // REDUCE STOCK BEFORE CREATING ORDER
    await reduceVariantStock(orderItems);

    // Create order snapshot
    const order = new Order({
      user: user._id,
      products: orderItems,
      subtotal,
      discount,
      totalAmount,
      coupon,
      phone: defaultPhone?.number || "",
      deliveryAddress: defaultAddress?.address || "",
      status: "Pending",
      isProcessed: false,
    });

    await order.save();

     await logUserAction(
       req,
       ACTIONS.CREATE_ORDER, // This should be in the enum
       ENTITY_TYPES.ORDER,
       order._id,
       `Order #${order.orderNumber}`,
       {
         created: {
           orderNumber: order.orderNumber,
           totalAmount: order.totalAmount,
           productsCount: order.products.length,
           subtotal: order.subtotal,
           discount: order.discount,
           couponUsed: coupon ? coupon.code : "None",
         },
         cartItems: {
           itemsCount: user.cartItems.length,
           cleared: true,
         },
       },
       "User placed new order from cart"
     );

    // Clear cart after order
    user.cartItems = [];
    await user.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Error creating order", err);
    
    // Provide specific error message for stock issues
    if (err.message.includes("Not enough stock")) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};
import mongoose from "mongoose";

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Prevent CastError if "id" is not a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findById(id)
      .populate("user", "firstname lastname email phone address")
      .populate("products.product", "name price image")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

   if (!order.user) {
     return res.status(404).json({
       success: false,
       message: "Order owner not found",
     });
   }

   // Convert both IDs to strings for comparison
   const orderUserId = order.user._id.toString();
   const requestUserId = req.user._id.toString();

   // Check ownership
   if (orderUserId !== requestUserId) {
     // Check if user is admin (allow admins to view any order)
     if (req.user.role !== "admin") {
       return res.status(403).json({
         success: false,
         message:
           "Access denied. You do not have permission to view this order.",
       });
     }
   }
    // Log order view by admin (if admin is viewing)
    if ( req.user.role === "admin") {
      await logOrderAction(
        req,
        ACTIONS.VIEW_ORDER_DETAILS,
        order._id,
        {
          viewed: {
            orderNumber: order.orderNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            customer: order.user
              ? `${order.user.firstname} ${order.user.lastname}`
              : "Unknown",
          },
        },
        "Admin viewed order details"
      );
    } else if (
      req.user &&
      order.user &&
      req.user._id.toString() === order.user._id.toString()
    ) {

    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("getOrderById error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
  

// Add this function near the top or with other helper functions
const sendRecoveryOrderEmail = async (to, order, recoveryInfo) => {
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
  const settings = await storeSettings.findOne();
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: settings?.currency || "NGN",
  });

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
            <p style="display:block; margin-top: 1px; margin-bottom:1px;">${
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
          )}</td>
        </tr>`;
    })
    .join("");

  const totalAmount = order.totalAmount || order.totalPrice || order.total || 0;
  const discount = order.discount || 0;
  const deliveryFee = order.deliveryFee || 0;
  const subtotal =
    order.subtotal || order.subTotal || totalAmount - deliveryFee;

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
              deliveryFee
            )}<br>
            <strong>Final Total:</strong> ${formatter.format(totalAmount)}
          </p>

          <div style="margin: 20px 0;">
            <p style="margin:0 0 6px;">
              <strong>Delivery Address:</strong> ${
                order.deliveryAddress || "No address provided"
              }<br/>
              <strong>Phone:</strong> ${order.phone || "No phone provided"}<br/>
              <strong>Email:</strong> ${to}
            </p>
          </div>

          <h3 style="margin:18px 0 8px;"> Payment Details</h3>
          <div style="background-color: #f8f9fa; padding: 12px; border-radius: 5px;">
            <p style="margin:0 0 6px;">
              <strong>Payment Status:</strong> <span>${
                order.paymentStatus || "Confirmed"
              }</span><br/>
              <strong>Payment Type:</strong> ${payment_type}<br/>
              <strong>Transaction Ref:</strong> ${tx_ref}<br/>
              <strong>Transaction ID:</strong> ${transaction_id}
            </p>
          </div>

          <p style="margin-top:20px; color:#555;">
            Your order is now being processed. We'll send another email once your order ships.
          </p>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin:0; color:#6b7280; font-size: 14px;">
              <strong>Note:</strong> This order was recovered by our support team. 
              If you have any questions about this recovery, please reply to this email.
            </p>
          </div>
        </div>

        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
          <p style="margin: 0 0 10px 0;">
            <p style="margin-top:18px;">Thanks for choosing <strong>${
              settings?.storeName
            }</strong> </p>
          </p>
          <p style="margin: 0;">Need help? Contact us at 
            <a href="mailto:${
              settings?.supportEmail
            }" style="color: #10b981; text-decoration: none;">${
    settings?.supportEmail
  }</a>
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">
            Order recovered on ${new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  `;

  // Plain text fallback
  const text = [
    `${settings?.storeName || "Store"} — Order Recovered`,
    `Order Number: ${order.orderNumber || "N/A"}`,
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
    `This order was recovered by our support team. If you have any questions, please contact us.`,
    ``,
    `Thanks for shopping with ${settings?.storeName}!`,
  ].join("\n");

  try {
    await sendEmail({
      to,
      subject: `${
        settings?.storeName || "Store"
      } — Order Confirmation ${order.orderNumber || "N/A"}`,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error("Failed to send recovery email:", error);
    return false;
  }
};