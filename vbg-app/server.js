import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
// Using better-sqlite3-multiple-ciphers for AES-256 SQLCipher encryption
import { createEncryptedDatabase } from './utils/encryptedDb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './utils/email.js';
import { sendAppointmentNotification, sendCustomerConfirmation } from './utils/resend.js';
import { generateSignedContractPDF } from './utils/contractPdfGenerator.js';
// SMS functionality removed - using email notifications only
import crypto from 'crypto';
// Twenty CRM removed - using VBG database as CRM
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize dotenv
dotenv.config();

// Database will be initialized after dotenv loads

// Initialize Express app
const app = express();

// Cookie configuration
const cookieOptions = {
  httpOnly: true, // Secure - no JavaScript access
  secure: true, // HTTPS only
  sameSite: 'lax', // Allow same-site cookies
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/'
  // No domain specified - will use the current domain (app.veribuilds.com)
};

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5002',
  'http://localhost:5003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:5002',
  'http://127.0.0.1:5003',
  'http://31.97.144.132:3000',         // frontend
  'http://31.97.144.132:3002',         // frontend port
  'http://31.97.144.132:4000',         // backend (for tools, internal)
  'http://31.97.144.132:5002',         // backend
  'http://31.97.144.132:5003',         // frontend
  'https://31.97.144.132:3000',        // HTTPS frontend
  'https://31.97.144.132:3002',        // HTTPS frontend port
  'https://31.97.144.132:4000',        // HTTPS backend
  'https://31.97.144.132:5002',        // HTTPS backend
  'https://31.97.144.132:5003',        // HTTPS frontend
  'https://localhost:5002',
  'https://localhost:5003',
  '*'                                  // Allow all origins as fallback
];

// Configure CORS with proper cookie handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Required for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Accept',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'Set-Cookie',
    'Content-Length',
    'Content-Range'
  ],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Additional CORS debugging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);
  
  // Manually set CORS headers as fallback
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma, Expires, X-Requested-With, Accept, X-CSRF-Token');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling preflight OPTIONS request');
    return res.status(200).end();
  }
  
  next();
});

// Security middleware with cross-origin resource policy for uploads
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
app.set('trust proxy', 1); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { 
    success: false,
    error: 'Too many requests, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for certain paths
    const skipPaths = ['/health-check', '/api/health'];
    return skipPaths.some(path => req.path.startsWith(path));
  }
});

// Apply rate limiting to all requests
app.use(limiter);

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const requestMethod = req.headers['access-control-request-method'];
  const requestHeaders = req.headers['access-control-request-headers'];
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', requestMethod || 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', requestHeaders || 'Content-Type, Authorization, Accept');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Date, X-Request-Id');
      return res.status(204).end();
    }
    return res.status(403).json({ error: 'Not allowed by CORS' });
  }
  
  // Handle regular requests
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Date, X-Request-Id');
  }
  
  next();
});

// Simple route handler wrapper to catch and log errors
const asyncHandler = fn => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error in', req.method, req.path, ':', err);
  console.error('❌ Stack trace:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    path: req.path,
    method: req.method
  });
});

// Database setup with SQLCipher AES-256 encryption
const dbPath = process.env.DB_FILENAME || path.join(__dirname, 'vbg_encrypted.db');
const dbEncryptionKey = process.env.DB_ENCRYPTION_KEY;

if (!dbEncryptionKey) {
  console.error('❌ FATAL: DB_ENCRYPTION_KEY not set in environment!');
  console.error('Database encryption key is required for security.');
  process.exit(1);
}

const db = createEncryptedDatabase(dbPath, dbEncryptionKey);

// Initialize/verify tables (database already migrated with all tables)
console.log('Verifying database tables...');
try {
  // Verify users table exists
  const userCount = db.get('SELECT COUNT(*) as count FROM users');
  console.log(`✅ Users table ready (${userCount?.count || 0} users)`);
  
  // Verify contracts table exists  
  const contractCount = db.get('SELECT COUNT(*) as count FROM contracts');
  console.log(`✅ Contracts table ready (${contractCount?.count || 0} contracts)`);
  
  // Verify other critical tables
  const tables = ['contract_templates', 'invoices', 'estimates', 'job_sites', 'notifications'];
  for (const table of tables) {
    try {
      db.get(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`✅ ${table} table ready`);
    } catch (e) {
      console.warn(`⚠️ ${table} table may need creation`);
    }
  }
  
  console.log('🔐 Database initialization complete - AES-256 encrypted');
} catch (dbErr) {
  console.error('❌ Database verification failed:', dbErr.message);
  // Don't exit - tables might be created on first use
}

// Legacy callback-style initialization removed - database is pre-migrated with all tables
// See migrate-to-encrypted.exp for the migration script that created the encrypted database

// Middleware
app.use(express.json());
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  if (req.path.includes('/api/admin/job-sites') && req.method === 'POST') {
    console.log(`📝 ${req.method} ${req.path} - Body:`, JSON.stringify(req.body));
  }
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint hit');
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

/* OLD DATABASE INITIALIZATION CODE REMOVED
   Database is pre-migrated to vbg_encrypted.db with all tables
   See migrate-to-encrypted.exp for migration script
   
   Original code created these tables:
   - users, password_reset_tokens, admin_users, contracts
   - contract_templates, invoices, receipts, estimates
   - job_sites, job_assignments, job_messages, job_site_uploads
   - job_site_comments, job_site_activity, notification_preferences
   - notifications, appointments, payments, services
   - service_bookings, service_booking_items, crm_emails
   - crm_notes, email_templates, documents
*/

// Verify email route
app.get('/api/verify-email', asyncHandler(async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_token`);
    }

    const cleanedToken = decodeURIComponent(token).trim().replace(/^['"]|['"]$/g, '');

    db.get('SELECT * FROM users WHERE verification_token = ?', [cleanedToken], (err, user) => {
      if (err || !user) {
        return res.status(400).json({ success: false, error: 'Invalid or expired token' });
      }

      if (user.is_verified) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=1&email=${encodeURIComponent(user.email)}`);
      }

      db.run('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [user.id], function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ success: false, error: 'Verification failed' });
        }

        const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', {
          expiresIn: '24h'
        });

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', jwtToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'lax' : 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          path: '/'
        });

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=1&email=${encodeURIComponent(user.email)}`);
      });
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
}));

/* NOTE: ~500 lines of old callback-style database initialization code was removed.
   The database is now pre-migrated with all tables using SQLCipher encryption.
   See migrate-to-encrypted.exp for the migration script.
   
   If you need to add new tables, use the synchronous db.run() method:
   db.run('CREATE TABLE IF NOT EXISTS new_table (...)');
*/

// Login route
app.post('/api/login', asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password.trim());
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );
    
    // Don't send password back to client
    const { password: _, ...userWithoutPassword } = user;
    
    // Set HTTP-only cookie with secure settings (using global cookieOptions)
    res.cookie('session_token', token, cookieOptions);
    
    console.log('Login successful, cookie set for IP access');
    
    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token: token // Include token for localStorage fallback
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
}));

// Logout route
app.post('/api/logout', (req, res) => {
  try {
    // Clear the session token cookie with same settings as login
    res.clearCookie('session_token', {
      httpOnly: true,
      secure: false, // Match login settings - false for IP access
      sameSite: 'lax', // Match login settings
      path: '/'
      // No domain specified to match login cookie settings
    });
    
    // Also try clearing with different variations to be thorough
    res.clearCookie('session_token', { path: '/' });
    res.clearCookie('session_token');
    
    console.log('User logged out successfully - cleared session_token cookie');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Server error during logout' });
  }
});

// Profile route
app.get('/api/profile', asyncHandler(async (req, res) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.session_token;
    
    // Fallback to Authorization header if cookie not present
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    // Get user from database
    db.get('SELECT id, name, email, is_verified, is_admin, created_at, phone_number, sms_notifications FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.is_verified,
          isAdmin: user.is_admin,
          createdAt: user.created_at,
          phone_number: user.phone_number,
          sms_notifications: user.sms_notifications
        }
      });
    });
  } catch (error) {
    console.error('Profile error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Update user profile
app.put('/api/profile/update', asyncHandler(async (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies.session_token;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    const { name, email, phone_number, password } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if email is already taken by another user
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already taken by another user' });
    }
    
    // Prepare update query
    let updateQuery = 'UPDATE users SET name = ?, email = ?, phone_number = ? WHERE id = ?';
    let updateParams = [name, email, phone_number || null, userId];
    
    // If password is provided, hash it and include in update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery = 'UPDATE users SET name = ?, email = ?, phone_number = ?, password = ? WHERE id = ?';
      updateParams = [name, email, phone_number || null, hashedPassword, userId];
    }
    
    // Update user in database
    await new Promise((resolve, reject) => {
      db.run(updateQuery, updateParams, function(err) {
        if (err) {
          console.error('Database error updating profile:', err);
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
    
    // Get updated user data
    const updatedUser = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, is_verified, is_admin, created_at, phone_number FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVerified: updatedUser.is_verified,
        isAdmin: updatedUser.is_admin,
        createdAt: updatedUser.created_at,
        phone_number: updatedUser.phone_number
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Token verification route (for middleware)
app.get('/api/verify-token', asyncHandler(async (req, res) => {
  try {
    // Get token from Authorization header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.session_token;
    
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    // Get user from database to ensure they still exist
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, is_verified, is_admin FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.is_verified,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, error: 'Token expired' });
    }
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
}));

// Registration route
app.post('/api/register', asyncHandler(async (req, res) => {
  try {
    console.log('Registration request received:', {
      body: { ...req.body, password: '[REDACTED]' },
      headers: req.headers,
    });

    const { name, email, password, user_type = 'subcontractor' } = req.body;
    
    // Validate user_type is either 'client' or 'subcontractor'
    if (user_type !== 'client' && user_type !== 'subcontractor') {
      return res.status(400).json({ error: 'User type must be either client or subcontractor' });
    }

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error during lookup:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        console.log('User already exists:', email);
        return res.status(400).json({ error: 'Email already registered' });
      }

      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const frontendUrl = process.env.FRONTEND_URL || 'http://31.97.144.132:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
        

        db.run(
          'INSERT INTO users (name, email, password, verification_token, is_verified, user_type, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
          [name, email, hashedPassword, verificationToken, 0, user_type],
          async function(err) {
            if (err) {
              console.error('Insert user error:', err);
              // Check for SQLITE_CONSTRAINT (unique constraint violation)
              if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: 'Email already registered' });
              }
              return res.status(500).json({ error: 'Error creating user' });
            }

            console.log('User registered:', email);
            
            const userId = this.lastID;

            // Send verification email
            try {
              await sendEmail({
                to: email,
                subject: 'Verify Your Email - Veritas Building Group',
                html: `
                  <h2>✉️ Welcome to Veritas Building Group!</h2>
                  <p>Hello ${name},</p>
                  <p>Thanks for registering! We're excited to have you on board.</p>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #333;">To get started, please verify your email address by clicking the button below:</p>
                  </div>
                  
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background: linear-gradient(to right, #14b8a6, #06b6d4); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Verify Email Address</a>
                  </p>
                  
                  <p style="color: #666; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p style="color: #14b8a6; font-size: 14px; word-break: break-all;">${verificationLink}</p>
                  
                  <p style="margin-top: 30px;">Best regards,<br>Veritas Building Group Team</p>
                `
              });
            } catch (emailError) {
              console.warn('Failed to send verification email:', emailError);
            }
            
            // User is automatically in CRM (users table in database)
            console.log(`[CRM] New user added to database: ${userId}`);
            
            return res.status(201).json({
              message: 'User registered successfully. Please check your email to verify your account.',
              userId: userId
            });
          }
        );
      } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Registration failed' });
      }
    });
  } catch (error) {
    console.error('Error in registration handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}));

// Forgot password route
app.post('/api/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Find user by email
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // If user exists, generate reset token and send email
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000);
      
      // Save token to database
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
          [user.id, token, expiresAt.toISOString()],
          (err) => {
            if (err) reject(err);
            else resolve(true);
          }
        );
      });

      // Send password reset email
      const frontendUrl = process.env.FRONTEND_URL || 'http://31.97.144.132:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - Veritas Building Group',
        html: `
          <h2>🔐 Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your Veritas Building Group account.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333;">Click the button below to reset your password. This link will expire in 1 hour.</p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(to right, #14b8a6, #06b6d4); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
          </p>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="color: #14b8a6; font-size: 14px; word-break: break-all;">${resetUrl}</p>
          
          <p style="color: #999; font-size: 13px; margin-top: 30px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p style="margin-top: 30px;">Best regards,<br>Veritas Building Group Team</p>
        `
      });
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account exists with this email, you will receive a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}));

// Verify reset token route
app.get('/api/verify-reset-token', asyncHandler(async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find token in database
    const tokenData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?',
        [token, new Date().toISOString()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
}));

// Reset password route
app.post('/api/reset-password', asyncHandler(async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find valid token
    const tokenData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?',
        [token, new Date().toISOString()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, tokenData.user_id],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });

    // Mark token as used
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
        [tokenData.id],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer upload
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  }),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and Word documents are allowed.'), false);
    }
  }
});

// Debug endpoint to check uploaded files
app.get('/api/debug/uploads', (req, res) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ 
      uploadsDir, 
      files: files.map(file => ({
        name: file,
        path: path.join(uploadsDir, file),
        exists: fs.existsSync(path.join(uploadsDir, file))
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(uploadsDir));

// Ensure documents table exists
db.run(`
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    description TEXT,
    document_type TEXT DEFAULT 'other',
    expires_at DATETIME,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    size INTEGER,
    mime_type TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating documents table:', err);
  } else {
    console.log('Documents table is ready');
    // Add new columns to existing table if they don't exist
    db.run('ALTER TABLE documents ADD COLUMN document_type TEXT DEFAULT "other"', () => {});
    db.run('ALTER TABLE documents ADD COLUMN expires_at DATETIME', () => {});
    db.run('ALTER TABLE documents ADD COLUMN size INTEGER', () => {});
    db.run('ALTER TABLE documents ADD COLUMN mime_type TEXT', () => {});
    db.run('ALTER TABLE documents ADD COLUMN status TEXT DEFAULT "pending"', () => {});
    db.run('ALTER TABLE documents ADD COLUMN admin_notes TEXT', () => {});
    db.run('ALTER TABLE documents ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP', () => {});
  }
});

// Helper function to create in-app notification (with duplicate check)
async function createNotification(userId, type, title, message) {
  // Check if a similar notification was already sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingNotification = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM notifications 
       WHERE user_id = ? 
       AND type = ? 
       AND title = ?
       AND datetime(created_at) >= datetime(?)
       LIMIT 1`,
      [userId, type, title, today.toISOString()],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
  
  // If notification already exists today, don't create a duplicate
  if (existingNotification) {
    console.log(`⏭️ Skipping duplicate notification for user ${userId}: ${title}`);
    return existingNotification.id;
  }
  
  // Create new notification
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notifications (user_id, type, title, message, read_status) VALUES (?, ?, ?, ?, 0)`,
      [userId, type, title, message],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

// Helper function to send document notification email
async function sendDocumentNotificationEmail(userEmail, userName, documentName, documentType, expiresAt) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const expiryText = expiresAt ? 
      `<p><strong>Expiration Date:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>` : 
      '';
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: userEmail,
      subject: `New Document Uploaded: ${documentName}`,
      html: `
        <h2>New Document Available</h2>
        <p>Hello ${userName},</p>
        <p>A new document has been uploaded to your account:</p>
        <p><strong>Document Name:</strong> ${documentName}</p>
        <p><strong>Document Type:</strong> ${documentType || 'General'}</p>
        ${expiryText}
        <p>Please log in to your dashboard to view this document.</p>
        <p>Best regards,<br>Veritas Building Group</p>
      `
    });
    console.log(`📧 Document notification email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending document notification email:', error);
  }
}

// Helper function to send expiry warning email
async function sendExpiryWarningEmail(userEmail, userName, documentName, expiresAt) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const daysUntilExpiry = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: userEmail,
      subject: `Document Expiring Soon: ${documentName}`,
      html: `
        <h2>Document Expiration Warning</h2>
        <p>Hello ${userName},</p>
        <p>Your document "<strong>${documentName}</strong>" will expire in <strong>${daysUntilExpiry} day(s)</strong>.</p>
        <p><strong>Expiration Date:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>
        <p>Please log in to your dashboard to update this document before it expires.</p>
        <p>Best regards,<br>Veritas Building Group</p>
      `
    });
    console.log(`📧 Expiry warning email sent to ${userEmail} for document: ${documentName}`);
  } catch (error) {
    console.error('Error sending expiry warning email:', error);
  }
}

// Upload document handler
const uploadDocumentHandler = async (req, res) => {
  const { name, description, document_type, expires_at } = req.body;
  const user_id = req.user?.id || req.body.user_id; // Get from auth or body (for admin uploads)
  
  if (!req.file || !user_id) {
    return res.status(400).json({ error: 'Missing file or user_id' });
  }

  // Parse expiration date if provided
  const expirationDate = expires_at ? new Date(expires_at).toISOString() : null;
  
  // Use provided name or description, fallback to original filename only if both are empty
  const documentName = (name && name.trim()) || (description && description.trim()) || req.file.originalname;

  db.run(
    `INSERT INTO documents (user_id, filename, original_name, description, document_type, expires_at, size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id, 
      req.file.filename, 
      req.file.originalname, 
      documentName, 
      document_type || 'other',
      expirationDate,
      req.file.size,
      req.file.mimetype
    ],
    async function (err) {
      if (err) {
        console.error('DB insert error:', err);
        return res.status(500).json({ error: 'Failed to save document' });
      }
      
      const documentId = this.lastID;
      
      // Get user info for notification
      db.get('SELECT name, email FROM users WHERE id = ?', [user_id], async (userErr, user) => {
        if (!userErr && user) {
          try {
            // Create in-app notification
            await createNotification(
              user_id,
              'document_uploaded',
              'New Document Uploaded',
              `${documentName} has been uploaded to your account.`
            );
            
            // Send email notification
            await sendDocumentNotificationEmail(
              user.email,
              user.name,
              documentName,
              document_type || 'General',
              expirationDate
            );
            
            console.log(`📄 Document uploaded and notifications sent for user ${user_id}`);
          } catch (notifError) {
            console.error('Error sending notifications:', notifError);
            // Don't fail the upload if notifications fail
          }
        }
      });
      
      res.status(201).json({ 
        success: true, 
        document: {
          id: documentId,
          user_id: parseInt(user_id),
          filename: req.file.filename,
          original_name: req.file.originalname,
          description: documentName,
          name: documentName,
          document_type: document_type || 'other',
          expires_at: expirationDate,
          size: req.file.size,
          mime_type: req.file.mimetype,
          uploaded_at: new Date().toISOString()
        }
      });
    }
  );
};

// Get documents for a user
app.get('/api/documents', (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  db.all("SELECT * FROM documents WHERE user_id = ? AND (status IS NULL OR status != 'deleted')", [userId], (err, rows) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch documents' });
    }
    console.log(`Fetching documents for user ${userId}, found ${rows.length} documents:`, rows.map(r => ({id: r.id, description: r.description, status: r.status})));
    res.status(200).json(rows);
  });
});

// Get a single document by ID
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch document' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json(row);
  });
});

// Download a document
app.get('/api/documents/:id/download', (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId], (err, doc) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch document' });
    }
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, 'uploads', doc.filename);
    res.download(filePath, doc.original_name, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  });
});

// Delete a document
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.query.user_id;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  db.get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId], (err, doc) => {
    if (err) {
      console.error('DB fetch error:', err);
      return res.status(500).json({ error: 'Failed to find document' });
    }
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, 'uploads', doc.filename);
    
    // Delete file from filesystem
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') { // Ignore if file doesn't exist
        console.error('File delete error:', err);
        return res.status(500).json({ error: 'Failed to delete file' });
      }
      
      // Delete from database
      db.run('DELETE FROM documents WHERE id = ? AND user_id = ?', [id, userId], function(err) {
        if (err) {
          console.error('DB delete error:', err);
          return res.status(500).json({ error: 'Failed to delete document' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }
        
        res.status(200).json({ success: true, message: 'Document deleted successfully' });
      });
    });
  });
});

