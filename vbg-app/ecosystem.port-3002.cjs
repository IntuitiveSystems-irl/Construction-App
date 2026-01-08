require('dotenv').config();

module.exports = {
  apps: [
    // Backend Application (Port 4000)
    {
      name: 'rooster-backend',
      script: 'server.js',
      cwd: process.cwd(),
      watch: false,
      ignore_watch: ['node_modules', '.next', '*.log', '*.md', '.git', 'uploads', 'contracts'],
      autorestart: true,
      instances: 1,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: '.',
        PORT: 4000,
        HOST: '0.0.0.0',
        DB_FILENAME: `${process.cwd()}/rooster.db`,
        JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
        FRONTEND_URL: 'http://31.97.144.132:3002',
        APP_URL: 'http://31.97.144.132:3002',
        NEXT_PUBLIC_API_URL: 'http://31.97.144.132:4000/api',
        NEXT_PUBLIC_BACKEND_URL: 'http://31.97.144.132:4000',
        UV_THREADPOOL_SIZE: 32,
        NODE_OPTIONS: '--max-old-space-size=1024'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${process.cwd()}/logs/backend-error.log`,
      out_file: `${process.cwd()}/logs/backend-out.log`,
      merge_logs: true,
      time: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000,
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: false
    },
    // Frontend Application (Port 3002)
    {
      name: 'rooster-frontend-3002',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 3002',
      cwd: process.cwd(),
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: '.',
        PORT: 3002,
        HOST: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'http://31.97.144.132:4000/api',
        NEXT_PUBLIC_BACKEND_URL: 'http://31.97.144.132:4000',
        NODE_OPTIONS: '--max-old-space-size=1024'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${process.cwd()}/logs/frontend-3002-error.log`,
      out_file: `${process.cwd()}/logs/frontend-3002-out.log`,
      merge_logs: true,
      time: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000,
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: false
    }
  ]
};
