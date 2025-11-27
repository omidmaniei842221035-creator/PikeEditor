@echo off
echo Setting Electron mirrors...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
echo.
echo Compiling Electron...
npx tsc -p electron/tsconfig.json
node scripts/rename-to-cjs.cjs
echo.
echo Building exe file...
npx electron-builder --win --x64
echo.
echo Check release folder for exe file.
pause
