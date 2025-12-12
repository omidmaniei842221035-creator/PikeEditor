#!/bin/bash
echo "========================================"
echo "  سامانه مانیتورینگ POS - نسخه دسکتاپ"
echo "  POS Monitoring System - Desktop"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js from nodejs.org"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules/better-sqlite3" ]; then
    echo "📦 Installing dependencies..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Installation failed!"
        exit 1
    fi
    echo ""
    echo "✅ Dependencies installed"
    echo ""
fi

# Check for first run - remove old db if .fresh_install marker exists
if [ -f ".fresh_install" ]; then
    if [ -f "pos-system.db" ]; then
        echo "🔄 Resetting old database..."
        rm -f pos-system.db
    fi
    rm -f .fresh_install
fi

echo ""
echo "✅ Starting server..."
echo ""
echo "📍 Address: http://localhost:5000"
echo ""
echo "🔐 Username: admin"
echo "🔐 Password: admin123"
echo ""
echo "⚠️  Press Ctrl+C to stop the server"
echo ""

export NODE_ENV=production
export USE_SQLITE=true
export PORT=5000

# Open browser (works on most Linux/Mac)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5000 &
elif command -v open &> /dev/null; then
    open http://localhost:5000 &
fi

node server.cjs
