# Veritas Building Group Web Application
## Comprehensive Technical Report
**Generated: November 28, 2025**

---

## Executive Summary

The Veritas Building Group (VBG) web application is a full-stack construction management platform built with Next.js 14 (frontend) and Express.js (backend). The application provides comprehensive tools for managing clients, contracts, invoices, estimates, job sites, appointments, and team communications. Recent security enhancements include AES-256 database encryption using SQLCipher.

---

## 1. Security Features

### 1.1 Database Encryption (NEW)
| Feature | Details |
|---------|---------|
| **Encryption Type** | AES-256 (SQLCipher) |
| **Database File** | `vbg_encrypted.db` |
| **Driver** | `better-sqlite3-multiple-ciphers` |
| **Key Storage** | Environment variable (`DB_ENCRYPTION_KEY`) |
| **Backup** | Unencrypted backup preserved at `vbg_unencrypted_backup.db` |

The entire SQLite database is encrypted at rest. All 30 tables and their data are protected with industry-standard AES-256 encryption.

### 1.2 Authentication & Authorization
| Feature | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with salt rounds |
| **Session Management** | JWT (JSON Web Tokens) |
| **Token Expiry** | 24 hours (configurable) |
| **Cookie Security** | HttpOnly, Secure, SameSite=Lax |
| **Email Verification** | Required for new accounts |
| **Password Reset** | Token-based with expiration |

### 1.3 API Security
| Feature | Implementation |
|---------|----------------|
| **Rate Limiting** | express-rate-limit |
| **CORS** | Configured for production domains |
| **Helmet.js** | Security headers enabled |
| **Input Validation** | Server-side validation on all endpoints |
| **SQL Injection Prevention** | Parameterized queries |
| **XSS Protection** | Content Security Policy headers |

### 1.4 Infrastructure Security
| Feature | Details |
|---------|---------|
| **HTTPS** | Enforced in production |
| **Production Server** | 31.97.144.132 |
| **Process Manager** | PM2 with auto-restart |
| **Environment Variables** | Sensitive data in `.env` (not committed) |

---

## 2. User Management

### 2.1 User Types
| Type | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | All features, user management, system settings |
| **Client** | Property owners/customers | View contracts, invoices, documents, schedule appointments |
| **Subcontractor** | Trade partners | Job site access, messaging, document uploads |

### 2.2 User Features
- **Registration** with email verification
- **Login/Logout** with secure session management
- **Password Reset** via email link
- **Profile Management** (name, email, phone, company)
- **Notification Preferences** (email, in-app)

---

## 3. Contract Management

### 3.1 Contract Creation
- **Template System**: Pre-built contract templates (Construction, Subcontractor)
- **Rich Text Editor**: Full formatting support for contract content
- **Placeholder System**: Auto-fills client info, dates, amounts
  - Supported: `{{CLIENT_NAME}}`, `{{PROJECT_ADDRESS}}`, `{{TOTAL_AMOUNT}}`, `{{EFFECTIVE_DATE}}`, etc.

### 3.2 Digital Signatures
| Feature | Details |
|---------|---------|
| **Admin Signature** | Captured before sending |
| **Guest Signature** | Captured via secure token link |
| **Signature Storage** | Base64 encoded in database |
| **Timestamp** | Recorded for both parties |

### 3.3 Contract Workflow
1. Admin creates contract with template
2. Admin signs contract
3. System generates secure guest signing link (7-day expiry)
4. Guest receives email with signing link
5. Guest reviews and signs
6. Both parties receive signed PDF via email
7. Contract status updated to "signed"

### 3.4 Email Notifications
- **Contract Sent**: Professional HTML email to guest
- **Contract Signed**: Confirmation to guest + admin notification
- **PDF Attachment**: Signed contract attached to confirmation emails

---

## 4. Invoice & Payment Management

### 4.1 Invoice Features
- **Create/Edit/Delete** invoices
- **Line Items** with descriptions, quantities, rates
- **Tax Calculation** support
- **Status Tracking**: Draft, Sent, Paid, Overdue
- **PDF Generation** for download/email

### 4.2 Payment Tracking
- **Payment Records** linked to invoices
- **Payment Methods**: Check, Credit Card, Bank Transfer, Cash
- **Partial Payments** supported
- **Payment History** with timestamps

