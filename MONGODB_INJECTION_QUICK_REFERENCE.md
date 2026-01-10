# MongoDB Injection Prevention - Quick Reference

## Installation
No additional dependencies needed - using already installed Joi library.

## Adding Validation to New Routes

### 1. Import Validation
```javascript
import { validateBody, validateQuery, validateParams, productSchemas } from "../middleware/validateInput.middleware.js";
```

### 2. Apply to Route
```javascript
router.get("/search", validateQuery(productSchemas.search), searchProducts);
router.post("/", validateBody(productSchemas.create), createProduct);
router.get("/:id", validateParams(productSchemas.getById), getById);
```

## Common Validation Patterns

### Search with Injection Prevention
```javascript
// ❌ Unsafe
app.get("/search", (req, res) => {
  db.products.find({ name: { $regex: req.query.q } });
});

// ✅ Safe
import { sanitizeSearchQuery } from "../utils/sanitization.js";
app.get("/search", validateQuery(productSchemas.search), (req, res) => {
  const q = sanitizeSearchQuery(req.query.q);
  db.products.find({ name: { $regex: q, $options: "i" } });
});
```

### Filtering with Whitelist
```javascript
// ❌ Unsafe - allows any field
app.get("/products", (req, res) => {
  db.products.find(req.query); // Dangerous!
});

// ✅ Safe - whitelist only allowed fields
import { buildSafeFilter } from "../utils/sanitization.js";
app.get("/products", (req, res) => {
  const filter = buildSafeFilter(req.query, ["category", "inStock", "minPrice"]);
  db.products.find(filter);
});
```

### Pagination Safely
```javascript
// ❌ Unsafe
app.get("/products", (req, res) => {
  const skip = (req.query.page - 1) * req.query.limit;
  db.products.find().skip(skip).limit(req.query.limit);
});

// ✅ Safe
import { validatePagination } from "../utils/sanitization.js";
app.get("/products", validateQuery(commonSchemas.pagination), (req, res) => {
  const { skip, limit } = validatePagination(req.query.page, req.query.limit);
  db.products.find().skip(skip).limit(limit);
});
```

## Available Validation Schemas

### Common Fields
```javascript
commonSchemas = {
  email,          // RFC 5322 compliant email
  password,       // Min 8 chars, complexity required
  mongoId,        // 24-char hex ObjectId
  userId,         // Same as mongoId
  productId,      // Same as mongoId
  searchQuery,    // Max 100 chars, alphanumeric
  category,       // Alphanumeric with hyphens
  priceMin,       // Number 0-1000000
  priceMax,       // Number 0-1000000
  orderId,        // 24-char hex ObjectId
  orderNumber,    // Alphanumeric
  orderStatus,    // Enum validation
  couponCode,     // Alphanumeric uppercase
  address,        // Alphanumeric with punctuation
  phoneNumber,    // E.164 format
  page,           // Number 1-10000
  limit,          // Number 1-100
  startDate,      // Date validation
  endDate         // Date validation
}
```

### Predefined Schemas
- `authSchemas`: signup, login, forgotPassword, resetPassword, changePassword
- `productSchemas`: search, suggestions, byCategory, priceFilter
- `cartSchemas`: add, update, remove
- `orderSchemas`: pagination, getById, create
- `couponSchemas`: validate
- `refundSchemas`: create, getById

## Creating Custom Schemas

```javascript
import Joi from "joi";
import { commonSchemas } from "../middleware/validateInput.middleware.js";

// Reuse common fields
const customSchema = Joi.object({
  email: commonSchemas.email,          // Reuse email validation
  productId: commonSchemas.productId,  // Reuse product ID validation
  customField: Joi.string()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s]+$/)
    .required()
});
```

## Handling Validation Errors

### Automatic (Built-in)
```javascript
// If validation fails, middleware automatically returns 400
// No additional error handling needed
```

### Custom Error Handling (Optional)
```javascript
router.get("/products/:id", validateParams(Joi.object({ id: Joi.string().required() })), (req, res) => {
  // If ID validation failed, response already sent by middleware
  // This code only runs if validation passed
});
```

## Testing Injection Prevention

### Test Script
```bash
#!/bin/bash

# Test 1: Valid request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@"}'

# Test 2: Injection attempt
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$ne":null},"password":"x"}'

# Test 3: XSS attempt in search
curl "http://localhost:5000/api/products/search?q=<script>alert(1)</script>"

# Test 4: Regex injection
curl "http://localhost:5000/api/products/search?q=.*"
```

## Performance Tips

1. **Validation is fast** (<1ms per request)
2. **Cache compiled schemas** (Joi does this automatically)
3. **Monitor error rates** for DDoS via validation failures
4. **Set reasonable limits** (100 chars for search, 100 for limit)

## Security Best Practices

1. ✅ Always validate ALL user input
2. ✅ Use whitelists, not blacklists
3. ✅ Validate at route level, before controller
4. ✅ Strip unknown fields (stripUnknown: true)
5. ✅ Log validation failures for security monitoring
6. ✅ Use type-specific validation (string != object)
7. ✅ Enforce format validation (email, ObjectId, etc)
8. ✅ Set max length limits on all strings
9. ✅ Validate numeric ranges (min/max)
10. ✅ Combine with other security measures (rate limiting, etc)

## Troubleshooting

### "Cannot find module" Error
```
Error: Cannot find module '../middleware/validateInput.middleware.js'

Solution: Ensure file exists at backend/middleware/validateInput.middleware.js
```

### "Joi is not defined" Error
```
Error: Joi is not defined

Solution: Ensure Joi is imported at top of file:
import Joi from "joi";
```

### Validation Always Fails
```
Check:
1. Schema field names match request field names
2. Required fields are present in request
3. Data types match schema expectations
4. String length is within limits
5. Custom patterns match input
```

### Want to Bypass Validation in Development?
```javascript
// Not recommended, but possible:
const validateBody = process.env.NODE_ENV === "production" 
  ? validateBody 
  : (schema) => (req, res, next) => next();
```

## Files to Review

1. **Full Implementation**: See `MONGODB_INJECTION_PREVENTION.md`
2. **Detailed Summary**: See `VALIDATION_IMPLEMENTATION.md`
3. **Joi Documentation**: https://joi.dev/api/

## When to Update Validation

Update validation schemas when:
- ✅ Adding new route endpoints
- ✅ Changing request data structure
- ✅ Adding/removing request fields
- ✅ Changing field requirements (required/optional)
- ✅ Updating field constraints (min/max length, format, etc)
- ✅ New security requirements identified

Do NOT update validation when:
- ❌ Only changing controller/business logic
- ❌ Only changing database operations
- ❌ Only changing response format
