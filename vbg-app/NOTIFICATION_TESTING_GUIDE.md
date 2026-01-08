# VBG Notification System Testing Guide

## Overview
This guide provides comprehensive instructions for testing the notification system on the production server to ensure all notifications and notification settings are accurate for both users and admin.

## Production Server Details
- **IP**: 31.97.144.132
- **User**: root
- **Deploy Directory**: /root/vbg-app
- **Backend Port**: 4000
- **Frontend Port**: 3000

## Notification Types

The system supports 6 types of email notifications:

1. **Job Assignments** - Notifications when users are assigned to new job sites
2. **Job Updates** - Updates about job site progress and changes
3. **Safety Alerts** - Important safety notifications and requirements
4. **Schedule Changes** - Notifications about schedule updates and timeline changes
5. **General Messages** - General communications and project messages
6. **Admin Announcements** - Company-wide announcements and important notices

## Testing Methods

### Method 1: Automated Test Script (Recommended)

#### Step 1: Deploy Test Script to Production

```bash
# From your local machine, in the vbg-app directory
./deploy-test-notifications.sh
```

Or manually:

```bash
# Upload the test script
scp test-notifications.js root@31.97.144.132:/root/vbg-app/

# SSH into the server
ssh root@31.97.144.132

# Navigate to the app directory
cd /root/vbg-app

# Run the test
node test-notifications.js
```

#### What the Script Tests:

1. **Database Connection** - Verifies connection to MySQL database
2. **Table Structure** - Checks if notification_preferences table exists and has correct schema
3. **User Preferences** - Lists all users and their notification settings
4. **Preference Retrieval** - Tests fetching preferences for specific users
5. **Email System** - Sends test emails for each notification type
6. **Admin View** - Simulates admin viewing all user preferences
7. **Statistics Report** - Generates summary of notification settings across all users

### Method 2: Manual Testing via Web Interface

#### Testing User Notification Preferences

1. **Login as a User**
   - Navigate to: http://31.97.144.132:3000/login
   - Login with user credentials

2. **Access Notification Settings**
   - Go to Profile page
   - Click on "Notification Preferences" or navigate to: http://31.97.144.132:3000/notifications

3. **Test Preference Changes**
   - Toggle each notification type on/off
   - Click "Save Preferences"
   - Verify success message appears
   - Refresh the page and verify settings are persisted

4. **Verify Email Address**
   - Confirm the correct email address is displayed
   - Check that it matches the user's registered email

#### Testing Admin Notification Management

1. **Login as Admin**
   - Navigate to: http://31.97.144.132:3000/login
   - Login with admin credentials

2. **Access Admin Notification Management**
   - Navigate to: http://31.97.144.132:3000/admin/notifications

3. **View User Preferences**
   - Search for specific users
   - Filter by user type (client/subcontractor)
   - Click "View Preferences" for each user
   - Verify all 6 notification types are displayed
   - Check enabled/disabled status for each type

4. **Test Search and Filter**
   - Search by user name
   - Search by email
   - Filter by user type
   - Verify results update correctly

### Method 3: API Testing via cURL

#### Get User's Own Notification Preferences

```bash
ssh root@31.97.144.132

# Get user preferences (requires authentication cookie)
curl -X GET http://localhost:4000/api/user/notification-preferences \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -v
```

#### Update User's Notification Preferences

```bash
curl -X PUT http://localhost:4000/api/user/notification-preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -d '{
    "job_assignments": true,
    "job_updates": true,
    "safety_alerts": true,
    "schedule_changes": false,
    "general_messages": true,
    "admin_announcements": true
  }'
```

#### Admin: Get User's Notification Preferences

```bash
# Replace USER_ID with actual user ID
curl -X GET http://localhost:4000/api/admin/notification-preferences/USER_ID \
  -H "Cookie: token=ADMIN_AUTH_TOKEN" \
  -v
```

### Method 4: Database Direct Testing

```bash
# SSH into production server
ssh root@31.97.144.132

# Connect to MySQL
mysql -u root -p rooster_construction

# View all notification preferences
SELECT 
  u.id,
  u.name,
  u.email,
  u.user_type,
  np.job_assignments,
  np.job_updates,
  np.safety_alerts,
  np.schedule_changes,
  np.general_messages,
  np.admin_announcements
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
ORDER BY u.user_type, u.name;

# Check users without preferences
SELECT u.id, u.name, u.email, u.user_type
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE np.user_id IS NULL;

# Get statistics
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN np.user_id IS NOT NULL THEN 1 ELSE 0 END) as users_with_prefs,
  SUM(CASE WHEN np.user_id IS NULL THEN 1 ELSE 0 END) as users_without_prefs
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id;
```

## Testing Email Delivery

### Test Email Sending

1. **Via Test Script**
   - The automated test script sends test emails to admin
   - Check admin inbox for test emails
   - Verify all 6 notification types are received

