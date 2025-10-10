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
    const columnMapping: Record<string, keyof ExcelCustomerData> = {
      'نام فروشگاه': 'shopName',
      'نام مالک': 'ownerName',
      'شماره تماس': 'phone',
      'نوع کسب‌وکار': 'businessType',
      'آدرس': 'address',
      'سود ماهانه': 'monthlyProfit',
      'وضعیت': 'status',
      'شعبه': 'branch',
      'کارمند پشتیبان': 'supportEmployee'
    };

    // Find column indices
    const columnIndices: Record<keyof ExcelCustomerData, number> = {} as any;
    
    headers.forEach((header, index) => {
      const mappedField = columnMapping[header?.trim()];
      if (mappedField) {
        columnIndices[mappedField] = index;
      }
    });

    // Check if required columns exist
    const requiredFields: (keyof ExcelCustomerData)[] = ['shopName', 'ownerName', 'phone'];
    const missingFields = requiredFields.filter(field => columnIndices[field] === undefined);
    
    if (missingFields.length > 0) {
      const missingPersianFields = missingFields.map(field => {
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

      const customer: ExcelCustomerData = {
        shopName: row[columnIndices.shopName]?.toString().trim() || '',
        ownerName: row[columnIndices.ownerName]?.toString().trim() || '',
        phone: formatPhoneNumber(row[columnIndices.phone]?.toString() || ''),
        businessType: columnIndices.businessType !== undefined ? 
          row[columnIndices.businessType]?.toString().trim() || 'سایر' : 'سایر',
        address: columnIndices.address !== undefined ? 
          row[columnIndices.address]?.toString().trim() || '' : '',
        monthlyProfit: columnIndices.monthlyProfit !== undefined ? 
          parseMonetaryValue(row[columnIndices.monthlyProfit]) : 0,
        status: columnIndices.status !== undefined ? 
          row[columnIndices.status]?.toString().trim() || 'active' : 'active',
        branch: columnIndices.branch !== undefined ? 
          row[columnIndices.branch]?.toString().trim() || '' : '',
        supportEmployee: columnIndices.supportEmployee !== undefined ? 
          row[columnIndices.supportEmployee]?.toString().trim() || '' : ''
      };

      customers.push(customer);
    });

    return customers;
    
  } catch (error) {
    throw new Error('خطا در پردازش فایل Excel: ' + (error as Error).message);
  }
}

export function downloadSampleExcel(): void {
  // Create sample data structure
  const sampleData = [
    {
      "نام فروشگاه": "سوپرمارکت نمونه",
      "نام مالک": "احمد محمدی",
      "شماره تماس": "09123456789",
      "نوع کسب‌وکار": "سوپرمارکت",
      "آدرس": "تبریز، خیابان اصلی، پلاک 123",
      "سود ماهانه": 25000000,
      "وضعیت": "active",
      "شعبه": "شعبه مرکزی تبریز",
      "کارمند پشتیبان": "علی احمدی",
    },
    {
      "نام فروشگاه": "رستوران طعم",
      "نام مالک": "مریم کریمی",
      "شماره تماس": "09123456788",
      "نوع کسب‌وکار": "رستوران",
      "آدرس": "تبریز، میدان ساعت، طبقه دوم",
      "سود ماهانه": 18000000,
      "وضعیت": "marketing",
      "شعبه": "شعبه بازار تبریز",
      "کارمند پشتیبان": "زهرا کریمی",
    },
    {
      "نام فروشگاه": "داروخانه سلامت",
      "نام مالک": "حسن رضایی",
      "شماره تماس": "09123456787",
      "نوع کسب‌وکار": "داروخانه",
      "آدرس": "تبریز، خیابان فردوسی",
      "سود ماهانه": 12000000,
      "وضعیت": "loss",
      "شعبه": "شعبه شهرک صنعتی",
      "کارمند پشتیبان": "محمد رضایی",
    },
  ];

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 20 }, // نام فروشگاه
    { wch: 20 }, // نام مالک
    { wch: 15 }, // شماره تماس
    { wch: 15 }, // نوع کسب‌وکار
    { wch: 30 }, // آدرس
    { wch: 15 }, // سود ماهانه
    { wch: 12 }, // وضعیت
    { wch: 20 }, // شعبه
    { wch: 20 }, // کارمند پشتیبان
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
  link.setAttribute('download', 'فایل_نمونه_مشتریان.xlsx');
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

    // Business type validation (optional but helpful)
    const validBusinessTypes = [
      'سوپرمارکت', 'داروخانه', 'رستوران', 'کافه', 'فروشگاه', 'پوشاک', 
      'موبایل‌فروشی', 'کتاب‌فروشی', 'آرایشگاه', 'نانوایی', 'سایر'
    ];
    if (row.businessType && !validBusinessTypes.includes(row.businessType)) {
      // This is a warning, not an error
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
  
  // If it's 10 digits and doesn't start with 0, add 09
  if (normalized.length === 10 && !normalized.startsWith('0')) {
    return '09' + normalized;
  }
  
  // If it's 9 digits, add 09
  if (normalized.length === 9) {
    return '09' + normalized;
  }
  
  // Return original if can't normalize
  return phone;
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