#!/bin/bash
# Setup SSL reverse proxy for api.veribuilds.com on production server
# Run this script on the production server (31.97.144.132)

set -e

echo "=== Setting up HTTPS reverse proxy for api.veribuilds.com ==="

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Installing nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Copy nginx config
echo "Copying nginx configuration..."
cat > /etc/nginx/sites-available/api.veribuilds.com << 'EOF'
server {
    listen 80;
    server_name api.veribuilds.com;
    
    location / {
        proxy_pass http://127.0.0.1:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # CORS
        add_header Access-Control-Allow-Origin "https://app.veribuilds.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://app.veribuilds.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-Requested-With" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/api.veribuilds.com /etc/nginx/sites-enabled/

# Test nginx config
echo "Testing nginx configuration..."
nginx -t

# Reload nginx
echo "Reloading nginx..."
systemctl reload nginx

# Get SSL certificate
echo ""
echo "=== IMPORTANT: DNS Setup Required ==="
echo "Before running certbot, ensure api.veribuilds.com points to 31.97.144.132"
echo ""
read -p "Is DNS configured? (y/n): " dns_ready

if [ "$dns_ready" = "y" ]; then
    echo "Getting SSL certificate..."
    certbot --nginx -d api.veribuilds.com --non-interactive --agree-tos --email info@veribuilds.com
    
    echo ""
    echo "=== SSL Setup Complete ==="
    echo "API is now available at: https://api.veribuilds.com"
else
    echo ""
    echo "=== Manual Steps Required ==="
    echo "1. Add DNS A record: api.veribuilds.com -> 31.97.144.132"
    echo "2. Run: certbot --nginx -d api.veribuilds.com"
    echo "3. Rebuild and restart the frontend with new API URL"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Rebuild the Next.js frontend: npm run build"
echo "2. Restart PM2: pm2 restart vbg-frontend"
