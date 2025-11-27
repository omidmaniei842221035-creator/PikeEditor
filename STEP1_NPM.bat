@echo off
echo Setting npm for Iran...
npm config set registry https://registry.npmmirror.com
npm config set strict-ssl false
npm config set fetch-timeout 600000
echo.
echo Installing packages...
npm install
echo.
echo Done. Now run STEP2_BUILD.bat
pause
