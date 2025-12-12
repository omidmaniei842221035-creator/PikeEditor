@echo off
chcp 65001 >nul 2>&1

echo.
echo ========================================
echo   Complete Clean - Remove All Caches
echo ========================================
echo.

echo Cleaning electron-builder cache...
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul

echo Cleaning npm cache...
call npm cache clean --force 2>nul

echo Cleaning node_modules...
rmdir /s /q "node_modules" 2>nul

echo Cleaning build folders...
rmdir /s /q "dist-public" 2>nul
rmdir /s /q "dist-server" 2>nul
rmdir /s /q "dist-electron" 2>nul
rmdir /s /q "release" 2>nul
rmdir /s /q "portable-app" 2>nul

echo.
echo ========================================
echo   All caches cleaned!
echo   
echo   Now run BUILD.bat
echo ========================================
echo.

pause
