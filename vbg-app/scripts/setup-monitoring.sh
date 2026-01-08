#!/bin/sh

# Setup monitoring scripts on production server (Alpine Linux)
# This script should be run on the production server

echo "Setting up monitoring scripts..."

# Make scripts executable
chmod +x /root/vbg-app/scripts/security-check.js
chmod +x /root/vbg-app/scripts/services-health-check.js

# Create log directory
mkdir -p /root/vbg-app/logs/monitoring

# Setup cron jobs
# Security check runs at 8:00 AM daily
# Services health check runs at 8:30 AM daily

CRON_FILE="/tmp/vbg-monitoring-cron"

# Get existing crontab (if any)
crontab -l > "$CRON_FILE" 2>/dev/null || touch "$CRON_FILE"

# Remove any existing monitoring jobs (Alpine sed syntax)
sed -i.bak '/security-check.js/d' "$CRON_FILE"
sed -i.bak '/services-health-check.js/d' "$CRON_FILE"

# Add new monitoring jobs
echo "" >> "$CRON_FILE"
echo "# VBG Monitoring Scripts" >> "$CRON_FILE"
echo "0 8 * * * cd /root/vbg-app && /usr/local/bin/node scripts/security-check.js >> logs/monitoring/security-check.log 2>&1" >> "$CRON_FILE"
echo "30 8 * * * cd /root/vbg-app && /usr/local/bin/node scripts/services-health-check.js >> logs/monitoring/services-health-check.log 2>&1" >> "$CRON_FILE"

# Install new crontab
crontab "$CRON_FILE"

# Clean up
rm -f "$CRON_FILE" "$CRON_FILE.bak"

echo "Monitoring setup complete!"
echo ""
echo "Scheduled jobs:"
echo "  - Security Check: Daily at 8:00 AM"
echo "  - Services Health Check: Daily at 8:30 AM"
echo ""
echo "Logs will be saved to: /root/vbg-app/logs/monitoring/"
echo ""
echo "To view current crontab: crontab -l"
echo "To test scripts manually:"
echo "  cd /root/vbg-app && node scripts/security-check.js"
echo "  cd /root/vbg-app && node scripts/services-health-check.js"
