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

export async function parseExcelFile(file: File): Promise<ExcelCustomerData[]> {
  return new Promise((resolve, reject) => {
    // Check if file is Excel format
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      reject(new Error('Invalid file format'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // In a real implementation, you would use a library like xlsx
        // For now, we'll simulate Excel parsing
        const result = parseExcelContent(e.target?.result);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function parseExcelContent(buffer: any): ExcelCustomerData[] {
  // This is a mock implementation
  // In a real application, you would use libraries like:
  // - xlsx: for reading Excel files
  // - sheetjs: for parsing spreadsheet data
  
  // Mock data for demonstration
  const mockData: ExcelCustomerData[] = [
    {
      shopName: "سوپرمارکت نمونه",
      ownerName: "احمد محمدی",
      phone: "09123456789",
      businessType: "سوپرمارکت",
      address: "تبریز، خیابان اصلی",
      monthlyProfit: 25000000,
      status: "active",
    },
    {
      shopName: "رستوران طعم",
      ownerName: "مریم احمدی",
      phone: "09123456788",
      businessType: "رستوران",
      address: "تبریز، میدان ساعت",
      monthlyProfit: 18000000,
      status: "marketing",
    },
  ];

  return mockData;
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
      "شعبه": "شعبه تبریز",
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
      "شعبه": "شعبه تبریز",
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
      "شعبه": "شعبه اصفهان",
      "کارمند پشتیبان": "محمد رضایی",
    },
  ];

  // Convert to CSV (simpler than Excel for browser download)
  const csvContent = convertToCSV(sampleData);
  
  // Create and trigger download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'فایل_نمونه_مشتریان.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportToExcel(data: any[], filename: string): void {
  // Convert data to CSV for browser compatibility
  const csvContent = convertToCSV(data);
  
  // Create and trigger download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
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
      errors.push('وضعیت معتبر نیست');
    }

    if (errors.length > 0) {
      invalid.push({ row: index + 1, errors });
    } else {
      valid.push(row);
    }
  });

  return { valid, invalid };
}
