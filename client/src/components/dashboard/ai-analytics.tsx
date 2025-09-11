import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AIAnalytics() {
  const aiFeatures = [
    {
      icon: "🎯",
      title: "پیش‌بینی فروش هوشمند",
      description: "الگوریتم Machine Learning برای تحلیل روندهای فروش",
      result: "+24%",
      resultLabel: "پیش‌بینی رشد ماه آینده",
      accuracy: "94.2%",
    },
    {
      icon: "🧠",
      title: "تحلیل رفتار مشتری",
      description: "شناسایی الگوهای خرید و تقسیم‌بندی مشتریان",
      result: "7",
      resultLabel: "گروه رفتاری شناسایی شده",
      accuracy: "89.7%",
    },
    {
      icon: "🎪",
      title: "تخصیص مناطق هوشمند",
      description: "بهینه‌سازی تقسیم مناطق با Clustering Algorithm",
      result: "12",
      resultLabel: "منطقه بهینه‌سازی شده",
      accuracy: "بهبود: +31%",
    },
    {
      icon: "⚠️",
      title: "تشخیص مشتریان پرخطر",
      description: "Early Warning System برای مشتریان در معرض ترک",
      result: "5",
      resultLabel: "مشتری پرخطر شناسایی شده",
      accuracy: "91.5%",
    },
    {
      icon: "📈",
      title: "بهینه‌سازی قیمت‌گذاری",
      description: "تحلیل حساسیت قیمت و پیشنهاد قیمت بهینه",
      result: "+15%",
      resultLabel: "افزایش سود پیش‌بینی شده",
      accuracy: "87.3%",
    },
    {
      icon: "🔮",
      title: "پیش‌بینی تقاضا",
      description: "تحلیل تقاضای محصولات با Time Series Analysis",
      result: "30",
      resultLabel: "روز پیش‌بینی دقیق",
      accuracy: "93.1%",
    },
  ];

  const smartSuggestions = [
    {
      priority: "اولویت بالا",
      title: "تماس فوری با مشتری احمدی",
      description: "احتمال ترک مشتری: 78%. پیشنهاد ارائه تخفیف ویژه",
      action: "اقدام فوری",
      color: "bg-red-50 border-red-200",
      actionColor: "bg-red-100 text-red-700 hover:bg-red-200",
    },
    {
      priority: "اولویت متوسط",
      title: "بازنگری قیمت محصول A",
      description: "امکان افزایش 12% قیمت بدون کاهش تقاضا",
      action: "بررسی",
      color: "bg-blue-50 border-blue-200",
      actionColor: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      priority: "اولویت پایین",
      title: "گسترش در منطقه جدید",
      description: "منطقه کرج پتانسیل رشد 40% دارد",
      action: "بررسی بیشتر",
      color: "bg-green-50 border-green-200",
      actionColor: "bg-green-100 text-green-700 hover:bg-green-200",
    },
  ];

  return (
    <div className="gradient-bg rounded-xl border border-border p-8 mb-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <span className="text-white text-xl">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold">تحلیل هوش مصنوعی پیشرفته</h3>
          <p className="text-white/80">سیستم‌های یادگیری ماشین و تحلیل رفتاری</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {aiFeatures.map((feature, index) => (
          <Card 
            key={index} 
            className="bg-white/10 backdrop-blur-sm border-white/20"
            data-testid={`ai-feature-${index}`}
          >
            <CardContent className="p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{feature.icon}</span>
                <h4 className="font-medium">{feature.title}</h4>
              </div>
              <p className="text-sm text-white/80 mb-3">{feature.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-white">{feature.result}</span>
                  <p className="text-xs text-white/60">{feature.resultLabel}</p>
                </div>
                <span className="text-sm text-white/80">دقت: {feature.accuracy}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6 text-white">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <span>💡</span>
            پیشنهادات هوشمند سیستم
          </h4>
          
          <div className="space-y-3">
            {smartSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${suggestion.color}`}
                data-testid={`suggestion-${index}`}
              >
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{suggestion.title}</p>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                  <Button
                    size="sm"
                    className={`text-xs mt-2 ${suggestion.actionColor}`}
                    variant="outline"
                  >
                    {suggestion.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
