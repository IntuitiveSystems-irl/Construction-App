#!/bin/bash

# Run notification system test on production server
SERVER="31.97.144.132"
USER="root"
PASSWORD="4Underoath7@"

echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║              Running VBG Notification System Test                            ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

expect << 'ENDEXPECT'
set timeout 120
set password "4Underoath7@"

spawn ssh root@31.97.144.132

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "root@" {
        send "cd /root/vbg-app\r"
        expect "root@"
        
        send "echo '🧪 Running comprehensive notification system test...'\r"
        expect "root@"
        send "echo ''\r"
        expect "root@"
        
        send "node test-notifications-sqlite.js\r"
        
        # Wait for test to complete
        expect {
            "All tests passed" {
                send "\r"
            }
            "Some tests failed" {
                send "\r"
            }
            timeout {
                send "\r"
            }
        }
        
        expect "root@"
        send "echo ''\r"
        expect "root@"
        send "echo '✅ Test execution completed!'\r"
        expect "root@"
        
        send "exit\r"
    }
}

expect eof
ENDEXPECT

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                         Test Complete!                                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📧 Check your email: lbbusiness2025@gmail.com"
echo ""
echo "You should receive 10 test emails (one for each notification type):"
echo "   1. Job Assignments"
echo "   2. Job Updates"
echo "   3. Safety Alerts"
echo "   4. Schedule Changes"
echo "   5. General Messages"
echo "   6. Admin Announcements"
echo "   7. Contract Notifications (NEW)"
echo "   8. Estimate Notifications (NEW)"
echo "   9. Invoice Notifications (NEW)"
echo "   10. Document Notifications (NEW)"
echo ""
echo "All emails will have the teal/cyan gradient branding! 🎨"
echo ""
