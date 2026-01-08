import express from 'express';
import { authenticateToken, asyncHandler } from '../middleware/auth.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authenticateToken, asyncHandler(userController.getProfile));
router.put('/profile/update', authenticateToken, asyncHandler(userController.updateProfile));

export default router;
