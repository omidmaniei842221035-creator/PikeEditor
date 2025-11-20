import { db, schema } from "./db";

// Use schema from db.ts which switches between PostgreSQL and SQLite based on environment
const { users, branches, employees, customers, posDevices, transactions, alerts, posMonthlyStats, bankingUnits } = schema;

export async function seedDatabase() {
  console.log("🌱 Seeding database with sample data...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(alerts);
  await db.delete(transactions);
  await db.delete(posDevices);
  await db.delete(posMonthlyStats);
  await db.delete(customers);
  await db.delete(employees);
  await db.delete(branches);
  await db.delete(users);
  await db.delete(bankingUnits);

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

  // Create sample banking units (واحدهای بانکی)
  const sampleBankingUnits = await db.insert(bankingUnits).values([
    {
      id: "unit-1",
      code: "BU-001", 
      name: "واحد بانکی مرکز شهر تبریز",
      unitType: "branch",
      managerName: "آقای رحیمی",
      phone: "041-33445566",
      address: "تبریز، میدان ساعت، ساختمان بانک مرکزی",
      latitude: "38.08100000",
      longitude: "46.29200000",
      isActive: true
    },
    {
      id: "unit-2",
      code: "BU-002",
      name: "واحد بانکی بازار تبریز", 
      unitType: "counter",
      managerName: "خانم احمدی",
      phone: "041-33556677",
      address: "تبریز، بازار تبریز، راسته طلافروشان",
      latitude: "38.07500000", 
      longitude: "46.29500000",
      isActive: true
    },
    {
      id: "unit-3",
      code: "BU-003",
      name: "پیشخوان شهربانک شهرک صنعتی",
      unitType: "shahrbnet_kiosk",
      managerName: "آقای نوری",
      phone: "041-34667788",
      address: "تبریز، شهرک صنعتی، فاز ۲، مجتمع تجاری",
      latitude: "38.09100000",
      longitude: "46.31100000", 
      isActive: true
    },
    {
      id: "unit-4",
      code: "BU-004",
      name: "واحد بانکی دانشگاه تبریز",
      unitType: "branch",
      managerName: "خانم کریمی", 
      phone: "041-33778899",
      address: "تبریز، خیابان 29 بهمن، دانشگاه تبریز",
      latitude: "38.07700000",
      longitude: "46.30900000",
      isActive: true
    },
    {
      id: "unit-5", 
      code: "BU-005",
      name: "پیشخوان شهربانک ترمینال",
      unitType: "shahrbnet_kiosk",
      managerName: "آقای قاسمی",
      phone: "041-34889900", 
      address: "تبریز، ترمینال مسافربری، سالن انتظار",
      latitude: "38.06900000",
      longitude: "46.32200000",
      isActive: true
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

  // Create sample customers - 20 customers total (4 of each status)
  const sampleCustomers = await db.insert(customers).values([
    // Active status - 4 customers
    {
      id: "cust-1",
      branchId: "branch-1",
      bankingUnitId: "unit-1",
      shopName: "رستوران سنتی آذربایجان",
      ownerName: "جواد میرزایی",
      phone: "041-33789012",
      address: "تبریز، خیابان شهریار، پلاک ۵۶",
      businessType: "رستوران",
      status: "active",
      monthlyProfit: 120000000,
      installDate: new Date("2023-06-01"),
      latitude: "38.08300000",
      longitude: "46.29500000"
    },
    {
      id: "cust-6",
      branchId: "branch-1",
      bankingUnitId: "unit-1",
      shopName: "فروشگاه زنجیره‌ای ایران",
      ownerName: "حسن محمدی",
      phone: "041-33567890",
      address: "تبریز، میدان ساعت، کوچه گل",
      businessType: "سوپرمارکت",
      status: "active",
      monthlyProfit: 150000000,
      installDate: new Date("2024-01-15"),
      latitude: "38.08100000",
      longitude: "46.29100000"
    },
    {
      id: "cust-11",
      branchId: "branch-1",
      bankingUnitId: "unit-1",
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
      id: "cust-16",
      branchId: "branch-1",
      bankingUnitId: "unit-1",
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

    // Normal status - 4 customers
    {
      id: "cust-2",
      branchId: "branch-1",
      bankingUnitId: "unit-2",
      shopName: "سوپرمارکت پردیس",
      ownerName: "سارا عباسی",
      phone: "041-33890123",
      address: "تبریز، خیابان امام، پلاک ۱۸۹",
      businessType: "سوپرمارکت",
      status: "normal", 
      monthlyProfit: 100000000,
      installDate: new Date("2023-07-15"),
      latitude: "38.07500000",
      longitude: "46.28800000"
    },
    {
      id: "cust-7",
      branchId: "branch-2", 
      bankingUnitId: "unit-2",
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
      id: "cust-12",
      branchId: "branch-3",
      bankingUnitId: "unit-4",
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
      id: "cust-17",
      branchId: "branch-2",
      bankingUnitId: "unit-2",
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

    // Marketing status - 4 customers
    {
      id: "cust-3",
      branchId: "branch-2",
      bankingUnitId: "unit-3",
      shopName: "کافه آرتین",
      ownerName: "امیر حسینی",
      phone: "041-33901234",
      address: "تبریز، خیابان فردوسی، پلاک ۷۸",
      businessType: "کافه",
      status: "marketing",
      monthlyProfit: 55000000,
      installDate: new Date("2023-08-20"),
      latitude: "38.07900000",
      longitude: "46.30200000"
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
      id: "cust-18",
      branchId: "branch-3",
      bankingUnitId: "unit-5",
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

    // Loss status - 4 customers
    {
      id: "cust-4",
      branchId: "branch-2", 
      shopName: "فروشگاه پوشاک مدرن",
      ownerName: "مریم کاظمی",
      phone: "041-34012345",
      address: "تبریز، پاساژ بازار، طبقه دوم",
      businessType: "پوشاک",
      status: "loss",
      monthlyProfit: -25000000,
      installDate: new Date("2023-09-10"),
      latitude: "38.07400000",
      longitude: "46.29400000"
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

    // Collected status - 4 customers
    {
      id: "cust-5",
      branchId: "branch-3",
      shopName: "داروخانه شفا",
      ownerName: "دکتر محسن رفیعی",
      phone: "041-34123456",
      address: "تبریز، شهرک صنعتی، بلوار اصلی",
      businessType: "داروخانه",
      status: "collected",
      monthlyProfit: 0,
      installDate: new Date("2023-10-05"),
      latitude: "38.09200000",
      longitude: "46.31200000"
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
    }
  ]).returning();

  // Create sample POS devices (20 devices for 20 customers)
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
      lastConnection: new Date(Date.now() - 24 * 60 * 60 * 1000)
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
    },
    {
      id: "pos-6",
      customerId: "cust-6",
      deviceCode: "TBZ001006",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-7", 
      customerId: "cust-7",
      deviceCode: "TBZ001007",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-8",
      customerId: "cust-8",
      deviceCode: "TBZ001008",
      status: "maintenance",
      lastConnection: new Date(Date.now() - 12 * 60 * 60 * 1000)
    },
    {
      id: "pos-9",
      customerId: "cust-9",
      deviceCode: "TBZ001009",
      status: "offline",
      lastConnection: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      id: "pos-10",
      customerId: "cust-10",
      deviceCode: "TBZ001010",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-11",
      customerId: "cust-11",
      deviceCode: "TBZ001011",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-12", 
      customerId: "cust-12",
      deviceCode: "TBZ001012",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-13",
      customerId: "cust-13",
      deviceCode: "TBZ001013",
      status: "maintenance",
      lastConnection: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: "pos-14",
      customerId: "cust-14",
      deviceCode: "TBZ001014",
      status: "offline",
      lastConnection: new Date(Date.now() - 72 * 60 * 60 * 1000)
    },
    {
      id: "pos-15",
      customerId: "cust-15",
      deviceCode: "TBZ001015",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-16",
      customerId: "cust-16",
      deviceCode: "TBZ001016",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-17", 
      customerId: "cust-17",
      deviceCode: "TBZ001017",
      status: "active",
      lastConnection: new Date()
    },
    {
      id: "pos-18",
      customerId: "cust-18",
      deviceCode: "TBZ001018",
      status: "maintenance",
      lastConnection: new Date(Date.now() - 18 * 60 * 60 * 1000)
    },
    {
      id: "pos-19",
      customerId: "cust-19",
      deviceCode: "TBZ001019",
      status: "offline",
      lastConnection: new Date(Date.now() - 96 * 60 * 60 * 1000)
    },
    {
      id: "pos-20",
      customerId: "cust-20",
      deviceCode: "TBZ001020",
      status: "active",
      lastConnection: new Date()
    }
  ]).returning();

  // Create sample transactions
  const sampleTransactions = await db.insert(transactions).values([
    {
      id: "tx-1",
      posDeviceId: "pos-1",
      amount: 15000000,
      transactionDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: "tx-2",
      posDeviceId: "pos-6",
      amount: 25000000,
      transactionDate: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: "tx-3",
      posDeviceId: "pos-11",
      amount: 8000000,
      transactionDate: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: "tx-4",
      posDeviceId: "pos-16",
      amount: 45000000,
      transactionDate: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: "tx-5",
      posDeviceId: "pos-2",
      amount: 12000000,
      transactionDate: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  ]).returning();

  // Create sample POS monthly stats
  const currentYear = new Date().getFullYear();
  const samplePosStats = [];

  // Generate stats for each branch for the last 12 months
  for (const branch of sampleBranches) {
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const date = new Date();
      date.setMonth(date.getMonth() - monthOffset);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      // Find customers for this branch
      const branchCustomers = sampleCustomers.filter((c: any) => c.branchId === branch.id);
      
      for (const customer of branchCustomers) {
        // Generate varying stats based on branch performance and randomness
        const baseRevenue = Math.random() * 50000000 + 20000000; // 20-70M تومان
        const performanceFactor = (branch.performance || 80) / 100;
        const seasonalFactor = month <= 3 || month >= 11 ? 1.2 : 0.9; // Winter boost
        
        const revenue = Math.floor(baseRevenue * performanceFactor * seasonalFactor);
        const profit = Math.floor(revenue * (0.15 + Math.random() * 0.1)); // 15-25% profit margin
        const transactions = Math.floor(100 + Math.random() * 200); // 100-300 transactions
        
        samplePosStats.push({
          customerId: customer.id,
          branchId: branch.id,
          year,
          month,
          totalTransactions: transactions,
          totalAmount: revenue,
          revenue,
          profit,
          status: customer.status || "active",
          notes: `آمار ${month}/${year} - ${branch.name}`
        });
      }
    }
  }

  const posStatsResult = await db.insert(posMonthlyStats).values(samplePosStats).returning();

  // Create sample alerts
  const sampleAlerts = await db.insert(alerts).values([
    {
      id: "alert-1",
      title: "دستگاه pos-9 آفلاین شد",
      message: "دستگاه POS تعمیرگاه خودرو فردوس از شبکه قطع شده است",
      type: "error",
      isRead: false,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      id: "alert-2", 
      title: "دستگاه pos-14 نیاز به تعمیر",
      message: "دستگاه POS کتابفروشی دانش برای مدت طولانی آفلاین است",
      type: "warning",
      isRead: false,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
    },
    {
      id: "alert-3",
      title: "دستگاه pos-19 قطع شده",
      message: "دستگاه POS کلینیک دندانپزشکی نگین از شبکه قطع شده است",
      type: "error", 
      isRead: false,
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000)
    }
  ]).returning();

  console.log(`Created: ${sampleCustomers.length} customers, ${sampleDevices.length} POS devices, ${posStatsResult.length} monthly stats`); 
  console.log("✅ Database seeded successfully!");
}