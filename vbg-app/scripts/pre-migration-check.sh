#!/bin/bash

# Pre-Migration Check Script
# Verifies remote server access and gathers information before migration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REMOTE_HOST="root@31.97.144.132"

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_header() { echo -e "\n${BLUE}$1${NC}"; echo "$(printf '=%.0s' {1..60})"; }

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         PRE-MIGRATION CHECK FOR ROOSTER MASTER             ║"
echo "║                  Remote: 31.97.144.132                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check 1: SSH Connection
print_header "1. Testing SSH Connection"
if ssh -o ConnectTimeout=10 "$REMOTE_HOST" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    print_success "SSH connection to $REMOTE_HOST is working"
else
    print_error "Cannot connect to $REMOTE_HOST"
    print_info "Please check your SSH credentials and network connection"
    exit 1
fi

# Check 2: Find Database Files
print_header "2. Locating Database Files"
print_info "Searching for database files on remote server..."

DB_FILES=$(ssh "$REMOTE_HOST" "find /root /home /var/www -name '*.db' -o -name '*.sqlite' 2>/dev/null" || echo "")

if [ -z "$DB_FILES" ]; then
    print_warning "No database files found"
else
    print_success "Found database files:"
    echo "$DB_FILES" | while read -r file; do
        SIZE=$(ssh "$REMOTE_HOST" "du -h '$file' | cut -f1")
        echo "   📁 $file ($SIZE)"
    done
fi

# Check 3: Find Uploads Directory
print_header "3. Locating Uploads Directory"
print_info "Searching for uploads directory..."

UPLOAD_DIRS=$(ssh "$REMOTE_HOST" "find /root /home /var/www -name 'uploads' -type d 2>/dev/null" || echo "")

if [ -z "$UPLOAD_DIRS" ]; then
    print_warning "No uploads directory found"
else
    print_success "Found uploads directories:"
    echo "$UPLOAD_DIRS" | while read -r dir; do
        FILE_COUNT=$(ssh "$REMOTE_HOST" "find '$dir' -type f | wc -l" | tr -d ' ')
        SIZE=$(ssh "$REMOTE_HOST" "du -sh '$dir' | cut -f1")
        echo "   📁 $dir ($FILE_COUNT files, $SIZE)"
    done
fi

# Check 4: Find Node.js Projects
print_header "4. Locating Node.js Projects"
print_info "Searching for package.json files..."

PACKAGE_FILES=$(ssh "$REMOTE_HOST" "find /root /home /var/www -name 'package.json' -not -path '*/node_modules/*' 2>/dev/null | head -10" || echo "")

if [ -z "$PACKAGE_FILES" ]; then
    print_warning "No package.json files found"
else
    print_success "Found Node.js projects:"
    echo "$PACKAGE_FILES" | while read -r file; do
        DIR=$(dirname "$file")
        echo "   📦 $DIR"
    done
fi

# Check 5: Find Environment Files
print_header "5. Locating Environment Configuration"
print_info "Searching for .env files..."

ENV_FILES=$(ssh "$REMOTE_HOST" "find /root /home /var/www -name '.env' -o -name '.env.production' -o -name '.env.local' 2>/dev/null | head -10" || echo "")

if [ -z "$ENV_FILES" ]; then
    print_warning "No .env files found"
else
    print_success "Found environment files:"
    echo "$ENV_FILES"
fi

# Check 6: Check Running Processes
print_header "6. Checking Running Processes"
print_info "Looking for Node.js and PM2 processes..."

NODE_PROCESSES=$(ssh "$REMOTE_HOST" "ps aux | grep -E 'node|pm2' | grep -v grep" || echo "")

if [ -z "$NODE_PROCESSES" ]; then
    print_info "No Node.js processes currently running"
else
    print_success "Found running processes:"
    echo "$NODE_PROCESSES" | head -5
fi

# Check 7: Disk Space
print_header "7. Checking Disk Space"
DISK_INFO=$(ssh "$REMOTE_HOST" "df -h / | tail -1")
print_info "Remote server disk usage:"
echo "$DISK_INFO"

# Check 8: Check for PM2 Ecosystem
print_header "8. Checking for PM2 Configuration"
PM2_CONFIG=$(ssh "$REMOTE_HOST" "find /root /home /var/www -name 'ecosystem.config.*' 2>/dev/null" || echo "")

if [ -z "$PM2_CONFIG" ]; then
    print_info "No PM2 ecosystem config found"
else
    print_success "Found PM2 configuration:"
    echo "$PM2_CONFIG"
fi

# Check 9: Local Environment Check
print_header "9. Checking Local Environment"

if [ -f "rooster.db" ]; then
    LOCAL_SIZE=$(du -h rooster.db | cut -f1)
    print_info "Local database exists: rooster.db ($LOCAL_SIZE)"
else
    print_info "No local database found (will be created during migration)"
fi

if [ -d "uploads" ]; then
    LOCAL_UPLOADS=$(find uploads -type f | wc -l | tr -d ' ')
    LOCAL_UPLOAD_SIZE=$(du -sh uploads | cut -f1)
    print_info "Local uploads directory exists: $LOCAL_UPLOADS files ($LOCAL_UPLOAD_SIZE)"
else
    print_info "No local uploads directory (will be created during migration)"
fi

# Check 10: Required Tools
print_header "10. Checking Required Tools"

TOOLS=("node" "npm" "sqlite3" "rsync" "ssh" "scp")
ALL_TOOLS_OK=true

for tool in "${TOOLS[@]}"; do
    if command -v "$tool" &> /dev/null; then
        VERSION=$($tool --version 2>&1 | head -1 || echo "installed")
        print_success "$tool is installed"
    else
        print_warning "$tool is not installed"
        ALL_TOOLS_OK=false
    fi
done

# Summary
print_header "SUMMARY"

echo ""
if [ "$ALL_TOOLS_OK" = true ]; then
    print_success "All required tools are installed"
else
    print_warning "Some tools are missing. Install them before migration."
fi

echo ""
print_info "Next steps:"
echo "   1. Review the information above"
echo "   2. Update paths in migration scripts if needed"
echo "   3. Run: node scripts/migrate-database.js"
echo "   4. Run: ./scripts/migrate-files.sh"
echo "   5. Run: node scripts/check-missing-files.js"

echo ""
print_success "Pre-migration check completed! 🎉"
