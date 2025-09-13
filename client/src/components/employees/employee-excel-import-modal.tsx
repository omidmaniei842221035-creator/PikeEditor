import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface EmployeeExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface EmployeeData {
  employeeCode: string;
  name: string;
  position: string;
  phone?: string;
  email?: string;
  branchId?: string;
  salary?: number;
}

export function EmployeeExcelImportModal({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: EmployeeExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<EmployeeData[]>([]);
  const [previewStep, setPreviewStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (employees: EmployeeData[]) => {
      return apiRequest("POST", "/api/employees/bulk-import", { employees });
    },
    onSuccess: (result: any) => {
      toast({
        title: "موفقیت",
        description: `${result.imported || parsedData.length} کارمند با موفقیت وارد شد`,
      });
      onImportComplete();
      resetModal();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در وارد کردن کارمندان",
        variant: "destructive",
      });
    },
  });

  const resetModal = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setParsedData([]);
    setPreviewStep(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const processExcelFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProgress(20);

    try {
      const buffer = await selectedFile.arrayBuffer();
      setProgress(40);
      
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      setProgress(60);
      
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Skip header row and process data
      const employees: EmployeeData[] = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1]) { // At least employeeCode and name are required
          employees.push({
            employeeCode: row[0]?.toString() || '',
            name: row[1]?.toString() || '',
            position: row[2]?.toString() || '',
            phone: row[3]?.toString() || '',
            email: row[4]?.toString() || '',
            branchId: row[5]?.toString() || '',
            salary: parseInt(row[6]) || 0,
          });
        }
      }
      
      setProgress(80);
      setParsedData(employees);
      setProgress(100);
      setPreviewStep(true);
      
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در خواندن فایل Excel",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleImport = () => {
    importMutation.mutate(parsedData);
  };

  const downloadTemplate = () => {
    // Create sample Excel template
    const templateData = [
      ['کد کارمند', 'نام', 'سمت', 'تلفن', 'ایمیل', 'شعبه', 'حقوق'],
      ['EMP001', 'علی احمدی', 'مدیر فروش', '09121234567', 'ali@company.com', 'branch-1', '25000000'],
      ['EMP002', 'فاطمه کریمی', 'کارشناس فنی', '09129876543', 'fateme@company.com', 'branch-1', '20000000'],
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'کارمندان');
    XLSX.writeFile(workbook, 'employee-template.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>بارگذاری کارمندان از فایل Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!previewStep ? (
            <>
              <div className="space-y-2">
                <Label>فایل Excel</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  data-testid="excel-file-input"
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">فرمت فایل Excel:</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  فایل Excel باید شامل ستون‌های زیر باشد:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ستون A: کد کارمند</li>
                  <li>• ستون B: نام</li>
                  <li>• ستون C: سمت</li>
                  <li>• ستون D: تلفن</li>
                  <li>• ستون E: ایمیل</li>
                  <li>• ستون F: شناسه شعبه</li>
                  <li>• ستون G: حقوق</li>
                </ul>
                <Button 
                  variant="link" 
                  onClick={downloadTemplate}
                  className="p-0 h-auto mt-2"
                  data-testid="download-template"
                >
                  دانلود فایل نمونه
                </Button>
              </div>
              
              {isProcessing && (
                <div className="space-y-2">
                  <p className="text-sm">در حال پردازش...</p>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">پیش‌نمایش کارمندان ({parsedData.length} نفر)</h4>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-1">کد</th>
                        <th className="text-right p-1">نام</th>
                        <th className="text-right p-1">سمت</th>
                        <th className="text-right p-1">تلفن</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((emp, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-1">{emp.employeeCode}</td>
                          <td className="p-1">{emp.name}</td>
                          <td className="p-1">{emp.position}</td>
                          <td className="p-1">{emp.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      و {parsedData.length - 5} کارمند دیگر...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 pt-4">
            {!previewStep ? (
              <>
                <Button 
                  onClick={processExcelFile}
                  disabled={!selectedFile || isProcessing}
                  data-testid="process-excel-button"
                >
                  {isProcessing ? "در حال پردازش..." : "📊 پردازش فایل"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="cancel-button"
                >
                  انصراف
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleImport}
                  disabled={importMutation.isPending || parsedData.length === 0}
                  data-testid="import-employees-button"
                >
                  {importMutation.isPending ? "در حال وارد کردن..." : `💾 وارد کردن ${parsedData.length} کارمند`}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setPreviewStep(false)}
                  data-testid="back-button"
                >
                  بازگشت
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}