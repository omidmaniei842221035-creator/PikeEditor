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
  latitude: text("latitude"), // Changed from real to text to match PG decimal→string
  longitude: text("longitude"), // Changed from real to text to match PG decimal→string
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
  latitude: text("latitude"), // Changed from real to text to match PG decimal→string
  longitude: text("longitude"), // Changed from real to text to match PG decimal→string
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
  customerSummary: text("customer_summary"), // JSON as text (matches PG jsonb)
  accessTime: integer("access_time", { mode: 'timestamp' }).$defaultFn(() => new Date()), // Added to match PG
});

export const bankingUnits = sqliteTable("banking_units", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unitType: text("unit_type").notNull().$type<'branch' | 'counter' | 'shahrbnet_kiosk'>(), // Matches PG field name
  managerName: text("manager_name"), // Matches PG
  phone: text("phone"),
  address: text("address"),
  latitude: text("latitude"), // Changed from real to text to match PG decimal→string
  longitude: text("longitude"), // Changed from real to text to match PG decimal→string
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const territories = sqliteTable("territories", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  geometry: text("geometry").notNull(), // JSON as text (matches PG jsonb)
  bbox: text("bbox").notNull(), // JSON as text (matches PG jsonb)
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  color: text("color").default("#3b82f6"),
  assignedBankingUnitId: text("assigned_banking_unit_id").references(() => bankingUnits.id), // Matches PG
  businessFocus: text("business_focus"),
  autoNamed: integer("auto_named", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// ======================
// GRAFANA ENTERPRISE SCHEMA
// ======================

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: text("settings"), // JSON as text
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  organizationId: text("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  settings: text("settings"), // JSON as text
  credentials: text("credentials"), // JSON as text (encrypted)
  isDefault: integer("is_default", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const dashboards = sqliteTable("dashboards", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  organizationId: text("organization_id").references(() => organizations.id),
  uid: text("uid").notNull().unique(),
  title: text("title").notNull(),
  tags: text("tags"), // JSON as text
  panels: text("panels"), // JSON as text
  timeRange: text("time_range"), // JSON as text
  variables: text("variables"), // JSON as text
  version: integer("version").default(1),
  isStarred: integer("is_starred", { mode: 'boolean' }).default(false),
  folderId: text("folder_id"),
  createdBy: text("created_by").references(() => users.id),
  updatedBy: text("updated_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const dashboardVersions = sqliteTable("dashboard_versions", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  dashboardId: text("dashboard_id").references(() => dashboards.id),
  version: integer("version").notNull(),
  data: text("data").notNull(), // JSON as text
  message: text("message"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const alertRules = sqliteTable("alert_rules", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  organizationId: text("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  condition: text("condition").notNull(),
  data: text("data").notNull(), // JSON as text
  intervalSeconds: integer("interval_seconds").default(60),
  maxDataPoints: integer("max_data_points").default(43200),
  noDataState: text("no_data_state").default("NoData"),
  execErrState: text("exec_err_state").default("Alerting"),
  forDuration: text("for_duration").default("5m"),
  annotations: text("annotations"), // JSON as text
  labels: text("labels"), // JSON as text
  isPaused: integer("is_paused", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const mlModels = sqliteTable("ml_models", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  organizationId: text("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  endpoint: text("endpoint"),
  version: text("version"),
  metadata: text("metadata"), // JSON as text
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const mlPredictions = sqliteTable("ml_predictions", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  modelId: text("model_id").references(() => mlModels.id),
  inputData: text("input_data").notNull(), // JSON as text
  prediction: text("prediction").notNull(), // JSON as text
  confidence: real("confidence"),
  explanation: text("explanation"), // JSON as text (SHAP values)
  deviceId: text("device_id").references(() => posDevices.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  organizationId: text("organization_id").references(() => organizations.id),
  dashboardId: text("dashboard_id").references(() => dashboards.id),
  name: text("name").notNull(),
  format: text("format").default("pdf"),
  schedule: text("schedule"),
  recipients: text("recipients"), // JSON as text
  settings: text("settings"), // JSON as text
  isEnabled: integer("is_enabled", { mode: 'boolean' }).default(true),
  lastRun: integer("last_run", { mode: 'timestamp' }),
  nextRun: integer("next_run", { mode: 'timestamp' }),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// ======================
// NETWORK ANALYSIS SCHEMA
// ======================

export const networkNodes = sqliteTable("network_nodes", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  nodeType: text("node_type").notNull(),
  entityId: text("entity_id").notNull(),
  label: text("label").notNull(),
  value: real("value").default(0),
  properties: text("properties"), // JSON as text
  x: real("x"),
  y: real("y"),
  group: text("group"),
  color: text("color").default("#3b82f6"),
  size: integer("size").default(10),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const networkEdges = sqliteTable("network_edges", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  sourceNodeId: text("source_node_id").notNull().references(() => networkNodes.id),
  targetNodeId: text("target_node_id").notNull().references(() => networkNodes.id),
  edgeType: text("edge_type").notNull(),
  weight: real("weight").default(1),
  value: real("value").default(0),
  properties: text("properties"), // JSON as text
  color: text("color").default("#64748b"),
  width: integer("width").default(2),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true, createdAt: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true }).extend({
  shopName: z.string().min(2, "نام فروشگاه باید حداقل ۲ کاراکتر باشد"),
  ownerName: z.string().min(2, "نام مالک باید حداقل ۲ کاراکتر باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره تلفن باید ۱۱ رقم و با 09 شروع شود"),
  businessType: z.string().min(1, "نوع کسب‌وکار باید انتخاب شود"),
});
export const insertPosDeviceSchema = createInsertSchema(posDevices).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export const insertPosMonthlyStatsSchema = createInsertSchema(posMonthlyStats).omit({ id: true, createdAt: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, createdAt: true });
export const insertCustomerAccessLogSchema = createInsertSchema(customerAccessLogs).omit({ id: true, accessTime: true }).extend({
  accessType: z.enum(['view_details', 'add_visit'])
});
export const insertBankingUnitSchema = createInsertSchema(bankingUnits).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  unitType: z.enum(['branch', 'counter', 'shahrbnet_kiosk'])
});
export const insertTerritorySchema = createInsertSchema(territories).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  color: z.string().optional()
});

// Grafana Enterprise insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDataSourceSchema = createInsertSchema(dataSources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDashboardSchema = createInsertSchema(dashboards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDashboardVersionSchema = createInsertSchema(dashboardVersions).omit({ id: true, createdAt: true });
export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMlModelSchema = createInsertSchema(mlModels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMlPredictionSchema = createInsertSchema(mlPredictions).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, updatedAt: true });

// Network Analysis insert schemas
export const insertNetworkNodeSchema = createInsertSchema(networkNodes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNetworkEdgeSchema = createInsertSchema(networkEdges).omit({ id: true, createdAt: true, updatedAt: true });

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
export type InsertCustomerAccessLog = z.infer<typeof insertCustomerAccessLogSchema>;
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

// Grafana Enterprise types
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

// Network Analysis types
export type NetworkNode = typeof networkNodes.$inferSelect;
export type InsertNetworkNode = z.infer<typeof insertNetworkNodeSchema>;

export type NetworkEdge = typeof networkEdges.$inferSelect;
export type InsertNetworkEdge = z.infer<typeof insertNetworkEdgeSchema>;
