import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getBusinessIcon, getCustomerMarkerColor } from '@/lib/map-utils';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Building2,
  Target,
  Palette,
  Save,
  X,
  Users,
  TrendingUp,
  Layers,
  Compass,
  Pencil,
  Square,
  Circle,
  Home,
  RefreshCw,
  Brain,
  Radar,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Filter,
  Maximize2,
  Minimize2,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

interface Territory {
  id: string;
  name: string;
  color: string;
  assignedBankingUnitId?: string | null;
  businessFocus?: string | null;
  autoNamed: boolean;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  businessType: string;
  status: string;
  latitude?: string;
  longitude?: string;
  monthlyProfit?: number;
  address?: string;
  bankingUnitId?: string;
}

interface BankingUnit {
  id: string;
  name: string;
  type: string;
  latitude?: string;
  longitude?: string;
}

interface ClusterData {
  clusters: Array<{
    id: number;
    centroid: [number, number];
    customerCount: number;
    totalRevenue: number;
    avgRevenue: number;
    potential: string;
    businessTypes: Record<string, number>;
    customers: string[];
  }>;
  customerAssignments: Array<{
    customerId: string;
    clusterId: number;
  }>;
  metrics: {
    totalClusters: number;
    highPotentialAreas: number;
    lowPotentialAreas: number;
  };
}

const CLUSTER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'
];

const TERRITORY_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1'
];

