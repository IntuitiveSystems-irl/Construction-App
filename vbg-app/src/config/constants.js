import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Server Configuration
export const PORT = parseInt(process.env.PORT || '4000', 10);
export const HOST = process.env.HOST || '0.0.0.0';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

// Security
export const JWT_SECRET = process.env.JWT_SECRET || (IS_PRODUCTION ? null : 'dev-secret-key-change-in-production');
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Cookie Configuration
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Set to true only when using HTTPS
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/'
  // Don't set domain - let browser handle it
};

// CORS Origins (from environment)
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];

// Email Configuration
export const EMAIL_CONFIG = {
  host: process.env.MAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// Database Configuration
export const DB_CONFIG = {
  filename: process.env.DB_FILENAME || path.join(__dirname, '../../rooster.db')
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

// Directories
export const UPLOADS_DIR = path.join(__dirname, '../../uploads');
export const CONTRACTS_DIR = path.join(__dirname, '../../contracts');
export const LOGS_DIR = path.join(__dirname, '../../logs');

// Ensure directories exist
[UPLOADS_DIR, CONTRACTS_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Rate Limiting
export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10)
};

// Export all config as single object
export default {
  PORT,
  HOST,
  NODE_ENV,
  IS_PRODUCTION,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  COOKIE_OPTIONS,
  ALLOWED_ORIGINS,
  EMAIL_CONFIG,
  DB_CONFIG,
  UPLOAD_CONFIG,
  UPLOADS_DIR,
  CONTRACTS_DIR,
  LOGS_DIR,
  RATE_LIMIT_CONFIG
};
