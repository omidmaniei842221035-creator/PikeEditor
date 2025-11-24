@echo off
chcp 65001 >nul
echo ========================================
echo بررسی فایل‌های Build
echo ========================================
echo.

echo [1] بررسی dist-electron/main.cjs:
echo.
findstr /C:"electron-is-dev" dist-electron\main.cjs
if errorlevel 1 (
    echo ✅ فایل main.cjs مشکلی ندارد - electron-is-dev ندارد
) else (
    echo ❌ فایل main.cjs هنوز electron-is-dev دارد!
)
echo.

echo [2] بررسی فایل‌های موجود در dist-electron:
dir dist-electron
echo.

echo [3] بررسی release:
if exist release (
    dir release
    echo.
    echo ⚠️ اگر فایل Setup قدیمی است، باید پاک شود!
) else (
    echo ❌ فولدر release وجود ندارد
)
echo.

echo [4] بررسی electron-builder cache:
if exist "%USERPROFILE%\AppData\Local\electron-builder\cache" (
    echo پاک کردن cache electron-builder...
    rmdir /s /q "%USERPROFILE%\AppData\Local\electron-builder\cache"
    echo ✅ Cache پاک شد
) else (
    echo ℹ Cache وجود ندارد
)
echo.

echo [5] بررسی electron cache:
if exist "%USERPROFILE%\AppData\Local\electron\Cache" (
    echo پاک کردن electron cache...
    rmdir /s /q "%USERPROFILE%\AppData\Local\electron\Cache"
    echo ✅ Electron cache پاک شد
) else (
    echo ℹ Electron cache وجود ندارد
)
echo.

echo ========================================
echo حالا دوباره build کنید:
echo CLEAN_BUILD_WINDOWS.bat
echo ========================================
pause
