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

/**
 * Middleware factory for validating request body
 */
export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
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

  req.validated = { ...req.validated, body: value };
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

// ============================================================================
// COMMON FIELD SCHEMAS (Reusable across multiple endpoints)
// ============================================================================

export const commonSchemas = {
  // Email validation - RFC 5322 simplified
  email: Joi.string().email().max(255).lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "string.max": "Email must be less than 255 characters",
  }),

  // Password validation - min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character",
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
    .pattern(/^[a-zA-Z0-9\s\-\_]*$/)
    .optional()
    .messages({
      "string.pattern.base": "Search query contains invalid characters",
      "string.max": "Search query must be less than 100 characters",
    }),

  // Category name
  category: Joi.string()
    .max(50)
    .trim()
    .pattern(/^[a-zA-Z0-9\s\-\_]*$/)
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
      "refunded"
    )
    .required()
    .messages({
      "any.only": "Invalid order status",
    }),

  // Coupon code validation
  couponCode: Joi.string().alphanum().uppercase().max(50).required().messages({
    "string.alphanum": "Coupon code must be alphanumeric",
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
    firstName: Joi.string().max(50).trim().required(),
    lastName: Joi.string().max(50).trim().required(),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password,
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
      }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
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
    quantity: Joi.number().min(1).max(1000).required().messages({
      "number.min": "Quantity must be at least 1",
    }),
    selectedVariant: Joi.string().optional(),
  }),

  update: Joi.object({
    quantity: Joi.number().min(1).max(1000).required().messages({
      "number.min": "Quantity must be at least 1",
    }),
  }),

  remove: Joi.object({
    productId: commonSchemas.productId,
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
export const refundSchemas = {
  create: Joi.object({
    orderId: commonSchemas.orderId,
    reason: Joi.string().max(500).trim().required(),
  }),

  getById: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};
