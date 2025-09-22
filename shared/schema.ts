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
  nationalId: text("national_id"), // کد ملی
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
  bankingUnitId: varchar("banking_unit_id").references(() => bankingUnits.id), // ربط بالوحدة المصرفية
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

export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  visitDate: timestamp("visit_date").notNull(),
  notes: text("notes"),
  visitType: text("visit_type").notNull().default("routine"), // routine, support, installation, maintenance
  duration: integer("duration"), // مدت زمان ویزیت به دقیقه
  result: text("result"), // نتیجه ویزیت
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerAccessLogs = pgTable("customer_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  accessType: text("access_type").notNull().$type<'view_details' | 'add_visit'>(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  customerSummary: jsonb("customer_summary"), // خلاصه مشخصات مشتری
  accessTime: timestamp("access_time").defaultNow(),
});

// Banking Units - واحدهای بانکی
export const bankingUnits = pgTable("banking_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(), // کد واحد
  name: varchar("name", { length: 255 }).notNull(), // نام واحد
  unitType: text("unit_type").notNull().$type<'branch' | 'counter' | 'shahrbnet_kiosk'>(), // شعبه، باجه، پیشخوان شهرنت
  managerName: varchar("manager_name", { length: 255 }), // نام مسئول واحد
  phone: varchar("phone", { length: 20 }), // تلفن
  address: text("address"), // آدرس
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // عرض جغرافیایی
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // طول جغرافیایی
  isActive: boolean("is_active").default(true), // فعال/غیرفعال
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerAccessLogSchema = createInsertSchema(customerAccessLogs).omit({
  id: true,
  accessTime: true,
  ipAddress: true, // Server will set this
}).extend({
  accessType: z.enum(['view_details', 'add_visit']),
});

export const insertBankingUnitSchema = createInsertSchema(bankingUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  unitType: z.enum(['branch', 'counter', 'shahrbnet_kiosk']),
});

// Territories - مناطق جغرافیایی
export const territories = pgTable("territories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // نام منطقه
  color: varchar("color", { length: 7 }).notNull().default("#3b82f6"), // رنگ نمایش (hex)
  assignedBankingUnitId: varchar("assigned_banking_unit_id").references(() => bankingUnits.id), // واحد بانکی تخصیص یافته
  businessFocus: text("business_focus"), // نوع کسب‌وکار غالب
  autoNamed: boolean("auto_named").default(false), // آیا نام خودکار تولید شده است
  geometry: jsonb("geometry").notNull(), // GeoJSON Polygon or MultiPolygon
  bbox: jsonb("bbox").notNull(), // [minLng, minLat, maxLng, maxLat] for performance
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTerritorySchema = createInsertSchema(territories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;

export type CustomerAccessLog = typeof customerAccessLogs.$inferSelect;
export type InsertCustomerAccessLog = z.infer<typeof insertCustomerAccessLogSchema>;

export type BankingUnit = typeof bankingUnits.$inferSelect;
export type InsertBankingUnit = z.infer<typeof insertBankingUnitSchema>;

export type Territory = typeof territories.$inferSelect;
export type InsertTerritory = z.infer<typeof insertTerritorySchema>;
