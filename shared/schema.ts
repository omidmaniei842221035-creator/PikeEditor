import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // شعبه، باجه، گیشه، پیشخوان
  manager: text("manager"),
  phone: text("phone"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  coverageRadius: integer("coverage_radius").default(5), // کیلومتر
  monthlyTarget: integer("monthly_target").default(0), // میلیون تومان
  performance: integer("performance").default(0), // درصد
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeCode: text("employee_code").notNull().unique(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  phone: text("phone"),
  email: text("email"),
  branchId: varchar("branch_id").references(() => branches.id),
  salary: integer("salary").default(0),
  hireDate: timestamp("hire_date").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopName: text("shop_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  businessType: text("business_type").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  monthlyProfit: integer("monthly_profit").default(0), // تومان
  status: text("status").notNull().default("active"), // active, normal, marketing, collected, loss
  branchId: varchar("branch_id").references(() => branches.id),
  supportEmployeeId: varchar("support_employee_id").references(() => employees.id),
  installDate: timestamp("install_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posDevices = pgTable("pos_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  deviceCode: text("device_code").notNull().unique(),
  status: text("status").notNull().default("active"), // active, offline, maintenance
  lastConnection: timestamp("last_connection"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  posDeviceId: varchar("pos_device_id").references(() => posDevices.id),
  amount: integer("amount").notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // error, warning, info
  priority: text("priority").notNull().default("medium"), // high, medium, low
  isRead: boolean("is_read").default(false),
  customerId: varchar("customer_id").references(() => customers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posMonthlyStats = pgTable("pos_monthly_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  branchId: varchar("branch_id").references(() => branches.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  totalTransactions: integer("total_transactions").default(0),
  totalAmount: integer("total_amount").default(0), // تومان
  revenue: integer("revenue").default(0), // درآمد
  profit: integer("profit").default(0), // سود
  status: text("status").notNull().default("active"), // active, normal, marketing, collected, loss
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBranchSchema = createInsertSchema(branches).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertPosDeviceSchema = createInsertSchema(posDevices).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertPosMonthlyStatsSchema = createInsertSchema(posMonthlyStats).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type PosDevice = typeof posDevices.$inferSelect;
export type InsertPosDevice = z.infer<typeof insertPosDeviceSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type PosMonthlyStats = typeof posMonthlyStats.$inferSelect;
export type InsertPosMonthlyStats = z.infer<typeof insertPosMonthlyStatsSchema>;
