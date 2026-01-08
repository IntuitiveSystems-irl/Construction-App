# VBG Notification System Testing - Summary

## 📦 Testing Package Created

A comprehensive notification testing suite has been created for the VBG production server. This package includes automated tests, manual testing guides, and quick-access scripts.

## 🎯 Purpose

Test and verify that all notifications and notification settings are accurate for both users and admin on the production server (31.97.144.132).

## 📂 Files Created

| File | Purpose |
|------|---------|
| `test-notifications.js` | Automated test script that checks database, preferences, and sends test emails |
| `deploy-test-notifications.sh` | Automated deployment script to upload and run tests on production |
| `quick-test-notifications.sh` | Interactive menu for quick access to common testing tasks |
| `NOTIFICATION_TESTING_GUIDE.md` | Comprehensive testing guide with all methods and troubleshooting |
| `NOTIFICATION_TEST_QUICKSTART.md` | Quick start guide for immediate testing |
| `NOTIFICATION_TESTING_SUMMARY.md` | This summary document |

## 🚀 Quick Start Commands

### Easiest Method - Interactive Menu
```bash
cd /Users/lindsay/CascadeProjects/Veritas\ Building\ Group\ Web\ App/vbg-app
./quick-test-notifications.sh
```
Select option 2 to run full tests.

### Automated Method
```bash
cd /Users/lindsay/CascadeProjects/Veritas\ Building\ Group\ Web\ App/vbg-app
./deploy-test-notifications.sh
```

### Manual Method
```bash
ssh root@31.97.144.132
cd /root/vbg-app
# Upload test-notifications.js first
node test-notifications.js
```

## 📧 Notification Types Covered

The system tests all 6 notification types:

1. ✉️ **Job Assignments** - New job site assignments
2. 📝 **Job Updates** - Job site progress and changes  
3. ⚠️ **Safety Alerts** - Safety notifications and requirements
4. 📅 **Schedule Changes** - Schedule updates and timeline changes
5. 💬 **General Messages** - General communications
6. 📢 **Admin Announcements** - Company-wide announcements

## 🧪 What Gets Tested

### Automated Tests (test-notifications.js)

1. **Database Connection**
   - Verifies MySQL connection
   - Checks notification_preferences table exists
   - Displays table structure

2. **User Notification Preferences**
   - Lists all users and their settings
   - Identifies users without preferences
   - Creates default preferences if needed

3. **Preference Retrieval**
   - Tests fetching preferences for specific users
   - Verifies data format and values

4. **Email Notification System**
   - Sends test emails for all 6 notification types
   - Verifies email sending functionality
   - Tests Resend API integration

5. **Admin Notification View**
   - Simulates admin viewing all user preferences
   - Groups users by type
   - Shows statistics

6. **Summary Report**
   - Total users count
   - Users with/without preferences
   - Notification type statistics
   - Enabled/disabled counts

### Manual Web Interface Tests

1. **User Notification Preferences Page**
   - Access: http://31.97.144.132:3000/notifications
   - Toggle notification settings
   - Save and verify persistence
   - Check email display

2. **Admin Notification Management Page**
   - Access: http://31.97.144.132:3000/admin/notifications
   - View all users
   - Search and filter functionality
   - View individual user preferences

### API Endpoint Tests

- `GET /api/user/notification-preferences` - Get user's preferences
- `PUT /api/user/notification-preferences` - Update user's preferences
- `GET /api/admin/notification-preferences/:userId` - Admin view user preferences

## ✅ Expected Results

### Successful Test Output
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                  VBG NOTIFICATION SYSTEM TEST SUITE                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

=== 1. Testing Database Connection ===
✓ Database connection successful
✓ notification_preferences table exists

=== 2. Testing User Notification Preferences ===
Found X users in database
✓ All users have notification preferences

=== 3. Testing Notification Preference Retrieval ===
✓ Successfully retrieved notification preferences

=== 4. Testing Email Notification System ===
✓ Job Assignments email sent successfully
✓ Job Updates email sent successfully
✓ Safety Alerts email sent successfully
✓ Schedule Changes email sent successfully
✓ General Messages email sent successfully
✓ Admin Announcements email sent successfully

=== 5. Testing Admin Notification View ===
✓ Successfully retrieved all user preferences

=== 6. Generating Summary Report ===
✓ Statistics generated

=== Test Summary ===
✓ PASSED - Database Connection
✓ PASSED - User Notification Preferences
✓ PASSED - Preference Retrieval
✓ PASSED - Email Notification System
✓ PASSED - Admin Notification View
✓ PASSED - Summary Report

