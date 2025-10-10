import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Download, Upload } from "lucide-react";

interface BranchExcelImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface BranchData {
  name: string;
  code: string;
  manager?: string;
  phone?: string;
  address?: string;
  city?: string;
  isActive?: boolean;
}

export function BranchExcelImportModal({ 
  open, 
  onOpenChange, 
  onImportComplete 
}: BranchExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<BranchData[]>([]);
  const [previewStep, setPreviewStep] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (branches: BranchData[]) => {
      return apiRequest("POST", "/api/branches/bulk-import", { branches });
    },
    onSuccess: (result: any) => {
      toast({
        title: "موفقیت",
        description: `${result.imported || parsedData.length} شعبه با موفقیت وارد شد`,
      });
      onImportComplete();
      resetModal();
    },
    onError: (error: any) => {
      const errorMessage = error.details?.join('\n') || error.message || "خطا در وارد کردن شعب";
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
      const branches: BranchData[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[1]) { // At least name and code are required
          const branch: BranchData = {
            name: row[0]?.toString() || '',
            code: row[1]?.toString() || '',
            manager: row[2]?.toString() || '',
            phone: row[3]?.toString() || '',
            address: row[4]?.toString() || '',
            city: row[5]?.toString() || '',
            isActive: row[6] !== undefined ? Boolean(row[6]) : true,
          };
          
          // Basic validation
          if (branch.name.length < 2) {
            errors.push(`ردیف ${i + 1}: نام شعبه باید حداقل ۲ کاراکتر باشد`);
            continue;
          }
          if (branch.code.length < 2) {
            errors.push(`ردیف ${i + 1}: کد شعبه باید حداقل ۲ کاراکتر باشد`);
            continue;
          }
          
          branches.push(branch);
        }
      }
      
      setProgress(80);
      setParsedData(branches);
      setImportErrors(errors);
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
    }
  };

  const downloadTemplate = () => {
    const template = [
      ["نام شعبه", "کد شعبه", "مدیر", "تلفن", "آدرس", "شهر", "فعال (TRUE/FALSE)"],
      ["شعبه مرکزی", "BR001", "علی احمدی", "041-33123456", "تبریز، میدان ساعت", "تبریز", "TRUE"],
      ["شعبه شهریار", "BR002", "فاطمه کریمی", "041-33234567", "تبریز، خیابان شهریار", "تبریز", "TRUE"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, "الگوی شعب");
    XLSX.writeFile(wb, "الگوی-بارگزاری-شعب.xlsx");
  };

  const confirmImport = () => {
    if (parsedData.length > 0) {
      importMutation.mutate(parsedData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            بارگزاری Excel شعب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!previewStep ? (
            // File Selection Step
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="hidden"
                  id="excel-file"
                />
                <Label
                  htmlFor="excel-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : "فایل Excel را انتخاب کنید"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    فرمت‌های پشتیبانی شده: .xlsx, .xls
                  </p>
                </Label>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="gap-2"
                  data-testid="button-download-template-branch"
                >
                  <Download className="w-4 h-4" />
                  دانلود الگو
                </Button>
                <Button
                  onClick={processExcelFile}
                  disabled={!selectedFile || isProcessing}
                  data-testid="button-process-excel-branch"
                >
                  {isProcessing ? "در حال پردازش..." : "پردازش فایل"}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    در حال پردازش فایل...
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Preview Step
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {parsedData.length} شعبه آماده وارد شدن
                  </Badge>
                  {importErrors.length > 0 && (
                    <Badge variant="destructive" className="gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {importErrors.length} خطا
                    </Badge>
                  )}
                </div>
              </div>

              {importErrors.length > 0 && (
                <div className="border border-destructive/20 bg-destructive/10 rounded p-4">
                  <h4 className="font-medium text-destructive mb-2">خطاهای اعتبارسنجی:</h4>
                  <ScrollArea className="max-h-32">
                    <ul className="text-sm space-y-1">
                      {importErrors.map((error, index) => (
                        <li key={index} className="text-destructive">• {error}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              <div className="border rounded">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="font-medium">پیش‌نمایش داده‌ها</h4>
                </div>
                <ScrollArea className="max-h-80">
                  <div className="p-4 space-y-3">
                    {parsedData.slice(0, 10).map((branch, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 p-3 border rounded text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">نام:</span>
                          <p className="mt-1">{branch.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">کد:</span>
                          <p className="mt-1">{branch.code}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">مدیر:</span>
                          <p className="mt-1">{branch.manager || "تعیین نشده"}</p>
                        </div>
                      </div>
                    ))}
                    {parsedData.length > 10 && (
                      <p className="text-center text-muted-foreground">
                        ... و {parsedData.length - 10} شعبه دیگر
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPreviewStep(false)}
                  data-testid="button-back-branch"
                >
                  بازگشت
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-cancel-import-branch"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={confirmImport}
                    disabled={parsedData.length === 0 || importMutation.isPending}
                    data-testid="button-confirm-import-branch"
                  >
                    {importMutation.isPending ? "در حال وارد کردن..." : 
                     `وارد کردن ${parsedData.length} شعبه`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}