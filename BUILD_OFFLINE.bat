@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring - Offline Build
echo   (Skips npm install if node_modules exists)
echo ========================================
echo.

REM ===== DISABLE CODE SIGNING =====
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_SKIP_SIGNTOOL_DOWNLOAD=true
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [1/6] Checking node_modules...
if exist "node_modules" (
    echo node_modules exists - SKIPPING npm install
) else (
    echo node_modules not found - Installing packages...
    call npm config set registry https://registry.npmmirror.com
    call npm config set strict-ssl false
    call npm install --prefer-offline --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: npm install failed
        echo Please use VPN or copy node_modules from another PC
        pause
        exit /b 1
    )
)
echo Done.
echo.

echo [2/6] Cleaning build folders...
if exist "dist-public" rmdir /s /q "dist-public" 2>nul
if exist "dist-server" rmdir /s /q "dist-server" 2>nul
if exist "dist-electron" rmdir /s /q "dist-electron" 2>nul
if exist "release" rmdir /s /q "release" 2>nul
echo Done.
echo.

echo [3/6] Building frontend...
call npx vite build --outDir dist-public
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [4/6] Building server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:ws --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [5/6] Building Electron...
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

echo [6/6] Packaging EXE...
call npx electron-builder --win --config electron-builder.json -p never
if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED - Try running as Administrator
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo   Your EXE is in: release folder
echo ========================================
echo.

if exist "release" explorer release
pause
