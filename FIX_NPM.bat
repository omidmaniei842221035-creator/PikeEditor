@echo off

echo.
echo ========================================
echo    NPM Configuration for Iran
echo ========================================
echo.

echo [1/5] Setting npm registry...
call npm config set registry https://registry.npmmirror.com
echo       OK

echo [2/5] Disabling SSL strict...
call npm config set strict-ssl false
echo       OK

echo [3/5] Setting timeouts...
call npm config set fetch-timeout 600000
call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
echo       OK

echo [4/5] Setting Electron mirrors...
setx ELECTRON_MIRROR "https://npmmirror.com/mirrors/electron/" >nul 2>&1
setx ELECTRON_BUILDER_BINARIES_MIRROR "https://npmmirror.com/mirrors/electron-builder-binaries/" >nul 2>&1
echo       OK (restart terminal after this)

echo [5/5] Clearing corrupted cache...
if exist "%LOCALAPPDATA%\electron\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron\Cache" 2>nul
    echo       electron cache cleared
)
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
    echo       electron-builder cache cleared
)
echo       OK

echo.
echo ========================================
echo    DONE!
echo.
echo    IMPORTANT: Close this terminal
echo    Open a NEW terminal
echo    Then run BUILD.bat
echo ========================================
echo.

pause
