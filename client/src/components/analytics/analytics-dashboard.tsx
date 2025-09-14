import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PosStatsTrends } from "@/components/pos-stats/pos-stats-trends";

export function AnalyticsDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["/api/branches"],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const totalRevenue = customers.reduce((sum: number, customer: any) => 
    sum + (customer.monthlyProfit || 0), 0
  );
  
  const avgProfit = customers.length > 0 ? totalRevenue / customers.length : 0;
  const activeCustomers = customers.filter((c: any) => c.status === 'active').length;

  // Business type distribution
  const businessTypes = customers.reduce((acc: Record<string, number>, customer: any) => {
    acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
    return acc;
  }, {});

  const topBusinessTypes = Object.entries(businessTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Status distribution
  const statusCounts = customers.reduce((acc: Record<string, number>, customer: any) => {
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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">تحلیل و آمار</h3>
        <p className="text-muted-foreground">آمار تفصیلی عملکرد و گزارش‌های مالی</p>
      </div>

      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">کل مشتریان</p>
                <p className="text-3xl font-bold text-blue-900" data-testid="total-customers">
                  {customers.length}
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
              {topBusinessTypes.map(([type, count], index) => {
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
            
            {Object.entries(statusCounts).slice(0, 3).map(([status, count], index) => {
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

      {/* POS Trends Analysis */}
      <PosStatsTrends />
    </div>
  );
}
