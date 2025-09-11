import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export function BusinessCategories() {
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  const businessTypeIcons: Record<string, string> = {
    "سوپرمارکت": "🛒",
    "رستوران": "🍽️",
    "داروخانه": "💊",
    "فروشگاه": "🏬",
    "کافه": "☕",
    "نانوایی": "🍞",
  };

  const businessTypeColors: Record<string, string> = {
    "سوپرمارکت": "bg-blue-500",
    "رستوران": "bg-orange-500", 
    "داروخانه": "bg-green-500",
    "فروشگاه": "bg-purple-500",
    "کافه": "bg-amber-500",
    "نانوایی": "bg-pink-500",
  };

  const businessTypes = Object.entries(analytics?.businessTypes || {})
    .slice(0, 3) // Show top 3 business types
    .map(([type, count]) => ({
      name: type,
      count,
      icon: businessTypeIcons[type] || "🏪",
      color: businessTypeColors[type] || "bg-gray-500",
      percentage: analytics?.totalCustomers 
        ? Math.round((count / analytics.totalCustomers) * 100)
        : 0,
    }));

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-6">🏪 داشبورد اصناف</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessTypes.map((type, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{type.name}</h4>
                <span className="text-2xl">{type.icon}</span>
              </div>
              <p 
                className="text-3xl font-bold text-primary mb-2" 
                data-testid={`business-type-${index}-count`}
              >
                {type.count}
              </p>
              <p className="text-sm text-muted-foreground">POS فعال در تبریز</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className={`${type.color} h-2 rounded-full`}
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">{type.percentage}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
