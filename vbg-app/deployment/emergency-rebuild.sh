#!/bin/bash
cd /root/vbg-app
rm -rf .next
export NODE_ENV=production
npm run build
pm2 restart vbg-frontend
pm2 status
