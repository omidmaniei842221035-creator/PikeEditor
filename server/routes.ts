import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertCustomerSchema, insertEmployeeSchema, insertBranchSchema, insertAlertSchema, insertPosDeviceSchema, insertPosMonthlyStatsSchema, insertVisitSchema, insertCustomerAccessLogSchema, insertBankingUnitSchema, insertTerritorySchema } from "./db";
import { z } from "zod";
import { grafanaRouter } from "./routes/grafana";

// WebSocket connection management
const wsClients = new Set<any>();
let deviceStatusSimulation: NodeJS.Timeout | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Mount Grafana Enterprise routes
  app.use('/api/grafana', grafanaRouter);
  
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

  // Bulk import branches
  app.post("/api/branches/bulk-import", async (req, res) => {
    try {
      const { branches } = req.body;
      
      if (!Array.isArray(branches)) {
        return res.status(400).json({ error: "branches must be an array" });
      }

      const MAX_BATCH_SIZE = 1000;
      if (branches.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
          error: `Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})` 
        });
      }

      const validBranches = [];
      const errors = [];

      // Validate each branch
      for (let i = 0; i < branches.length; i++) {
        try {
          const branchData = insertBranchSchema.parse(branches[i]);
          validBranches.push(branchData);
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: "Validation errors", 
          details: errors.slice(0, 100) // Limit to first 100 errors
        });
      }

      // Bulk import valid branches
      const importedBranches = await storage.bulkCreateBranches(validBranches);
      
      res.json({ 
        success: true,
        imported: importedBranches.length,
        branches: importedBranches
      });
      
    } catch (error) {
      res.status(500).json({ error: "Bulk import failed" });
    }
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

  // Bulk import employees - MUST come before :id routes
  app.post("/api/employees/bulk-import", async (req, res) => {
    try {
      const { employees } = req.body;
      
      if (!Array.isArray(employees)) {
        return res.status(400).json({ error: "employees must be an array" });
      }

      const MAX_BATCH_SIZE = 1000;
      if (employees.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
          error: `Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})` 
        });
      }

      const validEmployees = [];
      const errors = [];

      // Validate each employee
      for (let i = 0; i < employees.length; i++) {
        try {
          const employeeData = insertEmployeeSchema.parse(employees[i]);
          validEmployees.push(employeeData);
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: "Validation errors", 
          details: errors 
        });
      }

      // Bulk import valid employees
      const importedEmployees = await storage.bulkCreateEmployees(validEmployees);
      
      res.json({ 
        success: true,
        imported: importedEmployees.length,
        employees: importedEmployees
      });
      
    } catch (error) {
      res.status(500).json({ error: "Bulk import failed" });
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
    } catch (error: any) {
      if (error.errors) {
        const issues = error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        console.error("Customer validation errors:", issues);
        return res.status(422).json({ 
          error: "خطا در اعتبارسنجی اطلاعات مشتری",
          issues 
        });
      }
      console.error("Customer creation error:", error);
      res.status(400).json({ error: "خطا در ذخیره اطلاعات مشتری" });
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
        return res.status(404).json({ error: "مشتری یافت نشد" });
      }
      res.json(customer);
    } catch (error: any) {
      if (error.errors) {
        const issues = error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        console.error("Customer update validation errors:", issues);
        return res.status(422).json({ 
          error: "خطا در اعتبارسنجی اطلاعات مشتری",
          issues 
        });
      }
      console.error("Customer update error:", error);
      res.status(400).json({ error: "خطا در به‌روزرسانی اطلاعات مشتری" });
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

  app.get("/api/pos-devices/banking-unit/:bankingUnitId", async (req, res) => {
    const devices = await storage.getPosDevicesByBankingUnit(req.params.bankingUnitId);
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

  // Visits routes
  app.get("/api/visits", async (req, res) => {
    const visits = await storage.getAllVisits();
    res.json(visits);
  });

  app.get("/api/visits/customer/:customerId", async (req, res) => {
    const visits = await storage.getVisitsByCustomer(req.params.customerId);
    res.json(visits);
  });

  app.get("/api/visits/employee/:employeeId", async (req, res) => {
    const visits = await storage.getVisitsByEmployee(req.params.employeeId);
    res.json(visits);
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const visitData = insertVisitSchema.parse(req.body);
      const visit = await storage.createVisit(visitData);
      res.json(visit);
    } catch (error) {
      res.status(400).json({ error: "Invalid visit data" });
    }
  });

  app.put("/api/visits/:id", async (req, res) => {
    try {
      const updateData = insertVisitSchema.partial().parse(req.body);
      const visit = await storage.updateVisit(req.params.id, updateData);
      if (!visit) {
        return res.status(404).json({ error: "Visit not found" });
      }
      res.json(visit);
    } catch (error) {
      res.status(400).json({ error: "Invalid visit data" });
    }
  });

  app.delete("/api/visits/:id", async (req, res) => {
    const deleted = await storage.deleteVisit(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Visit not found" });
    }
    res.json({ success: true });
  });

  // Customer Access Logs routes
  app.get("/api/customer-access-logs", async (req, res) => {
    const logs = await storage.getAllCustomerAccessLogs();
    res.json(logs);
  });

  app.get("/api/customer-access-logs/customer/:customerId", async (req, res) => {
    const logs = await storage.getCustomerAccessLogsByCustomer(req.params.customerId);
    res.json(logs);
  });

  app.post("/api/customer-access-logs", async (req, res) => {
    try {
      const logData = insertCustomerAccessLogSchema.parse(req.body);
      
      // Set IP address from request (server-side)
      const logWithIP = {
        ...logData,
        ipAddress: req.ip || req.connection.remoteAddress || '',
        userAgent: logData.userAgent?.substring(0, 500)
      };
      
      const log = await storage.createCustomerAccessLog(logWithIP);
      res.json(log);
    } catch (error) {
      res.status(400).json({ error: "Invalid access log data" });
    }
  });

  // Banking Units routes
  app.get("/api/banking-units", async (req, res) => {
    const units = await storage.getAllBankingUnits();
    res.json(units);
  });

  app.get("/api/banking-units/code/:code", async (req, res) => {
    const unit = await storage.getBankingUnitByCode(req.params.code);
    if (!unit) {
      return res.status(404).json({ error: "Banking unit not found" });
    }
    res.json(unit);
  });

  app.get("/api/banking-units/:id", async (req, res) => {
    const unit = await storage.getBankingUnit(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Banking unit not found" });
    }
    res.json(unit);
  });

  // Bulk import banking units - MUST be before :id routes
  app.post("/api/banking-units/bulk-import", async (req, res) => {
    try {
      const { bankingUnits } = req.body;
      
      if (!Array.isArray(bankingUnits)) {
        return res.status(400).json({ error: "bankingUnits must be an array" });
      }

      const MAX_BATCH_SIZE = 1000;
      if (bankingUnits.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
          error: `Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})` 
        });
      }

      const validBankingUnits = [];
      const errors = [];

      for (let i = 0; i < bankingUnits.length; i++) {
        try {
          const bankingUnitData = insertBankingUnitSchema.parse(bankingUnits[i]);
          validBankingUnits.push(bankingUnitData);
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error instanceof z.ZodError ? error.errors : String(error)
          });
        }
      }

      let imported = 0;
      const importErrors = [];

      for (const bankingUnitData of validBankingUnits) {
        try {
          await storage.createBankingUnit(bankingUnitData);
          imported++;
        } catch (error) {
          importErrors.push({
            data: bankingUnitData,
            error: String(error)
          });
        }
      }

      res.json({
        success: true,
        imported,
        total: bankingUnits.length,
        validationErrors: errors,
        importErrors
      });
    } catch (error) {
      console.error("Banking units bulk import error:", error);
      res.status(500).json({
        error: "خطا در واردات دسته‌ای وحدات مصرفی",
        success: false
      });
    }
  });

  app.post("/api/banking-units", async (req, res) => {
    try {
      const unitData = insertBankingUnitSchema.parse(req.body);
      const unit = await storage.createBankingUnit(unitData);
      res.json(unit);
    } catch (error) {
      res.status(400).json({ error: "Invalid banking unit data" });
    }
  });

  app.patch("/api/banking-units/:id", async (req, res) => {
    try {
      const unitData = insertBankingUnitSchema.partial().parse(req.body);
      const unit = await storage.updateBankingUnit(req.params.id, unitData);
      if (!unit) {
        return res.status(404).json({ error: "Banking unit not found" });
      }
      res.json(unit);
    } catch (error) {
      res.status(400).json({ error: "Invalid banking unit data" });
    }
  });

  app.delete("/api/banking-units/:id", async (req, res) => {
    const deleted = await storage.deleteBankingUnit(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Banking unit not found" });
    }
    res.json({ success: true });
  });

  app.post("/api/banking-units/bulk", async (req, res) => {
    try {
      const bulkCreateSchema = z.object({
        units: z.array(insertBankingUnitSchema).max(100) // Limit batch size
      });
      const { units } = bulkCreateSchema.parse(req.body);
      const createdUnits = await storage.bulkCreateBankingUnits(units);
      res.json(createdUnits);
    } catch (error) {
      res.status(400).json({ error: "Invalid banking units data" });
    }
  });

  app.patch("/api/banking-units/bulk", async (req, res) => {
    try {
      const bulkUpdateSchema = z.object({
        updates: z.array(z.object({
          id: z.string().min(1),
          data: insertBankingUnitSchema.partial()
        })).max(100)
      });
      const { updates } = bulkUpdateSchema.parse(req.body);
      const validUpdates = updates.map(u => ({
        id: u.id,
        data: u.data
      }));
      const updatedUnits = await storage.bulkUpdateBankingUnits(validUpdates);
      res.json(updatedUnits);
    } catch (error) {
      res.status(400).json({ error: "Invalid banking units data" });
    }
  });

  // Territory routes
  app.get("/api/territories", async (req, res) => {
    const territories = await storage.getAllTerritories();
    res.json(territories);
  });

  app.get("/api/territories/:id", async (req, res) => {
    const territory = await storage.getTerritory(req.params.id);
    if (!territory) {
      return res.status(404).json({ error: "Territory not found" });
    }
    res.json(territory);
  });

  app.post("/api/territories", async (req, res) => {
    try {
      const territoryData = insertTerritorySchema.parse(req.body);
      const territory = await storage.createTerritory(territoryData);
      res.json(territory);
    } catch (error) {
      res.status(400).json({ error: "Invalid territory data" });
    }
  });

  app.patch("/api/territories/:id", async (req, res) => {
    try {
      const updateData = insertTerritorySchema.partial().parse(req.body);
      const territory = await storage.updateTerritory(req.params.id, updateData);
      if (!territory) {
        return res.status(404).json({ error: "Territory not found" });
      }
      res.json(territory);
    } catch (error) {
      res.status(400).json({ error: "Invalid territory data" });
    }
  });

  app.delete("/api/territories/:id", async (req, res) => {
    const deleted = await storage.deleteTerritory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Territory not found" });
    }
    res.json({ success: true });
  });

  app.post("/api/territories/:id/assign", async (req, res) => {
    try {
      const { bankingUnitId } = z.object({
        bankingUnitId: z.string().nullable()
      }).parse(req.body);
      
      const territory = await storage.assignTerritoryToBankingUnit(req.params.id, bankingUnitId);
      if (!territory) {
        return res.status(404).json({ error: "Territory not found" });
      }
      res.json(territory);
    } catch (error) {
      res.status(400).json({ error: "Invalid assignment data" });
    }
  });

  app.get("/api/territories/:id/stats", async (req, res) => {
    try {
      const territory = await storage.getTerritory(req.params.id);
      if (!territory) {
        return res.status(404).json({ error: "Territory not found" });
      }

      const customers = await storage.getAllCustomers();
      const posStats = await storage.getAllPosMonthlyStats();
      
      // Simple point-in-polygon check (basic implementation)
      const territoryCustomers = customers.filter(customer => {
        if (!customer.latitude || !customer.longitude) return false;
        
        try {
          const point = [parseFloat(customer.longitude.toString()), parseFloat(customer.latitude.toString())];
          // This is a simplified check - in production you'd use a proper point-in-polygon library
          const geometry = territory.geometry as any;
          if (geometry.type === 'Polygon') {
            // Basic bounding box check for simplicity
            const bbox = territory.bbox as [number, number, number, number];
            return point[0] >= bbox[0] && point[0] <= bbox[2] && point[1] >= bbox[1] && point[1] <= bbox[3];
          }
          return false;
        } catch {
          return false;
        }
      });

      const territoryCustomerIds = new Set(territoryCustomers.map(c => c.id));
      const territoryPosStats = posStats.filter(stat => stat.customerId && territoryCustomerIds.has(stat.customerId));

      // Calculate statistics
      const totalRevenue = territoryPosStats.reduce((sum, stat) => sum + (stat.revenue || 0), 0);
      const totalTransactions = territoryPosStats.reduce((sum, stat) => sum + (stat.totalTransactions || 0), 0);
      
      // Business type distribution
      const businessTypes = territoryCustomers.reduce((acc, customer) => {
        acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        territoryId: territory.id,
        territoryName: territory.name,
        totalCustomers: territoryCustomers.length,
        totalRevenue,
        totalTransactions,
        businessTypes,
        customers: territoryCustomers,
        topBusinessType: Object.entries(businessTypes).sort(([,a], [,b]) => b - a)[0]?.[0] || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate territory stats" });
    }
  });

  app.post("/api/territories/suggest-name", async (req, res) => {
    try {
      const { geometry, bbox } = z.object({
        geometry: z.object({
          type: z.literal("Polygon"),
          coordinates: z.array(z.array(z.array(z.number())))
        }),
        bbox: z.array(z.number()).length(4)
      }).parse(req.body);

      const customers = await storage.getAllCustomers();
      
      // Find customers within territory (simplified bounding box check)
      const territoryCustomers = customers.filter(customer => {
        if (!customer.latitude || !customer.longitude) return false;
        
        try {
          const point = [parseFloat(customer.longitude.toString()), parseFloat(customer.latitude.toString())];
          return point[0] >= bbox[0] && point[0] <= bbox[2] && point[1] >= bbox[1] && point[1] <= bbox[3];
        } catch {
          return false;
        }
      });

      // Count business types
      const businessTypes = territoryCustomers.reduce((acc, customer) => {
        acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalCustomers = territoryCustomers.length;
      const topBusinessType = Object.entries(businessTypes).sort(([,a], [,b]) => b - a)[0];
      
      let suggestedName = "منطقه سفارشی";
      let autoNamed = false;

      if (topBusinessType && totalCustomers >= 5) {
        const [businessType, count] = topBusinessType;
        const percentage = (count / totalCustomers) * 100;
        
        if (percentage >= 30) {
          const businessNameMap: Record<string, string> = {
            'supermarket': 'سوپرمارکت‌ها',
            'restaurant': 'رستوران‌ها', 
            'pharmacy': 'داروخانه‌ها',
            'cafe': 'کافه‌ها',
            'bakery': 'نانوایی‌ها',
            'clothing': 'پوشاک',
            'electronics': 'الکترونیک',
            'bookstore': 'کتابفروشی‌ها',
            'jewelry': 'طلا و جواهر',
            'auto': 'خودرو و قطعات'
          };
          
          const persianName = businessNameMap[businessType] || businessType;
          suggestedName = `منطقه ${persianName}`;
          autoNamed = true;
        }
      }

      res.json({
        suggestedName,
        autoNamed,
        businessFocus: topBusinessType?.[0] || null,
        stats: {
          totalCustomers,
          businessTypes,
          topBusinessType: topBusinessType?.[0],
          topBusinessTypeCount: topBusinessType?.[1] || 0,
          topBusinessTypePercentage: topBusinessType ? Math.round((topBusinessType[1] / totalCustomers) * 100) : 0
        }
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid territory data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/overview", async (req, res) => {
    let customers = await storage.getAllCustomers();
    const employees = await storage.getAllEmployees();
    const branches = await storage.getAllBranches();
    const bankingUnits = await storage.getAllBankingUnits();
    const alerts = await storage.getUnreadAlerts();

    // Apply filters from query parameters
    const { businessType, status, bankingUnit } = req.query;
    
    if (businessType && businessType !== 'all') {
      customers = customers.filter(c => c.businessType === businessType);
    }
    
    if (status && status !== 'all') {
      customers = customers.filter(c => c.status === status);
    }
    
    if (bankingUnit && bankingUnit !== 'all') {
      customers = customers.filter(c => c.bankingUnitId === bankingUnit);
    }

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
      totalBankingUnits: bankingUnits.length,
      totalRevenue,
      avgProfit,
      unreadAlerts: alerts.length,
      businessTypes,
      statusCounts,
    });
  });

  // POS Monthly Stats routes
  app.get("/api/pos-stats", async (req, res) => {
    const stats = await storage.getAllPosMonthlyStats();
    res.json(stats);
  });

  app.post("/api/pos-stats", async (req, res) => {
    try {
      const statsData = insertPosMonthlyStatsSchema.parse(req.body);
      const stats = await storage.createPosMonthlyStats(statsData);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: "Invalid POS stats data" });
    }
  });

  app.get("/api/pos-stats/:id", async (req, res) => {
    const stats = await storage.getPosMonthlyStats(req.params.id);
    if (!stats) {
      return res.status(404).json({ error: "POS stats not found" });
    }
    res.json(stats);
  });

  app.put("/api/pos-stats/:id", async (req, res) => {
    try {
      const updateData = insertPosMonthlyStatsSchema.partial().parse(req.body);
      const stats = await storage.updatePosMonthlyStats(req.params.id, updateData);
      if (!stats) {
        return res.status(404).json({ error: "POS stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: "Invalid POS stats data" });
    }
  });

  app.delete("/api/pos-stats/:id", async (req, res) => {
    const deleted = await storage.deletePosMonthlyStats(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "POS stats not found" });
    }
    res.json({ success: true });
  });

  // Get POS stats by customer
  app.get("/api/pos-stats/customer/:customerId", async (req, res) => {
    const stats = await storage.getPosMonthlyStatsByCustomer(req.params.customerId);
    res.json(stats);
  });

  // Get POS stats by branch
  app.get("/api/pos-stats/branch/:branchId", async (req, res) => {
    const stats = await storage.getPosMonthlyStatsByBranch(req.params.branchId);
    res.json(stats);
  });

  // Get POS stats by date range
  app.get("/api/pos-stats/date/:year/:startMonth/:endMonth", async (req, res) => {
    const year = parseInt(req.params.year);
    const startMonth = parseInt(req.params.startMonth);
    const endMonth = parseInt(req.params.endMonth);
    
    if (isNaN(year) || isNaN(startMonth) || isNaN(endMonth)) {
      return res.status(400).json({ error: "Invalid date parameters" });
    }
    
    const stats = await storage.getPosMonthlyStatsByDateRange(year, startMonth, endMonth);
    res.json(stats);
  });

  // Bulk import POS monthly stats
  app.post("/api/pos-stats/bulk-import", async (req, res) => {
    try {
      const { stats } = req.body;
      
      if (!Array.isArray(stats)) {
        return res.status(400).json({ error: "stats must be an array" });
      }

      const MAX_BATCH_SIZE = 1000;
      if (stats.length > MAX_BATCH_SIZE) {
        return res.status(400).json({ 
          error: `Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})` 
        });
      }

      const validStats = [];
      const errors = [];

      // Validate each stat entry
      for (let i = 0; i < stats.length; i++) {
        try {
          const statsData = insertPosMonthlyStatsSchema.parse(stats[i]);
          validStats.push(statsData);
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          error: "Validation errors", 
          details: errors.slice(0, 100) // Limit to first 100 errors
        });
      }

      // Bulk import valid stats
      const importedStats = await storage.bulkCreatePosMonthlyStats(validStats);
      
      res.json({ 
        success: true,
        imported: importedStats.length,
        stats: importedStats
      });
      
    } catch (error) {
      res.status(500).json({ error: "Bulk import failed" });
    }
  });

  // ======================
  // STRATEGIC ANALYSIS ROUTES
  // ======================
  
  // Get strategic recommendations for banking units (moved from existing implementation above)
  app.get("/api/strategic/banking-unit-recommendations", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const bankingUnits = await storage.getAllBankingUnits();
      const posDevices = await storage.getAllPosDevices();
      
      const recommendations = bankingUnits.map(unit => {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        const unitDevices = posDevices.filter(d => unitCustomers.some(c => c.id === d.customerId));
        
        // Performance metrics
        const totalRevenue = unitCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        const avgRevenue = unitCustomers.length > 0 ? totalRevenue / unitCustomers.length : 0;
        const deviceCount = unitDevices.length;
        const activeDevices = unitDevices.filter(d => d.status === 'active').length;
        const deviceUtilization = deviceCount > 0 ? (activeDevices / deviceCount) * 100 : 0;
        
        // Business type diversity
        const businessTypes = [...new Set(unitCustomers.map(c => c.businessType))];
        const diversityScore = (businessTypes.length / 10) * 100; // Max 10 types
        
        // Performance classification
        let performanceLevel: string;
        let recommendations: string[];
        
        if (totalRevenue > 50000000 && deviceUtilization > 80) {
          performanceLevel = 'عالی';
          recommendations = [
            'ادامه استراتژی موجود',
            'توسعه خدمات پیشرفته',
            'افزایش تعداد POS در مناطق پرتقاضا',
            'آموزش کارمندان برای خدمات ویژه'
          ];
        } else if (totalRevenue > 25000000 && deviceUtilization > 60) {
          performanceLevel = 'خوب';
          recommendations = [
            'بهینه‌سازی فرآیندهای موجود',
            'افزایش تنوع کسب‌وکارها',
            'بهبود نگهداری POS ها',
            'برنامه‌های ترغیبی برای مشتریان'
          ];
        } else if (totalRevenue > 10000000) {
          performanceLevel = 'متوسط';
          recommendations = [
            'تحلیل علل کاهش عملکرد',
            'بازاریابی هدفمند در منطقه',
            'آموزش مجدد کارمندان',
            'بررسی وضعیت فنی POS ها'
          ];
        } else {
          performanceLevel = 'ضعیف';
          recommendations = [
            'بازنگری استراتژی کلی واحد',
            'تحلیل رقابتی منطقه',
            'بررسی جابجایی واحد',
            'برنامه بهبود عملکرد فوری'
          ];
        }
        
        return {
          unitId: unit.id,
          unitName: unit.name,
          unitType: unit.unitType,
          performanceLevel,
          metrics: {
            totalRevenue,
            avgRevenue,
            customerCount: unitCustomers.length,
            deviceCount,
            activeDevices,
            deviceUtilization,
            diversityScore,
            businessTypes: businessTypes.length
          },
          recommendations,
          priorityActions: recommendations.slice(0, 2)
        };
      });
      
      res.json(recommendations);
      
    } catch (error) {
      console.error("Strategic banking unit recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });
  
  // Get strategic recommendations for employees
  app.get("/api/strategic/employee-recommendations", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const customers = await storage.getAllCustomers();
      
      const recommendations = employees.map(employee => {
        const employeeCustomers = customers.filter(c => c.supportEmployeeId === employee.id);
        const totalRevenue = employeeCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        const avgRevenue = employeeCustomers.length > 0 ? totalRevenue / employeeCustomers.length : 0;
        
        // Employee performance metrics
        const customerSatisfaction = Math.min(100, (totalRevenue / 1000000) + (employeeCustomers.length * 5));
        const efficiency = employeeCustomers.length > 0 ? Math.min(100, avgRevenue / 100000) : 0;
        
        let performanceLevel: string;
        let developmentPlan: string[];
        let incentives: string[];
        
        if (totalRevenue > 30000000 && employeeCustomers.length > 8) {
          performanceLevel = 'برتر';
          developmentPlan = [
            'ارتقا به سطح مدیریت',
            'آموزش مهارت‌های رهبری',
            'مسئولیت واحدهای جدید',
            'شرکت در دوره‌های تخصصی'
          ];
          incentives = [
            'پاداش عملکرد ویژه',
            'برنامه سهم در سود',
            'ارتقا شغلی',
            'تحصیل با هزینه شرکت'
          ];
        } else if (totalRevenue > 15000000 && employeeCustomers.length > 5) {
          performanceLevel = 'خوب';
          developmentPlan = [
            'آموزش فروش پیشرفته',
            'مهارت‌های ارتباط با مشتری',
            'دوره‌های فنی POS',
            'تجربه در واحدهای مختلف'
          ];
          incentives = [
            'پاداش فصلی',
            'روزهای مرخصی اضافی',
            'آموزش‌های تخصصی',
            'امکانات رفاهی بیشتر'
          ];
        } else if (totalRevenue > 5000000) {
          performanceLevel = 'متوسط';
          developmentPlan = [
            'آموزش مجدد مهارت‌های پایه',
            'همراهی با کارمندان موفق',
            'دوره‌های انگیزشی',
            'بررسی چالش‌های شخصی'
          ];
          incentives = [
            'تشویق‌های ماهانه',
            'برنامه آموزش رایگان',
            'انعطاف در ساعات کار',
            'مشاوره شغلی'
          ];
        } else {
          performanceLevel = 'نیاز به بهبود';
          developmentPlan = [
            'ارزیابی مجدد مهارت‌ها',
            'آموزش فشرده',
            'نظارت مستقیم مدیر',
            'برنامه بهبود عملکرد'
          ];
          incentives = [
            'آموزش‌های تقویتی',
            'حمایت روانی و انگیزشی',
            'تغییر محیط کار',
            'فرصت شروع مجدد'
          ];
        }
        
        return {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeCode: employee.employeeCode,
          performanceLevel,
          metrics: {
            totalRevenue,
            avgRevenue,
            customerCount: employeeCustomers.length,
            customerSatisfaction: Math.round(customerSatisfaction),
            efficiency: Math.round(efficiency)
          },
          developmentPlan,
          incentives,
          nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 3 months
        };
      });
      
      res.json(recommendations);
      
    } catch (error) {
      console.error("Strategic employee recommendations error:", error);
      res.status(500).json({ error: "Failed to generate employee recommendations" });
    }
  });
  
  // Get regional marketing recommendations
  app.get("/api/strategic/regional-marketing", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      
      // Group customers by location patterns
      const locationAnalysis = customers.reduce((acc, customer) => {
        const region = customer.address ? customer.address.split(' ')[0] : 'نامشخص';
        if (!acc[region]) {
          acc[region] = {
            customers: [],
            businessTypes: new Set(),
            totalRevenue: 0
          };
        }
        acc[region].customers.push(customer);
        acc[region].businessTypes.add(customer.businessType);
        acc[region].totalRevenue += customer.monthlyProfit || 0;
        return acc;
      }, {} as any);
      
      const regionalRecommendations = Object.entries(locationAnalysis).map(([region, data]: [string, any]) => {
        const customerCount = data.customers.length;
        const avgRevenue = customerCount > 0 ? data.totalRevenue / customerCount : 0;
        const businessDiversity = data.businessTypes.size;
        
        // Market potential calculation
        const marketPotential = (customerCount * 2000000) + (businessDiversity * 5000000);
        const currentCapture = (data.totalRevenue / marketPotential) * 100;
        
        let marketingStrategy: string[];
        let targetSegments: string[];
        let campaignBudget: number;
        
        if (currentCapture < 30) {
          marketingStrategy = [
            'کمپین آگاهی‌سازی گسترده',
            'تبلیغات محلی و رسانه‌ای',
            'ارائه تخفیف‌های ویژه',
            'همکاری با اتحادیه‌های صنفی'
          ];
          targetSegments = [
            'کسب‌وکارهای جدید',
            'فروشگاه‌های زنجیره‌ای',
            'رستوران‌ها و کافه‌ها',
            'خدمات درمانی'
          ];
          campaignBudget = 50000000;
        } else if (currentCapture < 60) {
          marketingStrategy = [
            'ارتقا خدمات موجود',
            'معرفی محصولات جدید',
            'برنامه‌های وفاداری',
            'بازاریابی شبکه‌ای'
          ];
          targetSegments = [
            'مشتریان موجود',
            'کسب‌وکارهای مشابه',
            'شرکای تجاری',
            'ارجاعات مشتریان'
          ];
          campaignBudget = 30000000;
        } else {
          marketingStrategy = [
            'حفظ جایگاه بازار',
            'نوآوری در خدمات',
            'توسعه به مناطق مجاور',
            'برنامه‌های مشارکتی'
          ];
          targetSegments = [
            'بازارهای جدید',
            'خدمات پیشرفته',
            'شرکای استراتژیک',
            'صادرات خدمات'
          ];
          campaignBudget = 20000000;
        }
        
        return {
          region,
          metrics: {
            customerCount,
            businessDiversity,
            totalRevenue: data.totalRevenue,
            avgRevenue,
            marketPotential,
            currentCapture: Math.round(currentCapture)
          },
          marketingStrategy,
          targetSegments,
          campaignBudget,
          expectedROI: Math.round((campaignBudget * 0.3) / campaignBudget * 100),
          timeframe: '6 ماه'
        };
      });
      
      res.json(regionalRecommendations);
      
    } catch (error) {
      console.error("Regional marketing recommendations error:", error);
      res.status(500).json({ error: "Failed to generate regional marketing recommendations" });
    }
  });
  
  // Get POS performance insights
  app.get("/api/strategic/pos-performance", async (req, res) => {
    try {
      const posDevices = await storage.getAllPosDevices();
      const customers = await storage.getAllCustomers();
      
      const posInsights = posDevices.map(device => {
        const customer = customers.find(c => c.id === device.customerId);
        const revenue = customer?.monthlyProfit || 0;
        
        // Calculate performance metrics
        const utilizationScore = device.status === 'active' ? 100 : 
                               device.status === 'maintenance' ? 50 : 0;
        
        const revenueScore = Math.min(100, revenue / 100000);
        const overallScore = (utilizationScore + revenueScore) / 2;
        
        let recommendations: string[];
        let maintenanceNeeded = false;
        let upgradeSuggested = false;
        
        if (overallScore > 80) {
          recommendations = [
            'عملکرد عالی - ادامه وضع فعلی',
            'نظارت منظم بر عملکرد',
            'بکاپ گیری از تنظیمات',
            'آموزش پیشرفته برای کاربر'
          ];
        } else if (overallScore > 60) {
          recommendations = [
            'بهینه‌سازی تنظیمات',
            'بررسی سرعت اتصال',
            'آموزش مجدد کاربر',
            'بروزرسانی نرم‌افزار'
          ];
        } else if (overallScore > 40) {
          recommendations = [
            'بررسی فنی کامل',
            'تعمیر یا تعویض قطعات',
            'بهبود شرایط محیطی',
            'آموزش کامل کاربر'
          ];
          maintenanceNeeded = true;
        } else {
          recommendations = [
            'تعویض دستگاه',
            'بررسی امکان ارتقا',
            'تحلیل هزینه-فایده',
            'برنامه‌ریزی برای POS جدید'
          ];
          maintenanceNeeded = true;
          upgradeSuggested = true;
        }
        
        return {
          deviceId: device.id,
          deviceCode: device.deviceCode,
          customerName: customer?.shopName || 'نامشخص',
          businessType: customer?.businessType || 'نامشخص',
          status: device.status,
          metrics: {
            utilizationScore: Math.round(utilizationScore),
            revenueScore: Math.round(revenueScore),
            overallScore: Math.round(overallScore),
            monthlyRevenue: revenue
          },
          recommendations,
          flags: {
            maintenanceNeeded,
            upgradeSuggested,
            highPerformance: overallScore > 80,
            needsAttention: overallScore < 60
          }
        };
      });
      
      // Aggregate insights
      const aggregateInsights = {
        totalDevices: posDevices.length,
        highPerformance: posInsights.filter(p => p.flags.highPerformance).length,
        needsMaintenance: posInsights.filter(p => p.flags.maintenanceNeeded).length,
        upgradeRequired: posInsights.filter(p => p.flags.upgradeSuggested).length,
        avgPerformance: Math.round(posInsights.reduce((sum, p) => sum + p.metrics.overallScore, 0) / posInsights.length),
        topPerformers: posInsights.filter(p => p.metrics.overallScore > 80).slice(0, 5),
        underPerformers: posInsights.filter(p => p.metrics.overallScore < 40).slice(0, 5)
      };
      
      res.json({
        insights: posInsights,
        aggregate: aggregateInsights
      });
      
    } catch (error) {
      console.error("POS performance insights error:", error);
      res.status(500).json({ error: "Failed to generate POS insights" });
    }
  });

  // ======================
  // NETWORK ANALYSIS ROUTES (Spider Web Visualization)
  // ======================
  
  // Get network performance analytics
  app.get("/api/network/performance-analytics", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const bankingUnits = await storage.getAllBankingUnits();
      const posDevices = await storage.getAllPosDevices();
      
      // Calculate performance metrics for banking units
      const unitPerformance = bankingUnits.map(unit => {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        const unitDevices = posDevices.filter(d => unitCustomers.some(c => c.id === d.customerId));
        
        const totalRevenue = unitCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        const deviceCount = unitDevices.length;
        const activeDevices = unitDevices.filter(d => d.status === 'active').length;
        const efficiency = deviceCount > 0 ? (activeDevices / deviceCount) * 100 : 0;
        
        return {
          unitId: unit.id,
          unitName: unit.name,
          revenue: totalRevenue,
          deviceCount,
          efficiency,
          customerCount: unitCustomers.length
        };
      });
      
      // Top performing units
      const topPerformingUnits = unitPerformance
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(unit => ({
          unitId: unit.unitId,
          unitName: unit.unitName,
          revenue: unit.revenue,
          deviceCount: unit.deviceCount,
          efficiency: unit.efficiency
        }));
      
      // Under performing units - sort by severity score before slicing
      const underPerformingUnits = unitPerformance
        .filter(unit => unit.revenue < 10000000 || unit.efficiency < 60)
        .map(unit => {
          const issues = [];
          let severityScore = 0;
          
          if (unit.revenue < 10000000) {
            issues.push('درآمد پایین');
            severityScore += unit.revenue < 5000000 ? 3 : 2; // Higher penalty for very low revenue
          }
          if (unit.efficiency < 60) {
            issues.push('کارایی ضعیف POS');
            severityScore += unit.efficiency < 30 ? 3 : 2; // Higher penalty for very low efficiency
          }
          if (unit.customerCount < 3) {
            issues.push('تعداد مشتری کم');
            severityScore += 1;
          }
          
          return {
            unitId: unit.unitId,
            unitName: unit.unitName,
            revenue: unit.revenue,
            issues,
            severityScore
          };
        })
        .sort((a, b) => b.severityScore - a.severityScore) // Sort by most severe first
        .slice(0, 5)
        .map(unit => ({
          unitId: unit.unitId,
          unitName: unit.unitName,
          revenue: unit.revenue,
          issues: unit.issues
        }));
      
      // Calculate centrality metrics (simplified)
      const centralityMetrics = unitPerformance.map(unit => {
        // Degree centrality based on customer connections - guard against division by zero
        const maxCustomers = Math.max(1, ...unitPerformance.map(u => u.customerCount));
        const degreeCentrality = unit.customerCount / maxCustomers;
        
        // Betweenness centrality approximation based on revenue and connections
        const betweennessCentrality = (unit.revenue / 100000000) * (unit.customerCount / 20);
        
        let importance: 'high' | 'medium' | 'low' = 'low';
        if (degreeCentrality > 0.7 && betweennessCentrality > 0.5) importance = 'high';
        else if (degreeCentrality > 0.4 || betweennessCentrality > 0.3) importance = 'medium';
        
        return {
          nodeId: unit.unitId,
          nodeName: unit.unitName,
          betweennessCentrality: Math.round(betweennessCentrality * 100),
          degreeCentrality: Math.round(degreeCentrality * 100),
          importance
        };
      }).sort((a, b) => b.degreeCentrality - a.degreeCentrality);
      
      // Connection strengths between units and business types
      const connectionStrengths = [];
      const businessTypes = [...new Set(customers.map(c => c.businessType))];
      
      for (const unit of bankingUnits) {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        
        for (const businessType of businessTypes) {
          const typeCustomers = unitCustomers.filter(c => c.businessType === businessType);
          const totalRevenue = typeCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
          
          if (totalRevenue > 1000000) {
            connectionStrengths.push({
              sourceNode: unit.name,
              targetNode: businessType,
              strength: Math.round(totalRevenue / 1000000),
              type: 'revenue_connection'
            });
          }
        }
      }
      
      // Sort by strength and take top connections
      connectionStrengths.sort((a, b) => b.strength - a.strength);
      
      const performanceAnalytics = {
        topPerformingUnits,
        underPerformingUnits,
        centralityMetrics: centralityMetrics.slice(0, 10),
        connectionStrengths: connectionStrengths.slice(0, 15)
      };
      
      res.json(performanceAnalytics);
      
    } catch (error) {
      console.error("Network performance analytics error:", error);
      res.status(500).json({ error: "Failed to generate performance analytics" });
    }
  });

  // Helper function for business type colors
  function getBusinessTypeColor(businessType: string): string {
    const colorMap: Record<string, string> = {
      'supermarket': '#ef4444',
      'restaurant': '#f97316',
      'pharmacy': '#84cc16',
      'cafe': '#06b6d4',
      'bakery': '#8b5cf6',
      'clothing': '#ec4899',
      'electronics': '#3b82f6',
      'bookstore': '#64748b',
      'jewelry': '#f59e0b',
      'auto': '#10b981'
    };
    return colorMap[businessType] || '#6b7280';
  }
  
  // Generate spider web network from business data
  app.get("/api/network/spider-web", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const bankingUnits = await storage.getAllBankingUnits();
      
      // Generate network nodes and edges
      const nodes: any[] = [];
      const edges: any[] = [];
      
      // Add banking unit nodes
      bankingUnits.forEach(unit => {
        nodes.push({
          id: `banking_unit_${unit.id}`,
          nodeType: 'banking_unit',
          entityId: unit.id,
          label: unit.name,
          value: 0,
          group: 'banking_units',
          color: unit.unitType === 'branch' ? '#3b82f6' : unit.unitType === 'counter' ? '#10b981' : '#f59e0b',
          size: 20,
          properties: {
            unitType: unit.unitType,
            code: unit.code,
            address: unit.address
          }
        });
      });
      
      // Add business type nodes (aggregated)
      const businessTypes = [...new Set(customers.map(c => c.businessType))];
      businessTypes.forEach(businessType => {
        const businessCustomers = customers.filter(c => c.businessType === businessType);
        const totalRevenue = businessCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        
        nodes.push({
          id: `business_type_${businessType}`,
          nodeType: 'business_type',
          entityId: businessType,
          label: businessType,
          value: totalRevenue,
          group: 'business_types',
          color: getBusinessTypeColor(businessType),
          size: Math.max(10, Math.min(50, businessCustomers.length * 2)),
          properties: {
            customerCount: businessCustomers.length,
            avgRevenue: businessCustomers.length > 0 ? totalRevenue / businessCustomers.length : 0
          }
        });
      });
      
      // Create edges between banking units and business types
      bankingUnits.forEach(unit => {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        const unitBusinessTypes = [...new Set(unitCustomers.map(c => c.businessType))];
        
        unitBusinessTypes.forEach(businessType => {
          const typeCustomers = unitCustomers.filter(c => c.businessType === businessType);
          const totalRevenue = typeCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
          
          if (typeCustomers.length > 0) {
            edges.push({
              id: `edge_${unit.id}_${businessType}`,
              sourceNodeId: `banking_unit_${unit.id}`,
              targetNodeId: `business_type_${businessType}`,
              edgeType: 'banking_connection',
              weight: typeCustomers.length / Math.max(unitCustomers.length, 1),
              value: totalRevenue,
              color: '#64748b',
              width: Math.max(1, Math.min(8, typeCustomers.length / 2)),
              properties: {
                customerCount: typeCustomers.length,
                revenue: totalRevenue
              }
            });
          }
        });
      });
      
      res.json({
        nodes,
        edges,
        metadata: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          businessTypeCount: businessTypes.length,
          bankingUnitCount: bankingUnits.length,
          territoryCount: 0
        }
      });
      
    } catch (error) {
      console.error("Network generation error:", error);
      res.status(500).json({ error: "Failed to generate network data" });
    }
  });
  
  // Get network statistics
  app.get("/api/network/statistics", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const bankingUnits = await storage.getAllBankingUnits();
      const businessTypes = [...new Set(customers.map(c => c.businessType))];
      
      // Calculate network metrics
      const totalConnections = bankingUnits.reduce((sum, unit) => {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        const unitBusinessTypes = [...new Set(unitCustomers.map(c => c.businessType))];
        return sum + unitBusinessTypes.length;
      }, 0);
      
      const avgConnections = bankingUnits.length > 0 ? totalConnections / bankingUnits.length : 0;
      
      // Revenue flow analysis
      const totalRevenue = customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
      const businessTypeRevenue = businessTypes.map(type => {
        const typeCustomers = customers.filter(c => c.businessType === type);
        const revenue = typeCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        return {
          businessType: type,
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
          customerCount: typeCustomers.length
        };
      }).sort((a, b) => b.revenue - a.revenue);
      
      res.json({
        nodeCount: businessTypes.length + bankingUnits.length,
        edgeCount: totalConnections,
        avgConnections,
        totalRevenue,
        businessTypeDistribution: businessTypeRevenue,
        networkDensity: businessTypes.length > 1 ? (totalConnections / (businessTypes.length * (businessTypes.length - 1))) : 0
      });
      
    } catch (error) {
      console.error("Network statistics error:", error);
      res.status(500).json({ error: "Failed to calculate network statistics" });
    }
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
    try {
      // In a real implementation, this would handle multipart file upload
      // For now, we return a success response since the Excel parsing 
      // happens on the client side for better user experience
      res.json({
        message: "Excel file processing completed on client side",
        success: true
      });
    } catch (error) {
      console.error("Excel upload error:", error);
      res.status(500).json({
        error: "خطا در پردازش فایل Excel",
        success: false
      });
    }
  });


  // Secure bulk import endpoint for validated customer data
  app.post("/api/excel/import", async (req, res) => {
    try {
      const { customers } = req.body;
      
      // Validate request structure
      if (!Array.isArray(customers)) {
        return res.status(400).json({
          error: "فرمت درخواست نامعتبر است",
          success: false
        });
      }

      // Limit number of customers per batch to prevent DoS
      const MAX_BATCH_SIZE = 1000;
      if (customers.length > MAX_BATCH_SIZE) {
        return res.status(400).json({
          error: `حداکثر ${MAX_BATCH_SIZE} مشتری در هر بار قابل پردازش است`,
          success: false
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ row: number; message: string }> = [];

      // Get all branches for validation
      const branches = await storage.getAllBranches();
      const defaultBranch = branches.find(b => b.code === 'TBR-001') || branches[0];

      if (!defaultBranch) {
        return res.status(500).json({
          error: "هیچ شعبه‌ای در سیستم یافت نشد",
          success: false
        });
      }

      // Process customers in batches
      for (let i = 0; i < customers.length; i++) {
        const customerData = customers[i];
        
        try {
          // Find matching branch if specified
          let branchId = defaultBranch.id;
          if (customerData.branch) {
            const matchingBranch = branches.find(b => 
              b.name === customerData.branch || b.code === customerData.branch
            );
            if (matchingBranch) {
              branchId = matchingBranch.id;
            } else {
              throw new Error(`شعبه "${customerData.branch}" یافت نشد`);
            }
          }

          // Process and validate geo-location data
          let latitude: string | null = null;
          let longitude: string | null = null;
          
          if (customerData.latitude && customerData.longitude) {
            const lat = parseFloat(customerData.latitude);
            const lng = parseFloat(customerData.longitude);
            
            // Validate coordinates are within valid range
            if (!isNaN(lat) && !isNaN(lng) && 
                lat >= -90 && lat <= 90 && 
                lng >= -180 && lng <= 180) {
              latitude = lat.toString();
              longitude = lng.toString();
            }
          }

          // Validate customer data against schema
          const validatedData = insertCustomerSchema.parse({
            shopName: customerData.shopName,
            ownerName: customerData.ownerName,
            phone: customerData.phone,
            businessType: customerData.businessType || 'سایر',
            address: customerData.address || '',
            latitude: latitude,
            longitude: longitude,
            monthlyProfit: customerData.monthlyProfit || 0,
            status: customerData.status || 'active',
            branchId: branchId,
            supportEmployeeId: null
          });

          // Create customer in database
          await storage.createCustomer(validatedData);
          successCount++;

        } catch (validationError) {
          errorCount++;
          errors.push({
            row: i + 1,
            message: validationError instanceof Error ? 
              validationError.message : 
              'خطا در اعتبارسنجی داده‌ها'
          });
        }
      }

      res.json({
        success: true,
        summary: {
          total: customers.length,
          success: successCount,
          errors: errorCount,
          errorDetails: errors.slice(0, 100) // Limit error details to prevent large responses
        }
      });

    } catch (error) {
      console.error("Excel import error:", error);
      res.status(500).json({
        error: "خطا در پردازش داده‌های Excel",
        success: false
      });
    }
  });

  app.get("/api/excel/sample", async (req, res) => {
    try {
      // Return sample Excel file structure for documentation
      res.json({
        fields: [
          {
            name: "نام فروشگاه",
            required: true,
            type: "text",
            description: "نام کامل فروشگاه یا مغازه"
          },
          {
            name: "نام مالک", 
            required: true,
            type: "text",
            description: "نام و نام خانوادگی مالک کسب‌وکار"
          },
          {
            name: "شماره تماس",
            required: true,
            type: "text", 
            description: "شماره موبایل (11 رقم، شروع با 09)"
          },
          {
            name: "نوع کسب‌وکار",
            required: false,
            type: "text",
            description: "مانند: سوپرمارکت، داروخانه، رستوران و ..."
          },
          {
            name: "آدرس",
            required: false,
            type: "text",
            description: "آدرس کامل محل کسب‌وکار"
          },
          {
            name: "سود ماهانه",
            required: false,
            type: "number",
            description: "مقدار سود ماهانه به تومان"
          },
          {
            name: "وضعیت",
            required: false,
            type: "text",
            description: "یکی از: active، inactive، marketing، loss، collected"
          },
          {
            name: "شعبه",
            required: false,
            type: "text", 
            description: "نام شعبه مربوطه"
          },
          {
            name: "کارمند پشتیبان",
            required: false,
            type: "text",
            description: "نام کارمند پشتیبان"
          },
          {
            name: "عرض جغرافیایی",
            required: false,
            type: "number",
            description: "مختصات عرض جغرافیایی (latitude) - مثال: 38.0792"
          },
          {
            name: "طول جغرافیایی",
            required: false,
            type: "number",
            description: "مختصات طول جغرافیایی (longitude) - مثال: 46.2887"
          }
        ],
        sampleDownloadUrl: "/api/excel/sample-download"
      });
    } catch (error) {
      console.error("Excel sample error:", error);
      res.status(500).json({
        error: "خطا در دریافت نمونه فایل Excel"
      });
    }
  });

  // New endpoint for sample file download (optional - client handles this)
  app.get("/api/excel/sample-download", async (req, res) => {
    res.json({
      message: "Sample Excel file download is handled on the client side for better performance"
    });
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time monitoring
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws/monitoring'
  });

  wss.on('connection', (ws) => {
    console.log('🔗 Client connected to real-time monitoring. Total clients:', wsClients.size + 1);
    wsClients.add(ws);

    // Send initial device status
    ws.send(JSON.stringify({
      type: 'initial_status',
      timestamp: new Date().toISOString(),
      message: 'Connected to POS monitoring system'
    }));

    // Handle client disconnect
    ws.on('close', () => {
      wsClients.delete(ws);
      console.log('Client disconnected from monitoring');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });

  // Broadcast updates to all connected clients
  const broadcastUpdate = (data: any) => {
    const message = JSON.stringify(data);
    wsClients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          wsClients.delete(client);
        }
      }
    });
  };

  // Start real-time device status simulation
  const startDeviceStatusSimulation = () => {
    if (deviceStatusSimulation) {
      clearInterval(deviceStatusSimulation);
    }

    deviceStatusSimulation = setInterval(async () => {
      try {
        const devices = await storage.getAllPosDevices();
        console.log(`📊 Device simulation tick: checking ${devices.length} devices, ${wsClients.size} connected clients`);
        
        // Simulate random device status changes
        for (const device of devices) {
          const shouldUpdate = Math.random() < 0.1; // 10% chance of status change
          
          if (shouldUpdate) {
            const currentStatus = device.status;
            let newStatus = currentStatus;
            
            // Random status transitions
            if (currentStatus === 'active') {
              newStatus = Math.random() < 0.8 ? 'active' : (Math.random() < 0.5 ? 'offline' : 'maintenance');
            } else if (currentStatus === 'offline') {
              newStatus = Math.random() < 0.6 ? 'active' : 'offline';
            } else if (currentStatus === 'maintenance') {
              newStatus = Math.random() < 0.7 ? 'active' : 'maintenance';
            }

            if (newStatus !== currentStatus) {
              // Update device status in database
              await storage.updatePosDevice(device.id, {
                status: newStatus,
                lastConnection: newStatus === 'offline' ? device.lastConnection : new Date()
              });

              // Broadcast real-time update
              broadcastUpdate({
                type: 'device_status_change',
                deviceId: device.id,
                customerId: device.customerId,
                deviceCode: device.deviceCode,
                oldStatus: currentStatus,
                newStatus: newStatus,
                timestamp: new Date().toISOString()
              });

              // Create alert for critical status changes
              if (newStatus === 'offline' && currentStatus === 'active') {
                const customer = await storage.getCustomer(device.customerId || '');
                const alertTitle = `دستگاه ${device.deviceCode} آفلاین شد`;
                const alertMessage = customer 
                  ? `دستگاه POS ${customer.shopName} (${device.deviceCode}) از شبکه قطع شده است`
                  : `دستگاه POS ${device.deviceCode} از شبکه قطع شده است`;

                const alert = await storage.createAlert({
                  title: alertTitle,
                  message: alertMessage,
                  type: 'error',
                  priority: 'high',
                  customerId: device.customerId
                });

                // Broadcast new alert
                broadcastUpdate({
                  type: 'new_alert',
                  alert: alert,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Device simulation skipped due to database connection issue');
        // Skip this simulation cycle if database is unavailable
        return;
      }
    }, 5000); // Update every 5 seconds
  };

  // Backup & Restore endpoints
  app.get("/api/backup", async (req, res) => {
    try {
      const backup = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          branches: await storage.getAllBranches(),
          employees: await storage.getAllEmployees(),
          customers: await storage.getAllCustomers(),
          posDevices: await storage.getAllPosDevices(),
          posMonthlyStats: await storage.getAllPosMonthlyStats(),
          bankingUnits: await storage.getAllBankingUnits(),
          alerts: await storage.getAllAlerts(),
          visits: await storage.getAllVisits(),
          territories: await storage.getAllTerritories(),
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=pos-backup-${new Date().toISOString().split('T')[0]}.json`);
      res.json(backup);
    } catch (error) {
      console.error('Backup error:', error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.post("/api/restore", async (req, res) => {
    try {
      const { data, clearExisting = true } = req.body;
      
      if (!data) {
        return res.status(400).json({ error: "No backup data provided" });
      }

      // Clear existing data if requested
      if (clearExisting) {
        // Clear in reverse order of dependencies using delete methods
        const allAlerts = await storage.getAllAlerts();
        for (const alert of allAlerts) {
          try {
            await storage.deleteAlert(alert.id);
          } catch (e) {
            console.warn('Failed to delete alert:', e);
          }
        }
        
        const allVisits = await storage.getAllVisits();
        for (const visit of allVisits) {
          try {
            await storage.deleteVisit(visit.id);
          } catch (e) {
            console.warn('Failed to delete visit:', e);
          }
        }
        
        const allStats = await storage.getAllPosMonthlyStats();
        for (const stat of allStats) {
          try {
            await storage.deletePosMonthlyStats(stat.id);
          } catch (e) {
            console.warn('Failed to delete stat:', e);
          }
        }
        
        const allDevices = await storage.getAllPosDevices();
        for (const device of allDevices) {
          try {
            await storage.deletePosDevice(device.id);
          } catch (e) {
            console.warn('Failed to delete device:', e);
          }
        }
        
        const allCustomers = await storage.getAllCustomers();
        for (const customer of allCustomers) {
          try {
            await storage.deleteCustomer(customer.id);
          } catch (e) {
            console.warn('Failed to delete customer:', e);
          }
        }
        
        const allTerritories = await storage.getAllTerritories();
        for (const territory of allTerritories) {
          try {
            await storage.deleteTerritory(territory.id);
          } catch (e) {
            console.warn('Failed to delete territory:', e);
          }
        }
        
        const allEmployees = await storage.getAllEmployees();
        for (const employee of allEmployees) {
          try {
            await storage.deleteEmployee(employee.id);
          } catch (e) {
            console.warn('Failed to delete employee:', e);
          }
        }
        
        const allBranches = await storage.getAllBranches();
        for (const branch of allBranches) {
          try {
            await storage.deleteBranch(branch.id);
          } catch (e) {
            console.warn('Failed to delete branch:', e);
          }
        }
        
        const allBankingUnits = await storage.getAllBankingUnits();
        for (const unit of allBankingUnits) {
          try {
            await storage.deleteBankingUnit(unit.id);
          } catch (e) {
            console.warn('Failed to delete banking unit:', e);
          }
        }
      }

      // Restore data in correct order
      const restored: any = {
        branches: 0,
        employees: 0,
        customers: 0,
        posDevices: 0,
        posMonthlyStats: 0,
        bankingUnits: 0,
        alerts: 0,
        visits: 0,
        territories: 0,
      };

      // Restore banking units first
      if (data.bankingUnits) {
        for (const unit of data.bankingUnits) {
          try {
            await storage.createBankingUnit(unit);
            restored.bankingUnits++;
          } catch (error) {
            console.warn('Failed to restore banking unit:', error);
          }
        }
      }

      // Restore branches
      if (data.branches) {
        for (const branch of data.branches) {
          try {
            await storage.createBranch(branch);
            restored.branches++;
          } catch (error) {
            console.warn('Failed to restore branch:', error);
          }
        }
      }

      // Restore employees
      if (data.employees) {
        for (const employee of data.employees) {
          try {
            await storage.createEmployee(employee);
            restored.employees++;
          } catch (error) {
            console.warn('Failed to restore employee:', error);
          }
        }
      }

      // Restore territories
      if (data.territories) {
        for (const territory of data.territories) {
          try {
            await storage.createTerritory(territory);
            restored.territories++;
          } catch (error) {
            console.warn('Failed to restore territory:', error);
          }
        }
      }

      // Restore customers
      if (data.customers) {
        for (const customer of data.customers) {
          try {
            await storage.createCustomer(customer);
            restored.customers++;
          } catch (error) {
            console.warn('Failed to restore customer:', error);
          }
        }
      }

      // Restore POS devices
      if (data.posDevices) {
        for (const device of data.posDevices) {
          try {
            await storage.createPosDevice(device);
            restored.posDevices++;
          } catch (error) {
            console.warn('Failed to restore POS device:', error);
          }
        }
      }

      // Restore POS monthly stats
      if (data.posMonthlyStats) {
        for (const stat of data.posMonthlyStats) {
          try {
            await storage.createPosMonthlyStats(stat);
            restored.posMonthlyStats++;
          } catch (error) {
            console.warn('Failed to restore POS monthly stat:', error);
          }
        }
      }

      // Restore alerts
      if (data.alerts) {
        for (const alert of data.alerts) {
          try {
            await storage.createAlert(alert);
            restored.alerts++;
          } catch (error) {
            console.warn('Failed to restore alert:', error);
          }
        }
      }

      // Restore visits
      if (data.visits) {
        for (const visit of data.visits) {
          try {
            await storage.createVisit(visit);
            restored.visits++;
          } catch (error) {
            console.warn('Failed to restore visit:', error);
          }
        }
      }

      res.json({ 
        success: true, 
        message: "Backup restored successfully",
        restored 
      });
    } catch (error) {
      console.error('Restore error:', error);
      res.status(500).json({ error: "Failed to restore backup" });
    }
  });

  // Desktop download routes
  app.get("/api/desktop/files", async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const files = [];
      
      // Check for Standalone (recommended)
      const standalonePath = path.join(process.cwd(), 'POS-Standalone.tar.gz');
      try {
        const standaloneStats = await fs.stat(standalonePath);
        files.push({
          name: 'POS-Standalone.tar.gz',
          size: standaloneStats.size,
          sizeFormatted: `${(standaloneStats.size / 1024 / 1024).toFixed(1)} MB`,
          type: 'standalone',
          path: '/api/desktop/download/standalone',
          recommended: true,
          description: 'نسخه سبک و سریع - بدون Electron (نیاز به Node.js)'
        });
      } catch (err) {
        console.log('Standalone file not found');
      }
      
      // Check for Complete Portable (with Electron but may not work)
      const portableCompletePath = path.join(process.cwd(), 'POS-Portable-Complete.tar.gz');
      try {
        const portableStats = await fs.stat(portableCompletePath);
        files.push({
          name: 'POS-Portable-Complete.tar.gz',
          size: portableStats.size,
          sizeFormatted: `${(portableStats.size / 1024 / 1024).toFixed(1)} MB`,
          type: 'portable',
          path: '/api/desktop/download/portable',
          warning: 'ممکن است در Windows کار نکند (native dependencies مشکل دارد)'
        });
      } catch (err) {
        console.log('Portable Complete file not found');
      }
      
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: "Failed to list desktop files" });
    }
  });

  app.get("/api/desktop/download/standalone", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'POS-Standalone.tar.gz');
      
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="POS-Standalone.tar.gz"');
      
      const fs = await import('fs');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Download error:', error);
        res.status(500).json({ error: "Download failed" });
      });
    } catch (error) {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.get("/api/desktop/download/portable", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'POS-Portable-Complete.tar.gz');
      
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', 'attachment; filename="POS-Portable-Complete.tar.gz"');
      
      const fs = await import('fs');
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error('Download error:', error);
        res.status(500).json({ error: "Download failed" });
      });
    } catch (error) {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Direct download links
  app.get("/downloads/POS-Standalone.tar.gz", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'dist/public/downloads/POS-Standalone.tar.gz');
      res.download(filePath, 'POS-Standalone.tar.gz');
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  app.get("/downloads/POS-Portable-Complete.tar.gz", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'dist/public/downloads/POS-Portable-Complete.tar.gz');
      res.download(filePath, 'POS-Portable-Complete.tar.gz');
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  app.get("/downloads/README-STANDALONE.md", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'dist/public/downloads/README-STANDALONE.md');
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  app.get("/downloads/DESKTOP-INSTALL-GUIDE.md", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'dist/public/downloads/DESKTOP-INSTALL-GUIDE.md');
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  app.get("/downloads/index.html", async (req, res) => {
    try {
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'dist/public/downloads/index.html');
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  // Start the simulation when server starts  
  console.log('🔄 Starting real-time POS device monitoring simulation...');
  startDeviceStatusSimulation();
  console.log('✅ WebSocket server and device simulation initialized');

  return httpServer;
}
