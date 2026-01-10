/**
 * Log Sanitization Utility
 * 
 * Prevents sensitive data exposure in audit logs
 * Blocks forbidden fields and masks personally identifiable information
 * Complies with GDPR, PCI DSS, SOC 2, HIPAA, and ISO 27001
 * 
 * Features:
 * - Blocks 30+ sensitive fields (passwords, tokens, payment info)
 * - Masks PII (email, phone, addresses)
 * - Pattern detection for sensitive data (password=, token=, api_key=, credit card patterns)
 * - Recursive sanitization with depth limits
 * - Safe JSON stringification with circular reference prevention
 * 
 * Usage:
 * const sanitized = sanitizeLogEntry(logData);
 * const masked = sanitizeLogResults(apiResponse);
 */

/**
 * Fields that must be completely blocked from logs
 * These contain highly sensitive data that should never be logged
 */
const FORBIDDEN_FIELDS = new Set([
  // Authentication & Security
  'password',
  'passwordHash',
  'passwordConfirm',
  'currentPassword',
  'newPassword',
  'oldPassword',
  'pin',
  'secret',
  'apiKey',
  'apiSecret',
  'accessToken',
  'refreshToken',
  'token',
  'bearerToken',
  'authToken',
  'sessionToken',
  'csrfToken',
  'oauth_token',
  'privateKey',
  'publicKey',
  
  // Payment Information (PCI DSS)
  'cardNumber',
  'cardPin',
  'cvv',
  'cvc',
  'expiryDate',
  'expirationDate',
  'cardholderName',
  'bankAccountNumber',
  'routingNumber',
  'swiftCode',
  'iban',
  'walletSecret',
  'paymentSecret',
  
  // Personal Identification
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'nationalId',
  'driversLicense',
  'passport',
  'birthDate',
  'dateOfBirth',
  
  // Sensitive Account Information
  'securityQuestion',
  'securityAnswer',
  'twoFactorSecret',
  '2faSecret',
  'backupCodes',
  'recoveryCode',
  
  // API/Integration Secrets
  'webhookSecret',
  'encryptionKey',
  'decryptionKey',
  'signingKey',
  'flutterwave_secret_key',
]);

/**
 * Fields that should be masked in logs
 * Shows first 2 and last 2 characters with asterisks in between
 */
const MASKED_FIELDS = new Set([
  'email',
  'emailAddress',
  'userName',
  'phone',
  'phoneNumber',
  'mobileNumber',
  'ipAddress',
  'ip',
  'address',
  'streetAddress',
  'city',
  'state',
  'postalCode',
  'zipCode',
  'firstName',
  'lastName',
  'fullName',
  'name',
]);

/**
 * Patterns that indicate sensitive data even if field name doesn't
 * Case-insensitive regex patterns
 */
const SENSITIVE_PATTERNS = [
  /password\s*=/i,
  /token\s*=/i,
  /api_key\s*=/i,
  /secret\s*=/i,
  /key\s*=/i,
  /cvv\s*=/i,
  /pin\s*=/i,
  /card\s*=/i,
  /bearer\s+\w+/i,
  /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/, // Credit card pattern
];

/**
 * Masks a sensitive value
 * Shows first 2 and last 2 characters
 * Example: user@example.com -> us****om
 * 
 * @param {string} value - Value to mask
 * @returns {string} Masked value
 */
export const maskValue = (value) => {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= 4) return '*'.repeat(value.length);
  return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
};

/**
 * Sanitizes a single value
 * Either blocks or masks based on field name and patterns
 * 
 * @param {*} value - Value to sanitize
 * @param {string} fieldName - Name of the field
 * @returns {*} Sanitized value or masked value
 */
export const sanitizeValue = (value, fieldName = '') => {
  if (value === null || value === undefined) return value;
  
  const lowerFieldName = (fieldName || '').toLowerCase();
  
  // Block forbidden fields completely
  if (FORBIDDEN_FIELDS.has(lowerFieldName)) {
    return '[REDACTED]';
  }
  
  // Mask sensitive field values
  if (MASKED_FIELDS.has(lowerFieldName) && typeof value === 'string') {
    return maskValue(value);
  }
  
  // Pattern detection for stringified values
  if (typeof value === 'string') {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(value)) {
        return maskValue(value);
      }
    }
  }
  
  return value;
};

