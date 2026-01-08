#!/bin/bash

# Deployment to Root Server
# Server: 148.230.83.122

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_USER="root"
SERVER_HOST="148.230.83.122"
SERVER_PORT="22"
REMOTE_DIR="/var/www/vbg-app"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VBG App - Root Server Deployment${NC}"
echo -e "${GREEN}Server: ${SERVER_HOST}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Step 1: Build locally
echo -e "${YELLOW}Step 1: Building Next.js application locally...${NC}"
npm run build
echo ""

# Step 2: Create directory on server
echo -e "${YELLOW}Step 2: Creating directory on server...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${REMOTE_DIR}"
echo ""

# Step 3: Sync files
echo -e "${YELLOW}Step 3: Syncing files to server...${NC}"
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

# Step 4: Run remote setup
echo -e "${YELLOW}Step 4: Running setup on server...${NC}"
ssh -p ${SERVER_PORT} -t ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && bash remote-deploy-root.sh"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your application at:"
echo "  Frontend: http://148.230.83.122:3000"
echo "  Backend:  http://148.230.83.122:4000/api/health"
