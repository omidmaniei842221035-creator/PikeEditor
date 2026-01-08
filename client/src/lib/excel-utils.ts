import * as XLSX from 'xlsx';

export interface ExcelCustomerData {
  shopName: string;
  ownerName: string;
  phone: string;
  businessType?: string;
  address?: string;
  monthlyProfit?: number;
  status?: string;
  branch?: string;
  supportEmployee?: string;
  latitude?: string;
  longitude?: string;
  // New banking format fields (39 columns)
  nationalId?: string;
  customerNumber?: string;
  terminalCode?: string;
  companyName?: string;
  branchCode?: string;
  depositNumber?: string;
  depositTitle?: string;
  depositType?: string;
  totalTransactions?: number;
  totalTransactionAmount?: number;
  totalCost?: number;
  costShare?: number;
  avgDepositTerminal?: number;
  avgCurrentDeposit?: number;
  avgShortTermDeposit?: number;
  avgTotalDeposit?: number;
  shortTermProfit?: number;
  totalRevenue?: number;
  revenueShare?: number;
  profitLoss?: number;
  distanceToEfficiency?: number;
  installDate?: string;
  terminalStatus?: string;
  supportCode?: string;
  marketer?: string;
  notes?: string;
  reportDate?: string;
  shaprakFee?: number;
  deviceType?: string;
  customerType?: string;
  depositBranchCode?: string;
  businessCategoryCode?: string;
}

export interface ExcelBankingUnitData {
  code: string;
  name: string;
  unitType: string;
  managerName?: string;
  phone?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  isActive?: boolean;
}

export interface ExcelEmployeeData {
  employeeCode: string;
  name: string;
  position: string;
  phone?: string;
  email?: string;
  branchId?: string;
  salary?: number;
}

export interface ExcelTimeSeriesData {
  customerIdentifier: string; // کد ملی یا نام فروشگاه یا کد ترمینال
  recordDate: string; // تاریخ ثبت
  posStatus: string; // وضعیت پوز: active, inactive, efficient, inefficient
  profitability: number; // سودآوری (تومان)
  averageBalance: number; // میانگین حساب (تومان)
  transactionCount?: number; // تعداد تراکنش
  totalRevenue?: number; // درآمد کل
  notes?: string; // یادداشت‌ها
}

