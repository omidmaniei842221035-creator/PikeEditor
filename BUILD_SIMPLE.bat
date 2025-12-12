@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   POS Monitoring - Portable Build
echo   (Requires Node.js on target PC)
echo ========================================
echo.

echo [1/5] Installing packages...
call npm install --prefer-offline
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [2/5] Building frontend...
call npx vite build --outDir dist-public
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [3/5] Building server...
call npx esbuild server/electron-entry.ts --platform=node --packages=bundle --bundle --format=cjs --outfile=dist-server/index.cjs --external:better-sqlite3 --external:@neondatabase/serverless --external:ws --external:lightningcss
if %errorlevel% neq 0 (
    echo ERROR: Server build failed
    pause
    exit /b 1
)
echo Done.
echo.

echo [4/5] Creating portable folder...
if exist "portable-app" rmdir /s /q "portable-app"
mkdir portable-app
mkdir portable-app\public
mkdir portable-app\server
mkdir portable-app\node_modules

xcopy /E /I /Y "dist-public" "portable-app\public" >nul
copy "dist-server\index.cjs" "portable-app\server\" >nul

REM Copy better-sqlite3
if exist "node_modules\better-sqlite3" (
    xcopy /E /I /Y "node_modules\better-sqlite3" "portable-app\node_modules\better-sqlite3" >nul
)
if exist "node_modules\bindings" (
    xcopy /E /I /Y "node_modules\bindings" "portable-app\node_modules\bindings" >nul
)
if exist "node_modules\file-uri-to-path" (
    xcopy /E /I /Y "node_modules\file-uri-to-path" "portable-app\node_modules\file-uri-to-path" >nul
)
echo Done.
echo.

echo [5/5] Creating start script...

(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo echo.
echo echo ========================================
echo echo   POS Monitoring System
echo echo   Starting server...
echo echo ========================================
echo echo.
echo set NODE_ENV=production
echo set IS_DESKTOP=true
echo set PORT=5000
echo cd /d "%%~dp0"
echo node server\index.cjs
echo pause
) > portable-app\START.bat

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo   
echo   Output: portable-app folder
echo   
echo   To use:
echo   1. Copy portable-app to target PC
echo   2. Install Node.js on target PC
echo   3. Run START.bat
echo   4. Open browser: http://localhost:5000
echo ========================================
echo.

explorer portable-app

pause
