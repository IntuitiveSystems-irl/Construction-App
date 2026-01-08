#!/bin/bash

# VBG App Deployment Script
# This script syncs the project to the production server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server details
SERVER_USER="u929905618"
SERVER_HOST="217.196.55.218"
SERVER_PORT="65002"
REMOTE_DIR="~/domains/app.veribuilds.com/vbg-app"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VBG App Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if rsync is installed
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}Error: rsync is not installed${NC}"
    echo "Install it with: brew install rsync"
    exit 1
fi

echo -e "${YELLOW}Step 1: Building Next.js application locally...${NC}"
npm run build

echo ""
echo -e "${YELLOW}Step 2: Syncing files to server...${NC}"
echo "Server: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PORT}"
echo "Remote directory: ${REMOTE_DIR}"
echo ""

# Rsync with progress
rsync -avz --progress \
  -e "ssh -p ${SERVER_PORT}" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude 'rooster.db' \
  --exclude 'uploads/*' \
  --exclude 'contracts/*' \
  --exclude 'logs/*' \
  ./ \
  ${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/

echo ""
echo -e "${GREEN}✓ Files synced successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps on the server:${NC}"
echo "1. SSH into server:"
echo "   ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST}"
echo ""
echo "2. Navigate to app directory:"
echo "   cd ${REMOTE_DIR}"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Configure .env file (if not already done):"
echo "   cp env.production.example .env"
echo "   nano .env  # Edit with your actual values"
echo ""
echo "5. Start/restart the application:"
echo "   pm2 restart all"
echo "   # Or if first time: pm2 start ecosystem.config.cjs"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment sync complete!${NC}"
echo -e "${GREEN}========================================${NC}"
