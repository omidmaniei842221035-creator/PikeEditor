import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Store, CreditCard, Building, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useFilters } from "@/contexts/FiltersContext";
import { useMemo } from "react";

interface AnalyticsData {
  totalCustomers: number;
  activeCustomers: number;
  totalBankingUnits: number;
  businessTypes: Record<string, number>;
  statusCounts: Record<string, number>;
}

export function OverviewStats() {
  const { businessFilter, statusFilter, bankingUnitFilter } = useFilters();
  
  // Create filter query params
  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (businessFilter !== "all") params.set("businessType", businessFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (bankingUnitFilter !== "all") params.set("bankingUnit", bankingUnitFilter);
    return params.toString();
  }, [businessFilter, statusFilter, bankingUnitFilter]);

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/overview", filterParams],
    queryFn: async () => {
      const url = `/api/analytics/overview${filterParams ? `?${filterParams}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    }
  });

  const stats = [
    {
      title: "انواع اصناف",
      value: analytics?.businessTypes ? Object.keys(analytics.businessTypes).length : 0,
      icon: Store,
      gradient: "from-blue-600 via-blue-500 to-indigo-600",
      shadowColor: "shadow-blue-500/20",
      glowColor: "group-hover:shadow-blue-500/30",
    },
    {
      title: "کل دستگاه‌های POS", 
      value: analytics?.totalCustomers || 0,
      icon: CreditCard,
      gradient: "from-violet-600 via-purple-500 to-fuchsia-600",
      shadowColor: "shadow-purple-500/20",
      glowColor: "group-hover:shadow-purple-500/30",
    },
    {
      title: "واحدهای بانکی",
      value: analytics?.totalBankingUnits || 0,
      icon: Building,
      gradient: "from-emerald-600 via-teal-500 to-cyan-600",
      shadowColor: "shadow-emerald-500/20",
      glowColor: "group-hover:shadow-emerald-500/30",
    },
    {
      title: "نرخ بهره‌وری",
      value: analytics?.totalCustomers && analytics.totalCustomers > 0 
        ? `${Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100)}%`
        : "0%",
      icon: TrendingUp,
      gradient: "from-green-600 via-lime-500 to-emerald-600",
      shadowColor: "shadow-green-500/20",
      glowColor: "group-hover:shadow-green-500/30",
    },
    {
      title: "پوشش تبریز",
      value: "85%",
      icon: Target,
      gradient: "from-amber-600 via-orange-500 to-red-500",
      shadowColor: "shadow-orange-500/20",
      glowColor: "group-hover:shadow-orange-500/30",
      description: "هدف: 90%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="group"
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} ${stat.shadowColor} shadow-xl hover:shadow-2xl ${stat.glowColor} transition-all duration-500 hover:scale-105 cursor-pointer`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <CardContent className="relative p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-colors duration-300">
                    <IconComponent className="w-6 h-6 text-white drop-shadow-sm" />
                  </div>
                  <div className="text-right flex-1 mr-4">
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
                      {stat.title}
                    </p>
                    <p 
                      className="text-2xl font-bold text-white drop-shadow-sm" 
                      data-testid={`stat-${index}-value`}
                    >
                      {stat.value}
                    </p>
                    {stat.description && (
                      <p className="text-white/70 text-xs mt-1">{stat.description}</p>
                    )}
                  </div>
                </div>
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white/40 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
