#!/bin/bash

# Full Deployment Script
# This script syncs files to server and runs the remote deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Server details
SERVER_USER="u929905618"
SERVER_HOST="217.196.55.218"
SERVER_PORT="65002"
REMOTE_DIR="~/domains/app.veribuilds.com/vbg-app"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VBG App - Full Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Build locally
echo -e "${YELLOW}Step 1: Building Next.js application locally...${NC}"
npm run build
echo ""

# Step 2: Sync files
echo -e "${YELLOW}Step 2: Syncing files to server...${NC}"
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

# Step 3: Make remote script executable
echo -e "${YELLOW}Step 3: Making remote deployment script executable...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "chmod +x ${REMOTE_DIR}/remote-deploy.sh"
echo ""

# Step 4: Run remote deployment
echo -e "${YELLOW}Step 4: Running deployment on server...${NC}"
echo -e "${YELLOW}You will be connected to the server to complete the setup.${NC}"
echo ""
ssh -p ${SERVER_PORT} -t ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && ./remote-deploy.sh"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Full Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
