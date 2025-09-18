import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Utensils, Pill, Store, Coffee, Sandwich } from "lucide-react";
import { motion } from "framer-motion";

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

  const businessTypeGradients: Record<string, { gradient: string; shadow: string; glow: string }> = {
    "سوپرمارکت": { 
      gradient: "from-blue-600 via-sky-500 to-cyan-500", 
      shadow: "shadow-blue-500/25",
      glow: "group-hover:shadow-blue-500/40"
    },
    "رستوران": { 
      gradient: "from-orange-500 via-red-500 to-pink-500", 
      shadow: "shadow-orange-500/25",
      glow: "group-hover:shadow-orange-500/40"
    }, 
    "داروخانه": { 
      gradient: "from-emerald-500 via-teal-500 to-green-600", 
      shadow: "shadow-emerald-500/25",
      glow: "group-hover:shadow-emerald-500/40"
    },
    "فروشگاه": { 
      gradient: "from-purple-600 via-violet-500 to-indigo-500", 
      shadow: "shadow-purple-500/25",
      glow: "group-hover:shadow-purple-500/40"
    },
    "کافه": { 
      gradient: "from-amber-500 via-yellow-500 to-orange-500", 
      shadow: "shadow-amber-500/25",
      glow: "group-hover:shadow-amber-500/40"
    },
    "نانوایی": { 
      gradient: "from-pink-500 via-rose-500 to-red-400", 
      shadow: "shadow-pink-500/25",
      glow: "group-hover:shadow-pink-500/40"
    },
  };

  const businessTypes = Object.entries(analytics?.businessTypes || {})
    .slice(0, 3) // Show top 3 business types
    .map(([type, count]) => ({
      name: type,
      count: typeof count === 'number' ? count : 0,
      icon: businessTypeIcons[type] || Store,
      gradient: businessTypeGradients[type] || { 
        gradient: "from-gray-500 to-gray-600", 
        shadow: "shadow-gray-500/25",
        glow: "group-hover:shadow-gray-500/40"
      },
      percentage: analytics?.totalCustomers 
        ? Math.round(((typeof count === 'number' ? count : 0) / analytics.totalCustomers) * 100)
        : 0,
    }));

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">داشبورد اصناف تجاری</h3>
          <p className="text-sm text-muted-foreground">آمار کسب و کارهای فعال</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessTypes.map((type, index) => {
          const IconComponent = type.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group"
            >
              <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${type.gradient.gradient} ${type.gradient.shadow} shadow-xl hover:shadow-2xl ${type.gradient.glow} transition-all duration-500 hover:scale-105 cursor-pointer card-hover-effect`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <CardContent className="relative p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                      <IconComponent className="w-6 h-6 text-white drop-shadow-sm" />
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-white text-lg drop-shadow-sm">{type.name}</h4>
                      <p className="text-white/80 text-xs">اصناف فعال</p>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p 
                        className="text-3xl font-bold text-white drop-shadow-sm" 
                        data-testid={`business-type-${index}-count`}
                      >
                        {type.count}
                      </p>
                      <p className="text-white/70 text-xs">کسب و کار</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white drop-shadow-sm">{type.percentage}%</span>
                      <p className="text-white/70 text-xs">سهم بازار</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="h-full bg-white/50 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${type.percentage}%` }}
                        transition={{ delay: index * 0.2 + 0.8, duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
