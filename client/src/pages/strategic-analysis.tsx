import { StrategicAnalysis } from '@/components/strategic-analysis';
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";
import { useLocation } from "wouter";

export function StrategicAnalysisPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4 mb-6">
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
        <h1 className="text-2xl font-bold">تحلیل استراتژیک</h1>
      </div>
      <StrategicAnalysis />
    </div>
  );
}