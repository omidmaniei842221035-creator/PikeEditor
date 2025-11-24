@echo off
chcp 65001 >nul
echo ========================================
echo پاکسازی و Build کامل برای Windows
echo ========================================
echo.

echo [1/7] پاک کردن فولدرهای build قدیمی...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist release rmdir /s /q release
echo ✅ پاکسازی انجام شد
echo.

echo [2/7] نصب dependencies...
call npm install
if errorlevel 1 (
    echo ❌ خطا در npm install
    pause
    exit /b 1
)
echo ✅ نصب کامل شد
echo.

echo [3/7] Rebuild SQLite برای Windows...
call npm rebuild better-sqlite3 --update-binary
if errorlevel 1 (
    echo ❌ خطا در rebuild SQLite
    pause
    exit /b 1
)
echo ✅ SQLite rebuild شد
echo.

echo [4/7] Build frontend و backend...
call npm run build
if errorlevel 1 (
    echo ❌ خطا در build
    pause
    exit /b 1
)
echo ✅ Build انجام شد
echo.

echo [5/7] Compile Electron...
call npm run electron:compile
if errorlevel 1 (
    echo ❌ خطا در electron compile
    pause
    exit /b 1
)
echo ✅ Electron compile شد
echo.

echo [6/7] بررسی فایل‌های Electron...
dir dist-electron
echo.
echo آیا فایل main.cjs و preload.cjs را می‌بینید؟
pause
echo.

echo [7/7] Build Windows installer (این مرحله 5-7 دقیقه طول می‌کشد)...
call npm run electron:build:win
if errorlevel 1 (
    echo ❌ خطا در electron build
    pause
    exit /b 1
)
echo.
echo ✅✅✅ Build کامل شد! ✅✅✅
echo.
echo فایل installer در فولدر release ساخته شد:
dir release\*.exe
echo.
echo ========================================
echo مراحل بعدی:
echo 1. از Settings ویندوز، برنامه قدیمی را Uninstall کنید
echo 2. فولدر زیر را پاک کنید:
echo    %LOCALAPPDATA%\Programs\pos-monitoring-system
echo 3. فایل installer جدید را با Run as Administrator نصب کنید
echo ========================================
pause
