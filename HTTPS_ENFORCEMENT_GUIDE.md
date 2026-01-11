# HTTPS Enforcement & Security Headers Guide

## Overview

This guide documents the comprehensive HTTPS enforcement and security headers implementation that prevents token interception and man-in-the-middle attacks. It ensures all data in transit is encrypted and protects against various protocol downgrade attacks.

**Implementation Date**: January 2026  
**Risk Level**: CRITICAL  
**Compliance**: PCI DSS 4.1, OWASP, NIST, RFC 6797  
**Issue**: #6 - No HTTPS Enforcement

---

## Problem Statement

### Current Risk

Without HTTPS enforcement:

- **Token Interception**: Auth tokens transmitted in plaintext can be captured
- **Credential Theft**: Passwords and login credentials exposed to MITM attacks
- **Payment Data Exposure**: Unencrypted payment information vulnerable to interception
- **Session Hijacking**: Session cookies can be stolen and replayed
- **Data Tampering**: Requests can be modified in transit by attackers

### Attack Scenarios

#### Scenario 1: Coffee Shop MITM Attack

```
Customer ──HTTP──> Coffee Shop WiFi ──[ATTACKER]──> Backend
                   (No encryption)

Result: Attacker can intercept:
✗ Login credentials
✗ Auth tokens
✗ Payment information
✗ Personal data
```

#### Scenario 2: Protocol Downgrade Attack

```
Browser (HTTPS) ──> [ATTACKER] ──HTTP──> Server
                    Forces HTTP

Result: Attacker downgrades HTTPS to HTTP for interception
```

---

## Implementation Architecture

### 1. HTTPS Enforcement Middleware

**File**: `backend/middleware/https.middleware.js`

#### `enforceHttps()` Middleware

```javascript
// Redirects HTTP to HTTPS in production
// Transparent to application code

// In Production:
GET http://example.com/api/users
// Redirects to:
GET https://example.com/api/users (301 Permanent Redirect)

// In Development:
GET http://localhost:5000/api/users
// Allowed (HTTP for local testing)
```

**Features:**

- 301 permanent redirect (cacheable by browsers)
- Preserves original URL path and query parameters
- Only enforces in production (`NODE_ENV === "production"`)
- Supports reverse proxy detection (`x-forwarded-proto` header)
- Works with AWS ALB, nginx, Cloudflare

#### `addSecurityHeaders()` Middleware

```javascript
// Adds comprehensive security headers to all responses
```

**Headers Added:**

| Header                      | Purpose                | Value                                          |
| --------------------------- | ---------------------- | ---------------------------------------------- |
| `Strict-Transport-Security` | Force HTTPS for 1 year | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options`    | Prevent MIME sniffing  | `nosniff`                                      |
| `X-Frame-Options`           | Prevent clickjacking   | `SAMEORIGIN`                                   |
| `X-XSS-Protection`          | XSS protection         | `1; mode=block`                                |
| `Referrer-Policy`           | Control referrer info  | `strict-origin-when-cross-origin`              |
| `Content-Security-Policy`   | Prevent XSS attacks    | `default-src 'self'; ...`                      |
| `Permissions-Policy`        | Disable risky features | `geolocation=(); microphone=(); ...`           |

#### `validateHttpsConfig()` Middleware

```javascript
// Logs HTTPS configuration status at startup
// Provides warnings if misconfigured

Console Output (Production):
=============================================================
HTTPS Configuration Status
=============================================================
✓ Production environment detected
✓ HTTPS enforcement ENABLED
✓ HSTS headers configured
✓ Security headers active

⚠️  Verify the following:
  - SSL certificates are properly installed
  - Reverse proxy (nginx/Cloudflare) is handling SSL termination
  - x-forwarded-proto header is set by reverse proxy
  - Production environment variable is set correctly
=============================================================
```

### 2. Server Integration

**File**: `backend/server.js`

```javascript
import { enforceHttps, addSecurityHeaders, validateHttpsConfig }
  from "./middleware/https.middleware.js";

