@echo off
chcp 65001 >nul
echo ========================================
echo بازگشت تنظیمات NPM به حالت اولیه
echo ========================================
echo.

call npm config set registry https://registry.npmjs.org/
call npm config set strict-ssl true
call npm config delete fetch-timeout
call npm config delete fetch-retries
call npm config delete fetch-retry-mintimeout
call npm config delete fetch-retry-maxtimeout

echo ✅ تنظیمات به حالت اولیه برگشت
echo.
pause
