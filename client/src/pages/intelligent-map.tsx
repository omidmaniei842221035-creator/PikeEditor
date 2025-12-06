import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight,
  Brain,
  Target,
  Users,
  Building2,
  MapPin,
  TrendingUp,
  TrendingDown,
  Layers,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Navigation,
  Zap,
  BarChart3,
  CircleDot,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Customer } from "@shared/schema";

interface ClusterInfo {
  id: number;
  centroid: { lat: number; lng: number };
  customerCount: number;
  totalRevenue: number;
  avgMonthlyProfit: number;
  dominantBusinessType: string;
  potentialLevel: 'high' | 'medium' | 'low';
  characteristics: string[];
}

interface ClusterResult {
  clusters: ClusterInfo[];
  customerAssignments: { customerId: string; clusterId: number }[];
  metrics: {
    totalClusters: number;
    silhouetteScore: number;
    inertia: number;
    highPotentialAreas: number;
    lowPotentialAreas: number;
  };
}

const CLUSTER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const TABRIZ_CENTER = { lat: 38.0792, lng: 46.2887 };

export default function IntelligentMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  const [showCustomers, setShowCustomers] = useState(true);
  const [showBankingUnits, setShowBankingUnits] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClusters, setShowClusters] = useState(false);
  const [showCoverageRadius, setShowCoverageRadius] = useState(false);
  
  const [clusterCount, setClusterCount] = useState(5);
  const [coverageRadius, setCoverageRadius] = useState(3);
  
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'customer' | 'banking_unit';
    data: any;
  } | null>(null);

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ['/api/banking-units'],
  });

  const { data: clusterData, isLoading: clustersLoading, refetch: refetchClusters } = useQuery<ClusterResult>({
    queryKey: ['/api/ai/clusters', clusterCount],
    queryFn: async () => {
      const response = await fetch(`/api/ai/clusters?k=${clusterCount}`);
      if (!response.ok) throw new Error('Failed to fetch clusters');
      return response.json();
    },
    enabled: showClusters,
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = (window as any).L;
      if (!L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        return;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false
      }).setView([TABRIZ_CENTER.lat, TABRIZ_CENTER.lng], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = {
        map,
        markers: [] as any[],
        circles: [] as any[],
        heatmapMarkers: [] as any[],
        clusterMarkers: [] as any[]
      };

      setIsMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const clearMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.markers.forEach((m: any) => m.remove());
    mapInstanceRef.current.markers = [];
    mapInstanceRef.current.circles.forEach((c: any) => c.remove());
    mapInstanceRef.current.circles = [];
    mapInstanceRef.current.clusterMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.clusterMarkers = [];
    mapInstanceRef.current.heatmapMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.heatmapMarkers = [];
  }, []);

  const handleEntityClick = useCallback((type: 'customer' | 'banking_unit', data: any) => {
    setSelectedEntity({ type, data });
    setRightPanelOpen(true);
    
    if (mapInstanceRef.current?.map && data.latitude && data.longitude) {
      mapInstanceRef.current.map.flyTo(
        [parseFloat(data.latitude), parseFloat(data.longitude)],
        16,
        { duration: 0.5 }
      );
    }
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current?.map) return;

    clearMarkers();
    const L = (window as any).L;
    const map = mapInstanceRef.current.map;

    if (showCustomers && customers.length > 0) {
      const assignmentMap = new Map<string, number>();
      if (showClusters && clusterData?.customerAssignments) {
        clusterData.customerAssignments.forEach(a => {
          assignmentMap.set(a.customerId, a.clusterId);
        });
      }

      customers.forEach((customer: any) => {
        if (!customer.latitude || !customer.longitude) return;

        let color = '#3b82f6';
        let radius = 8;

        if (showClusters && assignmentMap.has(customer.id)) {
          const clusterId = assignmentMap.get(customer.id)!;
          color = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
          radius = 10;
        } else {
          if (customer.status === 'active') color = '#10b981';
          else if (customer.status === 'inactive') color = '#ef4444';
          else if (customer.status === 'marketing') color = '#f59e0b';
        }

        const marker = L.circleMarker(
          [parseFloat(customer.latitude), parseFloat(customer.longitude)],
          {
            radius,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
          }
        ).addTo(map);

        marker.on('click', () => handleEntityClick('customer', customer));

        mapInstanceRef.current.markers.push(marker);
      });
    }

    if (showBankingUnits && bankingUnits.length > 0) {
      bankingUnits.forEach((unit: any) => {
        if (!unit.latitude || !unit.longitude) return;

        const icon = L.divIcon({
          className: 'banking-unit-marker',
          html: `<div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
            </svg>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker(
          [parseFloat(unit.latitude), parseFloat(unit.longitude)],
          { icon }
        ).addTo(map);

        marker.on('click', () => handleEntityClick('banking_unit', unit));

        if (showCoverageRadius) {
          const circle = L.circle(
            [parseFloat(unit.latitude), parseFloat(unit.longitude)],
            {
              radius: coverageRadius * 1000,
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.1,
              weight: 2
            }
          ).addTo(map);
          mapInstanceRef.current.circles.push(circle);
        }

        mapInstanceRef.current.markers.push(marker);
      });
    }

    if (showClusters && clusterData?.clusters) {
      clusterData.clusters.forEach((cluster) => {
        const color = CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length];
        
        const icon = L.divIcon({
          className: 'cluster-centroid',
          html: `<div style="background-color: ${color}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
            ${cluster.id + 1}
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const centroidMarker = L.marker(
          [cluster.centroid.lat, cluster.centroid.lng],
          { icon }
        ).addTo(map);

        centroidMarker.bindPopup(`
          <div style="direction: rtl; text-align: right; min-width: 180px;">
            <h4 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">خوشه ${cluster.id + 1}</h4>
            <p style="margin: 4px 0;"><strong>تعداد:</strong> ${cluster.customerCount} مشتری</p>
            <p style="margin: 4px 0;"><strong>میانگین سود:</strong> ${(cluster.avgMonthlyProfit / 1000000).toFixed(1)}M</p>
            <p style="margin: 4px 0;"><strong>نوع غالب:</strong> ${cluster.dominantBusinessType}</p>
            <p style="margin: 4px 0;"><strong>پتانسیل:</strong> 
              <span style="color: ${cluster.potentialLevel === 'high' ? '#10b981' : cluster.potentialLevel === 'medium' ? '#f59e0b' : '#ef4444'}">
                ${cluster.potentialLevel === 'high' ? 'بالا' : cluster.potentialLevel === 'medium' ? 'متوسط' : 'پایین'}
              </span>
            </p>
          </div>
        `);

        mapInstanceRef.current.clusterMarkers.push(centroidMarker);
      });
    }

    if (showHeatmap && customers.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      if (validCustomers.length > 0) {
        const maxProfit = Math.max(...validCustomers.map((c: any) => c.monthlyProfit || 0));
        
        validCustomers.forEach((customer: any) => {
          const intensity = Math.min(1, Math.max(0.2, (customer.monthlyProfit || 100000) / (maxProfit || 50000000)));
          const baseRadius = 80 + (intensity * 120);
          
          let color: string;
          if (intensity > 0.7) {
            color = '#ef4444';
          } else if (intensity > 0.4) {
            color = '#f97316';
          } else {
            color = '#fbbf24';
          }
          
          const heatCircle = L.circle(
            [parseFloat(customer.latitude), parseFloat(customer.longitude)],
            {
              radius: baseRadius,
              color: 'transparent',
              fillColor: color,
              fillOpacity: 0.25 + (intensity * 0.2),
              weight: 0
            }
          ).addTo(map);
          
          mapInstanceRef.current.heatmapMarkers.push(heatCircle);
        });
      }
    }

  }, [isMapReady, customers, bankingUnits, clusterData, showCustomers, showBankingUnits, showHeatmap, showClusters, showCoverageRadius, coverageRadius, clearMarkers, handleEntityClick]);

  const refreshData = () => {
    if (showClusters) refetchClusters();
  };

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c: any) => c.status === 'active').length,
    inactiveCustomers: customers.filter((c: any) => c.status === 'inactive').length,
    totalBankingUnits: bankingUnits.length,
    highPotentialAreas: clusterData?.metrics?.highPotentialAreas || 0,
    lowPotentialAreas: clusterData?.metrics?.lowPotentialAreas || 0
  };

  return (
    <div className="fixed inset-0 bg-background" dir="rtl">
      <div className="absolute top-4 right-4 z-50">
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2 bg-background/95 backdrop-blur shadow-lg" data-testid="button-back-to-main">
            <ArrowRight className="h-4 w-4" />
            بازگشت به منوی اصلی
          </Button>
        </Link>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-background/95 backdrop-blur rounded-lg px-6 py-3 shadow-lg flex items-center gap-4">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">مانیتورینگ هوشمند نقشه</h1>
            <p className="text-xs text-muted-foreground">تحلیل توزیع مشتریان با هوش مصنوعی</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{stats.totalCustomers}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4 text-purple-500" />
              <span>{stats.totalBankingUnits}</span>
            </div>
            {showClusters && (
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4 text-green-500" />
                <span>{clusterData?.metrics?.totalClusters || 0} خوشه</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {leftPanelOpen && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="absolute top-20 right-4 w-72 z-40"
          >
            <Card className="shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    ابزارهای تحلیل
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLeftPanelOpen(false)}
                    data-testid="button-close-left-panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    نمایش لایه‌ها
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      مشتریان
                    </span>
                    <Switch
                      checked={showCustomers}
                      onCheckedChange={setShowCustomers}
                      data-testid="switch-show-customers"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-500" />
                      واحدهای بانکی
                    </span>
                    <Switch
                      checked={showBankingUnits}
                      onCheckedChange={setShowBankingUnits}
                      data-testid="switch-show-banking-units"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      نقشه حرارتی
                    </span>
                    <Switch
                      checked={showHeatmap}
                      onCheckedChange={setShowHeatmap}
                      data-testid="switch-show-heatmap"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    تحلیل هوش مصنوعی
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      خوشه‌بندی
                    </span>
                    <Switch
                      checked={showClusters}
                      onCheckedChange={setShowClusters}
                      data-testid="switch-show-clusters"
                    />
                  </div>

                  {showClusters && (
                    <div className="pr-6 space-y-2">
                      <span className="text-xs text-muted-foreground">تعداد خوشه: {clusterCount}</span>
                      <Slider
                        value={[clusterCount]}
                        onValueChange={([v]) => setClusterCount(v)}
                        min={2}
                        max={10}
                        step={1}
                        data-testid="slider-cluster-count"
                      />
                      {clustersLoading && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          در حال محاسبه...
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-cyan-500" />
                      شعاع پوشش
                    </span>
                    <Switch
                      checked={showCoverageRadius}
                      onCheckedChange={setShowCoverageRadius}
                      data-testid="switch-show-coverage"
                    />
                  </div>

                  {showCoverageRadius && (
                    <div className="pr-6 space-y-2">
                      <span className="text-xs text-muted-foreground">شعاع: {coverageRadius} کیلومتر</span>
                      <Slider
                        value={[coverageRadius]}
                        onValueChange={([v]) => setCoverageRadius(v)}
                        min={1}
                        max={10}
                        step={0.5}
                        data-testid="slider-coverage-radius"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {showClusters && clusterData?.metrics && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">آمار خوشه‌بندی</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>پتانسیل بالا</span>
                        </div>
                        <p className="text-lg font-bold">{clusterData.metrics.highPotentialAreas}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          <span>پتانسیل پایین</span>
                        </div>
                        <p className="text-lg font-bold">{clusterData.metrics.lowPotentialAreas}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={refreshData}
                  data-testid="button-refresh-analysis"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  بروزرسانی تحلیل
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!leftPanelOpen && (
        <Button
          variant="outline"
          size="icon"
          className="absolute top-20 right-4 z-40 bg-background/95 backdrop-blur shadow-lg"
          onClick={() => setLeftPanelOpen(true)}
          data-testid="button-open-left-panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <AnimatePresence>
        {rightPanelOpen && selectedEntity && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute top-20 left-4 w-80 z-40"
          >
            <Card className="shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    {selectedEntity.type === 'customer' ? (
                      <Users className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Building2 className="h-4 w-4 text-purple-500" />
                    )}
                    {selectedEntity.type === 'customer' ? 'اطلاعات مشتری' : 'اطلاعات واحد بانکی'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setRightPanelOpen(false);
                      setSelectedEntity(null);
                    }}
                    data-testid="button-close-right-panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEntity.type === 'customer' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                        {selectedEntity.data.shopName?.charAt(0) || 'م'}
                      </div>
                      <div>
                        <h3 className="font-bold">{selectedEntity.data.shopName}</h3>
                        <p className="text-sm text-muted-foreground">{selectedEntity.data.ownerName}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={selectedEntity.data.status === 'active' ? 'default' : 'secondary'}>
                        {selectedEntity.data.status === 'active' ? 'فعال' : 
                         selectedEntity.data.status === 'inactive' ? 'غیرفعال' : 'بازاریابی'}
                      </Badge>
                      <Badge variant="outline">{selectedEntity.data.businessType || 'نامشخص'}</Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">تلفن</p>
                        <p className="font-medium">{selectedEntity.data.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">سود ماهانه</p>
                        <p className="font-medium text-green-600">
                          {selectedEntity.data.monthlyProfit 
                            ? `${(selectedEntity.data.monthlyProfit / 1000000).toFixed(1)}M`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    {selectedEntity.data.address && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">آدرس</p>
                        <p className="font-medium">{selectedEntity.data.address}</p>
                      </div>
                    )}

                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        موقعیت جغرافیایی
                      </div>
                      <p className="font-mono text-xs">
                        {selectedEntity.data.latitude}, {selectedEntity.data.longitude}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">{selectedEntity.data.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedEntity.data.code}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Badge>{selectedEntity.data.type || 'واحد بانکی'}</Badge>
                      <Badge variant={selectedEntity.data.isActive ? 'default' : 'secondary'}>
                        {selectedEntity.data.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>

                    <Separator />

                    {selectedEntity.data.address && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">آدرس</p>
                        <p className="font-medium">{selectedEntity.data.address}</p>
                      </div>
                    )}

                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        موقعیت جغرافیایی
                      </div>
                      <p className="font-mono text-xs">
                        {selectedEntity.data.latitude}, {selectedEntity.data.longitude}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-background/95 backdrop-blur rounded-lg px-4 py-2 shadow-lg flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">فعال ({stats.activeCustomers})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">غیرفعال ({stats.inactiveCustomers})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs">بازاریابی</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs">واحد بانکی ({stats.totalBankingUnits})</span>
          </div>
        </div>
      </div>

      <div 
        ref={mapRef} 
        className="absolute inset-0 z-0"
        data-testid="map-intelligent"
      />
      
      {customersLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>در حال بارگذاری داده‌ها...</span>
          </div>
        </div>
      )}
    </div>
  );
}
