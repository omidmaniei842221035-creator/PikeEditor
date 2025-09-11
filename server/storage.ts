import { 
  type User, type InsertUser,
  type Branch, type InsertBranch,
  type Employee, type InsertEmployee,
  type Customer, type InsertCustomer,
  type PosDevice, type InsertPosDevice,
  type Transaction, type InsertTransaction,
  type Alert, type InsertAlert
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  // Employees
  getAllEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeesByBranch(branchId: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;

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
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private branches = new Map<string, Branch>();
  private employees = new Map<string, Employee>();
  private customers = new Map<string, Customer>();
  private posDevices = new Map<string, PosDevice>();
  private transactions = new Map<string, Transaction>();
  private alerts = new Map<string, Alert>();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample branches
    const tabrizBranch: Branch = {
      id: randomUUID(),
      name: "شعبه تبریز مرکزی",
      code: "TBZ-001",
      type: "شعبه",
      manager: "علی احمدی",
      phone: "041-12345678",
      address: "تبریز، میدان ساعت، ساختمان مرکزی",
      latitude: "38.0800",
      longitude: "46.2919",
      coverageRadius: 5,
      monthlyTarget: 1000,
      performance: 85,
      createdAt: new Date(),
    };

    const tehranBranch: Branch = {
      id: randomUUID(),
      name: "شعبه تهران",
      code: "THR-001",
      type: "شعبه",
      manager: "مریم صادقی",
      phone: "021-87654321",
      address: "تهران، میدان آزادی، برج تجارت",
      latitude: "35.6892",
      longitude: "51.3890",
      coverageRadius: 8,
      monthlyTarget: 1500,
      performance: 92,
      createdAt: new Date(),
    };

    const isfahanBranch: Branch = {
      id: randomUUID(),
      name: "شعبه اصفهان",
      code: "ISF-001",
      type: "شعبه",
      manager: "حسن رحیمی",
      phone: "031-11223344",
      address: "اصفهان، میدان نقش جهان، مجتمع تجاری",
      latitude: "32.6546",
      longitude: "51.6680",
      coverageRadius: 6,
      monthlyTarget: 800,
      performance: 76,
      createdAt: new Date(),
    };

    this.branches.set(tabrizBranch.id, tabrizBranch);
    this.branches.set(tehranBranch.id, tehranBranch);
    this.branches.set(isfahanBranch.id, isfahanBranch);

    // Initialize with sample employees
    const employee1: Employee = {
      id: randomUUID(),
      employeeCode: "EMP001",
      name: "علی احمدی",
      position: "مدیر فروش",
      phone: "09123456789",
      email: "ali.ahmadi@pos.ir",
      branchId: tabrizBranch.id,
      salary: 25000000,
      hireDate: new Date("2024-01-15"),
      isActive: true,
      createdAt: new Date(),
    };

    const employee2: Employee = {
      id: randomUUID(),
      employeeCode: "EMP002",
      name: "زهرا کریمی",
      position: "کارشناس بازاریابی",
      phone: "09123456788",
      email: "zahra.karimi@pos.ir",
      branchId: tehranBranch.id,
      salary: 20000000,
      hireDate: new Date("2024-03-10"),
      isActive: true,
      createdAt: new Date(),
    };

    const employee3: Employee = {
      id: randomUUID(),
      employeeCode: "EMP003",
      name: "محمد رضایی",
      position: "کارشناس فنی",
      phone: "09123456787",
      email: "mohammad.rezaei@pos.ir",
      branchId: isfahanBranch.id,
      salary: 18000000,
      hireDate: new Date("2024-05-20"),
      isActive: true,
      createdAt: new Date(),
    };

    this.employees.set(employee1.id, employee1);
    this.employees.set(employee2.id, employee2);
    this.employees.set(employee3.id, employee3);

    // Initialize sample alerts
    const alert1: Alert = {
      id: randomUUID(),
      title: "اتصال POS قطع شده",
      message: "سوپرمارکت آریا - ۵ دقیقه پیش",
      type: "error",
      priority: "high",
      isRead: false,
      customerId: null,
      createdAt: new Date(),
    };

    const alert2: Alert = {
      id: randomUUID(),
      title: "کاهش ناگهانی فروش",
      message: "شعبه تهران - ۱۵ دقیقه پیش",
      type: "warning",
      priority: "medium",
      isRead: false,
      customerId: null,
      createdAt: new Date(),
    };

    const alert3: Alert = {
      id: randomUUID(),
      title: "بروزرسانی سیستم",
      message: "برنامه‌ریزی شده - امشب ۲۳:۰۰",
      type: "info",
      priority: "low",
      isRead: false,
      customerId: null,
      createdAt: new Date(),
    };

    this.alerts.set(alert1.id, alert1);
    this.alerts.set(alert2.id, alert2);
    this.alerts.set(alert3.id, alert3);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Branch methods
  async getAllBranches(): Promise<Branch[]> {
    return Array.from(this.branches.values());
  }

  async getBranch(id: string): Promise<Branch | undefined> {
    return this.branches.get(id);
  }

  async createBranch(insertBranch: InsertBranch): Promise<Branch> {
    const branch: Branch = {
      ...insertBranch,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.branches.set(branch.id, branch);
    return branch;
  }

  async updateBranch(id: string, updateData: Partial<InsertBranch>): Promise<Branch | undefined> {
    const branch = this.branches.get(id);
    if (!branch) return undefined;

    const updatedBranch = { ...branch, ...updateData };
    this.branches.set(id, updatedBranch);
    return updatedBranch;
  }

  async deleteBranch(id: string): Promise<boolean> {
    return this.branches.delete(id);
  }

  // Employee methods
  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeesByBranch(branchId: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.branchId === branchId);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const employee: Employee = {
      ...insertEmployee,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.employees.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: string, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;

    const updatedEmployee = { ...employee, ...updateData };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomersByBranch(branchId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.branchId === branchId);
  }

  async getCustomersByStatus(status: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.status === status);
  }

  async getCustomersByBusinessType(businessType: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.businessType === businessType);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customer: Customer = {
      ...insertCustomer,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...updateData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.customers.values()).filter(customer =>
      customer.shopName.toLowerCase().includes(searchTerm) ||
      customer.ownerName.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm)
    );
  }

  // POS Device methods
  async getAllPosDevices(): Promise<PosDevice[]> {
    return Array.from(this.posDevices.values());
  }

  async getPosDevice(id: string): Promise<PosDevice | undefined> {
    return this.posDevices.get(id);
  }

  async getPosDevicesByCustomer(customerId: string): Promise<PosDevice[]> {
    return Array.from(this.posDevices.values()).filter(device => device.customerId === customerId);
  }

  async createPosDevice(insertDevice: InsertPosDevice): Promise<PosDevice> {
    const device: PosDevice = {
      ...insertDevice,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.posDevices.set(device.id, device);
    return device;
  }

  async updatePosDevice(id: string, updateData: Partial<InsertPosDevice>): Promise<PosDevice | undefined> {
    const device = this.posDevices.get(id);
    if (!device) return undefined;

    const updatedDevice = { ...device, ...updateData };
    this.posDevices.set(id, updatedDevice);
    return updatedDevice;
  }

  // Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransactionsByDevice(deviceId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => transaction.posDeviceId === deviceId);
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => {
      const transDate = new Date(transaction.transactionDate!);
      return transDate >= startDate && transDate <= endDate;
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      ...insertTransaction,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  // Alert methods
  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => !alert.isRead);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const alert: Alert = {
      ...insertAlert,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async markAlertAsRead(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;

    const updatedAlert = { ...alert, isRead: true };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }
}

export const storage = new MemStorage();
