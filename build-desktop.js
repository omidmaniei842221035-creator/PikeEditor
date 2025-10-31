import { build } from 'esbuild';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔨 Building Desktop Version...\n');

// Step 1: Build Frontend
console.log('📦 Step 1/4: Building frontend...');
try {
  await execAsync('npm run build:frontend');
  console.log('✅ Frontend built successfully\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Build Backend
console.log('📦 Step 2/4: Building backend...');
try {
  await build({
    entryPoints: ['server/index.standalone.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist-desktop/server.js',
    format: 'esm',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    external: [
      'better-sqlite3',
      '@neondatabase/serverless',
      'drizzle-orm',
      'lightningcss',
      '@babel/*'
    ],
  });
  console.log('✅ Backend built successfully\n');
} catch (error) {
  console.error('❌ Backend build failed:', error);
  process.exit(1);
}

// Step 3: Copy necessary files
console.log('📦 Step 3/4: Copying files...');
try {
  // Copy frontend build
  await fs.cp('dist/public', 'dist-desktop/public', { recursive: true });
  
  // Copy package.json with all required production dependencies
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  const productionPkg = {
    name: pkg.name,
    version: pkg.version,
    type: 'module',
    dependencies: {
      'better-sqlite3': pkg.dependencies['better-sqlite3'],
      'express': pkg.dependencies['express'],
      'ws': pkg.dependencies['ws'],
      'drizzle-orm': pkg.dependencies['drizzle-orm'],
    }
  };
  await fs.writeFile('dist-desktop/package.json', JSON.stringify(productionPkg, null, 2));
  
  console.log('✅ Files copied successfully\n');
} catch (error) {
  console.error('❌ Copy failed:', error.message);
  process.exit(1);
}

// Step 4: Create startup scripts
console.log('📦 Step 4/4: Creating startup scripts...');

// Windows batch file
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
node server.js

pause
`;

// Linux/Mac shell script
const shellContent = `#!/bin/bash
echo "========================================"
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
node server.js
`;

try {
  await fs.writeFile('dist-desktop/Start-POS.bat', batchContent);
  await fs.writeFile('dist-desktop/start-pos.sh', shellContent);
  
  // Make shell script executable
  try {
    await fs.chmod('dist-desktop/start-pos.sh', 0o755);
  } catch (e) {
    // Ignore chmod errors on Windows
  }
  
  // Create README
  const readmeContent = `# سامانه مانیتورینگ POS - نسخه دسکتاپ

## نصب و راه‌اندازی

### پیش‌نیاز
- Node.js 18 یا بالاتر از [nodejs.org](https://nodejs.org/)

### Windows
1. فایل \`Start-POS.bat\` را اجرا کنید
2. مرورگر را باز کنید: http://localhost:5000

### Linux/Mac
1. اجازه اجرا بدهید: \`chmod +x start-pos.sh\`
2. اجرا کنید: \`./start-pos.sh\`
3. مرورگر را باز کنید: http://localhost:5000

## اطلاعات ورود
- نام کاربری: admin
- رمز عبور: admin123

⚠️ حتماً پس از ورود رمز را تغییر دهید!

## دیتابیس
دیتابیس SQLite در مسیر زیر ذخیره می‌شود:
- Windows: \`C:\\Users\\[YourName]\\AppData\\Roaming\\POS-System\\pos-system.db\`
- Linux/Mac: \`~/.config/POS-System/pos-system.db\`

## توقف سرور
در ترمینال یا Command Prompt دکمه \`Ctrl + C\` را بزنید.
`;
  
  await fs.writeFile('dist-desktop/README.md', readmeContent);
  
  console.log('✅ Startup scripts created\n');
} catch (error) {
  console.error('❌ Script creation failed:', error.message);
  process.exit(1);
}

console.log('🎉 Build complete!');
console.log('\n📁 Output directory: dist-desktop/');
console.log('\n📝 Next steps:');
console.log('   1. cd dist-desktop');
console.log('   2. Run Start-POS.bat (Windows) or ./start-pos.sh (Linux/Mac)');
console.log('   3. Open http://localhost:5000');
console.log('\n💡 Tip: You can ZIP the dist-desktop folder and share it!');
