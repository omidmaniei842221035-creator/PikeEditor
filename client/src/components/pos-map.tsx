import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Target, MapPin } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { initializeMap, addCustomerMarker, isMarkerInRegion, getRegionStatistics, type MapInstance } from "@/lib/map-utils";
import { BankingUnitPlacementModal } from "@/components/branches/banking-unit-placement-modal";

export function PosMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [mapType, setMapType] = useState("density");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mapReady, setMapReady] = useState(false);
  const [regionAnalysisEnabled, setRegionAnalysisEnabled] = useState(false);
  const [addBankingUnitMode, setAddBankingUnitMode] = useState(false);
  const [regionStats, setRegionStats] = useState<{
    totalInRegion: number;
    activeInRegion: number;
    regionRevenue: number;
  } | null>(null);
  const [pendingBranchLocation, setPendingBranchLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasActiveRegions, setHasActiveRegions] = useState(false);
  
  // Use refs to avoid stale closures
  const addBankingUnitModeRef = useRef(addBankingUnitMode);
  const regionAnalysisEnabledRef = useRef(regionAnalysisEnabled);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  // Update refs when state changes
  useEffect(() => {
    addBankingUnitModeRef.current = addBankingUnitMode;
  }, [addBankingUnitMode]);

  useEffect(() => {
    regionAnalysisEnabledRef.current = regionAnalysisEnabled;
  }, [regionAnalysisEnabled]);

  // Callback to handle region changes
  const handleRegionChange = useCallback((hasRegions: boolean) => {
    setHasActiveRegions(hasRegions);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current && mounted) {
        try {
          mapInstanceRef.current = await initializeMap(mapRef.current, handleRegionChange);
          if (mounted && mapInstanceRef.current?.map) {
            setMapReady(true);
            
            // Add click listener for banking unit placement - using refs to avoid stale closure
            mapInstanceRef.current.map.on('click', (e: any) => {
              if (addBankingUnitModeRef.current) {
                const { lat, lng } = e.latlng;
                setPendingBranchLocation({ lat, lng });
                setAddBankingUnitMode(false); // Exit mode after click
              }
            });
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
  }, [handleRegionChange]);

  useEffect(() => {
    if (mapReady && mapInstanceRef.current?.map && (customers as any[]).length > 0) {
      // Clear existing markers
      mapInstanceRef.current.markers.forEach(marker => marker.remove());
      mapInstanceRef.current.markers = [];

      // Filter customers based on selected filters
      const filteredCustomers = (customers as any[]).filter((customer: any) => {
        const businessMatch = businessFilter === "all" || customer.businessType === businessFilter;
        const statusMatch = statusFilter === "all" || customer.status === statusFilter;
        return businessMatch && statusMatch;
      });

      // Add markers for filtered customers
      filteredCustomers.forEach((customer: any) => {
        if (customer.latitude && customer.longitude) {
          const marker = addCustomerMarker(
            mapInstanceRef.current!,
            customer,
            parseFloat(customer.latitude),
            parseFloat(customer.longitude)
          );
          
          // If region analysis is enabled, check if marker should be visible
          if (regionAnalysisEnabled && hasActiveRegions) {
            const inRegion = isMarkerInRegion(mapInstanceRef.current!, marker);
            if (!inRegion) {
              marker.setOpacity(0.3); // Make markers outside region semi-transparent
            }
          }
        }
      });
      
      // Update region statistics
      if (regionAnalysisEnabled && hasActiveRegions) {
        const stats = getRegionStatistics(mapInstanceRef.current!, filteredCustomers as any[]);
        setRegionStats(stats);
      } else {
        setRegionStats(null);
      }
    }
  }, [mapReady, customers, businessFilter, statusFilter, regionAnalysisEnabled, hasActiveRegions]);

  const mapStats = {
    visible: (customers as any[]).filter((c: any) => {
      const businessMatch = businessFilter === "all" || c.businessType === businessFilter;
      const statusMatch = statusFilter === "all" || c.status === statusFilter;
      return businessMatch && statusMatch;
    }).length,
    avgRevenue: (analytics as any)?.avgProfit ? ((analytics as any).avgProfit / 1000000).toFixed(1) + "M" : "0M",
    efficiency: (analytics as any)?.totalCustomers > 0 
      ? Math.round(((analytics as any).activeCustomers / (analytics as any).totalCustomers) * 100) + "%"
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
                  <SelectItem value="active">🟢 فعال</SelectItem>
                  <SelectItem value="normal">🔵 عادی</SelectItem>
                  <SelectItem value="marketing">🟡 بازاریابی</SelectItem>
                  <SelectItem value="loss">🔴 زیان‌ده</SelectItem>
                  <SelectItem value="collected">⚫ جمع‌آوری شده</SelectItem>
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
            
            <div className="flex flex-col gap-2">
              <Button 
                variant={regionAnalysisEnabled ? "default" : "outline"}
                onClick={() => setRegionAnalysisEnabled(!regionAnalysisEnabled)}
                className="w-full" 
                data-testid="region-analysis-toggle"
              >
                <Target className="h-4 w-4 mr-2" />
                {regionAnalysisEnabled ? "تحلیل منطقه فعال" : "تحلیل منطقه"}
              </Button>
              <Button 
                variant={addBankingUnitMode ? "default" : "outline"}
                onClick={() => {
                  setAddBankingUnitMode(!addBankingUnitMode);
                  if (!addBankingUnitMode) {
                    setRegionAnalysisEnabled(false); // Disable region analysis when adding unit
                  }
                }}
                className="w-full" 
                data-testid="add-banking-unit-toggle"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {addBankingUnitMode ? "انتخاب مکان فعال" : "افزودن واحد بانکی"}
              </Button>
              {regionAnalysisEnabled && (
                <p className="text-xs text-muted-foreground text-center">
                  روی نقشه شکل بکشید تا منطقه انتخاب کنید
                </p>
              )}
              {addBankingUnitMode && (
                <p className="text-xs text-muted-foreground text-center">
                  روی نقشه کلیک کنید تا واحد بانکی اضافه کنید
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Map Container */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">🗺️ نقشه تعاملی POS تبریز</CardTitle>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
                }}
                className="flex items-center gap-2"
                data-testid="refresh-customers-button"
              >
                <RefreshCw className="h-4 w-4" />
                بروزرسانی داده‌ها
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
                  await queryClient.invalidateQueries({ queryKey: ['/api/analytics/overview'] });
                }}
                disabled={customersLoading}
                data-testid="refresh-customers-button"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${customersLoading ? 'animate-spin' : ''}`} />
                تازه‌سازی داده‌ها
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span data-testid="active-devices-count">{(analytics as any)?.activeCustomers || 0}</span> فعال
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span data-testid="offline-devices-count">
                    {((analytics as any)?.totalCustomers || 0) - ((analytics as any)?.activeCustomers || 0)}
                  </span> آفلاین
                </span>
              </div>
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
              {regionStats ? regionStats.totalInRegion : mapStats.visible}
            </p>
            <p className="text-sm text-muted-foreground">
              {regionStats ? "مشتریان در منطقه انتخابی" : "مشتریان قابل مشاهده"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600" data-testid="region-active">
              {regionStats ? regionStats.activeInRegion : (analytics as any)?.activeCustomers || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              {regionStats ? "فعال در منطقه" : "مشتریان فعال"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary" data-testid="region-revenue">
              {regionStats ? `${Math.round(regionStats.regionRevenue / 1000000)}M` : mapStats.avgRevenue}
            </p>
            <p className="text-sm text-muted-foreground">
              {regionStats ? "درآمد منطقه" : "میانگین درآمد"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600" data-testid="efficiency-rate">
              {regionStats 
                ? `${regionStats.totalInRegion > 0 ? Math.round((regionStats.activeInRegion / regionStats.totalInRegion) * 100) : 0}%`
                : mapStats.efficiency
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {regionStats ? "نرخ بهره‌وری منطقه" : "نرخ بهره‌وری"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Banking Unit Placement Modal */}
      <BankingUnitPlacementModal
        isOpen={pendingBranchLocation !== null}
        onClose={() => setPendingBranchLocation(null)}
        location={pendingBranchLocation}
      />
    </div>
  );
}
