@echo off
chcp 65001 >nul
echo ========================================
echo پاک کردن نسخه قدیمی برنامه
echo ========================================
echo.

echo این فایل فولدر نصب قدیمی را پاک می‌کند.
echo لطفاً ابتدا از Settings ویندوز برنامه را Uninstall کنید.
echo.
pause

set "APP_DIR=%LOCALAPPDATA%\Programs\pos-monitoring-system"

if exist "%APP_DIR%" (
    echo پاک کردن فولدر: %APP_DIR%
    rmdir /s /q "%APP_DIR%"
    if exist "%APP_DIR%" (
        echo ❌ نتوانستم فولدر را پاک کنم. لطفاً برنامه را ببندید و دوباره امتحان کنید.
    ) else (
        echo ✅ فولدر با موفقیت پاک شد!
    )
) else (
    echo ℹ فولدر از قبل وجود ندارد.
)

echo.
echo حالا می‌توانید installer جدید را نصب کنید.
pause
