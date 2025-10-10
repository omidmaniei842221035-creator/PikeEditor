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

// ======================
// GRAFANA ENTERPRISE SCHEMA
// ======================

// Organizations (for multi-tenancy)
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Data Sources
export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // prometheus, clickhouse, loki, postgresql, csv, json
  url: text("url"),
  settings: jsonb("settings").default({}),
  credentials: jsonb("credentials").default({}), // encrypted
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Dashboards
export const dashboards = pgTable("dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  uid: text("uid").notNull().unique(),
  title: text("title").notNull(),
  tags: jsonb("tags").default([]),
  panels: jsonb("panels").default([]),
  timeRange: jsonb("time_range").default({}),
  variables: jsonb("variables").default([]),
  version: integer("version").default(1),
  isStarred: boolean("is_starred").default(false),
  folderId: varchar("folder_id"),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Dashboard Versions (for versioning)
export const dashboardVersions = pgTable("dashboard_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dashboardId: varchar("dashboard_id").references(() => dashboards.id),
  version: integer("version").notNull(),
  data: jsonb("data").notNull(),
  message: text("message"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Alert Rules
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  condition: text("condition").notNull(),
  data: jsonb("data").notNull(),
  intervalSeconds: integer("interval_seconds").default(60),
  maxDataPoints: integer("max_data_points").default(43200),
  noDataState: text("no_data_state").default("NoData"),
  execErrState: text("exec_err_state").default("Alerting"),
  forDuration: text("for_duration").default("5m"),
  annotations: jsonb("annotations").default({}),
  labels: jsonb("labels").default({}),
  isPaused: boolean("is_paused").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ML Models
export const mlModels = pgTable("ml_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // anomaly_detection, forecasting, classification
  endpoint: text("endpoint"),
  version: text("version"),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ML Predictions
export const mlPredictions = pgTable("ml_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id").references(() => mlModels.id),
  inputData: jsonb("input_data").notNull(),
  prediction: jsonb("prediction").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  explanation: jsonb("explanation"), // SHAP values
  deviceId: varchar("device_id").references(() => posDevices.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id),
  dashboardId: varchar("dashboard_id").references(() => dashboards.id),
  name: text("name").notNull(),
  format: text("format").default("pdf"), // pdf, png, csv
  schedule: text("schedule"), // cron expression
  recipients: jsonb("recipients").default([]),
  settings: jsonb("settings").default({}),
  isEnabled: boolean("is_enabled").default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Create insert schemas for Grafana Enterprise
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertDataSourceSchema = createInsertSchema(dataSources);
export const insertDashboardSchema = createInsertSchema(dashboards);
export const insertDashboardVersionSchema = createInsertSchema(dashboardVersions);
export const insertAlertRuleSchema = createInsertSchema(alertRules);
export const insertMlModelSchema = createInsertSchema(mlModels);
export const insertMlPredictionSchema = createInsertSchema(mlPredictions);
export const insertReportSchema = createInsertSchema(reports);

// Create types for Grafana Enterprise
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;

export type DashboardVersion = typeof dashboardVersions.$inferSelect;
export type InsertDashboardVersion = z.infer<typeof insertDashboardVersionSchema>;

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;

export type MlModel = typeof mlModels.$inferSelect;
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;

export type MlPrediction = typeof mlPredictions.$inferSelect;
export type InsertMlPrediction = z.infer<typeof insertMlPredictionSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// ======================
// NETWORK ANALYSIS SCHEMA (Spider Web Visualization)
// ======================

// Network Nodes for spider web visualization
export const networkNodes = pgTable("network_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nodeType: varchar("node_type").notNull(), // 'business_type', 'banking_unit', 'customer', 'territory'
  entityId: varchar("entity_id").notNull(), // Reference to actual entity
  label: varchar("label").notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).default("0"), // Revenue, transaction count, etc.
  properties: jsonb("properties"), // Additional metadata
  x: decimal("x", { precision: 10, scale: 6 }),
  y: decimal("y", { precision: 10, scale: 6 }),
  group: varchar("group"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  size: integer("size").default(10),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Network Edges for spider web connections
export const networkEdges = pgTable("network_edges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceNodeId: varchar("source_node_id").notNull().references(() => networkNodes.id),
  targetNodeId: varchar("target_node_id").notNull().references(() => networkNodes.id),
  edgeType: varchar("edge_type").notNull(), // 'revenue_flow', 'business_relation', 'geographic_proximity', 'banking_connection'
  weight: decimal("weight", { precision: 10, scale: 4 }).default("1"), // Strength of relationship
  value: decimal("value", { precision: 15, scale: 2 }).default("0"), // Transaction volume, etc.
  properties: jsonb("properties"),
  color: varchar("color", { length: 7 }).default("#64748b"),
  width: integer("width").default(2),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Create insert schemas for Network Analysis
export const insertNetworkNodeSchema = createInsertSchema(networkNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNetworkEdgeSchema = createInsertSchema(networkEdges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Create types for Network Analysis
export type NetworkNode = typeof networkNodes.$inferSelect;
export type InsertNetworkNode = z.infer<typeof insertNetworkNodeSchema>;

export type NetworkEdge = typeof networkEdges.$inferSelect;
export type InsertNetworkEdge = z.infer<typeof insertNetworkEdgeSchema>;
