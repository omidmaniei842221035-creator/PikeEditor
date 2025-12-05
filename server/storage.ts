import { 
  type User, type InsertUser,
  type Branch, type InsertBranch,
  type Employee, type InsertEmployee,
  type Customer, type InsertCustomer,
  type PosDevice, type InsertPosDevice,
  type Transaction, type InsertTransaction,
  type Alert, type InsertAlert,
  type PosMonthlyStats, type InsertPosMonthlyStats,
  type Visit, type InsertVisit,
  type CustomerAccessLog, type InsertCustomerAccessLog,
  type BankingUnit, type InsertBankingUnit,
  type Territory, type InsertTerritory,
  // Grafana Enterprise Types
  type Organization, type InsertOrganization,
  type DataSource, type InsertDataSource,
  type Dashboard, type InsertDashboard,
  type DashboardVersion, type InsertDashboardVersion,
  type AlertRule, type InsertAlertRule,
  type MlModel, type InsertMlModel,
  type MlPrediction, type InsertMlPrediction,
  type Report, type InsertReport,
  // Network Analysis Types
  type NetworkNode, type InsertNetworkNode,
  type NetworkEdge, type InsertNetworkEdge
} from "@shared/schema";
import { db, schema } from "./db";

// Get tables from the active schema (PostgreSQL or SQLite)
const {
  users, branches, employees, customers, posDevices, transactions, alerts, posMonthlyStats, visits, customerAccessLogs, bankingUnits, territories,
  organizations, dataSources, dashboards, dashboardVersions, alertRules, mlModels, mlPredictions, reports,
  networkNodes, networkEdges
} = schema;
import { eq, and, gte, lte, like, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Branches
  getAllBranches(): Promise<Branch[]>;
  getBranch(id: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: string): Promise<boolean>;
  bulkCreateBranches(branches: InsertBranch[]): Promise<Branch[]>;

  // Employees
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeesByBranch(branchId: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  bulkCreateEmployees(employees: InsertEmployee[]): Promise<Employee[]>;

  // Customers
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByBranch(branchId: string): Promise<Customer[]>;
  getCustomersByStatus(status: string): Promise<Customer[]>;
  getCustomersByBusinessType(businessType: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  searchCustomers(query: string): Promise<Customer[]>;

  // POS Devices
  getAllPosDevices(): Promise<PosDevice[]>;
  getPosDevice(id: string): Promise<PosDevice | undefined>;
  getPosDevicesByCustomer(customerId: string): Promise<PosDevice[]>;
  getPosDevicesByBankingUnit(bankingUnitId: string): Promise<PosDevice[]>;
  createPosDevice(device: InsertPosDevice): Promise<PosDevice>;
  updatePosDevice(id: string, device: Partial<InsertPosDevice>): Promise<PosDevice | undefined>;
  deletePosDevice(id: string): Promise<boolean>;

  // Transactions
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByDevice(deviceId: string): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Alerts
  getAllAlerts(): Promise<Alert[]>;
  getUnreadAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<boolean>;

  // POS Monthly Stats
  getAllPosMonthlyStats(): Promise<PosMonthlyStats[]>;
  getPosMonthlyStats(id: string): Promise<PosMonthlyStats | undefined>;
  getPosMonthlyStatsByCustomer(customerId: string): Promise<PosMonthlyStats[]>;
  getPosMonthlyStatsByBranch(branchId: string): Promise<PosMonthlyStats[]>;
  getPosMonthlyStatsByDateRange(year: number, startMonth: number, endMonth: number): Promise<PosMonthlyStats[]>;
  createPosMonthlyStats(stats: InsertPosMonthlyStats): Promise<PosMonthlyStats>;
  updatePosMonthlyStats(id: string, stats: Partial<InsertPosMonthlyStats>): Promise<PosMonthlyStats | undefined>;
  deletePosMonthlyStats(id: string): Promise<boolean>;
  bulkCreatePosMonthlyStats(stats: InsertPosMonthlyStats[]): Promise<PosMonthlyStats[]>;

  // Visits
  getAllVisits(): Promise<Visit[]>;
  getVisit(id: string): Promise<Visit | undefined>;
  getVisitsByCustomer(customerId: string): Promise<Visit[]>;
  getVisitsByEmployee(employeeId: string): Promise<Visit[]>;
  getVisitsByDateRange(startDate: Date, endDate: Date): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: string, visit: Partial<InsertVisit>): Promise<Visit | undefined>;
  deleteVisit(id: string): Promise<boolean>;

  // Customer Access Logs
  getAllCustomerAccessLogs(): Promise<CustomerAccessLog[]>;
  getCustomerAccessLogsByCustomer(customerId: string): Promise<CustomerAccessLog[]>;
  createCustomerAccessLog(log: InsertCustomerAccessLog): Promise<CustomerAccessLog>;

  // Banking Units
  getAllBankingUnits(): Promise<BankingUnit[]>;
  getBankingUnit(id: string): Promise<BankingUnit | undefined>;
  getBankingUnitByCode(code: string): Promise<BankingUnit | undefined>;
  createBankingUnit(unit: InsertBankingUnit): Promise<BankingUnit>;
  updateBankingUnit(id: string, unit: Partial<InsertBankingUnit>): Promise<BankingUnit | undefined>;
  deleteBankingUnit(id: string): Promise<boolean>;
  bulkCreateBankingUnits(units: InsertBankingUnit[]): Promise<BankingUnit[]>;
  bulkUpdateBankingUnits(updates: Array<{ id: string; data: Partial<InsertBankingUnit> }>): Promise<BankingUnit[]>;

  // Territories
  getAllTerritories(): Promise<Territory[]>;
  getTerritory(id: string): Promise<Territory | undefined>;
  getTerritoryByName(name: string): Promise<Territory | undefined>;
  getTerritoriesByBankingUnit(bankingUnitId: string): Promise<Territory[]>;
  createTerritory(territory: InsertTerritory): Promise<Territory>;
  updateTerritory(id: string, territory: Partial<InsertTerritory>): Promise<Territory | undefined>;
  deleteTerritory(id: string): Promise<boolean>;
  assignTerritoryToBankingUnit(territoryId: string, bankingUnitId: string | null): Promise<Territory | undefined>;

  // ======================
  // GRAFANA ENTERPRISE METHODS
  // ======================

  // Organizations
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: string): Promise<boolean>;

  // Data Sources
  getAllDataSources(): Promise<DataSource[]>;
  getDataSource(id: string): Promise<DataSource | undefined>;
  getDataSourcesByOrganization(orgId: string): Promise<DataSource[]>;
  getDefaultDataSource(orgId: string): Promise<DataSource | undefined>;
  createDataSource(ds: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, ds: Partial<InsertDataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: string): Promise<boolean>;

  // Dashboards
  getAllDashboards(): Promise<Dashboard[]>;
  getDashboard(id: string): Promise<Dashboard | undefined>;
  getDashboardByUid(uid: string): Promise<Dashboard | undefined>;
  getDashboardsByOrganization(orgId: string): Promise<Dashboard[]>;
  getDashboardsByFolder(folderId: string): Promise<Dashboard[]>;
  getStarredDashboards(userId: string): Promise<Dashboard[]>;
  createDashboard(dashboard: InsertDashboard): Promise<Dashboard>;
  updateDashboard(id: string, dashboard: Partial<InsertDashboard>): Promise<Dashboard | undefined>;
  deleteDashboard(id: string): Promise<boolean>;
  starDashboard(dashboardId: string, isStarred: boolean): Promise<Dashboard | undefined>;
  searchDashboards(query: string, orgId: string): Promise<Dashboard[]>;

  // Dashboard Versions
  getDashboardVersions(dashboardId: string): Promise<DashboardVersion[]>;
  getDashboardVersion(dashboardId: string, version: number): Promise<DashboardVersion | undefined>;
  createDashboardVersion(version: InsertDashboardVersion): Promise<DashboardVersion>;

  // Alert Rules
  getAllAlertRules(): Promise<AlertRule[]>;
  getAlertRule(id: string): Promise<AlertRule | undefined>;
  getAlertRulesByOrganization(orgId: string): Promise<AlertRule[]>;
  createAlertRule(rule: InsertAlertRule): Promise<AlertRule>;
  updateAlertRule(id: string, rule: Partial<InsertAlertRule>): Promise<AlertRule | undefined>;
  deleteAlertRule(id: string): Promise<boolean>;
  pauseAlertRule(id: string, isPaused: boolean): Promise<AlertRule | undefined>;

  // ML Models
  getAllMlModels(): Promise<MlModel[]>;
  getMlModel(id: string): Promise<MlModel | undefined>;
  getMlModelsByOrganization(orgId: string): Promise<MlModel[]>;
  getMlModelsByType(type: string): Promise<MlModel[]>;
  createMlModel(model: InsertMlModel): Promise<MlModel>;
  updateMlModel(id: string, model: Partial<InsertMlModel>): Promise<MlModel | undefined>;
  deleteMlModel(id: string): Promise<boolean>;
  activateMlModel(id: string, isActive: boolean): Promise<MlModel | undefined>;

  // ML Predictions
  getAllMlPredictions(): Promise<MlPrediction[]>;
  getMlPrediction(id: string): Promise<MlPrediction | undefined>;
  getMlPredictionsByModel(modelId: string): Promise<MlPrediction[]>;
  getMlPredictionsByDevice(deviceId: string): Promise<MlPrediction[]>;
  createMlPrediction(prediction: InsertMlPrediction): Promise<MlPrediction>;
  
  // Reports
  getAllReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  getReportsByOrganization(orgId: string): Promise<Report[]>;
  getReportsByDashboard(dashboardId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: string): Promise<boolean>;
  enableReport(id: string, isEnabled: boolean): Promise<Report | undefined>;

  // ======================
  // NETWORK ANALYSIS METHODS (Spider Web Visualization)
  // ======================

  // Network Nodes
  getAllNetworkNodes(): Promise<NetworkNode[]>;
  getNetworkNode(id: string): Promise<NetworkNode | undefined>;
  getNetworkNodesByType(nodeType: string): Promise<NetworkNode[]>;
  createNetworkNode(node: InsertNetworkNode): Promise<NetworkNode>;
  updateNetworkNode(id: string, node: Partial<InsertNetworkNode>): Promise<NetworkNode | undefined>;
  deleteNetworkNode(id: string): Promise<boolean>;
  bulkCreateNetworkNodes(nodes: InsertNetworkNode[]): Promise<NetworkNode[]>;

  // Network Edges
  getAllNetworkEdges(): Promise<NetworkEdge[]>;
  getNetworkEdge(id: string): Promise<NetworkEdge | undefined>;
  getNetworkEdgesByType(edgeType: string): Promise<NetworkEdge[]>;
  getNetworkEdgesByNode(nodeId: string): Promise<NetworkEdge[]>;
  createNetworkEdge(edge: InsertNetworkEdge): Promise<NetworkEdge>;
  updateNetworkEdge(id: string, edge: Partial<InsertNetworkEdge>): Promise<NetworkEdge | undefined>;
  deleteNetworkEdge(id: string): Promise<boolean>;
  bulkCreateNetworkEdges(edges: InsertNetworkEdge[]): Promise<NetworkEdge[]>;

  // Network Analytics
  generateNetworkFromBusinessData(): Promise<{nodes: NetworkNode[], edges: NetworkEdge[]}>;
  getNetworkStatistics(): Promise<{nodeCount: number, edgeCount: number, avgConnections: number}>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Branch methods
  async getAllBranches(): Promise<Branch[]> {
    return await db.select().from(branches);
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const [branch] = await db.insert(branches).values(insertBranch).returning();
    return branch;
  }

  async updateBranch(id: string, updateData: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [branch] = await db.update(branches)
      .set(updateData)
      .where(eq(branches.id, id))
      .returning();
    return branch;
  }

  async deleteBranch(id: string): Promise<boolean> {
    const result = await db.delete(branches).where(eq(branches.id, id)).returning();
    return result.length > 0;
  }

  // Employee methods
  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeesByBranch(branchId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.branchId, branchId));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db.update(employees)
      .set(updateData)
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateEmployees(insertEmployees: InsertEmployee[]): Promise<Employee[]> {
    const createdEmployees = await db.insert(employees).values(insertEmployees).returning();
    return createdEmployees;
  }

  async bulkCreateBranches(insertBranches: InsertBranch[]): Promise<Branch[]> {
    const createdBranches = await db.insert(branches).values(insertBranches).returning();
    return createdBranches;
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomersByBranch(branchId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.branchId, branchId));
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.status, status));
  }

  async getCustomersByBusinessType(businessType: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.businessType, businessType));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const result = await db.execute(sql`
      INSERT INTO customers (shop_name, owner_name, phone, business_type, address, latitude, longitude, monthly_profit, status, branch_id, banking_unit_id, support_employee_id, install_date)
      VALUES (
        ${insertCustomer.shopName},
        ${insertCustomer.ownerName},
        ${insertCustomer.phone || null},
        ${insertCustomer.businessType},
        ${insertCustomer.address || null},
        ${insertCustomer.latitude || null},
        ${insertCustomer.longitude || null},
        ${insertCustomer.monthlyProfit || 0},
        ${insertCustomer.status || 'active'},
        ${insertCustomer.branchId || null},
        ${insertCustomer.bankingUnitId || null},
        ${insertCustomer.supportEmployeeId || null},
        ${insertCustomer.installDate ? insertCustomer.installDate.toISOString() : null}
      )
      RETURNING id, national_id as "nationalId", shop_name as "shopName", owner_name as "ownerName", 
                phone, business_type as "businessType", address, latitude, longitude,
                monthly_profit as "monthlyProfit", status, branch_id as "branchId",
                banking_unit_id as "bankingUnitId", support_employee_id as "supportEmployeeId",
                install_date as "installDate", created_at as "createdAt"
    `);
    return result.rows[0] as Customer;
  }

  async updateCustomer(id: string, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(customers).where(
      or(
        sql`LOWER(${customers.shopName}) LIKE ${searchTerm}`,
        sql`LOWER(${customers.ownerName}) LIKE ${searchTerm}`,
        sql`LOWER(${customers.phone}) LIKE ${searchTerm}`
      )
    );
  }

  // POS Device methods
  async getAllPosDevices(): Promise<PosDevice[]> {
    return await db.select().from(posDevices);
  }

  async getPosDevice(id: string): Promise<PosDevice | undefined> {
    const [device] = await db.select().from(posDevices).where(eq(posDevices.id, id));
    return device;
  }

  async getPosDevicesByCustomer(customerId: string): Promise<PosDevice[]> {
    return await db.select().from(posDevices).where(eq(posDevices.customerId, customerId));
  }

  async getPosDevicesByBankingUnit(bankingUnitId: string): Promise<PosDevice[]> {
    return await db
      .select({
        id: posDevices.id,
        customerId: posDevices.customerId,
        deviceCode: posDevices.deviceCode,
        status: posDevices.status,
        lastConnection: posDevices.lastConnection,
        createdAt: posDevices.createdAt,
      })
      .from(posDevices)
      .innerJoin(customers, eq(posDevices.customerId, customers.id))
      .where(eq(customers.bankingUnitId, bankingUnitId));
  }

  async createPosDevice(insertDevice: InsertPosDevice): Promise<PosDevice> {
    const [device] = await db.insert(posDevices).values(insertDevice).returning();
    return device;
  }

  async updatePosDevice(id: string, updateData: Partial<InsertPosDevice>): Promise<PosDevice | undefined> {
    const [device] = await db.update(posDevices)
      .set(updateData)
      .where(eq(posDevices.id, id))
      .returning();
    return device;
  }

  async deletePosDevice(id: string): Promise<boolean> {
    const result = await db.delete(posDevices).where(eq(posDevices.id, id)).returning();
    return result.length > 0;
  }

  // Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getTransactionsByDevice(deviceId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.posDeviceId, deviceId));
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.select().from(transactions).where(
      and(
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  // Alert methods
  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.isRead, false)).orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert;
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    const [alert] = await db.update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await db.delete(alerts).where(eq(alerts.id, id)).returning();
    return result.length > 0;
  }

  // POS Monthly Stats methods
  async getAllPosMonthlyStats(): Promise<PosMonthlyStats[]> {
    return await db.select().from(posMonthlyStats).orderBy(desc(posMonthlyStats.year), desc(posMonthlyStats.month));
  }

  async getPosMonthlyStats(id: string): Promise<PosMonthlyStats | undefined> {
    const [stats] = await db.select().from(posMonthlyStats).where(eq(posMonthlyStats.id, id));
    return stats;
  }

  async getPosMonthlyStatsByCustomer(customerId: string): Promise<PosMonthlyStats[]> {
    return await db.select().from(posMonthlyStats)
      .where(eq(posMonthlyStats.customerId, customerId))
      .orderBy(desc(posMonthlyStats.year), desc(posMonthlyStats.month));
  }

  async getPosMonthlyStatsByBranch(branchId: string): Promise<PosMonthlyStats[]> {
    return await db.select().from(posMonthlyStats)
      .where(eq(posMonthlyStats.branchId, branchId))
      .orderBy(desc(posMonthlyStats.year), desc(posMonthlyStats.month));
  }

  async getPosMonthlyStatsByDateRange(year: number, startMonth: number, endMonth: number): Promise<PosMonthlyStats[]> {
    return await db.select().from(posMonthlyStats).where(
      and(
        eq(posMonthlyStats.year, year),
        gte(posMonthlyStats.month, startMonth),
        lte(posMonthlyStats.month, endMonth)
      )
    ).orderBy(desc(posMonthlyStats.month));
  }

  async createPosMonthlyStats(insertStats: InsertPosMonthlyStats): Promise<PosMonthlyStats> {
    const [stats] = await db.insert(posMonthlyStats).values(insertStats).returning();
    return stats;
  }

  async updatePosMonthlyStats(id: string, updateData: Partial<InsertPosMonthlyStats>): Promise<PosMonthlyStats | undefined> {
    const [stats] = await db.update(posMonthlyStats)
      .set(updateData)
      .where(eq(posMonthlyStats.id, id))
      .returning();
    return stats;
  }

  async deletePosMonthlyStats(id: string): Promise<boolean> {
    const result = await db.delete(posMonthlyStats).where(eq(posMonthlyStats.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreatePosMonthlyStats(insertStatsArray: InsertPosMonthlyStats[]): Promise<PosMonthlyStats[]> {
    const createdStats = await db.insert(posMonthlyStats).values(insertStatsArray).returning();
    return createdStats;
  }

  // Visit methods
  async getAllVisits(): Promise<Visit[]> {
    return await db.select().from(visits).orderBy(desc(visits.visitDate));
  }

  async getVisit(id: string): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async getVisitsByCustomer(customerId: string): Promise<Visit[]> {
    return await db.select().from(visits)
      .where(eq(visits.customerId, customerId))
      .orderBy(desc(visits.visitDate));
  }

  async getVisitsByEmployee(employeeId: string): Promise<Visit[]> {
    return await db.select().from(visits)
      .where(eq(visits.employeeId, employeeId))
      .orderBy(desc(visits.visitDate));
  }

  async getVisitsByDateRange(startDate: Date, endDate: Date): Promise<Visit[]> {
    return await db.select().from(visits).where(
      and(
        gte(visits.visitDate, startDate),
        lte(visits.visitDate, endDate)
      )
    ).orderBy(desc(visits.visitDate));
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    const [visit] = await db.insert(visits).values(insertVisit).returning();
    return visit;
  }

  async updateVisit(id: string, updateData: Partial<InsertVisit>): Promise<Visit | undefined> {
    const [visit] = await db.update(visits)
      .set(updateData)
      .where(eq(visits.id, id))
      .returning();
    return visit;
  }

  async deleteVisit(id: string): Promise<boolean> {
    const result = await db.delete(visits).where(eq(visits.id, id)).returning();
    return result.length > 0;
  }

  // Customer Access Log methods
  async getAllCustomerAccessLogs(): Promise<CustomerAccessLog[]> {
    return await db.select().from(customerAccessLogs).orderBy(desc(customerAccessLogs.accessTime));
  }

  async getCustomerAccessLogsByCustomer(customerId: string): Promise<CustomerAccessLog[]> {
    return await db.select().from(customerAccessLogs)
      .where(eq(customerAccessLogs.customerId, customerId))
      .orderBy(desc(customerAccessLogs.accessTime));
  }

  async createCustomerAccessLog(insertLog: InsertCustomerAccessLog): Promise<CustomerAccessLog> {
    const [log] = await db.insert(customerAccessLogs).values(insertLog).returning();
    return log;
  }

  // Banking Units methods
  async getAllBankingUnits(): Promise<BankingUnit[]> {
    return await db.select().from(bankingUnits).orderBy(bankingUnits.name);
  }

  async getBankingUnit(id: string): Promise<BankingUnit | undefined> {
    const [unit] = await db.select().from(bankingUnits).where(eq(bankingUnits.id, id));
    return unit;
  }

  async getBankingUnitByCode(code: string): Promise<BankingUnit | undefined> {
    const [unit] = await db.select().from(bankingUnits).where(eq(bankingUnits.code, code));
    return unit;
  }

  async createBankingUnit(insertUnit: InsertBankingUnit): Promise<BankingUnit> {
    const [unit] = await db.insert(bankingUnits).values(insertUnit).returning();
    return unit;
  }

  async updateBankingUnit(id: string, insertUnit: Partial<InsertBankingUnit>): Promise<BankingUnit | undefined> {
    const [unit] = await db.update(bankingUnits).set({
      ...insertUnit,
      updatedAt: new Date()
    }).where(eq(bankingUnits.id, id)).returning();
    return unit;
  }

  async deleteBankingUnit(id: string): Promise<boolean> {
    const result = await db.delete(bankingUnits).where(eq(bankingUnits.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateBankingUnits(insertUnits: InsertBankingUnit[]): Promise<BankingUnit[]> {
    return await db.insert(bankingUnits).values(insertUnits).returning();
  }

  async bulkUpdateBankingUnits(updates: Array<{ id: string; data: Partial<InsertBankingUnit> }>): Promise<BankingUnit[]> {
    const results: BankingUnit[] = [];
    for (const update of updates) {
      const unit = await this.updateBankingUnit(update.id, update.data);
      if (unit) results.push(unit);
    }
    return results;
  }

  // Territory methods
  async getAllTerritories(): Promise<Territory[]> {
    return await db.select().from(territories).where(eq(territories.isActive, true)).orderBy(desc(territories.createdAt));
  }

  async getTerritory(id: string): Promise<Territory | undefined> {
    const [territory] = await db.select().from(territories).where(and(eq(territories.id, id), eq(territories.isActive, true)));
    return territory;
  }

  async getTerritoryByName(name: string): Promise<Territory | undefined> {
    const [territory] = await db.select().from(territories).where(and(eq(territories.name, name), eq(territories.isActive, true)));
    return territory;
  }

  async getTerritoriesByBankingUnit(bankingUnitId: string): Promise<Territory[]> {
    return await db.select().from(territories).where(and(
      eq(territories.assignedBankingUnitId, bankingUnitId),
      eq(territories.isActive, true)
    )).orderBy(desc(territories.createdAt));
  }

  async createTerritory(insertTerritory: InsertTerritory): Promise<Territory> {
    const [territory] = await db.insert(territories).values(insertTerritory).returning();
    return territory;
  }

  async updateTerritory(id: string, insertTerritory: Partial<InsertTerritory>): Promise<Territory | undefined> {
    const [territory] = await db.update(territories).set({
      ...insertTerritory,
      updatedAt: new Date()
    }).where(eq(territories.id, id)).returning();
    return territory;
  }

  async deleteTerritory(id: string): Promise<boolean> {
    const [territory] = await db.update(territories).set({
      isActive: false,
      updatedAt: new Date()
    }).where(eq(territories.id, id)).returning();
    return !!territory;
  }

  async assignTerritoryToBankingUnit(territoryId: string, bankingUnitId: string | null): Promise<Territory | undefined> {
    const [territory] = await db.update(territories).set({
      assignedBankingUnitId: bankingUnitId,
      updatedAt: new Date()
    }).where(eq(territories.id, territoryId)).returning();
    return territory;
  }

  // ======================
  // GRAFANA ENTERPRISE METHODS
  // ======================

  // Organizations
  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const result = await db.delete(organizations).where(eq(organizations.id, id)).returning();
    return result.length > 0;
  }

  // Data Sources
  async getAllDataSources(): Promise<DataSource[]> {
    return await db.select().from(dataSources).orderBy(desc(dataSources.createdAt));
  }

  async getDataSource(id: string): Promise<DataSource | undefined> {
    const [ds] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return ds;
  }

  async getDataSourcesByOrganization(orgId: string): Promise<DataSource[]> {
    return await db.select().from(dataSources).where(eq(dataSources.organizationId, orgId));
  }

  async getDefaultDataSource(orgId: string): Promise<DataSource | undefined> {
    const [ds] = await db.select().from(dataSources)
      .where(and(eq(dataSources.organizationId, orgId), eq(dataSources.isDefault, true)));
    return ds;
  }

  async createDataSource(ds: InsertDataSource): Promise<DataSource> {
    const [created] = await db.insert(dataSources).values(ds).returning();
    return created;
  }

  async updateDataSource(id: string, ds: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const [updated] = await db.update(dataSources)
      .set({ ...ds, updatedAt: new Date() })
      .where(eq(dataSources.id, id))
      .returning();
    return updated;
  }

  async deleteDataSource(id: string): Promise<boolean> {
    const result = await db.delete(dataSources).where(eq(dataSources.id, id)).returning();
    return result.length > 0;
  }

  // Dashboards
  async getAllDashboards(): Promise<Dashboard[]> {
    return await db.select().from(dashboards).orderBy(desc(dashboards.createdAt));
  }

  async getDashboard(id: string): Promise<Dashboard | undefined> {
    const [dashboard] = await db.select().from(dashboards).where(eq(dashboards.id, id));
    return dashboard;
  }

  async getDashboardByUid(uid: string): Promise<Dashboard | undefined> {
    const [dashboard] = await db.select().from(dashboards).where(eq(dashboards.uid, uid));
    return dashboard;
  }

  async getDashboardsByOrganization(orgId: string): Promise<Dashboard[]> {
    return await db.select().from(dashboards).where(eq(dashboards.organizationId, orgId));
  }

  async getDashboardsByFolder(folderId: string): Promise<Dashboard[]> {
    return await db.select().from(dashboards).where(eq(dashboards.folderId, folderId));
  }

  async getStarredDashboards(userId: string): Promise<Dashboard[]> {
    return await db.select().from(dashboards)
      .where(and(eq(dashboards.createdBy, userId), eq(dashboards.isStarred, true)));
  }

  async createDashboard(dashboard: InsertDashboard): Promise<Dashboard> {
    const [created] = await db.insert(dashboards).values(dashboard).returning();
    return created;
  }

  async updateDashboard(id: string, dashboard: Partial<InsertDashboard>): Promise<Dashboard | undefined> {
    const [updated] = await db.update(dashboards)
      .set({ ...dashboard, updatedAt: new Date() })
      .where(eq(dashboards.id, id))
      .returning();
    return updated;
  }

  async deleteDashboard(id: string): Promise<boolean> {
    const result = await db.delete(dashboards).where(eq(dashboards.id, id)).returning();
    return result.length > 0;
  }

  async starDashboard(dashboardId: string, isStarred: boolean): Promise<Dashboard | undefined> {
    const [updated] = await db.update(dashboards)
      .set({ isStarred, updatedAt: new Date() })
      .where(eq(dashboards.id, dashboardId))
      .returning();
    return updated;
  }

  async searchDashboards(query: string, orgId: string): Promise<Dashboard[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(dashboards).where(
      and(
        eq(dashboards.organizationId, orgId),
        sql`LOWER(${dashboards.title}) LIKE ${searchTerm}`
      )
    );
  }

  // Dashboard Versions
  async getDashboardVersions(dashboardId: string): Promise<DashboardVersion[]> {
    return await db.select().from(dashboardVersions)
      .where(eq(dashboardVersions.dashboardId, dashboardId))
      .orderBy(desc(dashboardVersions.version));
  }

  async getDashboardVersion(dashboardId: string, version: number): Promise<DashboardVersion | undefined> {
    const [v] = await db.select().from(dashboardVersions)
      .where(and(eq(dashboardVersions.dashboardId, dashboardId), eq(dashboardVersions.version, version)));
    return v;
  }

  async createDashboardVersion(version: InsertDashboardVersion): Promise<DashboardVersion> {
    const [created] = await db.insert(dashboardVersions).values(version).returning();
    return created;
  }

  // Alert Rules
  async getAllAlertRules(): Promise<AlertRule[]> {
    return await db.select().from(alertRules).orderBy(desc(alertRules.createdAt));
  }

  async getAlertRule(id: string): Promise<AlertRule | undefined> {
    const [rule] = await db.select().from(alertRules).where(eq(alertRules.id, id));
    return rule;
  }

  async getAlertRulesByOrganization(orgId: string): Promise<AlertRule[]> {
    return await db.select().from(alertRules).where(eq(alertRules.organizationId, orgId));
  }

  async createAlertRule(rule: InsertAlertRule): Promise<AlertRule> {
    const [created] = await db.insert(alertRules).values(rule).returning();
    return created;
  }

  async updateAlertRule(id: string, rule: Partial<InsertAlertRule>): Promise<AlertRule | undefined> {
    const [updated] = await db.update(alertRules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(alertRules.id, id))
      .returning();
    return updated;
  }

  async deleteAlertRule(id: string): Promise<boolean> {
    const result = await db.delete(alertRules).where(eq(alertRules.id, id)).returning();
    return result.length > 0;
  }

  async pauseAlertRule(id: string, isPaused: boolean): Promise<AlertRule | undefined> {
    const [updated] = await db.update(alertRules)
      .set({ isPaused, updatedAt: new Date() })
      .where(eq(alertRules.id, id))
      .returning();
    return updated;
  }

  // ML Models
  async getAllMlModels(): Promise<MlModel[]> {
    return await db.select().from(mlModels).orderBy(desc(mlModels.createdAt));
  }

  async getMlModel(id: string): Promise<MlModel | undefined> {
    const [model] = await db.select().from(mlModels).where(eq(mlModels.id, id));
    return model;
  }

  async getMlModelsByOrganization(orgId: string): Promise<MlModel[]> {
    return await db.select().from(mlModels).where(eq(mlModels.organizationId, orgId));
  }

  async getMlModelsByType(type: string): Promise<MlModel[]> {
    return await db.select().from(mlModels).where(eq(mlModels.type, type));
  }

  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const [created] = await db.insert(mlModels).values(model).returning();
    return created;
  }

  async updateMlModel(id: string, model: Partial<InsertMlModel>): Promise<MlModel | undefined> {
    const [updated] = await db.update(mlModels)
      .set({ ...model, updatedAt: new Date() })
      .where(eq(mlModels.id, id))
      .returning();
    return updated;
  }

  async deleteMlModel(id: string): Promise<boolean> {
    const result = await db.delete(mlModels).where(eq(mlModels.id, id)).returning();
    return result.length > 0;
  }

  async activateMlModel(id: string, isActive: boolean): Promise<MlModel | undefined> {
    const [updated] = await db.update(mlModels)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(mlModels.id, id))
      .returning();
    return updated;
  }

  // ML Predictions
  async getAllMlPredictions(): Promise<MlPrediction[]> {
    return await db.select().from(mlPredictions).orderBy(desc(mlPredictions.createdAt));
  }

  async getMlPrediction(id: string): Promise<MlPrediction | undefined> {
    const [prediction] = await db.select().from(mlPredictions).where(eq(mlPredictions.id, id));
    return prediction;
  }

  async getMlPredictionsByModel(modelId: string): Promise<MlPrediction[]> {
    return await db.select().from(mlPredictions).where(eq(mlPredictions.modelId, modelId));
  }

  async getMlPredictionsByDevice(deviceId: string): Promise<MlPrediction[]> {
    return await db.select().from(mlPredictions).where(eq(mlPredictions.deviceId, deviceId));
  }

  async createMlPrediction(prediction: InsertMlPrediction): Promise<MlPrediction> {
    const [created] = await db.insert(mlPredictions).values(prediction).returning();
    return created;
  }

  // Reports
  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportsByOrganization(orgId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.organizationId, orgId));
  }

  async getReportsByDashboard(dashboardId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.dashboardId, dashboardId));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined> {
    const [updated] = await db.update(reports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updated;
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id)).returning();
    return result.length > 0;
  }

  async enableReport(id: string, isEnabled: boolean): Promise<Report | undefined> {
    const [updated] = await db.update(reports)
      .set({ isEnabled, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updated;
  }

  // ======================
  // NETWORK ANALYSIS METHODS
  // ======================

  // Network Nodes
  async getAllNetworkNodes(): Promise<NetworkNode[]> {
    return await db.select().from(networkNodes).orderBy(desc(networkNodes.createdAt));
  }

  async getNetworkNode(id: string): Promise<NetworkNode | undefined> {
    const [node] = await db.select().from(networkNodes).where(eq(networkNodes.id, id));
    return node;
  }

  async getNetworkNodesByType(nodeType: string): Promise<NetworkNode[]> {
    return await db.select().from(networkNodes).where(eq(networkNodes.nodeType, nodeType));
  }

  async createNetworkNode(node: InsertNetworkNode): Promise<NetworkNode> {
    const [created] = await db.insert(networkNodes).values(node).returning();
    return created;
  }

  async updateNetworkNode(id: string, node: Partial<InsertNetworkNode>): Promise<NetworkNode | undefined> {
    const [updated] = await db.update(networkNodes)
      .set({ ...node, updatedAt: new Date() })
      .where(eq(networkNodes.id, id))
      .returning();
    return updated;
  }

  async deleteNetworkNode(id: string): Promise<boolean> {
    const result = await db.delete(networkNodes).where(eq(networkNodes.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateNetworkNodes(nodes: InsertNetworkNode[]): Promise<NetworkNode[]> {
    const created = await db.insert(networkNodes).values(nodes).returning();
    return created;
  }

  // Network Edges
  async getAllNetworkEdges(): Promise<NetworkEdge[]> {
    return await db.select().from(networkEdges).orderBy(desc(networkEdges.createdAt));
  }

  async getNetworkEdge(id: string): Promise<NetworkEdge | undefined> {
    const [edge] = await db.select().from(networkEdges).where(eq(networkEdges.id, id));
    return edge;
  }

  async getNetworkEdgesByType(edgeType: string): Promise<NetworkEdge[]> {
    return await db.select().from(networkEdges).where(eq(networkEdges.edgeType, edgeType));
  }

  async getNetworkEdgesByNode(nodeId: string): Promise<NetworkEdge[]> {
    return await db.select().from(networkEdges)
      .where(or(eq(networkEdges.sourceNodeId, nodeId), eq(networkEdges.targetNodeId, nodeId)));
  }

  async createNetworkEdge(edge: InsertNetworkEdge): Promise<NetworkEdge> {
    const [created] = await db.insert(networkEdges).values(edge).returning();
    return created;
  }

  async updateNetworkEdge(id: string, edge: Partial<InsertNetworkEdge>): Promise<NetworkEdge | undefined> {
    const [updated] = await db.update(networkEdges)
      .set({ ...edge, updatedAt: new Date() })
      .where(eq(networkEdges.id, id))
      .returning();
    return updated;
  }

  async deleteNetworkEdge(id: string): Promise<boolean> {
    const result = await db.delete(networkEdges).where(eq(networkEdges.id, id)).returning();
    return result.length > 0;
  }

  async bulkCreateNetworkEdges(edges: InsertNetworkEdge[]): Promise<NetworkEdge[]> {
    const created = await db.insert(networkEdges).values(edges).returning();
    return created;
  }

  // Network Analytics
  async generateNetworkFromBusinessData(): Promise<{nodes: NetworkNode[], edges: NetworkEdge[]}> {
    // Stub implementation - can be enhanced later
    const nodes = await this.getAllNetworkNodes();
    const edges = await this.getAllNetworkEdges();
    return { nodes, edges };
  }

  async getNetworkStatistics(): Promise<{nodeCount: number, edgeCount: number, avgConnections: number}> {
    const nodes = await db.select().from(networkNodes);
    const edges = await db.select().from(networkEdges);
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const avgConnections = nodeCount > 0 ? edgeCount / nodeCount : 0;
    return { nodeCount, edgeCount, avgConnections };
  }
}

export const storage = new DatabaseStorage();