// Get expiring documents for monitoring
app.get('/api/documents/expiring', (req, res) => {
  const userId = req.query.user_id;
  const days = parseInt(req.query.days) || 30; // Default to 30 days
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  db.all(
    `SELECT * FROM documents 
     WHERE user_id = ? 
     AND expires_at IS NOT NULL 
     AND expires_at <= ? 
     AND expires_at >= datetime('now')
     ORDER BY expires_at ASC`,
    [userId, futureDate.toISOString()],
    (err, rows) => {
      if (err) {
        console.error('DB fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch expiring documents' });
      }
      res.status(200).json(rows);
    }
  );
});

// Get expired documents
app.get('/api/documents/expired', (req, res) => {
  const userId = req.query.user_id;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id parameter' });
  }
  
  db.all(
    `SELECT * FROM documents 
     WHERE user_id = ? 
     AND expires_at IS NOT NULL 
     AND expires_at < datetime('now')
     ORDER BY expires_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('DB fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch expired documents' });
      }
      res.status(200).json(rows);
    }
  );
});

// Error handling middleware (must be last!)
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 5002;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Admin registration endpoint
// Admin registration endpoint removed - use regular registration and promote users to admin manually

// Get all admin users (admin only)
app.get('/api/admin-users', asyncHandler(async (req, res) => {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    // Check if user is admin
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Fetch all admin users with their details
    const adminUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.is_verified,
          u.created_at as user_created_at,
          au.admin_level,
          au.permissions,
          au.department,
          au.phone,
          au.emergency_contact,
          au.notes,
          au.last_login,
          au.created_at as admin_created_at,
          creator.name as created_by_name
        FROM users u
        LEFT JOIN admin_users au ON u.id = au.user_id
        LEFT JOIN users creator ON au.created_by = creator.id
        WHERE u.is_admin = 1
        ORDER BY u.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({ success: true, adminUsers });
    
  } catch (error) {
    console.error('Get admin users error:', error);
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Handle admin routes specifically
app.get('/admin*', (req, res) => {
  // Serve a basic HTML page that will load your admin React components
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veritas Building Group Admin</title>
      <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
    </head>
    <body>
      <div id="root">Loading admin panel...</div>
      <script type="text/babel">
        // Simple admin landing page component
        const AdminLanding = () => {
          return React.createElement('div', {
            className: 'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'
          }, 
            React.createElement('div', {
              className: 'text-center'
            }, [
              React.createElement('h1', {
                key: 'title',
                className: 'text-4xl font-bold text-gray-900 mb-4'
              }, 'Admin Panel'),
              React.createElement('p', {
                key: 'desc',
                className: 'text-xl text-gray-600 mb-8'
              }, 'Please use the Next.js development server on port 3000 for full admin functionality.'),
              React.createElement('a', {
                key: 'link',
                href: 'http://localhost:3000/admin',
                className: 'inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors'
              }, 'Go to Admin Panel')
            ])
          );
        };
        
        ReactDOM.render(React.createElement(AdminLanding), document.getElementById('root'));
      </script>
    </body>
    </html>
  `);
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  console.log('🔐 Admin auth check for:', req.method, req.path);
  try {
    const token = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    // Get user info including admin status
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, is_admin, is_verified FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
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
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Upload document endpoints (both paths for compatibility) - MUST come after authenticate is defined
app.post('/api/upload-document', authenticate, upload.single('file'), uploadDocumentHandler);
app.post('/api/documents/upload', authenticate, upload.single('file'), uploadDocumentHandler);

// Admin API endpoints
app.get('/api/admin/users', authenticateAdmin, asyncHandler(async (req, res) => {
  console.log('Admin users endpoint called');
  
  // Get users with their document counts and earliest expiration
  const users = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.is_verified, 
        u.is_admin, 
        u.created_at, 
        u.user_type,
        u.company_name,
        u.contact_name,
        u.phone,
        COUNT(d.id) as document_count,
        MIN(d.expires_at) as earliest_expiration
      FROM users u
      LEFT JOIN documents d ON u.id = d.user_id
      WHERE u.is_admin = 0
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('Database error in admin users query:', err);
        reject(err);
      } else {
        console.log('Admin users query result:', rows);
        console.log('Document counts per user:', rows.map(r => ({ name: r.name, document_count: r.document_count })));
        resolve(rows);
      }
    });
  });

  // Transform the data to match the frontend interface
  const transformedUsers = await Promise.all(users.map(async user => {
    // Determine user status based on verification and document expiration
    let status = 'Active';
    if (!user.is_verified) {
      status = 'Pending';
    } else if (user.earliest_expiration && new Date(user.earliest_expiration) < new Date()) {
      status = 'Expired';
    }
    
    // Get actual documents for this user
    const documents = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, original_name, document_type, expires_at, status, uploaded_at
        FROM documents 
        WHERE user_id = ?
        ORDER BY uploaded_at DESC
      `, [user.id], (err, docs) => {
        if (err) {
          console.error('Error fetching user documents:', err);
          resolve([]);
        } else {
          resolve(docs || []);
        }
      });
    });
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company_name || user.name,
      company_name: user.company_name,
      contact: user.contact_name || user.name,
      contact_name: user.contact_name,
      phone: user.phone,
      status,
      documents: documents.map(doc => ({
        type: doc.document_type,
        status: doc.status || 'pending',
        expiry: doc.expires_at
      })),
      document_count: user.document_count || 0,
      earliestExpiration: user.earliest_expiration ? new Date(user.earliest_expiration).toLocaleDateString() : null,
      submitted: new Date(user.created_at).toLocaleDateString(),
      is_verified: user.is_verified,
      is_admin: user.is_admin,
      user_type: user.user_type || 'subcontractor'
    };
  }));

  console.log('Final transformed users with document counts:', transformedUsers.map(u => ({ 
    name: u.name, 
    document_count: u.document_count, 
    documents_length: u.documents?.length 
  })));

  res.json(transformedUsers);
}));

// Admin user actions
app.post('/api/admin/users/:userId/:action', authenticateAdmin, asyncHandler(async (req, res) => {

  const { userId, action } = req.params;
  
  switch (action) {
    case 'approve':
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET is_verified = 1 WHERE id = ?', [userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({ message: 'User approved successfully' });
      break;
      
    case 'deny':
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET is_verified = 0 WHERE id = ?', [userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({ message: 'User denied successfully' });
      break;
      
    case 'delete':
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM users WHERE id = ? AND is_admin = 0', [userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      res.json({ message: 'User deleted successfully' });
      break;
      
    default:
      res.status(400).json({ error: 'Invalid action' });
  }
}));

// Admin endpoint to get clients (simplified for dropdowns)
app.get('/api/admin/clients', authenticateAdmin, asyncHandler(async (req, res) => {
  const clients = await new Promise((resolve, reject) => {
    db.all(`
      SELECT id, name, email, company_name, user_type
      FROM users
      WHERE is_admin = 0
      ORDER BY name ASC
    `, (err, rows) => {
      if (err) {
        console.error('Database error fetching clients:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(clients);
}));

// Admin endpoint to get individual user details with documents
app.get('/api/admin/users/:userId', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Get user details
  const user = await new Promise((resolve, reject) => {
    db.get(`
      SELECT u.id, u.name, u.email, u.company_name, u.contact_name, u.phone,
             u.is_verified, u.is_admin, u.created_at
      FROM users u
      WHERE u.id = ? AND u.is_admin = 0
    `, [userId], (err, row) => {
      if (err) {
        console.error('Database error in user details query:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Get user's documents
  const documents = await new Promise((resolve, reject) => {
    db.all(`
      SELECT d.id, d.filename, d.original_name, d.description, d.document_type, 
             d.uploaded_at, d.expires_at, d.status, d.admin_notes
      FROM documents d
      WHERE d.user_id = ?
      ORDER BY d.uploaded_at DESC
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Database error in user documents query:', err);
        reject(err);
      } else {
        console.log('DEBUG: Raw document data from DB for user', userId, ':', rows?.map(r => ({
          id: r.id,
          original_name: r.original_name,
          description: r.description,
          document_type: r.document_type
        })));
        resolve(rows || []);
      }
    });
  });
  
  // Get user's contracts
  const contracts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT c.id, c.project_name, c.project_description,
             c.total_amount, c.start_date, c.end_date, c.status,
             c.user_comments, c.created_at, c.updated_at, c.payment_terms, c.scope
      FROM contracts c
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Database error in user contracts query:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  // Transform user data
  const userDetails = {
    id: user.id,
    name: user.name,
    email: user.email,
    company_name: user.company_name || 'Not provided',
    contact_name: user.contact_name || user.name,
    phone: user.phone || 'Not provided',
    status: user.is_verified ? 'active' : 'pending',
    is_verified: user.is_verified,
    created_at: user.created_at,
    documents: documents.map(doc => ({
      id: doc.id,
      document_name: doc.description || doc.original_name,
      document_type: doc.document_type,
      document_url: doc.filename,
      uploaded_at: doc.uploaded_at,
      expires_at: doc.expires_at,
      status: doc.status || 'pending',
      admin_notes: doc.admin_notes
    })),
    contracts: contracts.map(contract => ({
      id: contract.id,
      contract_id: contract.contract_id,
      project_name: contract.project_name,
      project_description: contract.project_description,
      contract_amount: contract.contract_amount,
      start_date: contract.start_date,
      end_date: contract.end_date,
      status: contract.status,
      user_comments: contract.user_comments,
      created_at: contract.created_at,
      updated_at: contract.updated_at
    }))
  };
  
  res.json(userDetails);
}));

// Admin endpoint to get user contracts
app.get('/api/admin/users/:userId/contracts', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  console.log('Fetching contracts for user:', userId);
  
  // Get user contracts
  const contracts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM contracts c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Database error fetching user contracts:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json({ contracts });
}));

// Admin endpoint to update user details
app.put('/api/admin/users/:userId', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, email, company_name, contact_name, phone, is_verified } = req.body;
  
  console.log('=== UPDATE USER REQUEST ===');
  console.log('User ID:', userId, 'Type:', typeof userId);
  console.log('Request body:', req.body);
  console.log('Admin user:', req.user.id);
  
  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // Check if email is already taken by another user
  const existingUser = await new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (existingUser) {
    return res.status(400).json({ error: 'Email is already taken by another user' });
  }
  
  // First check if user exists
  const userExists = await new Promise((resolve, reject) => {
    db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) {
        console.error('Error checking user existence:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!userExists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Update user details (without updated_at if column doesn't exist)
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE users 
      SET name = ?, email = ?, company_name = ?, contact_name = ?, phone = ?, is_verified = ?
      WHERE id = ?
    `, [name, email, company_name || null, contact_name || null, phone || null, is_verified ? 1 : 0, userId], (err) => {
      if (err) {
        console.error('Database error updating user:', err);
        console.error('Error details:', {
          code: err.code,
          message: err.message,
          userId,
          updateData: { name, email, company_name, contact_name, phone, is_verified }
        });
        reject(err);
      } else {
        console.log(`User ${userId} updated successfully`);
        resolve();
      }
    });
  });
  
  console.log(`User ${userId} updated successfully by admin ${req.user.id}`);
  
  // Sync updated user to Twenty CRM (non-blocking)
  const updatedUser = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  // User is automatically updated in CRM (users table in database)
  console.log(`[CRM] User ${userId} updated in database`);
  
  res.json({ message: 'User updated successfully' });
}));

// Admin endpoint to delete user
app.delete('/api/admin/users/:userId', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  console.log('Deleting user:', userId);
  
  try {
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting admin users (safety check)
    if (user.is_admin) {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }
    
    // Delete user's related data - use try/catch for each to continue even if table doesn't exist
    // Order matters for foreign key constraints
    const tablesToClean = [
      { table: 'receipts', column: 'user_id' },
      { table: 'documents', column: 'user_id' },
      { table: 'contracts', column: 'user_id' },
      { table: 'estimates', column: 'user_id' },
      { table: 'invoices', column: 'user_id' },
      { table: 'notifications', column: 'user_id' },
      { table: 'job_assignments', column: 'user_id' },
      { table: 'job_site_uploads', column: 'user_id' },
      { table: 'job_site_comments', column: 'user_id' },
      { table: 'job_site_activity', column: 'user_id' },
      { table: 'job_messages', column: 'user_id' },
      { table: 'password_reset_tokens', column: 'user_id' },
      { table: 'notification_preferences', column: 'user_id' },
      { table: 'appointments', column: 'user_id' },
      { table: 'service_bookings', column: 'user_id' },
      { table: 'payments', column: 'user_id' }
    ];
    
    for (const { table, column } of tablesToClean) {
      try {
        await new Promise((resolve) => {
          db.run(`DELETE FROM ${table} WHERE ${column} = ?`, [userId], (err) => {
            if (err) console.warn(`Warning cleaning ${table}:`, err.message);
            resolve();
          });
        });
      } catch (e) {
        console.warn(`Skipped ${table}:`, e.message);
      }
    }
    
    // Also clean up job_sites where client_id = userId
    try {
      await new Promise((resolve) => {
        db.run('UPDATE job_sites SET client_id = NULL WHERE client_id = ?', [userId], (err) => {
          if (err) console.warn('Warning updating job_sites:', err.message);
          resolve();
        });
      });
    } catch (e) {
      console.warn('Skipped job_sites update:', e.message);
    }
    
    // Finally delete the user
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) {
          console.error('Database error deleting user:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    console.log(`User ${userId} deleted successfully by admin ${req.user.id}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
}));

