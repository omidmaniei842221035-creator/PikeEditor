@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         POS Monitoring System - Build v1.0.5               ║
echo ║         Frontend is PRE-BUILT (faster build)               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM تنظیم mirrors برای ایران (در همین session)
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

REM Step 1: Check Node.js
echo [1/4] بررسی Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo       ❌ Node.js نصب نیست!
    echo       لطفاً از https://nodejs.org نصب کنید
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Node.js version: %%i
echo       ✓ OK
echo.

REM Step 2: Install dependencies
echo [2/4] نصب وابستگی‌ها...
call npm install --prefer-offline 2>nul
if %errorlevel% neq 0 (
    echo       نصب آنلاین...
    call npm install 2>nul
)
call npm install better-sqlite3 --build-from-source 2>nul
if not exist "node_modules" (
    echo       ❌ npm install ناموفق بود!
    echo       اول FIX_NPM.bat را اجرا کنید
    pause
    exit /b 1
)
echo       ✓ OK
echo.

REM Step 3: Compile Electron
echo [3/4] کامپایل Electron...
call npx tsc -p electron/tsconfig.json
if %errorlevel% neq 0 (
    echo       ❌ کامپایل Electron ناموفق!
    pause
    exit /b 1
)
call node scripts/rename-to-cjs.cjs 2>nul
echo       ✓ OK
echo.

REM Step 4: Build Windows installer
echo [4/4] ساخت فایل نصب ویندوز...
echo       (این مرحله ممکن است چند دقیقه طول بکشد)
echo.
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                    ❌ خطا در ساخت                          ║
    echo ╠════════════════════════════════════════════════════════════╣
    echo ║  اگر خطای "zip: not a valid zip file" می‌بینید:           ║
    echo ║                                                            ║
    echo ║  1. ترمینال را ببندید                                     ║
    echo ║  2. FIX_NPM.bat را اجرا کنید                               ║
    echo ║  3. ترمینال را ببندید و دوباره باز کنید                   ║
    echo ║  4. BUILD.bat را دوباره اجرا کنید                         ║
    echo ╚════════════════════════════════════════════════════════════╝
    pause
    exit /b 1
)
echo       ✓ OK
echo.

echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ ساخت موفق!                           ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  فایل نصب در پوشه release قرار دارد                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

if exist "release" (
    echo باز کردن پوشه release...
    explorer release
)

pause
