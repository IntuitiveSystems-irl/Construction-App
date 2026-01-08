#!/bin/bash

# Domain Setup Script for VBG App
# This script helps configure veribuilds.com to point to your app

echo "========================================="
echo "VBG App - Domain Configuration"
echo "========================================="
echo ""

# Check if we have Apache
if command -v httpd &> /dev/null || command -v apache2 &> /dev/null; then
    echo "✓ Apache detected"
    WEBSERVER="apache"
elif command -v nginx &> /dev/null; then
    echo "✓ Nginx detected"
    WEBSERVER="nginx"
else
    echo "⚠ No web server detected"
    WEBSERVER="none"
fi

echo ""
echo "Current setup:"
echo "- Frontend: http://localhost:3000"
echo "- Backend:  http://localhost:4000"
echo "- Domain:   veribuilds.com"
echo ""

# Find web root
echo "Looking for web root directory..."
if [ -d ~/public_html ]; then
    WEBROOT=~/public_html
    echo "✓ Found: $WEBROOT"
elif [ -d ~/htdocs ]; then
    WEBROOT=~/htdocs
    echo "✓ Found: $WEBROOT"
elif [ -d ~/www ]; then
    WEBROOT=~/www
    echo "✓ Found: $WEBROOT"
else
    echo "⚠ Web root not found"
    WEBROOT=""
fi

echo ""
echo "========================================="
echo "Configuration Options:"
echo "========================================="
echo ""
echo "1. Apache .htaccess (Recommended for shared hosting)"
echo "2. Manual nginx configuration"
echo "3. Show instructions for cPanel"
echo ""

if [ "$WEBSERVER" = "apache" ] && [ -n "$WEBROOT" ]; then
    echo "Creating .htaccess file..."
    cat > "$WEBROOT/.htaccess" << 'EOF'
# VBG App Reverse Proxy Configuration
RewriteEngine On

# Proxy API requests to backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]

# Proxy all other requests to frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Enable proxy
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyRequests Off
</IfModule>
EOF
    echo "✓ .htaccess created at $WEBROOT/.htaccess"
    echo ""
    echo "Note: Make sure mod_proxy and mod_rewrite are enabled"
    echo "Contact your hosting provider if this doesn't work"
else
    echo "========================================="
    echo "Manual Setup Instructions"
    echo "========================================="
    echo ""
    echo "For Apache (.htaccess):"
    echo "Create a file at ~/public_html/.htaccess with:"
    echo ""
    cat << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
EOF
    echo ""
    echo "========================================="
    echo ""
    echo "For cPanel:"
    echo "1. Log into cPanel"
    echo "2. Go to 'Setup Node.js App'"
    echo "3. Set Application URL: veribuilds.com"
    echo "4. Set Application Root: ~/vbg-app"
    echo "5. Set Application Startup File: .next/standalone/server.js"
    echo "6. Set Port: 3000"
    echo ""
fi

echo "========================================="
echo "After configuration, your app will be at:"
echo "  http://veribuilds.com"
echo "  https://veribuilds.com (if SSL is configured)"
echo "========================================="
