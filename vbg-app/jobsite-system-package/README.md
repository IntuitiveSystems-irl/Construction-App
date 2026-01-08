# Job Site System Package - Extracted from Rooster Construction

Complete job site creation, notification, and management system extracted from the working Rooster Construction app. Ready to plug into any web application.

## Features

- **Job Site Management**: Create and manage construction job sites with full details
- **User Assignment**: Assign clients and subcontractors to job sites with specific roles
- **Notification System**: Send messages to job site teams with priority levels
- **Email Notifications**: Automated emails for assignments and messages
- **Access Control**: Role-based information filtering (client vs subcontractor views)
- **Status Tracking**: Track job site status (planning, active, completed, on_hold)
- **Message Types**: Updates, safety alerts, schedule changes, weather alerts

## Quick Start

### 1. Backend Integration

```javascript
import jobsiteRoutes from './jobsite-system-package/backend/jobsite-routes.js';

app.get('/api/admin/job-sites', jobsiteRoutes.getAllJobSitesRoute(db, authenticateAdmin, asyncHandler));
app.post('/api/admin/job-sites', jobsiteRoutes.createJobSiteRoute(db, authenticateAdmin, asyncHandler));
// ... see INTEGRATION_GUIDE.md for all routes
```

### 2. Frontend Integration

```bash
# Copy pages to your Next.js app
cp jobsite-system-package/frontend/*.tsx app/
```

### 3. Database Setup

```bash
sqlite3 your-database.db < jobsite-system-package/DATABASE_SCHEMA.sql
```

## What's Included

### Frontend Components
- ✅ **AdminJobSitesPage.tsx** - Admin job sites list with creation modal
- ✅ **AdminJobSiteDetailsPage.tsx** - Job site details with messaging
- ✅ **UserJobSitesPage.tsx** - User's assigned job sites
- ✅ **UserJobSiteDetailsPage.tsx** - Job site details for users

### Backend
- ✅ **jobsite-routes.js** - All API endpoints for job site management

### Documentation
- ✅ **START_HERE.md** - Quick start guide
- ✅ **INTEGRATION_GUIDE.md** - Detailed integration steps
- ✅ **DATABASE_SCHEMA.sql** - Database structure
- ✅ **README.md** - This file

## Key Features

### Admin Capabilities
- Create job sites with full details (address, budget, dates, notes)
- Assign multiple users to job sites with roles
- Send messages to job site teams
- Choose message type (update, safety, schedule, weather)
- Set priority level (normal, high, urgent)
- View all messages and assignments
- Delete job sites

### User Capabilities
- View assigned job sites
- See role and assignment details
- View job site messages
- See team members
- Information filtered by user type

### Notification System
- Email notifications on job assignment
- Email notifications for job site messages
- Priority-based email styling
- Message type indicators with emojis
- HTML email templates

## Message Types

| Type | Description | Icon |
|------|-------------|------|
| `update` | General updates | 💬 |
| `safety` | Safety alerts | ⚠️ |
| `schedule` | Schedule changes | 📅 |
| `weather` | Weather alerts | 🌤️ |

## Priority Levels

| Priority | Color | Icon |
|----------|-------|------|
| `normal` | Blue | 💬 |
| `high` | Yellow | ⚠️ |
| `urgent` | Red | 🚨 |

## API Endpoints

### Admin Endpoints
- `GET /api/admin/job-sites` - List all job sites
- `POST /api/admin/job-sites` - Create new job site
- `GET /api/admin/job-sites/:id` - Get job site details
- `POST /api/admin/job-sites/:id/assign` - Assign users
- `DELETE /api/admin/job-sites/:id` - Delete job site
- `POST /api/admin/job-sites/:id/message` - Send message
- `GET /api/admin/job-sites/:id/messages` - Get messages

### User Endpoints
- `GET /api/user/job-sites` - List user's job sites
- `GET /api/user/job-sites/:id` - Get job site details

## Database Tables

- **job_sites** - Job site information
- **job_assignments** - User assignments to job sites
- **job_messages** - Messages sent to job site teams
- **job_site_uploads** - File uploads (optional)
- **job_site_comments** - Threaded comments (optional)

## Dependencies

```json
{
  "dependencies": {
    "express": "^4.21.2",
    "nodemailer": "^7.0.3",
    "sqlite3": "^5.1.7",
    "react": "^19.0.0",
    "next": "15.3.0",
    "lucide-react": "^0.525.0"
  }
}
```

## Environment Variables

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com
FRONTEND_URL=https://yourapp.com
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

## Integration Steps

1. **Copy files** to your project
2. **Run database schema** to create tables
3. **Mount backend routes** in your Express app
4. **Copy frontend pages** to your app
5. **Configure environment variables**

See **INTEGRATION_GUIDE.md** for detailed instructions.

## Access Control

### Admin Access
- View all job sites
- Create/edit/delete job sites
- Assign users
- Send messages

### User Access
- View only assigned job sites
- Role-based information filtering:
  - **Clients**: See budget, client notes
  - **Subcontractors**: See contractor notes (budget hidden)

## Customization

- Add custom job site fields
- Modify email templates
- Add new message types
- Customize user type filtering
- Add file upload functionality
- Add threaded comments

See **INTEGRATION_GUIDE.md** for customization examples.

## Example Usage

### Create a Job Site
```javascript
POST /api/admin/job-sites
{
  "name": "Downtown Office Renovation",
  "address": "123 Main St",
  "city": "Seattle",
  "state": "WA",
  "zip_code": "98101",
  "start_date": "2025-01-15",
  "end_date": "2025-06-30",
  "budget": 250000,
  "status": "planning"
}
```

### Assign Users
```javascript
POST /api/admin/job-sites/:id/assign
{
  "assignments": [
    { "user_id": 10, "user_type": "client", "role": "Project Owner" },
    { "user_id": 15, "user_type": "subcontractor", "role": "Foreman" }
  ]
}
```

### Send Message
```javascript
POST /api/admin/job-sites/:id/message
{
  "message": "Site closed tomorrow due to weather",
  "message_type": "weather",
  "priority": "high",
  "send_sms": true
}
```

## Support

This is extracted from your working Rooster Construction system. All code is production-ready and tested.

## License

Maintains the same license as the original Rooster Construction project.
