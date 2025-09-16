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
  users, branches, employees, customers, posDevices, transactions, alerts, posMonthlyStats, visits, customerAccessLogs, bankingUnits
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, or, desc } from "drizzle-orm";

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
    const result = await db.delete(branches).where(eq(branches.id, id));
    return (result.rowCount || 0) > 0;
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
    const result = await db.delete(employees).where(eq(employees.id, id));
    return (result.rowCount || 0) > 0;
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
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(customers).where(
      or(
        ilike(customers.shopName, searchTerm),
        ilike(customers.ownerName, searchTerm),
        ilike(customers.phone, searchTerm)
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
    const result = await db.delete(posMonthlyStats).where(eq(posMonthlyStats.id, id));
    return (result.rowCount || 0) > 0;
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
    const result = await db.delete(visits).where(eq(visits.id, id));
    return (result.rowCount || 0) > 0;
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
    const result = await db.delete(bankingUnits).where(eq(bankingUnits.id, id));
    return (result.rowCount || 0) > 0;
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
}

export const storage = new DatabaseStorage();