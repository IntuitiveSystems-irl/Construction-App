# Construction App

A comprehensive construction management platform built with Next.js, featuring contract management, appointment scheduling, and client relationship management for Veritas Building Group.

## Features

- **Contract Management System**: Digital contract creation, signing, and tracking
- **Appointment Scheduling**: Integrated Cal.com booking system
- **Client Portal**: Secure client access to contracts and project information
- **Admin Dashboard**: Comprehensive management interface for administrators
- **Email Notifications**: Automated email system using Resend API
- **Subcontractor Management**: Track and manage subcontractor relationships
- **Job Site Tracking**: Monitor active job sites and project progress
- **Secure Authentication**: JWT-based authentication with encrypted sessions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Express.js API server
- **Database**: SQLite3
- **Email**: Resend API
- **Authentication**: JWT with bcrypt
- **PDF Generation**: jsPDF
- **Icons**: Lucide React

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- SQLite3

## Local Setup

1. **Clone the repository**
   ```bash
   git clone https://gitlab.com/intuitive-systems-group/intuitive-systems-project.git
   cd intuitive-systems-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file and configure your settings:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - Database connection details
   - Resend API key for email functionality
   - JWT secret for authentication
   - Cal.com integration settings (optional)

4. **Initialize the database**
   ```bash
   # Database migrations will run automatically on first start
   npm run migrate:db
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

6. **Run the backend API server**
   
   In a separate terminal:
   ```bash
   node server.js
   ```
   
   The API will be available at `http://localhost:5002`

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:prod` - Start production server with environment variables
- `npm run lint` - Run ESLint
- `npm run migrate:check` - Check migration status
- `npm run migrate:db` - Run database migrations
- `npm run migrate:files` - Migrate files
- `npm run migrate:verify` - Verify migration completeness

## Project Structure

```
Veritas Building Group Web App/
├── vbg-app/                       # Main application
│   ├── app/                       # Next.js app directory
│   │   ├── api/                   # API routes
│   │   ├── admin/                 # Admin dashboard
│   │   ├── contracts/             # Contract management
│   │   └── login/                 # Authentication
│   │
│   ├── src/                       # Source code
│   │   ├── components/            # React components
│   │   ├── services/              # Business logic
│   │   ├── middleware/            # Express middleware
│   │   ├── server/                # Server code
│   │   └── utils/                 # Utilities
│   │
│   ├── public/                    # Static assets
│   │
│   ├── contract-system-package/   # Contract management module
│   ├── jobsite-system-package/    # Job site tracking module
│   ├── crm-package/               # CRM functionality
│   ├── rooster-master/            # Rooster scheduling system
│   │
│   ├── database/                  # Database schemas
│   ├── server.js                  # Express backend
│   │
│   ├── data/                      # Application data (gitignored)
│   │   ├── uploads/               # User uploads
│   │   ├── contracts/             # Generated contracts
│   │   ├── logs/                  # Application logs
│   │   └── contract-templates/    # Templates
│   │
│   ├── scripts/                   # Utility scripts
│   ├── docs/                      # Documentation
│   ├── deployment/                # Deployment configs
│   ├── archived/                  # Archived files
│   │
│   └── package.json               # Dependencies
│
├── cal.com/                       # Cal.com integration
├── resend email system/           # Email service integration
│
├── README.md                      # This file
├── CONTRIBUTING.md                # Contribution guidelines
└── LICENSE                        # License information
```

## Key Features Explained

### Contract System
- Create and manage construction contracts
- Digital signature capture
- PDF generation and storage
- Guest contract signing (no login required)
- Contract templates for different project types

### Appointment Booking
- Integrated Cal.com scheduling
- Automated email confirmations
- Admin and client notifications
- Webhook integration for real-time updates

### Admin Dashboard
- User management
- Contract oversight
- Job site monitoring
- Subcontractor tracking
- Email notification management

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js security headers
- CORS configuration
- Encrypted database support (SQLCipher)

## Environment Variables

Required environment variables (see `.env.example` for complete list):

```env
# Database
DB_FILENAME=./database.db

# Authentication
JWT_SECRET=your-secret-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
SENDER_EMAIL=your-email@domain.com

# Cal.com Integration (Optional)
CALCOM_WEBHOOK_SECRET=your-webhook-secret

# Server Configuration
PORT=5002
FRONTEND_PORT=5003
```

## Production Deployment

The application is designed to run on a production server with PM2 process management.

1. Build the Next.js application:
   ```bash
   npm run build
   ```

2. Start the backend server:
   ```bash
   pm2 start server.js --name vbg-backend
   ```

3. Start the frontend:
   ```bash
   pm2 start npm --name vbg-frontend -- start
   ```

## API Documentation

The backend API provides endpoints for:

- `/api/auth/*` - Authentication (login, logout, session management)
- `/api/contracts/*` - Contract CRUD operations
- `/api/users/*` - User management
- `/api/appointments/*` - Appointment scheduling
- `/api/jobsites/*` - Job site tracking
- `/api/subcontractors/*` - Subcontractor management
- `/api/cal-webhook` - Cal.com webhook handler

## Contributing

This is a private project for Veritas Building Group. For questions or issues, please contact the development team.

## License

ISC License - Copyright (c) Veritas Building Group

## Support

For technical support or questions about local setup, please refer to the documentation files in `vbg-app/docs/`:
- `vbg-app/docs/MIGRATION_GUIDE.md` - Database migration instructions
- `vbg-app/docs/SECURITY.md` - Security best practices
- `vbg-app/docs/DASHBOARD_README.md` - Admin dashboard documentation
- `vbg-app/docs/INTEGRATION_STRATEGY.md` - System integration guide

For deployment information, see `vbg-app/deployment/`.
