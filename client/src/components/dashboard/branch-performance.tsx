import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, Users, MapPin, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Branch {
  id: string;
  name: string;
  manager: string;
  performance: number;
}

export function BranchPerformance() {
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const getPerformanceConfig = (performance: number) => {
    if (performance >= 90) return {
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
      textColor: "text-emerald-700 dark:text-emerald-300",
      shadowColor: "shadow-emerald-500/20",
      glowColor: "group-hover:shadow-emerald-500/30",
      level: "عالی",
      icon: Award
    };
    if (performance >= 70) return {
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
      textColor: "text-amber-700 dark:text-amber-300",
      shadowColor: "shadow-amber-500/20",
      glowColor: "group-hover:shadow-amber-500/30",
      level: "متوسط",
      icon: TrendingUp
    };
    return {
      gradient: "from-red-500 via-rose-500 to-pink-500",
      bgColor: "bg-red-50/80 dark:bg-red-950/30",
      textColor: "text-red-700 dark:text-red-300",
      shadowColor: "shadow-red-500/20",
      glowColor: "group-hover:shadow-red-500/30",
      level: "ضعیف",
      icon: TrendingUp
    };
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-blue-900/50" />
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg float-animation">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground">عملکرد شعب</CardTitle>
            <p className="text-sm text-muted-foreground">آمار عملکرد واحدهای بانکی</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        <div className="space-y-4">
          <AnimatePresence>
            {branches.slice(0, 3).map((branch, index: number) => {
              const config = getPerformanceConfig(branch.performance);
              const PerformanceIcon = config.icon;
              return (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  data-testid={`branch-${index}`}
                  className={`group relative overflow-hidden rounded-xl border-0 ${config.bgColor} ${config.shadowColor} shadow-lg hover:shadow-xl ${config.glowColor} transition-all duration-300 hover:scale-[1.02] card-hover-effect`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-5`} />
                  <div className={`absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`} />
                  <div className="relative p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{branch.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-3 h-3 text-muted-foreground/60" />
                            <span className="text-xs text-muted-foreground">مدیر: {branch.manager}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
                          <PerformanceIcon className="w-3 h-3" />
                          <span className="text-sm font-bold">{branch.performance}%</span>
                        </div>
                        <p className={`text-xs mt-1 font-medium ${config.textColor}`}>{config.level}</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground/60">پیشرفت</span>
                        <span className="text-xs text-muted-foreground/60">100%</span>
                      </div>
                      <div className="w-full bg-white/50 dark:bg-gray-800/50 rounded-full h-3 overflow-hidden shadow-inner">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${config.gradient} rounded-full shadow-sm`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${branch.performance}%` }}
                          transition={{ delay: index * 0.2 + 0.8, duration: 1.2, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                        <span>0%</span>
                        <span className={`font-medium ${config.textColor}`}>{branch.performance}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">تبریز</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        آخرین به‌روزرسانی: امروز
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
