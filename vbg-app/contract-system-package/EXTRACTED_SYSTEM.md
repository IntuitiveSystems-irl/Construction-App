# Extracted Contract System from Rooster Construction

This package contains the complete contract generation, signature collection, download, and notification system extracted from the Rooster Construction web app.

## System Components

### 1. Frontend Components
- **Contract Generation Form** (`frontend/ContractGenerationPage.tsx`)
- **Signature Canvas** (embedded in generation page)
- **Contract Viewer** (for clients to view/sign contracts)

### 2. Backend Services
- **Contract API Endpoints** (`backend/contract-routes.js`)
- **Email Notification Service** (`backend/email-service.js`)
- **PDF Generation** (`backend/pdf-generator.ts`)

### 3. Utilities
- **Template Engine** (placeholder replacement)
- **Database Schema** (SQLite)

## File Structure

```
contract-system-package/
├── frontend/
│   ├── ContractGenerationPage.tsx    # Full contract generation UI
│   ├── ContractViewerPage.tsx        # Client-side contract viewer
│   └── components/
│       └── SignatureCanvas.tsx       # Reusable signature component
├── backend/
│   ├── contract-routes.js            # Express routes for contracts
│   ├── email-service.js              # Email notifications
│   ├── pdf-generator.ts              # PDF generation with signatures
│   └── database-schema.sql           # Database tables
├── utils/
│   ├── template-engine.js            # Placeholder replacement
│   └── helpers.js                    # Utility functions
└── README.md                         # Integration guide
```

## Quick Integration

### 1. Backend Setup (Express.js)

```javascript
// In your server.js
import contractRoutes from './contract-system-package/backend/contract-routes.js';
app.use('/api', contractRoutes);
```

### 2. Frontend Setup (React/Next.js)

```tsx
// In your app
import ContractGenerationPage from './contract-system-package/frontend/ContractGenerationPage';

// Use in your routing
<Route path="/generate-contract" component={ContractGenerationPage} />
```

### 3. Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com

# Frontend URL (for email links)
FRONTEND_URL=https://yourapp.com

# API URL
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

## Features Included

✅ Contract generation from templates
✅ Placeholder replacement ({{CLIENT_NAME}}, {{TOTAL_AMOUNT}}, etc.)
✅ Digital signature collection (mouse + touch support)
✅ Admin signature before sending
✅ Client signature on approval
✅ PDF generation with embedded signatures
✅ Email notifications (contract created, signature requested, signed)
✅ Contract status tracking (pending, signed, approved, rejected)
✅ Download contracts as PDF
✅ Template management

## Database Tables Required

The system uses these tables:
- `contracts` - Main contract storage
- `contract_templates` - Template definitions
- `users` - User information

See `backend/database-schema.sql` for full schema.
