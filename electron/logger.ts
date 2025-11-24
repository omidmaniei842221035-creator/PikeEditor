import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let logFilePath: string | null = null;
let logStream: fs.WriteStream | null = null;

export function initLogger() {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Create log file with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  logFilePath = path.join(logsDir, `electron-${timestamp}.log`);
  
  console.log(`📝 Log file created at: ${logFilePath}`);
  
  // Create write stream
  logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  
  // Override console methods to also write to file
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [LOG] ${message}\n`;
    
    logStream?.write(logMessage);
    originalLog.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}\n`;
    
    logStream?.write(logMessage);
    originalError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WARN] ${message}\n`;
    
    logStream?.write(logMessage);
    originalWarn.apply(console, args);
  };
}

export function closeLogger() {
  if (logStream) {
    logStream.end();
    logStream = null;
  }
}

export function getLogFilePath(): string | null {
  return logFilePath;
}
