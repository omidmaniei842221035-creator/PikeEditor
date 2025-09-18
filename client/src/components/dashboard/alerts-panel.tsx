import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, Bell } from "lucide-react";

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

  const getAlertTypeStyle = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return AlertCircle;
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Bell;
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-red-600" />
            </div>
            <CardTitle className="text-sm font-semibold">هشدارهای مهم</CardTitle>
          </div>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="text-xs" data-testid="alerts-count">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm">هیچ هشدار جدیدی وجود ندارد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 3).map((alert, index: number) => {
              const IconComponent = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertTypeStyle(alert.type)}`}
                  data-testid={`alert-${index}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{alert.title}</p>
                    <p className="text-xs opacity-80 mt-1 line-clamp-2">{alert.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(alert.createdAt).toLocaleString("fa-IR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
