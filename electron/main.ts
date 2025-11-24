import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { initLogger, closeLogger, getLogFilePath } from './logger';

// Check if running in development mode
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const SERVER_PORT = 5000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'سامانه مانیتورینگ هوشمند پایانه‌های فروشگاهی',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  if (isDev) {
    console.log('Development mode: Server should be started manually with npm run dev');
    return;
  }

  const dbPath = path.join(app.getPath('userData'), 'pos-system.db');
  
  // In packaged app, electron-builder copies dist to resources/server via extraResources
  // Try primary path first, fallback to alternative if needed
  let serverPath = path.join(process.resourcesPath, 'server', 'index.js');
  
  // Fallback: check if server is in app path (for portable builds)
  const fs = require('fs');
  if (!fs.existsSync(serverPath)) {
    const altPath = path.join(app.getAppPath(), 'dist', 'index.js');
    if (fs.existsSync(altPath)) {
      serverPath = altPath;
      console.log('⚠️ Using fallback server path');
    } else {
      console.error('❌ CRITICAL ERROR: Server file not found at any expected location!');
      console.error(`   Primary path: ${serverPath}`);
      console.error(`   Fallback path: ${altPath}`);
      
      dialog.showErrorBox(
        'خطای بحرانی',
        `فایل سرور یافت نشد!\n\nلطفاً برنامه را دوباره نصب کنید.\n\nمسیر مورد انتظار:\n${serverPath}`
      );
      app.quit();
      return;
    }
  }
  
  console.log(`🚀 Starting POS Monitoring Server...`);
  console.log(`📂 App path: ${app.getAppPath()}`);
  console.log(`📂 Resources path: ${process.resourcesPath}`);
  console.log(`📂 User data path: ${app.getPath('userData')}`);
  console.log(`📂 SQLite database: ${dbPath}`);
  console.log(`📂 Server path: ${serverPath}`);
  
  // Use process.execPath (Electron's embedded Node.js) instead of external 'node'
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: SERVER_PORT.toString(),
      DATABASE_PATH: dbPath,
      ELECTRON_RUN_AS_NODE: '1'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Log server output for debugging
  serverProcess.stdout?.on('data', (data) => {
    console.log(`[SERVER] ${data.toString().trim()}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.toString().trim()}`);
  });

  serverProcess.on('error', (err) => {
    console.error('❌ CRITICAL: Failed to start server process:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
    
    // Show error dialog to user
    dialog.showErrorBox(
      'خطا در راه‌اندازی سرور',
      `سرور برنامه نتوانست راه‌اندازی شود.\n\nخطا: ${err.message}\n\nلطفاً فایل لاگ را بررسی کنید:\n${getLogFilePath() || 'Unknown'}`
    );
    
    // Exit the app if server fails to start
    setTimeout(() => {
      app.quit();
    }, 2000);
  });

  serverProcess.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Server process exited with code ${code}, signal: ${signal}`);
      
      // Show error to user if server crashes
      dialog.showErrorBox(
        'سرور متوقف شد',
        `سرور برنامه به طور غیرمنتظره متوقف شد.\n\nکد خطا: ${code}\nSignal: ${signal}\n\nبرنامه بسته خواهد شد.\n\nلطفاً فایل لاگ را بررسی کنید.`
      );
      
      setTimeout(() => {
        app.quit();
      }, 3000);
    } else {
      console.log(`✅ Server process exited cleanly`);
    }
  });
  
  console.log('✅ Server process spawned');
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.whenReady().then(() => {
  // Initialize file logger first
  initLogger();
  
  console.log('🎯 Electron app is ready');
  console.log(`📌 isDev: ${isDev}`);
  console.log(`📌 __dirname: ${__dirname}`);
  console.log(`📌 process.cwd(): ${process.cwd()}`);
  console.log(`📝 Log file: ${getLogFilePath()}`);
  
  startServer();
  
  // Give server more time to start in production
  const startupDelay = isDev ? 1000 : 5000;
  console.log(`⏱️  Waiting ${startupDelay}ms for server to start...`);
  
  setTimeout(() => {
    createWindow();
  }, startupDelay);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopServer();
  app.quit();
});

app.on('before-quit', () => {
  stopServer();
  closeLogger();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-log-path', () => {
  return getLogFilePath();
});

ipcMain.handle('show-logs', async () => {
  const logPath = getLogFilePath();
  if (logPath) {
    await dialog.showMessageBox({
      type: 'info',
      title: 'محل فایل لاگ',
      message: `فایل لاگ در این آدرس ذخیره شده است:\n\n${logPath}`,
      buttons: ['OK']
    });
  }
});
