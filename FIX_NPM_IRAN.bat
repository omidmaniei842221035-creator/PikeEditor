@echo off
chcp 65001 >nul
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   تنظیم npm برای ایران                                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo تنظیم registry به npmmirror.com...
npm config set registry https://registry.npmmirror.com

echo غیرفعال کردن SSL verification...
npm config set strict-ssl false

echo.
echo ✅ تنظیمات انجام شد!
echo.
echo حالا می‌توانید BUILD_FINAL_v1.0.2.bat را اجرا کنید.
echo.
pause
