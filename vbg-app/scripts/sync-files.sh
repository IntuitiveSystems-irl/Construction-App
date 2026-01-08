#!/bin/bash

# Simple file sync script
# This will prompt for password

echo "Syncing files to server..."
echo "You will be prompted for your SSH password"
echo ""

rsync -avz --progress \
  -e "ssh -p 65002" \
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
  --include '.next/**' \
  ./ \
  u929905618@217.196.55.218:~/domains/app.veribuilds.com/vbg-app/

echo ""
echo "✓ Files synced!"
echo ""
echo "Next: SSH into server and run setup"
echo "  ssh -p 65002 u929905618@217.196.55.218"
echo "  cd ~/domains/app.veribuilds.com/vbg-app"
echo "  ./remote-deploy.sh"
