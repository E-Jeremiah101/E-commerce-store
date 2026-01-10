/**
 * MongoDB Injection Prevention Utilities
 *
 * Provides safe query building and input sanitization to prevent MongoDB injection attacks
 *
 * MongoDB Injection examples that these functions prevent:
 * - {"$ne": null}       // Query injection
 * - {"$gt": ""}         // Comparison injection
 * - {"$regex": ".*"}    // Regex injection
 * - "__proto__"         // Prototype pollution
 * - "constructor"       // Constructor injection
 */

/**
 * Sanitize a string value to prevent injection
 * Escapes special MongoDB/regex characters
 */
export const sanitizeString = (value) => {
  if (typeof value !== "string") return value;

  // Escape regex special characters to prevent regex injection
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Recursively sanitize an object to prevent injection
 * Removes dangerous keys and escapes string values
 */
export const sanitizeObject = (obj, depth = 0) => {
  if (depth > 10) return obj; // Prevent infinite recursion
  if (obj === null || typeof obj !== "object") return obj;

  // Dangerous keys that could enable injection
  const dangerousKeys = [
    "$ne",
    "$gt",
    "$gte",
    "$lt",
    "$lte",
    "$in",
    "$nin",
    "$or",
    "$and",
    "$where",
    "$regex",
    "$text",
  ];
  const forbiddenKeys = ["__proto__", "constructor", "prototype"];

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    // Skip prototype pollution keys
    if (forbiddenKeys.includes(key)) continue;

    // Skip MongoDB operators if key starts with $
    if (key.startsWith("$")) {
      if (dangerousKeys.includes(key)) continue;
    }

    const value = obj[key];

    // Recursively sanitize nested objects
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validate MongoDB ObjectId format
 * Prevents invalid ID injection
 */
export const isValidMongoId = (id) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Build safe filter object for MongoDB queries
 * Only allows whitelisted fields
 */
export const buildSafeFilter = (input, whitelistedFields) => {
  const filter = {};

  for (const field of whitelistedFields) {
    if (
      input.hasOwnProperty(field) &&
      input[field] !== undefined &&
      input[field] !== null
    ) {
      const value = input[field];

      // Reject if value is an object (could contain operators)
      if (typeof value === "object") {
        continue;
      }

      // Sanitize string values
      if (typeof value === "string") {
        filter[field] = sanitizeString(value);
      } else {
        filter[field] = value;
      }
    }
  }

  return filter;
};

/**
 * Sanitize search query to prevent injection
 * Removes special characters that could enable regex injection
 */
export const sanitizeSearchQuery = (query) => {
  if (typeof query !== "string") return "";

  // Remove special regex/injection characters
  return query
    .replace(/[.*+?^${}()|[\]\\]/g, "")
    .substring(0, 100) // Max 100 chars
    .trim();
};

/**
 * Build safe text search filter
 * Creates a regex-based search with escaped input
 */
export const buildTextSearchFilter = (searchQuery, fields) => {
  const sanitized = sanitizeSearchQuery(searchQuery);
  if (!sanitized) return {};

  // Escape special characters for regex
  const escapedQuery = sanitized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i"); // Case-insensitive

  // Build OR filter across multiple fields
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: regex },
    })),
  };
};

/**
 * Build safe price range filter
 * Validates and sanitizes numeric input
 */
export const buildPriceRangeFilter = (minPrice, maxPrice) => {
  const filter = {};

  if (minPrice !== undefined && minPrice !== null) {
    const min = Number(minPrice);
    if (Number.isFinite(min) && min >= 0) {
      filter.$gte = min;
    }
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    const max = Number(maxPrice);
    if (Number.isFinite(max) && max >= 0) {
      filter.$lte = max;
    }
  }

  return Object.keys(filter).length > 0 ? { price: filter } : {};
};

/**
 * Validate pagination parameters
 * Prevents negative or excessive values
 */
export const validatePagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, Math.min(Number(page) || 1, 10000));
  const limitNum = Math.max(1, Math.min(Number(limit) || 10, 100));

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
};

/**
 * Check if value contains suspicious injection patterns
 */
export const containsSuspiciousPatterns = (value) => {
  if (typeof value !== "string") return false;

  const suspiciousPatterns = [
    /\$[a-z]+/i, // MongoDB operators like $ne, $gt
    /\{\s*\$/, // Object with $ operator
    /__proto__/, // Prototype pollution
    /constructor/, // Constructor access
    /prototype/, // Prototype access
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
};

/**
 * Safe query builder for multiple conditions
 * Combines sanitized filters safely
 */
export const buildSafeQuery = (...filterObjects) => {
  const query = {};

  for (const filterObj of filterObjects) {
    if (filterObj && typeof filterObj === "object") {
      Object.assign(query, filterObj);
    }
  }

  return query;
};
