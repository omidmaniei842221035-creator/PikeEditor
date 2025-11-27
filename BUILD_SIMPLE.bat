@echo off
chcp 65001 >nul 2>&1

echo.
echo ============================================
echo    POS Monitoring System - Simple Build
echo ============================================
echo.

echo Step 1: npm config...
npm config set registry https://registry.npmmirror.com
npm config set strict-ssl false
echo Done.
echo.

echo Step 2: Set mirrors...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo Done.
echo.

echo Step 3: npm install...
npm install
echo.

echo Step 4: Compile Electron...
npx tsc -p electron/tsconfig.json
node scripts/rename-to-cjs.cjs
echo.

echo Step 5: Build exe...
npx electron-builder --win --x64
echo.

echo ============================================
echo    Build finished. Check release folder.
echo ============================================
pause
