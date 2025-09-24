import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PosStatsTrends } from "@/components/pos-stats/pos-stats-trends";
import { SmallMultiplesChart } from "./small-multiples-chart";
import { BoxPlotChart } from "./box-plot-chart";
import { BulletChart } from "./bullet-chart";
import { SankeyFlowChart } from "./sankey-flow-chart";
import { BankingUnitTrends } from "./banking-unit-trends";
import { UrbanGraphAnalysis } from "./urban-graph-analysis";
import { FlowODAnalysis } from "./flow-od-analysis";
import { ProfessionalFlowMaps } from "./professional-flow-maps";
import WhatIfSimulator from "./what-if-simulator";
import GeoHealthDashboard from "./geo-health-dashboard";
import { GeoForecastDashboard } from "./geo-forecast-dashboard";
import ComprehensiveReportingSystem from "./comprehensive-reporting-system";
import { RegionalAnalysisDashboard } from "./regional-analysis-dashboard";
import { useState, useMemo } from "react";
import { useFilter } from "@/pages/dashboard";

export function AnalyticsDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "profit" | "transactions">("revenue");
  const { selectedBankingUnitId } = useFilter();

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const { data: posStats = [] } = useQuery<any[]>({
    queryKey: ["/api/pos-stats"],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  // Filter customers by banking unit if selected
  const filteredCustomers = !selectedBankingUnitId || selectedBankingUnitId === "all" 
    ? customers 
    : customers.filter((c: any) => c.bankingUnitId === selectedBankingUnitId);

  const totalRevenue = filteredCustomers.reduce((sum: number, customer: any) => 
    sum + (customer.monthlyProfit || 0), 0
  );
  
  const avgProfit = filteredCustomers.length > 0 ? totalRevenue / filteredCustomers.length : 0;
  const activeCustomers = filteredCustomers.filter((c: any) => c.status === 'active').length;

  // Business type distribution
  const businessTypes = filteredCustomers.reduce((acc: Record<string, number>, customer: any) => {
    acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
    return acc;
  }, {});

  const topBusinessTypes = Object.entries(businessTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Status distribution
  const statusCounts = filteredCustomers.reduce((acc: Record<string, number>, customer: any) => {
    acc[customer.status] = (acc[customer.status] || 0) + 1;
    return acc;
  }, {});

  const statusLabels: Record<string, string> = {
    active: "کارآمد",
    inactive: "غیرفعال", 
    marketing: "بازاریابی",
    loss: "زیان‌ده",
    collected: "جمع‌آوری شده",
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    marketing: "bg-yellow-500", 
    loss: "bg-red-500",
    collected: "bg-blue-500",
  };

  // Prepare filtered data for charts - use useMemo for performance
  const filteredPosStats = useMemo(() => {
    if (!selectedBankingUnitId || selectedBankingUnitId === "all") {
      return posStats;
    }
    const unitCustomerIds = new Set(filteredCustomers.map(c => c.id));
    return (posStats as any[]).filter((stat: any) => unitCustomerIds.has(stat.customerId));
  }, [posStats, selectedBankingUnitId, filteredCustomers]);

  const filteredBranches = useMemo(() => {
    if (!selectedBankingUnitId || selectedBankingUnitId === "all") {
      return branches;
    }
    // Filter branches that have customers in the selected banking unit
    const branchIds = new Set(filteredCustomers.map(c => c.branchId).filter(Boolean));
    return branches.filter((branch: any) => branchIds.has(branch.id));
  }, [branches, selectedBankingUnitId, filteredCustomers]);

  // Prepare data for Small Multiples Chart
  const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];

  const smallMultiplesData = filteredBranches.slice(0, 8).map((branch: any) => {
    const branchStats = filteredPosStats.filter((stat: any) => stat.branchId === branch.id);
    
    const monthlyData = persianMonths.map((month, index) => {
      const monthIndex = index + 1;
      const monthStats = branchStats.filter((stat: any) => stat.month === monthIndex);
      
      const totalRevenue = monthStats.reduce((sum: number, stat: any) => sum + (stat.revenue || 0), 0);
      const totalProfit = monthStats.reduce((sum: number, stat: any) => sum + (stat.profit || 0), 0);
      const totalTransactions = monthStats.reduce((sum: number, stat: any) => sum + (stat.totalTransactions || 0), 0);
      
      return {
        month,
        monthIndex,
        revenue: totalRevenue / 1000000, // Convert to millions
        profit: totalProfit / 1000000,
        transactions: totalTransactions
      };
    });

    return {
      branchId: branch.id,
      branchName: branch.name,
      monthlyData
    };
  });

  // Prepare data for Box Plot Chart
  const boxPlotData = filteredBranches.map((branch: any) => {
    const branchStats = filteredPosStats.filter((stat: any) => stat.branchId === branch.id);
    const revenues = branchStats.map((stat: any) => (stat.revenue || 0) / 1000000);
    const profits = branchStats.map((stat: any) => (stat.profit || 0) / 1000000);
    const transactions = branchStats.map((stat: any) => stat.totalTransactions || 0);

    return {
      branchId: branch.id,
      branchName: branch.name,
      values: selectedMetric === "revenue" ? revenues : 
               selectedMetric === "profit" ? profits : transactions,
      stats: null // Will be calculated in the component
    };
  }).filter((data: any) => data.values.length > 0);

  // Prepare data for Bullet Chart
  const bulletChartData = filteredBranches.map((branch: any) => {
    const branchStats = filteredPosStats.filter((stat: any) => stat.branchId === branch.id);
    const currentMonth = new Date().getMonth() + 1;
    
    const currentStats = branchStats.filter((stat: any) => stat.month === currentMonth);
    const previousStats = branchStats.filter((stat: any) => stat.month === currentMonth - 1);
    
    const currentRevenue = currentStats.reduce((sum: number, stat: any) => sum + (stat.revenue || 0), 0) / 1000000;
    const currentProfit = currentStats.reduce((sum: number, stat: any) => sum + (stat.profit || 0), 0) / 1000000;
    const currentTransactions = currentStats.reduce((sum: number, stat: any) => sum + (stat.totalTransactions || 0), 0);
    
    const previousRevenue = previousStats.reduce((sum: number, stat: any) => sum + (stat.revenue || 0), 0) / 1000000;
    const previousProfit = previousStats.reduce((sum: number, stat: any) => sum + (stat.profit || 0), 0) / 1000000;
    const previousTransactions = previousStats.reduce((sum: number, stat: any) => sum + (stat.totalTransactions || 0), 0);

    const target = (branch.monthlyTarget || 100) / 1000000; // Convert to millions

    return {
      branchId: branch.id,
      branchName: branch.name,
      actual: selectedMetric === "revenue" ? currentRevenue : 
              selectedMetric === "profit" ? currentProfit : currentTransactions,
      target: selectedMetric === "transactions" ? 1000 : target,
      previous: selectedMetric === "revenue" ? previousRevenue : 
                selectedMetric === "profit" ? previousProfit : previousTransactions,
      benchmarks: {
        poor: target * 0.5,
        satisfactory: target * 0.8,
        good: target * 1.2
      }
    };
  });

  // Prepare data for Sankey Flow Chart
  const sankeyNodes = [
    ...filteredBranches.slice(0, 4).map((branch: any) => ({
      id: `source-${branch.id}`,
      label: branch.name,
      value: filteredCustomers.filter((c: any) => c.branchId === branch.id)
        .reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0) / 1000000,
      type: "source" as const
    })),
    { id: "region-center", label: "مرکز منطقه", value: 0, type: "intermediate" as const },
    { id: "target-customers", label: "مشتریان نهایی", value: totalRevenue / 1000000, type: "target" as const }
  ];

  const sankeyLinks = filteredBranches.slice(0, 4).map((branch: any) => {
    const branchRevenue = filteredCustomers.filter((c: any) => c.branchId === branch.id)
      .reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0) / 1000000;
    
    return {
      source: `source-${branch.id}`,
      target: "region-center",
      value: branchRevenue,
      label: `${branch.name} → مرکز`
    };
  });

  sankeyLinks.push({
    source: "region-center",
    target: "target-customers", 
    value: totalRevenue / 1000000,
    label: "تجمیع نهایی"
  });

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">تحلیل و آمار</h3>
        <p className="text-muted-foreground">آمار تفصیلی عملکرد و گزارش‌های مالی</p>
      </div>

      {/* Regional Analysis Banner */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-green-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-gradient-to-br from-blue-50/80 via-green-50/80 to-purple-50/80 dark:from-blue-900/20 dark:via-green-900/20 dark:to-purple-900/20 rounded-3xl p-8 border-2 border-green-200/50 dark:border-green-700/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-5xl animate-pulse">🗺️</span>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-purple-600 bg-clip-text text-transparent">
                  تحلیل منطقه‌ای هوشمند
                </h2>
                <p className="text-sm text-muted-foreground mt-1">✨ ابزار جامع مدیریت مناطق با رسم منحنی</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              مدیریت مناطق با رسم خطوط منحنی، شناسایی مناطق بکر، منطقه‌بندی خودکار و تحلیل توزیع مشتریان
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                <span className="font-medium">🎯 رسم مناطق منحنی</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
                <span className="font-medium">🔍 شناسایی مناطق بکر</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></span>
                <span className="font-medium">⚡ منطقه‌بندی خودکار</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Analysis Dashboard - TEST */}
      <div className="mb-12 p-6 bg-green-100 dark:bg-green-900 rounded-lg border-2 border-green-500">
        <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
          ✅ تحلیل منطقه‌ای هوشمند - تست
        </h3>
        <p className="text-green-700 dark:text-green-300">
          اگر این پیام را می‌بینید، یعنی بخش تحلیل کار می‌کند
        </p>
      </div>
      
      <RegionalAnalysisDashboard className="mb-12" />

      {/* Urban Graph Analysis Highlight Banner */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-blue-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-gradient-to-br from-emerald-50/80 via-blue-50/80 to-purple-50/80 dark:from-emerald-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 border-2 border-blue-200/50 dark:border-blue-700/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-5xl animate-pulse">🌐</span>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  تحلیل‌های گراف شهری پیشرفته
                </h2>
                <p className="text-sm text-muted-foreground mt-1">✨ ویژگی پیشرفته - در ادامه این صفحه</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-6 max-w-4xl mx-auto">
              کشف روابط پیچیده میان مناطق شهری، تحلیل شبکه‌های تجاری، خوشه‌بندی جوامع کسب‌وکار و بررسی تأثیرات سرریز
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="font-medium">🏘️ خوشه‌بندی جوامع تجاری</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                <span className="font-medium">🎯 تحلیل مرکزیت شبکه</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-ping"></span>
                <span className="font-medium">🌊 تأثیرات سرریز اقتصادی</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Filter Info */}
      {selectedBankingUnitId && selectedBankingUnitId !== "all" && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">نمایش آمار برای واحد بانکی انتخابی:</span>
          <span className="text-xs text-muted-foreground">
            {filteredCustomers.length} مشتری
          </span>
        </div>
      )}

      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">کل مشتریان</p>
                <p className="text-3xl font-bold text-blue-900" data-testid="total-customers">
                  {filteredCustomers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">درآمد کل</p>
                <p className="text-3xl font-bold text-green-900" data-testid="total-revenue">
                  {Math.round(totalRevenue / 1000000)}M
                </p>
                <p className="text-sm text-green-600">میلیون تومان</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">مشتریان فعال</p>
                <p className="text-3xl font-bold text-purple-900" data-testid="active-customers">
                  {activeCustomers}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">متوسط سود</p>
                <p className="text-3xl font-bold text-orange-900" data-testid="avg-profit">
                  {Math.round(avgProfit / 1000000)}M
                </p>
                <p className="text-sm text-orange-600">میلیون تومان</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Chart Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">📊 نمودار درآمد ماهانه</CardTitle>
              <Select defaultValue="6months">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">6 ماه اخیر</SelectItem>
                  <SelectItem value="12months">12 ماه اخیر</SelectItem>
                  <SelectItem value="2years">2 سال اخیر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <span className="text-6xl mb-4 block">📈</span>
                <p className="text-muted-foreground">نمودار درآمد ماهانه</p>
                <p className="text-sm text-muted-foreground">
                  درآمد کل: {Math.round(totalRevenue / 1000000)} میلیون تومان
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Business Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">📈 توزیع اصناف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBusinessTypes.map(([type, count]: [string, number], index) => {
                const percentage = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
                const colors = [
                  "bg-blue-500",
                  "bg-orange-500", 
                  "bg-green-500",
                  "bg-purple-500",
                ];
                const icons = ["🏪", "🍔", "💊", "🏬"];
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 ${colors[index]} rounded-full`}></div>
                      <span>{icons[index]} {type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className={`${colors[index]} rounded-full h-2`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
      </div>

      {/* Performance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">⚡ وضعیت عملکرد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {Object.entries(statusCounts).slice(0, 3).map(([status, count]: [string, number], index) => {
              const percentage = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;
              const color = statusColors[status] || "bg-gray-500";
              const label = statusLabels[status] || status;
              const icons = ["✅", "❌", "📈"];
              
              return (
                <div key={status} className="text-center p-6 bg-muted rounded-xl border">
                  <div className={`w-16 h-16 ${color} rounded-full mx-auto flex items-center justify-center mb-4`}>
                    <span className="text-white text-2xl">{icons[index]}</span>
                  </div>
                  <h5 className="font-semibold mb-2">{label}</h5>
                  <p className={`text-3xl font-bold mb-1`} data-testid={`status-${status}-count`}>
                    {count}
                  </p>
                  <p className="text-sm text-muted-foreground">{percentage}% کل مشتریان</p>
                  <div className="mt-3">
                    <Progress value={percentage} className="h-2" />
                  </div>
                </div>
              );
            })}
            
          </div>
        </CardContent>
      </Card>

      {/* Branch Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">🏢 تحلیل شعب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branches.slice(0, 5).map((branch: any, index: number) => {
              const branchCustomers = customers.filter((c: any) => c.branchId === branch.id);
              const branchRevenue = branchCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
              
              return (
                <div key={branch.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">
                        {branch.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{branch.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {branchCustomers.length} مشتری • مدیر: {branch.manager}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">
                      {Math.round(branchRevenue / 1000000)}M تومان
                    </p>
                    <p className={`text-sm font-medium ${
                      branch.performance >= 90 ? 'text-green-600' :
                      branch.performance >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {branch.performance}% عملکرد
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics Charts */}
      <div className="space-y-6">
        {/* Metric Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">🎛️ انتخاب معیار تحلیل</CardTitle>
              <Select 
                value={selectedMetric} 
                onValueChange={(value: "revenue" | "profit" | "transactions") => setSelectedMetric(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">درآمد (میلیون تومان)</SelectItem>
                  <SelectItem value="profit">سود (میلیون تومان)</SelectItem>
                  <SelectItem value="transactions">تعداد تراکنش</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Small Multiples Chart */}
        <SmallMultiplesChart 
          data={smallMultiplesData}
          metric={selectedMetric}
          title={`روند ماهانه ${selectedMetric === "revenue" ? "درآمد" : selectedMetric === "profit" ? "سود" : "تراکنش"} در شعب مختلف`}
        />

        {/* Box Plot Chart */}
        <BoxPlotChart 
          data={boxPlotData}
          metric={selectedMetric}
          title={`توزیع ${selectedMetric === "revenue" ? "درآمد" : selectedMetric === "profit" ? "سود" : "تراکنش"} بین شعب (شناسایی داده‌های پرت)`}
        />

        {/* Bullet Chart */}
        <BulletChart 
          data={bulletChartData}
          metric={selectedMetric}
          title={`پیشرفت نسبت به هدف ${selectedMetric === "revenue" ? "درآمد" : selectedMetric === "profit" ? "سود" : "تراکنش"} ماهانه`}
        />

        {/* Sankey Flow Chart */}
        <SankeyFlowChart 
          nodes={sankeyNodes}
          links={sankeyLinks}
          metric={selectedMetric}
          title={`جریان ${selectedMetric === "revenue" ? "درآمد" : selectedMetric === "profit" ? "سود" : "تراکنش"} از شعب به مرکز`}
        />
      </div>

      {/* Urban Graph Analysis - First Priority */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🌐 تحلیل‌های گراف شهری پیشرفته
          </h2>
          <p className="text-lg text-muted-foreground mt-3">
            تحلیل شبکه‌های تجاری شهری، خوشه‌بندی جوامع، مرکزیت و تأثیرات سرریز
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
        </div>
        <UrbanGraphAnalysis />
      </div>

      {/* Professional Interactive Flow Maps */}
      <div className="mb-12">
        <ProfessionalFlowMaps />
      </div>

      {/* Traditional Flow Analysis (for comparison) */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
            📊 تحلیل جریانات سنتی
          </h2>
          <p className="text-muted-foreground mt-2">
            نمایش تکمیلی با ابزارهای پایه
          </p>
          <div className="h-0.5 w-24 bg-gradient-to-r from-slate-400 to-slate-500 mx-auto mt-3 rounded-full"></div>
        </div>
        <FlowODAnalysis />
      </div>

      {/* Geo Health Score Dashboard */}
      <div className="mb-12">
        <GeoHealthDashboard />
      </div>

      {/* What-If Simulator */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🧠 شبیه‌ساز سناریو هوشمند
          </h2>
          <p className="text-lg text-muted-foreground mt-3">
            پیش‌بینی تأثیر تصمیمات استراتژیک با قدرت هوش مصنوعی
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
        </div>
        <WhatIfSimulator />
      </div>

      {/* Geo-Forecasting Dashboard */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            🗺️ پیش‌بینی جغرافیایی هوشمند
          </h2>
          <p className="text-lg text-muted-foreground mt-3">
            تحلیل و پیش‌بینی تراکنش‌های آینده بر پایه شبکه H3 و یادگیری ماشین
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto mt-4 rounded-full"></div>
        </div>
        <GeoForecastDashboard />
      </div>

      {/* Comprehensive Reporting System */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📊 سامانه گزارش‌گیری جامع
          </h2>
          <p className="text-lg text-muted-foreground mt-3">
            تولید گزارشات حرفه‌ای و جامع از عملکرد سامانه با فیلترهای پیشرفته
          </p>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
        </div>
        <ComprehensiveReportingSystem />
      </div>

      {/* Banking Unit Trends Analysis */}
      <BankingUnitTrends />

      {/* POS Trends Analysis */}
      <PosStatsTrends />
    </div>
  );
}
