import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  RefreshCw, 
  Target, 
  Filter, 
  BarChart3, 
  Users, 
  TrendingUp,
  MapPin,
  Building2,
  Settings,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "@/lib/queryClient";
import { initializeMap, addCustomerMarker, addBankingUnitMarker, isMarkerInRegion, getRegionStatistics, createDensityVisualization, type MapInstance } from "@/lib/map-utils";
import { CustomerInfoModal } from "@/components/customers/customer-info-modal";
import { AddVisitModal } from "@/components/customers/add-visit-modal";
import type { Customer } from "@shared/schema";

interface PosMapFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosMapFullscreen({ isOpen, onClose }: PosMapFullscreenProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [mapType, setMapType] = useState("density");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bankingUnitFilter, setBankingUnitFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("month");
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
    staleTime: 5 * 60 * 1000,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  // Update refs when state changes
  useEffect(() => {
    regionAnalysisEnabledRef.current = regionAnalysisEnabled;
  }, [regionAnalysisEnabled]);

  // Callback to handle region changes
  const handleRegionChange = useCallback((hasRegions: boolean) => {
    setHasActiveRegions(hasRegions);
  }, []);

  // Initialize map when dialog opens
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (isOpen && mapRef.current && !mapInstanceRef.current && mounted) {
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

    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(initMap, 100);
    } else {
      // Clean up immediately when dialog closes
      if (mapInstanceRef.current && mapInstanceRef.current.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    }

    return () => {
      mounted = false;
      if (mapInstanceRef.current && mapInstanceRef.current.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, [isOpen, handleRegionChange]);

  // Update markers based on filters
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
              marker.setOpacity(0.3);
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

  // Add banking units to map
  useEffect(() => {
    if (mapReady && mapInstanceRef.current?.map) {
      // Clear existing banking unit markers
      mapInstanceRef.current.bankingUnitMarkers.forEach(marker => marker.remove());
      mapInstanceRef.current.bankingUnitMarkers = [];

      // Add banking unit markers
      if ((bankingUnits as any[]).length > 0) {
        (bankingUnits as any[]).forEach((unit: any) => {
          if (unit.latitude && unit.longitude) {
            addBankingUnitMarker(
              mapInstanceRef.current!,
              unit,
              parseFloat(unit.latitude),
              parseFloat(unit.longitude),
              (unit: any) => {
                console.log('Banking unit clicked:', unit);
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
    }
  }, [mapReady, customers, mapType, businessFilter, statusFilter, bankingUnitFilter, regionAnalysisEnabled, hasActiveRegions, timeFilter]);

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
    clusters: 5,
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 m-0 gap-0" style={{ height: "100vh", width: "100vw" }}>
        <div className="flex h-full w-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-gray-900/30 dark:to-blue-950/50">
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Sidebar */}
          <motion.div 
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: sidebarCollapsed ? -320 : 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl"
            style={{ width: sidebarCollapsed ? "80px" : "400px" }}
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">نقشه هوشمند POS</h2>
                        <p className="text-sm text-muted-foreground">مدیریت تمام‌صفحه</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="p-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
              {!sidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 space-y-6"
                >
                  
                  {/* Quick Stats */}
                  <Card className="border-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        آمار سریع
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm">
                          <p className="text-lg font-bold text-blue-600">{mapStats.visible}</p>
                          <p className="text-xs text-muted-foreground">قابل مشاهده</p>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm">
                          <p className="text-lg font-bold text-emerald-600">{(analytics as any)?.activeCustomers || 0}</p>
                          <p className="text-xs text-muted-foreground">فعال</p>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm">
                          <p className="text-lg font-bold text-purple-600">{mapStats.avgRevenue}</p>
                          <p className="text-xs text-muted-foreground">میانگین درآمد</p>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm">
                          <p className="text-lg font-bold text-amber-600">{mapStats.efficiency}</p>
                          <p className="text-xs text-muted-foreground">بهره‌وری</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Map Type Filter */}
                  <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Maximize2 className="w-4 h-4" />
                        نوع نمایش نقشه
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={mapType} onValueChange={setMapType}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="density">🎯 تراکم دستگاه‌های POS</SelectItem>
                          <SelectItem value="transactions">💳 تراکم تراکنش‌ها</SelectItem>
                          <SelectItem value="revenue">💰 تراکم درآمد</SelectItem>
                          <SelectItem value="hotspots">🔥 نقاط داغ</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Business Filter */}
                  <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        فیلتر اصناف
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={businessFilter} onValueChange={setBusinessFilter}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
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
                    </CardContent>
                  </Card>

                  {/* Status Filter */}
                  <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        وضعیت POS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
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
                    </CardContent>
                  </Card>

                  {/* Banking Unit Filter */}
                  <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        واحد مصرفی
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={bankingUnitFilter} onValueChange={setBankingUnitFilter}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">همه واحدها</SelectItem>
                          {(bankingUnits as any[]).map((unit: any) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unitType === 'branch' ? '🏦' : unit.unitType === 'counter' ? '🏪' : '🏧'} {unit.name} ({unit.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Time Analysis Filter */}
                  <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        تحلیل زمانی
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="bg-white/80 dark:bg-gray-900/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">📅 ماه گذشته</SelectItem>
                          <SelectItem value="quarter">📅 3 ماه گذشته</SelectItem>
                          <SelectItem value="half">📅 6 ماه گذشته</SelectItem>
                          <SelectItem value="year">📅 سال گذشته</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Region Analysis */}
                  <Card className="border-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        تحلیل منطقه‌ای
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        variant={regionAnalysisEnabled ? "default" : "outline"}
                        onClick={() => setRegionAnalysisEnabled(!regionAnalysisEnabled)}
                        className="w-full"
                        size="sm"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        {regionAnalysisEnabled ? "تحلیل منطقه فعال" : "فعال‌سازی تحلیل منطقه"}
                      </Button>
                      {regionAnalysisEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg"
                        >
                          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                            روی نقشه شکل بکشید تا منطقه انتخاب کنید
                          </p>
                          {regionStats && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="text-center">
                                <p className="text-sm font-bold text-blue-600">{regionStats.totalInRegion}</p>
                                <p className="text-xs text-muted-foreground">در منطقه</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-green-600">{regionStats.activeInRegion}</p>
                                <p className="text-xs text-muted-foreground">فعال</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        عملیات
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setDataVersion(prev => prev + 1);
                          queryClient.invalidateQueries({ queryKey: [`/api/customers?v=${dataVersion}`] });
                          queryClient.invalidateQueries({ queryKey: ["/api/analytics/overview"] });
                        }}
                        className="w-full bg-white/80 dark:bg-gray-900/80"
                        disabled={customersLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${customersLoading ? 'animate-spin' : ''}`} />
                        بروزرسانی داده‌ها
                      </Button>
                    </CardContent>
                  </Card>

                </motion.div>
              )}

              {sidebarCollapsed && (
                <div className="p-4 space-y-4">
                  <Button variant="ghost" size="sm" className="w-full p-2">
                    <Filter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full p-2">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full p-2">
                    <Target className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Map Content */}
          <div className="flex-1 relative">
            {/* Map Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6">
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 dark:border-gray-700/20"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          {(analytics as any)?.activeCustomers || 0} فعال
                        </Badge>
                        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                          {((analytics as any)?.totalCustomers || 0) - ((analytics as any)?.activeCustomers || 0)} آفلاین
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      🗺️ نقشه تعاملی POS تبریز • دقت: GPS
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Map Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full h-full"
            >
              <div 
                ref={mapRef} 
                className="w-full h-full"
                data-testid="pos-map-fullscreen"
              />
            </motion.div>
          </div>

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

      </DialogContent>
    </Dialog>
  );
}