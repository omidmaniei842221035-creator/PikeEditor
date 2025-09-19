import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useMemo } from "react";
import { useFilter } from "@/pages/dashboard";
import { TrendingUp, TrendingDown, Building, CreditCard, Users, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrendData {
  period: string;
  totalUnits: number;
  activeCustomers: number;
  revenue: number;
  transactions: number;
  unitTypes: Record<string, number>;
}

export function BankingUnitTrends() {
  const [timeFrame, setTimeFrame] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState<"customers" | "revenue" | "transactions" | "units">("customers");
  const { selectedBankingUnitId } = useFilter();

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: posStats = [] } = useQuery<any[]>({
    queryKey: ["/api/pos-stats"],
  });

  // Generate time periods based on selected timeframe
  const timePeriods = useMemo(() => {
    const periods = [];
    const currentDate = new Date();
    const monthCount = timeFrame === "3months" ? 3 : timeFrame === "6months" ? 6 : 12;
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      periods.push({
        period: date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' }),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthName: date.toLocaleDateString('fa-IR', { month: 'long' })
      });
    }
    return periods;
  }, [timeFrame]);

  // Filter customers by selected banking unit
  const filteredCustomers = useMemo(() => {
    if (!selectedBankingUnitId || selectedBankingUnitId === "all") {
      return customers;
    }
    return customers.filter((c: any) => c.bankingUnitId === selectedBankingUnitId);
  }, [customers, selectedBankingUnitId]);

  // Filter POS stats based on filtered customers
  const filteredPosStats = useMemo(() => {
    if (!selectedBankingUnitId || selectedBankingUnitId === "all") {
      return posStats;
    }
    const customerIds = new Set(filteredCustomers.map(c => c.id));
    return posStats.filter((stat: any) => customerIds.has(stat.customerId));
  }, [posStats, filteredCustomers, selectedBankingUnitId]);

  // Build real historical data from POS stats
  const trendData = useMemo(() => {
    return timePeriods.map((period) => {
      // Get stats for this specific month/year
      const monthStats = filteredPosStats.filter((stat: any) => 
        stat.year === period.year && stat.month === period.month
      );
      
      // Calculate active customers for this month (customers with transactions)
      const activeCustomerIds = new Set(monthStats.map(stat => stat.customerId));
      const activeCustomers = activeCustomerIds.size;
      
      // Calculate totals from real data
      const revenue = monthStats.reduce((sum, stat: any) => sum + (stat.revenue || 0), 0);
      const transactions = monthStats.reduce((sum, stat: any) => sum + (stat.totalTransactions || 0), 0);
      
      // Count banking units (current count - no historical data available)
      const currentUnits = selectedBankingUnitId && selectedBankingUnitId !== "all" ? 1 : bankingUnits.length;
      
      // Unit type distribution from current data
      const relevantUnits = selectedBankingUnitId && selectedBankingUnitId !== "all" 
        ? bankingUnits.filter(u => u.id === selectedBankingUnitId)
        : bankingUnits;
        
      const unitTypes = {
        branch: relevantUnits.filter(u => u.unitType === 'branch').length,
        counter: relevantUnits.filter(u => u.unitType === 'counter').length,
        shahrbnet_kiosk: relevantUnits.filter(u => u.unitType === 'shahrbnet_kiosk').length
      };

      return {
        ...period,
        totalUnits: currentUnits,
        activeCustomers,
        revenue: revenue / 1000000, // Convert to millions
        transactions,
        unitTypes
      };
    });
  }, [timePeriods, filteredPosStats, filteredCustomers, bankingUnits, selectedBankingUnitId]);

  // Calculate growth rates
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const latestData = trendData[trendData.length - 1];
  const previousData = trendData[trendData.length - 2];

  const growthMetrics = {
    customers: previousData ? calculateGrowth(latestData.activeCustomers, previousData.activeCustomers) : 0,
    revenue: previousData ? calculateGrowth(latestData.revenue, previousData.revenue) : 0,
    transactions: previousData ? calculateGrowth(latestData.transactions, previousData.transactions) : 0,
    units: previousData ? calculateGrowth(latestData.totalUnits, previousData.totalUnits) : 0,
  };

  const chartConfig = {
    customers: { label: "مشتریان فعال", color: "#3b82f6" },
    revenue: { label: "درآمد (میلیون تومان)", color: "#10b981" },
    transactions: { label: "تراکنش‌ها", color: "#f59e0b" },
    units: { label: "واحدهای بانکی", color: "#8b5cf6" },
  };

  // Unit type distribution for pie chart
  const unitTypeData = [
    { name: "شعبه", value: latestData?.unitTypes?.branch || 0, color: "#3b82f6" },
    { name: "باجه", value: latestData?.unitTypes?.counter || 0, color: "#10b981" },
    { name: "پیشخوان شهربانک", value: latestData?.unitTypes?.shahrbnet_kiosk || 0, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">📈 تحلیل روند زمانی واحدهای بانکی</h3>
        <p className="text-muted-foreground">نمایش رشد و تغییرات عملکرد در طول زمان</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium">بازه زمانی:</span>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-36" data-testid="timeframe-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">3 ماه گذشته</SelectItem>
            <SelectItem value="6months">6 ماه گذشته</SelectItem>
            <SelectItem value="12months">سال گذشته</SelectItem>
          </SelectContent>
        </Select>
        
        <span className="text-sm font-medium">متریک:</span>
        <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
          <SelectTrigger className="w-40" data-testid="metric-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customers">مشتریان فعال</SelectItem>
            <SelectItem value="revenue">درآمد</SelectItem>
            <SelectItem value="transactions">تراکنش‌ها</SelectItem>
            <SelectItem value="units">واحدهای بانکی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(growthMetrics).map(([key, growth]) => {
          const isPositive = growth >= 0;
          const Icon = key === 'customers' ? Users : key === 'revenue' ? Target : key === 'transactions' ? CreditCard : Building;
          
          return (
            <Card key={key} className={`${isPositive ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      رشد {chartConfig[key as keyof typeof chartConfig].label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`} data-testid={`growth-${key}`}>
                        {isPositive ? '+' : ''}{growth.toFixed(1)}%
                      </p>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <Icon className={`h-8 w-8 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 نمودار روند {chartConfig[selectedMetric].label}
            <Badge variant="outline" className="text-xs">
              {timeFrame === "3months" ? "3 ماهه" : timeFrame === "6months" ? "6 ماهه" : "سالانه"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80" data-testid="trend-chart">
            <ChartContainer config={chartConfig} className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartConfig[selectedMetric].color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartConfig[selectedMetric].color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke={chartConfig[selectedMetric].color} 
                    fillOpacity={1} 
                    fill={`url(#gradient-${selectedMetric})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Unit Type Distribution and Comparative Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏦 توزیع انواع واحدهای بانکی
              <Badge variant="secondary" className="text-xs">
                {latestData?.monthName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" data-testid="unit-type-chart">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={unitTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {unitTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {unitTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparative Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>📊 مقایسه عملکرد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600" data-testid="current-customers">
                    {latestData?.activeCustomers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">مشتریان فعال فعلی</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600" data-testid="current-units">
                    {latestData?.totalUnits || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">واحدهای بانکی</div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">میانگین عملکرد در بازه انتخابی:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">میانگین درآمد ماهی:</span>
                    <span className="font-medium">
                      {(trendData.reduce((sum, data) => sum + data.revenue, 0) / trendData.length).toFixed(1)}M تومان
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">میانگین تراکنش‌های ماهی:</span>
                    <span className="font-medium">
                      {Math.floor(trendData.reduce((sum, data) => sum + data.transactions, 0) / trendData.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">نرخ رشد متوسط:</span>
                    <span className={`font-medium ${Object.values(growthMetrics).reduce((sum, g) => sum + g, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(Object.values(growthMetrics).reduce((sum, g) => sum + g, 0) / Object.values(growthMetrics).length).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}