// Admin endpoint to update document status
app.post('/api/admin/documents/:documentId/:action', authenticateAdmin, asyncHandler(async (req, res) => {
  const { documentId, action } = req.params;
  const { admin_notes } = req.body;
  
  console.log(`Document action request: documentId=${documentId}, action=${action}, admin_notes=${admin_notes}`);
  
  if (!['approve', 'reject', 'archive'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'archived';
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE documents 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, admin_notes || null, documentId], (err) => {
      if (err) {
        console.error('Database error updating document status:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ message: `Document ${action}d successfully` });
}));

// Admin endpoint to download/view contract
app.get('/api/admin/contracts/:contractId/download', authenticateAdmin, asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  
  // Get contract details
  const contract = await new Promise((resolve, reject) => {
    db.get(`
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM contracts c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [contractId], (err, row) => {
      if (err) {
        console.error('Database error fetching contract:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  // Generate contract content (you can customize this template)
  const contractContent = `
    CONTRACT AGREEMENT
    
    Contract ID: ${contract.contract_id}
    Date: ${new Date(contract.created_at).toLocaleDateString()}
    
    CONTRACTOR INFORMATION:
    Name: ${contract.user_name}
    Email: ${contract.user_email}
    
    PROJECT DETAILS:
    Project Name: ${contract.project_name}
    Description: ${contract.project_description}
    Contract Amount: $${contract.contract_amount}
    Start Date: ${contract.start_date}
    End Date: ${contract.end_date}
    
    STATUS: ${contract.status.toUpperCase()}
    ${contract.user_comments ? `\nUser Comments: ${contract.user_comments}` : ''}
    
    This contract was generated on ${new Date(contract.created_at).toLocaleString()}
  `;
  
  // Set headers for download
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="contract-${contract.contract_id}.txt"`);
  res.send(contractContent);
}));

// Contract management endpoints
app.post('/api/admin/contracts', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId, contractData, contractContent } = req.body;
  
  if (!userId || !contractData || !contractContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate unique contract ID
  const contractId = 'CONTRACT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  // Save contract to database
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO contracts (
        id, user_id, admin_id, project_name, project_description, 
        start_date, end_date, total_amount, payment_terms, scope, 
        contract_content, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `, [
      contractId,
      userId,
      req.user.id,
      contractData.projectName,
      contractData.projectDescription,
      contractData.startDate,
      contractData.endDate,
      contractData.totalAmount,
      contractData.paymentTerms,
      contractData.scope,
      contractContent
    ], (err) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // Get user info
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  // Create in-app notification for user
  try {
    await createNotification(
      userId,
      'contract_generated',
      'New Contract Generated',
      `A new contract for ${contractData.projectName} has been generated and is ready for your review.`
    );
  } catch (notifError) {
    console.error('Error creating notification:', notifError);
  }

  // Send email notification to user
  try {
    const emailSent = await sendContractEmail(contractData.contractorEmail, contractData.contractorName, contractId, contractContent);
    
    // Also send Resend email with better formatting
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: user.email,
      subject: `New Contract Ready for Review: ${contractData.projectName}`,
      html: `
        <h2>New Contract Generated</h2>
        <p>Hello ${user.name},</p>
        <p>A new contract has been generated for your review:</p>
        <p><strong>Contract ID:</strong> ${contractId}</p>
        <p><strong>Project:</strong> ${contractData.projectName}</p>
        <p><strong>Amount:</strong> $${parseFloat(contractData.totalAmount).toLocaleString()}</p>
        <p><strong>Start Date:</strong> ${new Date(contractData.startDate).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(contractData.endDate).toLocaleDateString()}</p>
        <p>Please log in to your dashboard to review and sign this contract.</p>
        <p>Best regards,<br>Veritas Building Group</p>
      `
    });
    
    if (emailSent) {
      res.json({ 
        success: true, 
        contractId, 
        message: 'Contract generated, saved, and email sent successfully' 
      });
    } else {
      res.json({ 
        success: true, 
        contractId, 
        message: 'Contract generated and saved, but email notification failed' 
      });
    }
  } catch (emailError) {
    console.error('Email error:', emailError);
    res.json({ 
      success: true, 
      contractId, 
      message: 'Contract generated and saved, but email notification failed' 
    });
  }
}));

// Get user balance and account info
app.get('/api/user/balance', authenticate, asyncHandler(async (req, res) => {
  // For now, return mock data. In production, this would query actual financial data
  const balance = 0; // Default balance
  const accountNumber = `XXXX-${req.user.id.toString().padStart(3, '0')}-${Math.floor(Math.random() * 10)}`;
  
  res.json({
    balance,
    accountNumber
  });
}));

// Get user recent activities
app.get('/api/user/recent-activities', authenticate, asyncHandler(async (req, res) => {
  const activities = [];
  
  // Fetch recent contracts
  const contracts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT id, project_name, status, created_at 
      FROM contracts 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [req.user.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  contracts.forEach(contract => {
    activities.push({
      id: `contract-${contract.id}`,
      title: contract.project_name,
      description: `Contract ${contract.status}`,
      date: new Date(contract.created_at).toLocaleDateString(),
      type: 'contract'
    });
  });
  
  // Fetch recent documents
  const documents = await new Promise((resolve, reject) => {
    db.all(`
      SELECT id, name, status, uploaded_at 
      FROM documents 
      WHERE user_id = ? 
      ORDER BY uploaded_at DESC 
      LIMIT 5
    `, [req.user.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  documents.forEach(doc => {
    activities.push({
      id: `document-${doc.id}`,
      title: doc.name,
      description: `Document ${doc.status}`,
      date: new Date(doc.uploaded_at).toLocaleDateString(),
      type: 'document'
    });
  });
  
  // Sort by date and limit to 10
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  res.json(activities.slice(0, 10));
}));

// Get user contracts
app.get('/api/user/contracts', authenticate, asyncHandler(async (req, res) => {
  const contracts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT c.*, u.name as admin_name 
      FROM contracts c 
      LEFT JOIN users u ON c.admin_id = u.id 
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC
    `, [req.user.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  res.json(contracts);
}));

// Get all contracts (admin only)
app.get('/api/admin/contracts', authenticateAdmin, asyncHandler(async (req, res) => {
  const contracts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT c.*, u.name as admin_name, client.name as user_name, client.email as user_email
      FROM contracts c 
      LEFT JOIN users u ON c.admin_id = u.id 
      LEFT JOIN users client ON c.user_id = client.id
      ORDER BY c.created_at DESC
    `, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  res.json(contracts);
}));

// Update contract status (user approval/rejection)
app.post('/api/user/contracts/:contractId/:action', authenticate, asyncHandler(async (req, res) => {
  const { contractId, action } = req.params;
  const { comments, signature } = req.body;
  
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  const status = action === 'approve' ? 'approved' : 'rejected';
  
  // Get contract info for notifications
  const contract = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contracts WHERE id = ? AND user_id = ?', [contractId, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  // Handle signature data for approvals
  if (action === 'approve' && signature) {
    // Update with signature data
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE contracts 
        SET status = ?, user_comments = ?, signature_data = ?, signature_status = 'signed', signed_at = datetime('now'), updated_at = datetime('now') 
        WHERE id = ? AND user_id = ?
      `, [status, comments || null, signature, contractId, req.user.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Notify all admins about the signed contract
    const admins = await new Promise((resolve, reject) => {
      db.all('SELECT id, name, email FROM users WHERE is_admin = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    for (const admin of admins) {
      try {
        await createNotification(
          admin.id,
          'contract_signed',
          'Contract Signed',
          `${req.user.name} has signed contract ${contractId} for ${contract.project_name}`
        );
        
        // Send email to admin
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
          to: admin.email,
          subject: `Contract Signed: ${contract.project_name}`,
          html: `
            <h2>Contract Signed</h2>
            <p>Hello ${admin.name},</p>
            <p>${req.user.name} has signed a contract:</p>
            <p><strong>Contract ID:</strong> ${contractId}</p>
            <p><strong>Project:</strong> ${contract.project_name}</p>
            <p><strong>Amount:</strong> $${parseFloat(contract.total_amount).toLocaleString()}</p>
            <p><strong>Signed At:</strong> ${new Date().toLocaleString()}</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
            <p>The contract is now waiting for your signature to be fully executed.</p>
            <p>Best regards,<br>VBG System</p>
          `
        });
      } catch (notifError) {
        console.error('Error sending admin notification:', notifError);
      }
    }
    
    console.log(`Contract ${contractId} approved and signed by user ${req.user.id}`);
    res.json({ message: 'Contract approved and signed successfully' });
  } else {
    // Regular approval/rejection without signature
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE contracts 
        SET status = ?, user_comments = ?, updated_at = datetime('now') 
        WHERE id = ? AND user_id = ?
      `, [status, comments || null, contractId, req.user.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({ message: `Contract ${action}d successfully` });
  }
}));

// DELETE /api/user/contracts/:contractId - Delete contract (user)
app.delete('/api/user/contracts/:contractId', authenticate, asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  
  // Check if contract exists and belongs to the user
  const contract = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contracts WHERE id = ? AND user_id = ?', [contractId, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found or access denied' });
  }
  
  // Only allow deletion of pending contracts
  if (contract.status !== 'pending') {
    return res.status(400).json({ error: 'Only pending contracts can be deleted' });
  }
  
  // Delete the contract
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM contracts WHERE id = ? AND user_id = ?', [contractId, req.user.id], function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
  
  console.log(`Contract ${contractId} deleted by user ${req.user.id}`);
  res.json({ message: 'Contract deleted successfully' });
}));

// Email function for contract notifications
async function sendContractEmail(email, name, contractId, contractContent) {
  try {
    const emailContent = `
Dear ${name},

A new contract has been generated for your review and approval.

Contract ID: ${contractId}

Please log into your dashboard to review the contract details and provide your approval or feedback.

Login at: ${process.env.FRONTEND_URL || 'http://localhost:3003'}/login

Contract Preview:
${contractContent.substring(0, 500)}...

Best regards,
Business Intuitive Team
    `;
    
    // Use the existing email utility if available
    if (typeof sendEmail === 'function') {
      return await sendEmail(email, 'New Contract for Review', emailContent);
    } else {
      console.log('Email would be sent to:', email);
      console.log('Subject: New Contract for Review');
      console.log('Content:', emailContent);
      return true; // Simulate successful email
    }
  } catch (error) {
    console.error('Error sending contract email:', error);
    return false;
  }
}

// Admin endpoint to get contract status updates
app.get('/api/admin/contract-notifications', authenticateAdmin, asyncHandler(async (req, res) => {
  const notifications = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        c.id,
        c.project_name,
        c.status,
        c.user_comments,
        c.updated_at,
        u.name as user_name,
        u.email as user_email
      FROM contracts c
      JOIN users u ON c.user_id = u.id
      WHERE c.status IN ('approved', 'rejected')
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT 10
    `, [], (err, rows) => {
      if (err) {
        console.error('Error fetching contract notifications:', err);
        resolve([]);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(notifications);
}));

// GET /api/admin/contracts/:id - Get single contract details for admin
app.get('/api/admin/contracts/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const contractId = req.params.id;
  console.log('Fetching contract details for admin:', contractId);
  
  const contract = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM contracts c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [contractId], (err, row) => {
      if (err) {
        console.error('Error fetching contract details:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  res.json(contract);
}));

// PUT /api/admin/contracts/:id/sign - Admin sign contract
app.put('/api/admin/contracts/:id/sign', authenticateAdmin, asyncHandler(async (req, res) => {
  const contractId = req.params.id;
  const { signature } = req.body;
  
  if (!signature) {
    return res.status(400).json({ error: 'Signature data is required' });
  }
  
  console.log('Admin signing contract:', contractId);
  
  // Check if contract exists
  const contract = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contracts WHERE id = ?', [contractId], (err, row) => {
      if (err) {
        console.error('Error checking contract existence:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  // Update contract with admin signature
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE contracts 
      SET admin_signature_data = ?, admin_signature_status = 'signed', admin_signed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `, [signature, contractId], (err) => {
      if (err) {
        console.error('Error saving admin signature:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  // Get user info for notification
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [contract.user_id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  // Notify user that contract is fully executed
  try {
    await createNotification(
      contract.user_id,
      'contract_fully_signed',
      'Contract Fully Executed',
      `Your contract for ${contract.project_name} has been fully signed and is now active.`
    );
    
    // Send email to user
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: user.email,
      subject: `Contract Fully Executed: ${contract.project_name}`,
      html: `
        <h2>Contract Fully Executed</h2>
        <p>Hello ${user.name},</p>
        <p>Great news! Your contract has been fully signed and is now active:</p>
        <p><strong>Contract ID:</strong> ${contractId}</p>
        <p><strong>Project:</strong> ${contract.project_name}</p>
        <p><strong>Amount:</strong> $${parseFloat(contract.total_amount).toLocaleString()}</p>
        <p><strong>Start Date:</strong> ${new Date(contract.start_date).toLocaleDateString()}</p>
        <p><strong>End Date:</strong> ${new Date(contract.end_date).toLocaleDateString()}</p>
        <p>Both parties have signed the contract. You can download a copy from your dashboard.</p>
        <p>Best regards,<br>Veritas Building Group</p>
      `
    });
  } catch (notifError) {
    console.error('Error sending user notification:', notifError);
  }
  
  console.log(`Contract ${contractId} signed by admin ${req.user.id}`);
  res.json({ 
    success: true, 
    message: 'Contract signed successfully by admin',
    contractId: contractId
  });
}));

// DELETE /api/admin/contracts/:id - Delete contract (admin only)
app.delete('/api/admin/contracts/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const contractId = req.params.id;
  console.log('Admin deleting contract:', contractId);
  
  // First check if contract exists
  const contract = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contracts WHERE id = ?', [contractId], (err, row) => {
      if (err) {
        console.error('Error checking contract existence:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  // Delete the contract
  const result = await new Promise((resolve, reject) => {
    db.run('DELETE FROM contracts WHERE id = ?', [contractId], function(err) {
      if (err) {
        console.error('Error deleting contract:', err);
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
  
  if (result === 0) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  console.log('Contract deleted successfully:', contractId);
  res.json({ 
    success: true, 
    message: 'Contract deleted successfully',
    contractId: contractId
  });
}));

// GET /api/contracts/:id/pdf - Download signed contract PDF
app.get('/api/contracts/:id/pdf', authenticate, asyncHandler(async (req, res) => {
  const contractId = req.params.id;
  console.log('Downloading contract PDF:', contractId);
  
  const contract = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM contracts c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [contractId], (err, row) => {
      if (err) {
        console.error('Error fetching contract for PDF:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  // Check if user has permission to view this contract
  const isAdmin = req.user.isAdmin || req.user.is_admin;
  const isOwner = req.user.id === contract.user_id;
  
  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    console.log('Generating text contract for:', contractId);
    
    // Generate contract content as text
    const contractContent = `
VERITAS BUILDING GROUP LLC
CONTRACT AGREEMENT

${'='.repeat(60)}

Contract ID: ${contract.id}
Date: ${new Date(contract.created_at).toLocaleDateString()}

CLIENT INFORMATION:
Name: ${contract.user_name}
Email: ${contract.user_email}

PROJECT DETAILS:
Project Name: ${contract.project_name}
Description: ${contract.project_description || 'N/A'}
Start Date: ${contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}
End Date: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'N/A'}
Total Amount: $${contract.total_amount || 'N/A'}
Payment Terms: ${contract.payment_terms || 'N/A'}

SCOPE OF WORK:
${contract.scope || 'N/A'}

CONTRACT STATUS: ${contract.status.toUpperCase()}
${contract.signature_status === 'signed' ? `\nDIGITALLY SIGNED: ${new Date(contract.signed_at).toLocaleString()}` : ''}
${contract.user_comments ? `\nCLIENT COMMENTS: ${contract.user_comments}` : ''}

${'='.repeat(60)}

CONTRACT CONTENT:
${contract.contract_content || 'No contract content available'}

${'='.repeat(60)}

This contract was generated on ${new Date().toLocaleString()}
Veritas Building Group LLC
522 W Riverside Ave STE N, Spokane, WA 99201
    `;
    
    // Set headers for text download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${contractId}.txt"`);
    res.setHeader('Content-Length', Buffer.byteLength(contractContent, 'utf8'));
    
    // Send text content
    res.send(contractContent);
    console.log('Contract text sent successfully');
  } catch (error) {
    console.error('Error generating contract text:', error);
    res.status(500).json({ error: 'Failed to generate contract', details: error.message });
  }
}));

// Contract Templates API Endpoints
// GET /api/admin/contract-templates - Fetch all templates
app.get('/api/admin/contract-templates', authenticateAdmin, asyncHandler(async (req, res) => {
  console.log('Fetching contract templates');
  
  const templates = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        ct.id,
        ct.name,
        ct.category,
        ct.description,
        ct.file_path,
        ct.original_filename,
        ct.mime_type,
        ct.file_size,
        ct.template_content as content,
        ct.template_content,
        ct.created_by,
        ct.created_at,
        ct.updated_at,
        u.name as created_by_name
      FROM contract_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      ORDER BY ct.created_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('Error fetching templates:', err);
        // If table doesn't exist, return empty array instead of error
        if (err.message && err.message.includes('no such table')) {
          console.log('contract_templates table does not exist, returning empty array');
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json({ templates });
}));

// POST /api/admin/contract-templates - Create new template
app.post('/api/admin/contract-templates', authenticateAdmin, asyncHandler(async (req, res) => {
  const { name, category, description, content } = req.body;
  
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }
  
  console.log('Creating contract template:', { name, category });
  
  const templateId = uuidv4();
  
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO contract_templates (
        id, name, category, description, template_content, 
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      templateId,
      name,
      category || 'general',
      description || null,
      content,
      req.user.id
    ], function(err) {
      if (err) {
        console.error('Error creating template:', err);
        reject(err);
      } else {
        console.log('Template created with ID:', templateId);
        resolve(this.lastID);
      }
    });
  });
  
  res.json({ 
    message: 'Template created successfully', 
    templateId 
  });
}));

// DELETE /api/admin/contract-templates/:id - Delete template
app.delete('/api/admin/contract-templates/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  console.log('Deleting contract template:', id);
  
  const result = await new Promise((resolve, reject) => {
    db.run('DELETE FROM contract_templates WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting template:', err);
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
  
  if (result === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.json({ message: 'Template deleted successfully' });
}));

// PUT /api/admin/contract-templates/:id - Update template
app.put('/api/admin/contract-templates/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, description, content } = req.body;
  
  console.log('Updating contract template:', id);
  
  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content are required' });
  }
  
  const result = await new Promise((resolve, reject) => {
    db.run(`
      UPDATE contract_templates 
      SET name = ?, category = ?, description = ?, template_content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, category || 'general', description || '', content, id], function(err) {
      if (err) {
        console.error('Error updating template:', err);
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
  
  if (result === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.json({ message: 'Template updated successfully' });
}));

// GET /api/contract-templates/:id/file - View template file (if has file_path)
app.get('/api/contract-templates/:id/file', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const template = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contract_templates WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  if (!template.file_path) {
    return res.status(400).json({ error: 'Template has no file attached' });
  }
  
  const filePath = path.join(__dirname, 'uploads', template.file_path);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Template file not found' });
  }
  
  res.setHeader('Content-Type', template.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${template.original_filename || 'template'}"`);  
  res.sendFile(filePath);
}));

// GET /api/admin/contract-templates/:id - Get single template
app.get('/api/admin/contract-templates/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const template = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        ct.*,
        u.name as created_by_name
      FROM contract_templates ct
      LEFT JOIN users u ON ct.created_by = u.id
      WHERE ct.id = ?
    `, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }
  
  res.json(template);
}));

// ===== GUEST CONTRACT SIGNING API =====

// POST /api/admin/contracts/create-and-send-guest - Create contract and send to guest in one step
app.post('/api/admin/contracts/create-and-send-guest', authenticateAdmin, asyncHandler(async (req, res) => {
  const { 
    guestName, 
    guestEmail, 
    projectName, 
    projectDescription, 
    totalAmount, 
    startDate, 
    endDate, 
    paymentTerms, 
    scope, 
    contractContent,
    adminSignature 
  } = req.body;
  
  // Validate required fields
  if (!guestEmail || !guestName || !projectName || !totalAmount || !contractContent) {
    return res.status(400).json({ 
      error: 'Missing required fields: guestName, guestEmail, projectName, totalAmount, and contractContent are required' 
    });
  }
  
  console.log(`Creating and sending contract to guest: ${guestEmail}`);
  
  // Generate unique contract ID and guest token
  const contractId = uuidv4();
  const guestToken = uuidv4();
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30); // 30 days expiration
  
  try {
    // Create the contract with guest signing info
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO contracts (
          id, user_id, admin_id, project_name, project_description, 
          start_date, end_date, total_amount, payment_terms, scope, 
          contract_content, status, guest_token, guest_email, guest_name, 
          token_expires_at, admin_signature, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          contractId,
          0, // user_id = 0 for guest contracts
          req.user.id, // admin who created it
          projectName,
          projectDescription || '',
          startDate || '',
          endDate || '',
          totalAmount,
          paymentTerms || '',
          scope || '',
          contractContent,
          'pending',
          guestToken,
          guestEmail.toLowerCase(),
          guestName,
          tokenExpiresAt.toISOString(),
          adminSignature || null
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Send email with signing link
    const signingUrl = `https://app.veribuilds.com/guest-sign/${guestToken}`;
    
    const emailSubject = 'Contract Ready for Your Signature - Veritas Building Group';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #14b8a6, #06b6d4); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Contract Ready for Signature</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #333;">Hello ${guestName},</p>
          
          <p style="font-size: 16px; color: #333;">You have received a contract from <strong>Veritas Building Group</strong> that requires your signature.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #14b8a6;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Contract Details</h3>
            <table style="width: 100%; font-size: 14px; color: #555;">
              <tr><td style="padding: 5px 0;"><strong>Project:</strong></td><td>${projectName}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Amount:</strong></td><td>$${parseFloat(totalAmount).toLocaleString()}</td></tr>
              ${startDate ? `<tr><td style="padding: 5px 0;"><strong>Start Date:</strong></td><td>${new Date(startDate).toLocaleDateString()}</td></tr>` : ''}
              ${endDate ? `<tr><td style="padding: 5px 0;"><strong>End Date:</strong></td><td>${new Date(endDate).toLocaleDateString()}</td></tr>` : ''}
            </table>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background: linear-gradient(to right, #14b8a6, #06b6d4); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">Review & Sign Contract</a>
          </p>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>This link expires on ${tokenExpiresAt.toLocaleDateString()}</strong>
            </p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px;"><strong>No account required!</strong></p>
            <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 14px;">
              <li>Simply click the button above to review the contract</li>
              <li>Add your digital signature</li>
              <li>Receive a copy of the fully executed contract</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #14b8a6; font-size: 13px; word-break: break-all;">${signingUrl}</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            Questions? Contact us at:<br>
            Email: <a href="mailto:info@veribuilds.com" style="color: #14b8a6;">info@veribuilds.com</a><br>
            Phone: (360) 229-5524
          </p>
          
          <p style="margin-top: 25px; color: #333;">Best regards,<br><strong>Veritas Building Group</strong></p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message from Veritas Building Group.</p>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: guestEmail,
      subject: emailSubject,
      html: emailHtml
    });
    
    console.log(`✅ Contract created and sent to guest: ${guestEmail}`);
    
    res.json({
      success: true,
      message: 'Contract created and sent to guest successfully',
      contractId: contractId,
      guestEmail: guestEmail,
      signingUrl: signingUrl,
      expiresAt: tokenExpiresAt
    });
    
  } catch (error) {
    console.error('Failed to create/send contract:', error);
    res.status(500).json({
      error: 'Failed to create and send contract',
      details: error.message
    });
  }
}));

