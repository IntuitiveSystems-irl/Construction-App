# Integration Guide - Contract System Package

## Quick Start (5 Minutes)

### Step 1: Copy Files to Your Project

```bash
# Copy the entire package to your project
cp -r contract-system-package /path/to/your/project/

# Or copy individual components as needed
```

### Step 2: Backend Integration (Express.js)

```javascript
// In your server.js or app.js
import contractRoutes from './contract-system-package/backend/contract-routes.js';
import { sendEmail } from './contract-system-package/backend/email-service.js';

// Mount the contract routes
app.post('/api/admin/contracts', contractRoutes.createContractRoute(db, authenticateAdmin, asyncHandler));
app.get('/api/admin/contracts', contractRoutes.getAllContractsRoute(db, authenticateAdmin, asyncHandler));
app.get('/api/admin/contracts/:id', contractRoutes.getContractByIdRoute(db, authenticateAdmin, asyncHandler));
app.put('/api/admin/contracts/:id/sign', contractRoutes.adminSignContractRoute(db, authenticateAdmin, asyncHandler));
app.delete('/api/admin/contracts/:id', contractRoutes.deleteContractRoute(db, authenticateAdmin, asyncHandler));

// User routes
app.get('/api/user/contracts', contractRoutes.getUserContractsRoute(db, authenticate, asyncHandler));
app.post('/api/user/contracts/:contractId/:action', contractRoutes.userContractActionRoute(db, authenticate, asyncHandler));
```

### Step 3: Frontend Integration (React/Next.js)

```tsx
// In your app routing
import ContractGenerationPage from './contract-system-package/frontend/ContractGenerationPage';

// Add to your routes
<Route path="/generate-contract" element={<ContractGenerationPage />} />

// Or for Next.js, copy to your pages/app directory
// cp contract-system-package/frontend/ContractGenerationPage.tsx app/generate-contract/page.tsx
```

### Step 4: Environment Variables

Add to your `.env` file:

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

### Step 5: Database Setup

Run the database schema (SQLite example):

```sql
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  admin_id INTEGER,
  project_name TEXT NOT NULL,
  project_description TEXT,
  start_date TEXT,
  end_date TEXT,
  total_amount TEXT,
  payment_terms TEXT,
  scope TEXT,
  contract_content TEXT,
  status TEXT DEFAULT 'pending',
  
  -- Client signature
  signature_data TEXT,
  signature_status TEXT DEFAULT 'not_requested',
  signed_at DATETIME,
  
  -- Admin signature
  admin_signature_data TEXT,
  admin_signature_status TEXT DEFAULT 'not_signed',
  admin_signed_at DATETIME,
  
  -- Additional fields
  user_comments TEXT,
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
```

## File Structure

```
contract-system-package/
├── frontend/
│   └── ContractGenerationPage.tsx    # Complete contract generation UI
├── backend/
│   ├── contract-routes.js            # All API endpoints
│   ├── email-service.js              # Email notifications
│   ├── pdf-generator.ts              # PDF generation (server-side)
│   └── pdf-generator-client.ts       # PDF generation (browser)
├── EXTRACTED_SYSTEM.md               # System overview
├── INTEGRATION_GUIDE.md              # This file
└── README.md                         # Package documentation
```

## Features Included

✅ **Contract Generation**
- Template-based contract creation
- Placeholder replacement ({{CLIENT_NAME}}, {{TOTAL_AMOUNT}}, etc.)
- Support for multiple contract templates
- Form validation

✅ **Digital Signatures**
- Canvas-based signature collection
- Mouse and touch support (mobile-friendly)
- Admin signature before sending
- Client signature on approval
- Signature preview and clear functionality

✅ **PDF Generation**
- Professional PDF documents
- Embedded digital signatures
- Company branding support
- Multi-page contracts
- Automatic page breaks

✅ **Email Notifications**
- Contract created notification
- Signature request emails
- Status update notifications
- Customizable email templates
- HTML and plain text support

✅ **Contract Management**
- List all contracts
- Filter by status
- View contract details
- Download as PDF
- Delete contracts
- Status tracking (pending, signed, approved, rejected)

## API Endpoints

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/contracts` | Create new contract |
| GET | `/api/admin/contracts` | List all contracts |
| GET | `/api/admin/contracts/:id` | Get contract details |
| PUT | `/api/admin/contracts/:id/sign` | Admin sign contract |
| DELETE | `/api/admin/contracts/:id` | Delete contract |
| GET | `/api/admin/contracts/:id/download` | Download contract PDF |
| GET | `/api/admin/contract-notifications` | Get status notifications |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/contracts` | List user's contracts |
| POST | `/api/user/contracts/:id/approve` | Approve and sign contract |
| POST | `/api/user/contracts/:id/reject` | Reject contract |

## Customization

### 1. Email Templates

Edit `backend/email-service.js`:

```javascript
const emailContent = `
Dear ${name},

Your custom message here...

Contract ID: ${contractId}

Best regards,
Your Company
`;
```

### 2. Contract Templates

Add templates to your database:

```sql
INSERT INTO contract_templates (id, name, description, category, content)
VALUES (
  'custom-template',
  'Custom Contract Template',
  'Your custom template description',
  'general',
  'Your contract content with {{PLACEHOLDERS}}'
);
```

### 3. PDF Styling

Edit `backend/pdf-generator.ts` to customize:
- Fonts and colors
- Logo placement
- Page layout
- Signature positioning

### 4. UI Styling

The frontend component uses Tailwind CSS. Customize classes in `frontend/ContractGenerationPage.tsx`.

## Available Placeholders

Use these in your contract templates:

| Placeholder | Description |
|------------|-------------|
| `{{DATE}}` | Current date |
| `{{CONTRACT_ID}}` | Unique contract ID |
| `{{CLIENT_NAME}}` | Client name |
| `{{CLIENT_EMAIL}}` | Client email |
| `{{CLIENT_ADDRESS}}` | Client address |
| `{{CONTRACTOR_NAME}}` | Contractor/company name |
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{START_DATE}}` | Project start date |
| `{{END_DATE}}` | Project end date |
| `{{TOTAL_AMOUNT}}` | Contract amount |
| `{{PAYMENT_TERMS}}` | Payment terms |
| `{{SCOPE_OF_WORK}}` | Detailed scope |

## Dependencies

### Backend
- `express` - Web framework
- `nodemailer` - Email sending
- `jspdf` - PDF generation
- `sqlite3` - Database (or your preferred DB)

### Frontend
- `react` / `next.js` - UI framework
- `lucide-react` - Icons
- `tailwindcss` - Styling

## Troubleshooting

### Email not sending
1. Check EMAIL_USER and EMAIL_PASS in .env
2. For Gmail, use App Password (not regular password)
3. Check email service logs in console

### Signature not saving
1. Ensure canvas is initialized before drawing
2. Check browser console for errors
3. Verify signature data is base64 PNG

### PDF not generating
1. Check jspdf is installed
2. Verify contract content exists
3. Check server logs for errors

### Database errors
1. Verify tables exist
2. Check foreign key constraints
3. Ensure user_id references valid user

## Support

For issues specific to the extracted system, refer to the original Rooster Construction codebase or modify the files as needed for your use case.

## License

This extracted system maintains the same license as the original Rooster Construction project.
