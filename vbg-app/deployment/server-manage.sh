#!/bin/bash

# Server Management Script
# Quick commands for managing the VBG app on the server

SERVER_USER="u929905618"
SERVER_HOST="217.196.55.218"
SERVER_PORT="65002"
REMOTE_DIR="~/domains/app.veribuilds.com/vbg-app"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

show_menu() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}VBG App - Server Management${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "1. Check server status"
    echo "2. View logs (live)"
    echo "3. Restart application"
    echo "4. Stop application"
    echo "5. Start application"
    echo "6. SSH into server"
    echo "7. Update and redeploy"
    echo "8. Check backend health"
    echo "9. Exit"
    echo ""
    read -p "Select an option (1-9): " choice
    echo ""
}

check_status() {
    echo -e "${YELLOW}Checking server status...${NC}"
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && pm2 status"
}

view_logs() {
    echo -e "${YELLOW}Viewing live logs (Ctrl+C to exit)...${NC}"
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && pm2 logs"
}

restart_app() {
    echo -e "${YELLOW}Restarting application...${NC}"
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && pm2 restart all"
    echo -e "${GREEN}✓ Application restarted${NC}"
}

stop_app() {
    echo -e "${YELLOW}Stopping application...${NC}"
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && pm2 stop all"
    echo -e "${GREEN}✓ Application stopped${NC}"
}

start_app() {
    echo -e "${YELLOW}Starting application...${NC}"
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "cd ${REMOTE_DIR} && pm2 start ecosystem.config.cjs"
    echo -e "${GREEN}✓ Application started${NC}"
}

ssh_connect() {
    echo -e "${YELLOW}Connecting to server...${NC}"
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST}
}

update_deploy() {
    echo -e "${YELLOW}Running full deployment...${NC}"
    ./full-deploy.sh
}

check_health() {
    echo -e "${YELLOW}Checking backend health...${NC}"
    curl -s http://app.veribuild.com:4000/api/health | jq . 2>/dev/null || curl -s http://app.veribuild.com:4000/api/health
    echo ""
}

# Main loop
while true; do
    show_menu
    case $choice in
        1)
            check_status
            ;;
        2)
            view_logs
            ;;
        3)
            restart_app
            ;;
        4)
            stop_app
            ;;
        5)
            start_app
            ;;
        6)
            ssh_connect
            ;;
        7)
            update_deploy
            ;;
        8)
            check_health
            ;;
        9)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    echo ""
    read -p "Press Enter to continue..."
    clear
done