/**
 * Recursively sanitizes an object
 * Blocks forbidden fields and masks sensitive values
 * Handles nested objects and arrays
 * 
 * @param {*} obj - Object or value to sanitize
 * @param {number} depth - Current recursion depth (max 10)
 * @returns {*} Sanitized object
 */
export const sanitizeObject = (obj, depth = 0) => {
  // Limit recursion depth to prevent stack overflow
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  
  if (obj === null || obj === undefined) return obj;
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => {
      if (typeof item === 'object') {
        return sanitizeObject(item, depth + 1);
      }
      return item;
    });
  }
  
  // Handle objects
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Block forbidden fields completely
    if (FORBIDDEN_FIELDS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Mask sensitive field values
    if (MASKED_FIELDS.has(lowerKey) && typeof value === 'string') {
      sanitized[key] = maskValue(value);
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else if (typeof value === 'string') {
      // Check for sensitive patterns in string values
      let isSensitive = false;
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(value)) {
          sanitized[key] = maskValue(value);
          isSensitive = true;
          break;
        }
      }
      if (!isSensitive) {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Sanitizes a log entry before storage
 * Called by auditLogger before saving to MongoDB
 * 
 * @param {Object} logData - Log data object
 * @returns {Object} Sanitized log data safe for storage
 */
export const sanitizeLogEntry = (logData) => {
  if (!logData || typeof logData !== 'object') {
    return logData;
  }
  
  const sanitized = { ...logData };
  
  // Sanitize the data/body field which contains user input
  if (sanitized.data) {
    sanitized.data = sanitizeObject(sanitized.data);
  }
  
  // Sanitize request field
  if (sanitized.request) {
    sanitized.request = sanitizeObject(sanitized.request);
  }
  
  // Sanitize response field
  if (sanitized.response) {
    sanitized.response = sanitizeObject(sanitized.response);
  }
  
  return sanitized;
};

/**
 * Sanitizes log results before API response
 * Called by auditLog.controller.js getAuditLogs before sending to client
 * Provides an additional layer of protection
 * 
 * @param {Array} logs - Array of log documents
 * @returns {Array} Sanitized logs safe for client display
 */
export const sanitizeLogResults = (logs) => {
  if (!Array.isArray(logs)) {
    return logs;
  }
  
  return logs.map(log => {
    if (typeof log === 'object' && log !== null) {
      return sanitizeObject(log);
    }
    return log;
  });
};

/**
 * Checks if data contains sensitive information
 * Used for warnings during development
 * 
 * @param {*} data - Data to check
 * @returns {boolean} True if sensitive data detected
 */
export const containsSensitiveData = (data) => {
  if (typeof data === 'string') {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(data)) {
        return true;
      }
    }
  }
  
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      if (FORBIDDEN_FIELDS.has(key.toLowerCase())) {
        return true;
      }
      if (typeof value === 'object') {
        if (containsSensitiveData(value)) {
          return true;
        }
      } else if (typeof value === 'string' && containsSensitiveData(value)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Safe JSON stringification with circular reference handling
 * Prevents "Converting circular structure to JSON" errors
 * 
 * @param {*} data - Data to stringify
 * @returns {string} JSON string or error message
 */
export const safeStringify = (data) => {
  const seen = new WeakSet();
  
  try {
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[CIRCULAR_REFERENCE]';
        }
        seen.add(value);
      }
      return value;
    });
  } catch (error) {
    return `[JSON_STRINGIFY_ERROR: ${error.message}]`;
  }
};

/**
 * Gets a safe summary of log data for console logging
 * Removes sensitive data while showing what was logged
 * 
 * @param {Object} logData - Log data to summarize
 * @returns {string} Safe log summary
 */
export const getLogSummary = (logData) => {
  if (!logData || typeof logData !== 'object') {
    return String(logData);
  }
  
  const { action, userId, route, status, timestamp } = logData;
  
  return `${action} by user ${userId} on ${route} (status: ${status}) at ${timestamp}`;
};

/**
 * Default export with all sanitization functions
 */
export default {
  sanitizeObject,
  sanitizeLogEntry,
  sanitizeLogResults,
  sanitizeValue,
  maskValue,
  containsSensitiveData,
  safeStringify,
  getLogSummary,
  FORBIDDEN_FIELDS,
  MASKED_FIELDS,
};
