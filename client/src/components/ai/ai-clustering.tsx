import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Target, TrendingUp, TrendingDown, MapPin, Users } from "lucide-react";

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

export function AIClustering() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [clusterCount, setClusterCount] = useState(5);
  const [isMapReady, setIsMapReady] = useState(false);

  const { data: clusterData, isLoading, refetch } = useQuery<ClusterResult>({
    queryKey: ['/api/ai/clusters', clusterCount],
    queryFn: async () => {
      const response = await fetch(`/api/ai/clusters?k=${clusterCount}`);
      if (!response.ok) throw new Error('Failed to fetch clusters');
      return response.json();
    },
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
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

      const map = L.map(mapRef.current).setView([38.0792, 46.2887], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = { map, markers: [], circles: [], polygons: [] };
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

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !clusterData) return;

    const L = (window as any).L;
    const { map, markers, circles, polygons } = mapInstanceRef.current;

    markers.forEach((m: any) => m.remove());
    circles.forEach((c: any) => c.remove());
    polygons.forEach((p: any) => p.remove());
    mapInstanceRef.current.markers = [];
    mapInstanceRef.current.circles = [];
    mapInstanceRef.current.polygons = [];

    const assignmentMap = new Map(
      clusterData.customerAssignments.map(a => [a.customerId, a.clusterId])
    );

    customers.forEach((customer: any) => {
      if (!customer.latitude || !customer.longitude) return;
      
      const clusterId = assignmentMap.get(customer.id);
      if (clusterId === undefined) return;

      const color = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
      
      const marker = L.circleMarker([parseFloat(customer.latitude), parseFloat(customer.longitude)], {
        radius: 6,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right;">
          <strong>${customer.shopName}</strong><br/>
          <span>خوشه: ${clusterId + 1}</span><br/>
          <span>نوع: ${customer.businessType}</span><br/>
          <span>سود ماهانه: ${(customer.monthlyProfit || 0).toLocaleString('fa-IR')} تومان</span>
        </div>
      `);

      mapInstanceRef.current.markers.push(marker);
    });

    clusterData.clusters.forEach((cluster) => {
      const color = CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length];
      
      const clusterCustomers = customers.filter((c: any) => 
        assignmentMap.get(c.id) === cluster.id && c.latitude && c.longitude
      );
      
      if (clusterCustomers.length > 2) {
        const lats = clusterCustomers.map((c: any) => parseFloat(c.latitude));
        const lngs = clusterCustomers.map((c: any) => parseFloat(c.longitude));
        const maxDist = Math.max(
          Math.max(...lats) - Math.min(...lats),
          Math.max(...lngs) - Math.min(...lngs)
        ) * 111 / 2;
        
        const circle = L.circle([cluster.centroid.lat, cluster.centroid.lng], {
          radius: Math.max(500, maxDist * 1000),
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(map);
        
        mapInstanceRef.current.circles.push(circle);
      }

      const centroidMarker = L.marker([cluster.centroid.lat, cluster.centroid.lng], {
        icon: L.divIcon({
          className: 'cluster-centroid',
          html: `<div style="background-color: ${color}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${cluster.id + 1}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      centroidMarker.bindPopup(`
        <div style="direction: rtl; text-align: right; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: ${color};">خوشه ${cluster.id + 1}</h4>
          <p><strong>تعداد مشتری:</strong> ${cluster.customerCount}</p>
          <p><strong>میانگین سود:</strong> ${cluster.avgMonthlyProfit.toLocaleString('fa-IR')} تومان</p>
          <p><strong>نوع غالب:</strong> ${cluster.dominantBusinessType}</p>
          <p><strong>پتانسیل:</strong> ${cluster.potentialLevel === 'high' ? 'بالا' : cluster.potentialLevel === 'medium' ? 'متوسط' : 'پایین'}</p>
          ${cluster.characteristics.length > 0 ? `<p><strong>ویژگی‌ها:</strong> ${cluster.characteristics.join('، ')}</p>` : ''}
        </div>
      `);

      mapInstanceRef.current.markers.push(centroidMarker);
    });

    if (clusterData.clusters.length > 0) {
      const bounds = L.latLngBounds(
        clusterData.clusters.map(c => [c.centroid.lat, c.centroid.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [isMapReady, clusterData, customers]);

  const getPotentialBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            خوشه‌بندی هوشمند مشتریان
          </h2>
          <p className="text-muted-foreground mt-1">
            گروه‌بندی خودکار مشتریان بر اساس موقعیت، رفتار خرید و الگوهای فعالیت
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">تعداد خوشه:</span>
            <Select 
              value={clusterCount.toString()} 
              onValueChange={(v) => setClusterCount(parseInt(v))}
            >
              <SelectTrigger className="w-20" data-testid="select-cluster-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            data-testid="button-refresh-clusters"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحلیل مجدد
          </Button>
        </div>
      </div>

      {clusterData?.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تعداد خوشه</p>
                  <p className="text-2xl font-bold">{clusterData.metrics.totalClusters}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مناطق پرپتانسیل</p>
                  <p className="text-2xl font-bold">{clusterData.metrics.highPotentialAreas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مناطق کم‌پتانسیل</p>
                  <p className="text-2xl font-bold">{clusterData.metrics.lowPotentialAreas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">کیفیت خوشه‌بندی</p>
                  <p className="text-2xl font-bold">{Math.round(clusterData.metrics.silhouetteScore * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                نقشه خوشه‌بندی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapRef} 
                className="h-[500px] rounded-lg border"
                data-testid="map-clustering"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>جزئیات خوشه‌ها</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : clusterData?.clusters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  داده کافی برای خوشه‌بندی وجود ندارد
                </p>
              ) : (
                clusterData?.clusters.map((cluster) => (
                  <div 
                    key={cluster.id}
                    className="p-3 rounded-lg border hover-elevate"
                    style={{ borderRightColor: CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length], borderRightWidth: '4px' }}
                    data-testid={`cluster-card-${cluster.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: CLUSTER_COLORS[cluster.id % CLUSTER_COLORS.length] }}
                        />
                        خوشه {cluster.id + 1}
                      </span>
                      <Badge className={getPotentialBadgeColor(cluster.potentialLevel)}>
                        {cluster.potentialLevel === 'high' ? 'پتانسیل بالا' : 
                         cluster.potentialLevel === 'medium' ? 'پتانسیل متوسط' : 'پتانسیل پایین'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>تعداد: {cluster.customerCount} مشتری</div>
                      <div>نوع: {cluster.dominantBusinessType}</div>
                      <div className="col-span-2">
                        سود: {cluster.avgMonthlyProfit.toLocaleString('fa-IR')} تومان
                      </div>
                    </div>
                    {cluster.characteristics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cluster.characteristics.map((char, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