// POST /api/admin/contracts/:id/send-guest - Send existing contract to guest for signing
app.post('/api/admin/contracts/:id/send-guest', authenticateAdmin, asyncHandler(async (req, res) => {
  const contractId = req.params.id;
  const { guestEmail, guestName } = req.body;
  
  if (!guestEmail || !guestName) {
    return res.status(400).json({ error: 'Guest email and name are required' });
  }
  
  console.log(`Sending contract ${contractId} to guest: ${guestEmail}`);
  
  // Get contract details
  const contract = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contracts WHERE id = ?', [contractId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  
  // Generate unique guest token
  const guestToken = uuidv4();
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30); // 30 days expiration
  
  // Update contract with guest info
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE contracts 
       SET guest_token = ?, 
           guest_email = ?, 
           guest_name = ?, 
           token_expires_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [guestToken, guestEmail.toLowerCase(), guestName, tokenExpiresAt.toISOString(), contractId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
  
  // Send email with signing link
  const signingUrl = `https://app.veribuilds.com/guest-sign/${guestToken}`;
  
  const emailSubject = 'Contract Ready for Your Signature - Veritas Building Group';
  const emailBody = `
Dear ${guestName},

You have received a contract from Veritas Building Group that requires your signature.

CONTRACT DETAILS:
================
Project: ${contract.project_name || 'N/A'}
Total Amount: ${contract.total_amount || 'N/A'}
Start Date: ${contract.start_date || 'N/A'}

To review and sign this contract, please click the link below:
${signingUrl}

This link will expire on ${tokenExpiresAt.toLocaleDateString()}.

IMPORTANT: 
- You do not need to create an account to sign this contract
- Simply click the link above to review and add your signature
- Once signed, you'll receive a copy of the fully executed contract

If you have any questions about this contract, please contact us at:
info@veribuilds.com
(360) 229-5524

Best regards,
Veritas Building Group

---
This is an automated message. Please do not reply to this email.
  `;
  
  try {
    await sendEmail({
      to: guestEmail,
      subject: emailSubject,
      text: emailBody
    });
    
    console.log(`✅ Guest contract email sent to: ${guestEmail}`);
    
    res.json({
      success: true,
      message: 'Contract sent to guest successfully',
      guestEmail: guestEmail,
      signingUrl: signingUrl,
      expiresAt: tokenExpiresAt
    });
  } catch (error) {
    console.error('Failed to send guest contract email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
}));

// GET /api/contracts/guest/:token - Get contract details for guest (no auth required)
app.get('/api/contracts/guest/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  console.log(`Guest accessing contract with token: ${token}`);
  
  const contract = await new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        id,
        project_name,
        project_description,
        start_date,
        end_date,
        total_amount,
        payment_terms,
        scope,
        contract_content,
        status,
        guest_name,
        guest_email,
        token_expires_at,
        signature_data,
        signature_status,
        signed_at,
        guest_signed_at,
        created_at
      FROM contracts 
      WHERE guest_token = ?`,
      [token],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found or link is invalid' });
  }
  
  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(contract.token_expires_at);
  
  if (now > expiresAt) {
    return res.status(410).json({ 
      error: 'This signing link has expired',
      expiredAt: contract.token_expires_at
    });
  }
  
  // Check if already signed
  if (contract.guest_signed_at) {
    return res.json({
      ...contract,
      alreadySigned: true,
      message: 'This contract has already been signed'
    });
  }
  
  res.json(contract);
}));

// POST /api/contracts/guest/:token/sign - Guest signs contract (no auth required)
app.post('/api/contracts/guest/:token/sign', asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { signature, name, email } = req.body;
  
  if (!signature || !name || !email) {
    return res.status(400).json({ error: 'Signature, name, and email are required' });
  }
  
  console.log(`Guest signing contract with token: ${token}`);
  
  // Get contract
  const contract = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM contracts WHERE guest_token = ?', [token], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found or link is invalid' });
  }
  
  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(contract.token_expires_at);
  
  if (now > expiresAt) {
    return res.status(410).json({ error: 'This signing link has expired' });
  }
  
  // Check if already signed
  if (contract.guest_signed_at) {
    return res.status(400).json({ error: 'This contract has already been signed' });
  }
  
  // Verify email matches
  if (email.toLowerCase() !== contract.guest_email.toLowerCase()) {
    return res.status(400).json({ error: 'Email does not match the intended recipient' });
  }
  
  // Update contract with signature
  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE contracts 
       SET signature_data = ?,
           signature_status = 'signed',
           signed_at = CURRENT_TIMESTAMP,
           guest_signed_at = CURRENT_TIMESTAMP,
           status = 'signed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [signature, contract.id],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
  
  console.log(`✅ Guest signed contract: ${contract.id}`);
  
  const contractViewUrl = `https://app.veribuilds.com/admin/contracts/${contract.id}`;
  const signedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Generate PDF of signed contract
  let pdfAttachment = null;
  try {
    // Update contract object with the new signature for PDF generation
    const updatedContract = {
      ...contract,
      guest_signed_at: new Date().toISOString(),
      signed_at: new Date().toISOString(),
      guest_name: name,
      guest_email: email
    };
    
    const pdfBuffer = generateSignedContractPDF(updatedContract, signature, contract.admin_signature || null);
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    
    pdfAttachment = {
      filename: `Signed_Contract_${contract.project_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Contract'}_${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfBase64
    };
    
    console.log('PDF generated successfully for contract:', contract.id);
  } catch (pdfError) {
    console.error('Error generating PDF:', pdfError);
    // Continue without PDF attachment if generation fails
  }
  
  // Send confirmation email to guest
  try {
    const guestConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #10b981, #14b8a6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Contract Signed Successfully</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #333;">Hello ${name},</p>
          
          <p style="font-size: 16px; color: #333;">Thank you for signing the contract! Your signature has been successfully recorded.</p>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">Contract Details</h3>
            <table style="width: 100%; font-size: 14px; color: #065f46;">
              <tr><td style="padding: 5px 0;"><strong>Project:</strong></td><td>${contract.project_name || 'N/A'}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Contract ID:</strong></td><td>${contract.id}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Signed On:</strong></td><td>${signedDate}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Status:</strong></td><td>Fully Executed</td></tr>
            </table>
          </div>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1; font-size: 14px;">
              <strong>Your signed contract is attached to this email.</strong><br>
              Please save a copy for your records.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            Questions? Contact us at:<br>
            Email: <a href="mailto:info@veribuilds.com" style="color: #14b8a6;">info@veribuilds.com</a><br>
            Phone: (360) 229-5524
          </p>
          
          <p style="margin-top: 25px; color: #333;">Best regards,<br><strong>Veritas Building Group</strong></p>
        </div>
        
        <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated confirmation from Veritas Building Group.</p>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: email,
      subject: `Contract Signed Successfully - ${contract.project_name || 'Veritas Building Group'}`,
      html: guestConfirmationHtml,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
    
    // Send notification to admin with professional HTML
    const adminNotificationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #10b981, #14b8a6); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Contract Signed</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #333;">Great news! A guest has signed a contract.</p>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">Signing Details</h3>
            <table style="width: 100%; font-size: 14px; color: #065f46;">
              <tr><td style="padding: 5px 0;"><strong>Guest Name:</strong></td><td>${name}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Guest Email:</strong></td><td>${email}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Project:</strong></td><td>${contract.project_name || 'N/A'}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Contract ID:</strong></td><td>${contract.id}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Signed At:</strong></td><td>${signedDate} at ${new Date().toLocaleTimeString()}</td></tr>
            </table>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${contractViewUrl}" style="background: linear-gradient(to right, #14b8a6, #06b6d4); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">View Signed Contract</a>
          </p>
          
          <p style="margin-top: 25px; color: #333;">Best regards,<br><strong>Veritas Building Group System</strong></p>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: 'info@veribuilds.com',
      subject: `Contract Signed by ${name} - ${contract.project_name}`,
      html: adminNotificationHtml,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
    
    // Also send to niko
    await sendEmail({
      to: 'niko@veribuilds.com',
      subject: `Contract Signed by ${name} - ${contract.project_name}`,
      html: adminNotificationHtml,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
    
    // Create in-app notification for admins
    try {
      const admins = await new Promise((resolve, reject) => {
        db.all(`SELECT id FROM users WHERE is_admin = 1`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'contract_signed',
          'Contract Signed',
          `${name} has signed the contract for ${contract.project_name}`
        );
      }
    } catch (notifError) {
      console.error('Failed to create admin notifications:', notifError);
    }
    
  } catch (emailError) {
    console.error('Failed to send confirmation emails:', emailError);
    // Don't fail the request if email fails
  }
  
  res.json({
    success: true,
    message: 'Contract signed successfully',
    contractId: contract.id,
    signedAt: new Date().toISOString()
  });
}));

// ===== INVOICES API =====

// Get user's payments (invoices)
app.get('/api/payments', authenticate, asyncHandler(async (req, res) => {
  const payments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        i.id,
        i.invoice_number as payment_number,
        i.id as invoice_id,
        i.amount,
        i.issue_date as payment_date,
        i.due_date,
        i.status,
        'invoice' as payment_method,
        i.description,
        i.project_name,
        i.created_at
      FROM invoices i
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  res.json(payments);
}));

// Get user's invoices
app.get('/api/invoices', authenticate, asyncHandler(async (req, res) => {
  const invoices = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        i.id,
        i.invoice_number,
        i.project_name,
        i.amount,
        i.status,
        i.issue_date,
        i.due_date,
        i.description,
        i.quickbooks_id,
        u.name as client_name
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.user_id = ?
      ORDER BY i.issue_date DESC
    `, [req.user.id], (err, rows) => {
      if (err) {
        console.error('Database error fetching invoices:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(invoices);
}));

// Create new invoice
app.post('/api/invoices', authenticate, asyncHandler(async (req, res) => {
  const { project_name, description, amount, due_date, client_id, items } = req.body;
  
  if (!project_name || !amount || !due_date) {
    return res.status(400).json({ error: 'Project name, amount, and due date are required' });
  }
  
  // Determine the user_id based on whether this is an admin creating for a client
  let targetUserId = req.user.id;
  if (req.user.is_admin && client_id) {
    targetUserId = client_id;
  }
  
  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;
  
  const invoiceId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO invoices (
        user_id, invoice_number, project_name, description, 
        amount, status, issue_date, due_date
      ) VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), ?)
    `, [
      targetUserId,
      invoiceNumber,
      project_name,
      description || null,
      amount,
      due_date
    ], function(err) {
      if (err) {
        console.error('Database error creating invoice:', err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
  
  // Get user info for notifications
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [targetUserId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  // Notify all admins about the new invoice
  const admins = await new Promise((resolve, reject) => {
    db.all('SELECT id, name, email FROM users WHERE is_admin = 1', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  for (const admin of admins) {
    try {
      // Create in-app notification for admin
      await createNotification(
        admin.id,
        'invoice_created',
        'New Invoice Created',
        `${user.name} created invoice ${invoiceNumber} for $${parseFloat(amount).toLocaleString()}`
      );
      
      // Send email notification to admin
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
        to: admin.email,
        subject: `New Invoice: ${invoiceNumber}`,
        html: `
          <h2>New Invoice Created</h2>
          <p>Hello ${admin.name},</p>
          <p>A new invoice has been created and requires your review:</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p><strong>Created By:</strong> ${user.name} (${user.email})</p>
          <p><strong>Project:</strong> ${project_name}</p>
          <p><strong>Amount:</strong> $${parseFloat(amount).toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
          ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
          <p>Please log in to the admin dashboard to review and approve this invoice.</p>
          <p>Best regards,<br>VBG System</p>
        `
      });
      
      console.log(`📧 Invoice notification sent to admin: ${admin.email}`);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }
  }
  
  res.json({ 
    message: 'Invoice created successfully',
    invoiceId,
    invoice_number: invoiceNumber
  });
}));

// Get single invoice by ID
app.get('/api/invoices/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const invoice = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM invoices 
      WHERE id = ? AND user_id = ?
    `, [id, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  res.json(invoice);
}));

// Download invoice PDF
app.get('/api/invoices/:invoiceId/download', authenticate, asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  
  // Verify invoice belongs to user
  const invoice = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM invoices 
      WHERE id = ? AND user_id = ?
    `, [invoiceId, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  
  // For now, return a simple response - in production, generate/serve PDF
  res.json({ message: 'PDF download would be implemented here', invoice });
}));

// ===== RECEIPTS API =====

// Get user's payment receipts
app.get('/api/receipts', authenticate, asyncHandler(async (req, res) => {
  const receipts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        r.id,
        r.receipt_number,
        r.invoice_id,
        r.amount,
        r.payment_method,
        r.payment_date,
        r.transaction_id,
        r.notes,
        i.invoice_number,
        i.project_name
      FROM receipts r
      JOIN invoices i ON r.invoice_id = i.id
      WHERE i.user_id = ?
      ORDER BY r.payment_date DESC
    `, [req.user.id], (err, rows) => {
      if (err) {
        console.error('Database error fetching receipts:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(receipts);
}));

// Download receipt PDF
app.get('/api/receipts/:receiptId/download', authenticate, asyncHandler(async (req, res) => {
  const { receiptId } = req.params;
  
  // Verify receipt belongs to user
  const receipt = await new Promise((resolve, reject) => {
    db.get(`
      SELECT r.*, i.project_name, i.invoice_number
      FROM receipts r
      JOIN invoices i ON r.invoice_id = i.id
      WHERE r.id = ? AND i.user_id = ?
    `, [receiptId, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }
  
  // For now, return a simple response - in production, generate/serve PDF
  res.json({ message: 'PDF download would be implemented here', receipt });
}));

// ===== ESTIMATES API =====

// Get user's estimates
app.get('/api/estimates', authenticate, asyncHandler(async (req, res) => {
  const estimates = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id,
        estimate_number,
        project_name,
        description,
        amount,
        status,
        requested_date,
        response_date,
        notes,
        admin_notes
      FROM estimates
      WHERE user_id = ?
      ORDER BY requested_date DESC
    `, [req.user.id], (err, rows) => {
      if (err) {
        console.error('Database error fetching estimates:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(estimates);
}));

// Submit new estimate request
app.post('/api/estimates', authenticate, asyncHandler(async (req, res) => {
  const { project_name, description, notes } = req.body;
  
  if (!project_name || !description) {
    return res.status(400).json({ error: 'Project name and description are required' });
  }
  
  // Generate estimate number
  const estimateNumber = `EST-${Date.now()}`;
  
  const estimateId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO estimates (
        user_id, estimate_number, project_name, description, 
        notes, status, requested_date
      ) VALUES (?, ?, ?, ?, ?, 'requested', datetime('now'))
    `, [req.user.id, estimateNumber, project_name, description, notes || null], function(err) {
      if (err) {
        console.error('Database error creating estimate:', err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
  
  // Get user info for notifications
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, name, email FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  // Notify all admins about the new estimate request
  const admins = await new Promise((resolve, reject) => {
    db.all('SELECT id, name, email FROM users WHERE is_admin = 1', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  for (const admin of admins) {
    try {
      // Create in-app notification for admin
      await createNotification(
        admin.id,
        'estimate_requested',
        'New Estimate Request',
        `${user.name} requested estimate ${estimateNumber} for ${project_name}`
      );
      
      // Send email notification to admin
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
        to: admin.email,
        subject: `New Estimate Request: ${estimateNumber}`,
        html: `
          <h2>New Estimate Request</h2>
          <p>Hello ${admin.name},</p>
          <p>A new estimate has been requested:</p>
          <p><strong>Estimate Number:</strong> ${estimateNumber}</p>
          <p><strong>Requested By:</strong> ${user.name} (${user.email})</p>
          <p><strong>Project:</strong> ${project_name}</p>
          <p><strong>Description:</strong> ${description}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p>Please log in to the admin dashboard to review and respond to this estimate request.</p>
          <p>Best regards,<br>VBG System</p>
        `
      });
      
      console.log(`📧 Estimate notification sent to admin: ${admin.email}`);
    } catch (notifError) {
      console.error('Error sending admin notification:', notifError);
    }
  }
  
  res.json({ 
    message: 'Estimate request submitted successfully',
    estimateId,
    estimate_number: estimateNumber
  });
}));

// Approve estimate
app.post('/api/estimates/:estimateId/approve', authenticate, asyncHandler(async (req, res) => {
  const { estimateId } = req.params;
  
  // Verify estimate belongs to user and is in pending status
  const estimate = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM estimates 
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `, [estimateId, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!estimate) {
    return res.status(404).json({ error: 'Estimate not found or not available for approval' });
  }
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE estimates 
      SET status = 'approved', response_date = datetime('now')
      WHERE id = ?
    `, [estimateId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  res.json({ message: 'Estimate approved successfully' });
}));

// Reject estimate
app.post('/api/estimates/:estimateId/reject', authenticate, asyncHandler(async (req, res) => {
  const { estimateId } = req.params;
  
  // Verify estimate belongs to user and is in pending status
  const estimate = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM estimates 
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `, [estimateId, req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!estimate) {
    return res.status(404).json({ error: 'Estimate not found or not available for rejection' });
  }
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE estimates 
      SET status = 'rejected', response_date = datetime('now')
      WHERE id = ?
    `, [estimateId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  res.json({ message: 'Estimate rejected successfully' });
}));

// Admin endpoint to get all estimates
app.get('/api/admin/estimates', authenticateAdmin, asyncHandler(async (req, res) => {
  const estimates = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        e.id,
        e.estimate_number,
        e.project_name,
        e.description,
        e.amount,
        e.status,
        e.requested_date,
        e.response_date,
        e.notes,
        e.admin_notes,
        u.name as client_name,
        u.email as client_email
      FROM estimates e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.requested_date DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Database error fetching admin estimates:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(estimates);
}));

// Admin endpoint to update estimate with amount and notes
app.put('/api/admin/estimates/:estimateId', authenticateAdmin, asyncHandler(async (req, res) => {
  const { estimateId } = req.params;
  const { amount, admin_notes, status } = req.body;
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE estimates 
      SET amount = ?, admin_notes = ?, status = ?, response_date = datetime('now')
      WHERE id = ?
    `, [amount || null, admin_notes || null, status || 'pending', estimateId], (err) => {
      if (err) {
        console.error('Database error updating estimate:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ message: 'Estimate updated successfully' });
}));

// ===== ADMIN INVOICES API =====

// Admin endpoint to get all invoices
app.get('/api/admin/invoices', authenticateAdmin, asyncHandler(async (req, res) => {
  const invoices = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        i.id,
        i.invoice_number,
        i.project_name,
        i.amount,
        i.status,
        i.issue_date,
        i.due_date,
        i.description,
        i.quickbooks_id,
        u.name as client_name,
        u.email as client_email
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.issue_date DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Database error fetching admin invoices:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(invoices);
}));

// Admin endpoint to create/send a new invoice
app.post('/api/admin/invoices', authenticateAdmin, asyncHandler(async (req, res) => {
  const { client_email, project_name, amount, description, due_date } = req.body;
  
  if (!client_email || !project_name || !amount || !due_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;
  
  // Find user by email
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, name, email FROM users WHERE email = ?', [client_email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found with that email' });
  }
  
  // Create invoice
  const invoiceId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO invoices (
        user_id, invoice_number, project_name, amount, description, 
        due_date, issue_date, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'pending', datetime('now'))
    `, [user.id, invoiceNumber, project_name, amount, description, due_date], function(err) {
      if (err) {
        console.error('Database error creating invoice:', err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
  
  // Send email notification to user
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
      to: user.email,
      subject: `New Invoice: ${invoiceNumber}`,
      html: `
        <h2>New Invoice</h2>
        <p>Hello ${user.name},</p>
        <p>You have received a new invoice:</p>
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Project:</strong> ${project_name}</p>
        <p><strong>Amount:</strong> $${parseFloat(amount).toLocaleString()}</p>
        <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        <p>Please log in to your dashboard to view and pay this invoice.</p>
        <p>Best regards,<br>Veritas Building Group</p>
      `
    });
    
    console.log(`📧 Invoice email sent to: ${user.email}`);
  } catch (emailError) {
    console.error('Error sending invoice email:', emailError);
  }
  
  res.json({ 
    success: true, 
    message: 'Invoice created and sent successfully',
    invoiceId,
    invoiceNumber
  });
}));

// Admin endpoint to approve invoice (mark as paid)
app.post('/api/admin/invoices/:invoiceId/approve', authenticateAdmin, asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE invoices 
      SET status = 'paid', updated_at = datetime('now')
      WHERE id = ?
    `, [invoiceId], (err) => {
      if (err) {
        console.error('Database error approving invoice:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ message: 'Invoice approved successfully' });
}));

// Admin endpoint to reject/cancel invoice
app.post('/api/admin/invoices/:invoiceId/reject', authenticateAdmin, asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE invoices 
      SET status = 'overdue', updated_at = datetime('now')
      WHERE id = ?
    `, [invoiceId], (err) => {
      if (err) {
        console.error('Database error rejecting invoice:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ message: 'Invoice rejected successfully' });
}));

// Admin endpoint to update invoice status
app.put('/api/admin/invoices/:invoiceId/status', authenticateAdmin, asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { status } = req.body;
  
  if (!['pending', 'paid', 'overdue'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE invoices 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, invoiceId], (err) => {
      if (err) {
        console.error('Database error updating invoice status:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ message: 'Invoice status updated successfully' });
}));

// ===== ADMIN RECEIPTS API =====

// Admin endpoint to get all receipts
app.get('/api/admin/receipts', authenticateAdmin, asyncHandler(async (req, res) => {
  const receipts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        r.id,
        r.receipt_number,
        r.invoice_id,
        r.amount,
        r.payment_method,
        r.payment_date,
        r.transaction_id,
        r.notes,
        i.invoice_number,
        i.project_name,
        u.name as client_name,
        u.email as client_email
      FROM receipts r
      JOIN invoices i ON r.invoice_id = i.id
      JOIN users u ON i.user_id = u.id
      ORDER BY r.payment_date DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Database error fetching admin receipts:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(receipts);
}));

// ============================================
// APPOINTMENTS ENDPOINTS
// ============================================

// POST /api/appointments - Create new appointment request
app.post('/api/appointments', authenticate, asyncHandler(async (req, res) => {
  const { appointment_type, preferred_date, preferred_time, alternate_date, alternate_time, description, notes } = req.body;
  
  if (!appointment_type || !preferred_date || !preferred_time || !description) {
    return res.status(400).json({ error: 'Appointment type, preferred date, time, and description are required' });
  }
  
  // Generate appointment number
  const appointmentNumber = `APT-${Date.now()}`;
  
  const appointmentId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO appointments (
        user_id, appointment_number, appointment_type, preferred_date, preferred_time,
        alternate_date, alternate_time, description, notes, status, requested_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', datetime('now'))
    `, [
      req.user.id, 
      appointmentNumber, 
      appointment_type, 
      preferred_date, 
      preferred_time,
      alternate_date || null,
      alternate_time || null,
      description, 
      notes || null
    ], function(err) {
      if (err) {
        console.error('Database error creating appointment:', err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });

  // Send email notifications via Resend
  let emailSent = false;
  try {
    // Send business notification
    await sendAppointmentNotification({
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || 'N/A',
      appointment_type,
      preferred_date,
      preferred_time,
      description,
      notes
    });

    // Send customer confirmation
    await sendCustomerConfirmation({
      name: req.user.name,
      email: req.user.email,
      appointment_type,
      preferred_date,
      preferred_time
    });

    emailSent = true;
    console.log(`✅ Appointment emails sent successfully for ${appointmentNumber}`);
  } catch (emailError) {
    console.error('❌ Error sending appointment emails:', emailError);
    // Don't fail the request if email fails
  }

  // Get all admin users for notifications
  const admins = await new Promise((resolve, reject) => {
    db.all('SELECT id, email, name FROM admin_users WHERE is_active = 1', (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

  // Create notifications for all admins
  for (const admin of admins) {
    try {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO notifications (user_id, type, title, message, link, created_at)
          VALUES (?, 'appointment_request', ?, ?, ?, datetime('now'))
        `, [
          admin.id,
          'New Appointment Request',
          `${req.user.name} has requested a ${appointment_type} appointment`,
          `/admin/appointments/${appointmentId}`
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (err) {
      console.error('Error creating notification for admin:', err);
    }
  }
  
  res.json({ 
    message: 'Appointment request submitted successfully',
    appointmentId,
    appointment_number: appointmentNumber,
    emailSent
  });
}));

// GET /api/appointments - Get user's appointments
app.get('/api/appointments', authenticate, asyncHandler(async (req, res) => {
  const appointments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM appointments 
      WHERE user_id = ? 
      ORDER BY requested_date DESC
    `, [req.user.id], (err, rows) => {
      if (err) {
        console.error('Database error fetching appointments:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(appointments);
}));

// GET /api/admin/appointments - Get all appointments (admin)
app.get('/api/admin/appointments', authenticateAdmin, asyncHandler(async (req, res) => {
  const appointments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        a.*,
        u.name as client_name,
        u.email as client_email,
        u.phone as client_phone
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.requested_date DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('Database error fetching admin appointments:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(appointments);
}));

// PUT /api/admin/appointments/:id - Update appointment status (admin)
app.put('/api/admin/appointments/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, confirmed_date, confirmed_time, admin_notes } = req.body;
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE appointments 
      SET status = ?, confirmed_date = ?, confirmed_time = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [status, confirmed_date || null, confirmed_time || null, admin_notes || null, id], function(err) {
      if (err) {
        console.error('Database error updating appointment:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ message: 'Appointment updated successfully' });
}));

// Admin invitation endpoints
app.post('/api/admin/invite-client', authenticateAdmin, asyncHandler(async (req, res) => {
  const { email, businessName, clientName, message } = req.body;
  
  if (!email || !businessName || !clientName) {
    return res.status(400).json({ error: 'Email, business name, and client name are required' });
  }
  
  console.log(`📧 Processing client invitation for: ${email}`);
  
  try {
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id, email FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    
    // Generate a random password
    const generatedPassword = crypto.randomBytes(8).toString('hex'); // 16 character password
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
    // Create the user account
    const userId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (
          name, 
          email, 
          password,
          company_name, 
          user_type, 
          is_verified,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          clientName,
          email.toLowerCase(),
          hashedPassword,
          businessName,
          'client',
          1 // Auto-verify since admin is creating them
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    console.log(`✅ Client account created with ID: ${userId}`);
    
    // Send welcome email with login credentials
    const emailSubject = 'Welcome to Veritas Building Group - Your Account Details';
    const emailBody = `
Dear ${clientName},

Welcome to the Veritas Building Group Management Platform! Your account has been created.

ACCOUNT DETAILS:
================
Email: ${email}
Password: ${generatedPassword}
Login URL: https://app.veribuilds.com/login

Company: ${businessName}

${message ? `Personal Message: ${message}\n\n` : ''}Once logged in, you'll be able to:
- View and manage your construction projects
- Upload and organize project documents
- Review and sign contracts
- Track project progress and payments
- Communicate with your construction team

IMPORTANT: Please keep this email safe as it contains your login credentials. We recommend changing your password after your first login.

If you have any questions, please don't hesitate to contact us.

Best regards,
Veritas Building Group
info@veribuilds.com
(360) 229-5524
    `;
    
    await sendEmail({
      to: email,
      subject: emailSubject,
      text: emailBody
    });
    
    console.log(`✅ Client welcome email sent successfully to: ${email}`);
    res.json({ 
      success: true, 
      message: 'Client account created and welcome email sent successfully',
      userId: userId,
      email: email,
      password: generatedPassword // Include in response for admin to see
    });
    
  } catch (error) {
    console.error('❌ Client account creation failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to create client account',
      details: error.message
    });
  }
}));

app.post('/api/admin/invite-subcontractor', authenticateAdmin, asyncHandler(async (req, res) => {
  const { email, businessName, clientName, specialty, message } = req.body;
  
  if (!email || !businessName || !clientName || !specialty) {
    return res.status(400).json({ error: 'Email, business name, contact name, and specialty are required' });
  }
  
  console.log(`🔧 Processing subcontractor invitation for: ${email} (${specialty})`);
  
  try {
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id, email FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    
    // Generate a random password
    const generatedPassword = crypto.randomBytes(8).toString('hex'); // 16 character password
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    
    // Create the user account
    const userId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (
          name, 
          email, 
          password,
          company_name, 
          user_type, 
          is_verified,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          clientName,
          email.toLowerCase(),
          hashedPassword,
          businessName,
          'subcontractor',
          1 // Auto-verify since admin is creating them
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    console.log(`✅ Subcontractor account created with ID: ${userId}`);
    
    // Send welcome email with login credentials using HTML template
    const emailSubject = 'Welcome to Veritas Building Group - Your Subcontractor Account';
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Veritas Building Group</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Subcontractor Portal</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${clientName}! 🎉</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Your subcontractor account has been created on the Veritas Building Group Management Platform. We're excited to have you join our network of trusted professionals!
              </p>
              
              ${message ? `
              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #0f766e; margin: 0; font-size: 14px; font-style: italic;">"${message}"</p>
              </div>
              ` : ''}
              
              <!-- Account Details Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 Your Account Details</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; width: 120px;">Email:</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 600;">${email}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Password:</td>
                    <td style="color: #1f2937; font-size: 14px; font-family: monospace; background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${generatedPassword}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Company:</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 600;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">Specialty:</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-transform: capitalize;">${specialty}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Login Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.veribuilds.com/login" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);">Login to Your Account</a>
              </div>
              
              <!-- Features List -->
              <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">🔧 What You Can Do</h3>
                <ul style="color: #4b5563; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0;">
                  <li>View and accept job assignments</li>
                  <li>Upload required documents and certifications</li>
                  <li>Review and sign subcontractor agreements</li>
                  <li>Submit invoices and track payments</li>
                  <li>Communicate with project managers</li>
                  <li>Access project specifications and plans</li>
                </ul>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px 20px; margin: 25px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>🔒 Security Notice:</strong> Please keep this email safe as it contains your login credentials. We recommend changing your password after your first login.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">Veritas Building Group</p>
              <p style="color: #6b7280; margin: 0; font-size: 13px;">
                <a href="mailto:info@veribuilds.com" style="color: #14b8a6; text-decoration: none;">info@veribuilds.com</a> | (360) 229-5524
              </p>
              <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} Veritas Building Group. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    
    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailHtml
      });
      
      console.log(`✅ Subcontractor welcome email sent successfully to: ${email}`);
      res.json({ 
        success: true, 
        method: 'email',
        message: 'Subcontractor account created and welcome email sent successfully',
        userId: userId,
        email: email,
        specialty: specialty,
        password: generatedPassword // Include in response for admin to see
      });
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError.message);
      // Account was created but email failed - return manual method
      const manualText = `
SUBCONTRACTOR ACCOUNT CREATED
=============================

Dear ${clientName},

Your subcontractor account has been created on the Veritas Building Group Management Platform.

ACCOUNT DETAILS:
Email: ${email}
Password: ${generatedPassword}
Login URL: https://app.veribuilds.com/login

Company: ${businessName}
Specialty: ${specialty}

${message ? `Personal Message: ${message}\n` : ''}
Please keep this information safe and change your password after your first login.

Best regards,
Veritas Building Group
info@veribuilds.com
(360) 229-5524
      `;
      
      res.json({ 
        success: true, 
        method: 'manual',
        message: 'Subcontractor account created but email could not be sent',
        emailError: emailError.message,
        manualText: manualText,
        userId: userId,
        email: email,
        specialty: specialty,
        password: generatedPassword
      });
    }
    
  } catch (error) {
    console.error('❌ Subcontractor account creation failed:', error.message);
    res.status(500).json({ 
      error: 'Failed to create subcontractor account',
      details: error.message
    });
  }
}));

// Job Sites Management API Endpoints

// GET /api/admin/job-sites - Get all job sites
app.get('/api/admin/job-sites', authenticateAdmin, asyncHandler(async (req, res) => {
  const jobSites = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        js.*,
        u.name as client_name,
        COUNT(ja.user_id) as assigned_users
      FROM job_sites js
      LEFT JOIN users u ON js.client_id = u.id
      LEFT JOIN job_assignments ja ON js.id = ja.job_site_id
      GROUP BY js.id
      ORDER BY js.created_at DESC
    `, (err, rows) => {
      if (err) {
        console.error('Error fetching job sites:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(jobSites);
}));

// POST /api/admin/job-sites - Create new job site
app.post('/api/admin/job-sites', authenticateAdmin, asyncHandler(async (req, res) => {
  const {
    name, description, address, city, state, zip_code,
    client_id, project_manager, start_date, end_date,
    budget, status, client_notes, contractor_notes, safety_requirements
  } = req.body;
  
  if (!name || !address || !city || !state || !zip_code || !start_date || !end_date) {
    return res.status(400).json({ error: 'Required fields: name, address, city, state, zip_code, start_date, end_date' });
  }
  
  const jobSiteId = `JOB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO job_sites (
        id, name, description, address, city, state, zip_code,
        client_id, project_manager, start_date, end_date,
        budget, status, client_notes, contractor_notes, safety_requirements
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jobSiteId, name, description, address, city, state, zip_code,
      client_id || null, project_manager, start_date, end_date,
      budget || 0, status || 'planning', client_notes, contractor_notes, safety_requirements
    ], function(err) {
      if (err) {
        console.error('Error creating job site:', err);
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
  
  console.log(`✅ Job site created: ${jobSiteId}`);
  res.json({ success: true, id: jobSiteId, message: 'Job site created successfully' });
}));

// GET /api/admin/job-sites/:id - Get specific job site
app.get('/api/admin/job-sites/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const jobSite = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        js.*,
        u.name as client_name,
        u.email as client_email,
        u.company_name as client_company
      FROM job_sites js
      LEFT JOIN users u ON js.client_id = u.id
      WHERE js.id = ?
    `, [id], (err, row) => {
      if (err) {
        console.error('Error fetching job site:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!jobSite) {
    return res.status(404).json({ error: 'Job site not found' });
  }
  
  // Get assigned users
  const assignments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        ja.*,
        u.name as user_name,
        u.email as user_email,
        u.company_name,
        u.user_type
      FROM job_assignments ja
      JOIN users u ON ja.user_id = u.id
      WHERE ja.job_site_id = ?
      ORDER BY ja.user_type, u.name
    `, [id], (err, rows) => {
      if (err) {
        console.error('Error fetching job assignments:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json({ ...jobSite, assignments });
}));

// POST /api/admin/job-sites/:id/assign - Assign users to job site
app.post('/api/admin/job-sites/:id/assign', authenticateAdmin, asyncHandler(async (req, res) => {
  console.log('🚀 Assignment endpoint hit - req.params:', req.params);
  console.log('🚀 Assignment endpoint hit - req.body:', req.body);
  console.log('🚀 Raw request body type:', typeof req.body);
  console.log('🚀 Raw request body string:', JSON.stringify(req.body));
  const { id } = req.params;
  const { assignments } = req.body;
  
  console.log('🔍 Job site assignment request:', { id, assignments });
  
  if (!assignments || !Array.isArray(assignments)) {
    return res.status(400).json({ error: 'Assignments array is required' });
  }
  
  // First, remove existing assignments for this job site
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM job_assignments WHERE job_site_id = ?', [id], (err) => {
      if (err) {
        console.error('Error removing existing assignments:', err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
  
  // Get job site details for notifications
  const jobSite = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM job_sites WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching job site for notification:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });

  // Add new assignments and create notifications
  try {
    for (const assignment of assignments) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO job_assignments (
          job_site_id, user_id, user_type, role, assigned_date
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        id,
        assignment.user_id,
        assignment.user_type,
        assignment.role || '',
        new Date().toISOString().split('T')[0]
      ], function(err) {
        if (err) {
          console.error('Error creating assignment:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      });

      // Create notification for the assigned user
      const notificationId = `JOBSITE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('📝 Creating notification for user:', assignment.user_id, 'with ID:', notificationId);
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO contracts (
          id, user_id, admin_id, project_name, project_description,
          contractor_name, contractor_email, start_date, end_date, 
          total_amount, payment_terms, scope, contract_content, status, contract_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        notificationId,
        assignment.user_id,
        req.user.id, // admin_id
        `Job Site Assignment: ${jobSite.name}`,
        `You have been assigned to job site: ${jobSite.name}`,
        assignment.role || 'Team Member',
        '', // contractor_email not needed for job site assignments
        jobSite.start_date,
        jobSite.end_date,
        assignment.user_type === 'client' ? (jobSite.budget || '0') : '0', // Only show budget to clients
        'As per job site assignment',
        `Role: ${assignment.role || 'Team Member'}\nLocation: ${jobSite.address}, ${jobSite.city}, ${jobSite.state}\n\nDescription: ${jobSite.description || 'No description provided'}\n\n${assignment.user_type === 'client' ? (jobSite.client_notes || '') : (jobSite.contractor_notes || '')}`,
        `Job Site Assignment Contract\n\nJob: ${jobSite.name}\nRole: ${assignment.role || 'Team Member'}\nLocation: ${jobSite.address}, ${jobSite.city}, ${jobSite.state}\n\nThis assignment is effective from ${jobSite.start_date} to ${jobSite.end_date}.`, // contract_content
        'job_assignment',
        'job_site'
      ], function(err) {
        if (err) {
          console.error('Error creating job site notification:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      });

      // Send email notification for job site assignment
      console.log('📧 Attempting email notification for user:', assignment.user_id);
      try {
        const user = await new Promise((resolve, reject) => {
          db.get('SELECT name, email FROM users WHERE id = ?', [assignment.user_id], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });

        // Check if user wants job assignment notifications
        const wantsJobAssignmentNotifications = await shouldSendNotification(assignment.user_id, 'job_assignments');
        
        // Send email notification for job site assignment
        if (user && user.email && wantsJobAssignmentNotifications) {
          const emailSubject = `New Job Assignment - ${jobSite.name}`;
          const emailMessage = `
            <h2>🏗️ New Job Site Assignment</h2>
            <p>Hello ${user.name},</p>
            <p>You have been assigned to a new job site:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e67e22; margin: 0 0 15px 0;">${jobSite.name}</h3>
              <p><strong>Role:</strong> ${assignment.role || 'Team Member'}</p>
              <p><strong>Location:</strong> ${jobSite.address}, ${jobSite.city}, ${jobSite.state}</p>
              <p><strong>Start Date:</strong> ${new Date(jobSite.start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> ${new Date(jobSite.end_date).toLocaleDateString()}</p>
              ${jobSite.safety_requirements ? `<p><strong>Safety Requirements:</strong> ${jobSite.safety_requirements}</p>` : ''}
            </div>
            
            <p>Please log in to your dashboard to view complete details and any additional instructions.</p>
            <p><a href="http://31.97.144.132:3000/job-sites" style="background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Sites</a></p>
            
            <p>Best regards,<br>Veritas Building Group Team</p>
          `;
          
          // Send email without waiting (non-blocking)
          sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailMessage
          }).then(() => {
            console.log(`✅ Email notification sent to ${user.name} for job site assignment: ${jobSite.name}`);
          }).catch((emailError) => {
            console.error('❌ Email notification failed:', emailError.message);
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the assignment if email fails
      }
    } // End of for loop
  } catch (assignmentError) {
    console.error('❌ Error in assignment loop:', assignmentError);
    return res.status(500).json({ error: 'Failed to assign users', details: assignmentError.message });
  }
  
  console.log(`✅ Users assigned to job site: ${id}`);
  res.status(200).json({ success: true, message: 'Users assigned successfully' });
}));

// SMS test endpoint removed - using email notifications only

// POST /api/test-email - Test email connection using Resend
app.post('/api/test-email', authenticateAdmin, asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body;
  
  console.log('📧 Testing email to:', to);
  
  try {
    const { sendEmail } = await import('./utils/resend.js');
    
    const result = await sendEmail({
      to: to,
      subject: subject || 'Test Email from VBG',
      html: `<p>${message || 'This is a test email from VBG Construction'}</p>`
    });
    
    console.log('✅ Email test result:', result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({ error: 'Email test failed', details: error.message });
  }
}));

// DELETE /api/admin/job-sites/:id - Delete job site
app.delete('/api/admin/job-sites/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // First delete assignments
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM job_assignments WHERE job_site_id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting job assignments:', err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
  
  // Then delete job site
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM job_sites WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting job site:', err);
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
  
  console.log(`✅ Job site deleted: ${id}`);
  res.json({ success: true, message: 'Job site deleted successfully' });
}));

// GET /api/user/job-sites - Get job sites for current user
app.get('/api/user/job-sites', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const jobSites = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        js.*,
        ja.role,
        ja.assigned_date,
        ja.status as assignment_status,
        u.name as client_name
      FROM job_sites js
      JOIN job_assignments ja ON js.id = ja.job_site_id
      LEFT JOIN users u ON js.client_id = u.id
      WHERE ja.user_id = ?
      ORDER BY js.start_date DESC
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Error fetching user job sites:', err);
        reject(err);
      } else {
        // Filter information based on user type
        const filteredRows = rows.map(row => {
          const userType = req.user.user_type || 'subcontractor';
          
          if (userType === 'client') {
            // Clients see client_notes but not contractor_notes
            return {
              ...row,
              notes: row.client_notes,
              contractor_notes: undefined
            };
          } else {
            // Subcontractors see contractor_notes but not client_notes
            return {
              ...row,
              notes: row.contractor_notes,
              client_notes: undefined
            };
          }
        });
        
        resolve(filteredRows || []);
      }
    });
  });
  
  res.json(jobSites);
}));

// PUT /api/user/job-sites/mark-viewed - Mark job site notifications as viewed
app.put('/api/user/job-sites/mark-viewed', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE contracts 
      SET viewed = 1 
      WHERE user_id = ? AND contract_type = 'job_site' AND viewed = 0
    `, [userId], function(err) {
      if (err) {
        console.error('Error marking job site notifications as viewed:', err);
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
  
  console.log(`✅ Job site notifications marked as viewed for user: ${userId}`);
  res.json({ success: true, message: 'Job site notifications marked as viewed' });
}));

// POST /api/admin/job-sites/:id/message - Send message to job site users
app.post('/api/admin/job-sites/:id/message', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, message_type = 'update', priority = 'normal', send_sms = true } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Get job site details
  const jobSite = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM job_sites WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  
  if (!jobSite) {
    return res.status(404).json({ error: 'Job site not found' });
  }
  
  // Save message to database
  const messageId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO job_messages (
        job_site_id, admin_id, message, message_type, priority, send_sms
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [id, req.user.id, message, message_type, priority, send_sms ? 1 : 0], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
  
  // Get assigned users for this job site
  const assignedUsers = await new Promise((resolve, reject) => {
    db.all(`
      SELECT u.id, u.name, u.email, ja.user_type, ja.role
      FROM job_assignments ja
      JOIN users u ON ja.user_id = u.id
      WHERE ja.job_site_id = ?
    `, [id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  let emailResults = [];
  
  // Send email notifications to assigned users if enabled
  if (send_sms) { // Keep the same parameter name for backward compatibility
    for (const user of assignedUsers) {
      try {
        if (user.email) {
          // Determine notification type based on message type
          let notificationType = 'general_messages';
          if (message_type === 'safety') {
            notificationType = 'safety_alerts';
          } else if (message_type === 'schedule') {
            notificationType = 'schedule_changes';
          } else if (message_type === 'update') {
            notificationType = 'job_updates';
          }
          
          // Check if user wants this type of notification
          const wantsNotification = await shouldSendNotification(user.id, notificationType);
          
          if (!wantsNotification) {
            console.log(`⏭️ Skipping ${notificationType} notification for user ${user.name} (disabled in preferences)`);
            continue;
          }
          const priorityEmoji = priority === 'high' ? '⚠️' : priority === 'urgent' ? '🚨' : '💬';
          const typeText = message_type === 'safety' ? 'SAFETY ALERT' : 
                          message_type === 'schedule' ? 'SCHEDULE UPDATE' :
                          message_type === 'weather' ? 'WEATHER ALERT' : 'JOB UPDATE';
          
          const emailSubject = `${typeText} - ${jobSite.name}`;
          const emailMessage = `
            <h2>${priorityEmoji} ${typeText}</h2>
            <p>Hello ${user.name},</p>
            
            <div style="background: ${priority === 'urgent' ? '#fee2e2' : priority === 'high' ? '#fef3c7' : '#f0f9ff'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#f59e0b' : '#3b82f6'};">
              <h3 style="color: #1f2937; margin: 0 0 15px 0;">Job Site: ${jobSite.name}</h3>
              <p style="font-size: 16px; line-height: 1.5; margin: 0;">${message}</p>
            </div>
            
            <p>Please log in to your dashboard for complete details and any follow-up actions.</p>
            <p><a href="http://31.97.144.132:3000/job-sites" style="background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Job Sites</a></p>
            
            <p>Best regards,<br>Veritas Building Group Team</p>
          `;
          
          await sendEmail({
            to: user.email,
            subject: emailSubject,
            html: emailMessage
          });
          
          emailResults.push({ user: user.name, status: 'sent' });
          console.log(`✅ Email sent to ${user.name} for job site message: ${jobSite.name}`);
        } else {
          emailResults.push({ user: user.name, status: 'skipped', reason: 'no_email' });
        }
      } catch (emailError) {
        console.error(`Error sending email to ${user.name}:`, emailError);
        emailResults.push({ user: user.name, status: 'failed', error: emailError.message });
      }
    }
  }
  
  console.log(`✅ Message sent to job site: ${jobSite.name}`);
  res.json({ 
    success: true, 
    message_id: messageId,
    recipients: assignedUsers.length,
    email_results: emailResults,
    message: 'Message sent successfully' 
  });
}));

// GET /api/admin/job-sites/:id/messages - Get messages for job site
app.get('/api/admin/job-sites/:id/messages', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const messages = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        jm.*,
        u.name as admin_name
      FROM job_messages jm
      JOIN users u ON jm.admin_id = u.id
      WHERE jm.job_site_id = ?
      ORDER BY jm.created_at DESC
    `, [id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(messages);
}));

// GET /api/admin/job-sites/:id/assignments - Get assignments for job site
app.get('/api/admin/job-sites/:id/assignments', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const assignments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_type,
        ja.role,
        ja.assigned_date
      FROM users u
      JOIN job_assignments ja ON u.id = ja.user_id
      WHERE ja.job_site_id = ?
      ORDER BY u.name
    `, [id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(assignments);
}));

// GET /api/user/job-sites/:id - Get specific job site details for user
app.get('/api/user/job-sites/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if user has access to this job site
  const jobSite = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        js.*,
        ja.role,
        ja.assigned_date
      FROM job_sites js
      JOIN job_assignments ja ON js.id = ja.job_site_id
      WHERE js.id = ? AND ja.user_id = ?
    `, [id, userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  if (!jobSite) {
    return res.status(404).json({ error: 'Job site not found or access denied' });
  }
  
  res.json(jobSite);
}));

// GET /api/user/job-sites/:id/messages - Get messages for specific job site
app.get('/api/user/job-sites/:id/messages', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 1 FROM job_assignments 
      WHERE job_site_id = ? AND user_id = ?
    `, [id, userId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  const messages = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        jm.*,
        u.name as admin_name
      FROM job_messages jm
      LEFT JOIN users u ON jm.admin_id = u.id
      WHERE jm.job_site_id = ?
      ORDER BY jm.created_at DESC
    `, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  res.json(messages);
}));

// GET /api/user/job-sites/:id/team - Get team members for specific job site
app.get('/api/user/job-sites/:id/team', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 1 FROM job_assignments 
      WHERE job_site_id = ? AND user_id = ?
    `, [id, userId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  const teamMembers = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_type,
        ja.role,
        ja.assigned_date
      FROM users u
      JOIN job_assignments ja ON u.id = ja.user_id
      WHERE ja.job_site_id = ?
      ORDER BY u.name
    `, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  res.json(teamMembers);
}));

// POST /api/user/job-sites/:id/messages - Send message from user to job site
app.post('/api/user/job-sites/:id/messages', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { message, message_type = 'question' } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 1 FROM job_assignments 
      WHERE job_site_id = ? AND user_id = ?
    `, [id, userId], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  // Insert message
  const messageId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO job_messages (
        job_site_id, admin_id, message, message_type, priority, send_sms
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [id, userId, message, message_type, 'normal', 0], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
  
  console.log(`✅ Message sent from user ${userId} to job site: ${id}`);
  res.json({ success: true, message_id: messageId });
}));

// Job Site Collaboration Endpoints

// GET /api/job-sites/:id/uploads - Get all uploads for a job site
app.get('/api/job-sites/:id/uploads', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.is_admin ? 'admin' : (req.user.user_type || 'subcontractor');
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    if (req.user.is_admin) {
      resolve(true);
    } else {
      db.get(`
        SELECT 1 FROM job_assignments 
        WHERE job_site_id = ? AND user_id = ?
      `, [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    }
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  // Get uploads based on user type (separate client/subcontractor views)
  const uploads = await new Promise((resolve, reject) => {
    let query = `
      SELECT 
        jsu.*,
        u.name as uploader_name
      FROM job_site_uploads jsu
      JOIN users u ON jsu.user_id = u.id
      WHERE jsu.job_site_id = ?
    `;
    
    // Filter based on user type for separation
    if (userType === 'client') {
      query += ` AND jsu.user_type IN ('admin', 'client')`;
    } else if (userType === 'subcontractor') {
      query += ` AND jsu.user_type IN ('admin', 'subcontractor')`;
    }
    // Admin sees all
    
    query += ` ORDER BY jsu.created_at DESC`;
    
    db.all(query, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  res.json(uploads);
}));

// POST /api/job-sites/:id/uploads - Upload file to job site
app.post('/api/job-sites/:id/uploads', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, category = 'other' } = req.body;
  const userId = req.user.id;
  const userType = req.user.is_admin ? 'admin' : (req.user.user_type || 'subcontractor');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    if (req.user.is_admin) {
      resolve(true);
    } else {
      db.get(`
        SELECT 1 FROM job_assignments 
        WHERE job_site_id = ? AND user_id = ?
      `, [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    }
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  // Determine file type
  const fileType = req.file.mimetype.startsWith('image/') ? 'photo' : 
                   req.file.mimetype.startsWith('video/') ? 'video' : 'document';
  
  // Save upload to database
  const uploadId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO job_site_uploads (
        job_site_id, user_id, user_type, file_name, file_path, file_type,
        file_size, mime_type, title, description, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, userId, userType, req.file.filename, req.file.path,
      fileType, req.file.size, req.file.mimetype, title, description, category
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
  
  // Log activity
  db.run(`
    INSERT INTO job_site_activity (
      job_site_id, user_id, user_type, activity_type, activity_description
    ) VALUES (?, ?, ?, 'upload', ?)
  `, [id, userId, userType, `Uploaded ${fileType}: ${title || req.file.filename}`]);
  
  res.json({ 
    success: true, 
    uploadId,
    message: 'File uploaded successfully',
    file: {
      id: uploadId,
      filename: req.file.filename,
      type: fileType,
      size: req.file.size
    }
  });
}));

// GET /api/job-sites/:id/comments - Get all comments for a job site
app.get('/api/job-sites/:id/comments', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.is_admin ? 'admin' : (req.user.user_type || 'subcontractor');
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    if (req.user.is_admin) {
      resolve(true);
    } else {
      db.get(`
        SELECT 1 FROM job_assignments 
        WHERE job_site_id = ? AND user_id = ?
      `, [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    }
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  // Get comments based on user type (separate client/subcontractor views)
  const comments = await new Promise((resolve, reject) => {
    let query = `
      SELECT 
        jsc.*,
        u.name as commenter_name
      FROM job_site_comments jsc
      JOIN users u ON jsc.user_id = u.id
      WHERE jsc.job_site_id = ?
    `;
    
    // Filter based on user type for separation
    if (userType === 'client') {
      query += ` AND jsc.user_type IN ('admin', 'client')`;
    } else if (userType === 'subcontractor') {
      query += ` AND jsc.user_type IN ('admin', 'subcontractor')`;
    }
    // Admin sees all
    
    query += ` ORDER BY jsc.created_at DESC`;
    
    db.all(query, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  res.json(comments);
}));

// POST /api/job-sites/:id/comments - Add comment to job site
app.post('/api/job-sites/:id/comments', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment, comment_type = 'update', priority = 'normal', reply_to = null } = req.body;
  const userId = req.user.id;
  const userType = req.user.is_admin ? 'admin' : (req.user.user_type || 'subcontractor');
  
  if (!comment || comment.trim().length === 0) {
    return res.status(400).json({ error: 'Comment is required' });
  }
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    if (req.user.is_admin) {
      resolve(true);
    } else {
      db.get(`
        SELECT 1 FROM job_assignments 
        WHERE job_site_id = ? AND user_id = ?
      `, [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    }
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  // Save comment to database
  const commentId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO job_site_comments (
        job_site_id, user_id, user_type, comment, comment_type, priority, reply_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, userType, comment, comment_type, priority, reply_to], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
  
  // Log activity
  db.run(`
    INSERT INTO job_site_activity (
      job_site_id, user_id, user_type, activity_type, activity_description
    ) VALUES (?, ?, ?, 'comment', ?)
  `, [id, userId, userType, `Added ${comment_type}: ${comment.substring(0, 50)}...`]);
  
  res.json({ 
    success: true, 
    commentId,
    message: 'Comment added successfully'
  });
}));

// GET /api/job-sites/:id/activity - Get activity log for a job site
app.get('/api/job-sites/:id/activity', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userType = req.user.is_admin ? 'admin' : (req.user.user_type || 'subcontractor');
  
  // Check if user has access to this job site
  const hasAccess = await new Promise((resolve, reject) => {
    if (req.user.is_admin) {
      resolve(true);
    } else {
      db.get(`
        SELECT 1 FROM job_assignments 
        WHERE job_site_id = ? AND user_id = ?
      `, [id, userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    }
  });
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this job site' });
  }
  
  // Get activity based on user type (separate client/subcontractor views)
  const activities = await new Promise((resolve, reject) => {
    let query = `
      SELECT 
        jsa.*,
        u.name as user_name
      FROM job_site_activity jsa
      JOIN users u ON jsa.user_id = u.id
      WHERE jsa.job_site_id = ?
    `;
    
    // Filter based on user type for separation
    if (userType === 'client') {
      query += ` AND jsa.user_type IN ('admin', 'client')`;
    } else if (userType === 'subcontractor') {
      query += ` AND jsa.user_type IN ('admin', 'subcontractor')`;
    }
    // Admin sees all
    
    query += ` ORDER BY jsa.created_at DESC LIMIT 50`;
    
    db.all(query, [id], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
  
  res.json(activities);
}));

// Function to automatically update SMS carrier mapping with new area codes
const updateSMSCarrierMapping = async (phoneNumber, carrier) => {
  try {
    // Extract area code from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const phone10 = cleanPhone.length === 11 && cleanPhone.startsWith('1') ? 
                   cleanPhone.substring(1) : cleanPhone;
    
    if (phone10.length !== 10) {
      throw new Error('Invalid phone number format');
    }
    
    const areaCode = phone10.substring(0, 3);
    const smsUtilPath = path.join(__dirname, 'utils', 'sms.js');
    
    // Read the current SMS utility file
    const smsContent = fs.readFileSync(smsUtilPath, 'utf8');
    
    // Map frontend carrier names to SMS utility carrier names
    // Note: Some carriers are mapped to their parent networks for better compatibility
    const carrierMapping = {
      'verizon': 'verizonCodes',
      'att': 'attCodes', 
      'tmobile': 'tmobileCodes',
      'sprint': 'tmobileCodes',      // Sprint is now part of T-Mobile
      'boost': 'attCodes',           // Boost Mobile uses AT&T network
      'cricket': 'attCodes',         // Cricket is owned by AT&T
      'uscellular': 'verizonCodes',  // US Cellular has roaming agreements with Verizon
      'metropcs': 'tmobileCodes',    // Metro by T-Mobile
      'virgin': 'tmobileCodes',      // Virgin Mobile uses T-Mobile network
      'tracfone': 'verizonCodes',    // TracFone primarily uses Verizon
      'other': 'verizonCodes'        // Default to Verizon for unknown carriers
    };
    
    const targetArray = carrierMapping[carrier.toLowerCase()];
    if (!targetArray) {
      console.log(`Unknown carrier: ${carrier}`);
      return;
    }
    
    // Check if area code is already in the target carrier array
    const carrierRegex = new RegExp(`const ${targetArray} = \\[([^\\]]+)\\]`, 's');
    const match = smsContent.match(carrierRegex);
    
    if (match) {
      const currentCodes = match[1];
      
      // Check if area code is already included
      if (currentCodes.includes(`'${areaCode}'`)) {
        console.log(`Area code ${areaCode} already exists in ${targetArray}`);
        return;
      }
      
      // Add the new area code to the array
      const updatedCodes = currentCodes.trim();
      const newCodesArray = updatedCodes + (updatedCodes.endsWith(',') ? '' : ',') + `\n    '${areaCode}' // Auto-added from user signup`;
      
      const updatedContent = smsContent.replace(
        carrierRegex,
        `const ${targetArray} = [${newCodesArray}\n  ]`
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(smsUtilPath, updatedContent, 'utf8');
      
      console.log(`✅ Added area code ${areaCode} to ${targetArray} in SMS utility`);
      
      // Also store this mapping in database for future reference
      await new Promise((resolve, reject) => {
        // Create area_code_mappings table if it doesn't exist
        db.run(`
          CREATE TABLE IF NOT EXISTS area_code_mappings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            area_code TEXT NOT NULL,
            carrier TEXT NOT NULL,
            phone_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(area_code, carrier)
          )
        `, (err) => {
          if (err) {
            reject(err);
          } else {
            // Insert the mapping
            db.run(`
              INSERT OR IGNORE INTO area_code_mappings (area_code, carrier, phone_number)
              VALUES (?, ?, ?)
            `, [areaCode, carrier, phoneNumber], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.changes);
              }
            });
          }
        });
      });
      
    } else {
      console.log(`Could not find ${targetArray} array in SMS utility file`);
    }
    
  } catch (error) {
    console.error('Error updating SMS carrier mapping:', error);
    throw error;
  }
};

// PUT /api/user/profile/phone - Update user phone number and SMS preferences
app.put('/api/user/profile/phone', authenticate, asyncHandler(async (req, res) => {
  const { phone_number, sms_notifications = true, carrier } = req.body;
  const userId = req.user.id;
  
  // Validate phone number if provided
  if (phone_number && !isValidPhoneNumber(phone_number)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }
  
  // Add carrier column if it doesn't exist
  await new Promise((resolve, reject) => {
    db.run(`ALTER TABLE users ADD COLUMN carrier TEXT`, (err) => {
      // Ignore error if column already exists
      resolve();
    });
  });
  
  // Update user's phone settings including carrier
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE users 
      SET phone_number = ?, sms_notifications = ?, carrier = ?
      WHERE id = ?
    `, [phone_number ? formatPhoneNumber(phone_number) : null, sms_notifications ? 1 : 0, carrier || null, userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
  
  // If phone number and carrier are provided, update the SMS utility file
  if (phone_number && carrier && ['verizon', 'att', 'tmobile', 'sprint', 'boost', 'cricket', 'uscellular', 'metropcs', 'virgin', 'tracfone', 'other'].includes(carrier)) {
    try {
      await updateSMSCarrierMapping(phone_number, carrier);
      console.log(`📱 Added area code mapping: ${phone_number} -> ${carrier}`);
    } catch (error) {
      console.error('Error updating SMS carrier mapping:', error);
      // Don't fail the request if SMS mapping update fails
    }
  }
  
  console.log(`✅ Phone settings updated for user: ${userId}`);
  res.json({ success: true, message: 'Phone settings updated successfully' });
}));

// SMS test endpoint removed - using email notifications only

// POST /api/admin/bulk-email - Send bulk email to multiple users
app.post('/api/admin/bulk-email', authenticateAdmin, asyncHandler(async (req, res) => {
  const { subject, message, userIds } = req.body;
  
  if (!subject || !message || !userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: 'Subject, message and user IDs are required' });
  }
  
  try {
    console.log(`📧 Sending bulk email to ${userIds.length} users`);
    
    const results = [];
    
    // Fetch users with email addresses
    const users = await new Promise((resolve, reject) => {
      const placeholders = userIds.map(() => '?').join(',');
      db.all(`
        SELECT id, name, email 
        FROM users 
        WHERE id IN (${placeholders}) 
        AND email IS NOT NULL 
        AND email != ''
      `, userIds, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Send email to each user
    for (const user of users) {
      try {
        const emailMessage = `
          <h2>🏗️ Veritas Building Group</h2>
          <p>Hello ${user.name},</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e67e22;">
            <p style="font-size: 16px; line-height: 1.5; margin: 0;">${message}</p>
          </div>
          
          <p>Please log in to your dashboard for any additional details or actions.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background: #e67e22; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a></p>
          
          <p>Best regards,<br>Veritas Building Group Team</p>
        `;
        
        await sendEmail({
          to: user.email,
          subject: subject,
          html: emailMessage
        });
        
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          status: 'sent'
        });
        
        console.log(`✅ Bulk email sent to ${user.name} (${user.email})`);
        
      } catch (error) {
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          status: 'failed',
          error: error.message
        });
        
        console.log(`❌ Failed to send bulk email to ${user.name}:`, error.message);
      }
    }
    
    const successCount = results.filter(r => r.status === 'sent').length;
    const failCount = results.filter(r => r.status === 'failed').length;
    
    res.json({
      success: true,
      message: `Bulk email sent to ${successCount} users, ${failCount} failed`,
      results,
      stats: {
        total: results.length,
        sent: successCount,
        failed: failCount
      }
    });
    
  } catch (error) {
    console.error('Bulk Email Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send bulk email: ' + error.message 
    });
  }
}));

// ===== NOTIFICATION PREFERENCES ENDPOINTS =====

// GET /api/user/notification-preferences - Get user's notification preferences
app.get('/api/user/notification-preferences', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const preferences = await new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        // If no preferences exist, return defaults
        if (!row) {
          resolve({
            user_id: userId,
            job_assignments: true,
            job_updates: true,
            safety_alerts: true,
            schedule_changes: true,
            general_messages: true,
            admin_announcements: true
          });
        } else {
          resolve(row);
        }
      }
    });
  });
  
  res.json(preferences);
}));

// PUT /api/user/notification-preferences - Update user's notification preferences
app.put('/api/user/notification-preferences', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    job_assignments,
    job_updates,
    safety_alerts,
    schedule_changes,
    general_messages,
    admin_announcements,
    contract_notifications,
    estimate_notifications,
    invoice_notifications,
    document_notifications
  } = req.body;
  
  // Insert or update preferences
  await new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO notification_preferences (
        user_id, job_assignments, job_updates, safety_alerts, 
        schedule_changes, general_messages, admin_announcements,
        contract_notifications, estimate_notifications, invoice_notifications, document_notifications,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      userId,
      job_assignments ? 1 : 0,
      job_updates ? 1 : 0,
      safety_alerts ? 1 : 0,
      schedule_changes ? 1 : 0,
      general_messages ? 1 : 0,
      admin_announcements ? 1 : 0,
      contract_notifications ? 1 : 0,
      estimate_notifications ? 1 : 0,
      invoice_notifications ? 1 : 0,
      document_notifications ? 1 : 0
    ], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  
  res.json({ success: true, message: 'Notification preferences updated successfully' });
}));

// GET /api/admin/notification-preferences/:userId - Get user's notification preferences (admin)
app.get('/api/admin/notification-preferences/:userId', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const preferences = await new Promise((resolve, reject) => {
    db.get(`
      SELECT np.*, u.name, u.email FROM notification_preferences np
      JOIN users u ON np.user_id = u.id
      WHERE np.user_id = ?
    `, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          // Get user info and return defaults
          db.get('SELECT name, email FROM users WHERE id = ?', [userId], (err2, user) => {
            if (err2) {
              reject(err2);
            } else {
              resolve({
                user_id: userId,
                name: user?.name,
                email: user?.email,
                job_assignments: true,
                job_updates: true,
                safety_alerts: true,
                schedule_changes: true,
                general_messages: true,
                admin_announcements: true
              });
            }
          });
        } else {
          resolve(row);
        }
      }
    });
  });
  
  res.json(preferences);
}));

// Helper function to check if user wants specific notification type
const shouldSendNotification = async (userId, notificationType) => {
  return new Promise((resolve) => {
    db.get(`
      SELECT ${notificationType} FROM notification_preferences WHERE user_id = ?
    `, [userId], (err, row) => {
      if (err || !row) {
        // Default to true if no preferences found or error
        resolve(true);
      } else {
        resolve(row[notificationType] === 1);
      }
    });
  });
};

// ===== ADMIN DOCUMENT MANAGEMENT ENDPOINTS =====

// GET /api/admin/documents - Get all documents
app.get('/api/admin/documents', authenticateAdmin, asyncHandler(async (req, res) => {
  const documents = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        d.*,
        u.name as user_name,
        u.company_name as company_name,
        js.name as job_site_name
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN job_sites js ON d.job_site_id = js.id
      ORDER BY d.uploaded_at DESC
    `, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  res.json(documents);
}));

// POST /api/admin/documents/upload - Upload document
app.post('/api/admin/documents/upload', authenticateAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { name, type, job_site_id, assigned_user_id, expires_at } = req.body;
  const uploadedByUserId = req.user.id;
  const assignedUserId = assigned_user_id || uploadedByUserId;
  
  // Insert document record
  const documentId = await new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO documents (
        filename, original_name, description, document_type, mime_type, size, user_id, job_site_id, expires_at, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      req.file.filename,
      req.file.originalname,
      name || req.file.originalname.split('.')[0],
      type || 'other',
      req.file.mimetype,
      req.file.size,
      assignedUserId,
      job_site_id || null,
      expires_at ? new Date(expires_at).toISOString() : null
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });

  res.json({ 
    success: true, 
    documentId,
    message: 'Document uploaded successfully'
  });
}));

// GET /api/admin/documents/:id/download - Download document
app.get('/api/admin/documents/:id/download', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const document = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(__dirname, 'uploads', document.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  res.download(filePath, document.original_name);
}));

// DELETE /api/admin/documents/:id - Delete document
app.delete('/api/admin/documents/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get document info first
  const document = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Delete from database
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM documents WHERE id = ?', [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  // Delete file from disk
  const filePath = path.join(__dirname, 'uploads', document.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ success: true, message: 'Document deleted successfully' });
}));

