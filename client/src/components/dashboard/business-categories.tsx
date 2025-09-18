import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Utensils, Pill, Store, Coffee, Sandwich } from "lucide-react";

interface AnalyticsData {
  businessTypes: Record<string, number>;
  totalCustomers: number;
}

export function BusinessCategories() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/overview"],
  });

  const businessTypeIcons: Record<string, any> = {
    "سوپرمارکت": ShoppingCart,
    "رستوران": Utensils,
    "داروخانه": Pill,
    "فروشگاه": Store,
    "کافه": Coffee,
    "نانوایی": Sandwich,
  };

  const businessTypeColors: Record<string, { bg: string; text: string; icon: string }> = {
    "سوپرمارکت": { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-600" },
    "رستوران": { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-600" }, 
    "داروخانه": { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-600" },
    "فروشگاه": { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-600" },
    "کافه": { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-600" },
    "نانوایی": { bg: "bg-pink-50", text: "text-pink-600", icon: "text-pink-600" },
  };

  const businessTypes = Object.entries(analytics?.businessTypes || {})
    .slice(0, 3) // Show top 3 business types
    .map(([type, count]) => ({
      name: type,
      count: typeof count === 'number' ? count : 0,
      icon: businessTypeIcons[type] || Store,
      colors: businessTypeColors[type] || { bg: "bg-gray-50", text: "text-gray-600", icon: "text-gray-600" },
      percentage: analytics?.totalCustomers 
        ? Math.round(((typeof count === 'number' ? count : 0) / analytics.totalCustomers) * 100)
        : 0,
    }));

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businessTypes.map((type, index) => {
          const IconComponent = type.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-all duration-200 border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 ${type.colors.bg} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${type.colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{type.name}</h4>
                    <p className="text-xs text-muted-foreground">اصناف فعال</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <p 
                    className={`text-2xl font-bold ${type.colors.text}`} 
                    data-testid={`business-type-${index}-count`}
                  >
                    {type.count}
                  </p>
                  <span className={`text-sm font-medium ${type.colors.text}`}>{type.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className={`${type.colors.text.replace('text-', 'bg-')} h-1.5 rounded-full transition-all duration-300`}
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
