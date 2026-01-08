#!/bin/bash

# File Migration Script
# Migrates uploaded files from remote server to local project

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="root@31.97.144.132"
REMOTE_UPLOADS_PATH="/root/rooster-master/uploads"  # Update this path
LOCAL_UPLOADS_PATH="./uploads"

echo -e "${BLUE}🚀 Starting file migration...${NC}\n"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if remote host is reachable
print_info "Testing connection to remote server..."
if ! ssh -o ConnectTimeout=10 "$REMOTE_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to remote server: $REMOTE_HOST"
    print_info "Please check your SSH connection and try again."
    exit 1
fi
print_success "Remote server is reachable"

# Check if remote uploads directory exists
print_info "Checking remote uploads directory..."
if ! ssh "$REMOTE_HOST" "test -d $REMOTE_UPLOADS_PATH" 2>/dev/null; then
    print_error "Remote uploads directory not found: $REMOTE_UPLOADS_PATH"
    print_info "Searching for uploads directory on remote server..."
    
    # Try to find uploads directory
    FOUND_PATHS=$(ssh "$REMOTE_HOST" "find /root /home /var/www -name 'uploads' -type d 2>/dev/null" || echo "")
    
    if [ -z "$FOUND_PATHS" ]; then
        print_error "Could not find uploads directory on remote server"
        exit 1
    else
        print_info "Found possible uploads directories:"
        echo "$FOUND_PATHS"
        print_warning "Please update REMOTE_UPLOADS_PATH in this script and try again"
        exit 1
    fi
fi
print_success "Remote uploads directory found"

# Create local uploads directory if it doesn't exist
mkdir -p "$LOCAL_UPLOADS_PATH"
print_success "Local uploads directory ready: $LOCAL_UPLOADS_PATH"

# Create backup of existing uploads if directory is not empty
if [ "$(ls -A $LOCAL_UPLOADS_PATH 2>/dev/null)" ]; then
    BACKUP_DIR="${LOCAL_UPLOADS_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    print_warning "Local uploads directory is not empty"
    print_info "Creating backup: $BACKUP_DIR"
    cp -r "$LOCAL_UPLOADS_PATH" "$BACKUP_DIR"
    print_success "Backup created"
fi

# Get remote file count and size
print_info "Analyzing remote files..."
REMOTE_STATS=$(ssh "$REMOTE_HOST" "find $REMOTE_UPLOADS_PATH -type f | wc -l && du -sh $REMOTE_UPLOADS_PATH | cut -f1")
REMOTE_COUNT=$(echo "$REMOTE_STATS" | head -n 1 | tr -d ' ')
REMOTE_SIZE=$(echo "$REMOTE_STATS" | tail -n 1 | tr -d ' ')

print_info "Remote files: $REMOTE_COUNT files ($REMOTE_SIZE)"

# Check if rsync is available
if command -v rsync &> /dev/null; then
    print_info "Using rsync for efficient transfer..."
    
    # Use rsync for efficient transfer with progress
    rsync -avz --progress \
        --exclude='*.tmp' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        --exclude='.git' \
        "$REMOTE_HOST:$REMOTE_UPLOADS_PATH/" \
        "$LOCAL_UPLOADS_PATH/"
    
    RSYNC_EXIT=$?
    
    if [ $RSYNC_EXIT -eq 0 ]; then
        print_success "File transfer completed successfully!"
    else
        print_error "File transfer failed with exit code: $RSYNC_EXIT"
        exit 1
    fi
else
    print_warning "rsync not found, falling back to scp..."
    print_info "This may be slower for large directories"
    
    # Use scp as fallback
    scp -r "$REMOTE_HOST:$REMOTE_UPLOADS_PATH/*" "$LOCAL_UPLOADS_PATH/" 2>/dev/null || {
        print_error "File transfer failed"
        exit 1
    }
    
    print_success "File transfer completed successfully!"
fi

# Verify migration
print_info "Verifying migration..."

LOCAL_COUNT=$(find "$LOCAL_UPLOADS_PATH" -type f | wc -l | tr -d ' ')
LOCAL_SIZE=$(du -sh "$LOCAL_UPLOADS_PATH" | cut -f1 | tr -d ' ')

echo ""
echo "=========================================="
echo "📊 MIGRATION SUMMARY"
echo "=========================================="
echo "Remote files:  $REMOTE_COUNT files ($REMOTE_SIZE)"
echo "Local files:   $LOCAL_COUNT files ($LOCAL_SIZE)"
echo "=========================================="

if [ "$LOCAL_COUNT" -eq "$REMOTE_COUNT" ]; then
    print_success "File count matches! Migration successful."
elif [ "$LOCAL_COUNT" -gt "$REMOTE_COUNT" ]; then
    print_warning "Local has more files than remote (possibly from previous uploads)"
else
    print_warning "Local has fewer files than remote. Some files may not have transferred."
    print_info "You may want to run this script again or investigate manually."
fi

# Set proper permissions
print_info "Setting file permissions..."
chmod -R 755 "$LOCAL_UPLOADS_PATH"
print_success "Permissions set"

echo ""
print_success "File migration completed!"
print_info "Files are now available in: $LOCAL_UPLOADS_PATH"

# Offer to verify file integrity
echo ""
read -p "Would you like to verify file integrity with checksums? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Generating checksums (this may take a while)..."
    
    # Generate checksums for remote files
    ssh "$REMOTE_HOST" "cd $REMOTE_UPLOADS_PATH && find . -type f -exec md5sum {} \; | sort" > remote_checksums.txt
    
    # Generate checksums for local files
    cd "$LOCAL_UPLOADS_PATH" && find . -type f -exec md5sum {} \; | sort > ../local_checksums.txt
    cd ..
    
    # Compare checksums
    if diff remote_checksums.txt local_checksums.txt > /dev/null; then
        print_success "All file checksums match! Files are identical."
        rm remote_checksums.txt local_checksums.txt
    else
        print_warning "Some files have different checksums"
        print_info "Differences saved to checksum_diff.txt"
        diff remote_checksums.txt local_checksums.txt > checksum_diff.txt || true
    fi
fi

echo ""
print_success "All done! 🎉"
