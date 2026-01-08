import cors from 'cors';
import { ALLOWED_ORIGINS } from '../config/constants.js';

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
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
  optionsSuccessStatus: 200
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

// CORS debugging middleware
export const corsDebugMiddleware = (req, res, next) => {
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
};
