import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Download, Upload, AlertTriangle, CheckCircle, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Branch } from "@shared/schema";
import * as XLSX from 'xlsx';

interface PosStatsExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customers: Customer[];
  branches: Branch[];
}

interface ParsedRow {
  customerShop: string;
  customerOwner: string;
  branchName: string;
  year: number;
  month: number;
  totalTransactions: number;
  totalAmount: number;
  revenue: number;
  profit: number;
  status: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const statusLabels = {
  active: "فعال",
  normal: "عادی",
  marketing: "بازاریابی",
  collected: "جمع‌آوری شده",
  loss: "ضرر"
};

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function PosStatsExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  branches
}: PosStatsExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const response = await fetch('/api/pos-stats/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ stats: data }),
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "موفق",
        description: `${response.imported} آمار ماهانه با موفقیت وارد شد`,
      });
      onSuccess();
      handleReset();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.details ? error.details.join(', ') : "خطا در وارد کردن آمار ماهانه",
        variant: "destructive",
      });
    },
  });

  const downloadTemplate = () => {
    const templateData = [
      {
        "نام فروشگاه": "فروشگاه نمونه",
        "نام مالک": "علی احمدی",
        "نام شعبه": "شعبه مرکزی",
        "سال": 1403,
        "ماه": 1,
        "تعداد تراکنش": 100,
        "مبلغ کل": 10000000,
        "درآمد": 500000,
        "سود": 300000,
        "وضعیت": "active",
        "یادداشت": "یادداشت اختیاری"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "آمار ماهانه POS");
    XLSX.writeFile(wb, "pos-stats-template.xlsx");

    toast({
      title: "موفق",
      description: "فایل نمونه دانلود شد",
    });
  };

  const validateRow = (row: ParsedRow, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check if customer exists
    const customer = customers.find(c => 
      c.shopName === row.customerShop && c.ownerName === row.customerOwner
    );
    if (!customer) {
      errors.push({
        row: index + 1,
        field: "مشتری",
        message: `مشتری با نام فروشگاه "${row.customerShop}" و مالک "${row.customerOwner}" یافت نشد`
      });
    }

    // Check if branch exists
    const branch = branches.find(b => b.name === row.branchName);
    if (!branch) {
      errors.push({
        row: index + 1,
        field: "شعبه",
        message: `شعبه با نام "${row.branchName}" یافت نشد`
      });
    }

    // Validate year
    if (!row.year || row.year < 1400 || row.year > 1500) {
      errors.push({
        row: index + 1,
        field: "سال",
        message: "سال باید بین 1400 تا 1500 باشد"
      });
    }

    // Validate month
    if (!row.month || row.month < 1 || row.month > 12) {
      errors.push({
        row: index + 1,
        field: "ماه",
        message: "ماه باید بین 1 تا 12 باشد"
      });
    }

    // Validate numeric fields
    if (row.totalTransactions < 0) {
      errors.push({
        row: index + 1,
        field: "تعداد تراکنش",
        message: "تعداد تراکنش نمی‌تواند منفی باشد"
      });
    }

    if (row.totalAmount < 0) {
      errors.push({
        row: index + 1,
        field: "مبلغ کل",
        message: "مبلغ کل نمی‌تواند منفی باشد"
      });
    }

    if (row.revenue < 0) {
      errors.push({
        row: index + 1,
        field: "درآمد",
        message: "درآمد نمی‌تواند منفی باشد"
      });
    }

    // Validate status
    if (!Object.keys(statusLabels).includes(row.status)) {
      errors.push({
        row: index + 1,
        field: "وضعیت",
        message: `وضعیت باید یکی از: ${Object.keys(statusLabels).join(', ')} باشد`
      });
    }

    return errors;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsed: ParsedRow[] = jsonData.map((row: any) => ({
        customerShop: row["نام فروشگاه"] || "",
        customerOwner: row["نام مالک"] || "",
        branchName: row["نام شعبه"] || "",
        year: Number(row["سال"]) || 0,
        month: Number(row["ماه"]) || 0,
        totalTransactions: Number(row["تعداد تراکنش"]) || 0,
        totalAmount: Number(row["مبلغ کل"]) || 0,
        revenue: Number(row["درآمد"]) || 0,
        profit: Number(row["سود"]) || 0,
        status: row["وضعیت"] || "active",
        notes: row["یادداشت"] || "",
      }));

      // Validate all rows
      const allErrors: ValidationError[] = [];
      parsed.forEach((row, index) => {
        const rowErrors = validateRow(row, index);
        allErrors.push(...rowErrors);
      });

      setParsedData(parsed);
      setValidationErrors(allErrors);

      toast({
        title: "فایل پردازش شد",
        description: `${parsed.length} ردیف خوانده شد${allErrors.length > 0 ? ` - ${allErrors.length} خطا یافت شد` : ''}`,
        variant: allErrors.length > 0 ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در خواندن فایل Excel",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (validationErrors.length > 0) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا خطاهای موجود را برطرف کنید",
        variant: "destructive",
      });
      return;
    }

    // Convert parsed data to API format
    const importData = parsedData.map(row => {
      const customer = customers.find(c => 
        c.shopName === row.customerShop && c.ownerName === row.customerOwner
      );
      const branch = branches.find(b => b.name === row.branchName);

      return {
        customerId: customer?.id,
        branchId: branch?.id,
        year: row.year,
        month: row.month,
        totalTransactions: row.totalTransactions,
        totalAmount: row.totalAmount,
        revenue: row.revenue,
        profit: row.profit,
        status: row.status,
        notes: row.notes,
      };
    });

    importMutation.mutate(importData);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setIsProcessing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            بارگزاری آمار ماهانه از Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">دانلود فایل نمونه</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ابتدا فایل نمونه را دانلود کرده و طبق فرمت آن اطلاعات را وارد کنید
                  </p>
                </div>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                  data-testid="button-download-template"
                >
                  <Download className="h-4 w-4" />
                  دانلود نمونه
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="font-semibold">انتخاب فایل Excel</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    data-testid="input-excel-file"
                  />
                  {isProcessing && (
                    <div className="text-sm text-gray-600">در حال پردازش...</div>
                  )}
                </div>
                {file && (
                  <div className="text-sm text-gray-600">
                    فایل انتخاب شده: {file.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-700 dark:text-red-400">
                    خطاهای اعتبارسنجی ({validationErrors.length} خطا)
                  </h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 20).map((error, index) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400">
                      <strong>ردیف {error.row}:</strong> {error.field} - {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 20 && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      ... و {validationErrors.length - 20} خطای دیگر
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Data */}
          {parsedData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">پیش‌نمایش داده‌ها ({parsedData.length} ردیف)</h3>
                </div>
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="border border-gray-300 p-2 text-right">فروشگاه</th>
                        <th className="border border-gray-300 p-2 text-right">مالک</th>
                        <th className="border border-gray-300 p-2 text-right">شعبه</th>
                        <th className="border border-gray-300 p-2 text-right">سال/ماه</th>
                        <th className="border border-gray-300 p-2 text-right">تراکنش</th>
                        <th className="border border-gray-300 p-2 text-right">مبلغ کل</th>
                        <th className="border border-gray-300 p-2 text-right">درآمد</th>
                        <th className="border border-gray-300 p-2 text-right">سود</th>
                        <th className="border border-gray-300 p-2 text-right">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{row.customerShop}</td>
                          <td className="border border-gray-300 p-2">{row.customerOwner}</td>
                          <td className="border border-gray-300 p-2">{row.branchName}</td>
                          <td className="border border-gray-300 p-2">
                            {row.year}/{persianMonths[row.month - 1]}
                          </td>
                          <td className="border border-gray-300 p-2">{row.totalTransactions.toLocaleString('fa-IR')}</td>
                          <td className="border border-gray-300 p-2">{row.totalAmount.toLocaleString('fa-IR')}</td>
                          <td className="border border-gray-300 p-2">{row.revenue.toLocaleString('fa-IR')}</td>
                          <td className="border border-gray-300 p-2">{row.profit.toLocaleString('fa-IR')}</td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant="outline">
                              {statusLabels[row.status as keyof typeof statusLabels] || row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 10 && (
                    <div className="text-sm text-gray-600 mt-2">
                      ... و {parsedData.length - 10} ردیف دیگر
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
              <X className="h-4 w-4 mr-2" />
              لغو
            </Button>
            {parsedData.length > 0 && (
              <Button onClick={handleReset} variant="outline" data-testid="button-reset">
                پاک کردن
              </Button>
            )}
            <Button
              onClick={handleImport}
              disabled={parsedData.length === 0 || validationErrors.length > 0 || importMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-import"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending
                ? "در حال وارد کردن..."
                : `وارد کردن ${parsedData.length} آمار`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}