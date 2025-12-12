@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring System - Windows Build
echo ========================================
echo.

REM ===== DISABLE ALL CODE SIGNING =====
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set WIN_CSC_LINK=
set CSC_KEY_PASSWORD=
set WIN_CSC_KEY_PASSWORD=
set ELECTRON_BUILDER_SKIP_SIGNTOOL_DOWNLOAD=true

REM NPM config
echo [1/6] Setting up npm...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
echo Done.
echo.

REM Electron mirrors
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

REM Clear problematic cache
echo [2/6] Clearing caches...
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
rmdir /s /q "dist-public" 2>nul
rmdir /s /q "dist-server" 2>nul
rmdir /s /q "dist-electron" 2>nul
rmdir /s /q "release" 2>nul
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

REM Build server
echo [5/6] Building Electron server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:ws --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)

REM Build Electron main with esbuild (not tsc)
if not exist "dist-electron" mkdir dist-electron
call npx esbuild electron/main.js --platform=node --bundle --format=cjs --outfile=dist-electron/main.cjs --external:electron --external:better-sqlite3
if %errorlevel% neq 0 (
    echo ERROR: Electron main build failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build Electron portable
echo [6/6] Building portable exe...
echo This may take 3-5 minutes...
echo.

REM Build with no code signing
call npx electron-builder --win portable --config electron-builder.json -p never

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   BUILD FAILED
    echo   
    echo   Solutions:
    echo   1. Run CMD as Administrator
    echo   2. Or use BUILD_SIMPLE.bat instead
    echo ========================================
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
