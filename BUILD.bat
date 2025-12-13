@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring System - Windows Build
echo   Version 1.0.2
echo ========================================
echo.

REM ===== DISABLE CODE SIGNING =====
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set WIN_CSC_LINK=
set CSC_KEY_PASSWORD=
set WIN_CSC_KEY_PASSWORD=
set ELECTRON_BUILDER_SKIP_SIGNTOOL_DOWNLOAD=true

REM ===== NPM AND ELECTRON MIRRORS FOR IRAN =====
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/7] Setting up npm for better connectivity...
call npm config set registry https://registry.npmmirror.com
call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
call npm config set strict-ssl false
echo Done.
echo.

echo [2/7] Cleaning previous builds...
if exist "dist-public" rmdir /s /q "dist-public" 2>nul
if exist "dist-server" rmdir /s /q "dist-server" 2>nul
if exist "dist-electron" rmdir /s /q "dist-electron" 2>nul
if exist "release" rmdir /s /q "release" 2>nul
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
echo Done.
echo.

echo [3/7] Installing packages (this may take a while)...
echo If this fails, try using a VPN or better internet connection.
echo.
call npm install --prefer-offline --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo Retrying with different settings...
    call npm cache clean --force
    call npm install --legacy-peer-deps --prefer-offline
    if %errorlevel% neq 0 (
        echo.
        echo ========================================
        echo   NETWORK ERROR
        echo   
        echo   Solutions:
        echo   1. Use VPN to bypass filtering
        echo   2. Try a different internet connection
        echo   3. Check your proxy settings
        echo ========================================
        pause
        exit /b 1
    )
)
echo Done.
echo.

echo [4/7] Building frontend...
call npx vite build --outDir dist-public
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [5/7] Building server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:ws --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [6/7] Building Electron...
if not exist "dist-electron" mkdir dist-electron

call npx esbuild electron/main.ts --platform=node --bundle --format=cjs --outfile=dist-electron/main.cjs --external:electron --external:better-sqlite3
if %errorlevel% neq 0 (
    echo ERROR: Electron main build failed
    pause
    exit /b 1
)

call npx esbuild electron/preload.ts --platform=node --bundle --format=cjs --outfile=dist-electron/preload.cjs --external:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron preload build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [7/7] Packaging EXE (3-5 minutes)...
call npx electron-builder --win --config electron-builder.json -p never

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   BUILD FAILED
    echo   
    echo   Solutions:
    echo   1. Run CMD as Administrator
    echo   2. Run CLEAN-BUILD.bat first
    echo   3. Use BUILD_SIMPLE.bat instead
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo   
echo   Your EXE is in: release folder
echo ========================================
echo.

if exist "release" explorer release

pause
