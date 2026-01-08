# Rooster Construction - Deployment Guide

## Overview

This application has been streamlined and modernized with:
- **Modular server architecture** (replaced 5,559-line monolithic server.js)
- **Supabase database** (replaced MariaDB/SQLite)
- **Removed 40+ unnecessary test/debug files**
- **Docker containerization** with optimized multi-stage builds
- **Proper security** (no hardcoded credentials)

## Architecture

### Frontend
- Next.js 15.3.0
- React 19
- Tailwind CSS
- Runs on port **3000**

### Backend API
- Express.js server
- Modular structure in `/server` directory
- Supabase for database
- Runs on port **4000**

### Database
- Supabase PostgreSQL
- Row Level Security (RLS) enabled on all tables
- Automatic backups and scaling

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- Supabase account (database already configured)

### 2. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

Update `.env` with your values:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_secure_jwt_secret
MAIL_HOST=smtp.your-provider.com
EMAIL_PORT=465
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
APP_URL=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Development Mode

Run both frontend and backend:

```bash
# Terminal 1 - Frontend (Next.js)
npm run dev

# Terminal 2 - Backend API
npm run dev:server
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

### 5. Production Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up -d --build
```

This will:
- Build optimized production images
- Start both frontend and backend
- Expose ports 3000 and 4000
- Create persistent volume for uploads

Check logs:
```bash
docker-compose logs -f
```

Stop containers:
```bash
docker-compose down
```

## Project Structure

```
rooster-master/
├── app/                    # Next.js pages and components
│   ├── admin/             # Admin pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── ...
├── server/                # Backend API (NEW - modular structure)
│   ├── config/           # Configuration files
│   │   ├── cors.js       # CORS and cookie settings
│   │   └── supabase.js   # Supabase client
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   └── userController.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # Authentication
│   │   ├── errorHandler.js
│   │   └── security.js   # Rate limiting, helmet
│   ├── routes/           # API routes
│   │   ├── authRoutes.js
│   │   ├── documentRoutes.js
│   │   └── userRoutes.js
│   └── index.js          # Server entry point
├── utils/                # Shared utilities
│   ├── email.js          # Email sending
│   └── pdfGenerator.js   # PDF generation
├── uploads/              # User uploaded files
├── Dockerfile            # Production container
├── docker-compose.yml    # Docker orchestration
└── package.json          # Dependencies

REMOVED FILES (40+):
- server.js (5,559 lines → replaced with modular structure)
- All test-*.js files
- All debug-*.js files
- Backup files (.backup, .save, .bak)
- Duplicate files
- MariaDB dependencies
```

## Database Schema

All tables are in Supabase with RLS enabled:

### Core Tables
- **users** - User accounts and profiles
- **password_reset_tokens** - Password reset management
- **admin_users** - Admin-specific metadata
- **contracts** - Contract management
- **contract_templates** - Reusable templates
- **job_sites** - Job site information
- **job_assignments** - User-to-jobsite relationships
- **documents** - Document metadata (files stored in /uploads)

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Admins have elevated permissions via policies

## API Endpoints

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/verify-email?token=` - Verify email
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password
- `GET /api/verify-token` - Validate JWT token

### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile/update` - Update profile

### Documents
- `POST /api/upload-document` - Upload file
- `GET /api/documents` - List user documents
- `GET /api/documents/expiring` - Get expiring docs
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download file
- `DELETE /api/documents/:id` - Delete document

## Monitoring

### Health Check
```bash
curl http://localhost:4000/api/test
```

### Docker Health Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Database Connection Issues
1. Verify Supabase credentials in `.env`
2. Check Supabase dashboard for service status
3. Ensure RLS policies are properly configured

### Docker Build Issues
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Security Notes

1. **Never commit `.env` files** - Use `.env.example` as template
2. **JWT_SECRET** - Generate strong random string (32+ characters)
3. **Database** - All sensitive data behind RLS policies
4. **Rate Limiting** - Auth endpoints limited to 10 req/15min
5. **CORS** - Configured for specific origins only
6. **Helmet.js** - Security headers enabled
7. **File Uploads** - Limited to 10MB, specific file types only

## Performance Optimization

1. **Docker multi-stage builds** - Smaller production images
2. **Database indexes** - Added on frequently queried columns
3. **Rate limiting** - Protects against abuse
4. **Connection pooling** - Supabase handles automatically
5. **Static file serving** - Efficient uploads serving

## Migration from Old System

The old 5,559-line `server.js` has been replaced with a clean modular architecture:

**Before:** One massive file with mixed concerns
**After:** Organized structure with separation of concerns

- Configuration → `server/config/`
- Authentication logic → `server/controllers/authController.js`
- Document logic → `server/controllers/documentController.js`
- User logic → `server/controllers/userController.js`
- Routes → `server/routes/`
- Middleware → `server/middleware/`

The old file is preserved as `server.js.legacy` for reference.

## Next Steps

1. Set up automated backups (Supabase handles this)
2. Configure custom domain
3. Set up SSL certificates (if not using Supabase hosting)
4. Configure email provider for production
5. Set up monitoring/logging service (e.g., Sentry, LogRocket)
6. Implement CI/CD pipeline

## Support

For issues or questions:
1. Check application logs
2. Verify environment variables
3. Review Supabase dashboard for database issues
4. Check Docker container status and logs
