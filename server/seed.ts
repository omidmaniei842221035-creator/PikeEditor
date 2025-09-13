import { db } from "./db";
import { users, branches, employees, customers, posDevices, transactions, alerts } from "@shared/schema";

async function seedDatabase() {
  console.log("🌱 Seeding database with sample data...");

  // Clear existing data
  await db.delete(alerts);
  await db.delete(transactions);
  await db.delete(posDevices);
  await db.delete(employees);
  await db.delete(customers);
  await db.delete(branches);
  await db.delete(users);

  // Create sample branches (Tabriz POS offices)
  const sampleBranches = await db.insert(branches).values([
    {
      id: "branch-1",
      name: "شعبه مرکزی تبریز",
      code: "TBR-001",
      type: "شعبه",
      manager: "احمد رضایی",
      address: "تبریز، خیابان ولیعصر، پلاک ۱۲۳",
      phone: "041-33456789",
      latitude: "38.08000000",
      longitude: "46.29190000",
      coverageRadius: 10,
      monthlyTarget: 500,
      performance: 85
    },
    {
      id: "branch-2", 
      name: "شعبه بازار تبریز",
      code: "TBR-002",
      type: "شعبه",
      manager: "فاطمه احمدی",
      address: "تبریز، بازار تبریز، محل ۴۵",
      phone: "041-33567890",
      latitude: "38.07420000",
      longitude: "46.29440000",
      coverageRadius: 8,
      monthlyTarget: 350,
      performance: 78
    },
    {
      id: "branch-3",
      name: "شعبه شهرک صنعتی",
      code: "TBR-003",
      type: "شعبه",
      manager: "حسین نوری",
      address: "تبریز، شهرک صنعتی، فاز ۲",
      phone: "041-33678901",
      latitude: "38.09000000",
      longitude: "46.31000000",
      coverageRadius: 12,
      monthlyTarget: 280,
      performance: 92
    }
  ]).returning();

  // Create sample users
  const sampleUsers = await db.insert(users).values([
    {
      id: "user-1",
      username: "admin",
      password: "hashedpassword123",
      name: "مدیر سیستم",
      role: "admin"
    },
    {
      id: "user-2",
      username: "manager",
      password: "hashedpassword123", 
      name: "احمد رضایی",
      role: "manager"
    }
  ]).returning();

  // Create sample employees
  const sampleEmployees = await db.insert(employees).values([
    {
      id: "emp-1",
      employeeCode: "EMP001",
      branchId: "branch-1",
      name: "علی احمدی",
      position: "مدیر فروش",
      phone: "09141234567",
      email: "ali@tabrizpos.com",
      salary: 25000000,
      hireDate: new Date("2023-01-15"),
      isActive: true
    },
    {
      id: "emp-2",
      employeeCode: "EMP002",
      branchId: "branch-1", 
      name: "فاطمه کریمی",
      position: "کارشناس فنی",
      phone: "09142345678",
      email: "fateme@tabrizpos.com",
      salary: 20000000,
      hireDate: new Date("2023-03-01"),
      isActive: true
    },
    {
      id: "emp-3",
      employeeCode: "EMP003",
      branchId: "branch-2",
      name: "حسین نوری",
      position: "تکنسین",
      phone: "09143456789",
      email: "hossein@tabrizpos.com", 
      salary: 18000000,
      hireDate: new Date("2023-05-10"),
      isActive: true
    }
  ]).returning();

  // Create sample customers with different statuses for testing 5-color system
  const sampleCustomers = await db.insert(customers).values([
    {
      id: "cust-1",
      branchId: "branch-1",
      shopName: "رستوران سنتی آذربایجان",
      ownerName: "جواد میرزایی",
      phone: "041-33789012",
      address: "تبریز، خیابان شهریار، پلاک ۵۶",
      businessType: "رستوران",
      status: "active",
      installDate: new Date("2023-06-01"),
      latitude: "38.08300000",
      longitude: "46.29500000"
    },
    {
      id: "cust-2",
      branchId: "branch-1",
      shopName: "سوپرمارکت پردیس",
      ownerName: "سارا عباسی",
      phone: "041-33890123",
      address: "تبریز، خیابان امام، پلاک ۱۸۹",
      businessType: "سوپرمارکت",
      status: "normal", 
      installDate: new Date("2023-07-15"),
      latitude: "38.07500000",
      longitude: "46.28800000"
    },
    {
      id: "cust-3",
      branchId: "branch-2",
      shopName: "کافه آرتین",
      ownerName: "امیر حسینی",
      phone: "041-33901234",
      address: "تبریز، خیابان فردوسی، پلاک ۷۸",
      businessType: "کافه",
      status: "marketing",
      installDate: new Date("2023-08-20"),
      latitude: "38.07900000",
      longitude: "46.30200000"
    },
    {
      id: "cust-4",
      branchId: "branch-2", 
      shopName: "فروشگاه پوشاک مدرن",
      ownerName: "مریم کاظمی",
      phone: "041-34012345",
      address: "تبریز، پاساژ بازار، طبقه دوم",
      businessType: "پوشاک",
      status: "loss",
      installDate: new Date("2023-09-10"),
      latitude: "38.07400000",
      longitude: "46.29400000"
    },
    {
      id: "cust-5",
      branchId: "branch-3",
      shopName: "داروخانه شفا",
      ownerName: "دکتر محسن رفیعی",
      phone: "041-34123456",
      address: "تبریز، شهرک صنعتی، بلوار اصلی",
      businessType: "داروخانه",
      status: "collected",
      installDate: new Date("2023-10-05"),
      latitude: "38.09200000",
      longitude: "46.31200000"
    }
  ]).returning();

  // Create sample POS devices
  const sampleDevices = await db.insert(posDevices).values([
    {
      id: "pos-1",
      customerId: "cust-1",
      deviceCode: "TBZ001001",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-2", 
      customerId: "cust-2",
      deviceCode: "TBZ001002",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-3",
      customerId: "cust-3",
      deviceCode: "TBZ001003",
      status: "maintenance",
      lastConnection: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: "pos-4",
      customerId: "cust-4",
      deviceCode: "TBZ001004",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-5",
      customerId: "cust-5",
      deviceCode: "TBZ001005",
      status: "active",
      lastConnection: new Date()
    }
  ]).returning();

  // Create sample transactions
  const sampleTransactions = await db.insert(transactions).values([
    {
      id: "txn-1",
      posDeviceId: "pos-1",
      amount: 125000,
      transactionDate: new Date("2024-09-11T10:30:00")
    },
    {
      id: "txn-2",
      posDeviceId: "pos-2", 
      amount: 89000,
      transactionDate: new Date("2024-09-11T11:15:00")
    },
    {
      id: "txn-3",
      posDeviceId: "pos-1",
      amount: 235000,
      transactionDate: new Date("2024-09-11T14:20:00")
    },
    {
      id: "txn-4",
      posDeviceId: "pos-4",
      amount: 156000,
      transactionDate: new Date("2024-09-11T16:45:00")
    },
    {
      id: "txn-5",
      posDeviceId: "pos-5",
      amount: 78000,
      transactionDate: new Date("2024-09-11T18:30:00")
    }
  ]).returning();

  // Create sample alerts
  const sampleAlerts = await db.insert(alerts).values([
    {
      id: "alert-1",
      type: "warning",
      title: "دستگاه آفلاین",
      message: "دستگاه POS کافه آرتین از ۲۴ ساعت قبل آفلاین است",
      customerId: "cust-3",
      isRead: false,
      priority: "medium"
    },
    {
      id: "alert-2",
      type: "info",
      title: "تراکنش بالا",
      message: "رستوران سنتی آذربایجان امروز ۳۵ تراکنش موفق داشته است",
      customerId: "cust-1",
      isRead: false,
      priority: "low"
    },
    {
      id: "alert-3",
      type: "error",
      title: "خطای سیستم",
      message: "نیاز به بروزرسانی نرم‌افزار برای دستگاه سوپرمارکت پردیس",
      customerId: "cust-2",
      isRead: true,
      priority: "high"
    }
  ]).returning();

  console.log("✅ Database seeded successfully!");
  console.log(`Created: ${sampleBranches.length} branches, ${sampleUsers.length} users, ${sampleEmployees.length} employees`);
  console.log(`Created: ${sampleCustomers.length} customers, ${sampleDevices.length} POS devices`); 
  console.log(`Created: ${sampleTransactions.length} transactions, ${sampleAlerts.length} alerts`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error seeding database:", error);
      process.exit(1);
    });
}