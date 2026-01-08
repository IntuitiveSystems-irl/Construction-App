#!/bin/bash

# Remote Deployment Script for Root Server
# Run this ON THE SERVER (148.230.83.122)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VBG App - Root Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Navigate to app directory
cd /var/www/vbg-app || { echo -e "${RED}Error: /var/www/vbg-app directory not found${NC}"; exit 1; }

echo -e "${YELLOW}Step 1: Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

echo -e "${YELLOW}Step 2: Installing PM2 globally...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi
echo ""

echo -e "${YELLOW}Step 3: Creating directories...${NC}"
mkdir -p uploads contracts logs
chmod 755 uploads contracts logs
echo ""

echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
npm install
echo ""

echo -e "${YELLOW}Step 5: Configuring environment...${NC}"
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp env.production.example .env
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_KEY|${JWT_SECRET}|g" .env
    
    # Update URLs for this server
    sed -i "s|app.veribuild.com|148.230.83.122|g" .env
    
    echo "✓ .env created with generated JWT_SECRET"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Edit .env to add email credentials:${NC}"
    echo "  nano .env"
    echo "  Update: EMAIL_USER and EMAIL_PASS"
else
    echo "✓ .env file exists"
fi
echo ""

echo -e "${YELLOW}Step 6: Build already completed locally${NC}"
echo ""

echo -e "${YELLOW}Step 7: Stopping existing PM2 processes...${NC}"
pm2 delete all 2>/dev/null || true
echo ""

echo -e "${YELLOW}Step 8: Starting application with PM2...${NC}"
pm2 start ecosystem.config.cjs
echo ""

echo -e "${YELLOW}Step 9: Configuring PM2 startup...${NC}"
pm2 startup
pm2 save
echo ""

echo -e "${YELLOW}Step 10: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 3000/tcp
    ufw allow 4000/tcp
    echo "✓ Firewall rules added"
else
    echo "UFW not available, skipping firewall configuration"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "View logs: pm2 logs"
echo ""
echo "Access your application at:"
echo "  Frontend: http://148.230.83.122:3000"
echo "  Backend:  http://148.230.83.122:4000/api/health"
echo ""
