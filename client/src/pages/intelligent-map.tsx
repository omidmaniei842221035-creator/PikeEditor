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
  Grid3X3
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
        distanceLines: [] as any[]
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

  }, [isMapReady, customers, bankingUnits, clusterData, showCustomers, showBankingUnits, showHeatmap, showClusters, showCoverageRadius, coverageRadius, showSmartZoning, activeZoneType, showForecastLayer, showRiskMap, activeRiskType, showFlowLines, showDistanceAnalysis, clearMarkers, handleEntityClick]);

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