export async function parseExcelFile(file: File): Promise<ExcelCustomerData[]> {
  return new Promise((resolve, reject) => {
    // Check if file is Excel format
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      reject(new Error('فرمت فایل نامعتبر است. فقط فایل‌های Excel (.xlsx, .xls) پذیرفته می‌شود'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = parseExcelContent(e.target?.result);
        resolve(result);
      } catch (error) {
        reject(new Error('خطا در خواندن فایل Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('خطا در بارگذاری فایل'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function parseExcelBankingUnitsFile(file: File): Promise<ExcelBankingUnitData[]> {
  return new Promise((resolve, reject) => {
    // Check if file is Excel format
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      reject(new Error('فرمت فایل نامعتبر است. فقط فایل‌های Excel (.xlsx, .xls) پذیرفته می‌شود'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = parseBankingUnitsExcelContent(e.target?.result);
        resolve(result);
      } catch (error) {
        reject(new Error('خطا در خواندن فایل Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('خطا در بارگذاری فایل'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function parseBankingUnitsExcelContent(buffer: any): ExcelBankingUnitData[] {
  try {
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('فایل Excel خالی است');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('فایل Excel باید حداقل شامل سر ستون‌ها و یک ردیف داده باشد');
    }

    // Get headers from first row
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    // Define column mapping (Persian to English field names)
    const columnMapping: Record<string, keyof ExcelBankingUnitData> = {
      'کد واحد': 'code',
      'نام واحد': 'name',
      'نوع واحد': 'unitType',
      'نام مسئول': 'managerName',
      'شماره تماس': 'phone',
      'آدرس': 'address',
      'عرض جغرافیایی': 'latitude',
      'طول جغرافیایی': 'longitude',
      'وضعیت فعالیت': 'isActive'
    };

    // Find column indices
    const columnIndices: Record<keyof ExcelBankingUnitData, number> = {} as any;
    
    headers.forEach((header, index) => {
      const mappedField = columnMapping[header?.trim()];
      if (mappedField) {
        columnIndices[mappedField] = index;
      }
    });

    // Check if required columns exist
    const requiredFields: (keyof ExcelBankingUnitData)[] = ['code', 'name', 'unitType'];
    const missingFields = requiredFields.filter(field => columnIndices[field] === undefined);
    
    if (missingFields.length > 0) {
      const missingPersianFields = missingFields.map(field => {
        return Object.keys(columnMapping).find(key => columnMapping[key] === field);
      }).join(', ');
      throw new Error(`ستون‌های ضروری موجود نیست: ${missingPersianFields}`);
    }

    // Parse data rows
    const bankingUnits: ExcelBankingUnitData[] = [];
    
    (dataRows as any[][]).forEach((row: any[], rowIndex) => {
      // Skip empty rows
      if (row.every(cell => !cell || cell.toString().trim() === '')) {
        return;
      }

      const bankingUnit: ExcelBankingUnitData = {
        code: row[columnIndices.code]?.toString().trim() || '',
        name: row[columnIndices.name]?.toString().trim() || '',
        unitType: row[columnIndices.unitType]?.toString().trim() || 'branch',
        managerName: columnIndices.managerName !== undefined ? 
          row[columnIndices.managerName]?.toString().trim() || '' : '',
        phone: columnIndices.phone !== undefined ? 
          formatPhoneNumber(row[columnIndices.phone]?.toString() || '') : '',
        address: columnIndices.address !== undefined ? 
          row[columnIndices.address]?.toString().trim() || '' : '',
        latitude: columnIndices.latitude !== undefined ? 
          row[columnIndices.latitude]?.toString().trim() || '' : '',
        longitude: columnIndices.longitude !== undefined ? 
          row[columnIndices.longitude]?.toString().trim() || '' : '',
        isActive: columnIndices.isActive !== undefined ? 
          parseBooleanValue(row[columnIndices.isActive]) : true
      };

      bankingUnits.push(bankingUnit);
    });

    return bankingUnits;
    
  } catch (error) {
    throw new Error('خطا در پردازش فایل Excel: ' + (error as Error).message);
  }
}

function parseExcelContent(buffer: any): ExcelCustomerData[] {
  try {
    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('فایل Excel خالی است');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('فایل Excel باید حداقل شامل سر ستون‌ها و یک ردیف داده باشد');
    }

    // Get headers from first row
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    // Define column mapping (Persian to English field names)
    // Support all 39 columns from user's banking Excel format
    const columnMapping: Record<string, keyof ExcelCustomerData> = {
      // All 39 columns from user's Excel file
      'کد ملی': 'nationalId',
      'شماره مشتری': 'customerNumber',
      'نام و نام خانوادگی مشتری': 'ownerName',
      'کد ترمینال': 'terminalCode',
      'نام ترمینال': 'shopName',
      'نام شرکت': 'companyName',
      'کد شعبه': 'branchCode',
      'شماره سپرده متصل به ترمینال': 'depositNumber',
      'عنوان سپرده': 'depositTitle',
      'نوع سپرده': 'depositType',
      'موبایل': 'phone',
      'آدرس': 'address',
      'تعداد کل تراکنش های ترمینال': 'totalTransactions',
      'مبلغ کل تراکنش های ترمینال': 'totalTransactionAmount',
      'هزینه کل ترمینال': 'totalCost',
      'هزینه تسهیم به نسبت (تعداد ترمینال مشتری)': 'costShare',
      'میانگین سپرده متصل به ترمینال': 'avgDepositTerminal',
      'مجموع میانگین سپرده های جاری و قرض الحسنه پذیرنده': 'avgCurrentDeposit',
      'مجموع میانگین سپرده های کوتاه مدت پذیرنده': 'avgShortTermDeposit',
      'مجموع میانگین سپرده های جاری، قرض الحسنه و کوتاه مدت پذیرنده': 'avgTotalDeposit',
      'سود پرداختی به سپرده های کوتاه مدت پذیرنده': 'shortTermProfit',
      'درآمد کل پذیرنده': 'totalRevenue',
      'درآمد تسهیم به نسبت (تعداد ترمینال مشتری)': 'revenueShare',
      'سود و زیان': 'profitLoss',
      'فاصله تا کارآمد شدن به ازای هر پذیرنده': 'distanceToEfficiency',
      'فاصله تا کارآمد شدن به ازای هر پذیرنده ': 'distanceToEfficiency',
      'وضعیت': 'status',
      'تاریخ نصب': 'installDate',
      'وضعیت ترمینال': 'terminalStatus',
      'کد پشتیبان': 'supportCode',
      'نام پشتیبان': 'supportEmployee',
      'بازاریاب': 'marketer',
      'توضیحات': 'notes',
      'تاریخ': 'reportDate',
      'کارمزد شاپرکی': 'shaprakFee',
      'نوع دستگاه': 'deviceType',
      'نوع مشتری': 'customerType',
      'کد شعبه صاحب سپرده': 'depositBranchCode',
      'کد صنف': 'businessCategoryCode',
      'عنوان صنف': 'businessType',
      // Old format columns (for backward compatibility)
      'نام فروشگاه': 'shopName',
      'نام مالک': 'ownerName',
      'شماره تماس': 'phone',
      'نوع کسب‌وکار': 'businessType',
      'سود ماهانه': 'monthlyProfit',
      'شعبه': 'branch',
      'کارمند پشتیبان': 'supportEmployee',
      'عرض جغرافیایی': 'latitude',
      'طول جغرافیایی': 'longitude'
    };

    // Find column indices
    const columnIndices: Record<keyof ExcelCustomerData, number> = {} as any;
    
    headers.forEach((header, index) => {
      const mappedField = columnMapping[header?.trim()];
      if (mappedField) {
        columnIndices[mappedField] = index;
      }
    });

    // Check if required columns exist - support both old and new formats
    // New format requires: نام ترمینال (shopName), نام و نام خانوادگی مشتری (ownerName), موبایل (phone)
    // Old format requires: نام فروشگاه (shopName), نام مالک (ownerName), شماره تماس (phone)
    const hasNewFormat = columnIndices.terminalCode !== undefined || columnIndices.nationalId !== undefined;
    
    // For new format, shopName comes from نام ترمینال, ownerName from نام و نام خانوادگی مشتری
    // For old format, use original columns
    const requiredFields: (keyof ExcelCustomerData)[] = ['shopName', 'ownerName', 'phone'];
    const missingFields = requiredFields.filter(field => columnIndices[field] === undefined);
    
    if (missingFields.length > 0) {
      const missingPersianFields = missingFields.map(field => {
        if (hasNewFormat) {
          const newFormatMapping: Record<string, string> = {
            'shopName': 'نام ترمینال',
            'ownerName': 'نام و نام خانوادگی مشتری',
            'phone': 'موبایل'
          };
          return newFormatMapping[field] || Object.keys(columnMapping).find(key => columnMapping[key] === field);
        }
        return Object.keys(columnMapping).find(key => columnMapping[key] === field);
      }).join(', ');
      throw new Error(`ستون‌های ضروری موجود نیست: ${missingPersianFields}`);
    }

    // Parse data rows
    const customers: ExcelCustomerData[] = [];
    
    (dataRows as any[][]).forEach((row: any[], rowIndex) => {
      // Skip empty rows
      if (row.every(cell => !cell || cell.toString().trim() === '')) {
        return;
      }

      // Parse status from Persian to English
      let statusValue = 'active';
      if (columnIndices.status !== undefined) {
        const rawStatus = row[columnIndices.status]?.toString().trim() || '';
        const statusMapping: Record<string, string> = {
          'کارآمد': 'active',
          'فعال': 'active',
          'معمولی': 'active',
          'غیرفعال': 'inactive',
          'بازاریابی': 'marketing',
          'زیان‌ده': 'loss',
          'زیانده': 'loss',
          'زیان ده': 'loss',
          'جمع‌آوری شده': 'collected',
          'جمع آوری شده': 'collected',
          'درخواست جمع آوری': 'collected',
          'درخواست جمع‌آوری': 'collected'
        };
        statusValue = statusMapping[rawStatus] || rawStatus || 'active';
      }

      // Parse terminalStatus from Persian
      let terminalStatusValue = '';
      if (columnIndices.terminalStatus !== undefined) {
        const rawTerminalStatus = row[columnIndices.terminalStatus]?.toString().trim() || '';
        const terminalStatusMapping: Record<string, string> = {
          'فعال': 'active',
          'غیرفعال': 'inactive',
          'درخواست جمع آوری': 'collected',
          'درخواست جمع‌آوری': 'collected',
          'جمع آوری شده': 'collected',
          'جمع‌آوری شده': 'collected'
        };
        terminalStatusValue = terminalStatusMapping[rawTerminalStatus] || rawTerminalStatus;
      }

      // Parse dates - handle YYMMDD format (e.g., 140405 means 1404/05)
      const parseDateValue = (value: any): string => {
        if (!value) return '';
        const strValue = value.toString().trim();
        // Handle YYMMDD format (6 digits like 140405)
        if (/^\d{6}$/.test(strValue)) {
          const year = '14' + strValue.substring(0, 2);
          const month = strValue.substring(2, 4);
          const day = strValue.substring(4, 6);
          return `${year}/${month}/${day}`;
        }
        // Handle YYYY/MM/DD format
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(strValue)) {
          return strValue;
        }
        return strValue;
      };

      const customer: ExcelCustomerData = {
        shopName: row[columnIndices.shopName]?.toString().trim() || '',
        ownerName: row[columnIndices.ownerName]?.toString().trim() || '',
        phone: formatPhoneNumber(row[columnIndices.phone]?.toString() || ''),
        businessType: columnIndices.businessType !== undefined ? 
          row[columnIndices.businessType]?.toString().trim() || 'سایر' : 'سایر',
        address: columnIndices.address !== undefined ? 
          row[columnIndices.address]?.toString().trim() || '' : '',
        monthlyProfit: columnIndices.monthlyProfit !== undefined ? 
          parseMonetaryValue(row[columnIndices.monthlyProfit]) : 
          (columnIndices.revenueShare !== undefined ? parseMonetaryValue(row[columnIndices.revenueShare]) : 0),
        status: statusValue,
        branch: columnIndices.branch !== undefined ? 
          row[columnIndices.branch]?.toString().trim() || '' : 
          (columnIndices.branchCode !== undefined ? row[columnIndices.branchCode]?.toString().trim() || '' : ''),
        supportEmployee: columnIndices.supportEmployee !== undefined ? 
          row[columnIndices.supportEmployee]?.toString().trim() || '' : '',
        latitude: columnIndices.latitude !== undefined ? 
          row[columnIndices.latitude]?.toString().trim() || '' : '',
        longitude: columnIndices.longitude !== undefined ? 
          row[columnIndices.longitude]?.toString().trim() || '' : '',
        // All 39 banking format fields
        nationalId: columnIndices.nationalId !== undefined ?
          row[columnIndices.nationalId]?.toString().trim() || '' : '',
        customerNumber: columnIndices.customerNumber !== undefined ?
          row[columnIndices.customerNumber]?.toString().trim() || '' : '',
        terminalCode: columnIndices.terminalCode !== undefined ?
          row[columnIndices.terminalCode]?.toString().trim() || '' : '',
        companyName: columnIndices.companyName !== undefined ?
          row[columnIndices.companyName]?.toString().trim() || '' : '',
        branchCode: columnIndices.branchCode !== undefined ?
          row[columnIndices.branchCode]?.toString().trim() || '' : '',
        depositNumber: columnIndices.depositNumber !== undefined ?
          row[columnIndices.depositNumber]?.toString().trim() || '' : '',
        depositTitle: columnIndices.depositTitle !== undefined ?
          row[columnIndices.depositTitle]?.toString().trim() || '' : '',
        depositType: columnIndices.depositType !== undefined ?
          row[columnIndices.depositType]?.toString().trim() || '' : '',
        totalTransactions: columnIndices.totalTransactions !== undefined ?
          parseMonetaryValue(row[columnIndices.totalTransactions]) : 0,
        totalTransactionAmount: columnIndices.totalTransactionAmount !== undefined ?
          parseMonetaryValue(row[columnIndices.totalTransactionAmount]) : 0,
        totalCost: columnIndices.totalCost !== undefined ?
          parseMonetaryValue(row[columnIndices.totalCost]) : 0,
        costShare: columnIndices.costShare !== undefined ?
          parseMonetaryValue(row[columnIndices.costShare]) : 0,
        avgDepositTerminal: columnIndices.avgDepositTerminal !== undefined ?
          parseMonetaryValue(row[columnIndices.avgDepositTerminal]) : 0,
        avgCurrentDeposit: columnIndices.avgCurrentDeposit !== undefined ?
          parseMonetaryValue(row[columnIndices.avgCurrentDeposit]) : 0,
        avgShortTermDeposit: columnIndices.avgShortTermDeposit !== undefined ?
          parseMonetaryValue(row[columnIndices.avgShortTermDeposit]) : 0,
        avgTotalDeposit: columnIndices.avgTotalDeposit !== undefined ?
          parseMonetaryValue(row[columnIndices.avgTotalDeposit]) : 0,
        shortTermProfit: columnIndices.shortTermProfit !== undefined ?
          parseMonetaryValue(row[columnIndices.shortTermProfit]) : 0,
        totalRevenue: columnIndices.totalRevenue !== undefined ?
          parseMonetaryValue(row[columnIndices.totalRevenue]) : 0,
        revenueShare: columnIndices.revenueShare !== undefined ?
          parseMonetaryValue(row[columnIndices.revenueShare]) : 0,
        profitLoss: columnIndices.profitLoss !== undefined ?
          parseMonetaryValue(row[columnIndices.profitLoss]) : 0,
        distanceToEfficiency: columnIndices.distanceToEfficiency !== undefined ?
          parseMonetaryValue(row[columnIndices.distanceToEfficiency]) : 0,
        installDate: columnIndices.installDate !== undefined ?
          parseDateValue(row[columnIndices.installDate]) : '',
        terminalStatus: terminalStatusValue,
        supportCode: columnIndices.supportCode !== undefined ?
          row[columnIndices.supportCode]?.toString().trim() || '' : '',
        marketer: columnIndices.marketer !== undefined ?
          row[columnIndices.marketer]?.toString().trim() || '' : '',
        notes: columnIndices.notes !== undefined ?
          row[columnIndices.notes]?.toString().trim() || '' : '',
        reportDate: columnIndices.reportDate !== undefined ?
          parseDateValue(row[columnIndices.reportDate]) : '',
        shaprakFee: columnIndices.shaprakFee !== undefined ?
          parseMonetaryValue(row[columnIndices.shaprakFee]) : 0,
        deviceType: columnIndices.deviceType !== undefined ?
          row[columnIndices.deviceType]?.toString().trim() || '' : '',
        customerType: columnIndices.customerType !== undefined ?
          row[columnIndices.customerType]?.toString().trim() || '' : '',
        depositBranchCode: columnIndices.depositBranchCode !== undefined ?
          row[columnIndices.depositBranchCode]?.toString().trim() || '' : '',
        businessCategoryCode: columnIndices.businessCategoryCode !== undefined ?
          row[columnIndices.businessCategoryCode]?.toString().trim() || '' : ''
      };

      customers.push(customer);
    });

    return customers;
    
  } catch (error) {
    throw new Error('خطا در پردازش فایل Excel: ' + (error as Error).message);
  }
}

export function downloadSampleExcel(): void {
  // Create sample data structure with new banking format (without geo-location)
  const sampleData = [
    {
      "کد ملی": "1234567890",
      "شماره مشتری": "C001",
      "نام و نام خانوادگی مشتری": "احمد محمدی",
      "کد ترمینال": "T001",
      "نام ترمینال": "سوپرمارکت نمونه",
      "نام شرکت": "فروشگاه محمدی",
      "کد شعبه": "B001",
      "موبایل": "09123456789",
      "آدرس": "تبریز، خیابان اصلی، پلاک 123",
      "تعداد کل تراکنش های ترمینال": 1500,
      "مبلغ کل تراکنش های ترمینال": 250000000,
      "درآمد کل پذیرنده": 25000000,
      "سود و زیان": 15000000,
      "وضعیت": "کارآمد",
      "تاریخ نصب": "1403/01/15",
      "وضعیت ترمینال": "فعال",
      "نام پشتیبان": "علی احمدی",
      "نوع دستگاه": "کارتخوان سیار",
      "نوع مشتری": "حقیقی",
      "عنوان صنف": "سوپرمارکت",
      "توضیحات": ""
    },
    {
      "کد ملی": "0987654321",
      "شماره مشتری": "C002",
      "نام و نام خانوادگی مشتری": "مریم کریمی",
      "کد ترمینال": "T002",
      "نام ترمینال": "رستوران طعم",
      "نام شرکت": "رستوران کریمی",
      "کد شعبه": "B002",
      "موبایل": "09123456788",
      "آدرس": "تبریز، میدان ساعت، طبقه دوم",
      "تعداد کل تراکنش های ترمینال": 800,
      "مبلغ کل تراکنش های ترمینال": 180000000,
      "درآمد کل پذیرنده": 18000000,
      "سود و زیان": 8000000,
      "وضعیت": "بازاریابی",
      "تاریخ نصب": "1403/02/20",
      "وضعیت ترمینال": "فعال",
      "نام پشتیبان": "زهرا کریمی",
      "نوع دستگاه": "کارتخوان ثابت",
      "نوع مشتری": "حقوقی",
      "عنوان صنف": "رستوران",
      "توضیحات": ""
    },
    {
      "کد ملی": "1122334455",
      "شماره مشتری": "C003",
      "نام و نام خانوادگی مشتری": "حسن رضایی",
      "کد ترمینال": "T003",
      "نام ترمینال": "داروخانه سلامت",
      "نام شرکت": "داروخانه رضایی",
      "کد شعبه": "B001",
      "موبایل": "09123456787",
      "آدرس": "تبریز، خیابان فردوسی",
      "تعداد کل تراکنش های ترمینال": 450,
      "مبلغ کل تراکنش های ترمینال": 120000000,
      "درآمد کل پذیرنده": 12000000,
      "سود و زیان": -2000000,
      "وضعیت": "زیان‌ده",
      "تاریخ نصب": "1402/10/05",
      "وضعیت ترمینال": "فعال",
      "نام پشتیبان": "محمد رضایی",
      "نوع دستگاه": "کارتخوان سیار",
      "نوع مشتری": "حقیقی",
      "عنوان صنف": "داروخانه",
      "توضیحات": ""
    },
  ];

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 15 }, // کد ملی
    { wch: 12 }, // شماره مشتری
    { wch: 25 }, // نام و نام خانوادگی مشتری
    { wch: 12 }, // کد ترمینال
    { wch: 20 }, // نام ترمینال
    { wch: 20 }, // نام شرکت
    { wch: 10 }, // کد شعبه
    { wch: 15 }, // موبایل
    { wch: 35 }, // آدرس
    { wch: 15 }, // تعداد کل تراکنش
    { wch: 20 }, // مبلغ کل تراکنش
    { wch: 15 }, // درآمد کل
    { wch: 15 }, // سود و زیان
    { wch: 12 }, // وضعیت
    { wch: 12 }, // تاریخ نصب
    { wch: 12 }, // وضعیت ترمینال
    { wch: 15 }, // نام پشتیبان
    { wch: 15 }, // نوع دستگاه
    { wch: 12 }, // نوع مشتری
    { wch: 15 }, // عنوان صنف
    { wch: 20 }, // توضیحات
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "مشتریان نمونه");
  
  // Write workbook and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'فایل_نمونه_مشتریان_بانکی.xlsx');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: any[], filename: string): void {
  if (data.length === 0) {
    throw new Error('داده‌ای برای صادرات موجود نیست');
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet with Persian headers and sanitized values
  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    'نام فروشگاه': sanitizeExcelValue(item.shopName || ''),
    'نام مالک': sanitizeExcelValue(item.ownerName || ''),
    'شماره تماس': sanitizeExcelValue(formatPhoneNumber(item.phone || '')),
    'نوع کسب‌وکار': sanitizeExcelValue(item.businessType || ''),
    'آدرس': sanitizeExcelValue(item.address || ''),
    'سود ماهانه': item.monthlyProfit ? formatCurrency(item.monthlyProfit) : '0 تومان',
    'وضعیت': sanitizeExcelValue(getStatusDisplayName(item.status)),
    'تاریخ نصب': item.installDate ? new Date(item.installDate).toLocaleDateString('fa-IR') : '',
    'شعبه': sanitizeExcelValue(item.branchId || '')
  })));
  
  // Set column widths
  const columnWidths = [
    { wch: 20 }, // نام فروشگاه
    { wch: 20 }, // نام مالک
    { wch: 15 }, // شماره تماس
    { wch: 15 }, // نوع کسب‌وکار
    { wch: 30 }, // آدرس
    { wch: 15 }, // سود ماهانه
    { wch: 12 }, // وضعیت
    { wch: 15 }, // تاریخ نصب
    { wch: 20 }, // شعبه
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "لیست مشتریان");
  
  // Write workbook and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : filename + '.xlsx');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utility function to validate Excel data
export function validateExcelData(data: ExcelCustomerData[]): {
  valid: ExcelCustomerData[];
  invalid: { row: number; errors: string[] }[];
} {
  const valid: ExcelCustomerData[] = [];
  const invalid: { row: number; errors: string[] }[] = [];

  data.forEach((row, index) => {
    const errors: string[] = [];

    // Required fields validation
    if (!row.shopName || row.shopName.trim() === '') {
      errors.push('نام فروشگاه اجباری است');
    }

    if (!row.ownerName || row.ownerName.trim() === '') {
      errors.push('نام مالک اجباری است');
    }

    if (!row.phone || row.phone.trim() === '') {
      errors.push('شماره تماس اجباری است');
    }

    // Phone validation (Iranian mobile numbers)
    if (row.phone && !row.phone.match(/^09\d{9}$/)) {
      errors.push('شماره تماس معتبر نیست (باید 11 رقم و با 09 شروع شود)');
    }

    // Monthly profit validation
    if (row.monthlyProfit && (isNaN(row.monthlyProfit) || row.monthlyProfit < 0)) {
      errors.push('سود ماهانه باید عدد مثبت باشد');
    }

    // Status validation
    const validStatuses = ['active', 'inactive', 'marketing', 'loss', 'collected'];
    if (row.status && !validStatuses.includes(row.status)) {
      errors.push('وضعیت معتبر نیست (active, inactive, marketing, loss, collected)');
    }

    // Business type - preserve the value from Excel "عنوان صنف" column (AM)
    // No validation needed - map-utils.ts will use the icon if it exists, otherwise default to 🏪
    if (!row.businessType || row.businessType.trim() === '') {
      row.businessType = 'سایر';
    }

    if (errors.length > 0) {
      invalid.push({ row: index + 1, errors });
    } else {
      valid.push(row);
    }
  });

  return { valid, invalid };
}

export function validateBankingUnitExcelData(data: ExcelBankingUnitData[]): {
  valid: ExcelBankingUnitData[];
  invalid: { row: number; errors: string[] }[];
} {
  const valid: ExcelBankingUnitData[] = [];
  const invalid: { row: number; errors: string[] }[] = [];

  data.forEach((row, index) => {
    const errors: string[] = [];

    // Required fields validation
    if (!row.code || row.code.trim() === '') {
      errors.push('کد واحد اجباری است');
    }

    if (!row.name || row.name.trim() === '') {
      errors.push('نام واحد اجباری است');
    }

    if (!row.unitType || row.unitType.trim() === '') {
      errors.push('نوع واحد اجباری است');
    }

    // Unit type validation
    const validUnitTypes = ['branch', 'atm', 'pos_center', 'service_center'];
    if (row.unitType && !validUnitTypes.includes(row.unitType)) {
      // Try to map Persian names to English
      const unitTypeMapping: Record<string, string> = {
        'شعبه': 'branch',
        'خودپرداز': 'atm', 
        'مرکز پوز': 'pos_center',
        'مرکز خدمات': 'service_center'
      };
      const mappedType = unitTypeMapping[row.unitType];
      if (mappedType) {
        row.unitType = mappedType;
      } else {
        errors.push('نوع واحد معتبر نیست (شعبه، خودپرداز، مرکز پوز، مرکز خدمات)');
      }
    }

    // Phone validation (Iranian mobile numbers) - optional field
    if (row.phone && row.phone.trim() !== '' && !row.phone.match(/^09\d{9}$/)) {
      errors.push('شماره تماس معتبر نیست (باید 11 رقم و با 09 شروع شود)');
    }

    // Coordinate validation - both should be present or both empty
    const hasLat = row.latitude && row.latitude.trim() !== '';
    const hasLng = row.longitude && row.longitude.trim() !== '';
    
    if (hasLat && !hasLng) {
      errors.push('اگر عرض جغرافیایی وارد شده، طول جغرافیایی هم باید وارد شود');
    }
    if (hasLng && !hasLat) {
      errors.push('اگر طول جغرافیایی وارد شده، عرض جغرافیایی هم باید وارد شود');
    }

    // Validate coordinate values
    if (hasLat) {
      const lat = parseFloat(row.latitude!);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push('عرض جغرافیایی باید عدد معتبر بین -90 تا 90 باشد');
      }
    }
    
    if (hasLng) {
      const lng = parseFloat(row.longitude!);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push('طول جغرافیایی باید عدد معتبر بین -180 تا 180 باشد');
      }
    }

    if (errors.length > 0) {
      invalid.push({ row: index + 1, errors });
    } else {
      valid.push(row);
    }
  });

  return { valid, invalid };
}

// Utility function to format data for Excel export
export function formatDataForExport(data: any[]): any[] {
  return data.map(item => ({
    'شناسه': item.id || '',
    'نام فروشگاه': item.shopName || '',
    'نام مالک': item.ownerName || '',
    'شماره تماس': item.phone || '',
    'نوع کسب‌وکار': item.businessType || '',
    'آدرس': item.address || '',
    'سود ماهانه': item.monthlyProfit ? Number(item.monthlyProfit).toLocaleString('fa-IR') + ' تومان' : '0 تومان',
    'وضعیت': getStatusDisplayName(item.status),
    'تاریخ نصب': item.installDate ? new Date(item.installDate).toLocaleDateString('fa-IR') : '',
    'شعبه': item.branch?.name || item.branchId || '',
    'کارمند پشتیبان': item.supportEmployee?.name || item.supportEmployeeId || ''
  }));
}

// Helper function to get Persian status names
function getStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'کارآمد',
    'inactive': 'غیرفعال',
    'marketing': 'بازاریابی',
    'loss': 'زیان‌ده',
    'collected': 'جمع‌آوری شده'
  };
  return statusMap[status] || status || 'نامشخص';
}

// Security function to prevent spreadsheet formula injection
function sanitizeExcelValue(value: string): string {
  if (typeof value !== 'string') {
    return String(value || '');
  }
  
  // If value starts with formula characters, prefix with apostrophe to neutralize
  if (/^[=+\-@]/.test(value.trim())) {
    return "'" + value;
  }
  
  return value;
}

// Function to normalize Persian/Arabic digits and format phone numbers
function normalizeDigits(text: string): string {
  if (!text) return '';
  
  // Persian to English digit mapping
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const englishDigits = '0123456789';
  
  let result = text;
  
  // Convert Persian digits
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
  }
  
  // Convert Arabic digits
  for (let i = 0; i < arabicDigits.length; i++) {
    result = result.replace(new RegExp(arabicDigits[i], 'g'), englishDigits[i]);
  }
  
  return result;
}

