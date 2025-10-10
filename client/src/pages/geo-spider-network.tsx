import { GeoSpiderWebNetwork } from "@/components/geo-spider-web-network";

export function GeoSpiderNetworkPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">نقشه تار عنکبوت جغرافیایی</h1>
          <p className="text-muted-foreground">
            تجسم روابط کسب‌وکار و واحدهای بانکی روی نقشه شهر تبریز
          </p>
        </div>
        
        <GeoSpiderWebNetwork />
      </div>
    </div>
  );
}