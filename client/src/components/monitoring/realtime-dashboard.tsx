import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useRealtimeMonitoring } from "@/hooks/use-realtime-monitoring";
import { Wifi, WifiOff, Settings, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { PosDevice } from "@shared/schema";

export function RealtimeDashboard() {
  const { connectionStatus, isConnected } = useRealtimeMonitoring();
  
  const { data: devices = [] } = useQuery<PosDevice[]>({
    queryKey: ["/api/pos-devices"],
  });

  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ["/api/alerts/unread"],
  });

  const deviceStats = {
    total: devices.length,
    active: devices.filter((d) => d.status === 'active').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'offline':
        return 'text-red-600 bg-red-50';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'فعال';
      case 'offline':
        return 'آفلاین';
      case 'maintenance':
        return 'تعمیرات';
      default:
        return 'نامشخص';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            وضعیت اتصال زنده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant={isConnected ? "default" : "destructive"} data-testid="connection-status">
                {isConnected ? "متصل" : "قطع"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                وضعیت اتصال
              </p>
            </div>
            <div className="text-center">
              <p className="font-semibold" data-testid="device-updates-count">
                {connectionStatus.deviceUpdates}
              </p>
              <p className="text-sm text-muted-foreground">
                به‌روزرسانی دستگاه
              </p>
            </div>
            <div className="text-center">
              <p className="font-semibold" data-testid="alerts-count">
                {connectionStatus.alertCount}
              </p>
              <p className="text-sm text-muted-foreground">
                هشدار جدید
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" data-testid="connection-time">
                  {connectionStatus.connectionTime ? 
                    connectionStatus.connectionTime.toLocaleTimeString('fa-IR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 
                    '--:--'
                  }
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                زمان اتصال
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل دستگاه‌ها</p>
                <p className="text-2xl font-bold" data-testid="total-devices">{deviceStats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">فعال</p>
                <p className="text-2xl font-bold text-green-600" data-testid="active-devices">
                  {deviceStats.active}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">آفلاین</p>
                <p className="text-2xl font-bold text-red-600" data-testid="offline-devices">
                  {deviceStats.offline}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">تعمیرات</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="maintenance-devices">
                  {deviceStats.maintenance}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>وضعیت دستگاه‌های POS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="mx-auto h-12 w-12 mb-4" />
                <p>هیچ دستگاهی یافت نشد</p>
              </div>
            ) : (
              devices.map((device, index: number) => (
                <div 
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`device-${index}`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(device.status)}
                    <div>
                      <p className="font-medium">{device.deviceCode}</p>
                      <p className="text-sm text-muted-foreground">
                        آخرین اتصال: {device.lastConnection ? 
                          new Date(device.lastConnection).toLocaleString('fa-IR') : 
                          'هرگز'
                        }
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={getStatusColor(device.status)}
                    data-testid={`device-status-${index}`}
                  >
                    {getStatusText(device.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Update Info */}
      {connectionStatus.lastMessage && (
        <Card>
          <CardHeader>
            <CardTitle>آخرین به‌روزرسانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg" data-testid="last-message">
              <p className="text-sm">
                <strong>نوع:</strong> {connectionStatus.lastMessage.type}
              </p>
              <p className="text-sm">
                <strong>زمان:</strong> {new Date(connectionStatus.lastMessage.timestamp).toLocaleString('fa-IR')}
              </p>
              {connectionStatus.lastMessage.deviceCode && (
                <p className="text-sm">
                  <strong>دستگاه:</strong> {connectionStatus.lastMessage.deviceCode}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}