// Function to parse boolean values from Excel
function parseBooleanValue(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const val = value.toLowerCase().trim();
    return val === 'true' || val === 'فعال' || val === 'بله' || val === '1' || val === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return true; // Default to true if unknown
}

// Function to format phone numbers properly
function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Normalize digits and remove non-digit characters
  const normalized = normalizeDigits(phone).replace(/\D/g, '');
  
  // Ensure 11-digit format for Iranian mobile numbers
  if (normalized.length === 11 && normalized.startsWith('09')) {
    return normalized;
  }
  
  // If it's 10 digits starting with 9, add leading 0 (e.g., 9123456789 → 09123456789)
  if (normalized.length === 10 && normalized.startsWith('9')) {
    return '0' + normalized;
  }
  
  // If it's 10 digits and doesn't start with 0 or 9, assume it needs 0 prefix
  if (normalized.length === 10 && !normalized.startsWith('0')) {
    return '0' + normalized;
  }
  
  // If it's 9 digits, add 09
  if (normalized.length === 9) {
    return '09' + normalized;
  }
  
  // Return normalized if can't format properly
  return normalized || phone;
}

// Function to format currency values
function formatCurrency(amount: number): string {
  if (!amount || isNaN(amount)) return '0 تومان';
  
  return Number(amount).toLocaleString('fa-IR') + ' تومان';
}

