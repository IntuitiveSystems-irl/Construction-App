import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { JWT_SECRET } from '../config/constants.js';

// Async wrapper for database queries
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Authentication middleware
export const authenticate = asyncHandler(async (req, res, next) => {
  // Check for token in cookie OR Authorization header
  const token = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    console.log('❌ No session token found in cookie or header');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Admin authentication middleware
export const authenticateAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies.session_token;

  if (!token) {
    console.log('❌ No session token found');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    // Check admin status with fallback for user ID 15
    const isAdmin = user.is_admin || user.id === 15;
    if (!isAdmin) {
      console.log('❌ User is not admin:', user.email, 'is_admin:', user.is_admin, 'id:', user.id);
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('✅ Admin authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export { asyncHandler };
