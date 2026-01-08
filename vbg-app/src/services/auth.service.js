import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Users } from '../controllers/crud.controller.js';
import { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_OPTIONS } from '../config/constants.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/auth.js';

const router = Router();

// Service metadata
export const metadata = {
  name: 'Authentication Service',
  version: '1.0.0',
  routes: [
    'POST /api/login',
    'POST /api/register',
    'POST /api/logout',
    'POST /api/forgot-password'
  ]
};

// Login
router.post('/api/login', (req, res, next) => {
  console.log('🟢 LOGIN ROUTE HIT');
  next();
}, authLimiter, async (req, res) => {
  try {
    console.log('🔵 AUTH SERVICE LOGIN CALLED');
    const { email, password } = req.body;

    const user = await Users.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    console.log('👤 User found:', !!user);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      console.log('❌ Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    console.log('🍪 Setting cookie with options:', COOKIE_OPTIONS);
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    
    res.cookie('session_token', token, COOKIE_OPTIONS);
    
    const response = { 
      success: true,
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email },
      token: token
    };
    
    console.log('📤 Sending response:', JSON.stringify(response).substring(0, 100));
    res.json(response);
  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
router.post('/api/register', authLimiter, asyncHandler(async (req, res) => {
  const { name, email, password, company_name } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await Users.create({
    name,
    email,
    password: hashedPassword,
    company_name,
    is_verified: 0
  });

  res.status(201).json({ 
    message: 'Registration successful',
    userId: user.id 
  });
}));

// Logout
router.post('/api/logout', (req, res) => {
  res.clearCookie('session_token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
});

// Forgot password
router.post('/api/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await Users.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  
  if (!user) {
    // Don't reveal if user exists
    return res.json({ message: 'If email exists, reset link sent' });
  }

  // TODO: Send password reset email
  res.json({ message: 'Password reset email sent' });
}));

export default router;
