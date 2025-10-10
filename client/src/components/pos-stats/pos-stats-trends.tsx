import { useState, useMemo } from "react";
import { useFilter } from "@/pages/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";
import type { PosMonthlyStats } from "@shared/schema";

type ChartType = "line" | "bar" | "pie";
type TrendMetric = "transactions" | "revenue" | "profit" | "status";

export function PosStatsTrends() {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>("revenue");
  const [selectedYear, setSelectedYear] = useState("all");
  const { selectedBankingUnitId } = useFilter();

  const { data: posStats = [], isLoading } = useQuery<PosMonthlyStats[]>({
    queryKey: ["/api/pos-stats"],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];

  const statusColors = {
    active: "#10b981",
    normal: "#3b82f6", 
    marketing: "#f59e0b",
    maintenance: "#ef4444",
    inactive: "#6b7280"
  };

  const statusLabels = {
    active: "فعال",
    normal: "عادی",
    marketing: "بازاریابی",
    maintenance: "تعمیر",
    inactive: "غیرفعال"
  };

  // Filter and process data with useMemo for performance
  const filteredStats = useMemo(() => {
    let stats = posStats.filter(stat => 
      selectedYear === "all" || stat.year?.toString() === selectedYear
    );

    // Filter by banking unit if selected
    if (selectedBankingUnitId && selectedBankingUnitId !== "all") {
      const unitCustomers = customers.filter(c => c.bankingUnitId === selectedBankingUnitId);
      const unitCustomerIds = new Set(unitCustomers.map(c => c.id)); // Use Set for O(1) lookup
      stats = stats.filter(stat => unitCustomerIds.has(stat.customerId));
    }

    return stats;
  }, [posStats, selectedYear, selectedBankingUnitId, customers]);

  // Prepare trend data by month
  const trendData = persianMonths.map((month, index) => {
    const monthIndex = index + 1;
    const monthStats = filteredStats.filter(stat => stat.month === monthIndex);
    
    const totalTransactions = monthStats.reduce((sum, stat) => sum + (stat.totalTransactions || 0), 0);
    const totalRevenue = monthStats.reduce((sum, stat) => sum + (stat.revenue || 0), 0);
    const totalProfit = monthStats.reduce((sum, stat) => sum + (stat.profit || 0), 0);
    
    return {
      month,
      monthIndex,
      transactions: totalTransactions,
      revenue: totalRevenue / 1000000, // Convert to millions
      profit: totalProfit / 1000000, // Convert to millions
      count: monthStats.length
    };
  });

  // Prepare status distribution data
  const statusData = Object.entries(statusLabels).map(([key, label]) => {
    const count = filteredStats.filter(stat => stat.status === key).length;
    return {
      name: label,
      value: count,
      color: statusColors[key as keyof typeof statusColors]
    };
  }).filter(item => item.value > 0);

  // Calculate growth trends
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = trendData.length >= 2 ? 
    calculateGrowth(trendData[trendData.length - 1].revenue, trendData[trendData.length - 2].revenue) : 0;

  const profitGrowth = trendData.length >= 2 ? 
    calculateGrowth(trendData[trendData.length - 1].profit, trendData[trendData.length - 2].profit) : 0;

  const chartConfig = {
    revenue: {
      label: "درآمد (میلیون تومان)",
      color: "hsl(var(--chart-1))",
    },
    profit: {
      label: "سود (میلیون تومان)", 
      color: "hsl(var(--chart-2))",
    },
    transactions: {
      label: "تعداد تراکنش",
      color: "hsl(var(--chart-3))",
    },
  };

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {selectedMetric === "revenue" && <Line type="monotone" dataKey="revenue" stroke={chartConfig.revenue.color} strokeWidth={2} />}
              {selectedMetric === "profit" && <Line type="monotone" dataKey="profit" stroke={chartConfig.profit.color} strokeWidth={2} />}
              {selectedMetric === "transactions" && <Line type="monotone" dataKey="transactions" stroke={chartConfig.transactions.color} strokeWidth={2} />}
            </LineChart>
          </ChartContainer>
        );
      
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {selectedMetric === "revenue" && <Bar dataKey="revenue" fill={chartConfig.revenue.color} />}
              {selectedMetric === "profit" && <Bar dataKey="profit" fill={chartConfig.profit.color} />}
              {selectedMetric === "transactions" && <Bar dataKey="transactions" fill={chartConfig.transactions.color} />}
            </BarChart>
          </ChartContainer>
        );
      
      case "pie":
        return (
          <ChartContainer config={chartConfig} className="h-80">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ChartContainer>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pos-trends-container">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-trends-title">
          تحلیل روند آمار POS
        </h2>
      </div>

      {/* Growth Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رشد درآمد</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-revenue-growth">
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                </p>
              </div>
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رشد سود</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-profit-growth">
                  {profitGrowth > 0 ? '+' : ''}{profitGrowth.toFixed(1)}%
                </p>
              </div>
              {profitGrowth >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل آمار</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-stats">
                  {filteredStats.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>نمودار تحلیل روند</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32" data-testid="select-year">
                  <SelectValue placeholder="انتخاب سال" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه سال‌ها</SelectItem>
                  {Array.from(new Set(posStats.map(stat => stat.year))).sort().map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMetric} onValueChange={(value: TrendMetric) => setSelectedMetric(value)}>
                <SelectTrigger className="w-40" data-testid="select-metric">
                  <SelectValue placeholder="انتخاب متریک" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">درآمد</SelectItem>
                  <SelectItem value="profit">سود</SelectItem>
                  <SelectItem value="transactions">تراکنش‌ها</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg">
                <Button
                  variant={chartType === "line" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("line")}
                  data-testid="button-line-chart"
                >
                  <LineChartIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                  data-testid="button-bar-chart"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === "pie" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChartType("pie")}
                  data-testid="button-pie-chart"
                >
                  <PieChartIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div data-testid="chart-container">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>بینش‌های کلیدی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="insights-container">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">پرتراکنش‌ترین ماه</h4>
                <p className="text-blue-700 dark:text-blue-200">
                  {trendData.reduce((max, current) => 
                    current.transactions > max.transactions ? current : max
                  ).month} با {trendData.reduce((max, current) => 
                    current.transactions > max.transactions ? current : max
                  ).transactions.toLocaleString()} تراکنش
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100">پردرآمدترین ماه</h4>
                <p className="text-green-700 dark:text-green-200">
                  {trendData.reduce((max, current) => 
                    current.revenue > max.revenue ? current : max
                  ).month} با {trendData.reduce((max, current) => 
                    current.revenue > max.revenue ? current : max
                  ).revenue.toFixed(1)} میلیون تومان
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100">متوسط سود ماهانه</h4>
                <p className="text-purple-700 dark:text-purple-200">
                  {(trendData.reduce((sum, stat) => sum + stat.profit, 0) / trendData.length).toFixed(1)} میلیون تومان
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}