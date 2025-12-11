import { build } from 'esbuild';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔨 Building Desktop Version...\n');

// Step 1: Build Frontend with Vite
console.log('📦 Step 1/4: Building frontend with Vite...');
try {
  await fs.rm('dist-desktop', { recursive: true, force: true });
  await fs.mkdir('dist-desktop', { recursive: true });
  await execAsync('npx vite build', { cwd: process.cwd() });
  await fs.cp('client/dist-public', 'dist-desktop/public', { recursive: true });
  console.log('✅ Frontend built successfully\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Build Backend Server
console.log('📦 Step 2/4: Building backend server...');
try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist-desktop/server.cjs',
    format: 'cjs',
    external: [
      'better-sqlite3',
      '@neondatabase/serverless',
      'ws',
      'lightningcss',
      '@babel/*',
      'vite',
      '../vite.config'
    ],
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.USE_SQLITE': '"true"'
    }
  });
  console.log('✅ Backend built successfully\n');
} catch (error) {
  console.error('❌ Backend build failed:', error);
  process.exit(1);
}

// Step 3: Create package.json for desktop
console.log('📦 Step 3/4: Creating package files...');
try {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  const productionPkg = {
    name: 'pos-monitoring-desktop',
    version: pkg.version,
    description: 'سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی - نسخه دسکتاپ',
    main: 'server.cjs',
    scripts: {
      start: 'node server.cjs'
    },
    dependencies: {
      'better-sqlite3': pkg.dependencies['better-sqlite3'],
      'express': pkg.dependencies['express'],
      'ws': pkg.dependencies['ws'],
      'drizzle-orm': pkg.dependencies['drizzle-orm'],
      'express-session': pkg.dependencies['express-session'],
      'memorystore': pkg.dependencies['memorystore']
    }
  };
  await fs.writeFile('dist-desktop/package.json', JSON.stringify(productionPkg, null, 2));
  console.log('✅ Package files created\n');
} catch (error) {
  console.error('❌ Package creation failed:', error.message);
  process.exit(1);
}

// Step 4: Create startup scripts
console.log('📦 Step 4/4: Creating startup scripts...');

const batchContent = `@echo off
chcp 65001 >nul
echo ========================================
echo   سامانه مانیتورینگ POS - نسخه دسکتاپ
echo   POS Monitoring System - Desktop
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js یافت نشد!
    echo ❌ Node.js not found!
    echo.
    echo لطفاً Node.js را از nodejs.org نصب کنید
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist node_modules\\better-sqlite3 (
    echo 📦 نصب وابستگی‌ها...
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ نصب با خطا مواجه شد!
        echo ❌ Installation failed!
        pause
        exit /b 1
    )
)

echo.
echo ✅ شروع سرور...
echo ✅ Starting server...
echo.
echo 📍 آدرس: http://localhost:5000
echo 📍 Address: http://localhost:5000
echo.
echo 🔐 نام کاربری / Username: admin
echo 🔐 رمز عبور / Password: admin123
echo.
echo ⚠️  برای توقف سرور Ctrl+C بزنید
echo ⚠️  Press Ctrl+C to stop the server
echo.

set NODE_ENV=production
set USE_SQLITE=true
set PORT=5000
start http://localhost:5000
node server.cjs

pause
`;

const shellContent = `#!/bin/bash
echo "========================================"
echo "  سامانه مانیتورینگ POS - نسخه دسکتاپ"
echo "  POS Monitoring System - Desktop"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    echo "Please install Node.js from nodejs.org"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules/better-sqlite3" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Installation failed!"
        exit 1
    fi
fi

echo ""
echo "✅ Starting server..."
echo ""
echo "📍 Address: http://localhost:5000"
echo ""
echo "🔐 Username: admin"
echo "🔐 Password: admin123"
echo ""
echo "⚠️  Press Ctrl+C to stop the server"
echo ""

export NODE_ENV=production
export USE_SQLITE=true
export PORT=5000

# Open browser (works on most Linux/Mac)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5000 &
elif command -v open &> /dev/null; then
    open http://localhost:5000 &
fi

node server.cjs
`;

try {
  await fs.writeFile('dist-desktop/Start-POS.bat', batchContent);
  await fs.writeFile('dist-desktop/start-pos.sh', shellContent);
  
  try {
    await fs.chmod('dist-desktop/start-pos.sh', 0o755);
  } catch (e) {}
  
  const readmeContent = `# سامانه مانیتورینگ POS - نسخه دسکتاپ
# POS Monitoring System - Desktop Version

## نصب و راه‌اندازی / Installation

### پیش‌نیاز / Prerequisites
- Node.js 18 یا بالاتر از [nodejs.org](https://nodejs.org/)

### Windows
1. فایل \`Start-POS.bat\` را دوبار کلیک کنید
2. مرورگر به صورت خودکار باز می‌شود: http://localhost:5000

### Linux/Mac
\`\`\`bash
chmod +x start-pos.sh
./start-pos.sh
\`\`\`

## اطلاعات ورود / Login
- نام کاربری / Username: admin
- رمز عبور / Password: admin123

⚠️ حتماً پس از ورود رمز را تغییر دهید!

## ویژگی‌های نسخه دسکتاپ / Desktop Features
- ✅ دیتابیس محلی SQLite (بدون نیاز به اینترنت)
- ✅ مدیریت مشتریان با انتخاب موقعیت روی نقشه
- ✅ مدیریت واحدهای بانکی با انتخاب موقعیت روی نقشه
- ✅ ورود گروهی از اکسل
- ✅ تحلیل هوشمند و نقشه مانیتورینگ
- ✅ پشتیبان‌گیری و بازیابی دیتابیس

## دیتابیس / Database
دیتابیس SQLite در کنار برنامه ذخیره می‌شود: \`pos-system.db\`

## توقف سرور / Stop Server
در ترمینال دکمه \`Ctrl + C\` را بزنید.
`;
  
  await fs.writeFile('dist-desktop/README.md', readmeContent);
  
  console.log('✅ Startup scripts created\n');
} catch (error) {
  console.error('❌ Script creation failed:', error.message);
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════');
console.log('🎉 Build complete!');
console.log('═══════════════════════════════════════════════════════════');
console.log('\n📁 Output directory: dist-desktop/');
console.log('\n📝 How to use:');
console.log('   1. Copy the "dist-desktop" folder to your PC');
console.log('   2. Run Start-POS.bat (Windows) or ./start-pos.sh (Linux/Mac)');
console.log('   3. Browser opens automatically at http://localhost:5000');
console.log('\n💡 Tip: You can ZIP the dist-desktop folder and share it!');
console.log('═══════════════════════════════════════════════════════════\n');