---

## 5. Estimate Management

### 5.1 Estimate Features
- **Create Estimates** with detailed line items
- **Convert to Invoice** when approved
- **Status Tracking**: Draft, Sent, Approved, Rejected
- **Expiration Dates** for time-limited offers
- **Client Approval** workflow

---

## 6. Job Site Management

### 6.1 Job Site Features
| Feature | Description |
|---------|-------------|
| **Create Job Sites** | Name, address, description, dates |
| **Team Assignment** | Assign subcontractors to sites |
| **Status Tracking** | Active, Completed, On Hold |
| **Photo Uploads** | Document progress with images |
| **Comments** | Team communication per site |

### 6.2 Job Site Messaging
- **Real-time Updates** for team members
- **File Attachments** in messages
- **Activity Log** tracking all changes
- **Notification System** for new messages

---

## 7. Document Management

### 7.1 Document Features
- **Upload Documents** (PDF, images, etc.)
- **Document Types**: Contract, Invoice, Permit, Insurance, Other
- **Expiration Tracking** with alerts
- **Secure Storage** on server
- **Download/Preview** functionality

### 7.2 Document Expiry System
- **Automated Checks** daily at 9 AM
- **Email Alerts** for expiring documents
- **Dashboard Warnings** for admins

---

## 8. Appointment Scheduling

### 8.1 Cal.com Integration
| Feature | Details |
|---------|---------|
| **Booking System** | Integrated Cal.com |
| **Webhook Handler** | Auto-creates appointments in database |
| **Email Notifications** | Customer confirmation + admin alerts |
| **Calendar Sync** | Automatic scheduling |

### 8.2 Appointment Management
- **View All Appointments** in admin dashboard
- **Status Updates**: Scheduled, Completed, Cancelled
- **Customer Information** linked to CRM

---

## 9. CRM (Customer Relationship Management)

### 9.1 Contact Management
- **Contact Database** with full details
- **Lead Tracking** from website forms
- **Communication History** (emails, notes)
- **Source Tracking** (website, referral, etc.)

### 9.2 Lead Notifications
- **New Lead Alerts** to admin emails
- **In-App Notifications** for new contacts
- **Auto-Response** emails to leads

---

## 10. Notification System

### 10.1 In-App Notifications
| Event | Notification |
|-------|--------------|
| New Lead | "New lead from [name]" |
| Contract Signed | "Contract signed by [name]" |
| New Message | "New message on [job site]" |
| Document Expiring | "Document expires in X days" |

### 10.2 Email Notifications
- **Resend API** for reliable delivery
- **HTML Templates** with professional branding
- **Sender**: `Veritas Building Group <info@veribuilds.com>`
- **Admin Recipients**: info@veribuilds.com, niko@veribuilds.com

---

## 11. Dashboard & Analytics

### 11.1 Admin Dashboard
- **Quick Stats**: Active contracts, pending invoices, upcoming appointments
- **Recent Activity** feed
- **Quick Actions**: Create contract, send invoice, add job site
- **Notification Center**

### 11.2 Client Dashboard
- **My Contracts** with status
- **My Invoices** with payment status
- **My Documents** library
- **Schedule Appointment** button

---

## 12. Technical Architecture

### 12.1 Frontend Stack
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Lucide Icons** | Icon system |

### 12.2 Backend Stack
| Technology | Purpose |
|------------|---------|
| **Express.js** | API server |
| **SQLite + SQLCipher** | Encrypted database |
| **better-sqlite3-multiple-ciphers** | Database driver |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **Multer** | File uploads |
| **jsPDF** | PDF generation |

### 12.3 External Services
| Service | Purpose |
|---------|---------|
| **Resend** | Email delivery |
| **Cal.com** | Appointment scheduling |

---

## 13. Database Schema

### 13.1 Core Tables (30 total)
| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `admin_users` | Admin-specific data |
| `password_reset_tokens` | Password reset flow |
| `contracts` | Contract records |
| `contract_templates` | Reusable templates |
| `invoices` | Invoice records |
| `receipts` | Payment receipts |
| `estimates` | Project estimates |
| `documents` | Uploaded files |
| `job_sites` | Construction sites |
| `job_assignments` | Team assignments |
| `job_messages` | Site communications |
| `job_site_uploads` | Site photos/files |
| `job_site_comments` | Site comments |
| `job_site_activity` | Activity log |
| `notifications` | In-app notifications |
| `notification_preferences` | User preferences |
| `appointments` | Scheduled meetings |
| `payments` | Payment records |
| `services` | Service catalog |
| `service_bookings` | Service orders |
| `service_booking_items` | Order line items |
| `crm_emails` | Email history |
| `crm_notes` | Contact notes |
| `email_templates` | Email templates |

