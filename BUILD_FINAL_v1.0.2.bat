@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   سامانه مانیتورینگ POS - نسخه 1.0.2 (نسخه نهایی)            ║
echo ║   Build کامل برای Windows                                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo ═══════════════════════════════════════════════════════════════════
echo مرحله 1: Uninstall نسخه قدیمی
echo ═══════════════════════════════════════════════════════════════════
echo.
echo لطفاً این کارها را انجام دهید:
echo.
echo   1. برنامه را ببندید (اگر باز است)
echo.
echo   2. Settings -^> Apps -^> "سامانه مانیتورینگ POS" -^> Uninstall
echo.
echo   3. این فولدرها را دستی پاک کنید:
echo      - %LOCALAPPDATA%\Programs\pos-monitoring-system
echo      - %APPDATA%\سامانه مانیتورینگ POS
echo.
pause
echo.

echo ═══════════════════════════════════════════════════════════════════
echo مرحله 2: پاکسازی کامل
echo ═══════════════════════════════════════════════════════════════════
echo.

echo [2.1] پاک کردن فولدرهای build...
if exist release rmdir /s /q release 2>nul
if exist dist rmdir /s /q dist 2>nul
if exist dist-electron rmdir /s /q dist-electron 2>nul
echo ✅ فولدرهای build پاک شدند
echo.

echo [2.2] پاک کردن cache electron-builder...
if exist "%USERPROFILE%\AppData\Local\electron-builder\cache" (
    rmdir /s /q "%USERPROFILE%\AppData\Local\electron-builder\cache" 2>nul
    echo ✅ Cache electron-builder پاک شد
) else (
    echo ⚪ Cache electron-builder وجود نداشت
)

if exist "%USERPROFILE%\AppData\Local\electron\Cache" (
    rmdir /s /q "%USERPROFILE%\AppData\Local\electron\Cache" 2>nul
    echo ✅ Cache electron پاک شد
) else (
    echo ⚪ Cache electron وجود نداشت
)
echo.

echo ═══════════════════════════════════════════════════════════════════
echo مرحله 3: Build Frontend و Backend
echo ═══════════════════════════════════════════════════════════════════
echo.
call npm run build
if errorlevel 1 (
    color 0C
    echo.
    echo ❌ خطا در build frontend/backend
    echo لطفاً خطاها را بررسی کنید
    pause
    exit /b 1
)
echo.
echo ✅ Build frontend/backend موفق
echo.

echo ═══════════════════════════════════════════════════════════════════
echo مرحله 4: Compile Electron
echo ═══════════════════════════════════════════════════════════════════
echo.
call npm run electron:compile
if errorlevel 1 (
    color 0C
    echo.
    echo ❌ خطا در compile Electron
    pause
    exit /b 1
)
echo.
echo ✅ Compile Electron موفق
echo.

echo بررسی فایل‌های Electron:
echo ─────────────────────────
dir dist-electron\*.cjs dist-electron\*.js 2>nul
echo.

echo ⚠️  مهم: آیا فایل‌های زیر را می‌بینید؟
echo     - main.cjs
echo     - preload.cjs
echo     - logger.js
echo.
pause
echo.

echo ═══════════════════════════════════════════════════════════════════
echo مرحله 5: Build Windows Installer (نسخه 1.0.2)
echo ═══════════════════════════════════════════════════════════════════
echo.
echo ⏱️  این مرحله 5-10 دقیقه طول می‌کشد...
echo.
call npm run electron:build:win
if errorlevel 1 (
    color 0C
    echo.
    echo ❌ خطا در build installer
    pause
    exit /b 1
)
echo.

color 0A
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║               ✅ BUILD موفقیت‌آمیز بود! ✅                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo فایل installer جدید:
echo ─────────────────────
dir release\*1.0.2*.exe 2>nul
if errorlevel 1 (
    dir release\*.exe 2>nul
)
echo.

echo ═══════════════════════════════════════════════════════════════════
echo مراحل بعدی:
echo ═══════════════════════════════════════════════════════════════════
echo.
echo   1. رفتن به فولدر release
echo.
echo   2. پیدا کردن فایل: 
echo      "سامانه مانیتورینگ POS-Setup-1.0.2.exe"
echo.
echo   3. راست‌کلیک روی فایل -^> Run as Administrator
echo.
echo   4. نصب برنامه
echo.
echo ═══════════════════════════════════════════════════════════════════
echo.
pause
