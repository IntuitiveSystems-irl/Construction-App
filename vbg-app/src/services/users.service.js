import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Users } from '../controllers/crud.controller.js';
import { authenticate, authenticateAdmin, asyncHandler } from '../middleware/auth.js';

const router = Router();

export const metadata = {
  name: 'Users Service',
  version: '1.0.0',
  routes: [
    'GET /api/profile',
    'PUT /api/profile',
    'GET /api/users (admin)',
    'DELETE /api/users/:id (admin)'
  ]
};

// Get current user profile
router.get('/api/profile', authenticate, asyncHandler(async (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ 
    success: true,
    user: userWithoutPassword 
  });
}));

// Update profile
router.put('/api/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, email, phone_number, password } = req.body;
  
  const updateData = { name, email, phone_number };
  
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await Users.update(req.user.id, updateData, req.user.id, false);
  res.json({ message: 'Profile updated successfully' });
}));

// Get all users (admin only)
router.get('/api/users', authenticateAdmin, asyncHandler(async (req, res) => {
  const users = await Users.getAll({}, null, true);
  
  // Remove passwords
  const usersWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
}));

// Delete user (admin only)
router.delete('/api/users/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const userId = req.params.id;
  
  // Don't allow deleting admin users
  const user = await Users.getById(userId, null, true);
  if (user && (user.is_admin || user.id === 15)) {
    return res.status(403).json({ error: 'Cannot delete admin users' });
  }

  await Users.delete(userId, null, true);
  res.json({ message: 'User deleted successfully' });
}));

export default router;
