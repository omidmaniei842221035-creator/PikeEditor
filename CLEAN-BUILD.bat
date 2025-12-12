@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   Clean Build - Removes all cache
echo ========================================
echo.

echo Cleaning electron-builder cache...
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul

echo Cleaning node_modules...
rmdir /s /q node_modules 2>nul

echo Cleaning dist folders...
rmdir /s /q dist-public 2>nul
rmdir /s /q dist-server 2>nul
rmdir /s /q dist-electron 2>nul
rmdir /s /q release 2>nul

echo.
echo ========================================
echo   Cache cleaned! Now run BUILD.bat
echo ========================================
echo.

pause
