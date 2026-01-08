#!/bin/bash
# Setup daily security monitoring cron job
# Run this script on the server: bash scripts/setup-security-cron.sh

echo "🔧 Setting up daily security monitoring..."

# Check if RESEND_API_KEY is set
if [ -z "$RESEND_API_KEY" ]; then
    # Try to get it from .env
    if [ -f /root/vbg-app/.env ]; then
        export $(grep RESEND_API_KEY /root/vbg-app/.env | xargs)
    fi
fi

if [ -z "$RESEND_API_KEY" ]; then
    echo "⚠️  Warning: RESEND_API_KEY not found. Make sure it's in /root/vbg-app/.env"
fi

# Create cron job to run daily at 9 AM
CRON_CMD="0 9 * * * cd /root/vbg-app && export \$(grep -v '^#' .env | xargs) && /usr/local/bin/node scripts/security-monitor.js >> /var/log/security-monitor.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "security-monitor.js"; then
    echo "ℹ️  Cron job already exists. Updating..."
    crontab -l | grep -v "security-monitor.js" | crontab -
fi

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "✅ Cron job installed. Security report will be sent daily at 9 AM."
echo ""
echo "📋 Current cron jobs:"
crontab -l

echo ""
echo "🧪 To test the script now, run:"
echo "   cd /root/vbg-app && node scripts/security-monitor.js"
