import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as pgSchema from "@shared/schema";
import * as sqliteSchema from "@shared/schema.sqlite";
import * as path from 'path';
import * as fs from 'fs';

// Import insert schemas from both schema files
import {
  insertCustomerSchema as pgInsertCustomerSchema,
  insertEmployeeSchema as pgInsertEmployeeSchema,
  insertBranchSchema as pgInsertBranchSchema,
  insertAlertSchema as pgInsertAlertSchema,
  insertPosDeviceSchema as pgInsertPosDeviceSchema,
  insertPosMonthlyStatsSchema as pgInsertPosMonthlyStatsSchema,
  insertVisitSchema as pgInsertVisitSchema,
  insertCustomerAccessLogSchema as pgInsertCustomerAccessLogSchema,
  insertBankingUnitSchema as pgInsertBankingUnitSchema,
  insertTerritorySchema as pgInsertTerritorySchema,
} from "@shared/schema";

import {
  insertCustomerSchema as sqliteInsertCustomerSchema,
  insertEmployeeSchema as sqliteInsertEmployeeSchema,
  insertBranchSchema as sqliteInsertBranchSchema,
  insertAlertSchema as sqliteInsertAlertSchema,
  insertPosDeviceSchema as sqliteInsertPosDeviceSchema,
  insertPosMonthlyStatsSchema as sqliteInsertPosMonthlyStatsSchema,
  insertVisitSchema as sqliteInsertVisitSchema,
  insertCustomerAccessLogSchema as sqliteInsertCustomerAccessLogSchema,
  insertBankingUnitSchema as sqliteInsertBankingUnitSchema,
  insertTerritorySchema as sqliteInsertTerritorySchema,
} from "@shared/schema.sqlite";

// Check if we're in Electron mode with SQLite
const isElectronMode = !!process.env.DATABASE_PATH;

let db: any;
let pool: Pool | null = null;
let sqlite: Database.Database | null = null;

// Schema object that will be used throughout the app
let schema: any;

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
  sqlite.pragma('journal_mode = WAL');
  
  // Initialize all tables if they don't exist
  try {
    sqlite.exec(`
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
        latitude TEXT,
        longitude TEXT,
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
        unit_type TEXT NOT NULL,
        manager_name TEXT,
        phone TEXT,
        address TEXT,
        latitude TEXT,
        longitude TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        national_id TEXT,
        shop_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        business_type TEXT NOT NULL,
        address TEXT,
        latitude TEXT,
        longitude TEXT,
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
        access_time INTEGER,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS territories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        geometry TEXT NOT NULL,
        bbox TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        color TEXT DEFAULT '#3b82f6',
        assigned_banking_unit_id TEXT REFERENCES banking_units(id),
        business_focus TEXT,
        auto_named INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        settings TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT,
        settings TEXT,
        credentials TEXT,
        is_default INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        uid TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        tags TEXT,
        panels TEXT,
        time_range TEXT,
        variables TEXT,
        version INTEGER DEFAULT 1,
        is_starred INTEGER DEFAULT 0,
        folder_id TEXT,
        created_by TEXT REFERENCES users(id),
        updated_by TEXT REFERENCES users(id),
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS dashboard_versions (
        id TEXT PRIMARY KEY,
        dashboard_id TEXT REFERENCES dashboards(id),
        version INTEGER NOT NULL,
        data TEXT NOT NULL,
        message TEXT,
        created_by TEXT REFERENCES users(id),
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        title TEXT NOT NULL,
        condition TEXT NOT NULL,
        data TEXT NOT NULL,
        interval_seconds INTEGER DEFAULT 60,
        max_data_points INTEGER DEFAULT 43200,
        no_data_state TEXT DEFAULT 'NoData',
        exec_err_state TEXT DEFAULT 'Alerting',
        for_duration TEXT DEFAULT '5m',
        annotations TEXT,
        labels TEXT,
        is_paused INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS ml_models (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        endpoint TEXT,
        version TEXT,
        metadata TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS ml_predictions (
        id TEXT PRIMARY KEY,
        model_id TEXT REFERENCES ml_models(id),
        input_data TEXT NOT NULL,
        prediction TEXT NOT NULL,
        confidence REAL,
        explanation TEXT,
        device_id TEXT REFERENCES pos_devices(id),
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        organization_id TEXT REFERENCES organizations(id),
        dashboard_id TEXT REFERENCES dashboards(id),
        name TEXT NOT NULL,
        format TEXT DEFAULT 'pdf',
        schedule TEXT,
        recipients TEXT,
        settings TEXT,
        is_enabled INTEGER DEFAULT 1,
        last_run INTEGER,
        next_run INTEGER,
        created_by TEXT REFERENCES users(id),
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS network_nodes (
        id TEXT PRIMARY KEY,
        node_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        label TEXT NOT NULL,
        value REAL DEFAULT 0,
        properties TEXT,
        x REAL,
        y REAL,
        "group" TEXT,
        color TEXT DEFAULT '#3b82f6',
        size INTEGER DEFAULT 10,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS network_edges (
        id TEXT PRIMARY KEY,
        source_node_id TEXT NOT NULL REFERENCES network_nodes(id),
        target_node_id TEXT NOT NULL REFERENCES network_nodes(id),
        edge_type TEXT NOT NULL,
        weight REAL DEFAULT 1,
        value REAL DEFAULT 0,
        properties TEXT,
        color TEXT DEFAULT '#64748b',
        width INTEGER DEFAULT 2,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);
    console.log('✅ SQLite database initialized with all 21 tables (Base + Grafana + Network)');
  } catch (err) {
    console.warn('SQLite initialization warning:', err);
  }
  
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
  schema = sqliteSchema;
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
  db = drizzleNeon({ client: pool, schema: pgSchema });
  schema = pgSchema;
}

// Export insert schemas based on runtime environment
export const insertCustomerSchema = isElectronMode ? sqliteInsertCustomerSchema : pgInsertCustomerSchema;
export const insertEmployeeSchema = isElectronMode ? sqliteInsertEmployeeSchema : pgInsertEmployeeSchema;
export const insertBranchSchema = isElectronMode ? sqliteInsertBranchSchema : pgInsertBranchSchema;
export const insertAlertSchema = isElectronMode ? sqliteInsertAlertSchema : pgInsertAlertSchema;
export const insertPosDeviceSchema = isElectronMode ? sqliteInsertPosDeviceSchema : pgInsertPosDeviceSchema;
export const insertPosMonthlyStatsSchema = isElectronMode ? sqliteInsertPosMonthlyStatsSchema : pgInsertPosMonthlyStatsSchema;
export const insertVisitSchema = isElectronMode ? sqliteInsertVisitSchema : pgInsertVisitSchema;
export const insertCustomerAccessLogSchema = isElectronMode ? sqliteInsertCustomerAccessLogSchema : pgInsertCustomerAccessLogSchema;
export const insertBankingUnitSchema = isElectronMode ? sqliteInsertBankingUnitSchema : pgInsertBankingUnitSchema;
export const insertTerritorySchema = isElectronMode ? sqliteInsertTerritorySchema : pgInsertTerritorySchema;

export { db, pool, sqlite, isElectronMode, schema };
