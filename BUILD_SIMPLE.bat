@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring System - Simple Build
echo   (No Electron EXE - Uses Node.js)
echo ========================================
echo.

REM NPM config
echo [1/5] Setting up npm...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
echo Done.
echo.

REM Install packages
echo [2/5] Installing packages...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build frontend
echo [3/5] Building frontend...
call npx vite build --outDir dist-public
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Build server
echo [4/5] Building server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:ws --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)
echo Done.
echo.

REM Create portable folder
echo [5/5] Creating portable folder...

if exist "portable-app" rmdir /s /q "portable-app"
mkdir portable-app
mkdir portable-app\public
mkdir portable-app\server

xcopy /E /I /Y dist-public portable-app\public >nul
copy dist-server\index.cjs portable-app\server\ >nul
copy package.json portable-app\ >nul

REM Copy better-sqlite3
if exist "node_modules\better-sqlite3" (
    xcopy /E /I /Y node_modules\better-sqlite3 portable-app\node_modules\better-sqlite3 >nul
)

REM Create start script
echo @echo off > portable-app\START.bat
echo chcp 65001 ^>nul 2^>^&1 >> portable-app\START.bat
echo echo Starting POS Monitoring System... >> portable-app\START.bat
echo set NODE_ENV=production >> portable-app\START.bat
echo set IS_DESKTOP=true >> portable-app\START.bat
echo set PORT=5000 >> portable-app\START.bat
echo node server\index.cjs >> portable-app\START.bat
echo pause >> portable-app\START.bat

REM Create fresh install marker
echo 1 > portable-app\.fresh_install

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo   
echo   Output folder: portable-app
echo   
echo   To run:
echo   1. Copy portable-app folder to target PC
echo   2. Install Node.js on target PC
echo   3. Run START.bat
echo ========================================
echo.

explorer portable-app

pause