export default function RegionManager() {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const customerMarkersRef = useRef<L.LayerGroup | null>(null);
  const bankingUnitMarkersRef = useRef<L.LayerGroup | null>(null);
  const territoryLayersRef = useRef<L.LayerGroup | null>(null);
  const clusterLayersRef = useRef<L.LayerGroup | null>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [showCustomers, setShowCustomers] = useState(true);
  const [showBankingUnits, setShowBankingUnits] = useState(true);
  const [showTerritories, setShowTerritories] = useState(true);
  const [showClusters, setShowClusters] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [bankingUnitFilter, setBankingUnitFilter] = useState<string>('all');
  
  const [clusterCount, setClusterCount] = useState(5);
  const [coverageRadius, setCoverageRadius] = useState(3);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingType, setDrawingType] = useState<'polygon' | 'rectangle' | 'circle' | null>(null);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [newTerritoryName, setNewTerritoryName] = useState('');
  const [newTerritoryColor, setNewTerritoryColor] = useState('#3b82f6');
  const [showTerritoryDialog, setShowTerritoryDialog] = useState(false);
  const [pendingGeometry, setPendingGeometry] = useState<any>(null);

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers']
  });

  const { data: bankingUnits = [] } = useQuery<BankingUnit[]>({
    queryKey: ['/api/banking-units']
  });

  const { data: territories = [], isLoading: territoriesLoading } = useQuery<Territory[]>({
    queryKey: ['/api/territories']
  });

  const { data: clusterData, isLoading: clustersLoading, refetch: refetchClusters } = useQuery<ClusterData>({
    queryKey: ['/api/ai/clusters', clusterCount],
    enabled: showClusters
  });

  const validCustomers = useMemo(() => {
    return customers.filter(c => c.latitude && c.longitude);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return validCustomers.filter(customer => {
      if (statusFilter !== 'all' && customer.status !== statusFilter) return false;
      if (businessTypeFilter !== 'all' && customer.businessType !== businessTypeFilter) return false;
      if (bankingUnitFilter !== 'all' && customer.bankingUnitId !== bankingUnitFilter) return false;
      return true;
    });
  }, [validCustomers, statusFilter, businessTypeFilter, bankingUnitFilter]);

  const businessTypes = useMemo(() => {
    const types = new Set<string>();
    customers.forEach(c => {
      if (c.businessType) types.add(c.businessType);
    });
    return Array.from(types).sort();
  }, [customers]);

  const createTerritoryMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/territories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/territories'] });
      toast({ title: 'منطقه جدید ایجاد شد' });
      setShowTerritoryDialog(false);
      setPendingGeometry(null);
      setNewTerritoryName('');
    },
    onError: () => {
      toast({ title: 'خطا در ایجاد منطقه', variant: 'destructive' });
    }
  });

  const deleteTerritoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/territories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/territories'] });
      toast({ title: 'منطقه حذف شد' });
    }
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [38.0800, 46.2919],
      zoom: 12,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }
        },
        rectangle: {
          shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }
        },
        circle: {
          shapeOptions: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }
        },
        marker: false,
        circlemarker: false,
        polyline: false
      },
      edit: { featureGroup: drawnItems, remove: true }
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    customerMarkersRef.current = L.layerGroup().addTo(map);
    bankingUnitMarkersRef.current = L.layerGroup().addTo(map);
    territoryLayersRef.current = L.layerGroup().addTo(map);
    clusterLayersRef.current = L.layerGroup().addTo(map);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      const geometry = layer.toGeoJSON().geometry;
      
      let bbox: [number, number, number, number];
      if (e.layerType === 'circle') {
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        const latOffset = (radius / 111320);
        const lngOffset = (radius / (111320 * Math.cos(center.lat * Math.PI / 180)));
        bbox = [
          center.lng - lngOffset,
          center.lat - latOffset,
          center.lng + lngOffset,
          center.lat + latOffset
        ];
      } else {
        const bounds = layer.getBounds();
        bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ];
      }

      setPendingGeometry({ geometry, bbox, layer });
      setNewTerritoryColor(TERRITORY_COLORS[territories.length % TERRITORY_COLORS.length]);
      setShowTerritoryDialog(true);
      setIsDrawing(false);
    });

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const updateCustomerMarkers = useCallback(() => {
    if (!customerMarkersRef.current || !mapRef.current) return;
    
    customerMarkersRef.current.clearLayers();
    
    if (!showCustomers) return;

    filteredCustomers.forEach(customer => {
      const lat = parseFloat(customer.latitude!);
      const lng = parseFloat(customer.longitude!);
      if (isNaN(lat) || isNaN(lng)) return;

      const icon = getBusinessIcon(customer.businessType || '');
      const color = getCustomerMarkerColor(customer.status);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'customer-marker',
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
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              <span style="transform: rotate(45deg); font-size: 14px;">${icon}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      });

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${icon} ${customer.shopName}</h4>
          <p style="margin: 4px 0;"><strong>مالک:</strong> ${customer.ownerName}</p>
          <p style="margin: 4px 0;"><strong>تلفن:</strong> ${customer.phone}</p>
          <p style="margin: 4px 0;"><strong>نوع صنف:</strong> ${customer.businessType || '-'}</p>
          <p style="margin: 4px 0;"><strong>وضعیت:</strong> ${customer.status}</p>
          <p style="margin: 4px 0;"><strong>سود ماهانه:</strong> ${(customer.monthlyProfit || 0).toLocaleString('fa-IR')} ریال</p>
        </div>
      `);

      customerMarkersRef.current!.addLayer(marker);
    });
  }, [filteredCustomers, showCustomers]);

  const updateBankingUnitMarkers = useCallback(() => {
    if (!bankingUnitMarkersRef.current || !mapRef.current) return;
    
    bankingUnitMarkersRef.current.clearLayers();
    
    if (!showBankingUnits) return;

    bankingUnits.forEach(unit => {
      if (!unit.latitude || !unit.longitude) return;
      const lat = parseFloat(unit.latitude);
      const lng = parseFloat(unit.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'banking-unit-marker',
          html: `
            <div style="
              background: #7c3aed;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              color: white;
              font-size: 18px;
            ">
              🏦
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      });

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">🏦 ${unit.name}</h4>
          <p style="margin: 4px 0;"><strong>نوع:</strong> ${unit.type}</p>
        </div>
      `);

      bankingUnitMarkersRef.current!.addLayer(marker);
    });
  }, [bankingUnits, showBankingUnits]);

  const updateTerritoryLayers = useCallback(() => {
    if (!territoryLayersRef.current || !mapRef.current) return;
    
    territoryLayersRef.current.clearLayers();
    
    if (!showTerritories) return;

    territories.forEach((territory, index) => {
      if (!territory.geometry) return;

      try {
        const geoJsonLayer = L.geoJSON(territory.geometry as any, {
          style: {
            color: territory.color || TERRITORY_COLORS[index % TERRITORY_COLORS.length],
            fillColor: territory.color || TERRITORY_COLORS[index % TERRITORY_COLORS.length],
            fillOpacity: 0.15,
            weight: 2
          }
        });

        const customersInTerritory = filteredCustomers.filter(customer => {
          const lat = parseFloat(customer.latitude!);
          const lng = parseFloat(customer.longitude!);
          if (territory.bbox) {
            const [minLng, minLat, maxLng, maxLat] = territory.bbox;
            return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
          }
          return false;
        });

        const totalRevenue = customersInTerritory.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);

        geoJsonLayer.bindPopup(`
          <div style="direction: rtl; text-align: right; min-width: 180px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; color: ${territory.color};">📍 ${territory.name}</h4>
            <p style="margin: 4px 0;"><strong>تعداد مشتری:</strong> ${customersInTerritory.length}</p>
            <p style="margin: 4px 0;"><strong>درآمد کل:</strong> ${(totalRevenue / 1000000).toFixed(1)}M ریال</p>
            ${territory.businessFocus ? `<p style="margin: 4px 0;"><strong>تمرکز صنفی:</strong> ${territory.businessFocus}</p>` : ''}
          </div>
        `);

        territoryLayersRef.current!.addLayer(geoJsonLayer);
      } catch (err) {
        console.error('Error rendering territory:', err);
      }
    });
  }, [territories, showTerritories, filteredCustomers]);

  const updateClusterLayers = useCallback(() => {
    if (!clusterLayersRef.current || !mapRef.current) return;
    
    clusterLayersRef.current.clearLayers();
    
    if (!showClusters || !clusterData?.clusters) return;

    clusterData.clusters.forEach((cluster, index) => {
      const [lat, lng] = cluster.centroid;
      const color = CLUSTER_COLORS[index % CLUSTER_COLORS.length];
      
      const circle = L.circle([lat, lng], {
        radius: Math.max(500, Math.sqrt(cluster.customerCount) * 200),
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2
      });

      circle.bindPopup(`
        <div style="direction: rtl; text-align: right; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold; color: ${color};">خوشه ${index + 1}</h4>
          <p style="margin: 4px 0;"><strong>تعداد مشتری:</strong> ${cluster.customerCount}</p>
          <p style="margin: 4px 0;"><strong>درآمد کل:</strong> ${(cluster.totalRevenue / 1000000).toFixed(1)}M ریال</p>
          <p style="margin: 4px 0;"><strong>میانگین درآمد:</strong> ${(cluster.avgRevenue / 1000000).toFixed(2)}M ریال</p>
          <p style="margin: 4px 0;"><strong>پتانسیل:</strong> 
            <span style="color: ${cluster.potential === 'high' ? '#22c55e' : cluster.potential === 'medium' ? '#f59e0b' : '#ef4444'};">
              ${cluster.potential === 'high' ? 'بالا' : cluster.potential === 'medium' ? 'متوسط' : 'پایین'}
            </span>
          </p>
        </div>
      `);

      clusterLayersRef.current!.addLayer(circle);

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'cluster-center',
          html: `
            <div style="
              background: ${color};
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">${index + 1}</div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      });

      clusterLayersRef.current!.addLayer(marker);
    });
  }, [clusterData, showClusters]);

  useEffect(() => {
    if (isMapReady) {
      updateCustomerMarkers();
    }
  }, [isMapReady, updateCustomerMarkers]);

  useEffect(() => {
    if (isMapReady) {
      updateBankingUnitMarkers();
    }
  }, [isMapReady, updateBankingUnitMarkers]);

  useEffect(() => {
    if (isMapReady) {
      updateTerritoryLayers();
    }
  }, [isMapReady, updateTerritoryLayers]);

  useEffect(() => {
    if (isMapReady) {
      updateClusterLayers();
    }
  }, [isMapReady, updateClusterLayers]);

  const handleSaveTerritory = () => {
    if (!pendingGeometry || !newTerritoryName.trim()) {
      toast({ title: 'لطفاً نام منطقه را وارد کنید', variant: 'destructive' });
      return;
    }

    createTerritoryMutation.mutate({
      name: newTerritoryName.trim(),
      color: newTerritoryColor,
      geometry: pendingGeometry.geometry,
      bbox: pendingGeometry.bbox,
      isActive: true,
      autoNamed: false
    });
  };

  const handleDeleteTerritory = (id: string) => {
    if (confirm('آیا از حذف این منطقه اطمینان دارید؟')) {
      deleteTerritoryMutation.mutate(id);
    }
  };

  const stats = useMemo(() => {
    const total = validCustomers.length;
    const active = validCustomers.filter(c => c.status === 'active').length;
    const totalRevenue = validCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
    const avgRevenue = total > 0 ? totalRevenue / total : 0;

    return { total, active, totalRevenue, avgRevenue };
  }, [validCustomers]);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background" dir="rtl">
      <div
        className={`${sidebarCollapsed ? 'w-12' : 'w-80'} border-l transition-all duration-300 flex flex-col bg-card`}
      >
        <div className="p-3 border-b flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <h2 className="font-semibold text-sm">مدیریت مناطق</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-2">
                  <div className="text-xs text-muted-foreground">کل مشتریان</div>
                  <div className="text-lg font-bold">{stats.total.toLocaleString('fa-IR')}</div>
                </Card>
                <Card className="p-2">
                  <div className="text-xs text-muted-foreground">فعال</div>
                  <div className="text-lg font-bold text-green-600">{stats.active.toLocaleString('fa-IR')}</div>
                </Card>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview" className="text-xs">نمای کلی</TabsTrigger>
                  <TabsTrigger value="territories" className="text-xs">مناطق</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs">تحلیل</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs">لایه‌های نقشه</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">مشتریان</span>
                        <Switch
                          checked={showCustomers}
                          onCheckedChange={setShowCustomers}
                          data-testid="switch-customers"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">واحدهای بانکی</span>
                        <Switch
                          checked={showBankingUnits}
                          onCheckedChange={setShowBankingUnits}
                          data-testid="switch-banking-units"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">مناطق</span>
                        <Switch
                          checked={showTerritories}
                          onCheckedChange={setShowTerritories}
                          data-testid="switch-territories"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">خوشه‌ها</span>
                        <Switch
                          checked={showClusters}
                          onCheckedChange={setShowClusters}
                          data-testid="switch-clusters"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs">فیلترها</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="وضعیت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="normal">عادی</SelectItem>
                        <SelectItem value="marketing">بازاریابی</SelectItem>
                        <SelectItem value="collected">جمع‌آوری شده</SelectItem>
                        <SelectItem value="loss">زیان‌ده</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="نوع صنف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه صنوف</SelectItem>
                        {businessTypes.slice(0, 20).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={bankingUnitFilter} onValueChange={setBankingUnitFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="واحد بانکی" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه واحدها</SelectItem>
                        {bankingUnits.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    نمایش {filteredCustomers.length.toLocaleString('fa-IR')} از {validCustomers.length.toLocaleString('fa-IR')} مشتری
                  </div>
                </TabsContent>

                <TabsContent value="territories" className="space-y-3 mt-3">
                  <Alert>
                    <AlertDescription className="text-xs">
                      برای رسم منطقه جدید از ابزارهای سمت چپ نقشه استفاده کنید
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    {territories.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        هنوز منطقه‌ای ایجاد نشده است
                      </p>
                    ) : (
                      territories.map((territory, index) => {
                        const customersInTerritory = filteredCustomers.filter(customer => {
                          const lat = parseFloat(customer.latitude!);
                          const lng = parseFloat(customer.longitude!);
                          if (territory.bbox) {
                            const [minLng, minLat, maxLng, maxLat] = territory.bbox;
                            return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
                          }
                          return false;
                        });

                        return (
                          <Card key={territory.id} className="p-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: territory.color }}
                                  />
                                  <span className="font-medium text-sm">{territory.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {customersInTerritory.length} مشتری
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteTerritory(territory.id)}
                                data-testid={`button-delete-territory-${territory.id}`}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs">تعداد خوشه‌ها</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[clusterCount]}
                        onValueChange={([v]) => setClusterCount(v)}
                        min={2}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-6">{clusterCount}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => refetchClusters()}
                    disabled={clustersLoading}
                    data-testid="button-analyze-clusters"
                  >
                    {clustersLoading ? (
                      <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 ml-2" />
                    )}
                    تحلیل خوشه‌بندی
                  </Button>

                  {clusterData?.metrics && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>مناطق پرپتانسیل</span>
                        <Badge variant="default">{clusterData.metrics.highPotentialAreas}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>مناطق کم‌پتانسیل</span>
                        <Badge variant="secondary">{clusterData.metrics.lowPotentialAreas}</Badge>
                      </div>
                    </div>
                  )}

                  {showClusters && clusterData?.clusters && (
                    <div className="space-y-2">
                      <Label className="text-xs">خوشه‌های شناسایی‌شده</Label>
                      {clusterData.clusters.map((cluster, index) => (
                        <Card key={cluster.id} className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: CLUSTER_COLORS[index % CLUSTER_COLORS.length] }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{cluster.customerCount} مشتری</div>
                              <div className="text-xs text-muted-foreground">
                                {(cluster.totalRevenue / 1000000).toFixed(1)}M ریال
                              </div>
                            </div>
                            <Badge
                              variant={cluster.potential === 'high' ? 'default' : cluster.potential === 'medium' ? 'secondary' : 'outline'}
                            >
                              {cluster.potential === 'high' ? 'بالا' : cluster.potential === 'medium' ? 'متوسط' : 'پایین'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="flex-1 relative">
        <div
          ref={mapContainerRef}
          className="absolute inset-0"
          data-testid="region-map"
        />

        {customersLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
            <Badge variant="secondary" className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 animate-spin" />
              در حال بارگذاری...
            </Badge>
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-[1000]">
          <Card className="p-2">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>فعال</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>عادی</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>زیان‌ده</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-600" />
                <span>واحد بانکی</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showTerritoryDialog} onOpenChange={setShowTerritoryDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ایجاد منطقه جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نام منطقه</Label>
              <Input
                value={newTerritoryName}
                onChange={(e) => setNewTerritoryName(e.target.value)}
                placeholder="نام منطقه را وارد کنید"
                data-testid="input-territory-name"
              />
            </div>
            <div className="space-y-2">
              <Label>رنگ منطقه</Label>
              <div className="flex gap-2 flex-wrap">
                {TERRITORY_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${newTerritoryColor === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTerritoryColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTerritoryDialog(false);
                setPendingGeometry(null);
              }}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveTerritory}
              disabled={createTerritoryMutation.isPending}
              data-testid="button-save-territory"
            >
              {createTerritoryMutation.isPending ? (
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 ml-2" />
              )}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
