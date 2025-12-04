import { RealtimeDashboard } from "@/components/monitoring/realtime-dashboard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function Monitoring() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
            data-testid="back-to-main"
          >
            <Home className="h-4 w-4" />
            <span>بازگشت به منوی اصلی</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">مانیتورینگ زنده POS</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          به‌روزرسانی هر ۵ ثانیه
        </div>
      </div>
      
      <RealtimeDashboard />
    </div>
  );
}