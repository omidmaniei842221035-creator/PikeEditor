import { RealtimeDashboard } from "@/components/monitoring/realtime-dashboard";

export default function Monitoring() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">مانیتورینگ زنده POS</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          به‌روزرسانی هر ۵ ثانیه
        </div>
      </div>
      
      <RealtimeDashboard />
    </div>
  );
}