---

## 14. API Endpoints

### 14.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | User registration |
| POST | `/api/login` | User login |
| POST | `/api/logout` | User logout |
| GET | `/api/verify-email` | Email verification |
| POST | `/api/forgot-password` | Request password reset |
| POST | `/api/reset-password` | Reset password |

### 14.2 Contracts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contracts` | List contracts |
| POST | `/api/contracts` | Create contract |
| GET | `/api/contracts/:id` | Get contract |
| PUT | `/api/contracts/:id` | Update contract |
| DELETE | `/api/contracts/:id` | Delete contract |
| POST | `/api/admin/contracts/create-and-send-guest` | Send for guest signing |
| POST | `/api/contracts/guest/:token/sign` | Guest signs contract |

### 14.3 Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |

### 14.4 Job Sites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/job-sites` | List job sites |
| POST | `/api/admin/job-sites` | Create job site |
| GET | `/api/admin/job-sites/:id` | Get job site |
| PUT | `/api/admin/job-sites/:id` | Update job site |
| POST | `/api/admin/job-sites/:id/messages` | Add message |
| POST | `/api/admin/job-sites/:id/upload` | Upload file |

### 14.5 Users & Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/admin/users` | Admin user list |
| POST | `/api/admin/invite-client` | Invite new client |
| PUT | `/api/admin/users/:id` | Update user |

---

## 15. Deployment Information

### 15.1 Production Environment
| Component | Details |
|-----------|---------|
| **Server IP** | 31.97.144.132 |
| **Frontend URL** | https://app.veribuilds.com |
| **Backend Port** | 5002 |
| **Frontend Port** | 5003 |
| **Process Manager** | PM2 |

### 15.2 PM2 Processes
| Process | Port | Status |
|---------|------|--------|
| vbg-frontend | 5003 | Online |
| vbg-backend | 5002 | Online |
| rooster-master | 3000 | Online |
| rooster-backend | 4000 | Online |

---

## 16. Credentials Reference

**Important**: All credentials are stored in `CREDENTIALS.md` (not committed to git) and `.env` files.

### 16.1 Key Credentials
| Item | Location |
|------|----------|
| Server Access | CREDENTIALS.md |
| Database Encryption Key | .env (`DB_ENCRYPTION_KEY`) |
| JWT Secret | .env (`JWT_SECRET`) |
| Resend API Key | .env (`RESEND_API_KEY`) |
| Admin Account | info@veribuilds.com |

---

## 17. Recent Updates (November 2025)

### 17.1 Security Enhancements
- Implemented AES-256 database encryption with SQLCipher
- Migrated all data to encrypted database
- Updated database driver to `better-sqlite3-multiple-ciphers`

### 17.2 Contract System Improvements
- Added admin signature capture before sending
- Implemented PDF generation for signed contracts
- PDF attachment in confirmation emails
- Removed emojis from professional emails
- Fixed all placeholder replacements

### 17.3 UI/UX Updates
- Removed "Request an Estimate" from client quick actions
- Created admin account (info@veribuilds.com)
- Enhanced notification system

---

## 18. Maintenance & Support

### 18.1 Regular Maintenance Tasks
- [ ] Monitor PM2 process health
- [ ] Check document expiration alerts
- [ ] Review error logs
- [ ] Database backups (encrypted)
- [ ] SSL certificate renewal

### 18.2 Backup Strategy
| Backup Type | Frequency | Location |
|-------------|-----------|----------|
| Database | Daily | Server + offsite |
| Uploads | Weekly | Server + offsite |
| Code | Git commits | GitHub |

---

## 19. Contact Information

**Veritas Building Group**
- Website: https://veribuilds.com
- App: https://app.veribuilds.com
- Email: info@veribuilds.com
- Admin: niko@veribuilds.com

---

*This report was generated automatically. For questions or updates, contact the development team.*
