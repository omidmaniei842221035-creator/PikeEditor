@echo off
chcp 65001 >nul
title پاکسازی و دانلود مجدد Electron

echo.
echo ═══════════════════════════════════════════════════════
echo    پاکسازی Cache خراب Electron
echo ═══════════════════════════════════════════════════════
echo.

echo [1/4] پاک کردن cache خراب...
if exist "%LOCALAPPDATA%\electron\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron\Cache" 2>nul
    echo    ✓ پوشه Cache پاک شد
)
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
    echo    ✓ پوشه electron-builder پاک شد
)

echo.
echo [2/4] تنظیم mirror چینی برای Electron...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo    ELECTRON_MIRROR=%ELECTRON_MIRROR%
echo    ELECTRON_BUILDER_BINARIES_MIRROR=%ELECTRON_BUILDER_BINARIES_MIRROR%

echo.
echo [3/4] تنظیم npm برای ایران...
call npm config set registry https://registry.npmmirror.com
call npm config set strict-ssl false
call npm config set fetch-timeout 300000

echo.
echo [4/4] آماده برای build...
echo.
echo ═══════════════════════════════════════════════════════
echo    حالا BUILD.bat را اجرا کن
echo ═══════════════════════════════════════════════════════
echo.

pause
