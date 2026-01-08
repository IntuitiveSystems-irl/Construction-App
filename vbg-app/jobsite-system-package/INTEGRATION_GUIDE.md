# Integration Guide - Job Site System Package

## Quick Start (5 Minutes)

### Step 1: Copy Files to Your Project

```bash
# Copy the entire package
cp -r jobsite-system-package /path/to/your/project/

# Or copy individual components
cp jobsite-system-package/backend/* /path/to/your/project/backend/
cp jobsite-system-package/frontend/* /path/to/your/project/frontend/
```

### Step 2: Backend Integration (Express.js)

```javascript
// In your server.js or app.js
import jobsiteRoutes from './jobsite-system-package/backend/jobsite-routes.js';
import { sendEmail } from './backend/email-service.js'; // From contract system

// Admin Job Site Routes
app.get('/api/admin/job-sites', 
  jobsiteRoutes.getAllJobSitesRoute(db, authenticateAdmin, asyncHandler));

app.post('/api/admin/job-sites', 
  jobsiteRoutes.createJobSiteRoute(db, authenticateAdmin, asyncHandler));

app.get('/api/admin/job-sites/:id', 
  jobsiteRoutes.getJobSiteByIdRoute(db, authenticateAdmin, asyncHandler));

app.post('/api/admin/job-sites/:id/assign', 
  jobsiteRoutes.assignUsersToJobSiteRoute(db, authenticateAdmin, asyncHandler, sendEmail));

app.delete('/api/admin/job-sites/:id', 
  jobsiteRoutes.deleteJobSiteRoute(db, authenticateAdmin, asyncHandler));

app.post('/api/admin/job-sites/:id/message', 
  jobsiteRoutes.sendJobSiteMessageRoute(db, authenticateAdmin, asyncHandler, sendEmail));

app.get('/api/admin/job-sites/:id/messages', 
  jobsiteRoutes.getJobSiteMessagesRoute(db, authenticateAdmin, asyncHandler));

// User Job Site Routes
app.get('/api/user/job-sites', 
  jobsiteRoutes.getUserJobSitesRoute(db, authenticate, asyncHandler));

app.get('/api/user/job-sites/:id', 
  jobsiteRoutes.getUserJobSiteDetailsRoute(db, authenticate, asyncHandler));
```

### Step 3: Frontend Integration (React/Next.js)

#### For Next.js App Router:

```bash
# Admin pages
cp jobsite-system-package/frontend/AdminJobSitesPage.tsx app/admin/job-sites/page.tsx
cp jobsite-system-package/frontend/AdminJobSiteDetailsPage.tsx app/admin/job-sites/[id]/page.tsx

# User pages
cp jobsite-system-package/frontend/UserJobSitesPage.tsx app/job-sites/page.tsx
cp jobsite-system-package/frontend/UserJobSiteDetailsPage.tsx app/job-sites/[id]/page.tsx
```

#### For React Router:

```tsx
import AdminJobSitesPage from './jobsite-system-package/frontend/AdminJobSitesPage';
import UserJobSitesPage from './jobsite-system-package/frontend/UserJobSitesPage';

// In your routes
<Route path="/admin/job-sites" element={<AdminJobSitesPage />} />
<Route path="/job-sites" element={<UserJobSitesPage />} />
```

### Step 4: Database Setup

```bash
# Run the schema
sqlite3 your-database.db < jobsite-system-package/DATABASE_SCHEMA.sql

# Or for PostgreSQL
psql -d your_database < jobsite-system-package/DATABASE_SCHEMA.sql
```

### Step 5: Environment Variables

Uses the same email configuration as the contract system:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com
FRONTEND_URL=https://yourapp.com
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

## Features Overview

### Admin Features

#### 1. Create Job Site
```javascript
POST /api/admin/job-sites
{
  "name": "Downtown Office Renovation",
  "description": "Complete office renovation project",
  "address": "123 Main St",
  "city": "Seattle",
  "state": "WA",
  "zip_code": "98101",
  "client_id": 5,
  "project_manager": "John Smith",
  "start_date": "2025-01-15",
  "end_date": "2025-06-30",
  "budget": 250000,
  "status": "planning",
  "client_notes": "Client wants modern design",
  "contractor_notes": "Need electrical permits",
  "safety_requirements": "Hard hats required, confined space training"
}
```

#### 2. Assign Users to Job Site
```javascript
POST /api/admin/job-sites/:id/assign
{
  "assignments": [
    {
      "user_id": 10,
      "user_type": "client",
      "role": "Project Owner"
    },
    {
      "user_id": 15,
      "user_type": "subcontractor",
      "role": "Lead Electrician"
    },
    {
      "user_id": 20,
      "user_type": "subcontractor",
      "role": "Foreman"
    }
  ]
}
```

#### 3. Send Message to Job Site Team
```javascript
POST /api/admin/job-sites/:id/message
{
  "message": "Weather delay - site closed tomorrow due to heavy rain",
  "message_type": "weather",
  "priority": "high",
  "send_sms": true
}
```

