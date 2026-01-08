#!/bin/bash

# Revert Server to Previous State
# Server: 148.230.83.122

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SERVER_USER="root"
SERVER_HOST="148.230.83.122"
REMOTE_DIR="/var/www/vbg-app"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Server Revert Options${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "Available revert options:"
echo "1. Restore from database backup (if available)"
echo "2. Redeploy from a previous git commit"
echo "3. Show available backups on server"
echo ""

read -p "Select option (1-3): " option

case $option in
  1)
    echo -e "${YELLOW}Listing available database backups...${NC}"
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && ls -lh rooster.db.backup-* 2>/dev/null || echo 'No backups found'"
    echo ""
    read -p "Enter backup filename to restore (or 'cancel'): " backup_file
    
    if [ "$backup_file" != "cancel" ]; then
      echo -e "${YELLOW}Restoring database from ${backup_file}...${NC}"
      ssh ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && cp ${backup_file} rooster.db && pm2 restart rooster-backend"
      echo -e "${GREEN}✓ Database restored and backend restarted${NC}"
    fi
    ;;
    
  2)
    echo -e "${YELLOW}Recent commits:${NC}"
    git log --oneline -10
    echo ""
    read -p "Enter commit hash to revert to: " commit_hash
    
    if [ ! -z "$commit_hash" ]; then
      echo -e "${YELLOW}Checking out commit ${commit_hash}...${NC}"
      git checkout $commit_hash
      
      echo -e "${YELLOW}Building and deploying...${NC}"
      bash deploy-root-server.sh
      
      echo -e "${GREEN}✓ Reverted to commit ${commit_hash}${NC}"
      echo ""
      echo -e "${YELLOW}Note: You're now in detached HEAD state.${NC}"
      echo "To return to main branch: git checkout main"
    fi
    ;;
    
  3)
    echo -e "${YELLOW}Checking server for backups...${NC}"
    echo ""
    echo "Database backups:"
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && ls -lh rooster.db.backup-* 2>/dev/null || echo 'No database backups found'"
    echo ""
    echo "PM2 process status:"
    ssh ${SERVER_USER}@${SERVER_HOST} "pm2 status"
    ;;
    
  *)
    echo -e "${RED}Invalid option${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Revert operation complete${NC}"
echo -e "${GREEN}========================================${NC}"