All tests passed! (6/6)
```

## 📊 Key Metrics to Verify

- ✅ Total users in system
- ✅ Users with notification preferences set
- ✅ Users without preferences (should be 0 after test)
- ✅ Email delivery success rate (should be 100%)
- ✅ Each notification type enabled/disabled counts
- ✅ Admin users count
- ✅ No database errors
- ✅ No email sending errors

## 🔍 Verification Checklist

After running tests, verify:

- [ ] All 6 tests pass
- [ ] Database connection successful
- [ ] notification_preferences table exists with correct schema
- [ ] All users have preferences (or defaults created)
- [ ] Test emails received in admin inbox (check spam folder)
- [ ] Emails sent from: Veritas Building Group <info@veribuilds.com>
- [ ] Web interface loads correctly
- [ ] User can update their own preferences
- [ ] Admin can view all user preferences
- [ ] Changes persist after page refresh
- [ ] No errors in PM2 logs
- [ ] Backend running on port 4000
- [ ] Frontend running on port 3000

## 🐛 Common Issues & Solutions

### Issue: Users without preferences
**Solution**: Run option 8 in quick-test-notifications.sh menu

### Issue: Emails not received
**Solution**: 
- Check spam/junk folder
- Verify Resend API key: `echo $RESEND_API_KEY`
- Check email service logs: `pm2 logs vbg-backend`

### Issue: Database connection failed
**Solution**:
- Verify MySQL is running: `systemctl status mysql`
- Check credentials in .env file
- Test connection: `mysql -u root -p rooster_construction`

### Issue: Backend not responding
**Solution**:
- Check PM2 status: `pm2 list`
- Restart backend: `pm2 restart vbg-backend`
- Check logs: `pm2 logs vbg-backend --lines 50`

## 📧 Email Configuration

All emails are sent via Resend API:

- **Sender**: Veritas Building Group <info@veribuilds.com>
- **API Key**: Set in environment variable `RESEND_API_KEY`
- **Admin Emails**: niko@veribuilds.com, info@veribuilds.com
- **Service Files**: utils/email.js, utils/resend.js

## 🗄️ Database Schema

### notification_preferences table
```sql
CREATE TABLE notification_preferences (
  user_id INT PRIMARY KEY,
  job_assignments BOOLEAN DEFAULT TRUE,
  job_updates BOOLEAN DEFAULT TRUE,
  safety_alerts BOOLEAN DEFAULT TRUE,
  schedule_changes BOOLEAN DEFAULT TRUE,
  general_messages BOOLEAN DEFAULT TRUE,
  admin_announcements BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend | http://31.97.144.132:3000 |
| Backend API | http://31.97.144.132:4000 |
| User Login | http://31.97.144.132:3000/login |
| User Notifications | http://31.97.144.132:3000/notifications |
| Admin Notifications | http://31.97.144.132:3000/admin/notifications |
| User Profile | http://31.97.144.132:3000/profile |

## 🔐 Production Server Access

- **IP**: 31.97.144.132
- **User**: root
- **Password**: 4Underoath7@
- **App Directory**: /root/vbg-app
- **Database**: rooster_construction
- **PM2 Processes**: vbg-frontend, vbg-backend, rooster-master, rooster-backend

## 📝 Testing Workflow

1. **Preparation**
   - Ensure you have SSH access to production server
   - Have admin email access ready
   - Review notification types

2. **Run Automated Tests**
   - Use quick-test-notifications.sh menu (option 2)
   - Or use deploy-test-notifications.sh
   - Review console output

3. **Verify Email Delivery**
   - Check admin inbox (niko@veribuilds.com, info@veribuilds.com)
   - Verify 6 test emails received
   - Check sender and formatting

4. **Test Web Interface**
   - Login as user and test notification preferences page
   - Login as admin and test notification management page
   - Verify search, filter, and view functions

5. **Database Verification**
   - Check all users have preferences
   - Verify statistics are accurate
   - Ensure no orphaned records

6. **Documentation**
   - Note any issues found
   - Document test results
   - Update preferences if needed

## 🎓 Training Notes

### For Users
- Users can manage their notification preferences from Profile → Notification Preferences
- All notifications are sent via email only (SMS disabled)
- Safety alerts are recommended to keep enabled
- Changes take effect immediately

### For Admins
- Admins can view all user notification preferences
- Cannot modify user preferences (users control their own)
- Use search and filter to find specific users
- Monitor notification statistics regularly

## 📈 Monitoring & Maintenance

### Regular Checks
- **Weekly**: Verify email delivery rates
- **Monthly**: Review notification preferences statistics
- **Quarterly**: Clean up old notification logs
- **As Needed**: Update notification templates

### Key Metrics
- Email delivery success rate
- Users with all notifications disabled
- Most/least used notification types
- Email bounce rates
- User engagement with notifications

## 🎯 Success Criteria

Testing is successful when:

✅ All automated tests pass (6/6)  
✅ All users have notification preferences  
✅ Test emails delivered successfully  
✅ Web interface works correctly  
✅ Admin can view all user settings  
✅ Users can update their preferences  
✅ Changes persist correctly  
✅ No errors in logs  
✅ Database queries return expected results  
✅ Email configuration is correct  

## 📞 Support & Resources

- **Testing Guide**: NOTIFICATION_TESTING_GUIDE.md
- **Quick Start**: NOTIFICATION_TEST_QUICKSTART.md
- **Test Script**: test-notifications.js
- **Quick Menu**: quick-test-notifications.sh
- **Deploy Script**: deploy-test-notifications.sh

## 🚀 Next Steps

1. Run the automated tests using quick-test-notifications.sh
2. Review test results and verify all pass
3. Check admin email for test notifications
4. Test web interface manually
5. Verify database statistics
6. Document any issues or improvements needed
7. Create default preferences for any users without them
8. Monitor email delivery over next few days

---

**Ready to start testing?**

```bash
cd /Users/lindsay/CascadeProjects/Veritas\ Building\ Group\ Web\ App/vbg-app
./quick-test-notifications.sh
```

Select option 2 to run the full test suite!
