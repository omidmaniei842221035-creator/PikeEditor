import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { parseExcelFile, downloadSampleExcel } from "@/lib/excel-utils";
import { apiRequest } from "@/lib/queryClient";

interface UploadResult {
  success: number;
  errors: number;
  total: number;
  errorsList: string[];
}

export function ExcelManagement() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: any[]) => {
      setIsUploading(true);
      setUploadProgress(30);
      
      // Use the bulk import endpoint
      const response = await apiRequest("POST", "/api/excel/import", { 
        customers: data 
      });
      
      setUploadProgress(100);
      
<<<<<<< HEAD
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Process each customer in chunk
        for (const customer of chunk) {
          try {
            // Validate required fields
            if (!customer.shopName || !customer.ownerName || !customer.phone) {
              errors++;
              errorsList.push(`ردیف ${i * chunkSize + chunk.indexOf(customer) + 1}: فیلدهای ضروری کامل نیست`);
              continue;
            }
            
            // Process geo-location data if available
            let latitude: string | null = null;
            let longitude: string | null = null;
            
            if (customer.latitude && customer.longitude) {
              const lat = parseFloat(customer.latitude);
              const lng = parseFloat(customer.longitude);
              if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                latitude = lat.toString();
                longitude = lng.toString();
              }
            }
            
            // Create customer via API
            await apiRequest("POST", "/api/customers", {
              shopName: customer.shopName,
              ownerName: customer.ownerName,
              phone: customer.phone,
              businessType: customer.businessType || "سایر",
              address: customer.address || "",
              latitude: latitude,
              longitude: longitude,
              monthlyProfit: customer.monthlyProfit || 0,
              status: customer.status || "active",
            });
            
            success++;
          } catch (error) {
            errors++;
            errorsList.push(`ردیف ${i * chunkSize + chunk.indexOf(customer) + 1}: خطا در ثبت اطلاعات`);
          }
        }
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / chunks.length) * 100));
        
        // Add delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return {
        success,
        errors,
        total: success + errors,
        errorsList,
=======
      // Map server response to expected format with safe guards
      const result = {
        success: response?.summary?.success || 0,
        errors: response?.summary?.errors || 0,
        total: response?.summary?.total || 0,
        errorsList: (response?.summary?.errorDetails || []).map((err: any) => 
          `ردیف ${err.row}: ${err.message}`
        ),
>>>>>>> 57f38cf3e3015d4b44fff0502944e11ae333ab36
      };
      
      return result;
    },
    onSuccess: (result) => {
      setUploadResult(result);
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
      
      if (result.success > 0) {
        toast({
          title: "موفقیت",
          description: `${result.success} مشتری با موفقیت اضافه شد`,
        });
      }
      
      if (result.errors > 0) {
        toast({
          title: "هشدار",
          description: `${result.errors} مورد با خطا مواجه شد`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "خطا",
        description: "خطا در پردازش فایل",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "خطا",
        description: "لطفاً فایل اکسل (.xlsx یا .xls) انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await parseExcelFile(file);
      if (data.length === 0) {
        toast({
          title: "خطا", 
          description: "فایل خالی است یا قابل خواندن نیست",
          variant: "destructive",
        });
        return;
      }
      
      uploadMutation.mutate(data);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در خواندن فایل اکسل",
        variant: "destructive",
      });
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadSample = () => {
    downloadSampleExcel();
    toast({
      title: "موفقیت",
      description: "فایل نمونه دانلود شد",
    });
  };

  const sampleFields = [
    "نام فروشگاه",
    "نام مالک", 
    "شماره تماس",
    "نوع کسب‌وکار",
    "آدرس",
    "سود ماهانه",
    "وضعیت",
    "شعبه",
    "کارمند پشتیبان",
    "عرض جغرافیایی (latitude)",
    "طول جغرافیایی (longitude)",
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">بارگزاری اکسل</h3>
        <p className="text-muted-foreground">آپلود و مدیریت اطلاعات مشتریان از فایل اکسل</p>
      </div>

      {/* Download Sample Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            📥 دانلود فایل نمونه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            برای بارگزاری صحیح اطلاعات، ابتدا فایل نمونه را دانلود کرده و بر اساس آن اطلاعات خود را وارد کنید.
          </p>
          
          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-3">فیلدهای موجود در فایل نمونه:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
              {sampleFields.map((field, index) => (
                <span key={index}>• {field}</span>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleDownloadSample}
            className="bg-blue-600 text-white hover:bg-blue-700"
            data-testid="download-sample-button"
          >
            📋 دانلود فایل نمونه اکسل
          </Button>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📤 بارگزاری فایل اکسل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            data-testid="file-upload-zone"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-4xl">📁</span>
              </div>
              <div>
                <h4 className="font-medium mb-2">فایل اکسل خود را اینجا کلیک کنید یا بکشید</h4>
                <p className="text-sm text-muted-foreground">فرمت‌های مجاز: .xlsx, .xls</p>
              </div>
              <Button disabled={isUploading}>
                انتخاب فایل
              </Button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="file-input"
          />
          
          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm">در حال پردازش...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Results */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold text-green-600" data-testid="success-count">
              {uploadResult?.success || 0}
            </h3>
            <p className="text-green-700">موفق</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold text-red-600" data-testid="error-count">
              {uploadResult?.errors || 0}
            </h3>
            <p className="text-red-700">خطا</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="text-2xl font-bold text-blue-600" data-testid="total-count">
              {uploadResult?.total || 0}
            </h3>
            <p className="text-blue-700">کل</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Details */}
      {uploadResult && uploadResult.errorsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">خطاهای یافت شده:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <ul className="text-sm text-red-700 space-y-1">
                {uploadResult.errorsList.map((error, index) => (
                  <li key={index} data-testid={`error-${index}`}>• {error}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            💡 نکات مهم
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• حتماً از فایل نمونه استفاده کنید تا از صحت ساختار اطمینان حاصل شود</li>
            <li>• فیلدهای "نام فروشگاه"، "نام مالک" و "شماره تماس" اجباری هستند</li>
            <li>• حداکثر 1000 ردیف در هر فایل پشتیبانی می‌شود</li>
            <li>• در صورت وجود خطا، لیست دقیق خطاها نمایش داده می‌شود</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
