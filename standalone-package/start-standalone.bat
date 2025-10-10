@echo off
chcp 65001 >nul
echo ================================================
echo    سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی
echo ================================================
echo.
echo در حال راه‌اندازی سرور...
echo.

REM Set database path in user's AppData
set DATABASE_PATH=%APPDATA%\POS-System\pos-system.db
echo 📁 Database: %DATABASE_PATH%
echo.

REM Create directory if it doesn't exist
if not exist "%APPDATA%\POS-System" mkdir "%APPDATA%\POS-System"

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js یافت نشد!
    echo.
    echo لطفاً Node.js را از آدرس زیر دانلود و نصب کنید:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Start the server
echo ✅ در حال راه‌اندازی...
echo.
node dist\index.js

pause
