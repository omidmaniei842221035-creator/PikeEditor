import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  totalBankingUnits: number;
  businessTypes: Record<string, number>;
  statusCounts: Record<string, number>;
}

export function OverviewStats() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/overview"],
  });

  const stats = [
    {
      title: "انواع اصناف",
      value: analytics?.businessTypes ? Object.keys(analytics.businessTypes).length : 0,
      icon: "🏪",
      color: "text-primary",
    },
    {
      title: "کل دستگاه‌های POS", 
      value: analytics?.totalCustomers || 0,
      icon: "💳",
      color: "text-secondary",
    },
    {
      title: "واحدهای بانکی",
      value: analytics?.totalBankingUnits || 0,
      icon: "🏦",
      color: "text-blue-600",
    },
    {
      title: "نرخ بهره‌وری",
      value: analytics?.totalCustomers && analytics.totalCustomers > 0 
        ? `${Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100)}%`
        : "0%",
      icon: "📈",
      color: "text-green-600",
    },
    {
      title: "پوشش تبریز",
      value: "85%",
      icon: "🎯",
      color: "text-blue-600",
      description: "هدف: 90%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`} data-testid={`stat-${index}-value`}>
                  {stat.value}
                </p>
                {stat.description && (
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