// Apply middleware in order
app.use(cors(...));
app.set("trust proxy", true);

// 1. Enforce HTTPS (redirects HTTP to HTTPS)
app.use(enforceHttps());

// 2. Add security headers (HSTS, CSP, X-Frame-Options, etc.)
app.use(addSecurityHeaders());

// 3. Validate configuration (log status)
app.use(validateHttpsConfig());

// Rest of middleware...
app.use(express.json());
```

---

## HSTS (HTTP Strict-Transport-Security)

### What is HSTS?

HSTS is an HTTP header that tells browsers to:

1. Always use HTTPS for future requests
2. Reject any HTTPS certificates that are invalid
3. Never allow users to override certificate warnings

### HSTS Header Explained

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
                          ↓                   ↓                    ↓
                          1 year              All subdomains       Browser preload list
```

#### Max-Age Values

| Value    | Duration            | Use Case                           |
| -------- | ------------------- | ---------------------------------- |
| 0        | Immediately expires | Development/Testing (disable HSTS) |
| 3600     | 1 hour              | Short-term testing                 |
| 86400    | 1 day               | Testing before full rollout        |
| 31536000 | 1 year              | Production (recommended)           |

#### IncludeSubDomains

When set, HSTS applies to all subdomains:

```
example.com (✓ HTTPS required)
api.example.com (✓ HTTPS required)
admin.example.com (✓ HTTPS required)
```

#### Preload

Allows domain to be included in browser preload lists (Chrome, Firefox, Safari).

**Register for preload**: https://hstspreload.org/

### HSTS Benefits

✅ **Protection Against Protocol Downgrade**: Browsers refuse HTTP connections  
✅ **SSL Stripping Prevention**: Attacker cannot force HTTP  
✅ **Secure Cookie Transmission**: Cookies transmitted only over HTTPS  
✅ **Zero Trust**: No first request vulnerability

### HSTS Gotchas

⚠️ **Irreversible**: Once set, HSTS persists for max-age duration  
⚠️ **Subdomain Risk**: includeSubDomains breaks HTTP subdomains  
⚠️ **Development Issues**: Affects local testing (solved with max-age=0)

---

## Deployment Guide

### 1. Direct HTTPS (Node.js Handles SSL)

**Setup:**

```javascript
import https from "https";
import fs from "fs";

const options = {
  key: fs.readFileSync("/path/to/private.key"),
  cert: fs.readFileSync("/path/to/certificate.crt"),
};

https.createServer(options, app).listen(443, () => {
  console.log("✓ HTTPS Server running on port 443");
});
```

**Pros:**

- No reverse proxy needed
- Direct control over SSL

**Cons:**

- Application responsible for certificate renewal
- Cannot hot-reload certificates

### 2. Reverse Proxy (Recommended)

**Setup with nginx:**

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # HTTPS Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

**Middleware Configuration:**

```javascript
app.set("trust proxy", true); // Trust nginx headers
app.use(enforceHttps()); // Detects HTTPS via x-forwarded-proto
```

**Pros:**

