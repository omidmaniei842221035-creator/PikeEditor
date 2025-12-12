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

REM ===== NPM MIRRORS =====
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/7] Cleaning previous builds...
if exist "dist-public" rmdir /s /q "dist-public" 2>nul
if exist "dist-server" rmdir /s /q "dist-server" 2>nul
if exist "dist-electron" rmdir /s /q "dist-electron" 2>nul
if exist "release" rmdir /s /q "release" 2>nul
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
echo Done.
echo.

echo [2/7] Setting up npm...
call npm config set registry https://registry.npmmirror.com 2>nul
echo Done.
echo.

echo [3/7] Installing packages...
call npm install --prefer-offline
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
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

REM Build main.ts with esbuild (bundle logger.ts with it)
call npx esbuild electron/main.ts --platform=node --bundle --format=cjs --outfile=dist-electron/main.cjs --external:electron --external:better-sqlite3
if %errorlevel% neq 0 (
    echo ERROR: Electron main build failed
    pause
    exit /b 1
)

REM Build preload.ts
call npx esbuild electron/preload.ts --platform=node --bundle --format=cjs --outfile=dist-electron/preload.cjs --external:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron preload build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [7/7] Packaging EXE (this may take 3-5 minutes)...
call npx electron-builder --win --config electron-builder.json -p never

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   BUILD FAILED
    echo.
    echo   Try one of these solutions:
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
echo.
echo   Your EXE file is in: release folder
echo ========================================
echo.

if exist "release" explorer release

pause
