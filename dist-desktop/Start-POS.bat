@echo off
chcp 65001 >nul
echo ========================================
echo   سامانه مانیتورینگ POS - نسخه دسکتاپ
echo   POS Monitoring System - Desktop
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js یافت نشد!
    echo ❌ Node.js not found!
    echo.
    echo لطفاً Node.js را از nodejs.org نصب کنید
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist node_modules\better-sqlite3 (
    echo 📦 نصب وابستگی‌ها...
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ نصب با خطا مواجه شد!
        echo ❌ Installation failed!
        pause
        exit /b 1
    )
)

echo.
echo ✅ شروع سرور...
echo ✅ Starting server...
echo.
echo 📍 آدرس: http://localhost:5000
echo 📍 Address: http://localhost:5000
echo.
echo 🔐 نام کاربری / Username: admin
echo 🔐 رمز عبور / Password: admin123
echo.
echo ⚠️  برای توقف سرور Ctrl+C بزنید
echo ⚠️  Press Ctrl+C to stop the server
echo.

set NODE_ENV=production
set USE_SQLITE=true
set PORT=5000
start http://localhost:5000
node server.cjs

pause