- Reverse proxy handles SSL termination
- Easy certificate renewal (Let's Encrypt)
- Can load balance across multiple instances
- Middleware stays simple

**Cons:**

- Extra proxy layer (minor performance impact)
- More moving parts to configure

### 3. Cloudflare (Easiest)

**Setup:**

1. Point DNS to Cloudflare
2. Enable "Full (strict)" encryption mode
3. Set origin to HTTPS (or let Cloudflare handle both)
4. Middleware detects `x-forwarded-proto: https` from Cloudflare

---

## Security Headers Deep Dive

### Content-Security-Policy (CSP)

```javascript
"default-src 'self';
 script-src 'self' 'unsafe-inline';
 style-src 'self' 'unsafe-inline';
 img-src 'self' data: https:;
 font-src 'self' data:;
 connect-src 'self' https://api.flutterwave.com;
 frame-src 'self' https://checkout.flutterwave.com"
```

**What it does:**

- `default-src 'self'`: Only load resources from same origin by default
- `script-src 'self' 'unsafe-inline'`: Allow inline scripts (for React)
- `connect-src 'self' https://api.flutterwave.com`: Allow API calls to Flutterwave
- `frame-src 'self' https://checkout.flutterwave.com`: Allow payment iframe

**Prevents:**

- Inline script injection
- External script loading
- Unauthorized API calls
- Clickjacking within frames

### X-Frame-Options

```javascript
"SAMEORIGIN"; // Only allow framing by same origin
```

**Alternatives:**

- `DENY`: No framing allowed
- `SAMEORIGIN`: Same origin only (recommended)
- `ALLOW-FROM https://example.com`: Specific domain (outdated)

### X-Content-Type-Options

```javascript
"nosniff"; // Don't guess MIME type, use Content-Type header
```

**Prevents:**

- Browser MIME sniffing
- Script execution of HTML files
- Style injection attacks

---

## Testing HTTPS Configuration

### 1. Test HTTPS Redirect

```bash
# Should redirect to HTTPS
curl -I http://example.com/api/users
# HTTP/1.1 301 Moved Permanently
# Location: https://example.com/api/users
```

### 2. Test Security Headers

```bash
# Check all security headers
curl -I https://example.com/api/users

# Response headers should include:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# Content-Security-Policy: ...
```

### 3. Online Security Audit Tools

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/
- **OWASP ZAP**: https://www.zaproxy.org/

---

## Compliance

### PCI DSS (Payment Card Industry)

✅ **Requirement 4.1** - Strong Cryptography

- HTTPS/TLS 1.2 or higher required
- All cardholder data transmitted encrypted

✅ **Requirement 6.5.10** - Broken Authentication

- HTTPS prevents auth token interception
- Session hijacking protection via HSTS

### OWASP Top 10

✅ **A02:2021 - Cryptographic Failures**

- HTTPS ensures data in transit is encrypted
- HSTS prevents downgrade attacks

✅ **A05:2021 - Access Control**

- Security headers prevent unauthorized access
- CSP prevents script injection

### NIST Cybersecurity Framework

✅ **PR.DS-1** - Cryptographic Controls

- TLS 1.2+ for all data transmission
- HSTS for forced encryption

✅ **DE.AE-1** - Detect Anomalies

- Invalid certificate warnings
- Protocol downgrade attempts

---

## Troubleshooting

### Issue: "HTTPS redirect loop"

**Cause**: `x-forwarded-proto` not being set by reverse proxy

**Solution**:

```javascript
// Verify reverse proxy sets header
app.use((req, res, next) => {
  console.log("x-forwarded-proto:", req.headers["x-forwarded-proto"]);
  console.log("req.secure:", req.secure);
  next();
});

// Configure reverse proxy (nginx example)
proxy_set_header X-Forwarded-Proto $scheme;
```

### Issue: "HSTS prevents local testing"

**Cause**: Browser cached HSTS header from production

**Solution**:

```
Chrome: chrome://net-internals/#hsts
  - Search for "localhost"
  - Click "Delete"

Firefox: about:preferences#privacy
  - Search and remove from cookies

Development: Use max-age=0 to clear HSTS
```

### Issue: "Mixed content warnings"

**Cause**: HTTPS page loading HTTP resources

**Solution**:

```javascript
// Upgrade all resources to HTTPS
"img-src https: data:; script-src https:; style-src https:"

// Or use protocol-relative URLs
<img src="//cdn.example.com/image.jpg" />
```

### Issue: "CSP blocks legitimate scripts"

**Cause**: Script source not in CSP whitelist

**Solution**:

```javascript
// Check browser console for CSP violations
// Add source to CSP header:
"script-src 'self' https://trusted-cdn.example.com"

// Or use nonce for inline scripts
<script nonce="abc123">// code</script>
// "script-src 'nonce-abc123'"
```

---

## Performance Impact

### Network Overhead

| Metric          | Impact      | Details                  |
| --------------- | ----------- | ------------------------ |
| HTTPS Handshake | +100-300ms  | One-time per connection  |
| TLS Cipher      | Negligible  | Modern CPUs optimize AES |
| Request Size    | +~100 bytes | Headers added            |
| Response Size   | Negligible  | Headers only             |

**Mitigation:**

- Use HTTP/2 multiplexing (included with HTTPS)
- Enable TLS session resumption
- Use modern ciphers (ChaCha20, AES-GCM)

### Caching

HSTS and security headers are cacheable by browsers:

- Reduced server load for repeat visitors
- No performance penalty after first request

---

## Monitoring & Alerts

### Health Check

```javascript
// Endpoint to verify HTTPS configuration
app.get("/health/https", (req, res) => {
  const checks = {
    https_enforced: process.env.NODE_ENV === "production",
    hsts_enabled: res.get("Strict-Transport-Security") !== undefined,
    csp_enabled: res.get("Content-Security-Policy") !== undefined,
    x_frame_options: res.get("X-Frame-Options") !== undefined,
  };

  const allPassed = Object.values(checks).every((v) => v === true);

  res.status(allPassed ? 200 : 500).json({
    status: allPassed ? "healthy" : "degraded",
    checks,
  });
});
```

### Monitoring Rules

```yaml
Alert: "HTTPS Redirect Failing"
Condition: HTTP status 200 on /api/users (should be 301 redirect)
Severity: CRITICAL
Action: Page on-call engineer

Alert: "Invalid Certificate Detected"
Condition: TLS_ERROR rate > 1%
Severity: CRITICAL
Action: Immediate investigation

Alert: "CSP Violations Detected"
Condition: CSP report violations > 10/minute
Severity: WARNING
Action: Log violations, investigate sources
```

---

## Migration Checklist

- [ ] Generate/obtain SSL certificates (Let's Encrypt recommended)
- [ ] Configure reverse proxy (nginx/AWS ALB/Cloudflare)
- [ ] Set `NODE_ENV=production` in production
- [ ] Add HTTPS middleware to server
- [ ] Enable `trust proxy` middleware
- [ ] Test HTTPS redirect with `curl`
- [ ] Verify all security headers with `curl -I`
- [ ] Test with security audit tools (SSL Labs, etc.)
- [ ] Monitor logs for HTTPS errors
- [ ] Register domain for HSTS preload (optional)
- [ ] Update documentation
- [ ] Train team on HTTPS maintenance

---

## Best Practices

✅ **DO:**

- Always use HTTPS in production
- Use HTTP/2 for better performance
- Enable HSTS with includeSubDomains
- Register for HSTS preload
- Monitor security headers
- Use strong ciphers (TLS 1.2+)
- Implement CSP headers
- Test regularly with security tools
- Keep certificates up to date
- Use certificate pinning for sensitive APIs

❌ **DON'T:**

- Disable HTTPS enforcement "for testing"
- Use self-signed certificates in production
- Ignore certificate expiration warnings
- Mix HTTP and HTTPS content
- Disable security headers
- Log sensitive data in HTTPS errors
- Use weak ciphers or TLS 1.1
- Forget to renew certificates
- Hardcode API endpoints (allows protocol downgrade)

---

## References

- **RFC 6797**: HTTP Strict-Transport-Security
- **OWASP Secure Headers**: https://owasp.org/www-project-secure-headers/
- **Mozilla Web Security**: https://infosec.mozilla.org/
- **PCI DSS Requirements**: https://www.pcisecuritystandards.org/
- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework/

---

## Support & Questions

For questions regarding HTTPS enforcement:

1. Check troubleshooting section above
2. Review middleware code comments
3. Test with security audit tools
4. Review deployment guide for your platform
5. Contact security team

---

## Document History

| Date     | Version | Changes                |
| -------- | ------- | ---------------------- |
| Jan 2026 | 1.0     | Initial implementation |
