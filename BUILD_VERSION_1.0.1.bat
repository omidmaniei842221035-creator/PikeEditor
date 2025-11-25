@echo off
chcp 65001 >nul
echo ========================================
echo Build نسخه 1.0.1 (نسخه جدید بدون electron-is-dev)
echo ========================================
echo.

echo [مرحله 1] Uninstall نسخه قدیمی
echo ----------------------------------------
echo لطفاً این کارها را انجام دهید:
echo 1. برنامه را ببندید (اگر باز است)
echo 2. Settings -^> Apps -^> "سامانه مانیتورینگ POS" -^> Uninstall
echo 3. فولدر زیر را پاک کنید:
echo    %LOCALAPPDATA%\Programs\pos-monitoring-system
echo.
pause
echo.

echo [مرحله 2] پاک کردن build قدیمی
echo ----------------------------------------
if exist release rmdir /s /q release
if exist dist rmdir /s /q dist
if exist dist-electron rmdir /s /q dist-electron
echo ✅ فولدرهای قدیمی پاک شدند
echo.

echo [مرحله 3] پاک کردن electron-builder cache
echo ----------------------------------------
if exist "%USERPROFILE%\AppData\Local\electron-builder\cache" (
    rmdir /s /q "%USERPROFILE%\AppData\Local\electron-builder\cache"
    echo ✅ Cache electron-builder پاک شد
)
if exist "%USERPROFILE%\AppData\Local\electron\Cache" (
    rmdir /s /q "%USERPROFILE%\AppData\Local\electron\Cache"
    echo ✅ Cache electron پاک شد
)
echo.

echo [مرحله 4] Build frontend + backend
echo ----------------------------------------
call npm run build
if errorlevel 1 (
    echo ❌ خطا در build
    pause
    exit /b 1
)
echo ✅ Build کامل شد
echo.

echo [مرحله 5] Compile Electron
echo ----------------------------------------
call npm run electron:compile
if errorlevel 1 (
    echo ❌ خطا در compile
    pause
    exit /b 1
)
echo.
echo بررسی فایل‌های compile شده:
dir dist-electron
echo.
echo ⚠️ مهم: باید فایل‌های main.cjs و preload.cjs را ببینید
pause
echo.

echo [مرحله 6] Build Windows installer (نسخه 1.0.1)
echo ----------------------------------------
call npm run electron:build:win
if errorlevel 1 (
    echo ❌ خطا در build installer
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ Build نسخه 1.0.1 کامل شد!
echo ========================================
echo.
echo فایل installer جدید:
dir release\*.exe
echo.
echo ⚠️ IMPORTANT: بررسی کنید که فایل installer این نام را دارد:
echo    "سامانه مانیتورینگ POS-Setup-1.0.1.exe"
echo    (نه 1.0.0)
echo.
echo مراحل بعدی:
echo 1. مطمئن شوید برنامه 1.0.0 قدیمی را uninstall کردید
echo 2. فولدر %LOCALAPPDATA%\Programs\pos-monitoring-system را پاک کنید
echo 3. installer نسخه 1.0.1 را با "Run as Administrator" نصب کنید
echo.
echo ========================================
pause
