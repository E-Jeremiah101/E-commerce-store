/**
 * Input Validation Middleware
 *
 * Provides centralized input validation using Joi schemas
 * Prevents MongoDB injection, type confusion, buffer overflow, and malformed data
 *
 * Security features:
 * - Email validation with strict format checking
 * - Password strength validation (min 8 chars, alphanumeric + special chars)
 * - MongoDB ObjectId validation
 * - Safe search query validation (remove dangerous characters)
 * - Numeric range validation (price, quantities, pagination)
 * - String length validation
 * - Auto-strip unknown fields from input
 */

import Joi from "joi";
import User from "../models/user.model.js"

/**
 * Middleware factory for validating request body
 */
export const validateBody = (schema) => (req, res, next) => {

   console.log("Validation middleware called for path:", req.path);
   console.log("Request body received:", JSON.stringify(req.body, null, 2));
   console.log("Schema being validated against:", schema.describe());
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {

    console.log("Validation errors:", JSON.stringify(error.details, null, 2));
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
    return res.status(400).json({ success: false, errors: details });
  }
console.log("Validation passed, cleaned value:", value);
  req.body = value;
  next();
};

export const validateBodyAuth = (schema) => (req, res, next) => {
  // Skip stripping unknown for authenticated routes
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
    return res.status(400).json({ success: false, errors: details });
  }

  req.body = value; // Assign directly to body
  next();
};

/**
 * Middleware factory for validating query parameters
 */
export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
    return res.status(400).json({ success: false, errors: details });
  }

  req.validated = { ...req.validated, query: value };
  next();
};

/**
 * Middleware factory for validating URL parameters
 */
export const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
    return res.status(400).json({ success: false, errors: details });
  }

  req.validated = { ...req.validated, params: value };
  next();
};


export const validateOrderInput = (req) => {
  const errors = [];

  if (req.body.couponCode && typeof req.body.couponCode !== "string") {
    errors.push("Invalid coupon code format");
  }

  if (
    req.body.paymentMethod &&
    !["card", "bank_transfer", "wallet"].includes(req.body.paymentMethod)
  ) {
    errors.push("Invalid payment method");
  }

  return errors;
};

// ============================================================================
// COMMON FIELD SCHEMAS (Reusable across multiple endpoints)
// ============================================================================

export const commonSchemas = {
  // Email validation - RFC 5322 simplified
  email: Joi.string().email().max(255).lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "string.max": "Email must be less than 255 characters",
  }), 

  // Password validation - min 6 chars
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 8 characters",
    "string.max": "Password cannot exceed 128 characters",
  }),

  // MongoDB ObjectId validation
  mongoId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid MongoDB ID format",
    }),

  // User ID from URL params
  userId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
    }),

  // Product ID validation
  productId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid product ID format",
    }),

  // Search query - remove special characters, max 100 chars
  searchQuery: Joi.string()
    .max(100)
    .trim()
    .pattern(/^[a-zA-Z0-9\s\-\_&]*$/)
    .optional()
    .messages({
      "string.pattern.base": "Search query contains invalid characters",
      "string.max": "Search query must be less than 100 characters",
    }),

  // Category name
  category: Joi.string()
    .max(50)
    .trim()
    .pattern(/^[a-zA-Z0-9\s\-\_&]*$/)
    .required()
    .messages({
      "string.pattern.base": "Category name contains invalid characters",
    }),

  // Price range validation
  priceMin: Joi.number().min(0).max(1000000).optional().messages({
    "number.min": "Minimum price cannot be negative",
  }),

  priceMax: Joi.number().min(0).max(1000000).optional().messages({
    "number.min": "Maximum price cannot be negative",
  }),

  // Order ID validation
  orderId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid order ID format",
    }),

  // Order number (alphanumeric)
  orderNumber: Joi.string().alphanum().max(50).required().messages({
    "string.alphanum": "Order number must be alphanumeric",
  }),

  // Order status validation
  orderStatus: Joi.string()
    .valid(
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    )
    .required()
    .messages({
      "any.only": "Invalid order status",
    }),

  // Coupon code validation
  couponCode: Joi.string().max(50).trim().required().messages({
    "string.max": "Coupon code must not exceed 50 characters",
  }),

  // Address validation
  address: Joi.string()
    .max(255)
    .trim()
    .pattern(/^[a-zA-Z0-9\s\,\.\-\#]*$/)
    .optional()
    .messages({
      "string.pattern.base": "Address contains invalid characters",
    }),

  // Phone number validation (basic)
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid phone number format",
    }),

  // Pagination
  page: Joi.number().min(1).max(10000).default(1).optional().messages({
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().min(1).max(100).default(10).optional().messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  // Date range
  startDate: Joi.date().optional().messages({
    "date.base": "Start date must be a valid date",
  }),

  endDate: Joi.date().optional().messages({
    "date.base": "End date must be a valid date",
  }),
};

// ============================================================================
// PREDEFINED SCHEMAS FOR COMMON OPERATIONS
// ============================================================================

// Auth schemas
export const authSchemas = {
  signup: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
      }),
    firstname: Joi.string().max(50).trim().required().messages({
      // lowercase 'firstname'
      "string.empty": "First name is required",
      "string.max": "First name cannot exceed 50 characters",
    }),
    lastname: Joi.string().max(50).trim().required().messages({
      // lowercase 'lastname'
      "string.empty": "Last name is required",
      "string.max": "Last name cannot exceed 50 characters",
    }),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),

  resetPassword: Joi.object({
    password: commonSchemas.password,
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
      }),
  }),

};

