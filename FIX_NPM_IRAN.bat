@echo off
chcp 65001 >nul
echo ========================================
echo حل مشکل اتصال NPM در ایران
echo ========================================
echo.

echo [1/6] تنظیم registry ایرانی...
call npm config set registry https://registry.npmmirror.com
echo ✅ Registry تغییر کرد
echo.

echo [2/6] افزایش timeout...
call npm config set fetch-timeout 60000
call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
echo ✅ Timeout افزایش یافت
echo.

echo [3/6] غیرفعال کردن strict SSL (موقت)...
call npm config set strict-ssl false
echo ✅ SSL غیرفعال شد
echo.

echo [4/6] پاک کردن cache...
call npm cache clean --force
echo ✅ Cache پاک شد
echo.

echo [5/6] بررسی تنظیمات...
call npm config list
echo.

echo [6/6] شروع نصب...
call npm install --ignore-scripts --legacy-peer-deps --verbose
if errorlevel 1 (
    echo.
    echo ❌ خطا در نصب
    echo.
    echo راه‌حل‌های دیگر:
    echo 1. VPN روشن کنید و دوباره امتحان کنید
    echo 2. از hotspot موبایل استفاده کنید
    echo 3. فایل node_modules از Replit دانلود کنید
    pause
    exit /b 1
)

echo.
echo ✅ نصب موفق!
echo.
echo حالا rebuild SQLite:
call npm rebuild better-sqlite3 --update-binary
echo.

echo ========================================
echo ✅ نصب کامل شد!
echo حالا می‌توانید build کنید
echo ========================================
pause
