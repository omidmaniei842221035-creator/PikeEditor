import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";
import * as path from 'path';
import * as fs from 'fs';

// Check if we're in Electron mode with SQLite
const isElectronMode = !!process.env.DATABASE_PATH;

let db: any;
let pool: Pool | null = null;
let sqlite: Database.Database | null = null;

if (isElectronMode) {
  // Electron mode: Use SQLite
  const dbPath = process.env.DATABASE_PATH!;
  const dbDir = path.dirname(dbPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log(`📦 Using SQLite database at: ${dbPath}`);
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better performance
  db = drizzleSQLite(sqlite, { schema });
} else {
  // Web mode: Use PostgreSQL
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  neonConfig.webSocketConstructor = ws;
  console.log('🐘 Using PostgreSQL database');
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { db, pool, sqlite };