// PUT /api/admin/documents/:id - Update document metadata
app.put('/api/admin/documents/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, document_type, job_site_id, user_id } = req.body;
  
  console.log('Updating document:', id, { description, document_type, job_site_id, user_id });
  
  // Check if document exists
  const document = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Update document
  await new Promise((resolve, reject) => {
    db.run(`
      UPDATE documents 
      SET description = ?, document_type = ?, job_site_id = ?, user_id = ?
      WHERE id = ?
    `, [
      description || document.description,
      document_type || document.document_type,
      job_site_id || null,
      user_id || document.user_id,
      id
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  res.json({ success: true, message: 'Document updated successfully' });
}));

// Admin endpoint to request document update from user
app.post('/api/admin/request-document-update', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId, userEmail, userName } = req.body;
  
  console.log(`Document update request: userId=${userId}, userEmail=${userEmail}, userName=${userName}`);
  
  if (!userId || !userEmail || !userName) {
    return res.status(400).json({ error: 'Missing required fields: userId, userEmail, userName' });
  }
  
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, logging request instead');
      console.log(`Document update request for user ${userName} (${userEmail}) - ID: ${userId}`);
      return res.json({ 
        message: 'Document update request logged successfully (email not configured)',
        details: `Request logged for ${userName} (${userEmail})`
      });
    }
    
    // Send email notification to user using existing email utility
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 50%, #eab308 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🏗️ Veritas Building Group</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Document Update Required</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${userName},</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
            We need you to update some of your documents that are expiring or have expired. 
            Please log in to your account and upload the latest versions of your documents.
          </p>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              ⚠️ <strong>Action Required:</strong> Please update your expired documents as soon as possible to maintain compliance.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/document" 
               style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Update Documents
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If you have any questions or need assistance, please contact our support team.
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">© 2024 Veritas Building Group. All rights reserved.</p>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: userEmail,
      subject: 'Document Update Required - Veritas Building Group',
      html: emailHtml
    });
    
    console.log(`Document update request email sent to ${userEmail} for user ${userName}`);
    
    // Create in-app notification for the user
    try {
      await new Promise((resolve, reject) => {
        const notificationQuery = `
          INSERT INTO notifications (user_id, type, title, message, created_at, read_status)
          VALUES (?, ?, ?, ?, datetime('now'), 0)
        `;
        
        db.run(notificationQuery, [
          userId,
          'document_update_request',
          'Document Update Required',
          'Please update your expired documents to maintain compliance. Check your email for details.'
        ], function(err) {
          if (err) {
            console.error('Error creating notification:', err);
            // Don't fail the request if notification creation fails
            resolve();
          } else {
            console.log(`In-app notification created for user ${userId}`);
            resolve();
          }
        });
      });
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError);
      // Continue - don't fail the main request
    }
    
    res.json({ message: 'Document update request sent successfully' });
    
  } catch (error) {
    console.error('Error sending document update request email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send document update request';
    if (error.message && error.message.includes('auth')) {
      errorMessage = 'Email authentication failed - please check email configuration';
    } else if (error.message && error.message.includes('connect')) {
      errorMessage = 'Email service connection failed';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Admin endpoint to request a specific document from a user
app.post('/api/admin/request-document', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId, documentType, message } = req.body;
  
  console.log(`📄 Document request: userId=${userId}, type=${documentType}`);
  
  if (!userId || !documentType) {
    return res.status(400).json({ error: 'Missing required fields: userId, documentType' });
  }
  
  try {
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Document type labels
    const docTypeLabels = {
      'w9': 'W-9 Form',
      'insurance': 'Certificate of Insurance',
      'license': 'Business License',
      'id': 'Government ID',
      'contract': 'Signed Contract',
      'invoice': 'Invoice',
      'other': 'Document'
    };
    
    const docLabel = docTypeLabels[documentType] || documentType;
    
    // Create notification for the user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO notifications (user_id, type, title, message, created_at, read_status)
         VALUES (?, 'document_request', ?, ?, datetime('now'), 0)`,
        [
          userId,
          `${docLabel} Requested`,
          message || `Please upload your ${docLabel}. Go to Documents to upload.`
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Send email notification
    try {
      const { sendEmail } = await import('./utils/email.js');
      await sendEmail({
        to: user.email,
        subject: `Document Request: ${docLabel} - Veritas Building Group`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Veritas Building Group</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Document Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${user.name},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We need you to upload the following document:
              </p>
              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px 20px; margin: 20px 0;">
                <p style="color: #0f766e; margin: 0; font-size: 18px; font-weight: 600;">📄 ${docLabel}</p>
                ${message ? `<p style="color: #4b5563; margin: 10px 0 0 0; font-style: italic;">"${message}"</p>` : ''}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.veribuilds.com/documents" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Upload Document</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">Veritas Building Group</p>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">info@veribuilds.com | (360) 229-5524</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });
      console.log(`✅ Document request email sent to ${user.email}`);
    } catch (emailError) {
      console.warn('Email sending failed:', emailError.message);
    }
    
    res.json({ success: true, message: `Document request sent to ${user.name}` });
    
  } catch (error) {
    console.error('Error requesting document:', error);
    res.status(500).json({ error: 'Failed to send document request' });
  }
}));

// Admin endpoint to send a document to a user
app.post('/api/admin/send-document', authenticateAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  const { userId, message } = req.body;
  const file = req.file;
  
  console.log(`📤 Sending document to user ${userId}`);
  
  if (!userId || !file) {
    return res.status(400).json({ error: 'Missing required fields: userId, file' });
  }
  
  try {
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Save document to database (as admin-sent document)
    const docId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (user_id, document_type, filename, original_name, description, status, uploaded_at, admin_notes)
         VALUES (?, 'admin_sent', ?, ?, ?, 'approved', datetime('now'), ?)`,
        [userId, file.filename, file.originalname, `Document from Admin: ${file.originalname}`, message || 'Sent by admin'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // Create notification for the user
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO notifications (user_id, type, title, message, created_at, read_status)
         VALUES (?, 'document_received', 'New Document Received', ?, datetime('now'), 0)`,
        [userId, `You have received a new document: ${file.originalname}. ${message || ''}`],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Send email notification
    try {
      const { sendEmail } = await import('./utils/email.js');
      await sendEmail({
        to: user.email,
        subject: `New Document: ${file.originalname} - Veritas Building Group`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Veritas Building Group</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">New Document</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${user.name},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have received a new document from Veritas Building Group:
              </p>
              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px 20px; margin: 20px 0;">
                <p style="color: #0f766e; margin: 0; font-size: 18px; font-weight: 600;">📎 ${file.originalname}</p>
                ${message ? `<p style="color: #4b5563; margin: 10px 0 0 0; font-style: italic;">"${message}"</p>` : ''}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.veribuilds.com/documents" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Documents</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">Veritas Building Group</p>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 12px;">info@veribuilds.com | (360) 229-5524</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });
      console.log(`✅ Document sent email notification to ${user.email}`);
    } catch (emailError) {
      console.warn('Email sending failed:', emailError.message);
    }
    
    res.json({ success: true, message: `Document sent to ${user.name}`, documentId: docId });
    
  } catch (error) {
    console.error('Error sending document:', error);
    res.status(500).json({ error: 'Failed to send document' });
  }
}));

// User endpoint to send a document to admin
app.post('/api/user/send-document-to-admin', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  const { documentType, message } = req.body;
  const file = req.file;
  const userId = req.user.id;
  
  console.log(`📤 User ${userId} sending document to admin`);
  
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Document type labels
    const docTypeLabels = {
      'w9': 'W-9 Form',
      'insurance': 'Certificate of Insurance',
      'license': 'Business License',
      'id': 'Government ID',
      'contract': 'Signed Contract',
      'invoice': 'Invoice',
      'other': 'Document'
    };
    
    const docLabel = docTypeLabels[documentType] || documentType || 'Document';
    
    // Save document to database
    const docId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (user_id, document_type, filename, original_name, description, status, uploaded_at, admin_notes)
         VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'), ?)`,
        [userId, documentType || 'other', file.filename, file.originalname, `${docLabel} - Sent to Admin`, message || 'Sent by user'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    // Create notification for all admins
    const admins = await new Promise((resolve, reject) => {
      db.all("SELECT id FROM users WHERE is_admin = 1", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    const notificationMessage = `${user.name} sent a ${docLabel}: ${file.originalname}. ${message || ''}`;
    for (const admin of admins) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO notifications (user_id, type, title, message, created_at, read_status)
           VALUES (?, 'document_received', ?, ?, datetime('now'), 0)`,
          [admin.id, `New Document from ${user.name}`, notificationMessage],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log(`📬 Created notifications for ${admins.length} admin(s)`);
    
    // Send email to admin
    try {
      const { sendEmail } = await import('./utils/email.js');
      await sendEmail({
        to: 'info@veribuilds.com',
        subject: `New Document from ${user.name}: ${docLabel}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Veritas Building Group</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">New Document Received</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Document from ${user.name}</h2>
              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px 20px; margin: 20px 0;">
                <p style="color: #0f766e; margin: 0; font-size: 18px; font-weight: 600;">📎 ${docLabel}: ${file.originalname}</p>
                ${message ? `<p style="color: #4b5563; margin: 10px 0 0 0; font-style: italic;">"${message}"</p>` : ''}
              </div>
              <p style="color: #4b5563; font-size: 14px;">From: ${user.name} (${user.email})</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.veribuilds.com/admin/documents" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View in Admin Panel</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });
      console.log(`✅ Admin notification email sent`);
    } catch (emailError) {
      console.warn('Email sending failed:', emailError.message);
    }
    
    res.json({ success: true, message: 'Document sent to admin successfully', documentId: docId });
    
  } catch (error) {
    console.error('Error sending document to admin:', error);
    res.status(500).json({ error: 'Failed to send document' });
  }
}));

// User endpoint to request a document from admin
app.post('/api/user/request-document-from-admin', authenticate, asyncHandler(async (req, res) => {
  const { documentType, message } = req.body;
  const userId = req.user.id;
  
  console.log(`📄 User ${userId} requesting document from admin`);
  
  if (!documentType) {
    return res.status(400).json({ error: 'Document type is required' });
  }
  
  try {
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Document type labels
    const docTypeLabels = {
      'w9': 'W-9 Form (Company)',
      'insurance': 'Certificate of Insurance',
      'contract': 'Contract Copy',
      'estimate': 'Estimate/Quote',
      'invoice': 'Invoice Copy',
      'receipt': 'Receipt',
      'other': 'Document'
    };
    
    const docLabel = docTypeLabels[documentType] || documentType;
    
    // Create notification for all admins
    const admins = await new Promise((resolve, reject) => {
      db.all("SELECT id FROM users WHERE is_admin = 1", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    const notificationMessage = `${user.name} is requesting: ${docLabel}. ${message || ''}`;
    for (const admin of admins) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO notifications (user_id, type, title, message, created_at, read_status)
           VALUES (?, 'document_request', ?, ?, datetime('now'), 0)`,
          [admin.id, `Document Request from ${user.name}`, notificationMessage],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log(`📬 Created document request notifications for ${admins.length} admin(s)`);
    
    // Send email to admin
    try {
      const { sendEmail } = await import('./utils/email.js');
      await sendEmail({
        to: 'info@veribuilds.com',
        subject: `Document Request from ${user.name}: ${docLabel}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Veritas Building Group</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Document Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">${user.name} is requesting a document</h2>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 18px; font-weight: 600;">📄 Requested: ${docLabel}</p>
                ${message ? `<p style="color: #4b5563; margin: 10px 0 0 0; font-style: italic;">"${message}"</p>` : ''}
              </div>
              <p style="color: #4b5563; font-size: 14px;">From: ${user.name} (${user.email})</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.veribuilds.com/admin/users" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Send Document to User</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });
      console.log(`✅ Admin notification email sent for document request`);
    } catch (emailError) {
      console.warn('Email sending failed:', emailError.message);
    }
    
    res.json({ success: true, message: 'Document request sent to admin' });
    
  } catch (error) {
    console.error('Error requesting document from admin:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
}));

// Get user notifications
app.get('/api/notifications', authenticate, asyncHandler(async (req, res) => {
  console.log(`📬 GET /api/notifications - User: ${req.user.id}`);
  
  try {
    // Fetch notifications for the authenticated user
    const notifications = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, type, title, message, created_at, read_status, read_at 
         FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
    
    // Transform notifications to match frontend format
    const transformedNotifications = notifications.map((notification, index) => ({
      id: notification.id,
      type: notification.type === 'document_update_request' ? 'warning' : 'info',
      title: notification.title,
      message: notification.message,
      time: new Date(notification.created_at).toLocaleString(),
      read: notification.read_status === 1
    }));
    
    console.log(`📬 Found ${transformedNotifications.length} notifications for user ${req.user.id}`);
    res.json(transformedNotifications);
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Mark notification as read
app.put('/api/notifications/:id/read', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`📬 PUT /api/notifications/${id}/read - User: ${req.user.id}`);
  
  try {
    // Update notification read status
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE notifications 
         SET read_status = 1, read_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        [id, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log(`📬 Notification ${id} marked as read for user ${req.user.id}`);
    res.json({ message: 'Notification marked as read' });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Test notification endpoint (admin only)
app.post('/api/admin/test-notification', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId, type } = req.body;
  
  console.log(`🧪 Testing notification for user ${userId}, type: ${type}`);
  
  try {
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (type === 'document_upload') {
      // Test document upload notification
      await createNotification(
        userId,
        'document_uploaded',
        'Test: New Document Uploaded',
        'This is a test notification for a document upload.'
      );
      
      await sendDocumentNotificationEmail(
        user.email,
        user.name,
        'Test Document.pdf',
        'Test',
        null
      );
      
      res.json({ 
        success: true, 
        message: 'Document upload notification sent',
        user: user.name,
        email: user.email
      });
      
    } else if (type === 'document_expiry') {
      // Test document expiry notification
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);
      
      await createNotification(
        userId,
        'document_expiring',
        'Test: Document Expiring Soon',
        'This is a test notification for a document expiring in 3 days.'
      );
      
      await sendExpiryWarningEmail(
        user.email,
        user.name,
        'Test Document.pdf',
        expiryDate.toISOString()
      );
      
      // Also notify admin
      await createNotification(
        req.user.id,
        'document_expiring',
        'Test: User Document Expiring',
        `${user.name}'s document "Test Document.pdf" expires in 3 days.`
      );
      
      res.json({ 
        success: true, 
        message: 'Document expiry notification sent',
        user: user.name,
        email: user.email,
        adminNotified: true
      });
      
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "document_upload" or "document_expiry"' });
    }
    
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ 
      error: 'Failed to send test notification',
      details: error.message
    });
  }
}));

// Delete individual notification
app.delete('/api/notifications/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE /api/notifications/${id} - User: ${req.user.id}`);
  
  try {
    // Delete notification (only if it belongs to the user)
    await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
        [id, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log(`🗑️ Notification ${id} deleted for user ${req.user.id}`);
    res.json({ message: 'Notification deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      error: 'Failed to delete notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Clear all notifications for user
app.delete('/api/notifications', authenticate, asyncHandler(async (req, res) => {
  console.log(`🗑️ DELETE /api/notifications (clear all) - User: ${req.user.id}`);
  
  try {
    // Delete all notifications for the user
    await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM notifications WHERE user_id = ?`,
        [req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log(`🗑️ All notifications cleared for user ${req.user.id}`);
    res.json({ message: 'All notifications cleared successfully' });
    
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ 
      error: 'Failed to clear notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

// Admin endpoint to manually trigger expiry check
app.post('/api/admin/check-expiring-documents', authenticateAdmin, asyncHandler(async (req, res) => {
  console.log('🔔 Manually triggering expiry check by admin:', req.user.email);
  
  try {
    await checkExpiringDocuments();
    res.json({ 
      success: true, 
      message: 'Expiry check completed. Notifications sent for expiring documents.' 
    });
  } catch (error) {
    console.error('Error running expiry check:', error);
    res.status(500).json({ 
      error: 'Failed to check expiring documents',
      details: error.message
    });
  }
}));

// Admin endpoint to delete expired documents for a user
app.delete('/api/admin/users/:userId/expired-documents', authenticateAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  console.log(`Deleting expired documents for user ${userId} by admin ${req.user.id}`);
  
  // Get all expired documents for the user
  const expiredDocuments = await new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM documents 
      WHERE user_id = ? AND expires_at < datetime('now')
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Database error fetching expired documents:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
  
  if (expiredDocuments.length === 0) {
    return res.json({ message: 'No expired documents found for this user' });
  }
  
  // Delete document files from filesystem
  for (const doc of expiredDocuments) {
    if (doc.filename) {
      const filePath = path.join(__dirname, 'uploads', doc.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${filePath}`);
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error);
        }
      }
    }
  }
  
  // Delete document records from database
  await new Promise((resolve, reject) => {
    db.run(`
      DELETE FROM documents 
      WHERE user_id = ? AND expires_at < datetime('now')
    `, [userId], function(err) {
      if (err) {
        console.error('Database error deleting expired documents:', err);
        reject(err);
      } else {
        console.log(`Deleted ${this.changes} expired documents for user ${userId}`);
        resolve();
      }
    });
  });
  
  console.log(`Successfully deleted ${expiredDocuments.length} expired documents for user ${userId}`);
  res.json({ 
    message: `Successfully deleted ${expiredDocuments.length} expired documents`,
    deletedCount: expiredDocuments.length
  });
}));

// Cal.com appointment email endpoint
app.post('/api/send-appointment-email', asyncHandler(async (req, res) => {
  const { to, type, appointment } = req.body;

  if (!to || !type || !appointment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { title, userName, userEmail, userPhone, date, time, adminName, adminEmail, uid } = appointment;

  let subject, html;

  if (type === 'admin') {
    // Email to admin (Niko)
    subject = `New Appointment Scheduled: ${title}`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Appointment Scheduled</h2>
        <p>You have a new appointment scheduled through VBG:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${title}</h3>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Client:</strong> ${userName}</p>
          <p><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
          ${userPhone ? `<p><strong>Phone:</strong> ${userPhone}</p>` : ''}
          ${uid ? `<p><strong>Booking ID:</strong> ${uid}</p>` : ''}
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This appointment has been added to your calendar.
        </p>
      </div>
    `;
  } else {
    // Email to user
    subject = `Appointment Confirmed: ${title}`;
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Confirmed</h2>
        <p>Thank you for scheduling an appointment with Veritas Building Group!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${title}</h3>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>With:</strong> ${adminName || 'Niko'}</p>
          <p><strong>Contact:</strong> <a href="mailto:${adminEmail}">${adminEmail}</a></p>
        </div>
        
        <p>We look forward to meeting with you!</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you need to reschedule or cancel, please contact us at ${adminEmail}
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          Veritas Building Group<br/>
          ${adminEmail}
        </p>
      </div>
    `;
  }

  try {
    await sendEmail({ to, subject, html });
    console.log(`✅ Appointment email sent to ${to}`);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Failed to send appointment email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}));

// Look up user by email (for Cal.com webhook)
app.get('/api/user-by-email', asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, user_type FROM users WHERE email = ? AND is_verified = 1', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`📧 User lookup by email: ${email} -> Found user ID ${user.id}`);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      user_type: user.user_type
    });
  } catch (error) {
    console.error('❌ Error looking up user by email:', error);
    res.status(500).json({ error: 'Database error' });
  }
}));

// ============================================
// Twenty CRM Integration Endpoints - DISABLED
// Using VBG database as CRM instead
// ============================================

/*
// These endpoints are disabled - we're using the VBG database as our CRM
// Contact data is stored directly in the users table

// Admin endpoint to sync a single user to CRM
app.post('/api/admin/crm/sync-user/:userId', authenticateAdmin, asyncHandler(async (req, res) => {
  // DISABLED - using VBG database as CRM
  res.status(410).json({ error: 'This endpoint is no longer available. Using VBG database as CRM.' });
}));

// Admin endpoint to sync all users to CRM
app.post('/api/admin/crm/sync-all-users', authenticateAdmin, asyncHandler(async (req, res) => {
  // DISABLED - using VBG database as CRM
  res.status(410).json({ error: 'This endpoint is no longer available. Using VBG database as CRM.' });
}));

// Admin endpoint to check CRM health
app.get('/api/admin/crm/health', authenticateAdmin, asyncHandler(async (req, res) => {
  // DISABLED - using VBG database as CRM
  res.status(410).json({ error: 'This endpoint is no longer available. Using VBG database as CRM.' });
}));

// Admin endpoint to get all people from CRM
app.get('/api/admin/crm/people', authenticateAdmin, asyncHandler(async (req, res) => {
  // DISABLED - using VBG database as CRM
  res.status(410).json({ error: 'This endpoint is no longer available. Using VBG database as CRM.' });
}));

// Admin endpoint to get all companies from CRM
app.get('/api/admin/crm/companies', authenticateAdmin, asyncHandler(async (req, res) => {
  // DISABLED - using VBG database as CRM
  res.status(410).json({ error: 'This endpoint is no longer available. Using VBG database as CRM.' });
}));
*/

// Admin endpoint to get all contacts from VBG database
app.get('/api/admin/crm/contacts', authenticateAdmin, asyncHandler(async (req, res) => {
  console.log(`[CRM] Admin ${req.user.id} requesting all contacts`);
  
  try {
    const contacts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          id, 
          name, 
          email, 
          phone_number, 
          company_name, 
          user_type,
          created_at,
          is_verified
        FROM users 
        ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Format contacts
    const formattedContacts = contacts.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      phone: user.phone_number || '',
      company: user.company_name || '',
      userType: user.user_type || 'client',
      createdAt: user.created_at,
      verified: user.is_verified === 1
    }));
    
    console.log(`[CRM] Returning ${formattedContacts.length} contacts`);
    res.json(formattedContacts);
  } catch (error) {
    console.error('[CRM] Error fetching contacts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      details: error.message
    });
  }
}));

// Admin endpoint to send bulk email using Resend
app.post('/api/admin/send-bulk-email', authenticateAdmin, asyncHandler(async (req, res) => {
  const { recipients, subject, body } = req.body;
  
  console.log(`[CRM] Admin ${req.user.id} sending bulk email to ${recipients.length} recipients`);
  
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required' });
  }
  
  if (!subject || !body) {
    return res.status(400).json({ error: 'Subject and body are required' });
  }
  
  try {
    // Initialize Resend
    const { Resend } = await import('resend');
    const resend = new Resend('re_SGMykm1U_J72Lzj5gtchrqumycJREwgLs');
    
    const results = [];
    
    // Send emails using Resend
    for (const recipient of recipients) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Veritas Building Group <info@veribuilds.com>',
          to: [recipient.email],
          subject: subject,
          html: body.replace(/\n/g, '<br>')
        });
        
        if (error) {
          console.error(`[CRM] Failed to send email to ${recipient.email}:`, error);
          results.push({ email: recipient.email, success: false, error: error.message });
        } else {
          console.log(`[CRM] Email sent to ${recipient.email}`);
          results.push({ email: recipient.email, success: true, messageId: data.id });
        }
      } catch (emailError) {
        console.error(`[CRM] Error sending to ${recipient.email}:`, emailError);
        results.push({ email: recipient.email, success: false, error: emailError.message });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Sent ${successCount} emails successfully, ${failCount} failed`,
      results
    });
  } catch (error) {
    console.error('[CRM] Error in bulk email:', error);
    res.status(500).json({ 
      error: 'Failed to send bulk email',
      details: error.message
    });
  }
}));

// Admin endpoint to log call to CRM
app.post('/api/admin/crm/log-call', authenticateAdmin, asyncHandler(async (req, res) => {
  const { contactId, duration, notes } = req.body;
  
  console.log(`[CRM] Admin ${req.user.id} logging call for contact ${contactId}`);
  
  if (!contactId || !notes) {
    return res.status(400).json({ error: 'Contact ID and notes are required' });
  }
  
  try {
    // Log to database
    await pool.query(
      'INSERT INTO crm_activities (contact_id, activity_type, notes, duration, created_by, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [contactId, 'call', notes, duration || null, req.user.id]
    );
    
    res.json({ success: true, message: 'Call logged successfully' });
  } catch (error) {
    console.error('[CRM] Error logging call:', error);
    res.status(500).json({ 
      error: 'Failed to log call',
      details: error.message
    });
  }
}));

// ============================================
// PUBLIC CONTACT FORM ENDPOINT
// ============================================

// Public endpoint for website contact form submissions
app.post('/api/contact', asyncHandler(async (req, res) => {
  const { name, email, phone, company, message, source } = req.body;
  
  console.log('[Contact Form] New submission received:', { name, email, company });
  
  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      error: 'Name, email, and message are required' 
    });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email address' 
    });
  }
  
  try {
    // Check if contact already exists
    const existingContact = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, user_type FROM users WHERE email = ?',
        [email.toLowerCase()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    let contactId;
    
    if (existingContact) {
      console.log('[Contact Form] User already exists:', existingContact.id, 'Type:', existingContact.user_type);
      
      // Return a message telling them they already have an account
      return res.status(200).json({
        success: false,
        accountExists: true,
        message: `It looks like you already have an account with us! Please log in at ${req.protocol}://${req.get('host')}/login or use the "Forgot Password" option if you need to reset your password.`,
        loginUrl: `${req.protocol}://${req.get('host')}/login`
      });
    } else {
      // Create new contact/lead in database
      // Generate a random password for leads (they won't use it to login)
      const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      
      contactId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users (
            name, 
            email, 
            password,
            phone, 
            company_name, 
            user_type, 
            is_verified,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            name,
            email.toLowerCase(),
            randomPassword,
            phone || null,
            company || null,
            'lead', // Mark as lead instead of client/subcontractor
            0 // Not verified
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      console.log('[Contact Form] New contact created with ID:', contactId);
    }
    
    // Send notification email to admins using Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend('re_SGMykm1U_J72Lzj5gtchrqumycJREwgLs');
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #111827; margin-top: 0;">Contact Details</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><a href="tel:${phone}">${phone}</a></td>
                </tr>
                ` : ''}
                ${company ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Company:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>Source:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${source || 'Website Contact Form'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><strong>CRM ID:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">#${contactId}</td>
                </tr>
              </table>
              
              <div style="margin-top: 25px; padding: 20px; background: #f3f4f6; border-radius: 6px;">
                <h3 style="color: #111827; margin-top: 0;">Message:</h3>
                <p style="color: #374151; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
              
              <div style="margin-top: 25px; padding: 15px; background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Action Required:</strong> This lead has been added to your CRM. 
                  <a href="http://app.veribuilds.com/admin/crm" style="color: #2563eb;">View in CRM →</a>
                </p>
              </div>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This is an automated notification from Veritas Building Group CRM</p>
          </div>
        </div>
      `;
      
      // Send to admin emails
      await resend.emails.send({
        from: 'Veritas Building Group <info@veribuilds.com>',
        to: ['niko@veribuilds.com', 'info@veribuilds.com'],
        subject: `New Contact Form Submission - ${name}`,
        html: emailHtml
      });
      
      console.log('[Contact Form] Admin notification sent');
      
      // Send confirmation email to the contact
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thank You for Contacting Us</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for reaching out to Veritas Building Group. We've received your message and one of our team members will get back to you shortly.
              </p>
              
              <div style="margin: 25px 0; padding: 20px; background: #f3f4f6; border-radius: 6px;">
                <h3 style="color: #111827; margin-top: 0;">Your Message:</h3>
                <p style="color: #374151; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                In the meantime, feel free to explore our services at <a href="https://veribuilds.com" style="color: #14b8a6;">veribuilds.com</a>
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The Veritas Building Group Team</strong>
              </p>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Veritas Building Group | Built for Strength. Designed for Life.</p>
            <p><a href="mailto:info@veribuilds.com" style="color: #14b8a6;">info@veribuilds.com</a></p>
          </div>
        </div>
      `;
      
      await resend.emails.send({
        from: 'Veritas Building Group <info@veribuilds.com>',
        to: [email],
        subject: 'Thank you for contacting Veritas Building Group',
        html: confirmationHtml
      });
      
      console.log('[Contact Form] Confirmation email sent to contact');
      
    } catch (emailError) {
      console.error('[Contact Form] Error sending emails:', emailError);
      // Don't fail the request if email fails
    }
    
    // Create in-app notifications for admins about new lead
    try {
      const admins = await new Promise((resolve, reject) => {
        db.all(`SELECT id FROM users WHERE is_admin = 1`, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      for (const admin of admins) {
        await createNotification(
          admin.id,
          'new_lead',
          'New Lead',
          `${name} submitted a contact form${company ? ` from ${company}` : ''}. Check CRM for details.`
        );
      }
      console.log('[Contact Form] Admin in-app notifications created');
    } catch (notifError) {
      console.error('[Contact Form] Error creating notifications:', notifError);
    }
    
    res.json({ 
      success: true, 
      message: 'Thank you for contacting us! We will get back to you soon.',
      contactId 
    });
    
  } catch (error) {
    console.error('[Contact Form] Error processing submission:', error);
    res.status(500).json({ 
      error: 'Failed to process contact form submission',
      details: error.message
    });
  }
}));

// Export the Express app for HTTPS server
global.expressApp = app;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Force HTTPS in production (DISABLED - using HTTP for now)
// if (process.env.NODE_ENV === 'production') {
//   app.use((req, res, next) => {
//     if (req.header('x-forwarded-proto') !== 'https') {
//       res.redirect(`https://${req.header('host')}${req.url}`);
//     } else {
//       next();
//     }
//   });
// }

// Check if HTTPS is enabled and SSL certificates exist
const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'private-key.pem');
const certPath = path.join(sslDir, 'certificate.pem');
const httpsEnabled = process.env.HTTPS_ENABLED === 'true' && fs.existsSync(keyPath) && fs.existsSync(certPath);

