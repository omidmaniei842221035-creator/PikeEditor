@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring System - Windows Build
echo ========================================
echo.

REM Disable code signing
set CSC_IDENTITY_AUTO_DISCOVERY=false

REM NPM config for Iran
echo [1/4] Setting up npm...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
echo Done.
echo.

REM Electron mirrors
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

REM Clear old cache
echo [2/4] Clearing cache...
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
echo Done.
echo.

REM Install packages
echo [3/5] Installing packages...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build frontend and server
echo [4/5] Building frontend and server...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build exe
echo [5/5] Building portable exe...
echo This takes about 5 minutes...
echo.

call npx tsc -p electron/tsconfig.json
call node scripts/rename-to-cjs.cjs
call npx electron-builder --win portable

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo   
echo   Your exe file is in: release folder
echo ========================================
echo.

if exist "release" explorer release

pause
