import express from 'express';
import { asyncHandler } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, asyncHandler(authController.register));
router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/logout', authController.logout);
router.get('/verify-email', asyncHandler(authController.verifyEmail));
router.post('/forgot-password', authLimiter, asyncHandler(authController.forgotPassword));
router.post('/reset-password', authLimiter, asyncHandler(authController.resetPassword));
router.get('/verify-token', authenticateToken, asyncHandler(authController.verifyToken));

export default router;
