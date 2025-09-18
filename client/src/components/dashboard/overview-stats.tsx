import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Store, CreditCard, Building, TrendingUp, Target } from "lucide-react";

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
      icon: Store,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "کل دستگاه‌های POS", 
      value: analytics?.totalCustomers || 0,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "واحدهای بانکی",
      value: analytics?.totalBankingUnits || 0,
      icon: Building,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "نرخ بهره‌وری",
      value: analytics?.totalCustomers && analytics.totalCustomers > 0 
        ? `${Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100)}%`
        : "0%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "پوشش تبریز",
      value: "85%",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      description: "هدف: 90%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">{stat.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`} data-testid={`stat-${index}-value`}>
                    {stat.value}
                  </p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  )}
                </div>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
