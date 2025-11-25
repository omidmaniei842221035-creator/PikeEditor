@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ========================================
echo    POS Monitoring System - Build v1.0.2
echo ========================================
echo.

REM Step 1: Check Node.js
echo [1/6] Checking Node.js...
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

REM Step 2: Clean old builds
echo [2/6] Cleaning old builds...
if exist "dist" rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"
if exist "release" rmdir /s /q "release"
echo       OK
echo.

REM Step 3: Install dependencies
echo [3/6] Installing dependencies (this may take 5-10 minutes)...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    echo Try running FIX_NPM.bat first if you are in Iran
    pause
    exit /b 1
)
echo       OK
echo.

REM Step 4: Build frontend
echo [4/6] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo       OK
echo.

REM Step 5: Build Electron
echo [5/6] Building Electron app...
call npm run electron:build:win
if %errorlevel% neq 0 (
    echo ERROR: Electron build failed!
    pause
    exit /b 1
)
echo       OK
echo.

REM Step 6: Done
echo [6/6] Build complete!
echo.
echo ========================================
echo    BUILD SUCCESSFUL!
echo ========================================
echo.
echo Installer location:
echo    release\*.exe
echo.
echo.

REM Open release folder
if exist "release" (
    echo Opening release folder...
    explorer release
)

pause
