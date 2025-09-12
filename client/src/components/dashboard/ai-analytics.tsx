import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { runAIAnalytics } from "@/lib/ai-analytics";
import type { Customer, Transaction } from "@shared/schema";

export function AIAnalytics() {
  const [aiResults, setAiResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch data needed for AI analysis
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Run AI analysis when data is available
  useEffect(() => {
    if (customers.length > 0) {
      setIsAnalyzing(true);
      
      // Convert customer data to proper format for AI analysis
      const customerData = customers.map(c => ({
        id: c.id,
        shopName: c.shopName,
        monthlyProfit: c.monthlyProfit || 0, // Handle null values
        status: c.status,
        businessType: c.businessType,
        createdAt: (c.createdAt ? c.createdAt.toString() : new Date().toISOString())
      }));
      
      // Convert transaction data to proper format (only use real transactions)
      const transactionData = transactions.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        customerId: t.customerId,
        date: t.createdAt?.toString() || t.date || new Date().toISOString(),
        posDeviceId: t.posDeviceId || 'pos-1'
      }));
      
      runAIAnalytics(customerData, transactionData)
        .then(results => {
          setAiResults(results);
          setIsAnalyzing(false);
        })
        .catch(error => {
          console.error('AI Analysis error:', error);
          setIsAnalyzing(false);
        });
    } else {
      setIsAnalyzing(false);
      setAiResults(null);
    }
  }, [customers, transactions]);

  if (isAnalyzing) {
    return (
      <div className="gradient-bg rounded-xl border border-border p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm animate-pulse">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">در حال تحلیل هوش مصنوعی...</h3>
            <p className="text-white/80">پردازش داده‌ها با الگوریتم‌های یادگیری ماشین</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin w-16 h-16 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">تحلیل رفتار مشتریان و پیش‌بینی فروش...</p>
        </div>
      </div>
    );
  }

  // Show zero-data state when no transactions exist
  if (transactions.length === 0) {
    return (
      <div className="gradient-bg rounded-xl border border-border p-8 mb-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">تحلیل هوش مصنوعی</h3>
            <p className="text-white/80">آماده برای تحلیل داده‌های شما</p>
          </div>
        </div>
        
        <div className="text-center py-12" data-testid="no-data-state">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📊</span>
          </div>
          <h4 className="text-xl font-medium mb-3">داده‌ای برای تحلیل یافت نشد</h4>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            برای استفاده از قابلیت‌های هوش مصنوعی، ابتدا تراکنش‌هایی در سیستم ثبت کنید.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <span>پیش‌بینی فروش</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <span>تحلیل رفتار مشتری</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <span>بهینه‌سازی قیمت</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!aiResults) {
    return null;
  }

  // Create dynamic AI features based on real results
  const aiFeatures = [
    {
      icon: "🎯",
      title: "پیش‌بینی فروش هوشمند",
      description: "الگوریتم Machine Learning برای تحلیل روندهای فروش",
      result: aiResults.salesForecast.nextMonthGrowth > 0 ? `+${aiResults.salesForecast.nextMonthGrowth}%` : `${aiResults.salesForecast.nextMonthGrowth}%`,
      resultLabel: `روند: ${aiResults.salesForecast.trend === 'growing' ? 'رو به رشد' : aiResults.salesForecast.trend === 'declining' ? 'نزولی' : 'ثابت'}`,
      accuracy: `${Math.round(aiResults.salesForecast.confidence * 100)}%`,
    },
    {
      icon: "🧠",
      title: "تحلیل رفتار مشتری",
      description: "شناسایی الگوهای خرید و تقسیم‌بندی مشتریان",
      result: aiResults.customerSegmentation.segments.length.toString(),
      resultLabel: "گروه رفتاری شناسایی شده",
      accuracy: `${Math.round(aiResults.customerSegmentation.accuracy * 100)}%`,
    },
    {
      icon: "🗺️",
      title: "تخصیص مناطق هوشمند",
      description: "بهینه‌سازی تقسیم مناطق با Clustering Algorithm",
      result: aiResults.areaOptimization.suggestions.length.toString(),
      resultLabel: "منطقه تحلیل شده",
      accuracy: `بهبود: +${aiResults.areaOptimization.overallImprovement}%`,
    },
    {
      icon: "⚠️",
      title: "تشخیص مشتریان پرخطر",
      description: "Early Warning System برای مشتریان در معرض ترک",
      result: aiResults.churnPrediction.highRiskCustomers.length.toString(),
      resultLabel: "مشتری پرخطر شناسایی شده",
      accuracy: `${Math.round(aiResults.churnPrediction.accuracy * 100)}%`,
    },
    {
      icon: "📈",
      title: "بهینه‌سازی قیمت‌گذاری",
      description: "تحلیل حساسیت قیمت و پیشنهاد قیمت بهینه",
      result: aiResults.pricingOptimization.recommendations.length > 0 ? 
        `+${Math.round(aiResults.pricingOptimization.recommendations[0]?.expectedIncrease || 0)}%` : '+0%',
      resultLabel: "افزایش سود پیش‌بینی شده",
      accuracy: `${Math.round(aiResults.pricingOptimization.accuracy * 100)}%`,
    },
    {
      icon: "🔮",
      title: "پیش‌بینی تقاضا",
      description: "تحلیل تقاضای محصولات با Time Series Analysis",
      result: aiResults.demandForecast.predictions.length.toString(),
      resultLabel: "نوع کسب‌وکار تحلیل شده",
      accuracy: `${Math.round(aiResults.demandForecast.accuracy * 100)}%`,
    },
  ];

  // Generate smart suggestions from AI results
  const smartSuggestions: any[] = [];
  
  // Add high-risk customer suggestions
  if (aiResults.churnPrediction.highRiskCustomers.length > 0) {
    const topRiskCustomer = aiResults.churnPrediction.highRiskCustomers[0];
    smartSuggestions.push({
      priority: "اولویت بالا",
      title: `تماس فوری با ${topRiskCustomer.shopName}`,
      description: `احتمال ترک مشتری: ${topRiskCustomer.churnProbability}%. ${topRiskCustomer.recommendedAction}`,
      action: "اقدام فوری",
      color: "bg-red-50 border-red-200",
      actionColor: "bg-red-100 text-red-700 hover:bg-red-200",
    });
  }
  
  // Add pricing optimization suggestions
  if (aiResults.pricingOptimization.recommendations.length > 0) {
    const topPricingRec = aiResults.pricingOptimization.recommendations[0];
    smartSuggestions.push({
      priority: "اولویت متوسط",
      title: `بازنگری قیمت ${topPricingRec.businessType}`,
      description: `امکان افزایش ${topPricingRec.expectedIncrease}% قیمت بدون کاهش تقاضا`,
      action: "بررسی",
      color: "bg-blue-50 border-blue-200",
      actionColor: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    });
  }
  
  // Add area optimization suggestions
  if (aiResults.areaOptimization.suggestions.length > 0) {
    const topAreaSuggestion = aiResults.areaOptimization.suggestions[0];
    smartSuggestions.push({
      priority: "اولویت متوسط",
      title: `بهبود منطقه ${topAreaSuggestion.area}`,
      description: `پتانسیل بهبود ${topAreaSuggestion.potentialImprovement}% در این منطقه`,
      action: "بررسی بیشتر",
      color: "bg-green-50 border-green-200",
      actionColor: "bg-green-100 text-green-700 hover:bg-green-200",
    });
  }

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
