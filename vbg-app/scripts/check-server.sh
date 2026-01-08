#!/bin/bash

# Quick Server Status Check

SERVER_USER="u929905618"
SERVER_HOST="217.196.55.218"
SERVER_PORT="65002"

echo "========================================="
echo "VBG App - Server Status Check"
echo "========================================="
echo ""

echo "Checking backend health..."
curl -s http://app.veribuild.com:4000/api/health | jq . 2>/dev/null || curl -s http://app.veribuild.com:4000/api/health

echo ""
echo ""
echo "Checking PM2 status on server..."
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "pm2 status"

echo ""
echo "Recent logs:"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "pm2 logs --lines 20 --nostream"
