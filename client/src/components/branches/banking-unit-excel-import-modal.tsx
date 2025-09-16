import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { parseExcelBankingUnitsFile, validateBankingUnitExcelData, type ExcelBankingUnitData } from "@/lib/excel-utils";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Download, AlertTriangle, CheckCircle, FileX, Users } from "lucide-react";
import * as XLSX from 'xlsx';

interface BankingUnitExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function BankingUnitExcelImportModal({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: BankingUnitExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ExcelBankingUnitData[]>([]);
  const [validationResult, setValidationResult] = useState<{
    valid: ExcelBankingUnitData[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);
  const [previewStep, setPreviewStep] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
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
        description: `${result.imported || parsedData.length} واحد مصرفی با موفقیت وارد شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/banking-units'] });
      onImportComplete();
      resetModal();
    },
    onError: (error: any) => {
      const errorMessage = error.details?.join('\n') || error.message || "خطا در وارد کردن واحدات مصرفی";
      toast({
        title: "خطا",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (error.details) {
        setImportErrors(error.details);
      }
    },
  });

  const resetModal = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setParsedData([]);
    setValidationResult(null);
    setPreviewStep(false);
    setImportErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportErrors([]);
      setValidationResult(null);
      setPreviewStep(false);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      // Parse Excel file
      setProgress(40);
      const rawData = await parseExcelBankingUnitsFile(selectedFile);
      
      setProgress(60);
      
      // Validate data
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
        setProgress(0);
        setIsProcessing(false);
        return;
      }
      
      setProgress(100);
      setPreviewStep(true);
      
      toast({
        title: "موفقیت",
        description: `${validation.valid.length} ردیف معتبر آماده وارد کردن است`,
      });
      
    } catch (error) {
      console.error("Excel processing error:", error);
      toast({
        title: "خطا در پردازش فایل",
        description: error instanceof Error ? error.message : "خطای نامشخص در پردازش فایل Excel",
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
        'کد واحد': 'BANK001',
        'نام واحد': 'واحد نمونه',
        'نوع واحد': 'شعبه',
        'نام مسئول': 'علی احمدی',
        'شماره تماس': '09123456789',
        'آدرس': 'تبریز، خیابان اصلی',
        'عرض جغرافیایی': '38.0962',
        'طول جغرافیایی': '46.2738',
        'وضعیت فعالیت': 'فعال'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الگوی واحدات مصرفی');
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // کد واحد
      { wch: 20 }, // نام واحد
      { wch: 15 }, // نوع واحد
      { wch: 15 }, // نام مسئول
      { wch: 15 }, // شماره تماس
      { wch: 30 }, // آدرس
      { wch: 15 }, // عرض جغرافیایی
      { wch: 15 }, // طول جغرافیایی
      { wch: 15 }  // وضعیت فعالیت
    ];
    
    XLSX.writeFile(workbook, 'template-banking-units.xlsx');
  };

  const getUnitTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'branch': 'شعبه',
      'atm': 'خودپرداز',
      'pos_center': 'مرکز پوز',
      'service_center': 'مرکز خدمات'
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            وارد کردن واحدات مصرفی از Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          {!previewStep && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">انتخاب فایل Excel</h3>
                    <p className="text-gray-500">فایل حاوی اطلاعات واحدات مصرفی را انتخاب کنید</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      data-testid="button-select-file"
                    >
                      {selectedFile ? selectedFile.name : "انتخاب فایل"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      data-testid="button-download-template"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      دانلود الگو
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid="text-selected-file">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} مگابایت
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={processExcelFile}
                      disabled={isProcessing}
                      data-testid="button-process-file"
                    >
                      {isProcessing ? "در حال پردازش..." : "پردازش فایل"}
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

              {importErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>خطاهای وارد کردن:</strong>
                      {importErrors.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Preview Section */}
          {previewStep && validationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">پیش‌نمایش داده‌ها</h3>
                <Button
                  variant="outline"
                  onClick={() => setPreviewStep(false)}
                  data-testid="button-back-to-upload"
                >
                  بازگشت به انتخاب فایل
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600" data-testid="text-valid-count">
                        {validationResult.valid.length}
                      </p>
                      <p className="text-sm text-green-700">ردیف معتبر</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileX className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600" data-testid="text-invalid-count">
                        {validationResult.invalid.length}
                      </p>
                      <p className="text-sm text-red-700">ردیف نامعتبر</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600" data-testid="text-total-count">
                        {validationResult.valid.length + validationResult.invalid.length}
                      </p>
                      <p className="text-sm text-blue-700">کل ردیف‌ها</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
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

              {/* Data Preview */}
              {validationResult.valid.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">نمونه داده‌های معتبر:</h4>
                  <ScrollArea className="h-64 border rounded-md">
                    <div className="p-4 space-y-3">
                      {validationResult.valid.slice(0, 5).map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            <div><strong>کد:</strong> {item.code}</div>
                            <div><strong>نام:</strong> {item.name}</div>
                            <div><strong>نوع:</strong> {getUnitTypeLabel(item.unitType)}</div>
                            {item.managerName && <div><strong>مسئول:</strong> {item.managerName}</div>}
                            {item.phone && <div><strong>تلفن:</strong> {item.phone}</div>}
                            {item.latitude && item.longitude && (
                              <div><strong>موقعیت:</strong> {item.latitude}, {item.longitude}</div>
                            )}
                          </div>
                        </div>
                      ))}
                      {validationResult.valid.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          و {validationResult.valid.length - 5} ردیف دیگر...
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Import Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={resetModal}
                  disabled={importMutation.isPending}
                  data-testid="button-cancel-import"
                >
                  انصراف
                </Button>
                <Button
                  onClick={() => importMutation.mutate(validationResult.valid)}
                  disabled={importMutation.isPending || validationResult.valid.length === 0}
                  data-testid="button-confirm-import"
                >
                  {importMutation.isPending ? "در حال وارد کردن..." : 
                   `وارد کردن ${validationResult.valid.length} واحد مصرفی`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}