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
  const dbVersionPath = path.join(app.getPath('userData'), '.db-version');
  const fs = require('fs');
  
  // Database version - increment this when schema changes require fresh database
  const CURRENT_DB_VERSION = '2.0.0';
  
  // Check if database needs reset (version mismatch or fresh install marker)
  let needsReset = false;
  try {
    if (fs.existsSync(dbVersionPath)) {
      const savedVersion = fs.readFileSync(dbVersionPath, 'utf8').trim();
      if (savedVersion !== CURRENT_DB_VERSION) {
        console.log(`📦 Database version mismatch: ${savedVersion} -> ${CURRENT_DB_VERSION}`);
        needsReset = true;
      }
    } else if (fs.existsSync(dbPath)) {
      // Old database without version file - needs reset
      console.log('📦 Old database detected without version marker');
      needsReset = true;
    }
  } catch (e) {
    console.log('📦 Could not read database version');
  }
  
  // Reset database if needed
  if (needsReset && fs.existsSync(dbPath)) {
    console.log('🔄 Resetting old database to apply fixes...');
    try {
      fs.unlinkSync(dbPath);
      console.log('✅ Old database removed');
    } catch (e) {
      console.error('⚠️ Could not remove old database:', e);
    }
  }
  
  // Save current database version
  try {
    fs.writeFileSync(dbVersionPath, CURRENT_DB_VERSION);
  } catch (e) {
    console.error('⚠️ Could not save database version:', e);
  }
  
  // Server is in resources/server/index.cjs (extraResources copies dist-server/ to server/)
  const serverPath = path.join(process.resourcesPath, 'server', 'index.cjs');
  
  console.log('🔍 Looking for server at:', serverPath);
  console.log('   Exists:', fs.existsSync(serverPath));
  
  if (!fs.existsSync(serverPath)) {
    // List what's actually in resources folder for debugging
    const resourcesDir = process.resourcesPath;
    let contents = 'Cannot read directory';
    try {
      contents = fs.readdirSync(resourcesDir).join(', ');
    } catch (e) {}
    
    console.error('❌ Server not found!');
    console.error('Resources path:', resourcesDir);
    console.error('Contents:', contents);
    
    dialog.showErrorBox(
      'خطای بحرانی',
      `فایل سرور یافت نشد!\n\nمسیر: ${serverPath}\n\nمحتویات resources:\n${contents}`
    );
    app.quit();
    return;
  }
  
  console.log(`🚀 Starting POS Monitoring Server...`);
  console.log(`📂 App path: ${app.getAppPath()}`);
  console.log(`📂 Resources path: ${process.resourcesPath}`);
  console.log(`📂 User data path: ${app.getPath('userData')}`);
  console.log(`📂 SQLite database: ${dbPath}`);
  console.log(`📂 Server path: ${serverPath}`);
  
  // Set up NODE_PATH so the server can find better-sqlite3 in resources
  const nodeModulesPath = path.join(process.resourcesPath, 'node_modules');
  const existingNodePath = process.env.NODE_PATH || '';
  const newNodePath = existingNodePath ? `${nodeModulesPath}${path.delimiter}${existingNodePath}` : nodeModulesPath;
  
  console.log('📦 NODE_PATH:', newNodePath);
  
  // Use process.execPath (Electron's embedded Node.js) instead of external 'node'
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: SERVER_PORT.toString(),
      DATABASE_PATH: dbPath,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_PATH: newNodePath
    },
    cwd: process.resourcesPath,
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

async function waitForServer(maxWaitMs: number = 60000): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 500;
  
  console.log(`⏳ Waiting for server to be ready (max ${maxWaitMs / 1000}s)...`);
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const http = require('http');
      const result = await new Promise<boolean>((resolve) => {
        const req = http.get(`http://127.0.0.1:${SERVER_PORT}/health`, (res: any) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.destroy();
          resolve(false);
        });
      });
      
      if (result) {
        console.log(`✅ Server is ready! (took ${Date.now() - startTime}ms)`);
        return true;
      }
    } catch {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  console.error(`❌ Server failed to start within ${maxWaitMs / 1000} seconds`);
  return false;
}

app.whenReady().then(async () => {
  // Initialize file logger first
  initLogger();
  
  console.log('🎯 Electron app is ready');
  console.log(`📌 isDev: ${isDev}`);
  console.log(`📌 __dirname: ${__dirname}`);
  console.log(`📌 process.cwd(): ${process.cwd()}`);
  console.log(`📝 Log file: ${getLogFilePath()}`);
  
  startServer();
  
  if (isDev) {
    // In dev mode, just wait a bit
    setTimeout(() => {
      createWindow();
    }, 1000);
  } else {
    // In production, wait for server to actually be ready
    const serverReady = await waitForServer(60000);
    
    if (serverReady) {
      createWindow();
    } else {
      dialog.showErrorBox(
        'خطا در راه‌اندازی',
        'سرور برنامه نتوانست در زمان مناسب راه‌اندازی شود.\n\nلطفاً برنامه را مجدداً اجرا کنید.'
      );
      app.quit();
    }
  }

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
