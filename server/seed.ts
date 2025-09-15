import { db } from "./db";
import { users, branches, employees, customers, posDevices, transactions, alerts } from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Seeding database with sample data...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(alerts);
  await db.delete(transactions);
  await db.delete(posDevices);
  await db.delete(customers);
  await db.delete(employees);
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
    },
    // مشتریان اضافی برای تست نقشه با 5 وضعیت مختلف
    {
      id: "cust-6",
      branchId: "branch-1",
      shopName: "فروشگاه زنجیره‌ای ایران",
      ownerName: "حسن محمدی",
      phone: "041-33567890",
      address: "تبریز، میدان ساعت، کوچه گل",
      businessType: "فروشگاه زنجیره‌ای",
      status: "active",
      monthlyProfit: 150000000,
      installDate: new Date("2024-01-15"),
      latitude: "38.08100000",
      longitude: "46.29100000"
    },
    {
      id: "cust-7",
      branchId: "branch-2", 
      shopName: "نانوایی سنتی تبریز",
      ownerName: "علی رضایی",
      phone: "041-33456789",
      address: "تبریز، خیابان آزادی، نرسیده به چهارراه",
      businessType: "نانوایی",
      status: "normal",
      monthlyProfit: 80000000,
      installDate: new Date("2024-02-20"),
      latitude: "38.08500000", 
      longitude: "46.29800000"
    },
    {
      id: "cust-8",
      branchId: "branch-1",
      shopName: "آرایشگاه بانوان آریا",
      ownerName: "فاطمه علیزاده",
      phone: "041-33345678",
      address: "تبریز، خیابان شریعتی، پلاک ۲۳",
      businessType: "آرایشگاه زنانه",
      status: "marketing",
      monthlyProfit: 45000000,
      installDate: new Date("2024-03-10"),
      latitude: "38.08200000",
      longitude: "46.30100000"
    },
    {
      id: "cust-9",
      branchId: "branch-3",
      shopName: "تعمیرگاه خودرو فردوس",
      ownerName: "محمد جوادی",
      phone: "041-34567891",
      address: "تبریز، جاده تهران، کیلومتر ۵",
      businessType: "تعمیرگاه خودرو",
      status: "loss",
      monthlyProfit: -20000000,
      installDate: new Date("2024-04-05"),
      latitude: "38.07200000",
      longitude: "46.30500000"
    },
    {
      id: "cust-10",
      branchId: "branch-2",
      shopName: "موبایل فروشی تک‌تک",
      ownerName: "رضا کریمی",
      phone: "041-33234567",
      address: "تبریز، پاساژ علاالدین، واحد ۱۵",
      businessType: "موبایل‌فروشی",
      status: "collected",
      monthlyProfit: 0,
      installDate: new Date("2024-01-30"),
      latitude: "38.08400000",
      longitude: "46.29300000"
    },
    {
      id: "cust-11",
      branchId: "branch-1",
      shopName: "قنادی شیرین",
      ownerName: "زهره احمدی", 
      phone: "041-33123456",
      address: "تبریز، خیابان ولیعصر، روبروی پارک",
      businessType: "قنادی",
      status: "active",
      monthlyProfit: 95000000,
      installDate: new Date("2024-05-12"),
      latitude: "38.08800000",
      longitude: "46.30400000"
    },
    {
      id: "cust-12",
      branchId: "branch-3",
      shopName: "کافه‌نت گلستان",
      ownerName: "سعید مرادی",
      phone: "041-34789012",
      address: "تبریز، دانشگاه تبریز، نزدیک خوابگاه",
      businessType: "کافه‌نت",
      status: "normal",
      monthlyProfit: 65000000,
      installDate: new Date("2024-06-01"),
      latitude: "38.07700000",
      longitude: "46.31100000"
    },
    {
      id: "cust-13",
      branchId: "branch-2",
      shopName: "لوازم خانگی پارس",
      ownerName: "امیر حسینی",
      phone: "041-33890123",
      address: "تبریز، خیابان فلکه‌سوم، مجتمع تجاری",
      businessType: "لوازم خانگی",
      status: "marketing",
      monthlyProfit: 35000000,
      installDate: new Date("2024-07-08"),
      latitude: "38.07600000",
      longitude: "46.29600000"
    },
    {
      id: "cust-14",
      branchId: "branch-1",
      shopName: "کتابفروشی دانش",
      ownerName: "دکتر احمد نوری",
      phone: "041-33456123",
      address: "تبریز، خیابان دانشسرا، نزدیک کتابخانه مرکزی",
      businessType: "کتابفروشی",
      status: "loss",
      monthlyProfit: -15000000,
      installDate: new Date("2024-08-15"),
      latitude: "38.08600000",
      longitude: "46.29700000"
    },
    {
      id: "cust-15",
      branchId: "branch-3",
      shopName: "کافه رستوران سبلان",
      ownerName: "علی اصغر باقری",
      phone: "041-34123789",
      address: "تبریز، جاده کندوان، ورودی پارک ملی",
      businessType: "کافه‌رستوران",
      status: "collected",
      monthlyProfit: 0,
      installDate: new Date("2024-09-01"),
      latitude: "38.09500000",
      longitude: "46.32000000"
    },
    // مشتریان جدید اضافی برای نقشه
    {
      id: "cust-16",
      branchId: "branch-1",
      shopName: "بانک پارسیان شعبه تبریز",
      ownerName: "مدیر شعبه حسام پور",
      phone: "041-33111222",
      address: "تبریز، خیابان امام خمینی، برج کوثر",
      businessType: "بانک",
      status: "active",
      monthlyProfit: 250000000,
      installDate: new Date("2024-02-01"),
      latitude: "38.08700000",
      longitude: "46.29000000"
    },
    {
      id: "cust-17",
      branchId: "branch-2",
      shopName: "فست‌فود برگر کینگ",
      ownerName: "شهریار امینی",
      phone: "041-33222333",
      address: "تبریز، خیابان آبرسان، مقابل پارک بعثت",
      businessType: "فست‌فود",
      status: "normal",
      monthlyProfit: 120000000,
      installDate: new Date("2024-03-15"),
      latitude: "38.07300000",
      longitude: "46.30800000"
    },
    {
      id: "cust-18",
      branchId: "branch-3",
      shopName: "آژانس مسافربری آذرخش",
      ownerName: "ابراهیم قاسمی",
      phone: "041-34333444",
      address: "تبریز، ترمینال، طبقه دوم",
      businessType: "آژانس مسافربری",
      status: "marketing",
      monthlyProfit: 60000000,
      installDate: new Date("2024-04-20"),
      latitude: "38.06900000",
      longitude: "46.32500000"
    },
    {
      id: "cust-19",
      branchId: "branch-1",
      shopName: "کلینیک دندانپزشکی نگین",
      ownerName: "دکتر مریم صادقی",
      phone: "041-33444555",
      address: "تبریز، خیابان مطهری، ساختمان پزشکان",
      businessType: "کلینیک دندانپزشکی",
      status: "loss",
      monthlyProfit: -30000000,
      installDate: new Date("2024-05-10"),
      latitude: "38.08900000",
      longitude: "46.30600000"
    },
    {
      id: "cust-20",
      branchId: "branch-2",
      shopName: "پیتزا و فست‌فود رویال",
      ownerName: "مسعود کریمی",
      phone: "041-33555666",
      address: "تبریز، خیابان جمهوری، نرسیده به پل آبی",
      businessType: "پیتزا و فست‌فود",
      status: "collected",
      monthlyProfit: 0,
      installDate: new Date("2024-06-05"),
      latitude: "38.07800000",
      longitude: "46.29200000"
    },
    {
      id: "cust-21",
      branchId: "branch-3",
      shopName: "فروشگاه طلا و جواهر آرین",
      ownerName: "حسین جواهری",
      phone: "041-34666777",
      address: "تبریز، بازار تبریز، راسته طلافروشان",
      businessType: "طلا و جواهرفروشی",
      status: "active",
      monthlyProfit: 180000000,
      installDate: new Date("2024-07-01"),
      latitude: "38.08000000",
      longitude: "46.29400000"
    },
    {
      id: "cust-22",
      branchId: "branch-1",
      shopName: "سوپرمارکت هایپر اسپید",
      ownerName: "فرهاد احمدی",
      phone: "041-33777888",
      address: "تبریز، کوی استاد شهریار، مجتمع تجاری",
      businessType: "هایپرمارکت",
      status: "normal",
      monthlyProfit: 340000000,
      installDate: new Date("2024-08-10"),
      latitude: "38.08200000",
      longitude: "46.31400000"
    },
    {
      id: "cust-23",
      branchId: "branch-2",
      shopName: "مرکز تعمیرات موبایل تک",
      ownerName: "امیرحسین مقدم",
      phone: "041-33888999",
      address: "تبریز، پاساژ کوثر، طبقه همکف",
      businessType: "تعمیرات موبایل",
      status: "marketing",
      monthlyProfit: 25000000,
      installDate: new Date("2024-09-15"),
      latitude: "38.08400000",
      longitude: "46.29800000"
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