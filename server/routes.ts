import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertCustomerSchema, insertEmployeeSchema, insertBranchSchema, insertAlertSchema, insertPosDeviceSchema } from "@shared/schema";
import { z } from "zod";

// WebSocket connection management
const wsClients = new Set<any>();
let deviceStatusSimulation: NodeJS.Timeout | null = null;

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

          // Validate customer data against schema
          const validatedData = insertCustomerSchema.parse({
            shopName: customerData.shopName,
            ownerName: customerData.ownerName,
            phone: customerData.phone,
            businessType: customerData.businessType || 'سایر',
            address: customerData.address || '',
            monthlyProfit: customerData.monthlyProfit || 0,
            status: customerData.status || 'active',
            branchId: branchId,
            supportEmployeeId: null // TODO: Add employee validation in future
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
        console.error('Error in device status simulation:', error);
      }
    }, 5000); // Update every 5 seconds
  };

  // Start the simulation when server starts  
  console.log('🔄 Starting real-time POS device monitoring simulation...');
  startDeviceStatusSimulation();
  console.log('✅ WebSocket server and device simulation initialized');

  return httpServer;
}
