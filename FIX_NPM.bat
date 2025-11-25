@echo off
echo.
echo ========================================
echo    NPM Configuration for Iran
echo ========================================
echo.

echo Setting npm registry to npmmirror.com...
call npm config set registry https://registry.npmmirror.com

echo Disabling SSL strict checking...
call npm config set strict-ssl false

echo.
echo Done! Now run BUILD.bat
echo.
pause
