@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring System - Windows Build
echo   Version 1.0.3
echo ========================================
echo.

REM ===== DISABLE CODE SIGNING =====
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set WIN_CSC_LINK=
set CSC_KEY_PASSWORD=
set WIN_CSC_KEY_PASSWORD=
set ELECTRON_BUILDER_SKIP_SIGNTOOL_DOWNLOAD=true

REM ===== NPM AND ELECTRON MIRRORS =====
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/7] Checking node_modules...
if exist "node_modules" (
    echo node_modules exists - SKIPPING npm install
    echo.
    goto :build_frontend
)

echo node_modules not found - Installing packages...
call npm config set registry https://registry.npmmirror.com
call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
call npm config set strict-ssl false

call npm install --prefer-offline --no-audit --no-fund
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   NETWORK ERROR
    echo   
    echo   Solutions:
    echo   1. Use VPN
    echo   2. Copy node_modules from another PC
    echo ========================================
    pause
    exit /b 1
)
echo Done.
echo.

:build_frontend
echo [2/7] Cleaning previous builds...
if exist "dist" rmdir /s /q "dist" 2>nul
if exist "dist-public" rmdir /s /q "dist-public" 2>nul
if exist "dist-server" rmdir /s /q "dist-server" 2>nul
if exist "dist-electron" rmdir /s /q "dist-electron" 2>nul
if exist "release" rmdir /s /q "release" 2>nul
echo Done.
echo.

echo [3/7] Building frontend...
call npx vite build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
REM Vite outputs to dist/public based on vite.config.ts
if not exist "dist\public\index.html" (
    echo ERROR: dist\public\index.html not found!
    echo Vite build may have failed silently.
    pause
    exit /b 1
)
echo Verifying: dist\public\index.html exists
dir dist\public\index.html

REM Copy to dist-public for electron-builder
if exist "dist-public" rmdir /s /q "dist-public" 2>nul
xcopy /E /I /Y "dist\public" "dist-public"
echo Done.
echo.

echo [4/7] Building server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [5/7] Building Electron main...
if not exist "dist-electron" mkdir dist-electron

call npx esbuild electron/main.ts --platform=node --bundle --format=cjs --outfile=dist-electron/main.cjs --external:electron --external:better-sqlite3
if %errorlevel% neq 0 (
    echo ERROR: Electron main build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [6/7] Building Electron preload...
call npx esbuild electron/preload.ts --platform=node --bundle --format=cjs --outfile=dist-electron/preload.cjs --external:electron
if %errorlevel% neq 0 (
    echo ERROR: Electron preload build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [7/8] Rebuilding native modules for Electron...
call npx electron-rebuild -f -w better-sqlite3
if %errorlevel% neq 0 (
    echo ERROR: electron-rebuild failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [8/8] Packaging EXE (3-5 minutes)...
echo.
echo Verifying files before packaging:
echo   - dist-public exists: 
if exist "dist-public" (echo     YES) else (echo     NO - ERROR!)
echo   - dist-public\index.html exists:
if exist "dist-public\index.html" (echo     YES) else (echo     NO - ERROR!)
echo   - dist-server exists:
if exist "dist-server" (echo     YES) else (echo     NO - ERROR!)
echo   - dist-server\index.cjs exists:
if exist "dist-server\index.cjs" (echo     YES) else (echo     NO - ERROR!)
echo.

call npx electron-builder --win --config electron-builder.json -p never

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   BUILD FAILED
    echo   
    echo   Try running CMD as Administrator
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
