@echo off
chcp 65001 >nul
echo ========================================
echo نصب سریع Dependencies (بدون هنگ کردن)
echo ========================================
echo.

echo [1/4] پاک کردن cache npm...
call npm cache clean --force
echo ✅ Cache پاک شد
echo.

echo [2/4] نصب packages (بدون scripts - سریع)...
call npm install --ignore-scripts --verbose
if errorlevel 1 (
    echo ❌ خطا در npm install
    pause
    exit /b 1
)
echo ✅ نصب کامل شد
echo.

echo [3/4] Rebuild SQLite برای Windows...
call npm rebuild better-sqlite3 --update-binary
if errorlevel 1 (
    echo ⚠️ خطا در rebuild SQLite - ولی ادامه می‌دهیم
)
echo ✅ SQLite rebuild شد
echo.

echo [4/4] بررسی نصب...
call npm list better-sqlite3
echo.

echo ========================================
echo ✅ نصب کامل شد!
echo حالا می‌توانید build کنید:
echo   npm run build
echo   npm run electron:compile
echo   npm run electron:build:win
echo ========================================
pause
