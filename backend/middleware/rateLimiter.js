import rateLimit, { MemoryStore } from "express-rate-limit";

// Helper function to safely get client IP (handles IPv6)
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress ||
    "127.0.0.1"
  );
};

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.body.email || getClientIp(req)}:login`;
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many login attempts. Please try again after 15 minutes.",
      retryAfter: 900,
    });
  },
});

export const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    message: "Too many signup attempts. Please try again after 1 hour.",
    retryAfter: 3600,
  },
  keyGenerator: (req) => {
    return `${req.body.email || getClientIp(req)}:signup`;
  },
  skip: (req) => {
    const trustedIPs = ["127.0.0.1", "::1"];
    const clientIp = getClientIp(req);
    return trustedIPs.includes(clientIp);
  },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    message: "Too many password reset requests. Please try again after 1 hour.",
    retryAfter: 3600,
  },
  keyGenerator: (req) => {
    return `${req.body.email || getClientIp(req)}:forgot-password`;
  },
});
