@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         تنظیمات NPM و Electron برای ایران                 ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  این اسکریپت همه تنظیمات لازم را انجام می‌دهد              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/5] تنظیم npm registry به npmmirror.com...
call npm config set registry https://registry.npmmirror.com
echo       ✓ OK

echo [2/5] غیرفعال کردن SSL strict...
call npm config set strict-ssl false
echo       ✓ OK

echo [3/5] افزایش timeout برای دانلودها...
call npm config set fetch-timeout 600000
call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
echo       ✓ OK

echo [4/5] تنظیم Electron mirrors...
setx ELECTRON_MIRROR "https://npmmirror.com/mirrors/electron/" >nul 2>&1
setx ELECTRON_BUILDER_BINARIES_MIRROR "https://npmmirror.com/mirrors/electron-builder-binaries/" >nul 2>&1
echo       ✓ OK (نیاز به restart ترمینال دارد)

echo [5/5] پاکسازی cache خراب...
if exist "%LOCALAPPDATA%\electron\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron\Cache" 2>nul
    echo       ✓ electron cache پاک شد
) else (
    echo       - electron cache وجود نداشت
)
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
    echo       ✓ electron-builder cache پاک شد
) else (
    echo       - electron-builder cache وجود نداشت
)

echo.
echo ════════════════════════════════════════════════════════════
echo    تنظیمات با موفقیت انجام شد!
echo.
echo    مهم: ترمینال را ببندید و دوباره باز کنید
echo    سپس BUILD.bat را اجرا کنید
echo ════════════════════════════════════════════════════════════
echo.

pause
