import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

// Helper for UUID generation
const uuid = () => sql`(lower(hex(randomblob(16))))`;

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const branches = sqliteTable("branches", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  manager: text("manager"),
  phone: text("phone"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  coverageRadius: integer("coverage_radius").default(5),
  monthlyTarget: integer("monthly_target").default(0),
  performance: integer("performance").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const employees = sqliteTable("employees", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  employeeCode: text("employee_code").notNull().unique(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  phone: text("phone"),
  email: text("email"),
  branchId: text("branch_id").references(() => branches.id),
  salary: integer("salary").default(0),
  hireDate: integer("hire_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  nationalId: text("national_id"),
  shopName: text("shop_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  businessType: text("business_type").notNull(),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  monthlyProfit: integer("monthly_profit").default(0),
  status: text("status").notNull().default("active"),
  branchId: text("branch_id").references(() => branches.id),
  bankingUnitId: text("banking_unit_id").references(() => bankingUnits.id),
  supportEmployeeId: text("support_employee_id").references(() => employees.id),
  installDate: integer("install_date", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const posDevices = sqliteTable("pos_devices", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  customerId: text("customer_id").references(() => customers.id),
  deviceCode: text("device_code").notNull().unique(),
  status: text("status").notNull().default("active"),
  lastConnection: integer("last_connection", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  posDeviceId: text("pos_device_id").references(() => posDevices.id),
  amount: integer("amount").notNull(),
  transactionDate: integer("transaction_date", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  priority: text("priority").notNull().default("medium"),
  isRead: integer("is_read", { mode: 'boolean' }).default(false),
  customerId: text("customer_id").references(() => customers.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const posMonthlyStats = sqliteTable("pos_monthly_stats", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  customerId: text("customer_id").references(() => customers.id),
  branchId: text("branch_id").references(() => branches.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalTransactions: integer("total_transactions").default(0),
  totalAmount: integer("total_amount").default(0),
  revenue: integer("revenue").default(0),
  profit: integer("profit").default(0),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const visits = sqliteTable("visits", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  customerId: text("customer_id").references(() => customers.id),
  employeeId: text("employee_id").references(() => employees.id),
  visitDate: integer("visit_date", { mode: 'timestamp' }).notNull(),
  notes: text("notes"),
  visitType: text("visit_type").notNull().default("routine"),
  duration: integer("duration"),
  result: text("result"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const customerAccessLogs = sqliteTable("customer_access_logs", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  customerId: text("customer_id").references(() => customers.id).notNull(),
  accessType: text("access_type").notNull().$type<'view_details' | 'add_visit'>(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  customerSummary: text("customer_summary"), // JSON as text
  employeeId: text("employee_id").references(() => employees.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const bankingUnits = sqliteTable("banking_units", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  bankId: text("bank_id"),
  branchId: text("branch_id").references(() => branches.id),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const territories = sqliteTable("territories", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  coordinates: text("coordinates").notNull(), // JSON as text
  color: text("color").notNull().default("#3b82f6"),
  assignedEmployeeId: text("assigned_employee_id").references(() => employees.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertPosDeviceSchema = createInsertSchema(posDevices).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertPosMonthlyStatsSchema = createInsertSchema(posMonthlyStats).omit({ id: true, createdAt: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, createdAt: true });
export const insertBankingUnitSchema = createInsertSchema(bankingUnits).omit({ id: true, createdAt: true });
export const insertTerritorySchema = createInsertSchema(territories).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertPosDevice = z.infer<typeof insertPosDeviceSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type InsertPosMonthlyStats = z.infer<typeof insertPosMonthlyStatsSchema>;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type InsertBankingUnit = z.infer<typeof insertBankingUnitSchema>;
export type InsertTerritory = z.infer<typeof insertTerritorySchema>;

export type User = typeof users.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type PosDevice = typeof posDevices.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type PosMonthlyStats = typeof posMonthlyStats.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type BankingUnit = typeof bankingUnits.$inferSelect;
export type Territory = typeof territories.$inferSelect;
