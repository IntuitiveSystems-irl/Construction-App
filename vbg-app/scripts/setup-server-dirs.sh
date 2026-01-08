#!/bin/bash

# Create directory structure on server

SERVER_USER="u929905618"
SERVER_HOST="217.196.55.218"
SERVER_PORT="65002"

echo "Creating directory structure on server..."
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "mkdir -p ~/domains/app.veribuilds.com/vbg-app"

echo "✓ Directory created: ~/domains/app.veribuilds.com/vbg-app"
