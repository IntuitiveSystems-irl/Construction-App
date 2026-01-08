require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'vbg-backend',
      script: 'server.js',
      cwd: process.cwd(),
      watch: false,
      autorestart: true,
      instances: 1,
      env: {
        NODE_ENV: 'development',
        PORT: 5002,
        HOST: '0.0.0.0'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/backend-error.log',
      out_file: 'logs/backend-out.log'
    },
    {
      name: 'vbg-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5003',
      cwd: process.cwd(),
      watch: false,
      autorestart: true,
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
        NEXT_PUBLIC_API_URL: 'https://api.veribuilds.com',
        NEXT_PUBLIC_BACKEND_URL: 'https://api.veribuilds.com',
        NEXT_PUBLIC_CAL_URL: 'https://schedule.veribuilds.com/vbg'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log'
    }
  ]
};
