import { GeoSpiderWebNetwork } from "@/components/geo-spider-web-network";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";
import { useLocation } from "wouter";

export function GeoSpiderNetworkPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
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
          <div>
            <h1 className="text-3xl font-bold mb-2">نقشه تار عنکبوت جغرافیایی</h1>
            <p className="text-muted-foreground">
              تجسم روابط کسب‌وکار و واحدهای بانکی روی نقشه شهر تبریز
            </p>
          </div>
        </div>
        
        <GeoSpiderWebNetwork />
      </div>
    </div>
  );
}