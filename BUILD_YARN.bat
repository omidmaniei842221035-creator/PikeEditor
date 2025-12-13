@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring - Build with Yarn
echo   (Better for slow/blocked networks)
echo ========================================
echo.

REM ===== DISABLE CODE SIGNING =====
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_SKIP_SIGNTOOL_DOWNLOAD=true
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [0/7] Installing Yarn (if not installed)...
where yarn >nul 2>&1
if %errorlevel% neq 0 (
    echo Yarn not found. Installing...
    call npm install -g yarn --registry https://registry.npmmirror.com
)
echo Done.
echo.

echo [1/7] Configuring Yarn for better connectivity...
call yarn config set registry https://registry.npmmirror.com
call yarn config set network-timeout 600000
echo Done.
echo.

echo [2/7] Installing packages with Yarn...
if exist "node_modules" (
    echo node_modules exists - checking for updates...
    call yarn install --prefer-offline --network-concurrency 1
) else (
    echo Fresh install - this may take a while...
    call yarn install --network-concurrency 1
)
if %errorlevel% neq 0 (
    echo.
    echo Retrying with different settings...
    call yarn install --prefer-offline --ignore-engines
    if %errorlevel% neq 0 (
        echo.
        echo ========================================
        echo   NETWORK ERROR
        echo   
        echo   Solutions:
        echo   1. Turn on VPN
        echo   2. Wait and try again
        echo   3. Copy node_modules from another PC
        echo ========================================
        pause
        exit /b 1
    )
)
echo Done.
echo.

echo [3/7] Cleaning build folders...
if exist "dist-public" rmdir /s /q "dist-public" 2>nul
if exist "dist-server" rmdir /s /q "dist-server" 2>nul
if exist "dist-electron" rmdir /s /q "dist-electron" 2>nul
if exist "release" rmdir /s /q "release" 2>nul
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

echo [7/7] Packaging EXE...
call npx electron-builder --win --config electron-builder.json -p never
if %errorlevel% neq 0 (
    echo BUILD FAILED
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