let server;

if (httpsEnabled) {
  // Start HTTPS server
  const https = await import('https');
  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  
  server = https.default.createServer(sslOptions, app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 HTTPS Server running on port ${PORT}`);
    console.log(`🌍 Access at: https://31.97.144.132:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} else {
  // Start HTTP server
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
    console.log(`🌍 Access at: http://31.97.144.132:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('🔒 Production mode: HTTPS redirects enabled');
    } else {
      console.log('⚠️  Development mode: Generate SSL certificates for HTTPS');
      console.log('   Run: node generate-ssl.js');
    }
  });
}

setInterval(() => {
  const memory = process.memoryUsage();
  console.log(`[Memory] RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB, Heap: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 60000); // logs every 60 seconds

// Check for expiring documents daily
async function checkExpiringDocuments() {
  console.log('🔔 Checking for expiring documents...');
  
  try {
    // Get documents expiring in the next 7, 3, 1 days, today (0 days), and expired 3 days ago
    const warningDays = [7, 3, 1, 0, -3];
    
    for (const days of warningDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStart = new Date(futureDate);
      futureDateStart.setHours(0, 0, 0, 0);
      const futureDateEnd = new Date(futureDate);
      futureDateEnd.setHours(23, 59, 59, 999);
      
      const documents = await new Promise((resolve, reject) => {
        db.all(`
          SELECT d.*, u.name as user_name, u.email as user_email, u.is_admin
          FROM documents d
          JOIN users u ON d.user_id = u.id
          WHERE d.expires_at >= ? 
          AND d.expires_at <= ?
          AND (d.status IS NULL OR d.status != 'deleted')
        `, [futureDateStart.toISOString(), futureDateEnd.toISOString()], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      const daysText = days > 0 ? `in ${days} day(s)` : days === 0 ? 'today' : `${Math.abs(days)} day(s) ago`;
      console.log(`📄 Found ${documents.length} documents expiring ${daysText}`);
      
      for (const doc of documents) {
        try {
          // Create in-app notification
          let expiryMessage, notificationTitle;
          
          if (days < 0) {
            // Already expired
            expiryMessage = `Your document "${doc.description || doc.original_name}" expired ${Math.abs(days)} day(s) ago and needs to be updated!`;
            notificationTitle = 'Document Expired!';
          } else if (days === 0) {
            // Expires today
            expiryMessage = `Your document "${doc.description || doc.original_name}" expires TODAY!`;
            notificationTitle = 'Document Expires Today!';
          } else {
            // Future expiry
            expiryMessage = `Your document "${doc.description || doc.original_name}" expires in ${days} day(s).`;
            notificationTitle = 'Document Expiring Soon';
          }
          
          await createNotification(
            doc.user_id,
            'document_expiring',
            notificationTitle,
            expiryMessage
          );
          
          // Send email notification
          await sendExpiryWarningEmail(
            doc.user_email,
            doc.user_name,
            doc.description || doc.original_name,
            doc.expires_at
          );
          
          // Also notify admin
          const admins = await new Promise((resolve, reject) => {
            db.all('SELECT id, name, email FROM users WHERE is_admin = 1', (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            });
          });
          
          for (const admin of admins) {
            let adminMessage, adminTitle, expiryText;
            
            if (days < 0) {
              adminMessage = `${doc.user_name}'s document "${doc.description || doc.original_name}" expired ${Math.abs(days)} day(s) ago!`;
              adminTitle = 'User Document Expired!';
              expiryText = `${Math.abs(days)} day(s) AGO`;
            } else if (days === 0) {
              adminMessage = `${doc.user_name}'s document "${doc.description || doc.original_name}" expires TODAY!`;
              adminTitle = 'User Document Expires Today!';
              expiryText = 'TODAY';
            } else {
              adminMessage = `${doc.user_name}'s document "${doc.description || doc.original_name}" expires in ${days} day(s).`;
              adminTitle = 'User Document Expiring';
              expiryText = `${days} day(s)`;
            }
            
            await createNotification(
              admin.id,
              'document_expiring',
              adminTitle,
              adminMessage
            );
            
            // Send admin email
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(process.env.RESEND_API_KEY);
              
              const emailSubject = days < 0 
                ? `User Document EXPIRED: ${doc.user_name}`
                : `User Document Expiring: ${doc.user_name}`;
              
              const alertText = days < 0
                ? 'A user\'s document has expired and needs immediate attention:'
                : 'A user\'s document is expiring soon:';
              
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'Veritas Building Group <info@veribuilds.com>',
                to: admin.email,
                subject: emailSubject,
                html: `
                  <h2>Document Expiration Alert</h2>
                  <p>Hello ${admin.name},</p>
                  <p>${alertText}</p>
                  <p><strong>User:</strong> ${doc.user_name} (${doc.user_email})</p>
                  <p><strong>Document:</strong> ${doc.description || doc.original_name}</p>
                  <p><strong>Expires in:</strong> ${expiryText}</p>
                  <p><strong>Expiration Date:</strong> ${new Date(doc.expires_at).toLocaleDateString()}</p>
                  <p>Please follow up with the user to ensure the document is updated.</p>
                  <p>Best regards,<br>VBG System</p>
                `
              });
            } catch (emailError) {
              console.error('Error sending admin email:', emailError);
            }
          }
          
          console.log(`✅ Expiry notifications sent for document: ${doc.description || doc.original_name}`);
        } catch (notifError) {
          console.error(`Error sending expiry notification for document ${doc.id}:`, notifError);
        }
      }
    }
  } catch (error) {
    console.error('Error checking expiring documents:', error);
  }
}

// Run expiry check daily at 9 AM
const scheduleExpiryCheck = () => {
  const now = new Date();
  const next9AM = new Date();
  next9AM.setHours(9, 0, 0, 0);
  
  if (now > next9AM) {
    next9AM.setDate(next9AM.getDate() + 1);
  }
  
  const timeUntil9AM = next9AM - now;
  
  setTimeout(() => {
    checkExpiringDocuments();
    // Then run every 24 hours
    setInterval(checkExpiringDocuments, 24 * 60 * 60 * 1000);
  }, timeUntil9AM);
  
  console.log(`📅 Scheduled expiry check for ${next9AM.toLocaleString()}`);
};

scheduleExpiryCheck();

// Also run check on startup (but wait 10 seconds for server to be ready)
setTimeout(() => {
  checkExpiringDocuments();
}, 10000);