// Function to parse monetary values with Persian/Arabic digits and separators
function parseMonetaryValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Normalize digits and remove non-digit characters except dots
  const normalized = normalizeDigits(String(value))
    .replace(/[,،]/g, '') // Remove thousand separators
    .replace(/[^\d.]/g, ''); // Keep only digits and dots
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

// Employee Excel parsing and validation functions
export async function parseExcelEmployeesFile(file: File): Promise<ExcelEmployeeData[]> {
  return new Promise((resolve, reject) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      reject(new Error('فرمت فایل نامعتبر است. فقط فایل‌های Excel (.xlsx, .xls) پذیرفته می‌شود'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = parseEmployeesExcelContent(e.target?.result);
        resolve(result);
      } catch (error) {
        reject(new Error('خطا در خواندن فایل Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('خطا در بارگذاری فایل'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function parseEmployeesExcelContent(buffer: any): ExcelEmployeeData[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('فایل Excel خالی است');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('فایل Excel باید حداقل شامل سر ستون‌ها و یک ردیف داده باشد');
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    const columnMapping: Record<string, keyof ExcelEmployeeData> = {
      'کد کارمند': 'employeeCode',
      'نام': 'name',
      'سمت': 'position',
      'تلفن': 'phone',
      'ایمیل': 'email',
      'شناسه شعبه': 'branchId',
      'حقوق': 'salary'
    };

    const columnIndices: Record<keyof ExcelEmployeeData, number> = {} as any;
    
    headers.forEach((header, index) => {
      const mappedField = columnMapping[header?.trim()];
      if (mappedField) {
        columnIndices[mappedField] = index;
      }
    });

    const requiredFields: (keyof ExcelEmployeeData)[] = ['employeeCode', 'name'];
    const missingFields = requiredFields.filter(field => columnIndices[field] === undefined);
    
    if (missingFields.length > 0) {
      const missingPersianFields = missingFields.map(field => {
        return Object.keys(columnMapping).find(key => columnMapping[key] === field);
      }).join(', ');
      throw new Error(`ستون‌های ضروری موجود نیست: ${missingPersianFields}`);
    }

    const employees: ExcelEmployeeData[] = [];
    
    (dataRows as any[][]).forEach((row: any[]) => {
      if (row.every(cell => !cell || cell.toString().trim() === '')) {
        return;
      }

      const employee: ExcelEmployeeData = {
        employeeCode: row[columnIndices.employeeCode]?.toString().trim() || '',
        name: row[columnIndices.name]?.toString().trim() || '',
        position: columnIndices.position !== undefined ? 
          row[columnIndices.position]?.toString().trim() || 'کارمند' : 'کارمند',
        phone: columnIndices.phone !== undefined ? 
          formatPhoneNumber(row[columnIndices.phone]?.toString() || '') : '',
        email: columnIndices.email !== undefined ? 
          row[columnIndices.email]?.toString().trim() || '' : '',
        branchId: columnIndices.branchId !== undefined ? 
          row[columnIndices.branchId]?.toString().trim() || '' : '',
        salary: columnIndices.salary !== undefined ? 
          parseMonetaryValue(row[columnIndices.salary]) : 0
      };

      employees.push(employee);
    });

    return employees;
    
  } catch (error) {
    throw new Error('خطا در پردازش فایل Excel: ' + (error as Error).message);
  }
}

export function validateEmployeeExcelData(data: ExcelEmployeeData[]): { 
  valid: ExcelEmployeeData[]; 
  invalid: { row: number; errors: string[] }[] 
} {
  const valid: ExcelEmployeeData[] = [];
  const invalid: { row: number; errors: string[] }[] = [];

  data.forEach((employee, index) => {
    const rowErrors: string[] = [];
    const rowNumber = index + 2; // Account for header row

    // Required field validations
    if (!employee.employeeCode || employee.employeeCode.trim() === '') {
      rowErrors.push('کد کارمند الزامی است');
    }

    if (!employee.name || employee.name.trim() === '') {
      rowErrors.push('نام کارمند الزامی است');
    }

    // Email validation if provided
    if (employee.email && employee.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employee.email)) {
        rowErrors.push('فرمت ایمیل نامعتبر است');
      }
    }

    // Phone validation if provided
    if (employee.phone && employee.phone.trim() !== '') {
      const cleanPhone = employee.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        rowErrors.push('شماره تلفن باید ۱۰ یا ۱۱ رقم باشد');
      }
    }

    // Salary validation
    if (employee.salary !== undefined && employee.salary < 0) {
      rowErrors.push('حقوق نمی‌تواند منفی باشد');
    }

    if (rowErrors.length > 0) {
      invalid.push({ row: rowNumber, errors: rowErrors });
    } else {
      valid.push(employee);
    }
  });

  return { valid, invalid };
}

// Time Series Excel parsing and validation functions
export async function parseExcelTimeSeriesFile(file: File): Promise<ExcelTimeSeriesData[]> {
  return new Promise((resolve, reject) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      reject(new Error('فرمت فایل نامعتبر است. فقط فایل‌های Excel (.xlsx, .xls) پذیرفته می‌شود'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = parseTimeSeriesExcelContent(e.target?.result);
        resolve(result);
      } catch (error) {
        reject(new Error('خطا در خواندن فایل Excel: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('خطا در بارگذاری فایل'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function parseTimeSeriesExcelContent(buffer: any): ExcelTimeSeriesData[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('فایل Excel خالی است');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
    
    if (jsonData.length < 2) {
      throw new Error('فایل Excel باید حداقل شامل سر ستون‌ها و یک ردیف داده باشد');
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    const columnMapping: Record<string, keyof ExcelTimeSeriesData> = {
      'شناسه مشتری': 'customerIdentifier',
      'کد ملی': 'customerIdentifier',
      'نام فروشگاه': 'customerIdentifier',
      'کد ترمینال': 'customerIdentifier',
      'تاریخ ثبت': 'recordDate',
      'تاریخ': 'recordDate',
      'وضعیت پوز': 'posStatus',
      'وضعیت': 'posStatus',
      'سودآوری': 'profitability',
      'سود': 'profitability',
      'میانگین حساب': 'averageBalance',
      'میانگین موجودی': 'averageBalance',
      'تعداد تراکنش': 'transactionCount',
      'درآمد کل': 'totalRevenue',
      'درآمد': 'totalRevenue',
      'یادداشت': 'notes',
      'توضیحات': 'notes'
    };

    const columnIndices: Record<keyof ExcelTimeSeriesData, number> = {} as any;
    
    headers.forEach((header, index) => {
      const normalizedHeader = header?.toString().trim();
      const mappedField = columnMapping[normalizedHeader];
      if (mappedField && columnIndices[mappedField] === undefined) {
        columnIndices[mappedField] = index;
      }
    });

    const requiredFields: (keyof ExcelTimeSeriesData)[] = ['customerIdentifier', 'recordDate', 'posStatus'];
    const missingFields = requiredFields.filter(field => columnIndices[field] === undefined);
    
    if (missingFields.length > 0) {
      const missingPersianFields = missingFields.map(field => {
        return Object.keys(columnMapping).find(key => columnMapping[key] === field);
      }).join(', ');
      throw new Error(`ستون‌های ضروری موجود نیست: ${missingPersianFields}`);
    }

    const timeSeries: ExcelTimeSeriesData[] = [];
    
    (dataRows as any[][]).forEach((row: any[]) => {
      if (row.every(cell => !cell || cell.toString().trim() === '')) {
        return;
      }

      const posStatusValue = row[columnIndices.posStatus]?.toString().trim() || 'active';
      const normalizedPosStatus = normalizePosStatus(posStatusValue);

      const record: ExcelTimeSeriesData = {
        customerIdentifier: row[columnIndices.customerIdentifier]?.toString().trim() || '',
        recordDate: row[columnIndices.recordDate]?.toString().trim() || '',
        posStatus: normalizedPosStatus,
        profitability: columnIndices.profitability !== undefined ? 
          parseMonetaryValue(row[columnIndices.profitability]) : 0,
        averageBalance: columnIndices.averageBalance !== undefined ? 
          parseMonetaryValue(row[columnIndices.averageBalance]) : 0,
        transactionCount: columnIndices.transactionCount !== undefined ? 
          parseInt(normalizeDigits(row[columnIndices.transactionCount]?.toString() || '0')) || 0 : 0,
        totalRevenue: columnIndices.totalRevenue !== undefined ? 
          parseMonetaryValue(row[columnIndices.totalRevenue]) : 0,
        notes: columnIndices.notes !== undefined ? 
          row[columnIndices.notes]?.toString().trim() || '' : ''
      };

      timeSeries.push(record);
    });

    return timeSeries;
    
  } catch (error) {
    throw new Error('خطا در پردازش فایل Excel: ' + (error as Error).message);
  }
}

function normalizePosStatus(status: string): string {
  const statusLower = status.toLowerCase().trim();
  const statusMap: Record<string, string> = {
    'فعال': 'active',
    'active': 'active',
    'غیرفعال': 'inactive',
    'inactive': 'inactive',
    'کارا': 'efficient',
    'efficient': 'efficient',
    'ناکارا': 'inefficient',
    'inefficient': 'inefficient',
    'موثر': 'efficient',
    'غیرموثر': 'inefficient'
  };
  return statusMap[statusLower] || 'active';
}

export function validateTimeSeriesExcelData(data: ExcelTimeSeriesData[]): { 
  valid: ExcelTimeSeriesData[]; 
  invalid: { row: number; errors: string[] }[] 
} {
  const valid: ExcelTimeSeriesData[] = [];
  const invalid: { row: number; errors: string[] }[] = [];

  data.forEach((record, index) => {
    const rowErrors: string[] = [];
    const rowNumber = index + 2;

    if (!record.customerIdentifier || record.customerIdentifier.trim() === '') {
      rowErrors.push('شناسه مشتری الزامی است');
    }

    if (!record.recordDate || record.recordDate.trim() === '') {
      rowErrors.push('تاریخ ثبت الزامی است');
    }

    const validStatuses = ['active', 'inactive', 'efficient', 'inefficient'];
    if (!validStatuses.includes(record.posStatus)) {
      rowErrors.push('وضعیت پوز باید یکی از مقادیر معتبر باشد');
    }

    if (rowErrors.length > 0) {
      invalid.push({ row: rowNumber, errors: rowErrors });
    } else {
      valid.push(record);
    }
  });

  return { valid, invalid };
}