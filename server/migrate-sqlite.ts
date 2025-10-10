import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema.sqlite';
import * as path from 'path';

// SQLite schema creation
const createTables = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  manager TEXT,
  phone TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  coverage_radius INTEGER DEFAULT 5,
  monthly_target INTEGER DEFAULT 0,
  performance INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  branch_id TEXT REFERENCES branches(id),
  salary INTEGER DEFAULT 0,
  hire_date INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS banking_units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  bank_id TEXT,
  branch_id TEXT REFERENCES branches(id),
  latitude REAL,
  longitude REAL,
  address TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  national_id TEXT,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_type TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  monthly_profit INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  branch_id TEXT REFERENCES branches(id),
  banking_unit_id TEXT REFERENCES banking_units(id),
  support_employee_id TEXT REFERENCES employees(id),
  install_date INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS pos_devices (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  device_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_connection INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  pos_device_id TEXT REFERENCES pos_devices(id),
  amount INTEGER NOT NULL,
  transaction_date INTEGER,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read INTEGER DEFAULT 0,
  customer_id TEXT REFERENCES customers(id),
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS pos_monthly_stats (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  branch_id TEXT REFERENCES branches(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_transactions INTEGER DEFAULT 0,
  total_amount INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  profit INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  employee_id TEXT REFERENCES employees(id),
  visit_date INTEGER NOT NULL,
  notes TEXT,
  visit_type TEXT NOT NULL DEFAULT 'routine',
  duration INTEGER,
  result TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS customer_access_logs (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  access_type TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  customer_summary TEXT,
  employee_id TEXT REFERENCES employees(id),
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  assigned_employee_id TEXT REFERENCES employees(id),
  created_at INTEGER
);
`;

export function initializeSQLiteDatabase(dbPath: string) {
  console.log(`📦 Initializing SQLite database at: ${dbPath}`);
  
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  
  // Create all tables
  sqlite.exec(createTables);
  
  console.log('✅ SQLite database initialized successfully');
  
  return drizzle(sqlite, { schema });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'pos-system.db');
  initializeSQLiteDatabase(dbPath);
}
