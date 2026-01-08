#!/bin/bash

# Server Setup Script
# Run this script ON THE SERVER after first deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VBG App Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js version: $(node --version)"
fi

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
echo "npm version: $(npm --version)"

# Install PM2 globally
echo ""
echo -e "${YELLOW}Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
else
    echo "PM2 already installed: $(pm2 --version)"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing project dependencies...${NC}"
npm install

# Create necessary directories
echo ""
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p uploads contracts logs

# Set permissions
chmod 755 uploads contracts logs

# Check if .env exists
echo ""
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp env.production.example .env
    echo "⚠️  IMPORTANT: Edit .env file with your actual configuration!"
    echo "   nano .env"
else
    echo ".env file already exists"
fi

# Build Next.js
echo ""
echo -e "${YELLOW}Building Next.js application...${NC}"
npm run build

# Start with PM2
echo ""
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.cjs

# Configure PM2 startup
echo ""
echo -e "${YELLOW}Configuring PM2 to start on boot...${NC}"
pm2 startup
pm2 save

# Show status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application status:"
pm2 status

echo ""
echo "View logs with: pm2 logs"
echo "Monitor with: pm2 monit"
echo ""
echo "Access your app at:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "  Backend:  http://$(hostname -I | awk '{print $1}'):4000"
