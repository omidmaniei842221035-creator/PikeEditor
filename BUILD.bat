@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    POS Monitoring System - Build v1.0.4
echo    Frontend is PRE-BUILT (faster build)
echo ========================================
echo.

REM Set mirrors for Iran
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

REM Step 1: Check Node.js
echo [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Node.js version: %%i
echo       OK
echo.

REM Step 2: Install dependencies
echo [2/4] Installing dependencies...
call npm install --ignore-scripts 2>nul
call npm install better-sqlite3 --build-from-source 2>nul
if not exist "node_modules" (
    echo ERROR: npm install failed!
    echo Try running FIX_NPM.bat first
    pause
    exit /b 1
)
echo       OK
echo.

REM Step 3: Compile Electron
echo [3/4] Compiling Electron...
call npx tsc -p electron/tsconfig.json
if %errorlevel% neq 0 (
    echo ERROR: Electron compile failed!
    pause
    exit /b 1
)
call node scripts/rename-to-cjs.cjs
echo       OK
echo.

REM Step 4: Build Windows installer
echo [4/4] Building Windows installer...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo    ERROR: Build failed!
    echo.
    echo    If you see "zip: not a valid zip file"
    echo    Run FIX_ELECTRON.bat first, then retry
    echo ========================================
    pause
    exit /b 1
)
echo       OK
echo.

echo ========================================
echo    BUILD SUCCESSFUL!
echo ========================================
echo.
echo Installer location:
echo    release\*.exe
echo.

if exist "release" (
    echo Opening release folder...
    explorer release
)

pause