### User Features

#### View Assigned Job Sites
```javascript
GET /api/user/job-sites

// Returns job sites with role-based information filtering
// Clients see: client_notes, budget
// Subcontractors see: contractor_notes (budget hidden)
```

#### View Job Site Details
```javascript
GET /api/user/job-sites/:id

// Returns full job site details if user is assigned
// 403 error if user doesn't have access
```

## Message Types & Priorities

### Message Types

| Type | Description | Icon | Use Case |
|------|-------------|------|----------|
| `update` | General updates | 💬 | Progress updates, general info |
| `safety` | Safety alerts | ⚠️ | Safety violations, new requirements |
| `schedule` | Schedule changes | 📅 | Delays, time changes |
| `weather` | Weather alerts | 🌤️ | Weather-related closures |

### Priority Levels

| Priority | Color | Icon | Use Case |
|----------|-------|------|----------|
| `normal` | Blue | 💬 | Regular updates |
| `high` | Yellow | ⚠️ | Important but not urgent |
| `urgent` | Red | 🚨 | Immediate attention required |

## Email Notifications

### Job Assignment Email
Sent automatically when user is assigned to a job site:
- Job site name and location
- User's role
- Start and end dates
- Safety requirements
- Link to view job site

### Job Site Message Email
Sent when admin sends a message:
- Priority-based styling
- Message type indicator
- Full message content
- Link to job site dashboard

## Access Control

### Admin Access
- View all job sites
- Create/edit/delete job sites
- Assign users to job sites
- Send messages to job site teams
- View all messages and assignments

### User Access
- View only assigned job sites
- See role and assignment details
- View job site messages
- Information filtered by user type:
  - **Clients**: See budget, client notes
  - **Subcontractors**: See contractor notes (budget hidden)

## Customization

### 1. Add Custom Job Site Fields

Edit the database schema and add fields:
```sql
ALTER TABLE job_sites ADD COLUMN custom_field TEXT;
```

Update the create route in `jobsite-routes.js`:
```javascript
const { name, description, custom_field, ... } = req.body;
// Add to INSERT statement
```

### 2. Customize Email Templates

Edit `jobsite-routes.js` in the `sendJobSiteMessageRoute` function:
```javascript
const emailMessage = `
  <h2>Your Custom Header</h2>
  <p>Custom message template...</p>
`;
```

### 3. Add New Message Types

In `jobsite-routes.js`:
```javascript
const typeText = message_type === 'custom' ? 'CUSTOM ALERT' : 
                message_type === 'safety' ? 'SAFETY ALERT' : ...
```

### 4. Modify User Type Filtering

In `getUserJobSitesRoute`:
```javascript
if (userType === 'custom_type') {
  return {
    ...row,
    notes: row.custom_notes,
    // Custom filtering logic
  };
}
```

## API Endpoints Reference

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/job-sites` | List all job sites |
| POST | `/api/admin/job-sites` | Create new job site |
| GET | `/api/admin/job-sites/:id` | Get job site details |
| POST | `/api/admin/job-sites/:id/assign` | Assign users to job site |
| DELETE | `/api/admin/job-sites/:id` | Delete job site |
| POST | `/api/admin/job-sites/:id/message` | Send message to team |
| GET | `/api/admin/job-sites/:id/messages` | Get job site messages |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/job-sites` | List user's job sites |
| GET | `/api/user/job-sites/:id` | Get job site details |

## Troubleshooting

### Users not receiving emails
1. Check EMAIL_USER and EMAIL_PASS in .env
2. Verify user has valid email in database
3. Check server logs for email errors
4. For Gmail, use App Password

### User can't see job site
1. Verify user is assigned in `job_assignments` table
2. Check user_id matches in assignment
3. Ensure job_site_id is correct

### Messages not showing
1. Check `job_messages` table has entries
2. Verify job_site_id matches
3. Check frontend API_URL is correct

### Assignment fails
1. Verify users exist in database
2. Check user_type is 'client' or 'subcontractor'
3. Ensure job site exists

## Database Queries

### Get all users assigned to a job site
```sql
SELECT u.name, u.email, ja.role, ja.user_type
FROM job_assignments ja
JOIN users u ON ja.user_id = u.id
WHERE ja.job_site_id = 'JOB_123';
```

### Get all job sites for a user
```sql
SELECT js.*, ja.role
FROM job_sites js
JOIN job_assignments ja ON js.id = ja.job_site_id
WHERE ja.user_id = 10;
```

### Get job site messages
```sql
SELECT jm.*, u.name as sender_name
FROM job_messages jm
JOIN users u ON jm.admin_id = u.id
WHERE jm.job_site_id = 'JOB_123'
ORDER BY jm.created_at DESC;
```

## Support

For issues specific to the extracted system, refer to the original Rooster Construction codebase or modify the files as needed for your use case.

## License

This extracted system maintains the same license as the original Rooster Construction project.
