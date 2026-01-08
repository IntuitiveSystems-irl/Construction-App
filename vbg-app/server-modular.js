#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { corsMiddleware, corsDebugMiddleware } from './src/middleware/cors.js';
import { apiLimiter } from './src/middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';
import { initializeTables } from './src/config/database.js';
import { loadServices } from './src/services/index.js';
import { PORT, HOST } from './src/config/constants.js';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(corsMiddleware);
app.options('*', corsMiddleware);
app.use(corsDebugMiddleware);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Static files
app.use('/uploads', express.static('uploads'));
app.use('/contracts', express.static('contracts'));

// ============================================
// SERVICES (Auto-loaded)
// ============================================

loadServices(app);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: 'modular'
  });
});

// ============================================
// ERROR HANDLERS (Must be last)
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Rooster Construction Server (Modular)\n');
    
    await initializeTables();
    
    app.listen(PORT, HOST, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🌐 Server running on http://${HOST}:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏗️  Architecture: Modular Services`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
