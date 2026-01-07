import rateLimit from "express-rate-limit";

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

    return `${req.body.email || req.ip}:login`;
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
    return `${req.body.email || req.ip}:signup`;
  },
  skip: (req) => {
  
    const trustedIPs = ["127.0.0.1", "::1", "192.168.1.0/24"]; 
    return trustedIPs.some((ip) => req.ip === ip || req.ip.startsWith(ip));
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
    return `${req.body.email || req.ip}:forgot-password`;
  },
});
