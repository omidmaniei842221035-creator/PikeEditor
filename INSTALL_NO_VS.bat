@echo off
chcp 65001 >nul
echo ========================================
echo نصب بدون Visual Studio
echo ========================================
echo.

echo [1/5] پاک کردن cache...
call npm cache clean --force
echo.

echo [2/5] نصب packages بدون compile...
call npm install --ignore-scripts --legacy-peer-deps
if errorlevel 1 (
    echo ❌ خطا در npm install
    pause
    exit /b 1
)
echo ✅ نصب اولیه کامل شد
echo.

echo [3/5] دانلود prebuilt better-sqlite3...
call npm install better-sqlite3 --build-from-source=false
if errorlevel 1 (
    echo ⚠️ prebuild موجود نیست، تلاش برای rebuild...
    call npm rebuild better-sqlite3 --update-binary
)
echo.

echo [4/5] نصب electron prebuild...
call npm install @electron/rebuild --save-dev
call npx electron-rebuild -f -w better-sqlite3
if errorlevel 1 (
    echo ⚠️ electron-rebuild خطا داد
)
echo.

echo [5/5] بررسی نصب...
call npm list better-sqlite3
echo.

echo ========================================
echo اگر خطا دارید، Visual Studio Build Tools را نصب کنید:
echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
echo ========================================
pause
