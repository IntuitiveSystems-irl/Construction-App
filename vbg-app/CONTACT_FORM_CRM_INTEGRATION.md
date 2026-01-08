# Contact Form to CRM Integration

## Overview
The website contact form at veribuilds.com now integrates directly with the VBG web app CRM system.

## How It Works

### 1. Contact Form Submission (veribuilds.com)
- User fills out contact form on the website
- Form submits to `veritas-contact-handler.php`
- PHP handler validates and sanitizes input

### 2. CRM Integration
- PHP handler sends data to backend API: `POST /api/contact`
- Backend creates/updates contact in `users` table with `user_type = 'lead'`
- Contact is immediately available in the CRM

### 3. Email Notifications
- **Admin Notifications**: Sent to `niko@veribuilds.com` and `info@veribuilds.com`
  - Includes all contact details
  - Link to view in CRM
  - Project type and message
  
- **Customer Confirmation**: Sent to the contact
  - Thank you message
  - Copy of their submitted message
  - Contact information

## Files Created/Modified

### New Files
- `/vbg-app/veritas-contact-handler.php` - PHP handler for contact form

### Modified Files
- `/vbg-app/server.js` - Added `/api/contact` endpoint and removed Twenty CRM references

## API Endpoint

### POST /api/contact
**Purpose**: Receive contact form submissions from website

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(360) 555-1234",
  "company": "Optional Company Name",
  "message": "I'm interested in a kitchen remodel",
  "source": "Website Contact Form - veribuilds.com"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Thank you for contacting us! We will get back to you soon.",
  "contactId": 123
}
```

**Features**:
- Email validation
- Duplicate contact detection (updates existing contacts)
- Creates new contacts with `user_type = 'lead'`
- Sends email notifications via Resend
- Non-blocking (doesn't fail if email sending fails)

## Twenty CRM Removal

### Changes Made
1. **Removed imports** from `server.js`:
   - `syncUserToCRM`
   - `getAllPeople`
   - `getAllCompanies`

2. **Disabled endpoints** (commented out):
   - `POST /api/admin/crm/sync-user/:userId`
   - `POST /api/admin/crm/sync-all-users`
   - `GET /api/admin/crm/health`
   - `GET /api/admin/crm/people`
   - `GET /api/admin/crm/companies`

3. **Removed CRM sync calls**:
   - Registration endpoint (no longer syncs to Twenty)
   - User update endpoint (no longer syncs to Twenty)

### Still Active
- `GET /api/admin/crm/contacts` - Fetches contacts from VBG database
- `POST /api/admin/send-bulk-email` - Sends emails via Resend
- CRM page at `/admin/crm` still has Twenty iframe (can be updated later)

## Database Schema

Contacts are stored in the `users` table with:
- `user_type = 'lead'` for contact form submissions
- `is_verified = 0` (not verified)
- Standard user fields: name, email, phone, company_name

## Testing

### Test the Contact Form
1. Go to veribuilds.com contact section
2. Fill out the form
3. Submit
4. Check:
   - Success message appears
   - Admin emails received
   - Customer confirmation email received
   - Contact appears in CRM (`/admin/crm`)

### Test the API Directly
```bash
curl -X POST http://localhost:5002/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "360-555-1234",
    "message": "Test message",
    "source": "API Test"
  }'
```

## Deployment

### Files to Deploy
1. `veritas-contact-handler.php` - Upload to website root
2. `server.js` - Deploy to backend server (port 5002)

### Environment Variables
Already configured in `server.js`:
- Resend API Key: `re_SGMykm1U_J72Lzj5gtchrqumycJREwgLs`
- From Email: `Veritas Building Group <info@veribuilds.com>`
- Admin Emails: `niko@veribuilds.com`, `info@veribuilds.com`

### Production URLs
- Website: `https://veribuilds.com`
- Backend API: `http://31.97.144.132:5002`
- Web App: `http://app.veribuilds.com`

## Next Steps

1. **Test the integration** on production
2. **Update CRM page** to remove Twenty iframe and show VBG contacts
3. **Monitor logs** for any errors
4. **Optional**: Add more fields to contact form (budget, timeline, etc.)
5. **Optional**: Add lead scoring/status tracking in CRM

## Troubleshooting

### Contact form not working
- Check PHP error log: `/vbg-app/php-errors.log`
- Verify backend API is running on port 5002
- Check CORS settings in `server.js`

### Emails not sending
- Verify Resend API key is valid
- Check server logs for email errors
- Ensure sender email is verified in Resend

### Contacts not appearing in CRM
- Check database connection
- Verify `/api/contact` endpoint is working
- Check server logs for database errors
