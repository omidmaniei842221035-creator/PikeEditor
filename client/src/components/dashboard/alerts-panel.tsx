import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, Bell, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

export function AlertsPanel() {
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/unread"],
  });

  const alertTypeConfig = {
    error: {
      icon: AlertCircle,
      gradient: "from-red-500 via-rose-500 to-pink-500",
      bgColor: "bg-red-50/80 dark:bg-red-950/30",
      textColor: "text-red-700 dark:text-red-300",
      shadowColor: "shadow-red-500/20",
      glowColor: "hover:shadow-red-500/30",
      borderGradient: "from-red-500 to-rose-500"
    },
    warning: {
      icon: AlertTriangle,
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
      textColor: "text-amber-700 dark:text-amber-300",
      shadowColor: "shadow-amber-500/20",
      glowColor: "hover:shadow-amber-500/30",
      borderGradient: "from-amber-500 to-orange-500"
    },
    info: {
      icon: Info,
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      bgColor: "bg-blue-50/80 dark:bg-blue-950/30",
      textColor: "text-blue-700 dark:text-blue-300",
      shadowColor: "shadow-blue-500/20",
      glowColor: "hover:shadow-blue-500/30",
      borderGradient: "from-blue-500 to-cyan-500"
    },
    default: {
      icon: Bell,
      gradient: "from-gray-500 via-slate-500 to-zinc-500",
      bgColor: "bg-gray-50/80 dark:bg-gray-950/30",
      textColor: "text-gray-700 dark:text-gray-300",
      shadowColor: "shadow-gray-500/20",
      glowColor: "hover:shadow-gray-500/30",
      borderGradient: "from-gray-500 to-slate-500"
    }
  };

  const getAlertConfig = (type: string) => {
    return alertTypeConfig[type as keyof typeof alertTypeConfig] || alertTypeConfig.default;
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white/30 to-red-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-orange-900/50" />
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg float-animation">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">هشدارهای مهم</CardTitle>
              <p className="text-sm text-muted-foreground">وضعیت سیستم و دستگاه‌ها</p>
            </div>
          </div>
          <AnimatePresence>
            {alerts.length > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative"
              >
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-lg text-sm px-3 py-1" data-testid="alerts-count">
                  {alerts.length}
                </Badge>
                {alerts.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>
      <CardContent className="pt-0 relative z-10">
        {alerts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">وضعیت عالی</p>
            <p className="text-xs text-muted-foreground">هیچ هشدار جدیدی وجود ندارد</p>
          </motion.div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {alerts.slice(0, 3).map((alert, index: number) => {
                const config = getAlertConfig(alert.type);
                const IconComponent = config.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className={`group relative overflow-hidden rounded-xl border-0 ${config.bgColor} ${config.shadowColor} shadow-lg hover:shadow-xl ${config.glowColor} transition-all duration-300 hover:scale-[1.02] card-hover-effect`}
                    data-testid={`alert-${index}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-5`} />
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.borderGradient}`} />
                    <div className="relative p-4 flex items-start gap-3">
                      <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${config.textColor} mb-1 line-clamp-1`}>{alert.title}</p>
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-2">{alert.message}</p>
                        <p className="text-xs text-muted-foreground/60">
                          {new Date(alert.createdAt).toLocaleString("fa-IR", {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${config.gradient} text-white shadow-sm`}>
                        {alert.type === 'error' ? 'خطا' :
                         alert.type === 'warning' ? 'هشدار' :
                         alert.type === 'info' ? 'اطلاع' : 'عمومی'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
