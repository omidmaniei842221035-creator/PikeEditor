import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIClustering } from "@/components/ai/ai-clustering";
import { AIForecasting } from "@/components/ai/ai-forecasting";
import { RadiusAnalysis } from "@/components/ai/radius-analysis";
import { Target, BarChart3, Navigation, Brain, ArrowRight } from "lucide-react";

export default function AIFeatures() {
  const [activeTab, setActiveTab] = useState("clustering");

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-to-main">
            <ArrowRight className="h-4 w-4" />
            بازگشت به منوی اصلی
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">تحلیل‌های هوش مصنوعی</h1>
          <p className="text-muted-foreground">
            ابزارهای پیشرفته هوش مصنوعی برای تحلیل مشتریان، پیش‌بینی فروش و بهینه‌سازی خدمات
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger 
            value="clustering" 
            className="flex items-center gap-2"
            data-testid="tab-clustering"
          >
            <Target className="h-4 w-4" />
            خوشه‌بندی هوشمند
          </TabsTrigger>
          <TabsTrigger 
            value="forecasting" 
            className="flex items-center gap-2"
            data-testid="tab-forecasting"
          >
            <BarChart3 className="h-4 w-4" />
            پیش‌بینی فروش
          </TabsTrigger>
          <TabsTrigger 
            value="radius" 
            className="flex items-center gap-2"
            data-testid="tab-radius"
          >
            <Navigation className="h-4 w-4" />
            تحلیل شعاع دسترسی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clustering" className="mt-0">
          <AIClustering />
        </TabsContent>

        <TabsContent value="forecasting" className="mt-0">
          <AIForecasting />
        </TabsContent>

        <TabsContent value="radius" className="mt-0">
          <RadiusAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}
