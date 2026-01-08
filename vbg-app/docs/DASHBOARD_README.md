# QuickBooks-Style Dashboard

## Overview
A modern, QuickBooks-inspired dashboard has been created for the VBG Construction application. This dashboard provides a clean, professional interface for users to manage their construction projects, documents, and activities.

## Features

### 1. **Welcome Header**
- Personalized greeting with user's name
- Blue gradient header with modern styling
- Quick access to Schedule and Settings

### 2. **Account Information Card**
- Displays account number
- Shows current balance
- "Make a Payment" button for quick actions
- Job filter dropdown (All Jobs, Active Jobs, Completed Jobs)

### 3. **Quick Action Tiles**
Six main action tiles with gradient icons:
- **Payments** - Manage payment transactions
- **Invoices** - View and create invoices
- **Statements** - Access financial statements
- **Contracts** - Manage construction contracts
- **Job Sites** - View and manage job locations
- **Documents** - Access all project documents

### 4. **Recent Activity Section**
- Tabbed interface with "Most Frequent" and "Most Recent" views
- Displays recent contracts and documents
- Shows activity type, description, and date
- Empty state when no activities exist
- Quick action links at the bottom

## Routes

### New Dashboard
- **URL**: `/dashboard-new`
- **Component**: `app/dashboard-new/page.tsx`
- **Main Component**: `app/components/QuickBooksDashboard.tsx`

### Old Dashboard (Still Available)
- **URL**: `/dashboard`
- **Component**: `app/dashboard/page.tsx`

## API Endpoints

Two new API endpoints have been added to `server.js`:

### 1. Get User Balance
```
GET /api/user/balance
```
Returns:
```json
{
  "balance": 0,
  "accountNumber": "XXXX-XXX-X"
}
```

### 2. Get Recent Activities
```
GET /api/user/recent-activities
```
Returns an array of recent activities:
```json
[
  {
    "id": "contract-123",
    "title": "Project Name",
    "description": "Contract pending",
    "date": "1/15/2025",
    "type": "contract"
  }
]
```

## Navigation Updates

The main navigation has been updated to redirect to the new dashboard:
- Home link now points to `/dashboard-new` for logged-in users
- Landing page (`/`) redirects authenticated users to `/dashboard-new`

## Styling

The dashboard uses:
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Gradient backgrounds** (blue theme)
- **Responsive grid layouts** (2 columns on mobile, 3 on tablet, 6 on desktop)
- **Hover effects** and smooth transitions
- **Shadow and border effects** for depth

## Color Scheme

- **Primary**: Blue gradient (`from-blue-600 to-blue-700`)
- **Background**: Light blue gradient (`from-blue-50 via-white to-blue-50`)
- **Cards**: White with subtle shadows and borders
- **Action Tiles**: Individual gradient colors for each tile

## Responsive Design

- **Mobile**: 2-column grid for quick actions
- **Tablet**: 3-column grid
- **Desktop**: 6-column grid with full feature display

## Future Enhancements

Potential improvements:
1. Real financial data integration
2. Interactive charts and graphs
3. Payment processing integration
4. Advanced filtering and search
5. Customizable dashboard widgets
6. Export functionality for reports
7. Real-time notifications
8. Calendar integration

## Development

To run the application:
```bash
npm run dev
```

To build for production:
```bash
npm run build
npm start
```

## Testing

Access the new dashboard:
1. Log in to the application
2. You'll be automatically redirected to `/dashboard-new`
3. Or navigate directly to `/dashboard-new`

The old dashboard is still available at `/dashboard` if needed.
