@echo off
chcp 65001 >nul
echo ========================================
echo Build ساده برای Windows
echo (بدون پاکسازی node_modules)
echo ========================================
echo.

echo [1/4] پاک کردن فولدرهای build قدیمی...
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
if exist release rmdir /s /q release
echo ✅ پاکسازی انجام شد
echo.

echo [2/4] Build frontend و backend...
call npm run build
if errorlevel 1 (
    echo ❌ خطا در build
    pause
    exit /b 1
)
echo ✅ Build انجام شد
echo.

echo [3/4] Compile Electron...
call npm run electron:compile
if errorlevel 1 (
    echo ❌ خطا در electron compile
    pause
    exit /b 1
)
echo ✅ Electron compile شد
echo.

echo [4/4] Build Windows installer...
call npm run electron:build:win
if errorlevel 1 (
    echo ❌ خطا در electron build
    pause
    exit /b 1
)
echo.

echo ✅✅✅ Build کامل شد! ✅✅✅
echo.
echo فایل installer:
dir release\*.exe
echo.
echo ========================================
echo مراحل بعدی:
echo 1. Uninstall برنامه قدیمی
echo 2. پاک کردن: %LOCALAPPDATA%\Programs\pos-monitoring-system
echo 3. نصب installer جدید با Run as Administrator
echo ========================================
pause
