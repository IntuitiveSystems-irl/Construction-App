require('dotenv').config();

module.exports = {
  apps: [
    // Backend Application
    {
      name: 'rooster-backend',
      script: 'server.js',
      cwd: process.cwd(),
      watch: false,
      ignore_watch: ['node_modules', '.next', '*.log', '*.md', '.git'],
      watch_options: {
        usePolling: false
      },
      autorestart: true,
      instances: 1,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: '.',
        PORT: 4000,
        HOST: '0.0.0.0',
        DB_FILENAME: `${process.cwd()}/rooster.db`,
        JWT_SECRET: process.env.JWT_SECRET,
        MAIL_HOST: process.env.MAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS,
        APP_URL: process.env.APP_URL || 'http://31.97.144.132:3000',
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://31.97.144.132:3000',
        NODE_TLS_REJECT_UNAUTHORIZED: '0', // Only for development
        UV_THREADPOOL_SIZE: 32,
        NODE_OPTIONS: '--max-old-space-size=1024 --max-semi-space-size=128'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${process.cwd()}/logs/backend-error.log`,
      out_file: `${process.cwd()}/logs/backend-out.log`,
      merge_logs: true,
      env: {
        NODE_ENV: 'development',
        ...process.env
      },
      time: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000,
      max_restart_delay: 10000,
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: true
    },
    // Frontend Application
    {
      name: 'rooster-frontend',
      script: 'node_modules/next/dist/bin/next',
      cwd: process.cwd(),
args: 'start -H 0.0.0.0 -p 3000',
      watch: false,
      ignore_watch: ['node_modules', '.next', '*.log', '*.md', '.git'],
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: '.',
        PORT: 3000,
        HOST: '0.0.0.0',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://31.97.144.132:4000/api',
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://31.97.144.132:4000',
        NODE_OPTIONS: '--max-old-space-size=1024',
        NODE_TLS_REJECT_UNAUTHORIZED: '0' // ⚠️ Optional: Remove this in full production
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: `${process.cwd()}/logs/frontend-error.log`,
      out_file: `${process.cwd()}/logs/frontend-out.log`,
      merge_logs: true,
      time: true,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 2000,
      max_restart_delay: 10000,
      kill_timeout: 5000,
      listen_timeout: 8000,
      wait_ready: true
    }
  ]
};
