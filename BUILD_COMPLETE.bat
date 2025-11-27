@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         ساخت کامل - POS Monitoring System                 ║
echo ║         این اسکریپت همه کارها را انجام می‌دهد              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════
REM Step 1: تنظیمات npm برای ایران
REM ═══════════════════════════════════════════════════════════════
echo [1/6] تنظیمات npm برای ایران...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
call npm config set fetch-timeout 600000
call npm config set fetch-retries 5
echo       ✓ OK
echo.

REM ═══════════════════════════════════════════════════════════════
REM Step 2: تنظیم mirrors برای Electron
REM ═══════════════════════════════════════════════════════════════
echo [2/6] تنظیم mirrors برای Electron...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo       ✓ OK
echo.

REM ═══════════════════════════════════════════════════════════════
REM Step 3: پاکسازی cache خراب
REM ═══════════════════════════════════════════════════════════════
echo [3/6] پاکسازی cache خراب...
if exist "%LOCALAPPDATA%\electron\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron\Cache" 2>nul
    echo       ✓ electron cache پاک شد
)
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
    echo       ✓ electron-builder cache پاک شد
)
echo       ✓ OK
echo.

REM ═══════════════════════════════════════════════════════════════
REM Step 4: بررسی و نصب Node.js
REM ═══════════════════════════════════════════════════════════════
echo [4/6] بررسی Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo       ❌ Node.js نصب نیست!
    echo.
    echo       لطفاً Node.js را از لینک زیر دانلود و نصب کنید:
    echo       https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Node.js version: %%i
echo       ✓ OK
echo.

REM ═══════════════════════════════════════════════════════════════
REM Step 5: نصب وابستگی‌ها
REM ═══════════════════════════════════════════════════════════════
echo [5/6] نصب وابستگی‌ها...
echo       (ممکن است چند دقیقه طول بکشد)
call npm install --prefer-offline 2>nul
if %errorlevel% neq 0 (
    echo       تلاش مجدد...
    call npm install
)
if not exist "node_modules" (
    echo       ❌ npm install ناموفق بود!
    pause
    exit /b 1
)

REM نصب better-sqlite3 با build
echo       نصب better-sqlite3...
call npm install better-sqlite3 --build-from-source 2>nul
echo       ✓ OK
echo.

REM ═══════════════════════════════════════════════════════════════
REM Step 6: کامپایل و ساخت
REM ═══════════════════════════════════════════════════════════════
echo [6/6] ساخت فایل نصب...
echo       کامپایل Electron...
call npx tsc -p electron/tsconfig.json
if %errorlevel% neq 0 (
    echo       ❌ کامپایل Electron ناموفق!
    pause
    exit /b 1
)
call node scripts/rename-to-cjs.cjs 2>nul

echo       ساخت فایل exe...
echo       (این مرحله 5-10 دقیقه طول می‌کشد)
echo.
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo.
    echo ════════════════════════════════════════════════════════════
    echo    ❌ خطا در ساخت فایل exe
    echo.
    echo    راه‌حل:
    echo    1. ترمینال را ببندید
    echo    2. کامپیوتر را ریستارت کنید (اختیاری)
    echo    3. این اسکریپت را دوباره اجرا کنید
    echo.
    echo    اگر اینترنت قطع و وصل شود، دوباره تلاش کنید
    echo ════════════════════════════════════════════════════════════
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ ساخت موفق!                           ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║                                                            ║
echo ║  فایل نصب در پوشه release قرار دارد                        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

if exist "release" (
    echo باز کردن پوشه release...
    explorer release
)

pause
