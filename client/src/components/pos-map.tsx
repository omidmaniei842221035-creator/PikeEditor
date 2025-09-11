import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initializeMap, addCustomerMarker, type MapInstance } from "@/lib/map-utils";

export function PosMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [mapType, setMapType] = useState("density");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current && mounted) {
        try {
          mapInstanceRef.current = await initializeMap(mapRef.current);
          if (mounted && mapInstanceRef.current?.map) {
            setMapReady(true);
          }
        } catch (error) {
          console.error('Failed to initialize map:', error);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current && mapInstanceRef.current.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapReady && mapInstanceRef.current?.map && customers.length > 0) {
      // Clear existing markers
      mapInstanceRef.current.markers.forEach(marker => marker.remove());
      mapInstanceRef.current.markers = [];

      // Filter customers based on selected filters
      const filteredCustomers = customers.filter((customer: any) => {
        const businessMatch = businessFilter === "all" || customer.businessType === businessFilter;
        const statusMatch = statusFilter === "all" || customer.status === statusFilter;
        return businessMatch && statusMatch;
      });

      // Add markers for filtered customers
      filteredCustomers.forEach((customer: any) => {
        if (customer.latitude && customer.longitude) {
          addCustomerMarker(
            mapInstanceRef.current!,
            customer,
            parseFloat(customer.latitude),
            parseFloat(customer.longitude)
          );
        }
      });
    }
  }, [mapReady, customers, businessFilter, statusFilter]);

  const mapStats = {
    visible: customers.filter((c: any) => {
      const businessMatch = businessFilter === "all" || c.businessType === businessFilter;
      const statusMatch = statusFilter === "all" || c.status === statusFilter;
      return businessMatch && statusMatch;
    }).length,
    avgRevenue: analytics?.avgProfit ? (analytics.avgProfit / 1000000).toFixed(1) + "M" : "0M",
    efficiency: analytics?.totalCustomers > 0 
      ? Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100) + "%"
      : "0%",
    clusters: 5, // Mock cluster count
  };

  return (
    <div className="space-y-6">
      {/* Map Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">فیلترهای نقشه</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع نقشه حرارتی:</label>
              <Select value={mapType} onValueChange={setMapType}>
                <SelectTrigger data-testid="map-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="density">🎯 تراکم دستگاه‌های POS</SelectItem>
                  <SelectItem value="transactions">💳 تراکم تراکنش‌ها</SelectItem>
                  <SelectItem value="revenue">💰 تراکم درآمد</SelectItem>
                  <SelectItem value="hotspots">🔥 نقاط داغ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">نوع صنف:</label>
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger data-testid="business-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه اصناف</SelectItem>
                  <SelectItem value="سوپرمارکت">سوپرمارکت</SelectItem>
                  <SelectItem value="داروخانه">داروخانه</SelectItem>
                  <SelectItem value="رستوران">رستوران</SelectItem>
                  <SelectItem value="فروشگاه">فروشگاه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">وضعیت POS:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="status-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">✅ کارآمد</SelectItem>
                  <SelectItem value="inactive">❌ زیان‌ده</SelectItem>
                  <SelectItem value="marketing">📢 در حال بازاریابی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">تحلیل زمان‌دار:</label>
              <Select defaultValue="month">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">📅 ماه گذشته</SelectItem>
                  <SelectItem value="quarter">📅 3 ماه گذشته</SelectItem>
                  <SelectItem value="half">📅 6 ماه گذشته</SelectItem>
                  <SelectItem value="year">📅 سال گذشته</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full" data-testid="apply-filters-button">
                اعمال فیلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Map Container */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">🗺️ نقشه تعاملی POS تبریز</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span data-testid="active-devices-count">{analytics?.activeCustomers || 0}</span> فعال
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span data-testid="offline-devices-count">
                  {(analytics?.totalCustomers || 0) - (analytics?.activeCustomers || 0)}
                </span> آفلاین
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef} 
            className="h-[600px] w-full rounded-lg overflow-hidden"
            data-testid="pos-map"
          />
        </CardContent>
      </Card>
      
      {/* Map Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary" data-testid="visible-customers">
              {mapStats.visible}
            </p>
            <p className="text-sm text-muted-foreground">مشتریان قابل مشاهده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary" data-testid="avg-revenue">
              {mapStats.avgRevenue}
            </p>
            <p className="text-sm text-muted-foreground">میانگین درآمد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600" data-testid="efficiency-rate">
              {mapStats.efficiency}
            </p>
            <p className="text-sm text-muted-foreground">نرخ بهره‌وری</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600" data-testid="clusters-count">
              {mapStats.clusters}
            </p>
            <p className="text-sm text-muted-foreground">خوشه شناسایی شده</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
