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
echo [1/6] Setting up npm...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
echo Done.
echo.

REM Electron mirrors
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

REM Clear old cache
echo [2/6] Clearing cache...
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
echo Done.
echo.

REM Install packages
echo [3/6] Installing packages...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build frontend
echo [4/6] Building frontend...
call npx vite build --outDir dist-public
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build server with electron-entry.ts (NOT index.ts!)
echo [5/6] Building Electron server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:ws --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build exe
echo [6/6] Building portable exe...
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
