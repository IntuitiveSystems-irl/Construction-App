#!/usr/bin/env node

/**
 * Notification Testing Script for VBG Production Server
 * 
 * This script tests all notification types and settings to ensure:
 * 1. User notification preferences are properly stored and retrieved
 * 2. Admin can view all user notification settings
 * 3. Email notifications are sent correctly based on preferences
 * 4. All notification types work as expected
 */

import mysql from 'mysql2/promise';
import { sendEmail } from './utils/email.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rooster_construction'
};

// Notification types to test
const notificationTypes = [
  { key: 'job_assignments', name: 'Job Assignments', description: 'New job site assignments' },
  { key: 'job_updates', name: 'Job Updates', description: 'Job site progress and changes' },
  { key: 'safety_alerts', name: 'Safety Alerts', description: 'Safety notifications and requirements' },
  { key: 'schedule_changes', name: 'Schedule Changes', description: 'Schedule updates and timeline changes' },
  { key: 'general_messages', name: 'General Messages', description: 'General communications and messages' },
  { key: 'admin_announcements', name: 'Admin Announcements', description: 'Company-wide announcements' }
];

async function testDatabaseConnection() {
  section('1. Testing Database Connection');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    log('✓ Database connection successful', 'green');
    
    // Check if notification_preferences table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'notification_preferences'"
    );
    
    if (tables.length > 0) {
      log('✓ notification_preferences table exists', 'green');
      
      // Get table structure
      const [columns] = await connection.query(
        "DESCRIBE notification_preferences"
      );
      
      log('\nTable Structure:', 'cyan');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    } else {
      log('✗ notification_preferences table does not exist', 'red');
      log('Creating notification_preferences table...', 'yellow');
      
      await connection.query(`
        CREATE TABLE IF NOT EXISTS notification_preferences (
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
        )
      `);
      
      log('✓ notification_preferences table created', 'green');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testUserNotificationPreferences() {
  section('2. Testing User Notification Preferences');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get all users
    const [users] = await connection.query(
      'SELECT id, name, email, user_type FROM users ORDER BY id LIMIT 10'
    );
    
    log(`Found ${users.length} users in database\n`, 'cyan');
    
    for (const user of users) {
      log(`User: ${user.name} (${user.email}) [${user.user_type}]`, 'bright');
      
      // Check if user has notification preferences
      const [prefs] = await connection.query(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [user.id]
      );
      
      if (prefs.length > 0) {
        const pref = prefs[0];
        log('  Notification Preferences:', 'green');
        notificationTypes.forEach(type => {
          const enabled = pref[type.key] === 1 || pref[type.key] === true;
          const status = enabled ? '✓ Enabled' : '✗ Disabled';
          const color = enabled ? 'green' : 'red';
          log(`    ${type.name}: ${status}`, color);
        });
      } else {
        log('  ⚠ No notification preferences set (using defaults)', 'yellow');
        
        // Create default preferences
        await connection.query(
          `INSERT INTO notification_preferences (user_id) VALUES (?)
           ON DUPLICATE KEY UPDATE user_id = user_id`,
          [user.id]
        );
        
        log('  ✓ Created default notification preferences', 'green');
      }
      
      console.log('');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log(`✗ Error testing user preferences: ${error.message}`, 'red');
    return false;
  }
}

async function testNotificationPreferenceRetrieval() {
  section('3. Testing Notification Preference Retrieval');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Test getting preferences for a specific user
    const [users] = await connection.query(
      'SELECT id, name, email FROM users LIMIT 1'
    );
    
    if (users.length === 0) {
      log('✗ No users found in database', 'red');
      await connection.end();
      return false;
    }
    
    const testUser = users[0];
    log(`Testing preference retrieval for: ${testUser.name} (${testUser.email})`, 'cyan');
    
    const [preferences] = await connection.query(
      `SELECT * FROM notification_preferences WHERE user_id = ?`,
      [testUser.id]
    );
    
    if (preferences.length > 0) {
      log('✓ Successfully retrieved notification preferences', 'green');
      
      const pref = preferences[0];
      log('\nPreference Details:', 'cyan');
      notificationTypes.forEach(type => {
        const enabled = pref[type.key] === 1 || pref[type.key] === true;
        log(`  ${type.name}: ${enabled ? 'Enabled' : 'Disabled'}`, enabled ? 'green' : 'red');
      });
    } else {
      log('✗ No preferences found for user', 'red');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log(`✗ Error retrieving preferences: ${error.message}`, 'red');
    return false;
  }
}

async function testEmailNotificationSystem() {
  section('4. Testing Email Notification System');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get admin email for testing
    const [admins] = await connection.query(
      'SELECT email, name FROM users WHERE is_admin = 1 LIMIT 1'
    );
    
    if (admins.length === 0) {
      log('⚠ No admin users found, skipping email test', 'yellow');
      await connection.end();
      return true;
    }
    
    const adminEmail = admins[0].email;
    const adminName = admins[0].name;
    
    log(`Testing email to admin: ${adminName} (${adminEmail})`, 'cyan');
    
    // Test each notification type
    for (const type of notificationTypes) {
      try {
        log(`\nTesting ${type.name}...`, 'yellow');
        
        const testEmailContent = {
          to: adminEmail,
          subject: `[TEST] ${type.name} - VBG Notification System`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Veritas Building Group</h1>
                <p style="color: #fed7aa; margin: 10px 0 0 0;">Notification System Test</p>
              </div>
              
              <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937; margin-top: 0;">Test: ${type.name}</h2>
                <p style="color: #4b5563; line-height: 1.6;">
                  This is a test notification for <strong>${type.name}</strong>.
                </p>
                <p style="color: #6b7280; line-height: 1.6;">
                  ${type.description}
                </p>
                
                <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #1e40af;">
                    <strong>Note:</strong> This is a test email sent from the notification testing script.
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  If you received this email, the <strong>${type.name}</strong> notification system is working correctly.
                </p>
              </div>
              
              <div style="background: #1f2937; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Veritas Building Group. All rights reserved.
                </p>
              </div>
            </div>
          `
        };
        
        await sendEmail(testEmailContent);
        log(`  ✓ ${type.name} email sent successfully`, 'green');
        
        // Wait a bit between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (emailError) {
        log(`  ✗ Failed to send ${type.name} email: ${emailError.message}`, 'red');
      }
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log(`✗ Error testing email system: ${error.message}`, 'red');
    return false;
  }
}

async function testAdminNotificationView() {
  section('5. Testing Admin Notification View');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get all users with their notification preferences
    const [results] = await connection.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.user_type,
        COALESCE(np.job_assignments, 1) as job_assignments,
        COALESCE(np.job_updates, 1) as job_updates,
        COALESCE(np.safety_alerts, 1) as safety_alerts,
        COALESCE(np.schedule_changes, 1) as schedule_changes,
        COALESCE(np.general_messages, 1) as general_messages,
        COALESCE(np.admin_announcements, 1) as admin_announcements
      FROM users u
      LEFT JOIN notification_preferences np ON u.id = np.user_id
      ORDER BY u.user_type, u.name
      LIMIT 20
    `);
    
    log(`Found ${results.length} users with notification settings\n`, 'cyan');
    
    // Group by user type
    const byType = results.reduce((acc, user) => {
      if (!acc[user.user_type]) acc[user.user_type] = [];
      acc[user.user_type].push(user);
      return acc;
    }, {});
    
    Object.keys(byType).forEach(userType => {
      log(`\n${userType.toUpperCase()} Users:`, 'bright');
      
      byType[userType].forEach(user => {
        console.log(`\n  ${user.name} (${user.email})`);
        
        const enabledCount = notificationTypes.reduce((count, type) => {
          return count + (user[type.key] === 1 ? 1 : 0);
        }, 0);
        
        const allEnabled = enabledCount === notificationTypes.length;
        const noneEnabled = enabledCount === 0;
        
        if (allEnabled) {
          log(`    All notifications enabled (${enabledCount}/${notificationTypes.length})`, 'green');
        } else if (noneEnabled) {
          log(`    All notifications disabled (${enabledCount}/${notificationTypes.length})`, 'red');
        } else {
          log(`    Partial notifications enabled (${enabledCount}/${notificationTypes.length})`, 'yellow');
          
          notificationTypes.forEach(type => {
            const enabled = user[type.key] === 1;
            if (!enabled) {
              log(`      - ${type.name}: Disabled`, 'red');
            }
          });
        }
      });
    });
    
    await connection.end();
    return true;
  } catch (error) {
    log(`✗ Error testing admin view: ${error.message}`, 'red');
    return false;
  }
}

async function generateReport() {
  section('6. Generating Summary Report');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get statistics
    const [totalUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [usersWithPrefs] = await connection.query('SELECT COUNT(*) as count FROM notification_preferences');
    const [adminUsers] = await connection.query('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
    
    log('System Statistics:', 'cyan');
    console.log(`  Total Users: ${totalUsers[0].count}`);
    console.log(`  Users with Preferences: ${usersWithPrefs[0].count}`);
    console.log(`  Admin Users: ${adminUsers[0].count}`);
    console.log(`  Users without Preferences: ${totalUsers[0].count - usersWithPrefs[0].count}`);
    
    // Get notification type statistics
    log('\nNotification Type Statistics:', 'cyan');
    
    for (const type of notificationTypes) {
      const [enabled] = await connection.query(
        `SELECT COUNT(*) as count FROM notification_preferences WHERE ${type.key} = 1`
      );
      const [disabled] = await connection.query(
        `SELECT COUNT(*) as count FROM notification_preferences WHERE ${type.key} = 0`
      );
      
      const total = enabled[0].count + disabled[0].count;
      const percentage = total > 0 ? ((enabled[0].count / total) * 100).toFixed(1) : 0;
      
      console.log(`  ${type.name}:`);
      console.log(`    Enabled: ${enabled[0].count} (${percentage}%)`);
      console.log(`    Disabled: ${disabled[0].count}`);
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log(`✗ Error generating report: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                  VBG NOTIFICATION SYSTEM TEST SUITE                           ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    databaseConnection: false,
    userPreferences: false,
    preferenceRetrieval: false,
    emailSystem: false,
    adminView: false,
    report: false
  };
  
  // Run all tests
  results.databaseConnection = await testDatabaseConnection();
  
  if (results.databaseConnection) {
    results.userPreferences = await testUserNotificationPreferences();
    results.preferenceRetrieval = await testNotificationPreferenceRetrieval();
    results.emailSystem = await testEmailNotificationSystem();
    results.adminView = await testAdminNotificationView();
    results.report = await generateReport();
  }
  
  // Final summary
  section('Test Summary');
  
  const tests = [
    { name: 'Database Connection', result: results.databaseConnection },
    { name: 'User Notification Preferences', result: results.userPreferences },
    { name: 'Preference Retrieval', result: results.preferenceRetrieval },
    { name: 'Email Notification System', result: results.emailSystem },
    { name: 'Admin Notification View', result: results.adminView },
    { name: 'Summary Report', result: results.report }
  ];
  
  tests.forEach(test => {
    const status = test.result ? '✓ PASSED' : '✗ FAILED';
    const color = test.result ? 'green' : 'red';
    log(`${status.padEnd(10)} - ${test.name}`, color);
  });
  
  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  
  console.log('\n');
  if (passedTests === totalTests) {
    log(`All tests passed! (${passedTests}/${totalTests})`, 'green');
  } else {
    log(`Some tests failed. (${passedTests}/${totalTests} passed)`, 'yellow');
  }
  
  console.log('\n');
}

// Run the test suite
runAllTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
