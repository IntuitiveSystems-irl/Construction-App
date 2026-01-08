# VBG User Flow Testing Checklist

## 🧪 Testing Instructions
Use this checklist to manually test all user flows. Check off each item as you complete it.

---

## 📋 Public User Flows

### Registration & Login
- [ ] Visit homepage (/)
- [ ] Click "Register" and create new account
- [ ] Verify email verification email is sent
- [ ] Click verification link in email
- [ ] Login with new credentials
- [ ] Test "Forgot Password" flow
- [ ] Reset password and login with new password

### Public Pages
- [ ] View Services page (/services)
- [ ] Request estimate (/request-estimate)
- [ ] Submit estimate request form
- [ ] Verify estimate request email is sent to admin

---

## 👤 Client User Flows

### Dashboard Access
- [ ] Login as client user
- [ ] View dashboard (/dashboard)
- [ ] Check all dashboard widgets load
- [ ] Navigate to Profile (/profile)
- [ ] Update profile information
- [ ] Upload profile picture

### Documents
- [ ] Navigate to Documents (/documents)
- [ ] Upload a new document
- [ ] View uploaded documents
- [ ] Download a document
- [ ] Delete a document

### Contracts
- [ ] Navigate to Contracts (/contracts)
- [ ] View contract list
- [ ] Open a contract
- [ ] Sign a contract (if unsigned)
- [ ] Download signed contract PDF

### Invoices
- [ ] Navigate to Invoices (/invoices)
- [ ] View invoice list
- [ ] Open an invoice
- [ ] Pay an invoice (if unpaid)
- [ ] Download invoice PDF

### Estimates
- [ ] Navigate to Estimates (/estimates)
- [ ] View estimate list
- [ ] Open an estimate
- [ ] Accept/decline estimate

### Job Sites
- [ ] Navigate to Job Sites (/job-sites)
- [ ] View assigned job sites
- [ ] Open a job site
- [ ] View job site details
- [ ] Post a message/update
- [ ] View job site documents

### Payments
- [ ] Navigate to Payments (/payments)
- [ ] View payment history
- [ ] Make a payment

### Receipts
- [ ] Navigate to Receipts (/receipts)
- [ ] View receipt list
- [ ] Download a receipt

### Schedule
- [ ] Navigate to Schedule (/schedule)
- [ ] View calendar
- [ ] Check scheduled appointments

---

## 👷 Subcontractor User Flows

### Dashboard
- [ ] Login as subcontractor
- [ ] View subcontractor dashboard
- [ ] Check assigned job sites

### Job Sites
- [ ] View assigned job sites
- [ ] Update job site status
- [ ] Post updates/messages
- [ ] Upload job site photos

### Payments
- [ ] View payment history
- [ ] Submit payment request
- [ ] View pending payments

---

## 👨‍💼 Admin User Flows

### Admin Dashboard
- [ ] Login as admin (admin@businessintuitive.tech)
- [ ] View admin dashboard (/dashboard?tab=admin)
- [ ] Check all admin quick actions display

### User Management
- [ ] Click "Edit User Profiles"
- [ ] View all users list (/admin/users)
- [ ] Search for a user
- [ ] Click "Edit" on a user
- [ ] Update user information
- [ ] Save changes
- [ ] Delete a user (test user only)

### Job Sites Management
- [ ] Click "Job Sites" from admin dashboard
- [ ] View all job sites (/admin/job-sites)
- [ ] Create a new job site
- [ ] Assign users to job site
- [ ] Send message to job site team
- [ ] Edit job site details
- [ ] Delete a job site (test only)

### Estimates
- [ ] Navigate to Admin Estimates (/admin/estimates)
- [ ] View all estimate requests
- [ ] Create and send estimate
- [ ] Edit estimate
- [ ] Mark estimate as accepted/declined

### Invoices
- [ ] Navigate to Admin Invoices (/admin/invoices)
- [ ] View all invoices
- [ ] Create new invoice
- [ ] Send invoice to client
- [ ] Mark invoice as paid
- [ ] Download invoice PDF

### Contracts
- [ ] Click "Generate Contract"
- [ ] Select client
- [ ] Fill out contract details
- [ ] Preview contract
- [ ] Send contract to client
- [ ] View contract status

### Documents Management
- [ ] Navigate to Documents (/admin/documents)
- [ ] View all user documents
- [ ] Upload document for user
- [ ] Set document expiration
- [ ] Delete expired documents

### CRM
- [ ] Click "CRM Dashboard"
- [ ] View all contacts (/admin/crm-integrated)
- [ ] Search for a contact
- [ ] Click email icon on contact
- [ ] Send individual email
- [ ] Select multiple contacts
- [ ] Send bulk email
- [ ] Verify emails are sent

### Payments Management
- [ ] Navigate to Payments (/admin/payments/subcontractors)
- [ ] View all payment requests
- [ ] Approve payment
- [ ] Process payment

### Receipts Management
- [ ] Navigate to Receipts (/admin/receipts)
- [ ] View all receipts
- [ ] Upload receipt
- [ ] Associate receipt with payment

### Notifications
- [ ] Navigate to Notifications (/admin/notifications)
- [ ] View all system notifications
- [ ] Mark notifications as read
- [ ] Delete notifications

### SMS Management
- [ ] Navigate to SMS Management (/admin/sms-management)
- [ ] View SMS history
- [ ] Send test SMS (if enabled)

---

## 🔗 Navigation Tests

### Header Navigation
- [ ] Click VBG logo (returns to dashboard)
- [ ] Click "Home" link
- [ ] Click "Documents" link
- [ ] Click "Contracts" link
- [ ] Click "Profile" link
- [ ] Click "Logout" button

### Admin Navigation
- [ ] All admin quick action buttons work
- [ ] Back buttons return to correct pages
- [ ] Breadcrumbs work correctly

---

## 🎨 UI/UX Tests

### Branding Consistency
- [ ] All pages use cyan/teal color scheme
- [ ] No old blue/orange colors remain
- [ ] Buttons have consistent styling
- [ ] Forms have consistent styling
- [ ] Modals have consistent styling

### Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)

### Loading States
- [ ] Loading spinners appear during data fetch
- [ ] Skeleton screens work (if implemented)
- [ ] Error messages display correctly

---

## 🔒 Security Tests

### Authentication
- [ ] Cannot access protected routes when logged out
- [ ] Cannot access admin routes as regular user
- [ ] Session persists across page refreshes
- [ ] Logout clears session properly

### Authorization
- [ ] Clients cannot access admin pages
- [ ] Subcontractors cannot access client-only features
- [ ] Users can only see their own data

---

## 📧 Email Tests

### System Emails
- [ ] Registration verification email
- [ ] Password reset email
- [ ] Contract sent email
- [ ] Invoice sent email
- [ ] Estimate sent email
- [ ] Payment confirmation email
- [ ] Document expiration warning email

### CRM Emails
- [ ] Individual contact email
- [ ] Bulk contact emails
- [ ] Emails sent from info@veribuilds.com

---

## 🐛 Known Issues to Check

- [ ] Any console errors in browser
- [ ] Any 404 errors for missing pages
- [ ] Any broken images
- [ ] Any broken links
- [ ] Any forms that don't submit
- [ ] Any buttons that don't respond

---

## ✅ Test Results

**Date Tested:** _______________  
**Tested By:** _______________  
**Browser:** _______________  
**Device:** _______________  

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Overall Status:** ⬜ Pass  ⬜ Fail  ⬜ Needs Review
