
export const enforceHttps = () => {
  return (req, res, next) => {

    if (process.env.NODE_ENV === "production") {
 
      const isHttps =
        req.secure === true || req.headers["x-forwarded-proto"] === "https";


      if (!isHttps) {

        const redirectUrl = `https://${req.headers.host}${req.originalUrl}`;
        return res.redirect(301, redirectUrl);
      }
    } 

    // Continue to next middleware
    next();
  };
};


export const addHstsHeader = () => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === "production") {

      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    } else {

      res.setHeader("Strict-Transport-Security", "max-age=0");
    }

    next();
  };
};

export const addSecurityHeaders = () => {
  return (req, res, next) => {

    res.setHeader("X-Content-Type-Options", "nosniff");

    res.setHeader("X-Frame-Options", "SAMEORIGIN");

    res.setHeader("X-XSS-Protection", "1; mode=block");

    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=(), payment=()"
    );

    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.flutterwave.com; frame-src 'self' https://checkout.flutterwave.com"
    );

    next();
  };
};

export const validateHttpsConfig = () => {
  return (req, res, next) => {
    // Only log on first request
    if (!global.httpsConfigValidated) {
      global.httpsConfigValidated = true;

      console.log("\n" + "=".repeat(60));
      console.log("HTTPS Configuration Status");
      console.log("=".repeat(60));

      if (process.env.NODE_ENV === "production") {
        console.log("✓ Production environment detected");
        console.log("✓ HTTPS enforcement ENABLED");
        console.log("✓ HSTS headers configured");
        console.log("✓ Security headers active");
        console.log("\n Verify the following:");
        console.log("  - SSL certificates are properly installed");
        console.log(
          "  - Reverse proxy (nginx/Cloudflare) is handling SSL termination"
        );
        console.log("  - x-forwarded-proto header is set by reverse proxy");
        console.log("  - Production environment variable is set correctly");
      } else {
        console.log("  Development environment detected");
        console.log("  HTTP allowed for local testing");
        console.log("  HTTPS not enforced");
        console.log(
          ` Running on http://localhost:${process.env.PORT || 5000}`
        );
      }

      console.log("=".repeat(60) + "\n");
    }

    next();
  };
};


export default {
  enforceHttps,
  addHstsHeader,
  addSecurityHeaders,
  validateHttpsConfig,
};
 