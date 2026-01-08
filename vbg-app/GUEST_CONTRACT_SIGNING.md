# Guest Contract Signing System

## Overview
Allow admins to send contracts to anyone via email for signature without requiring the recipient to create an account.

## Features

### 🔐 Security
- **Unique Tokens**: Cryptographically secure UUID tokens for each signing link
- **Expiration**: Links expire after 30 days
- **Email Verification**: Recipient must use the email address the contract was sent to
- **One-Time Signing**: Contracts can only be signed once
- **No Authentication Required**: Guests don't need to create accounts

### 📧 Email Notifications
- **Invitation Email**: Sent to guest with signing link and contract details
- **Confirmation Email**: Sent to guest after successful signing
- **Admin Notification**: Sent to admin when contract is signed

### 🎨 User Experience
- **Beautiful Signing Page**: Clean, professional interface at `/guest-sign/:token`
- **Contract Preview**: Full contract details and terms displayed before signing
- **Digital Signature**: Canvas-based signature capture
- **Mobile Friendly**: Responsive design works on all devices

## How to Use

### For Admins

1. **Navigate to Send Contract Page**
   - Go to: https://app.veribuilds.com/admin/send-contract-guest

2. **Fill in Details**
   - **Contract ID**: The ID of the contract you want to send
   - **Recipient Name**: Full name of the person who will sign
   - **Recipient Email**: Email address where the signing link will be sent

3. **Send Contract**
   - Click "Send Contract" button
   - Recipient receives email with unique signing link
   - Link expires in 30 days

4. **Track Status**
   - You'll receive an email notification when the contract is signed
   - Check contract status in your admin dashboard

### For Recipients (Guests)

1. **Receive Email**
   - Get email from Veritas Building Group with contract details
   - Email includes secure signing link

2. **Review Contract**
   - Click link to view full contract details
   - See project name, amount, dates, and terms
   - Read through all contract content

3. **Sign Contract**
   - Enter your name and email
   - Draw your signature on the canvas
   - Click "Sign Contract"

4. **Confirmation**
   - Receive confirmation email
   - Get copy of signed contract

## API Endpoints

### Admin Endpoints

#### Send Contract to Guest
```
POST /api/admin/contracts/:id/send-guest
```
**Authentication**: Admin only

**Request Body**:
```json
{
  "guestName": "John Doe",
  "guestEmail": "john@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contract sent to guest successfully",
  "guestEmail": "john@example.com",
  "signingUrl": "https://app.veribuilds.com/guest-sign/abc-123-xyz",
  "expiresAt": "2024-01-15T00:00:00.000Z"
}
```

### Public Endpoints (No Auth Required)

#### Get Contract for Guest
```
GET /api/contracts/guest/:token
```

**Response**:
```json
{
  "id": "contract-123",
  "project_name": "Home Renovation",
  "project_description": "Kitchen remodel",
  "start_date": "2024-01-01",
  "end_date": "2024-03-01",
  "total_amount": "$50,000",
  "contract_content": "Full contract text...",
  "guest_name": "John Doe",
  "guest_email": "john@example.com",
  "token_expires_at": "2024-01-15T00:00:00.000Z"
}
```

#### Sign Contract as Guest
```
POST /api/contracts/guest/:token/sign
```

**Request Body**:
```json
{
  "signature": "data:image/png;base64,...",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contract signed successfully",
  "contractId": "contract-123",
  "signedAt": "2024-01-01T12:00:00.000Z"
}
```

## Database Schema

### Contracts Table - Guest Signing Fields

```sql
guest_token TEXT UNIQUE,           -- UUID token for guest access
guest_email TEXT,                  -- Email of guest signer
guest_name TEXT,                   -- Name of guest signer
token_expires_at DATETIME,         -- When the signing link expires
guest_signed_at DATETIME           -- When guest signed the contract
```

## Error Handling

### Common Errors

- **404 Not Found**: Invalid or expired token
- **410 Gone**: Token has expired
- **400 Bad Request**: 
  - Missing required fields
  - Email doesn't match intended recipient
  - Contract already signed

## URLs

- **Admin Send Page**: https://app.veribuilds.com/admin/send-contract-guest
- **Guest Signing**: https://app.veribuilds.com/guest-sign/:token

## Dependencies

- `react-signature-canvas`: For digital signature capture
- `@types/react-signature-canvas`: TypeScript types

## Future Enhancements

- [ ] PDF generation with guest signature
- [ ] SMS notifications option
- [ ] Multiple signers support
- [ ] Signature verification
- [ ] Audit trail logging
- [ ] Custom expiration periods
- [ ] Resend signing link option
- [ ] Contract templates for guests

## Support

For questions or issues:
- Email: info@veribuilds.com
- Phone: (360) 229-5524
