import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, AlertTriangle, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";

export function BackupRestore() {
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downloadBackup = async () => {
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "موفقیت",
        description: "فایل بک‌آپ با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دانلود بک‌آپ",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackupFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          setBackupData(json);
        } catch (error) {
          toast({
            title: "خطا",
            description: "فایل بک‌آپ معتبر نیست",
            variant: "destructive",
          });
          setBackupFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!backupData) throw new Error("No backup data");
      return apiRequest("POST", "/api/restore", {
        data: backupData.data,
        clearExisting: true,
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries();
      toast({
        title: "موفقیت",
        description: `بک‌آپ با موفقیت بازیابی شد. ${response.restored.customers} مشتری، ${response.restored.branches} شعبه، ${response.restored.employees} کارمند بازیابی شد`,
      });
      setBackupFile(null);
      setBackupData(null);
      setShowRestoreConfirm(false);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بازیابی بک‌آپ",
        variant: "destructive",
      });
    },
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/analytics/overview"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            💾 پشتیبان‌گیری و بازیابی
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            مدیریت بک‌آپ و بازیابی اطلاعات سیستم
          </p>
        </div>

        {/* Current System Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              وضعیت فعلی سیستم
            </CardTitle>
            <CardDescription>
              اطلاعات موجود در پایگاه داده
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.totalCustomers || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">مشتریان</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats?.activeCustomers || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">مشتریان فعال</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` : '0'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">درآمد کل</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {stats?.bankingUnits || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">واحدهای بانکی</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              دانلود بک‌آپ
            </CardTitle>
            <CardDescription>
              دانلود کامل اطلاعات سیستم به صورت فایل JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📋 اطلاعات شامل:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 mr-6 list-disc">
                  <li>تمام مشتریان و اطلاعات آنها</li>
                  <li>شعبات و کارکنان</li>
                  <li>دستگاه‌های POS و آمار ماهانه</li>
                  <li>واحدهای بانکی و مناطق</li>
                  <li>هشدارها و بازدیدها</li>
                </ul>
              </div>
              
              <Button 
                onClick={downloadBackup} 
                size="lg" 
                className="w-full"
                data-testid="download-backup-button"
              >
                <Download className="h-5 w-5 ml-2" />
                دانلود فایل بک‌آپ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              بازیابی از بک‌آپ
            </CardTitle>
            <CardDescription>
              بارگذاری و بازیابی اطلاعات از فایل بک‌آپ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      ⚠️ هشدار مهم
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      بازیابی بک‌آپ تمام اطلاعات فعلی را پاک می‌کند و با اطلاعات فایل بک‌آپ جایگزین می‌کند.
                      لطفاً قبل از بازیابی، حتماً از اطلاعات فعلی بک‌آپ بگیرید.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-file">انتخاب فایل بک‌آپ</Label>
                <Input
                  id="backup-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  data-testid="backup-file-input"
                />
              </div>

              {backupData && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        ✅ فایل بک‌آپ معتبر است
                      </h3>
                      <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        <p>📅 تاریخ بک‌آپ: {new Date(backupData.timestamp).toLocaleDateString('fa-IR')}</p>
                        <p>📊 تعداد مشتریان: {backupData.data?.customers?.length || 0}</p>
                        <p>🏢 تعداد شعبات: {backupData.data?.branches?.length || 0}</p>
                        <p>👥 تعداد کارکنان: {backupData.data?.employees?.length || 0}</p>
                        <p>🏦 تعداد واحدهای بانکی: {backupData.data?.bankingUnits?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowRestoreConfirm(true)}
                disabled={!backupData || restoreMutation.isPending}
                variant="destructive"
                size="lg"
                className="w-full"
                data-testid="restore-backup-button"
              >
                <Upload className="h-5 w-5 ml-2" />
                {restoreMutation.isPending ? "در حال بازیابی..." : "بازیابی از بک‌آپ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                این عملیات تمام اطلاعات فعلی شامل {stats?.totalCustomers || 0} مشتری، 
                شعبات، کارکنان و سایر داده‌ها را پاک می‌کند.
              </p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                این عملیات قابل بازگشت نیست!
              </p>
              <p>
                آیا می‌خواهید ادامه دهید؟
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-restore-button">لغو</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-restore-button"
            >
              بله، بازیابی کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
