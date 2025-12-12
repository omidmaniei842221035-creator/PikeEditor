@echo off
chcp 65001 >nul
echo ========================================
echo   بازنشانی دیتابیس - Reset Database
echo ========================================
echo.
echo ⚠️  این عملیات تمام داده‌های موجود را حذف می‌کند!
echo ⚠️  This will DELETE all existing data!
echo.
set /p confirm="آیا مطمئن هستید؟ (Y/N) Are you sure? "
if /i not "%confirm%"=="Y" (
    echo عملیات لغو شد / Operation cancelled
    pause
    exit /b 0
)

echo.
echo 🗑️  در حال حذف دیتابیس قدیمی...
echo 🗑️  Deleting old database...

if exist pos-system.db (
    del /f pos-system.db
    echo ✅ دیتابیس حذف شد / Database deleted
) else (
    echo ℹ️  دیتابیسی یافت نشد / No database found
)

echo.
echo ✅ بازنشانی کامل شد!
echo ✅ Reset complete!
echo.
echo 📝 اکنون برنامه را اجرا کنید و داده‌ها را مجدداً وارد کنید
echo 📝 Now run the application and re-import your data
echo.
pause
