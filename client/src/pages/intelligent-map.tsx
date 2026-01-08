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
import { getBusinessIcon } from "@/lib/map-utils";
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
  Loader2,
  MapPinned,
  Activity,
  Shield,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Compass,
  Route,
  Flame,
  Snowflake,
  AlertOctagon,
  Radio,
  Sparkles,
  Crown,
  Settings,
  Grid3X3,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Delaunay } from "d3-delaunay";
import type { Customer, CustomerTimeSeries } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

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

const ZONE_TYPES = {
  highSales: { label: 'پرفروش', color: '#10b981', icon: TrendingUp },
  highRisk: { label: 'ریسک بالا', color: '#ef4444', icon: AlertTriangle },
  terminalShortage: { label: 'کمبود پایانه', color: '#f59e0b', icon: AlertOctagon },
  inefficientBranch: { label: 'شعبه ناکارآمد', color: '#8b5cf6', icon: TrendingDown },
  fastGrowth: { label: 'رشد سریع', color: '#06b6d4', icon: Flame }
};

const RISK_TYPES = {
  blocking: { label: 'ریسک مسدودیت', color: '#ef4444' },
  fraud: { label: 'ریسک تقلب', color: '#dc2626' },
  nightActivity: { label: 'تراکنش شبانه', color: '#7c3aed' },
  outlier: { label: 'غیرعادی', color: '#f97316' },
  failure: { label: 'خرابی', color: '#6b7280' }
};

