/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5002';

const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || backendUrl,
  },
  
  // Configure API routes to proxy to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: isProduction 
          ? `${backendUrl}/api/:path*`
          : 'http://localhost:5002/api/:path*',
      },
    ]
  },
  
  // Production optimizations
  ...(isProduction ? {
    output: 'standalone',
    compress: true,
    productionBrowserSourceMaps: false,
    images: {
      domains: ['localhost', '31.97.144.132', 'app.veribuilds.com'],
    },
  } : {
    // Development settings
    output: 'standalone',
    productionBrowserSourceMaps: true,
  }),
  
  // Security and CORS headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  
  // Webpack configuration for path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    return config;
  },
};

// Security headers configuration
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

export default nextConfig;
