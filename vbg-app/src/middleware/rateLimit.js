import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG } from '../config/constants.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  max: RATE_LIMIT_CONFIG.max,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  max: RATE_LIMIT_CONFIG.authMax,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});
