import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  parseExcelFile, 
  parseExcelBankingUnitsFile,
  parseExcelEmployeesFile,
  parseExcelTimeSeriesFile,
  validateExcelData,
  validateBankingUnitExcelData,
  validateEmployeeExcelData,
  validateTimeSeriesExcelData,
  type ExcelCustomerData,
  type ExcelBankingUnitData,
  type ExcelEmployeeData,
  type ExcelTimeSeriesData
} from "@/lib/excel-utils";
import * as XLSX from 'xlsx';
import { Link } from "wouter";
import { 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  FileX, 
  Users, 
  Building2,
  UserCog,
  FileSpreadsheet,
  Loader2,
  MapPin,
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function BulkImportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-to-main">
            <ArrowRight className="h-4 w-4" />
            بازگشت به منوی اصلی
          </Button>
        </Link>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">ورود اطلاعات گروهی</h1>
        <p className="text-muted-foreground">
          با استفاده از فایل‌های Excel می‌توانید اطلاعات مشتریان، کارمندان و واحدهای بانکی را به صورت گروهی وارد سیستم کنید.
          پس از ورود اطلاعات، تمام بخش‌های تحلیل بر اساس داده‌های وارد شده کار خواهند کرد.
        </p>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customers" className="flex items-center gap-2" data-testid="tab-customers">
            <Users className="h-4 w-4" />
            مشتریان
          </TabsTrigger>
          <TabsTrigger value="time-series" className="flex items-center gap-2" data-testid="tab-time-series">
            <TrendingUp className="h-4 w-4" />
            سری زمانی
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2" data-testid="tab-employees">
            <UserCog className="h-4 w-4" />
            کارمندان
          </TabsTrigger>
          <TabsTrigger value="banking-units" className="flex items-center gap-2" data-testid="tab-banking-units">
            <Building2 className="h-4 w-4" />
            واحدهای بانکی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomerImportSection />
        </TabsContent>

        <TabsContent value="time-series">
          <TimeSeriesImportSection />
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeImportSection />
        </TabsContent>

        <TabsContent value="banking-units">
          <BankingUnitImportSection />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            نکات مهم برای موقعیت جغرافیایی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">مختصات تبریز</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>عرض جغرافیایی: بین 38.00 تا 38.15</li>
                <li>طول جغرافیایی: بین 46.20 تا 46.40</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">نحوه استفاده در تحلیل</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>خوشه‌بندی هوشمند بر اساس موقعیت</li>
                <li>تحلیل شعاع دسترسی</li>
                <li>نقشه تار عنکبوت شهری</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ExcelCustomerData[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: ExcelCustomerData[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);
  const [previewStep, setPreviewStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (customers: ExcelCustomerData[]) => {
      return apiRequest("POST", "/api/excel/import", { customers });
    },
    onSuccess: (result: any) => {
      toast({
        title: "موفقیت",
        description: `${result.summary?.success || parsedData.length} مشتری با موفقیت وارد شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در وارد کردن مشتریان",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setParsedData([]);
    setValidationResult(null);
    setPreviewStep(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setPreviewStep(false);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const rawData = await parseExcelFile(selectedFile);
      
      setProgress(60);
      const validation = validateExcelData(rawData);
      setValidationResult(validation);
      setParsedData(validation.valid);
      
      setProgress(80);
      
      if (validation.valid.length === 0) {
        toast({
          title: "خطا",
          description: "هیچ ردیف معتبری در فایل یافت نشد",
          variant: "destructive",
        });
        setProgress(0);
        setIsProcessing(false);
        return;
      }
      
      setProgress(100);
      setPreviewStep(true);
      
    } catch (error) {
      toast({
        title: "خطا در پردازش فایل",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    // All 39 columns exactly matching user's Excel format
    const templateData = [
      {
        'کد ملی': '1234567890',
        'شماره مشتری': 'C001',
        'نام و نام خانوادگی مشتری': 'احمد محمدی',
        'کد ترمینال': 'T001',
        'نام ترمینال': 'سوپرمارکت نمونه',
        'نام شرکت': 'فروشگاه محمدی',
        'کد شعبه': 'B001',
        'شماره سپرده متصل به ترمینال': '1234567890',
        'عنوان سپرده': 'سپرده جاری',
        'نوع سپرده': 'جاری',
        'موبایل': '09123456789',
        'آدرس': 'تبریز، خیابان اصلی، پلاک 123',
        'تعداد کل تراکنش های ترمینال': 1500,
        'مبلغ کل تراکنش های ترمینال': 250000000,
        'هزینه کل ترمینال': 5000000,
        'هزینه تسهیم به نسبت (تعداد ترمینال مشتری)': 2500000,
        'میانگین سپرده متصل به ترمینال': 50000000,
        'مجموع میانگین سپرده های جاری و قرض الحسنه پذیرنده': 100000000,
        'مجموع میانگین سپرده های کوتاه مدت پذیرنده': 30000000,
        'مجموع میانگین سپرده های جاری، قرض الحسنه و کوتاه مدت پذیرنده': 130000000,
        'سود پرداختی به سپرده های کوتاه مدت پذیرنده': 1500000,
        'درآمد کل پذیرنده': 25000000,
        'درآمد تسهیم به نسبت (تعداد ترمینال مشتری)': 12500000,
        'سود و زیان': 15000000,
        'فاصله تا کارآمد شدن به ازای هر پذیرنده ': 0,
        'وضعیت': 'کارآمد',
        'تاریخ نصب': '1403/01/15',
        'وضعیت ترمینال': 'فعال',
        'کد پشتیبان': 'S001',
        'نام پشتیبان': 'علی احمدی',
        'بازاریاب': 'محمد حسینی',
        'توضیحات': '',
        'تاریخ': '1403/09/20',
        'کارمزد شاپرکی': 500000,
        'نوع دستگاه': 'کارتخوان سیار',
        'نوع مشتری': 'حقیقی',
        'کد شعبه صاحب سپرده': 'B001',
        'کد صنف': '5411',
        'عنوان صنف': 'سوپرمارکت',
      },
      {
        'کد ملی': '0987654321',
        'شماره مشتری': 'C002',
        'نام و نام خانوادگی مشتری': 'مریم کریمی',
        'کد ترمینال': 'T002',
        'نام ترمینال': 'رستوران طعم',
        'نام شرکت': 'رستوران کریمی',
        'کد شعبه': 'B002',
        'شماره سپرده متصل به ترمینال': '0987654321',
        'عنوان سپرده': 'سپرده قرض الحسنه',
        'نوع سپرده': 'قرض الحسنه',
        'موبایل': '09123456788',
        'آدرس': 'تبریز، میدان ساعت، طبقه دوم',
        'تعداد کل تراکنش های ترمینال': 800,
        'مبلغ کل تراکنش های ترمینال': 180000000,
        'هزینه کل ترمینال': 3600000,
        'هزینه تسهیم به نسبت (تعداد ترمینال مشتری)': 1800000,
        'میانگین سپرده متصل به ترمینال': 35000000,
        'مجموع میانگین سپرده های جاری و قرض الحسنه پذیرنده': 70000000,
        'مجموع میانگین سپرده های کوتاه مدت پذیرنده': 20000000,
        'مجموع میانگین سپرده های جاری، قرض الحسنه و کوتاه مدت پذیرنده': 90000000,
        'سود پرداختی به سپرده های کوتاه مدت پذیرنده': 1000000,
        'درآمد کل پذیرنده': 18000000,
        'درآمد تسهیم به نسبت (تعداد ترمینال مشتری)': 9000000,
        'سود و زیان': 8000000,
        'فاصله تا کارآمد شدن به ازای هر پذیرنده ': 2000000,
        'وضعیت': 'بازاریابی',
        'تاریخ نصب': '1403/02/20',
        'وضعیت ترمینال': 'فعال',
        'کد پشتیبان': 'S002',
        'نام پشتیبان': 'زهرا کریمی',
        'بازاریاب': 'علی رضایی',
        'توضیحات': '',
        'تاریخ': '1403/09/20',
        'کارمزد شاپرکی': 360000,
        'نوع دستگاه': 'کارتخوان ثابت',
        'نوع مشتری': 'حقوقی',
        'کد شعبه صاحب سپرده': 'B002',
        'کد صنف': '5812',
        'عنوان صنف': 'رستوران',
      },
      {
        'کد ملی': '1122334455',
        'شماره مشتری': 'C003',
        'نام و نام خانوادگی مشتری': 'حسن رضایی',
        'کد ترمینال': 'T003',
        'نام ترمینال': 'داروخانه سلامت',
        'نام شرکت': 'داروخانه رضایی',
        'کد شعبه': 'B001',
        'شماره سپرده متصل به ترمینال': '1122334455',
        'عنوان سپرده': 'سپرده کوتاه مدت',
        'نوع سپرده': 'کوتاه مدت',
        'موبایل': '09123456787',
        'آدرس': 'تبریز، خیابان فردوسی',
        'تعداد کل تراکنش های ترمینال': 450,
        'مبلغ کل تراکنش های ترمینال': 120000000,
        'هزینه کل ترمینال': 2400000,
        'هزینه تسهیم به نسبت (تعداد ترمینال مشتری)': 2400000,
        'میانگین سپرده متصل به ترمینال': 25000000,
        'مجموع میانگین سپرده های جاری و قرض الحسنه پذیرنده': 40000000,
        'مجموع میانگین سپرده های کوتاه مدت پذیرنده': 15000000,
        'مجموع میانگین سپرده های جاری، قرض الحسنه و کوتاه مدت پذیرنده': 55000000,
        'سود پرداختی به سپرده های کوتاه مدت پذیرنده': 750000,
        'درآمد کل پذیرنده': 12000000,
        'درآمد تسهیم به نسبت (تعداد ترمینال مشتری)': 12000000,
        'سود و زیان': -2000000,
        'فاصله تا کارآمد شدن به ازای هر پذیرنده ': 5000000,
        'وضعیت': 'زیان‌ده',
        'تاریخ نصب': '1402/10/05',
        'وضعیت ترمینال': 'فعال',
        'کد پشتیبان': 'S003',
        'نام پشتیبان': 'محمد رضایی',
        'بازاریاب': 'حسین محمدی',
        'توضیحات': '',
        'تاریخ': '1403/09/20',
        'کارمزد شاپرکی': 240000,
        'نوع دستگاه': 'کارتخوان سیار',
        'نوع مشتری': 'حقیقی',
        'کد شعبه صاحب سپرده': 'B001',
        'کد صنف': '5912',
        'عنوان صنف': 'داروخانه',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مشتریان');
    
    // Set column widths for all 39 columns
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 20 },
      { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
      { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 35 },
      { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 25 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 15 }
    ];
    
    XLSX.writeFile(workbook, 'template-customers-banking.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          ورود مشتریان از Excel
        </CardTitle>
        <CardDescription>
          اطلاعات مشتریان را از فایل Excel وارد کنید. مختصات جغرافیایی برای تحلیل‌های مکانی استفاده می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewStep ? (
          <ImportUploadSection
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            progress={progress}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onProcess={processExcelFile}
            onDownloadTemplate={downloadTemplate}
            templateColumns={['کد ملی', 'شماره مشتری', 'نام و نام خانوادگی مشتری', 'کد ترمینال', 'نام ترمینال', 'نام شرکت', 'کد شعبه', 'موبایل', 'آدرس', 'تعداد کل تراکنش های ترمینال', 'مبلغ کل تراکنش های ترمینال', 'درآمد کل پذیرنده', 'سود و زیان', 'وضعیت', 'تاریخ نصب', 'وضعیت ترمینال', 'نام پشتیبان', 'نوع دستگاه', 'نوع مشتری', 'عنوان صنف', 'توضیحات']}
            requiredColumns={['نام ترمینال', 'نام و نام خانوادگی مشتری', 'موبایل']}
          />
        ) : (
          <ImportPreviewSection
            validationResult={validationResult}
            isPending={importMutation.isPending}
            onBack={() => setPreviewStep(false)}
            onReset={resetForm}
            onImport={() => importMutation.mutate(parsedData)}
            entityName="مشتری"
            renderPreviewItem={(item: ExcelCustomerData, index: number) => (
              <div key={index} className="bg-muted p-3 rounded border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div><strong>فروشگاه:</strong> {item.shopName}</div>
                  <div><strong>مالک:</strong> {item.ownerName}</div>
                  <div><strong>تلفن:</strong> {item.phone}</div>
                  <div><strong>نوع:</strong> {item.businessType || 'نامشخص'}</div>
                  {item.latitude && item.longitude && (
                    <div><strong>موقعیت:</strong> {item.latitude}, {item.longitude}</div>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

function TimeSeriesImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ExcelTimeSeriesData[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: ExcelTimeSeriesData[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);
  const [previewStep, setPreviewStep] = useState(false);
  const [customerMapping, setCustomerMapping] = useState<Map<string, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (records: ExcelTimeSeriesData[]) => {
      const customersRes = await fetch('/api/customers');
      const customers = await customersRes.json();
      
      const mapping = new Map<string, string>();
      customers.forEach((c: any) => {
        if (c.nationalId) mapping.set(c.nationalId.toLowerCase().trim(), c.id);
        if (c.shopName) mapping.set(c.shopName.toLowerCase().trim(), c.id);
        if (c.terminalId) mapping.set(c.terminalId.toLowerCase().trim(), c.id);
        if (c.terminalCode) mapping.set(c.terminalCode.toLowerCase().trim(), c.id);
      });
      setCustomerMapping(mapping);

      const timeSeriesRecords = records.map((r) => {
        const identifier = r.customerIdentifier.toLowerCase().trim();
        const customerId = mapping.get(identifier);
        if (!customerId) return null;
        
        const date = new Date(r.recordDate);
        return {
          customerId,
          recordDate: date.toISOString(),
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          posStatus: r.posStatus,
          profitability: r.profitability,
          averageBalance: r.averageBalance,
          transactionCount: r.transactionCount || 0,
          totalRevenue: r.totalRevenue || 0,
          notes: r.notes || ''
        };
      }).filter(Boolean);

      if (timeSeriesRecords.length === 0) {
        throw new Error('هیچ مشتری منطبقی یافت نشد. لطفا ابتدا مشتریان را وارد کنید.');
      }

      return apiRequest("POST", "/api/customer-time-series/bulk", { records: timeSeriesRecords });
    },
    onSuccess: (result: any) => {
      toast({
        title: "موفقیت",
        description: `${result.count || parsedData.length} رکورد سری زمانی با موفقیت وارد شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-time-series'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در وارد کردن داده‌های سری زمانی",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setParsedData([]);
    setValidationResult(null);
    setPreviewStep(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setPreviewStep(false);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const rawData = await parseExcelTimeSeriesFile(selectedFile);
      setProgress(60);
      
      const result = validateTimeSeriesExcelData(rawData);
      setProgress(80);
      
      setParsedData(result.valid);
      setValidationResult(result);
      setPreviewStep(true);
      setProgress(100);
      
      toast({
        title: "پردازش کامل شد",
        description: `${result.valid.length} رکورد معتبر و ${result.invalid.length} رکورد نامعتبر`,
      });
    } catch (error) {
      toast({
        title: "خطا در پردازش فایل",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['شناسه مشتری', 'تاریخ ثبت', 'وضعیت پوز', 'سودآوری', 'میانگین حساب', 'تعداد تراکنش', 'درآمد کل', 'یادداشت'];
    const sampleData = [
      ['0123456789', '2024-01-15', 'فعال', '5000000', '25000000', '150', '8000000', 'مشتری فعال'],
      ['0987654321', '2024-02-20', 'کارا', '7500000', '35000000', '220', '12000000', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'سری_زمانی');
    XLSX.writeFile(wb, 'time_series_template.xlsx');
  };

  const posStatusLabels: Record<string, string> = {
    'active': 'فعال',
    'inactive': 'غیرفعال',
    'efficient': 'کارا',
    'inefficient': 'ناکارا'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          ورود داده‌های سری زمانی
        </CardTitle>
        <CardDescription>
          داده‌های تاریخچه‌ای وضعیت پوز، سودآوری و میانگین حساب مشتریان را وارد کنید.
          این داده‌ها برای تحلیل رفتار مشتری در طول زمان روی نقشه هوشمند استفاده می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewStep ? (
          <ImportUploadSection
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            progress={progress}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onProcess={processExcelFile}
            onDownloadTemplate={downloadTemplate}
            templateColumns={['شناسه مشتری', 'تاریخ ثبت', 'وضعیت پوز', 'سودآوری', 'میانگین حساب', 'تعداد تراکنش', 'درآمد کل', 'یادداشت']}
            requiredColumns={['شناسه مشتری', 'تاریخ ثبت', 'وضعیت پوز']}
          />
        ) : (
          <ImportPreviewSection
            validationResult={validationResult}
            isPending={importMutation.isPending}
            onBack={() => setPreviewStep(false)}
            onReset={resetForm}
            onImport={() => importMutation.mutate(parsedData)}
            entityName="رکورد سری زمانی"
            renderPreviewItem={(item: ExcelTimeSeriesData, index: number) => (
              <div key={index} className="bg-muted p-3 rounded border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><strong>شناسه:</strong> {item.customerIdentifier}</div>
                  <div><strong>تاریخ:</strong> {item.recordDate}</div>
                  <div><strong>وضعیت:</strong> {posStatusLabels[item.posStatus] || item.posStatus}</div>
                  <div><strong>سودآوری:</strong> {item.profitability?.toLocaleString('fa-IR')} تومان</div>
                  <div><strong>میانگین حساب:</strong> {item.averageBalance?.toLocaleString('fa-IR')} تومان</div>
                  {item.transactionCount && (
                    <div><strong>تعداد تراکنش:</strong> {item.transactionCount}</div>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmployeeImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ExcelEmployeeData[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: ExcelEmployeeData[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);
  const [previewStep, setPreviewStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (employees: ExcelEmployeeData[]) => {
      return apiRequest("POST", "/api/employees/bulk-import", { employees });
    },
    onSuccess: (result: any) => {
      toast({
        title: "موفقیت",
        description: `${result.imported || parsedData.length} کارمند با موفقیت وارد شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در وارد کردن کارمندان",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setParsedData([]);
    setValidationResult(null);
    setPreviewStep(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setPreviewStep(false);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const rawData = await parseExcelEmployeesFile(selectedFile);
      
      setProgress(60);
      const validation = validateEmployeeExcelData(rawData);
      setValidationResult(validation);
      setParsedData(validation.valid);
      
      setProgress(80);
      
      if (validation.valid.length === 0) {
        toast({
          title: "خطا",
          description: "هیچ ردیف معتبری در فایل یافت نشد",
          variant: "destructive",
        });
        setProgress(0);
        setIsProcessing(false);
        return;
      }
      
      setProgress(100);
      setPreviewStep(true);
      
    } catch (error) {
      toast({
        title: "خطا در پردازش فایل",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'کد کارمند': 'EMP001',
        'نام': 'علی احمدی',
        'سمت': 'مدیر فروش',
        'تلفن': '09121234567',
        'ایمیل': 'ali@company.com',
        'شناسه شعبه': '',
        'حقوق': 25000000
      },
      {
        'کد کارمند': 'EMP002',
        'نام': 'فاطمه کریمی',
        'سمت': 'کارشناس فنی',
        'تلفن': '09129876543',
        'ایمیل': 'fateme@company.com',
        'شناسه شعبه': '',
        'حقوق': 20000000
      },
      {
        'کد کارمند': 'EMP003',
        'نام': 'محمد رضایی',
        'سمت': 'پشتیبان',
        'تلفن': '09123456789',
        'ایمیل': 'mohammad@company.com',
        'شناسه شعبه': '',
        'حقوق': 18000000
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'کارمندان');
    
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }
    ];
    
    XLSX.writeFile(workbook, 'template-employees.xlsx');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          ورود کارمندان از Excel
        </CardTitle>
        <CardDescription>
          اطلاعات کارمندان را از فایل Excel وارد کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewStep ? (
          <ImportUploadSection
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            progress={progress}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onProcess={processExcelFile}
            onDownloadTemplate={downloadTemplate}
            templateColumns={['کد کارمند', 'نام', 'سمت', 'تلفن', 'ایمیل', 'شناسه شعبه', 'حقوق']}
            requiredColumns={['کد کارمند', 'نام']}
          />
        ) : (
          <ImportPreviewSection
            validationResult={validationResult}
            isPending={importMutation.isPending}
            onBack={() => setPreviewStep(false)}
            onReset={resetForm}
            onImport={() => importMutation.mutate(parsedData)}
            entityName="کارمند"
            renderPreviewItem={(item: ExcelEmployeeData, index: number) => (
              <div key={index} className="bg-muted p-3 rounded border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div><strong>کد:</strong> {item.employeeCode}</div>
                  <div><strong>نام:</strong> {item.name}</div>
                  <div><strong>سمت:</strong> {item.position}</div>
                  {item.phone && <div><strong>تلفن:</strong> {item.phone}</div>}
                  {item.email && <div><strong>ایمیل:</strong> {item.email}</div>}
                  {item.salary && item.salary > 0 && <div><strong>حقوق:</strong> {item.salary.toLocaleString('fa-IR')}</div>}
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

function BankingUnitImportSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ExcelBankingUnitData[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: ExcelBankingUnitData[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);
  const [previewStep, setPreviewStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (bankingUnits: ExcelBankingUnitData[]) => {
      return apiRequest("POST", "/api/banking-units/bulk-import", { bankingUnits });
    },
    onSuccess: (result: any) => {
      toast({
        title: "موفقیت",
        description: `${result.imported || parsedData.length} واحد بانکی با موفقیت وارد شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/banking-units'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در وارد کردن واحدهای بانکی",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setParsedData([]);
    setValidationResult(null);
    setPreviewStep(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setPreviewStep(false);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(40);
      const rawData = await parseExcelBankingUnitsFile(selectedFile);
      
      setProgress(60);
      const validation = validateBankingUnitExcelData(rawData);
      setValidationResult(validation);
      setParsedData(validation.valid);
      
      setProgress(80);
      
      if (validation.valid.length === 0) {
        toast({
          title: "خطا",
          description: "هیچ ردیف معتبری در فایل یافت نشد",
          variant: "destructive",
        });
        return;
      }
      
      setProgress(100);
      setPreviewStep(true);
      
    } catch (error) {
      toast({
        title: "خطا در پردازش فایل",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'کد واحد': 'BU001',
        'نام واحد': 'شعبه مرکزی',
        'نوع واحد': 'شعبه',
        'نام مسئول': 'علی احمدی',
        'شماره تماس': '09123456789',
        'آدرس': 'تبریز، خیابان اصلی',
        'عرض جغرافیایی': '38.0792',
        'طول جغرافیایی': '46.2887',
        'وضعیت فعالیت': 'فعال'
      },
      {
        'کد واحد': 'BU002',
        'نام واحد': 'باجه فردوسی',
        'نوع واحد': 'باجه',
        'نام مسئول': 'فاطمه کریمی',
        'شماره تماس': '09129876543',
        'آدرس': 'تبریز، خیابان فردوسی',
        'عرض جغرافیایی': '38.0823',
        'طول جغرافیایی': '46.2956',
        'وضعیت فعالیت': 'فعال'
      },
      {
        'کد واحد': 'BU003',
        'نام واحد': 'کیوسک شهربانت ولیعصر',
        'نوع واحد': 'کیوسک شهربانت',
        'نام مسئول': 'محمد رضایی',
        'شماره تماس': '09123456787',
        'آدرس': 'تبریز، میدان ولیعصر',
        'عرض جغرافیایی': '38.0756',
        'طول جغرافیایی': '46.2915',
        'وضعیت فعالیت': 'فعال'
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'واحدهای بانکی');
    
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    
    XLSX.writeFile(workbook, 'template-banking-units.xlsx');
  };

  const getUnitTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'branch': 'شعبه',
      'counter': 'باجه',
      'shahrbnet_kiosk': 'کیوسک شهربانت',
      'شعبه': 'شعبه',
      'باجه': 'باجه',
      'کیوسک شهربانت': 'کیوسک شهربانت'
    };
    return typeMap[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          ورود واحدهای بانکی از Excel
        </CardTitle>
        <CardDescription>
          اطلاعات واحدهای بانکی (شعب، باجه‌ها، کیوسک‌های شهربانت) را از فایل Excel وارد کنید.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!previewStep ? (
          <ImportUploadSection
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            progress={progress}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onProcess={processExcelFile}
            onDownloadTemplate={downloadTemplate}
            templateColumns={['کد واحد', 'نام واحد', 'نوع واحد', 'نام مسئول', 'شماره تماس', 'آدرس', 'عرض جغرافیایی', 'طول جغرافیایی', 'وضعیت فعالیت']}
            requiredColumns={['کد واحد', 'نام واحد', 'نوع واحد']}
          />
        ) : (
          <ImportPreviewSection
            validationResult={validationResult}
            isPending={importMutation.isPending}
            onBack={() => setPreviewStep(false)}
            onReset={resetForm}
            onImport={() => importMutation.mutate(parsedData)}
            entityName="واحد بانکی"
            renderPreviewItem={(item: ExcelBankingUnitData, index: number) => (
              <div key={index} className="bg-muted p-3 rounded border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div><strong>کد:</strong> {item.code}</div>
                  <div><strong>نام:</strong> {item.name}</div>
                  <div><strong>نوع:</strong> {getUnitTypeLabel(item.unitType)}</div>
                  {item.managerName && <div><strong>مسئول:</strong> {item.managerName}</div>}
                  {item.latitude && item.longitude && (
                    <div><strong>موقعیت:</strong> {item.latitude}, {item.longitude}</div>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface ImportUploadSectionProps {
  selectedFile: File | null;
  isProcessing: boolean;
  progress: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  onDownloadTemplate: () => void;
  templateColumns: string[];
  requiredColumns: string[];
}

function ImportUploadSection({
  selectedFile,
  isProcessing,
  progress,
  fileInputRef,
  onFileSelect,
  onProcess,
  onDownloadTemplate,
  templateColumns,
  requiredColumns
}: ImportUploadSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium">انتخاب فایل Excel</h3>
            <p className="text-muted-foreground">فایل با فرمت xlsx یا xls انتخاب کنید</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              data-testid="button-select-file"
            >
              <Upload className="h-4 w-4 ml-2" />
              {selectedFile ? selectedFile.name : "انتخاب فایل"}
            </Button>
            
            <Button
              variant="outline"
              onClick={onDownloadTemplate}
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4 ml-2" />
              دانلود فایل نمونه
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileSelect}
            className="hidden"
            data-testid="input-file-upload"
          />
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">ستون‌های فایل Excel:</h4>
        <div className="flex flex-wrap gap-2 mb-2">
          {templateColumns.map((col, idx) => (
            <Badge 
              key={idx} 
              variant={requiredColumns.includes(col) ? "default" : "secondary"}
            >
              {col}
              {requiredColumns.includes(col) && " *"}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          ستون‌های با علامت * ضروری هستند.
        </p>
      </div>

      {selectedFile && (
        <div className="bg-primary/5 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium" data-testid="text-selected-file">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} کیلوبایت
                </p>
              </div>
            </div>
            
            <Button
              onClick={onProcess}
              disabled={isProcessing}
              data-testid="button-process-file"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  در حال پردازش...
                </>
              ) : (
                "پردازش فایل"
              )}
            </Button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>پردازش فایل...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
}

interface ImportPreviewSectionProps {
  validationResult: {
    valid: any[];
    invalid: { row: number; errors: string[] }[];
  } | null;
  isPending: boolean;
  onBack: () => void;
  onReset: () => void;
  onImport: () => void;
  entityName: string;
  renderPreviewItem: (item: any, index: number) => React.ReactNode;
}

function ImportPreviewSection({
  validationResult,
  isPending,
  onBack,
  onReset,
  onImport,
  entityName,
  renderPreviewItem
}: ImportPreviewSectionProps) {
  if (!validationResult) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">پیش‌نمایش داده‌ها</h3>
        <Button variant="outline" onClick={onBack} data-testid="button-back">
          بازگشت
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600" data-testid="text-valid-count">
                {validationResult.valid.length}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">ردیف معتبر</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FileX className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600" data-testid="text-invalid-count">
                {validationResult.invalid.length}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">ردیف نامعتبر</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-600" data-testid="text-total-count">
                {validationResult.valid.length + validationResult.invalid.length}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">کل ردیف‌ها</p>
            </div>
          </div>
        </div>
      </div>

      {validationResult.invalid.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <strong>خطاهای اعتبارسنجی:</strong>
              <ScrollArea className="h-32">
                {validationResult.invalid.map((error, index) => (
                  <div key={index} className="text-sm border-b pb-1 mb-1 last:border-b-0">
                    <strong>ردیف {error.row}:</strong> {error.errors.join(', ')}
                  </div>
                ))}
              </ScrollArea>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validationResult.valid.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">نمونه داده‌های معتبر:</h4>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-4 space-y-3">
              {validationResult.valid.slice(0, 5).map(renderPreviewItem)}
              {validationResult.valid.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  و {validationResult.valid.length - 5} {entityName} دیگر...
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReset} disabled={isPending} data-testid="button-cancel">
          انصراف
        </Button>
        <Button 
          onClick={onImport} 
          disabled={isPending || validationResult.valid.length === 0}
          data-testid="button-import"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              در حال وارد کردن...
            </>
          ) : (
            `وارد کردن ${validationResult.valid.length} ${entityName}`
          )}
        </Button>
      </div>
    </div>
  );
}
