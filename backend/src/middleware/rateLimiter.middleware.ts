import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const claimRateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 2, // Limit each IP to 2 requests per 10 seconds
  message: {
    error: 'Too many claim requests. You can only claim twice per 10 seconds.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
