#!/bin/sh

# เริ่มการทำงานของ API Server ใน background
echo "Starting API server..."
cd /app/api
node server.js &

# เริ่มการทำงานของ Web Server (Serve static files) ใน foreground
echo "Starting Web server..."
serve -s /app/web/dist -l 3000
