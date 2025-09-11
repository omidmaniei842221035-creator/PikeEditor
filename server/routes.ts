import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertEmployeeSchema, insertBranchSchema, insertAlertSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Branches routes
  app.get("/api/branches", async (req, res) => {
    const branches = await storage.getAllBranches();
    res.json(branches);
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const branchData = insertBranchSchema.parse(req.body);
      const branch = await storage.createBranch(branchData);
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  app.get("/api/branches/:id", async (req, res) => {
    const branch = await storage.getBranch(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json(branch);
  });

  app.put("/api/branches/:id", async (req, res) => {
    try {
      const updateData = insertBranchSchema.partial().parse(req.body);
      const branch = await storage.updateBranch(req.params.id, updateData);
      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: "Invalid branch data" });
    }
  });

  app.delete("/api/branches/:id", async (req, res) => {
    const deleted = await storage.deleteBranch(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json({ success: true });
  });

  // Employees routes
  app.get("/api/employees", async (req, res) => {
    const employees = await storage.getAllEmployees();
    res.json(employees);
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ error: "Invalid employee data" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    const employee = await storage.getEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const updateData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, updateData);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(400).json({ error: "Invalid employee data" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    const deleted = await storage.deleteEmployee(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json({ success: true });
  });

  // Customers routes
  app.get("/api/customers", async (req, res) => {
    const { branch, status, businessType, search } = req.query;
    
    let customers = await storage.getAllCustomers();
    
    if (branch && typeof branch === 'string') {
      customers = await storage.getCustomersByBranch(branch);
    }
    
    if (status && typeof status === 'string') {
      customers = customers.filter(c => c.status === status);
    }
    
    if (businessType && typeof businessType === 'string') {
      customers = customers.filter(c => c.businessType === businessType);
    }
    
    if (search && typeof search === 'string') {
      customers = await storage.searchCustomers(search);
    }
    
    res.json(customers);
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    const customer = await storage.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const updateData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, updateData);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    const deleted = await storage.deleteCustomer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ success: true });
  });

  // POS Devices routes
  app.get("/api/pos-devices", async (req, res) => {
    const devices = await storage.getAllPosDevices();
    res.json(devices);
  });

  app.get("/api/pos-devices/customer/:customerId", async (req, res) => {
    const devices = await storage.getPosDevicesByCustomer(req.params.customerId);
    res.json(devices);
  });

  // Alerts routes
  app.get("/api/alerts", async (req, res) => {
    const alerts = await storage.getAllAlerts();
    res.json(alerts);
  });

  app.get("/api/alerts/unread", async (req, res) => {
    const alerts = await storage.getUnreadAlerts();
    res.json(alerts);
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid alert data" });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    const alert = await storage.markAlertAsRead(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json(alert);
  });

  // Analytics routes
  app.get("/api/analytics/overview", async (req, res) => {
    const customers = await storage.getAllCustomers();
    const employees = await storage.getAllEmployees();
    const branches = await storage.getAllBranches();
    const alerts = await storage.getUnreadAlerts();

    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
    const avgProfit = customers.length > 0 ? totalRevenue / customers.length : 0;

    // Business type distribution
    const businessTypes = customers.reduce((acc, customer) => {
      acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusCounts = customers.reduce((acc, customer) => {
      acc[customer.status] = (acc[customer.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalCustomers: customers.length,
      activeCustomers,
      totalEmployees: employees.length,
      totalBranches: branches.length,
      totalRevenue,
      avgProfit,
      unreadAlerts: alerts.length,
      businessTypes,
      statusCounts,
    });
  });

  // Reports routes
  app.post("/api/reports/generate", async (req, res) => {
    const { branchId, employeeId, status, businessType } = req.body;
    
    let customers = await storage.getAllCustomers();
    
    if (branchId) {
      customers = customers.filter(c => c.branchId === branchId);
    }
    
    if (employeeId) {
      customers = customers.filter(c => c.supportEmployeeId === employeeId);
    }
    
    if (status) {
      customers = customers.filter(c => c.status === status);
    }
    
    if (businessType) {
      customers = customers.filter(c => c.businessType === businessType);
    }

    const totalProfit = customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
    const avgProfit = customers.length > 0 ? totalProfit / customers.length : 0;

    res.json({
      customers,
      summary: {
        total: customers.length,
        totalProfit,
        avgProfit,
      }
    });
  });

  // Excel routes
  app.post("/api/excel/upload", async (req, res) => {
    // This would typically handle file upload and parsing
    // For now, return a mock response
    res.json({
      success: 0,
      errors: 0,
      total: 0,
      errorsList: []
    });
  });

  app.get("/api/excel/sample", async (req, res) => {
    // Return sample Excel file structure
    res.json({
      fields: [
        "کد ملی",
        "نام مشتری",
        "نام شرکت",
        "شعبه",
        "موبایل",
        "آدرس",
        "سود و زیان",
        "وضعیت",
        "تاریخ نصب",
        "نام پشتیبان",
        "عنوان صنف"
      ]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
