import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileArchive, FileCode, Loader2, HardDrive, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DesktopFile {
  name: string;
  size: number;
  sizeFormatted: string;
  type: 'standalone' | 'portable' | 'executable';
  path: string;
  recommended?: boolean;
  warning?: string;
  description?: string;
}

export default function DesktopDownload() {
  const { data, isLoading } = useQuery<{ files: DesktopFile[] }>({
    queryKey: ['/api/desktop/files'],
  });

  const handleDownload = (file: DesktopFile) => {
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <HardDrive className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">دانلود نسخه دسکتاپ</h1>
          <p className="text-muted-foreground">نصب سامانه مانیتورینگ POS روی کامپیوتر ویندوزی</p>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-300">نسخه دسکتاپ</AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          این نسخه به صورت مستقل روی کامپیوتر شما اجرا می‌شود و از پایگاه داده SQLite استفاده می‌کند. 
          نیازی به اتصال به سرور ندارد و تمام داده‌ها به صورت محلی ذخیره می‌شوند.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !data?.files || data.files.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <FileCode className="h-16 w-16 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">فایل‌های دانلود موجود نیست</h3>
              <p className="text-sm text-muted-foreground">
                لطفاً ابتدا نسخه دسکتاپ را build کنید
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.files.map((file) => (
            <Card 
              key={file.path} 
              className={`hover:shadow-lg transition-shadow ${file.recommended ? 'border-2 border-green-500' : ''}`} 
              data-testid={`card-download-${file.type}`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  {file.type === 'standalone' ? (
                    <FileCode className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : file.type === 'portable' ? (
                    <FileArchive className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <FileCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {file.type === 'standalone' ? 'نسخه Standalone' : file.type === 'portable' ? 'نسخه Electron Portable' : 'فایل اجرایی'}
                      {file.recommended && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">توصیه می‌شود</span>}
                    </CardTitle>
                    <CardDescription>
                      {file.sizeFormatted}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {file.name}
                  </p>
                </div>

                {file.description && (
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ℹ️ {file.description}
                  </p>
                )}

                {file.warning && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ {file.warning}
                    </p>
                  </div>
                )}

                {file.type === 'standalone' ? (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">✅ نحوه استفاده:</p>
                    <ol className="list-decimal list-inside space-y-1 mr-4">
                      <li>فایل را extract کنید</li>
                      <li>فایل <code className="bg-muted px-1 rounded">start-standalone.bat</code> را اجرا کنید</li>
                      <li>مرورگر را باز کنید: <code className="bg-muted px-1 rounded">localhost:5000</code></li>
                      <li>نیاز به Node.js 18+ دارد</li>
                    </ol>
                  </div>
                ) : file.type === 'portable' ? (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">⚠️ نحوه استفاده (ممکن است کار نکند):</p>
                    <ol className="list-decimal list-inside space-y-1 mr-4">
                      <li>فایل را با 7-Zip یا WinRAR استخراج کنید</li>
                      <li>وارد پوشه <code className="bg-muted px-1 rounded">win-unpacked</code> شوید</li>
                      <li>فایل <code className="bg-muted px-1 rounded">electron.exe</code> را اجرا کنید</li>
                      <li>⚠️ SQLite ممکن است کار نکند (native deps)</li>
                    </ol>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      💡 برای اطمینان از کارکرد، از نسخه Standalone استفاده کنید
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold text-foreground">✅ نحوه استفاده:</p>
                    <ol className="list-decimal list-inside space-y-1 mr-4">
                      <li>فایل را دانلود کنید</li>
                      <li>به صورت مستقیم اجرا کنید</li>
                      <li>سیستم backend را راه‌اندازی می‌کند</li>
                      <li>رابط کاربری باز می‌شود</li>
                    </ol>
                  </div>
                )}

                <Button 
                  onClick={() => handleDownload(file)}
                  className={`w-full ${file.recommended ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  size="lg"
                  data-testid={`button-download-${file.type}`}
                >
                  <Download className="ml-2 h-5 w-5" />
                  دانلود {file.type === 'standalone' ? 'نسخه Standalone' : file.type === 'portable' ? 'نسخه Portable' : 'فایل اجرایی'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Info className="h-5 w-5" />
            نکات مهم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
          <div>
            <p className="font-semibold">🗄️ پایگاه داده:</p>
            <p className="mr-4">فایل SQLite در مسیر زیر ذخیره می‌شود:</p>
            <code className="block bg-amber-100 dark:bg-amber-900/50 p-2 rounded mt-1 mr-4 text-xs">
              C:\Users\[YourUsername]\AppData\Roaming\سامانه مانیتورینگ POS\pos-system.db
            </code>
          </div>
          
          <div>
            <p className="font-semibold">⚙️ ویژگی‌ها:</p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>21 جدول (Core + Grafana Enterprise + Network Analysis)</li>
              <li>مانیتورینگ Real-time با WebSocket</li>
              <li>تحلیل پیشرفته و AI Analytics</li>
              <li>نقشه جغرافیایی با Leaflet</li>
              <li>سیستم Backup & Restore</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">🔒 امنیت:</p>
            <ul className="list-disc list-inside mr-4 space-y-1">
              <li>Username پیش‌فرض: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">admin</code></li>
              <li>Password پیش‌فرض: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">admin123</code></li>
              <li>⚠️ حتماً پس از اولین ورود رمز را تغییر دهید!</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold">📚 مستندات کامل:</p>
            <p className="mr-4">
              برای راهنمای کامل نصب و استفاده، فایل <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">README-DESKTOP.md</code> را در پروژه مشاهده کنید.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
