@echo off
chcp 65001 >nul 2>&1

echo.
echo ============================================
echo    POS Monitoring - Build WITHOUT Signing
echo ============================================
echo.

REM Disable code signing completely
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=
set WIN_CSC_LINK=

REM Clear corrupted cache
echo Clearing old cache...
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" 2>nul
echo Done.
echo.

REM NPM config for Iran
echo Setting npm config...
npm config set registry https://registry.npmmirror.com
npm config set strict-ssl false
echo Done.
echo.

REM Electron mirrors
echo Setting mirrors...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo Done.
echo.

REM Install
echo Installing packages...
call npm install
echo.

REM Compile
echo Compiling Electron...
call npx tsc -p electron/tsconfig.json
call node scripts/rename-to-cjs.cjs
echo.

REM Build
echo Building exe (this takes 5-10 minutes)...
call npx electron-builder --win --x64 -c.win.signAndEditExecutable=false
echo.

if exist "release\*.exe" (
    echo ============================================
    echo    SUCCESS! Check release folder
    echo ============================================
    explorer release
) else (
    echo ============================================
    echo    Build finished. Check release folder.
    echo ============================================
)

pause