2. **Via API Endpoint**
   ```bash
   ssh root@31.97.144.132
   
   curl -X POST http://localhost:4000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "admin@veribuilds.com",
       "subject": "Test Notification",
       "message": "Testing notification system"
     }'
   ```

3. **Trigger Real Notifications**
   - Assign a user to a job site (should trigger job_assignments email)
   - Update a job site (should trigger job_updates email)
   - Create an admin announcement (should trigger admin_announcements email)

### Verify Email Settings

Check that emails are being sent from the correct address:

```bash
# On production server
cd /root/vbg-app

# Check email configuration
grep -r "info@veribuilds.com" utils/
grep -r "RESEND_API_KEY" .env
```

Expected configuration:
- **Sender**: Veritas Building Group <info@veribuilds.com>
- **API**: Resend API
- **API Key**: Should be set in environment variables

## Common Issues and Troubleshooting

### Issue 1: Users Have No Notification Preferences

**Symptom**: User preferences show as NULL or don't exist

**Solution**:
```sql
-- Create default preferences for all users without them
INSERT INTO notification_preferences (user_id)
SELECT id FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
);
```

### Issue 2: Emails Not Being Sent

**Check**:
1. Verify Resend API key is set: `echo $RESEND_API_KEY`
2. Check email service is running: `pm2 list`
3. Check server logs: `pm2 logs vbg-backend`
4. Verify email utility exists: `ls -la utils/email.js utils/resend.js`

### Issue 3: Preferences Not Saving

**Check**:
1. Verify backend is running: `pm2 list`
2. Check database connection: `mysql -u root -p rooster_construction`
3. Check API endpoint: `curl http://localhost:4000/api/user/notification-preferences`
4. Check browser console for errors

### Issue 4: Admin Cannot View User Preferences

**Check**:
1. Verify user is admin: `SELECT is_admin FROM users WHERE email = 'admin@email.com'`
2. Check admin authentication
3. Verify API endpoint: `curl http://localhost:4000/api/admin/users`

## Expected Results

### Successful Test Results

✅ **Database Connection**: Successfully connects to MySQL
✅ **Table Structure**: notification_preferences table exists with all 6 columns
✅ **User Preferences**: All users have notification preferences (or defaults are created)
✅ **Preference Retrieval**: Can fetch preferences for any user
✅ **Email System**: Test emails sent successfully for all 6 notification types
✅ **Admin View**: Admin can view all users and their preferences
✅ **Statistics**: Accurate counts of enabled/disabled notifications

### Test Email Content

Each test email should:
- Have VBG branding
- Show the notification type being tested
- Include description of the notification type
- Be sent from: Veritas Building Group <info@veribuilds.com>
- Arrive in admin inbox within 1-2 minutes

## Post-Testing Checklist

- [ ] All users have notification preferences set
- [ ] Admin can view all user notification settings
- [ ] Users can update their own notification preferences
- [ ] Changes to preferences are saved and persisted
- [ ] Test emails received for all notification types
- [ ] Email sender is correct (info@veribuilds.com)
- [ ] No errors in server logs
- [ ] Database queries return expected results
- [ ] Frontend UI displays preferences correctly
- [ ] Admin panel shows accurate user preference data

## Production Notification Flow

### When a Notification Should Be Sent:

1. **System Event Occurs** (e.g., job assignment, schedule change)
2. **Backend Checks User Preferences**
   ```javascript
   const [prefs] = await db.query(
     'SELECT * FROM notification_preferences WHERE user_id = ?',
     [userId]
   );
   ```
3. **If Notification Type is Enabled**
   ```javascript
   if (prefs.job_assignments) {
     await sendEmail({
       to: user.email,
       subject: 'New Job Assignment',
       html: emailTemplate
     });
   }
   ```
4. **Email Sent via Resend API**
5. **User Receives Email**

## Maintenance

### Regular Checks

1. **Weekly**: Verify email delivery rates
2. **Monthly**: Review notification preferences statistics
3. **Quarterly**: Clean up old notification logs
4. **As Needed**: Update notification templates

### Monitoring

Monitor these metrics:
- Email delivery success rate
- Users with all notifications disabled
- Most/least used notification types
- Email bounce rates

## Support

If issues persist after testing:

1. Check server logs: `pm2 logs vbg-backend`
2. Check database logs: `tail -f /var/log/mysql/error.log`
3. Verify environment variables: `cat .env | grep RESEND`
4. Test database connection: `mysql -u root -p rooster_construction`
5. Restart services if needed: `pm2 restart all`

## Additional Resources

- **Email Service**: utils/email.js, utils/resend.js
- **API Endpoints**: server.js (lines 5875-5980)
- **Frontend Pages**: 
  - User: app/notifications/page.tsx
  - Admin: app/admin/notifications/page.tsx
- **Database Schema**: notification_preferences table