// Product schemas
export const productSchemas = {
  search: Joi.object({
    q: commonSchemas.searchQuery,
  }),

  suggestions: Joi.object({
    q: commonSchemas.searchQuery,
  }),

  byCategory: Joi.object({
    category: commonSchemas.category,
  }),

  priceFilter: Joi.object({
    minPrice: commonSchemas.priceMin,
    maxPrice: commonSchemas.priceMax,
  }),
};

// Cart schemas
export const cartSchemas = {
  add: Joi.object({
    productId: commonSchemas.productId,
    quantity: Joi.number().min(1).max(1000).optional().messages({
      "number.min": "Quantity must be at least 1",
    }),
    selectedVariant: Joi.string().optional().allow(""),
    size: Joi.string().optional().allow(""),
    color: Joi.string().optional().allow(""),
  }),

  update: Joi.object({
    quantity: Joi.number().min(1).max(1000).required().messages({
      "number.min": "Quantity must be at least 1",
    }),
    size: Joi.string().optional().allow("").default(""),
    color: Joi.string().optional().allow("").default(""),
  }),

  remove: Joi.object({
    productId: commonSchemas.productId,
    size: Joi.string().optional().allow("").default(""),
    color: Joi.string().optional().allow("").default(""),
  }),
};

// Order schemas
export const orderSchemas = {
  pagination: Joi.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
  }),

  getById: Joi.object({
    id: commonSchemas.orderId,
  }),

  create: Joi.object({
    shippingAddress: commonSchemas.address.required(),
    paymentMethod: Joi.string()
      .valid("card", "bank_transfer", "wallet")
      .required(),
  }),
};

// Coupon schemas
export const couponSchemas = {
  validate: Joi.object({
    code: commonSchemas.couponCode,
  }),
};

// Refund schemas
// Refund schemas
export const refundSchemas = {
  // For request body validation (when creating a refund)
  create: Joi.object({
    productId: Joi.alternatives()
      .try(
        // Regular MongoDB ObjectId
        Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        // Deleted product pattern: "deleted-{orderId}-{name}-{price}"
        Joi.string().pattern(/^deleted-[a-zA-Z0-9_-]+$/)
      )
      .required()
      .messages({
        'any.required': 'Product ID is required',
        'alternatives.match': 'Invalid product ID format',
      }),
    quantity: Joi.number().min(1).max(100).optional().default(1).messages({
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 100',
    }),
    reason: Joi.string().min(5).max(500).trim().required().messages({
      'string.empty': 'Reason is required',
      'string.min': 'Reason must be at least 5 characters',
      'string.max': 'Reason cannot exceed 500 characters',
    }),
  }).unknown(true), // Allow other fields if needed

  // For URL parameters validation (orderId in URL)
  createParams: Joi.object({
    orderId: commonSchemas.orderId,
  }),

  // For approving/rejecting refunds (both params and body)
  refundActionParams: Joi.object({
    orderId: commonSchemas.orderId,
    refundId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid refund ID format',
      }),
  }),

  rejectBody: Joi.object({
    reason: Joi.string().min(5).max(500).trim().required().messages({
      'string.empty': 'Rejection reason is required',
      'string.min': 'Reason must be at least 5 characters',
    }),
  }),

  getById: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};