# VBG Notification Testing - Quick Start Guide

## 🚀 Quick Start (Easiest Method)

### Option 1: Interactive Menu (Recommended)

```bash
cd /Users/lindsay/CascadeProjects/Veritas\ Building\ Group\ Web\ App/vbg-app
./quick-test-notifications.sh
```

This will show you a menu with options:
1. SSH into production server
2. **Upload and run notification test script** ← Start here
3. Check notification preferences in database
4. View PM2 process status
5. Check backend logs
6. Test email sending
7. View all users and their notification settings
8. Create default preferences for users without them
9. Exit

### Option 2: Automated Deployment

```bash
cd /Users/lindsay/CascadeProjects/Veritas\ Building\ Group\ Web\ App/vbg-app
./deploy-test-notifications.sh
```

This will automatically:
- Upload the test script to production
- Run comprehensive tests
- Display results

### Option 3: Manual SSH

```bash
# SSH into production
ssh root@31.97.144.132

# Navigate to app directory
cd /root/vbg-app

# Upload test script first (from local machine)
# scp test-notifications.js root@31.97.144.132:/root/vbg-app/

# Run the test
node test-notifications.js
```

## 📋 What Gets Tested

The automated test script will:

✅ **Database Connection** - Verify MySQL connection  
✅ **Table Structure** - Check notification_preferences table  
✅ **User Preferences** - List all users and their settings  
✅ **Preference Retrieval** - Test fetching specific user preferences  
✅ **Email System** - Send test emails for all 6 notification types  
✅ **Admin View** - Simulate admin viewing all preferences  
✅ **Statistics Report** - Generate summary of notification settings  

## 📧 Email Notifications Tested

The script will send test emails for:

1. **Job Assignments** - New job site assignments
2. **Job Updates** - Job site progress and changes
3. **Safety Alerts** - Safety notifications and requirements
4. **Schedule Changes** - Schedule updates and timeline changes
5. **General Messages** - General communications
6. **Admin Announcements** - Company-wide announcements

**Check admin email** (niko@veribuilds.com or info@veribuilds.com) for test emails.

## 🔍 Manual Testing via Web Interface

### Test User Notification Preferences

1. Go to: http://31.97.144.132:3000/login
2. Login as a user
3. Navigate to Profile → Notification Preferences
4. Toggle settings and save
5. Verify changes persist after refresh

### Test Admin Notification Management

1. Go to: http://31.97.144.132:3000/login
2. Login as admin
3. Navigate to: http://31.97.144.132:3000/admin/notifications
4. Search/filter users
5. View individual user preferences
6. Verify all settings display correctly

## 🗄️ Database Quick Checks

```bash
# SSH into server
ssh root@31.97.144.132

# Connect to database
mysql -u root -p4Underoath7@ rooster_construction

# View all notification preferences
SELECT 
  u.name, 
  u.email, 
  np.job_assignments, 
  np.job_updates, 
  np.safety_alerts,
  np.schedule_changes,
  np.general_messages,
  np.admin_announcements
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
LIMIT 10;

# Check users without preferences
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE np.user_id IS NULL;
```

## ✅ Expected Results

After running tests, you should see:

- ✅ All tests passing (6/6)
- ✅ Database connection successful
- ✅ All users have notification preferences
- ✅ Test emails sent successfully
- ✅ Statistics showing notification usage
- ✅ No errors in output

## 🐛 Troubleshooting

### If tests fail:

1. **Check backend is running**
   ```bash
   ssh root@31.97.144.132
   pm2 list
   ```

2. **Check database connection**
   ```bash
   mysql -u root -p4Underoath7@ rooster_construction
   ```

3. **View backend logs**
   ```bash
   pm2 logs vbg-backend --lines 50
   ```

4. **Restart services if needed**
   ```bash
   pm2 restart vbg-backend
   ```

### If emails not received:

1. Check spam/junk folder
2. Verify Resend API key is set
3. Check email service logs
4. Test with different email address

## 📊 Interpreting Results

### Good Results:
```
✓ PASSED - Database Connection
✓ PASSED - User Notification Preferences
✓ PASSED - Preference Retrieval
✓ PASSED - Email Notification System
✓ PASSED - Admin Notification View
✓ PASSED - Summary Report

All tests passed! (6/6)
```

### Issues to Address:
- Users without preferences → Run option 8 in quick menu
- Email sending failures → Check Resend API configuration
- Database connection errors → Verify MySQL is running

## 📁 Files Created

1. **test-notifications.js** - Main test script
2. **deploy-test-notifications.sh** - Automated deployment script
3. **quick-test-notifications.sh** - Interactive menu script
4. **NOTIFICATION_TESTING_GUIDE.md** - Comprehensive testing guide
5. **NOTIFICATION_TEST_QUICKSTART.md** - This quick start guide

## 🔗 Useful URLs

- **Frontend**: http://31.97.144.132:3000
- **Backend API**: http://31.97.144.132:4000
- **User Notifications**: http://31.97.144.132:3000/notifications
- **Admin Notifications**: http://31.97.144.132:3000/admin/notifications

## 📞 Next Steps

After testing:

1. ✅ Review test results
2. ✅ Check admin email for test notifications
3. ✅ Verify all users have preferences set
4. ✅ Test web interface manually
5. ✅ Document any issues found
6. ✅ Create default preferences for users without them

## 💡 Tips

- Run tests during low-traffic times
- Keep admin email open to verify test emails
- Take screenshots of any errors
- Save test output for reference
- Test with both user and admin accounts

## 📝 Production Server Info

- **Server**: 31.97.144.132
- **User**: root
- **Password**: 4Underoath7@
- **App Directory**: /root/vbg-app
- **Database**: rooster_construction
- **PM2 Processes**: vbg-frontend, vbg-backend, rooster-master, rooster-backend

---

**Ready to test?** Run: `./quick-test-notifications.sh` and select option 2!
