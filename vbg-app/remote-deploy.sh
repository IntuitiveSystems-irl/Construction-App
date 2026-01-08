#!/bin/bash

# Remote Deployment Script - Run this ON THE SERVER
# This script will set up and start the VBG application

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VBG App - Server Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Navigate to app directory
cd ~/domains/app.veribuilds.com/vbg-app || { echo -e "${RED}Error: ~/domains/app.veribuilds.com/vbg-app directory not found${NC}"; exit 1; }

echo -e "${YELLOW}Step 1: Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi
echo "Node.js version: $(node --version)"
echo ""

echo -e "${YELLOW}Step 2: Checking/Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi
echo ""

echo -e "${YELLOW}Step 3: Creating necessary directories...${NC}"
mkdir -p uploads contracts logs
chmod 755 uploads contracts logs
echo "✓ Directories created"
echo ""

echo -e "${YELLOW}Step 4: Installing dependencies...${NC}"
npm install
echo ""

echo -e "${YELLOW}Step 5: Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp env.production.example .env
    echo ""
    echo -e "${RED}⚠️  IMPORTANT: You need to edit the .env file!${NC}"
    echo "Please run: nano .env"
    echo "And update these values:"
    echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
    echo "  - EMAIL_USER and EMAIL_PASS"
    echo "  - Any other configuration specific to your setup"
    echo ""
    read -p "Press Enter after you've edited the .env file..."
else
    echo "✓ .env file exists"
fi
echo ""

echo -e "${YELLOW}Step 6: Skipping build (built locally)...${NC}"
echo "Build files should be synced from local machine"
echo ""

echo -e "${YELLOW}Step 7: Stopping any existing PM2 processes...${NC}"
pm2 delete all 2>/dev/null || true
echo ""

echo -e "${YELLOW}Step 8: Starting application with PM2...${NC}"
pm2 start ecosystem.config.cjs
echo ""

echo -e "${YELLOW}Step 9: Configuring PM2 to start on boot...${NC}"
pm2 startup
pm2 save
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "View logs with:"
echo "  pm2 logs"
echo "  pm2 logs rooster-backend"
echo "  pm2 logs rooster-frontend"
echo ""
echo "Access your application at:"
echo "  Frontend: http://app.veribuild.com:3000"
echo "  Backend:  http://app.veribuild.com:4000"
echo "  Health:   http://app.veribuild.com:4000/api/health"
echo ""
echo -e "${YELLOW}Note: Make sure ports 3000 and 4000 are open in your firewall${NC}"
echo ""