const AI_FILTER_TYPES = {
  unusualBehavior: { label: 'رفتار غیرعادی', color: '#ef4444' },
  likelyFailure: { label: 'احتمال خرابی', color: '#f59e0b' },
  decliningPerformance: { label: 'افت عملکرد', color: '#8b5cf6' },
  potentialVIP: { label: 'VIP بالقوه', color: '#eab308' },
  lowUsage: { label: 'کم استفاده', color: '#6b7280' }
};

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
  
  const [showSmartZoning, setShowSmartZoning] = useState(false);
  const [showForecastLayer, setShowForecastLayer] = useState(false);
  const [showRiskMap, setShowRiskMap] = useState(false);
  const [showFlowLines, setShowFlowLines] = useState(false);
  const [showDistanceAnalysis, setShowDistanceAnalysis] = useState(false);
  
  const [showVoronoi, setShowVoronoi] = useState(false);
  const [showTerritoryBoundaries, setShowTerritoryBoundaries] = useState(false);
  const [showMarketShare, setShowMarketShare] = useState(false);
  const [editZonesMode, setEditZonesMode] = useState(false);
  
  const [showBranchPerformance, setShowBranchPerformance] = useState(false);
  const [showGeoAlerts, setShowGeoAlerts] = useState(false);
  const [showBubbleMap, setShowBubbleMap] = useState(false);
  const [showSideAnalytics, setShowSideAnalytics] = useState(false);
  const [showAIRecommender, setShowAIRecommender] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  const [activeZoneType, setActiveZoneType] = useState<string>('highSales');
  const [activeRiskType, setActiveRiskType] = useState<string>('fraud');
  const [activeAIFilter, setActiveAIFilter] = useState<string | null>(null);
  
  const [timeSliderEnabled, setTimeSliderEnabled] = useState(false);
  const [timeSliderValue, setTimeSliderValue] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [clusterCount, setClusterCount] = useState(5);
  const [coverageRadius, setCoverageRadius] = useState(3);
  
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'customer' | 'banking_unit';
    data: any;
  } | null>(null);
  
  const [activePanel, setActivePanel] = useState<'layers' | 'zones' | 'forecast' | 'risk' | 'filters'>('layers');

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

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['/api/branches'],
  });

  const selectedCustomerId = selectedEntity?.type === 'customer' ? selectedEntity?.data?.id : null;
  
  const { data: customerTimeSeries = [], isLoading: timeSeriesLoading } = useQuery<CustomerTimeSeries[]>({
    queryKey: ['/api/customer-time-series/customer', selectedCustomerId],
    queryFn: async ({ queryKey }) => {
      const customerId = queryKey[1];
      if (!customerId) return [];
      const response = await fetch(`/api/customer-time-series/customer/${customerId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedCustomerId,
    staleTime: 30000,
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
        clusterMarkers: [] as any[],
        zonePolygons: [] as any[],
        forecastMarkers: [] as any[],
        riskMarkers: [] as any[],
        flowLines: [] as any[],
        distanceLines: [] as any[],
        voronoiPolygons: [] as any[],
        territoryPolygons: [] as any[],
        marketShareOverlays: [] as any[],
        branchPerformanceMarkers: [] as any[],
        geoAlertMarkers: [] as any[],
        bubbleMarkers: [] as any[],
        aiRecommenderMarkers: [] as any[]
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
    mapInstanceRef.current.zonePolygons.forEach((p: any) => p.remove());
    mapInstanceRef.current.zonePolygons = [];
    mapInstanceRef.current.forecastMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.forecastMarkers = [];
    mapInstanceRef.current.riskMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.riskMarkers = [];
    mapInstanceRef.current.flowLines.forEach((l: any) => l.remove());
    mapInstanceRef.current.flowLines = [];
    mapInstanceRef.current.distanceLines.forEach((l: any) => l.remove());
    mapInstanceRef.current.distanceLines = [];
    mapInstanceRef.current.voronoiPolygons.forEach((p: any) => p.remove());
    mapInstanceRef.current.voronoiPolygons = [];
    mapInstanceRef.current.territoryPolygons.forEach((p: any) => p.remove());
    mapInstanceRef.current.territoryPolygons = [];
    mapInstanceRef.current.marketShareOverlays.forEach((o: any) => o.remove());
    mapInstanceRef.current.marketShareOverlays = [];
    mapInstanceRef.current.branchPerformanceMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.branchPerformanceMarkers = [];
    mapInstanceRef.current.geoAlertMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.geoAlertMarkers = [];
    mapInstanceRef.current.bubbleMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.bubbleMarkers = [];
    mapInstanceRef.current.aiRecommenderMarkers.forEach((m: any) => m.remove());
    mapInstanceRef.current.aiRecommenderMarkers = [];
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
        } else {
          if (customer.status === 'active') color = '#22c55e';
          else if (customer.status === 'inactive' || customer.status === 'loss') color = '#ef4444';
          else if (customer.status === 'marketing') color = '#f59e0b';
          else if (customer.status === 'collected') color = '#374151';
          else color = '#9ca3af';
        }

        const businessIcon = getBusinessIcon(customer.businessType || 'سایر');
        
        const icon = L.divIcon({
          className: 'customer-business-marker',
          html: `
            <div style="
              background: ${color};
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 14px;
                line-height: 1;
              ">${businessIcon}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker(
          [parseFloat(customer.latitude), parseFloat(customer.longitude)],
          { icon }
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

    if (showSmartZoning && customers.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      const gridSize = 0.015;
      const zones: Map<string, { lat: number; lng: number; customers: any[]; totalProfit: number }> = new Map();
      
      validCustomers.forEach((customer: any) => {
        const lat = parseFloat(customer.latitude);
        const lng = parseFloat(customer.longitude);
        const gridKey = `${Math.floor(lat / gridSize)}_${Math.floor(lng / gridSize)}`;
        
        if (!zones.has(gridKey)) {
          zones.set(gridKey, {
            lat: Math.floor(lat / gridSize) * gridSize + gridSize / 2,
            lng: Math.floor(lng / gridSize) * gridSize + gridSize / 2,
            customers: [],
            totalProfit: 0
          });
        }
        const zone = zones.get(gridKey)!;
        zone.customers.push(customer);
        zone.totalProfit += customer.monthlyProfit || 0;
      });

      const zoneConfig = ZONE_TYPES[activeZoneType as keyof typeof ZONE_TYPES];
      
      zones.forEach((zone) => {
        let shouldShow = false;
        let intensity = 0.3;
        
        if (activeZoneType === 'highSales') {
          shouldShow = zone.totalProfit > 20000000;
          intensity = Math.min(0.6, zone.totalProfit / 100000000);
        } else if (activeZoneType === 'fastGrowth') {
          shouldShow = zone.customers.length > 2;
          intensity = Math.min(0.6, zone.customers.length / 10);
        } else if (activeZoneType === 'terminalShortage') {
          const nearbyUnits = bankingUnits.filter((u: any) => {
            if (!u.latitude || !u.longitude) return false;
            const dist = Math.sqrt(
              Math.pow(parseFloat(u.latitude) - zone.lat, 2) + 
              Math.pow(parseFloat(u.longitude) - zone.lng, 2)
            );
            return dist < 0.02;
          });
          shouldShow = zone.customers.length > 3 && nearbyUnits.length === 0;
          intensity = 0.5;
        } else if (activeZoneType === 'highRisk') {
          const avgProfit = zone.totalProfit / zone.customers.length;
          shouldShow = avgProfit < 5000000 && zone.customers.length > 1;
          intensity = 0.5;
        } else if (activeZoneType === 'inefficientBranch') {
          shouldShow = zone.customers.length > 0 && zone.totalProfit < 10000000;
          intensity = 0.4;
        }
        
        if (shouldShow) {
          const polygon = L.rectangle(
            [
              [zone.lat - gridSize / 2, zone.lng - gridSize / 2],
              [zone.lat + gridSize / 2, zone.lng + gridSize / 2]
            ],
            {
              color: zoneConfig.color,
              fillColor: zoneConfig.color,
              fillOpacity: intensity,
              weight: 2
            }
          ).addTo(map);
          
          polygon.bindPopup(`
            <div style="direction: rtl; text-align: right; min-width: 150px;">
              <h4 style="margin: 0 0 8px 0; color: ${zoneConfig.color}; font-weight: bold;">${zoneConfig.label}</h4>
              <p style="margin: 4px 0;"><strong>تعداد مشتری:</strong> ${zone.customers.length}</p>
              <p style="margin: 4px 0;"><strong>مجموع سود:</strong> ${(zone.totalProfit / 1000000).toFixed(1)}M</p>
            </div>
          `);
          
          mapInstanceRef.current.zonePolygons.push(polygon);
        }
      });
    }

    if (showForecastLayer && customers.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      
      validCustomers.forEach((customer: any) => {
        const profit = customer.monthlyProfit || 0;
        const random = Math.random();
        const growthFactor = profit > 30000000 ? 0.7 : profit > 10000000 ? 0.5 : 0.3;
        const isGrowing = random < growthFactor;
        
        const color = isGrowing ? '#10b981' : '#ef4444';
        const iconHtml = isGrowing 
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17l5-5 5 5M7 7l5-5 5 5"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 7l5 5 5-5M7 17l5 5 5-5"/></svg>';
        
        const icon = L.divIcon({
          className: 'forecast-marker',
          html: `<div style="background: ${color}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); opacity: 0.8;">
            ${iconHtml}
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        const marker = L.marker(
          [parseFloat(customer.latitude), parseFloat(customer.longitude)],
          { icon }
        ).addTo(map);
        
        marker.bindPopup(`
          <div style="direction: rtl; text-align: right;">
            <h4 style="margin: 0 0 8px 0;">${customer.businessName || 'مشتری'}</h4>
            <p style="margin: 4px 0; color: ${color}; font-weight: bold;">
              ${isGrowing ? 'پیش‌بینی رشد' : 'پیش‌بینی کاهش'}
            </p>
            <p style="margin: 4px 0;">سود فعلی: ${(profit / 1000000).toFixed(1)}M</p>
          </div>
        `);
        
        mapInstanceRef.current.forecastMarkers.push(marker);
      });
    }

    if (showRiskMap && customers.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      const riskConfig = RISK_TYPES[activeRiskType as keyof typeof RISK_TYPES];
      
      validCustomers.forEach((customer: any) => {
        let riskLevel = 0;
        
        if (activeRiskType === 'fraud') {
          riskLevel = customer.monthlyProfit > 50000000 ? 0.8 : customer.monthlyProfit > 20000000 ? 0.4 : 0.1;
        } else if (activeRiskType === 'blocking') {
          riskLevel = customer.status === 'inactive' ? 0.9 : customer.status === 'marketing' ? 0.5 : 0.1;
        } else if (activeRiskType === 'nightActivity') {
          riskLevel = Math.random() * 0.6;
        } else if (activeRiskType === 'outlier') {
          const avgProfit = validCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0) / validCustomers.length;
          riskLevel = Math.abs((customer.monthlyProfit || 0) - avgProfit) > avgProfit ? 0.8 : 0.2;
        } else if (activeRiskType === 'failure') {
          riskLevel = Math.random() * 0.4;
        }
        
        if (riskLevel > 0.3) {
          const circle = L.circle(
            [parseFloat(customer.latitude), parseFloat(customer.longitude)],
            {
              radius: 150 + riskLevel * 200,
              color: riskConfig.color,
              fillColor: riskConfig.color,
              fillOpacity: riskLevel * 0.4,
              weight: 2
            }
          ).addTo(map);
          
          circle.bindPopup(`
            <div style="direction: rtl; text-align: right;">
              <h4 style="margin: 0 0 8px 0; color: ${riskConfig.color};">${riskConfig.label}</h4>
              <p style="margin: 4px 0;"><strong>مشتری:</strong> ${customer.businessName || 'نامشخص'}</p>
              <p style="margin: 4px 0;"><strong>سطح ریسک:</strong> ${Math.round(riskLevel * 100)}%</p>
            </div>
          `);
          
          mapInstanceRef.current.riskMarkers.push(circle);
        }
      });
    }

    if (showFlowLines && customers.length > 0 && bankingUnits.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude).slice(0, 15);
      const validUnits = bankingUnits.filter((u: any) => u.latitude && u.longitude);
      
      validCustomers.forEach((customer: any) => {
        let nearestUnit: any = null;
        let minDist = Infinity;
        
        validUnits.forEach((unit: any) => {
          const dist = Math.sqrt(
            Math.pow(parseFloat(unit.latitude) - parseFloat(customer.latitude), 2) +
            Math.pow(parseFloat(unit.longitude) - parseFloat(customer.longitude), 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestUnit = unit;
          }
        });
        
        if (nearestUnit) {
          const profit = customer.monthlyProfit || 1000000;
          const weight = Math.max(2, Math.min(8, profit / 10000000));
          
          const line = L.polyline(
            [
              [parseFloat(customer.latitude), parseFloat(customer.longitude)],
              [parseFloat(nearestUnit.latitude), parseFloat(nearestUnit.longitude)]
            ],
            {
              color: '#6366f1',
              weight: weight,
              opacity: 0.5,
              dashArray: '5, 10'
            }
          ).addTo(map);
          
          line.bindPopup(`
            <div style="direction: rtl; text-align: right;">
              <p style="margin: 4px 0;"><strong>از:</strong> ${customer.businessName || 'مشتری'}</p>
              <p style="margin: 4px 0;"><strong>به:</strong> ${nearestUnit.name || 'واحد بانکی'}</p>
              <p style="margin: 4px 0;"><strong>حجم:</strong> ${(profit / 1000000).toFixed(1)}M</p>
            </div>
          `);
          
          mapInstanceRef.current.flowLines.push(line);
        }
      });
    }

    if (showDistanceAnalysis && customers.length > 0 && bankingUnits.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      const validUnits = bankingUnits.filter((u: any) => u.latitude && u.longitude);
      
      const uncoveredCustomers = validCustomers.filter((customer: any) => {
        const customerLat = parseFloat(customer.latitude);
        const customerLng = parseFloat(customer.longitude);
        
        return !validUnits.some((unit: any) => {
          const dist = Math.sqrt(
            Math.pow(parseFloat(unit.latitude) - customerLat, 2) +
            Math.pow(parseFloat(unit.longitude) - customerLng, 2)
          );
          return dist < 0.03;
        });
      });
      
      uncoveredCustomers.forEach((customer: any) => {
        const circle = L.circle(
          [parseFloat(customer.latitude), parseFloat(customer.longitude)],
          {
            radius: 200,
            color: '#dc2626',
            fillColor: '#fecaca',
            fillOpacity: 0.6,
            weight: 3,
            dashArray: '5, 5'
          }
        ).addTo(map);
        
        circle.bindPopup(`
          <div style="direction: rtl; text-align: right;">
            <h4 style="margin: 0 0 8px 0; color: #dc2626;">نقطه کور</h4>
            <p style="margin: 4px 0;"><strong>مشتری:</strong> ${customer.businessName || 'نامشخص'}</p>
            <p style="margin: 4px 0;">این مشتری در شعاع پوشش هیچ واحد بانکی نیست</p>
          </div>
        `);
        
        mapInstanceRef.current.distanceLines.push(circle);
      });
    }

    if (showVoronoi && bankingUnits.length > 0) {
      const validUnits = bankingUnits.filter((u: any) => u.latitude && u.longitude);
      
      if (validUnits.length >= 3) {
        const points = validUnits.map((u: any) => [parseFloat(u.longitude), parseFloat(u.latitude)] as [number, number]);
        
        const bounds = {
          minLng: Math.min(...points.map(p => p[0])) - 0.05,
          maxLng: Math.max(...points.map(p => p[0])) + 0.05,
          minLat: Math.min(...points.map(p => p[1])) - 0.03,
          maxLat: Math.max(...points.map(p => p[1])) + 0.03
        };
        
        try {
          const delaunay = Delaunay.from(points);
          const voronoi = delaunay.voronoi([bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat]);
          
          validUnits.forEach((unit: any, i: number) => {
            const cell = voronoi.cellPolygon(i);
            if (cell) {
              const latLngs = cell.map((p: [number, number]) => [p[1], p[0]]);
              
              const customersInZone = customers.filter((c: any) => {
                if (!c.latitude || !c.longitude) return false;
                const cLat = parseFloat(c.latitude);
                const cLng = parseFloat(c.longitude);
                const closestUnit = validUnits.reduce((closest: any, u: any) => {
                  const dist = Math.hypot(parseFloat(u.latitude) - cLat, parseFloat(u.longitude) - cLng);
                  const closestDist = closest ? Math.hypot(parseFloat(closest.latitude) - cLat, parseFloat(closest.longitude) - cLng) : Infinity;
                  return dist < closestDist ? u : closest;
                }, null);
                return closestUnit?.id === unit.id;
              });
              
              const totalRevenue = customersInZone.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
              const intensity = Math.min(1, totalRevenue / 100000000);
              const colorIndex = i % CLUSTER_COLORS.length;
              
              const polygon = L.polygon(latLngs, {
                color: CLUSTER_COLORS[colorIndex],
                fillColor: CLUSTER_COLORS[colorIndex],
                fillOpacity: 0.15 + intensity * 0.2,
                weight: 2,
                dashArray: '8, 4'
              }).addTo(map);
              
              polygon.bindPopup(`
                <div style="direction: rtl; text-align: right;">
                  <h4 style="margin: 0 0 8px 0; color: ${CLUSTER_COLORS[colorIndex]};">منطقه ${unit.name || 'واحد بانکی'}</h4>
                  <p style="margin: 4px 0;"><strong>تعداد مشتری:</strong> ${customersInZone.length}</p>
                  <p style="margin: 4px 0;"><strong>درآمد کل:</strong> ${(totalRevenue / 1000000).toFixed(1)}M</p>
                  <p style="margin: 4px 0;"><strong>سهم بازار:</strong> ${((customersInZone.length / customers.length) * 100).toFixed(1)}%</p>
                </div>
              `);
              
              mapInstanceRef.current.voronoiPolygons.push(polygon);
            }
          });
        } catch (err) {
          console.error('Voronoi calculation error:', err);
        }
      }
    }

    if (showTerritoryBoundaries && clusterData?.clusters && clusterData.clusters.length > 0) {
      const assignmentMap = new Map<string, number>();
      if (clusterData.customerAssignments) {
        clusterData.customerAssignments.forEach(a => {
          assignmentMap.set(a.customerId, a.clusterId);
        });
      }
      
      const cross = (O: {lat: number, lng: number}, A: {lat: number, lng: number}, B: {lat: number, lng: number}) => {
        return (A.lng - O.lng) * (B.lat - O.lat) - (A.lat - O.lat) * (B.lng - O.lng);
      };
      
      const computeConvexHull = (pts: {lat: number, lng: number}[]): {lat: number, lng: number}[] => {
        if (pts.length < 3) return pts;
        const sorted = [...pts].sort((a, b) => a.lng === b.lng ? a.lat - b.lat : a.lng - b.lng);
        const lower: {lat: number, lng: number}[] = [];
        for (const p of sorted) {
          while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
            lower.pop();
          }
          lower.push(p);
        }
        const upper: {lat: number, lng: number}[] = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
          while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
            upper.pop();
          }
          upper.push(sorted[i]);
        }
        lower.pop();
        upper.pop();
        return lower.concat(upper);
      };
      
      clusterData.clusters.forEach((cluster: ClusterInfo, index: number) => {
        const clusterCustomers = customers.filter((c: any) => {
          if (!c.latitude || !c.longitude) return false;
          return assignmentMap.get(c.id) === cluster.id;
        });
        
        if (clusterCustomers.length >= 3) {
          const points = clusterCustomers.map((c: any) => ({
            lat: parseFloat(c.latitude),
            lng: parseFloat(c.longitude)
          }));
          
          const hull = computeConvexHull(points);
          const hullPoints = hull.map(p => [p.lat, p.lng] as [number, number]);
          
          const potentialColors = {
            'high': '#10b981',
            'medium': '#f59e0b',
            'low': '#ef4444'
          };
          const color = potentialColors[cluster.potentialLevel] || CLUSTER_COLORS[index % CLUSTER_COLORS.length];
          
          const polygon = L.polygon(hullPoints, {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 3,
            className: 'territory-polygon'
          }).addTo(map);
          
          polygon.bindPopup(`
            <div style="direction: rtl; text-align: right;">
              <h4 style="margin: 0 0 8px 0; color: ${color};">خوشه ${cluster.id + 1}</h4>
              <p style="margin: 4px 0;"><strong>پتانسیل:</strong> ${cluster.potentialLevel === 'high' ? 'بالا' : cluster.potentialLevel === 'medium' ? 'متوسط' : 'پایین'}</p>
              <p style="margin: 4px 0;"><strong>تعداد:</strong> ${cluster.customerCount}</p>
              <p style="margin: 4px 0;"><strong>درآمد:</strong> ${(cluster.totalRevenue / 1000000).toFixed(1)}M</p>
              <p style="margin: 4px 0;"><strong>میانگین سود:</strong> ${(cluster.avgMonthlyProfit / 1000000).toFixed(1)}M</p>
            </div>
          `);
          
          mapInstanceRef.current.territoryPolygons.push(polygon);
        }
      });
    }

    if (showMarketShare && bankingUnits.length > 0) {
      const validUnits = bankingUnits.filter((u: any) => u.latitude && u.longitude);
      
      validUnits.forEach((unit: any, i: number) => {
        const customersInUnit = customers.filter((c: any) => {
          if (!c.latitude || !c.longitude) return false;
          const cLat = parseFloat(c.latitude);
          const cLng = parseFloat(c.longitude);
          const closestUnit = validUnits.reduce((closest: any, u: any) => {
            const dist = Math.hypot(parseFloat(u.latitude) - cLat, parseFloat(u.longitude) - cLng);
            const closestDist = closest ? Math.hypot(parseFloat(closest.latitude) - cLat, parseFloat(closest.longitude) - cLng) : Infinity;
            return dist < closestDist ? u : closest;
          }, null);
          return closestUnit?.id === unit.id;
        });
        
        const marketShare = customers.length > 0 ? (customersInUnit.length / customers.length) * 100 : 0;
        const totalRevenue = customersInUnit.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
        
        if (marketShare > 5) {
          const size = Math.max(50, Math.min(100, marketShare * 3));
          
          const shareIcon = L.divIcon({
            className: 'market-share-icon',
            html: `
              <div style="
                width: ${size}px; height: ${size}px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: ${size > 70 ? '14px' : '12px'};
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
                border: 3px solid white;
              ">
                <span>${marketShare.toFixed(0)}%</span>
                <span style="font-size: 9px; opacity: 0.8;">${customersInUnit.length}</span>
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
          });
          
          const marker = L.marker(
            [parseFloat(unit.latitude), parseFloat(unit.longitude)],
            { icon: shareIcon }
          ).addTo(map);
          
          marker.bindPopup(`
            <div style="direction: rtl; text-align: right;">
              <h4 style="margin: 0 0 8px 0;">${unit.name || 'واحد بانکی'}</h4>
              <p style="margin: 4px 0;"><strong>سهم بازار:</strong> ${marketShare.toFixed(1)}%</p>
              <p style="margin: 4px 0;"><strong>تعداد مشتری:</strong> ${customersInUnit.length}</p>
              <p style="margin: 4px 0;"><strong>درآمد کل:</strong> ${(totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
          `);
          
          mapInstanceRef.current.marketShareOverlays.push(marker);
        }
      });
    }

    if (showBranchPerformance && branches.length > 0) {
      branches.forEach((branch: any) => {
        const branchCustomers = customers.filter((c: any) => c.branchId === branch.id);
        const activeCustomers = branchCustomers.filter((c: any) => c.status === 'active');
        const totalRevenue = branchCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
        
        const salesKPI = Math.min(100, (totalRevenue / 50000000) * 100);
        const customerKPI = Math.min(100, (activeCustomers.length / Math.max(1, branchCustomers.length)) * 100);
        const overallScore = (salesKPI + customerKPI) / 2;
        
        const scoreColor = overallScore >= 70 ? '#10b981' : overallScore >= 40 ? '#f59e0b' : '#ef4444';
        const scoreLabel = overallScore >= 70 ? 'عالی' : overallScore >= 40 ? 'متوسط' : 'ضعیف';
        
        const branchLat = branch.latitude || (TABRIZ_CENTER.lat + (Math.random() - 0.5) * 0.08);
        const branchLng = branch.longitude || (TABRIZ_CENTER.lng + (Math.random() - 0.5) * 0.1);
        
        const performanceIcon = L.divIcon({
          className: 'branch-performance-icon',
          html: `
            <div style="
              background: linear-gradient(135deg, ${scoreColor}dd 0%, ${scoreColor}99 100%);
              border-radius: 12px;
              padding: 8px 12px;
              color: white;
              font-weight: bold;
              font-size: 11px;
              box-shadow: 0 4px 12px ${scoreColor}40;
              border: 2px solid white;
              min-width: 80px;
              text-align: center;
            ">
              <div style="font-size: 13px;">${branch.name || 'شعبه'}</div>
              <div style="display: flex; gap: 8px; justify-content: center; margin-top: 4px;">
                <span>فروش: ${salesKPI.toFixed(0)}%</span>
              </div>
              <div style="margin-top: 2px; font-size: 10px; opacity: 0.9;">${scoreLabel}</div>
            </div>
          `,
          iconSize: [100, 60],
          iconAnchor: [50, 30]
        });
        
        const marker = L.marker([branchLat, branchLng], { icon: performanceIcon }).addTo(map);
        
        marker.bindPopup(`
          <div style="direction: rtl; text-align: right; min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: ${scoreColor}; font-size: 14px;">${branch.name || 'شعبه'}</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div style="background: #f0f9ff; padding: 8px; border-radius: 8px;">
                <div style="font-size: 10px; color: #0369a1;">KPI فروش</div>
                <div style="font-size: 16px; font-weight: bold; color: #0284c7;">${salesKPI.toFixed(0)}%</div>
              </div>
              <div style="background: #f0fdf4; padding: 8px; border-radius: 8px;">
                <div style="font-size: 10px; color: #15803d;">KPI جذب</div>
                <div style="font-size: 16px; font-weight: bold; color: #16a34a;">${customerKPI.toFixed(0)}%</div>
              </div>
            </div>
            <div style="margin-top: 10px; padding: 8px; background: ${scoreColor}15; border-radius: 8px; border-right: 3px solid ${scoreColor};">
              <div style="font-size: 10px;">امتیاز کل</div>
              <div style="font-size: 18px; font-weight: bold; color: ${scoreColor};">${overallScore.toFixed(0)} / 100</div>
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
              <p style="margin: 2px 0;">تعداد مشتری: ${branchCustomers.length}</p>
              <p style="margin: 2px 0;">درآمد کل: ${(totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        `);
        
        marker.on('click', () => {
          setSelectedBranchId(branch.id);
          if (!showSideAnalytics) setShowSideAnalytics(true);
        });
        
        mapInstanceRef.current.branchPerformanceMarkers.push(marker);
      });
    }

    if (showGeoAlerts && customers.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      
      const alertTypes = [
        { type: 'transaction_drop', color: '#ef4444', label: 'افت تراکنش', icon: '📉' },
        { type: 'unhealthy_terminal', color: '#f97316', label: 'پایانه ناسالم', icon: '⚠️' },
        { type: 'abnormal_customers', color: '#8b5cf6', label: 'مشتری غیرعادی', icon: '🔍' },
        { type: 'sudden_growth', color: '#10b981', label: 'رشد ناگهانی', icon: '📈' }
      ];
      
      validCustomers.forEach((customer: any, index: number) => {
        const alertProbability = Math.random();
        if (alertProbability > 0.7) {
          const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
          const intensity = 0.5 + Math.random() * 0.5;
          
          const pulseAnimation = `
            @keyframes pulse-${index} {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
            }
          `;
          
          const alertIcon = L.divIcon({
            className: 'geo-alert-icon',
            html: `
              <style>${pulseAnimation}</style>
              <div style="
                width: 36px; height: 36px;
                background: ${alertType.color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 16px;
                box-shadow: 0 0 20px ${alertType.color}80;
                border: 3px solid white;
                animation: pulse-${index} 2s ease-in-out infinite;
              ">
                ${alertType.type === 'transaction_drop' ? '↓' : alertType.type === 'unhealthy_terminal' ? '!' : alertType.type === 'abnormal_customers' ? '?' : '↑'}
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          
          const marker = L.marker(
            [parseFloat(customer.latitude), parseFloat(customer.longitude)],
            { icon: alertIcon }
          ).addTo(map);
          
          marker.bindPopup(`
            <div style="direction: rtl; text-align: right;">
              <h4 style="margin: 0 0 8px 0; color: ${alertType.color};">هشدار: ${alertType.label}</h4>
              <p style="margin: 4px 0;"><strong>مشتری:</strong> ${customer.businessName || 'نامشخص'}</p>
              <p style="margin: 4px 0;"><strong>شدت:</strong> ${(intensity * 100).toFixed(0)}%</p>
              <p style="margin: 4px 0; font-size: 11px; color: #64748b;">نیاز به بررسی فوری</p>
            </div>
          `);
          
          mapInstanceRef.current.geoAlertMarkers.push(marker);
        }
      });
    }

    if (showBubbleMap && customers.length > 0) {
      const gridSize = 0.02;
      const grid: { [key: string]: any[] } = {};
      
      customers.forEach((c: any) => {
        if (!c.latitude || !c.longitude) return;
        const lat = parseFloat(c.latitude);
        const lng = parseFloat(c.longitude);
        const gridKey = `${Math.floor(lat / gridSize)}_${Math.floor(lng / gridSize)}`;
        if (!grid[gridKey]) grid[gridKey] = [];
        grid[gridKey].push(c);
      });
      
      Object.entries(grid).forEach(([key, gridCustomers]) => {
        if (gridCustomers.length < 2) return;
        
        const centerLat = gridCustomers.reduce((sum, c) => sum + parseFloat(c.latitude), 0) / gridCustomers.length;
        const centerLng = gridCustomers.reduce((sum, c) => sum + parseFloat(c.longitude), 0) / gridCustomers.length;
        const totalRevenue = gridCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        
        const count = gridCustomers.length;
        const intensity = Math.min(1, totalRevenue / 100000000);
        const size = Math.max(30, Math.min(80, count * 8));
        
        const intensityColor = intensity > 0.7 ? '#10b981' : intensity > 0.4 ? '#f59e0b' : '#3b82f6';
        
        const bubbleIcon = L.divIcon({
          className: 'bubble-icon',
          html: `
            <div style="
              width: ${size}px; height: ${size}px;
              background: radial-gradient(circle at 30% 30%, ${intensityColor}cc, ${intensityColor}66);
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              box-shadow: 0 4px 20px ${intensityColor}50;
              border: 2px solid ${intensityColor};
            ">
              <span style="font-size: ${size > 50 ? '14px' : '11px'};">${count}</span>
              <span style="font-size: 8px; opacity: 0.8;">مشتری</span>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });
        
        const marker = L.marker([centerLat, centerLng], { icon: bubbleIcon }).addTo(map);
        
        marker.bindPopup(`
          <div style="direction: rtl; text-align: right;">
            <h4 style="margin: 0 0 8px 0;">خوشه مشتریان</h4>
            <p style="margin: 4px 0;"><strong>تعداد:</strong> ${count} مشتری</p>
            <p style="margin: 4px 0;"><strong>درآمد کل:</strong> ${(totalRevenue / 1000000).toFixed(1)}M</p>
            <p style="margin: 4px 0;"><strong>شدت:</strong> ${(intensity * 100).toFixed(0)}%</p>
          </div>
        `);
        
        mapInstanceRef.current.bubbleMarkers.push(marker);
      });
    }

    if (showAIRecommender && customers.length > 0 && bankingUnits.length > 0) {
      const validCustomers = customers.filter((c: any) => c.latitude && c.longitude);
      const validUnits = bankingUnits.filter((u: any) => u.latitude && u.longitude);
      
      const recommendations: { lat: number; lng: number; type: string; score: number; reason: string }[] = [];
      
      const gridSize = 0.025;
      const demandGrid: { [key: string]: { lat: number; lng: number; customers: number; revenue: number; covered: boolean } } = {};
      
      validCustomers.forEach((c: any) => {
        const lat = parseFloat(c.latitude);
        const lng = parseFloat(c.longitude);
        const gridKey = `${Math.floor(lat / gridSize)}_${Math.floor(lng / gridSize)}`;
        
        if (!demandGrid[gridKey]) {
          demandGrid[gridKey] = { lat: 0, lng: 0, customers: 0, revenue: 0, covered: false };
        }
        demandGrid[gridKey].customers++;
        demandGrid[gridKey].revenue += c.monthlyProfit || 0;
        demandGrid[gridKey].lat += lat;
        demandGrid[gridKey].lng += lng;
      });
      
      Object.entries(demandGrid).forEach(([key, cell]) => {
        cell.lat /= cell.customers;
        cell.lng /= cell.customers;
        
        const isCovered = validUnits.some((u: any) => {
          const dist = Math.hypot(parseFloat(u.latitude) - cell.lat, parseFloat(u.longitude) - cell.lng);
          return dist < 0.03;
        });
        cell.covered = isCovered;
      });
      
      Object.entries(demandGrid)
        .filter(([_, cell]) => !cell.covered && cell.customers >= 3)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .forEach(([_, cell]) => {
          recommendations.push({
            lat: cell.lat,
            lng: cell.lng,
            type: 'new_terminal',
            score: Math.min(100, (cell.revenue / 50000000) * 100),
            reason: `${cell.customers} مشتری بدون پوشش با درآمد ${(cell.revenue / 1000000).toFixed(1)}M`
          });
        });
      
      const lowPerformingUnits = validUnits.filter((u: any) => {
        const unitCustomers = validCustomers.filter((c: any) => {
          const dist = Math.hypot(parseFloat(u.latitude) - parseFloat(c.latitude), parseFloat(u.longitude) - parseFloat(c.longitude));
          return dist < 0.02;
        });
        return unitCustomers.length < 2;
      });
      
      lowPerformingUnits.slice(0, 3).forEach((unit: any) => {
        const bestTarget = Object.entries(demandGrid)
          .filter(([_, cell]) => !cell.covered && cell.customers >= 2)
          .sort((a, b) => b[1].customers - a[1].customers)[0];
        
        if (bestTarget) {
          recommendations.push({
            lat: parseFloat(unit.latitude),
            lng: parseFloat(unit.longitude),
            type: 'relocate',
            score: 70,
            reason: `انتقال به منطقه با ${bestTarget[1].customers} مشتری پتانسیل`
          });
        }
      });
      
      recommendations.forEach((rec, i) => {
        const typeConfig = {
          'new_terminal': { color: '#10b981', label: 'نصب پایانه جدید', icon: '+' },
          'relocate': { color: '#f59e0b', label: 'انتقال دستگاه', icon: '→' },
          'marketing': { color: '#8b5cf6', label: 'منطقه بازاریابی', icon: '★' },
          'strengthen': { color: '#3b82f6', label: 'تقویت شعبه', icon: '↑' }
        }[rec.type] || { color: '#6b7280', label: rec.type, icon: '?' };
        
        const recIcon = L.divIcon({
          className: 'ai-recommender-icon',
          html: `
            <div style="
              position: relative;
              width: 50px; height: 50px;
            ">
              <div style="
                position: absolute;
                width: 50px; height: 50px;
                background: ${typeConfig.color}20;
                border: 2px dashed ${typeConfig.color};
                border-radius: 50%;
                animation: pulse 2s infinite;
              "></div>
              <div style="
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 30px; height: 30px;
                background: ${typeConfig.color};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 2px 10px ${typeConfig.color}60;
              ">
                ${typeConfig.icon}
              </div>
            </div>
          `,
          iconSize: [50, 50],
          iconAnchor: [25, 25]
        });
        
        const marker = L.marker([rec.lat, rec.lng], { icon: recIcon }).addTo(map);
        
        marker.bindPopup(`
          <div style="direction: rtl; text-align: right; min-width: 180px;">
            <h4 style="margin: 0 0 8px 0; color: ${typeConfig.color};">
              پیشنهاد هوشمند: ${typeConfig.label}
            </h4>
            <div style="background: ${typeConfig.color}10; padding: 8px; border-radius: 8px; margin-bottom: 8px;">
              <div style="font-size: 10px; color: #64748b;">امتیاز پیشنهاد</div>
              <div style="font-size: 18px; font-weight: bold; color: ${typeConfig.color};">${rec.score.toFixed(0)}%</div>
            </div>
            <p style="margin: 4px 0; font-size: 11px;">${rec.reason}</p>
          </div>
        `);
        
        mapInstanceRef.current.aiRecommenderMarkers.push(marker);
      });
    }

  }, [isMapReady, customers, bankingUnits, branches, clusterData, showCustomers, showBankingUnits, showHeatmap, showClusters, showCoverageRadius, coverageRadius, showSmartZoning, activeZoneType, showForecastLayer, showRiskMap, activeRiskType, showFlowLines, showDistanceAnalysis, showVoronoi, showTerritoryBoundaries, showMarketShare, showBranchPerformance, showGeoAlerts, showBubbleMap, showAIRecommender, showSideAnalytics, clearMarkers, handleEntityClick]);

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
            <Card className="shadow-xl max-h-[calc(100vh-120px)]">
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
              <ScrollArea className="h-[calc(100vh-200px)]">
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

                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    تحلیل پیشرفته
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-emerald-500" />
                      منطقه‌بندی هوشمند
                    </span>
                    <Switch
                      checked={showSmartZoning}
                      onCheckedChange={setShowSmartZoning}
                      data-testid="switch-smart-zoning"
                    />
                  </div>

                  {showSmartZoning && (
                    <div className="pr-6 space-y-2">
                      <span className="text-xs text-muted-foreground">نوع منطقه:</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(ZONE_TYPES).map(([key, zone]) => (
                          <Badge
                            key={key}
                            variant={activeZoneType === key ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            style={activeZoneType === key ? { backgroundColor: zone.color } : {}}
                            onClick={() => setActiveZoneType(key)}
                            data-testid={`badge-zone-${key}`}
                          >
                            {zone.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      پیش‌بینی روند
                    </span>
                    <Switch
                      checked={showForecastLayer}
                      onCheckedChange={setShowForecastLayer}
                      data-testid="switch-forecast"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      نقشه ریسک
                    </span>
                    <Switch
                      checked={showRiskMap}
                      onCheckedChange={setShowRiskMap}
                      data-testid="switch-risk-map"
                    />
                  </div>

                  {showRiskMap && (
                    <div className="pr-6 space-y-2">
                      <span className="text-xs text-muted-foreground">نوع ریسک:</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(RISK_TYPES).map(([key, risk]) => (
                          <Badge
                            key={key}
                            variant={activeRiskType === key ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            style={activeRiskType === key ? { backgroundColor: risk.color } : {}}
                            onClick={() => setActiveRiskType(key)}
                            data-testid={`badge-risk-${key}`}
                          >
                            {risk.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Route className="h-4 w-4 text-indigo-500" />
                      جریان تراکنش‌ها
                    </span>
                    <Switch
                      checked={showFlowLines}
                      onCheckedChange={setShowFlowLines}
                      data-testid="switch-flow-lines"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Compass className="h-4 w-4 text-rose-500" />
                      تحلیل فاصله (نقاط کور)
                    </span>
                    <Switch
                      checked={showDistanceAnalysis}
                      onCheckedChange={setShowDistanceAnalysis}
                      data-testid="switch-distance"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    مرزبندی حرفه‌ای
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-violet-500" />
                      نمودار ورونوی
                    </span>
                    <Switch
                      checked={showVoronoi}
                      onCheckedChange={setShowVoronoi}
                      data-testid="switch-voronoi"
                    />
                  </div>
                  {showVoronoi && (
                    <p className="text-xs text-muted-foreground pr-6">
                      تقسیم‌بندی هندسی مناطق بر اساس واحدهای بانکی
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-500" />
                      مرز خوشه‌ها
                    </span>
                    <Switch
                      checked={showTerritoryBoundaries}
                      onCheckedChange={(checked) => {
                        setShowTerritoryBoundaries(checked);
                        if (checked && !showClusters) setShowClusters(true);
                      }}
                      data-testid="switch-territory"
                    />
                  </div>
                  {showTerritoryBoundaries && (
                    <p className="text-xs text-muted-foreground pr-6">
                      نمایش حوزه جغرافیایی هر خوشه مشتری
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      سهم بازار
                    </span>
                    <Switch
                      checked={showMarketShare}
                      onCheckedChange={setShowMarketShare}
                      data-testid="switch-market-share"
                    />
                  </div>
                  {showMarketShare && (
                    <p className="text-xs text-muted-foreground pr-6">
                      نمایش درصد سهم هر واحد از کل مشتریان
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    هوش بانکی
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      عملکرد شعب
                    </span>
                    <Switch
                      checked={showBranchPerformance}
                      onCheckedChange={setShowBranchPerformance}
                      data-testid="switch-branch-performance"
                    />
                  </div>
                  {showBranchPerformance && (
                    <p className="text-xs text-muted-foreground pr-6">
                      KPI فروش و جذب مشتری برای هر شعبه
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      هشدار مناطق
                    </span>
                    <Switch
                      checked={showGeoAlerts}
                      onCheckedChange={setShowGeoAlerts}
                      data-testid="switch-geo-alerts"
                    />
                  </div>
                  {showGeoAlerts && (
                    <p className="text-xs text-muted-foreground pr-6">
                      هشدارهای فوری افت تراکنش و پایانه ناسالم
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <CircleDot className="h-4 w-4 text-cyan-500" />
                      دایره‌های هوشمند
                    </span>
                    <Switch
                      checked={showBubbleMap}
                      onCheckedChange={setShowBubbleMap}
                      data-testid="switch-bubble-map"
                    />
                  </div>
                  {showBubbleMap && (
                    <p className="text-xs text-muted-foreground pr-6">
                      نمایش تراکم مشتریان با اندازه و رنگ
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      پیشنهاددهی AI
                    </span>
                    <Switch
                      checked={showAIRecommender}
                      onCheckedChange={setShowAIRecommender}
                      data-testid="switch-ai-recommender"
                    />
                  </div>
                  {showAIRecommender && (
                    <p className="text-xs text-muted-foreground pr-6">
                      پیشنهاد محل نصب پایانه و تقویت شعب
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                      پنل تحلیل
                    </span>
                    <Switch
                      checked={showSideAnalytics}
                      onCheckedChange={setShowSideAnalytics}
                      data-testid="switch-side-analytics"
                    />
                  </div>
                  {showSideAnalytics && (
                    <p className="text-xs text-muted-foreground pr-6">
                      داشبورد نمودارها و KPI کنار نقشه
                    </p>
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
              </ScrollArea>
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

                    {customerTimeSeries.length > 0 && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">روند سری زمانی</span>
                          <Badge variant="outline" className="text-xs">
                            {customerTimeSeries.length} رکورد
                          </Badge>
                        </div>
                        
                        <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={customerTimeSeries.map(ts => ({
                              date: `${ts.year}/${ts.month}`,
                              profit: (ts.profitability || 0) / 1000000,
                              balance: (ts.averageBalance || 0) / 1000000
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip 
                                formatter={(value: number, name: string) => [
                                  `${value.toFixed(1)}M`,
                                  name === 'profit' ? 'سودآوری' : 'میانگین حساب'
                                ]}
                                labelFormatter={(label) => `تاریخ: ${label}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="profit" 
                                stroke="#10b981" 
                                fill="#10b981" 
                                fillOpacity={0.3}
                                name="سودآوری"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="balance" 
                                stroke="#3b82f6" 
                                fill="#3b82f6" 
                                fillOpacity={0.2}
                                name="میانگین حساب"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(() => {
                            const latest = customerTimeSeries[customerTimeSeries.length - 1];
                            const statusLabels: Record<string, { label: string; color: string }> = {
                              'active': { label: 'فعال', color: 'text-green-500' },
                              'inactive': { label: 'غیرفعال', color: 'text-gray-500' },
                              'efficient': { label: 'کارا', color: 'text-blue-500' },
                              'inefficient': { label: 'ناکارا', color: 'text-red-500' }
                            };
                            const statusInfo = statusLabels[latest?.posStatus || 'active'];
                            return (
                              <>
                                <div className="bg-muted/50 p-2 rounded">
                                  <p className="text-muted-foreground">آخرین وضعیت</p>
                                  <p className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</p>
                                </div>
                                <div className="bg-muted/50 p-2 rounded">
                                  <p className="text-muted-foreground">آخرین سود</p>
                                  <p className="font-medium text-green-600">
                                    {latest?.profitability ? `${(latest.profitability / 1000000).toFixed(1)}M` : '-'}
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {timeSeriesLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        <span className="text-sm text-muted-foreground">در حال بارگذاری سری زمانی...</span>
                      </div>
                    )}
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

      {timeSliderEnabled && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-96">
          <div className="bg-background/95 backdrop-blur rounded-lg px-4 py-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">اسلایدر زمان</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTimeSliderValue(Math.max(1, timeSliderValue - 7))}
                  data-testid="button-time-back"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="button-time-play"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTimeSliderValue(Math.min(90, timeSliderValue + 7))}
                  data-testid="button-time-forward"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Slider
              value={[timeSliderValue]}
              onValueChange={([v]) => setTimeSliderValue(v)}
              min={1}
              max={90}
              step={1}
              data-testid="slider-time"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>۹۰ روز قبل</span>
              <span className="font-medium">{timeSliderValue} روز قبل</span>
              <span>امروز</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-40 flex flex-col gap-2">
        <Button
          variant={timeSliderEnabled ? "default" : "outline"}
          size="sm"
          className="bg-background/95 backdrop-blur shadow-lg"
          onClick={() => setTimeSliderEnabled(!timeSliderEnabled)}
          data-testid="button-toggle-time-slider"
        >
          <Clock className="h-4 w-4 ml-2" />
          اسلایدر زمان
        </Button>
        
        <Button
          variant={activeAIFilter ? "default" : "outline"}
          size="sm"
          className="bg-background/95 backdrop-blur shadow-lg"
          onClick={() => setActiveAIFilter(activeAIFilter ? null : 'unusualBehavior')}
          data-testid="button-toggle-ai-filter"
        >
          <Sparkles className="h-4 w-4 ml-2" />
          فیلتر هوشمند
        </Button>
      </div>

      {activeAIFilter && (
        <div className="absolute bottom-4 left-36 z-40">
          <div className="bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">فیلترهای هوشمند</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(AI_FILTER_TYPES).map(([key, filter]) => (
                <Badge
                  key={key}
                  variant={activeAIFilter === key ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  style={activeAIFilter === key ? { backgroundColor: filter.color } : {}}
                  onClick={() => setActiveAIFilter(key)}
                  data-testid={`badge-ai-filter-${key}`}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

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

      <AnimatePresence>
        {showSideAnalytics && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute top-20 left-4 w-80 z-40"
          >
            <Card className="shadow-xl max-h-[calc(100vh-120px)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    داشبورد تحلیلی
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSideAnalytics(false)}
                    data-testid="button-close-analytics"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
                        <Users className="h-3 w-3" />
                        مشتریان
                      </div>
                      <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                      <p className="text-xs text-muted-foreground">{stats.activeCustomers} فعال</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-600 text-xs mb-1">
                        <Building2 className="h-3 w-3" />
                        واحد بانکی
                      </div>
                      <p className="text-2xl font-bold">{stats.totalBankingUnits}</p>
                      <p className="text-xs text-muted-foreground">{branches.length} شعبه</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">درآمد کل</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {(customers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0) / 1000000000).toFixed(2)}B
                    </p>
                    <p className="text-xs text-muted-foreground">تومان</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      نقاط داغ (Hotspots)
                    </h4>
                    <div className="space-y-2">
                      {customers
                        .filter((c: any) => c.latitude && c.longitude)
                        .sort((a: any, b: any) => (b.monthlyProfit || 0) - (a.monthlyProfit || 0))
                        .slice(0, 5)
                        .map((c: any, i: number) => (
                          <div 
                            key={c.id} 
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover-elevate cursor-pointer"
                            onClick={() => {
                              if (mapInstanceRef.current?.map && c.latitude && c.longitude) {
                                mapInstanceRef.current.map.setView([parseFloat(c.latitude), parseFloat(c.longitude)], 16);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-muted-foreground'
                              }`}>
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-xs font-medium truncate max-w-[120px]">{c.businessName || 'نامشخص'}</p>
                                <p className="text-xs text-muted-foreground">{c.businessType || '-'}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {((c.monthlyProfit || 0) / 1000000).toFixed(1)}M
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      توزیع نوع کسب‌وکار
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(
                        customers.reduce((acc: any, c: any) => {
                          const type = c.businessType || 'سایر';
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {})
                      )
                        .sort((a: any, b: any) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([type, count]: [string, any], i: number) => {
                          const percentage = (count / customers.length) * 100;
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{type}</span>
                                <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${colors[i % colors.length]} rounded-full transition-all`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-cyan-500" />
                      وضعیت مشتریان
                    </h4>
                    <div className="flex gap-2">
                      <div className="flex-1 text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{stats.activeCustomers}</p>
                        <p className="text-xs text-muted-foreground">فعال</p>
                      </div>
                      <div className="flex-1 text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <p className="text-lg font-bold text-red-600">{stats.inactiveCustomers}</p>
                        <p className="text-xs text-muted-foreground">غیرفعال</p>
                      </div>
                      <div className="flex-1 text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <p className="text-lg font-bold text-yellow-600">
                          {customers.filter((c: any) => c.status === 'marketing').length}
                        </p>
                        <p className="text-xs text-muted-foreground">بازاریابی</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-500" />
                      وضعیت کارآمدی پوز
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <p className="text-lg font-bold text-emerald-600">
                          {customers.filter((c: any) => c.status === 'active' || c.status === 'کارآمد').length}
                        </p>
                        <p className="text-xs text-muted-foreground">کارآمد</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <p className="text-lg font-bold text-red-600">
                          {customers.filter((c: any) => c.status === 'loss' || c.status === 'زیان‌ده' || c.status === 'زیانده').length}
                        </p>
                        <p className="text-xs text-muted-foreground">زیان‌ده</p>
                      </div>
                      <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                        <p className="text-lg font-bold text-amber-600">
                          {customers.filter((c: any) => c.status === 'marketing' || c.status === 'بازاریابی').length}
                        </p>
                        <p className="text-xs text-muted-foreground">بازاریابی</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                        <p className="text-lg font-bold text-gray-600">
                          {customers.filter((c: any) => c.status === 'collected' || c.status === 'جمع‌آوری شده').length}
                        </p>
                        <p className="text-xs text-muted-foreground">جمع‌آوری</p>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                      <div className="flex justify-between text-xs mb-1">
                        <span>نرخ کارآمدی</span>
                        <span className="font-medium">
                          {customers.length > 0 
                            ? ((customers.filter((c: any) => c.status === 'active' || c.status === 'کارآمد').length / customers.length) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ 
                            width: `${customers.length > 0 
                              ? (customers.filter((c: any) => c.status === 'active' || c.status === 'کارآمد').length / customers.length) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      خلاصه مالی ترمینال‌ها
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <span className="text-xs">مجموع تراکنش‌ها</span>
                        <Badge variant="outline" className="text-xs">
                          {(customers.reduce((sum: number, c: any) => sum + (c.totalTransactions || 0), 0)).toLocaleString('fa-IR')}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <span className="text-xs">درآمد کل پذیرندگان</span>
                        <Badge variant="outline" className="text-xs text-green-600">
                          {(customers.reduce((sum: number, c: any) => sum + (c.totalRevenue || c.monthlyProfit || 0), 0) / 1000000000).toFixed(2)}B
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                        <span className="text-xs">سود خالص</span>
                        <Badge variant="outline" className={`text-xs ${
                          customers.reduce((sum: number, c: any) => sum + (c.profitLoss || 0), 0) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(customers.reduce((sum: number, c: any) => sum + (c.profitLoss || 0), 0) / 1000000000).toFixed(2)}B
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <span className="text-xs">فاصله تا کارآمدی</span>
                        <Badge variant="outline" className="text-xs text-orange-600">
                          {(customers.reduce((sum: number, c: any) => sum + (c.distanceToEfficiency || 0), 0) / 1000000).toFixed(1)}M
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                      روند سوددهی ماهانه
                    </h4>
                    <div className="space-y-1">
                      {(() => {
                        const monthlyData = customers.reduce((acc: any, c: any) => {
                          const installDate = c.installDate || c.reportDate || '';
                          let month = 'نامشخص';
                          if (installDate) {
                            const parts = installDate.split('/');
                            if (parts.length >= 2) {
                              const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
                              const monthIndex = parseInt(parts[1]) - 1;
                              if (monthIndex >= 0 && monthIndex < 12) {
                                month = monthNames[monthIndex];
                              }
                            }
                          }
                          if (!acc[month]) {
                            acc[month] = { profit: 0, count: 0, loss: 0 };
                          }
                          const profit = c.profitLoss || c.monthlyProfit || 0;
                          if (profit >= 0) {
                            acc[month].profit += profit;
                          } else {
                            acc[month].loss += Math.abs(profit);
                          }
                          acc[month].count++;
                          return acc;
                        }, {});
                        
                        const sortedMonths = Object.entries(monthlyData)
                          .filter(([month]) => month !== 'نامشخص')
                          .slice(0, 6);
                        
                        const maxProfit = Math.max(...sortedMonths.map(([, data]: [string, any]) => data.profit), 1);
                        
                        return sortedMonths.map(([month, data]: [string, any]) => (
                          <div key={month} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{month}</span>
                              <span className="text-muted-foreground">
                                {data.count} پوز | {(data.profit / 1000000).toFixed(0)}M
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-green-500 rounded-l-full"
                                style={{ width: `${(data.profit / maxProfit) * 100}%` }}
                              />
                              {data.loss > 0 && (
                                <div 
                                  className="h-full bg-red-400 rounded-r-full"
                                  style={{ width: `${(data.loss / maxProfit) * 100}%` }}
                                />
                              )}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {showBranchPerformance && branches.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          رتبه‌بندی شعب
                        </h4>
                        <div className="space-y-2">
                          {branches
                            .map((branch: any) => {
                              const branchCustomers = customers.filter((c: any) => c.branchId === branch.id);
                              const totalRevenue = branchCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
                              return { ...branch, customerCount: branchCustomers.length, revenue: totalRevenue };
                            })
                            .sort((a: any, b: any) => b.revenue - a.revenue)
                            .slice(0, 5)
                            .map((branch: any, i: number) => (
                              <div 
                                key={branch.id} 
                                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-muted-foreground'
                                  }`}>
                                    {i + 1}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium">{branch.name}</p>
                                    <p className="text-xs text-muted-foreground">{branch.customerCount} مشتری</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {(branch.revenue / 1000000).toFixed(0)}M
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
