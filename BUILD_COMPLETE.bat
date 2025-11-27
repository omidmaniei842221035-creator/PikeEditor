@echo off

echo.
echo ========================================
echo    POS Monitoring - Complete Build
echo    This script does everything
echo ========================================
echo.

REM Step 1: NPM config for Iran
echo [1/6] Setting npm config for Iran...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
call npm config set fetch-timeout 600000
call npm config set fetch-retries 5
echo       OK
echo.

REM Step 2: Electron mirrors
echo [2/6] Setting Electron mirrors...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo       OK
echo.

REM Step 3: Clear corrupted cache
echo [3/6] Clearing corrupted cache...
if exist "%LOCALAPPDATA%\electron\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron\Cache" 2>nul
    echo       electron cache cleared
)
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
    echo       electron-builder cache cleared
)
echo       OK
echo.

REM Step 4: Check Node.js
echo [4/6] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo       ERROR: Node.js not installed!
    echo.
    echo       Download from:
    echo       https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Node.js version: %%i
echo       OK
echo.

REM Step 5: Install dependencies
echo [5/6] Installing dependencies...
echo       (This may take a few minutes)
call npm install --prefer-offline 2>nul
if %errorlevel% neq 0 (
    echo       Retrying...
    call npm install
)
if not exist "node_modules" (
    echo       ERROR: npm install failed!
    pause
    exit /b 1
)

echo       Installing better-sqlite3...
call npm install better-sqlite3 --build-from-source 2>nul
echo       OK
echo.

REM Step 6: Compile and build
echo [6/6] Building installer...
echo       Compiling Electron...
call npx tsc -p electron/tsconfig.json
if %errorlevel% neq 0 (
    echo       ERROR: Electron compile failed!
    pause
    exit /b 1
)
call node scripts/rename-to-cjs.cjs 2>nul

echo       Building exe file...
echo       (This takes 5-10 minutes)
echo.
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo    ERROR: Build failed!
    echo.
    echo    Solution:
    echo    1. Close terminal
    echo    2. Restart computer (optional)
    echo    3. Run this script again
    echo.
    echo    If internet disconnects, try again
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo    BUILD SUCCESSFUL!
echo.
echo    Installer is in: release folder
echo ========================================
echo.

if exist "release" (
    echo Opening release folder...
    explorer release
)

pause
