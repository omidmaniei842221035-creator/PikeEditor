import express, { type Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Determine if we should use SQLite (standalone mode)
const isStandalone = !process.env.DATABASE_URL || process.env.USE_SQLITE === 'true';

// Set SQLite database path if standalone
if (isStandalone) {
  const appDataPath = path.join(
    os.platform() === 'win32' 
      ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
      : path.join(os.homedir(), '.config'),
    'POS-System'
  );
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
  }
  
  const dbPath = path.join(appDataPath, 'pos-system.db');
  process.env.DATABASE_PATH = dbPath;
  process.env.IS_ELECTRON = 'true'; // Trick db.ts to use SQLite
  
  console.log(`🖥️  Running in STANDALONE mode`);
  console.log(`💾 Using SQLite database at: ${dbPath}`);
} else {
  console.log(`🖥️  Running in WEB mode`);
  console.log('🐘 Using PostgreSQL database');
}

// Import database and storage after setting environment
const { DatabaseStorage } = await import('./storage.js');
const storage = new DatabaseStorage();

let registerRoutes: any;

console.log('✅ Database initialized');

// Import and register routes
const routesModule = await import('./routes.js');
registerRoutes = routesModule.registerRoutes;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
registerRoutes(app, storage);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    
    // Serve index.html for all routes (SPA)
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  Public directory not found. Frontend will not be served.');
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 POS Monitoring System - ${isStandalone ? 'Standalone' : 'Web'} Version`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`💾 Database: ${isStandalone ? 'SQLite (Local)' : 'PostgreSQL (Remote)'}`);
  console.log(`🔐 Default credentials: admin / admin123`);
  console.log(`${'='.repeat(50)}\n`);
});
