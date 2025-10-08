import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Target, Maximize2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { initializeMap, addCustomerMarker, addBankingUnitMarker, isMarkerInRegion, getRegionStatistics, createDensityVisualization, type MapInstance } from "@/lib/map-utils";
import { CustomerInfoModal } from "@/components/customers/customer-info-modal";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { AddVisitModal } from "@/components/customers/add-visit-modal";
import { PosMapFullscreen } from "@/components/pos-map-fullscreen";
import { BankingUnitDetailsModal } from "@/components/banking-units/banking-unit-details-modal";
import { useFilters } from "@/contexts/FiltersContext";
import type { Customer } from "@shared/schema";

export function PosMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [mapType, setMapType] = useState("density");
  const { businessFilter, statusFilter, bankingUnitFilter, setBusinessFilter, setStatusFilter, setBankingUnitFilter } = useFilters();
  const [mapReady, setMapReady] = useState(false);
  const [regionAnalysisEnabled, setRegionAnalysisEnabled] = useState(false);
  const [regionStats, setRegionStats] = useState<{
    totalInRegion: number;
    activeInRegion: number;
    regionRevenue: number;
  } | null>(null);
  const [hasActiveRegions, setHasActiveRegions] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomerForVisit, setSelectedCustomerForVisit] = useState<Customer | null>(null);
  const [showAddVisitModal, setShowAddVisitModal] = useState(false);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);
  const [heatMapEnabled, setHeatMapEnabled] = useState(true);
  const [selectedBankingUnit, setSelectedBankingUnit] = useState<any>(null);
  const [showBankingUnitModal, setShowBankingUnitModal] = useState(false);
  
  // Location selection mode states
  const [isLocationSelectionMode, setIsLocationSelectionMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showCustomerFormModal, setShowCustomerFormModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  
  // Use refs to avoid stale closures
  const regionAnalysisEnabledRef = useRef(regionAnalysisEnabled);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: [`/api/customers?v=${dataVersion}`],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30000,
  });

  const { data: bankingUnits = [], isLoading: bankingUnitsLoading } = useQuery({
    queryKey: ['/api/banking-units'],
    staleTime: 5 * 60 * 1000, // 5 minutes - banking units change less frequently
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  // Update refs when state changes
  useEffect(() => {
    regionAnalysisEnabledRef.current = regionAnalysisEnabled;
  }, [regionAnalysisEnabled]);

  // Handle map click for location selection
  useEffect(() => {
    if (mapReady && mapInstanceRef.current?.map && isLocationSelectionMode) {
      const handleMapClick = (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        setShowCustomerFormModal(true);
        setIsLocationSelectionMode(false);
        
        // Optionally add a temporary marker to show selected location
        if ((window as any).L && mapInstanceRef.current?.map) {
          const L = (window as any).L;
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-location-marker',
              html: '<div style="background-color: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })
          }).addTo(mapInstanceRef.current.map);
          
          // Remove marker after a short delay
          setTimeout(() => marker.remove(), 3000);
        }
      };
      
      mapInstanceRef.current.map.on('click', handleMapClick);
      
      // Change cursor to crosshair when in location selection mode
      if (mapInstanceRef.current.map.getContainer()) {
        mapInstanceRef.current.map.getContainer().style.cursor = 'crosshair';
      }
      
      return () => {
        if (mapInstanceRef.current?.map) {
          mapInstanceRef.current.map.off('click', handleMapClick);
          if (mapInstanceRef.current.map.getContainer()) {
            mapInstanceRef.current.map.getContainer().style.cursor = '';
          }
        }
      };
    }
  }, [mapReady, isLocationSelectionMode]);

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
        const bankingUnitMatch = bankingUnitFilter === "all" || customer.bankingUnitId === bankingUnitFilter;
        return businessMatch && statusMatch && bankingUnitMatch;
      });

      // Add markers for filtered customers
      filteredCustomers.forEach((customer: any) => {
        if (customer.latitude && customer.longitude) {
          const marker = addCustomerMarker(
            mapInstanceRef.current!,
            customer,
            parseFloat(customer.latitude),
            parseFloat(customer.longitude),
            (customer: Customer) => {
              setSelectedCustomer(customer);
              setShowCustomerModal(true);
            },
            (customer: Customer) => {
              setSelectedCustomerForVisit(customer);
              setShowAddVisitModal(true);
            }
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
  }, [mapReady, customers, businessFilter, statusFilter, bankingUnitFilter, regionAnalysisEnabled, hasActiveRegions]);

  // Add banking units to map (permanent display)
  useEffect(() => {
    if (mapReady && mapInstanceRef.current?.map) {
      // Clear existing banking unit markers
      mapInstanceRef.current.bankingUnitMarkers.forEach(marker => marker.remove());
      mapInstanceRef.current.bankingUnitMarkers = [];

      // Add banking unit markers (they don't get filtered like customers)
      if ((bankingUnits as any[]).length > 0) {
        (bankingUnits as any[]).forEach((unit: any) => {
          if (unit.latitude && unit.longitude) {
            addBankingUnitMarker(
              mapInstanceRef.current!,
              unit,
              parseFloat(unit.latitude),
              parseFloat(unit.longitude),
              (unit: any) => {
                setSelectedBankingUnit(unit);
                setShowBankingUnitModal(true);
                // Auto-filter to show only POS devices from this banking unit
                setBankingUnitFilter(String(unit.id));
              }
            );
          }
        });
      }
    }
  }, [mapReady, bankingUnits]);

  // Handle map type changes for density visualization
  useEffect(() => {
    if (mapReady && mapInstanceRef.current?.map && customers) {
      if (heatMapEnabled) {
        // Filter customers based on current filters (same logic as markers)
        const filteredCustomers = (customers as any[]).filter((customer: any) => {
          const businessMatch = businessFilter === "all" || customer.businessType === businessFilter;
          const statusMatch = statusFilter === "all" || customer.status === statusFilter;
          const bankingUnitMatch = bankingUnitFilter === "all" || customer.bankingUnitId === bankingUnitFilter;
          return businessMatch && statusMatch && bankingUnitMatch;
        });

        createDensityVisualization(
          mapInstanceRef.current,
          filteredCustomers,
          mapType
        );
      } else {
        // Clear density visualization when disabled
        if ((mapInstanceRef.current as any).densityLayer) {
          mapInstanceRef.current.map?.removeLayer((mapInstanceRef.current as any).densityLayer);
          delete (mapInstanceRef.current as any).densityLayer;
        }
      }
    }
  }, [mapReady, customers, mapType, heatMapEnabled, businessFilter, statusFilter, bankingUnitFilter, regionAnalysisEnabled, hasActiveRegions]);

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
              <div className="flex items-center gap-2 mb-2">
                <Checkbox 
                  id="heatmap-toggle"
                  checked={heatMapEnabled}
                  onCheckedChange={(checked) => setHeatMapEnabled(!!checked)}
                  data-testid="heatmap-toggle"
                />
                <label htmlFor="heatmap-toggle" className="text-sm font-medium">نقشه حرارتی فعال</label>
              </div>
              <div className={heatMapEnabled ? "" : "opacity-50 pointer-events-none"}>
                <label className="block text-sm font-medium mb-2">نوع نقشه حرارتی:</label>
                <Select value={mapType} onValueChange={setMapType} disabled={!heatMapEnabled}>
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
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">نوع صنف:</label>
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger data-testid="business-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه اصناف</SelectItem>
                  <SelectItem value="دندانپزشکی">🦷 دندانپزشکی</SelectItem>
                  <SelectItem value="هواپیمایی">✈️ هواپیمایی</SelectItem>
                  <SelectItem value="حمل‌ونقل">🚛 حمل‌ونقل</SelectItem>
                  <SelectItem value="تولید شیرینی">🧁 تولید شیرینی</SelectItem>
                  <SelectItem value="فیزیوتراپی">🏥 فیزیوتراپی</SelectItem>
                  <SelectItem value="مهندسی معماری">🏗️ مهندسی معماری</SelectItem>
                  <SelectItem value="صنایع دستی">🎨 صنایع دستی</SelectItem>
                  <SelectItem value="باشگاه ورزشی">🏋️ باشگاه ورزشی</SelectItem>
                  <SelectItem value="آموزش زبان">📚 آموزش زبان</SelectItem>
                  <SelectItem value="آموزش موسیقی">🎵 آموزش موسیقی</SelectItem>
                  <SelectItem value="صنایع چوبی">🪵 صنایع چوبی</SelectItem>
                  <SelectItem value="آرایش و زیبایی">💄 آرایش و زیبایی</SelectItem>
                  <SelectItem value="واردات قطعات">📦 واردات قطعات</SelectItem>
                  <SelectItem value="پزشکی تخصصی">🏥 پزشکی تخصصی</SelectItem>
                  <SelectItem value="صنایع غذایی">🍽️ صنایع غذایی</SelectItem>
                  <SelectItem value="مشاوره املاک">🏠 مشاوره املاک</SelectItem>
                  <SelectItem value="کافه‌نت">💻 کافه‌نت</SelectItem>
                  <SelectItem value="فروش موبایل">📱 فروش موبایل</SelectItem>
                  <SelectItem value="تعمیر کفش">👞 تعمیر کفش</SelectItem>
                  <SelectItem value="لوازم التحریر">✏️ لوازم التحریر</SelectItem>
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">🏦 واحد بانکی:</label>
                {bankingUnitFilter !== "all" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setBankingUnitFilter("all")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    data-testid="clear-banking-unit-filter"
                  >
                    پاک کردن فیلتر
                  </Button>
                )}
              </div>
              <Select value={bankingUnitFilter} onValueChange={setBankingUnitFilter}>
                <SelectTrigger data-testid="banking-unit-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🏛️ همه واحدهای بانکی</SelectItem>
                  {(bankingUnits as any[]).map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitType === 'branch' ? '🏦' : unit.unitType === 'counter' ? '🏪' : '🏧'} {unit.name} ({unit.code})
                    </SelectItem>
                  ))}
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
              {regionAnalysisEnabled && (
                <p className="text-xs text-muted-foreground text-center">
                  روی نقشه شکل بکشید تا منطقه انتخاب کنید
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
                variant={isLocationSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsLocationSelectionMode(!isLocationSelectionMode);
                  if (!isLocationSelectionMode) {
                    setCustomerToEdit(null); // Reset customer to edit when entering location selection mode
                  }
                }}
                className={isLocationSelectionMode ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                data-testid="location-selection-mode-button"
              >
                {isLocationSelectionMode ? "✅" : "📍"} {isLocationSelectionMode ? "کلیک کنید برای انتخاب موقعیت" : "افزودن مشتری از نقشه"}
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={() => setShowFullscreenMap(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                data-testid="fullscreen-map-button"
              >
                <Maximize2 className="h-4 w-4" />
                نمای تمام‌صفحه
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setDataVersion(prev => prev + 1);
                  queryClient.invalidateQueries({ queryKey: [`/api/customers?v=${dataVersion}`] });
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
            className="h-[700px] w-full rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg"
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
      

      {/* Customer Info Modal */}
      <CustomerInfoModal
        open={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />

      {/* Add Visit Modal */}
      <AddVisitModal
        customer={selectedCustomerForVisit}
        isOpen={showAddVisitModal}
        onClose={() => {
          setShowAddVisitModal(false);
          setSelectedCustomerForVisit(null);
        }}
        onSuccess={() => {
          setShowAddVisitModal(false);
          setSelectedCustomerForVisit(null);
          setDataVersion(v => v + 1);
        }}
      />

      {/* Banking Unit Details Modal */}
      <BankingUnitDetailsModal
        open={showBankingUnitModal}
        onClose={() => {
          setShowBankingUnitModal(false);
          setSelectedBankingUnit(null);
        }}
        bankingUnit={selectedBankingUnit}
      />

      {/* Fullscreen Map Modal */}
      <PosMapFullscreen
        isOpen={showFullscreenMap}
        onClose={() => setShowFullscreenMap(false)}
      />

      {/* Customer Form Modal for Adding/Editing with Map Location */}
      <CustomerFormModal
        open={showCustomerFormModal}
        onOpenChange={(open) => {
          setShowCustomerFormModal(open);
          if (!open) {
            setSelectedLocation(null);
            setCustomerToEdit(null);
          }
        }}
        customer={customerToEdit}
        initialLocation={selectedLocation}
        onSelectLocationFromMap={() => {
          setShowCustomerFormModal(false);
          setIsLocationSelectionMode(true);
        }}
      />

    </div>
  );
}
