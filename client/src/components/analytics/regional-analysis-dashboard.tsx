import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Target, TrendingUp, AlertTriangle, Users, Building2, Zap, Search, Plus, Layers, Info, CheckCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { initializeMap, type MapInstance } from '@/lib/map-utils';
import { TerritoryManagement } from '@/components/territories/territory-management';

interface VirginRegion {
  id: string;
  bounds: GeoJSON.Polygon;
  center: [number, number];
  area: number;
  nearestCustomers: any[];
  distanceToNearestCustomer: number;
  potentialValue: number;
  businessDensity: number;
  priority: 'high' | 'medium' | 'low';
  recommendedActions: string[];
}

interface AutoZoneConfig {
  gridSize: number;
  customerRadius: number;
  minCustomersPerZone: number;
  maxZonesPerUnit: number;
}

interface AutoZone {
  id: string;
  geometry: GeoJSON.Polygon;
  customersCount: number;
  bankingUnitId?: string;
  totalRevenue: number;
  businessTypes: Record<string, number>;
  centerPoint: [number, number];
  name: string;
}

interface RegionalAnalysisDashboardProps {
  className?: string;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to check if point is in polygon (simple algorithm)
function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  const x = lng, y = lat;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Helper function to create convex hull (simplified)
function createConvexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) {
    // For less than 3 points, create a buffer area
    const center = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
    center[0] /= points.length;
    center[1] /= points.length;
    
    const radius = 0.005; // ~500m buffer
    const circlePoints: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      circlePoints.push([
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle)
      ]);
    }
    return circlePoints;
  }
  
  // Simple convex hull for 3+ points (gift wrapping algorithm)
  const hull: [number, number][] = [];
  let leftmost = 0;
  
  for (let i = 1; i < points.length; i++) {
    if (points[i][1] < points[leftmost][1]) leftmost = i;
  }
  
  let p = leftmost;
  do {
    hull.push(points[p]);
    let q = (p + 1) % points.length;
    
    for (let i = 0; i < points.length; i++) {
      const orientation = (points[q][0] - points[p][0]) * (points[i][1] - points[p][1]) - 
                         (points[q][1] - points[p][1]) * (points[i][0] - points[p][0]);
      if (orientation > 0) q = i;
    }
    
    p = q;
  } while (p !== leftmost && hull.length < points.length);
  
  return hull;
}

export function RegionalAnalysisDashboard({ className }: RegionalAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('territories');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [virginRegions, setVirginRegions] = useState<VirginRegion[]>([]);
  const [autoZones, setAutoZones] = useState<AutoZone[]>([]);
  const [autoZoneConfig, setAutoZoneConfig] = useState<AutoZoneConfig>({
    gridSize: 1000, // meters
    customerRadius: 500, // meters  
    minCustomersPerZone: 3,
    maxZonesPerUnit: 10
  });
  const [selectedVirginRegion, setSelectedVirginRegion] = useState<VirginRegion | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fetch data
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  const { data: territories = [] } = useQuery<any[]>({
    queryKey: ['/api/territories'],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ['/api/banking-units'],
  });

  // Initialize map
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (activeTab !== 'analysis') {
        return;
      }

      // Wait for DOM to render the tab content
      await new Promise(resolve => setTimeout(resolve, 100));

      if (mapRef.current && !mapInstanceRef.current && mounted) {
        try {
          mapInstanceRef.current = await initializeMap(mapRef.current);
          if (mounted && mapInstanceRef.current?.map) {
            setMapReady(true);
          }
        } catch (error) {
          console.error('Failed to initialize regional analysis map:', error);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current && mapInstanceRef.current.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, [activeTab]);

  // Virgin regions analysis
  const analyzeVirginRegions = async () => {
    setIsAnalyzing(true);
    
    try {
      // Create comprehensive grid covering Tabriz metropolitan area
      const tabrizBounds = {
        north: 38.1500,
        south: 38.0000,
        east: 46.3500,
        west: 46.2000
      };

      const gridSpacing = 0.01; // ~1km spacing
      const virginRegions: VirginRegion[] = [];

      for (let lat = tabrizBounds.south; lat < tabrizBounds.north; lat += gridSpacing) {
        for (let lng = tabrizBounds.west; lng < tabrizBounds.east; lng += gridSpacing) {
          // Check if any customers are in this grid cell
          const customersInCell = customers.filter(customer => {
            if (!customer.location) return false;
            // Simple point-in-polygon check for rectangular grid
            return customer.location.lng >= lng && customer.location.lng <= lng + gridSpacing &&
                   customer.location.lat >= lat && customer.location.lat <= lat + gridSpacing;
          });

          // If no customers, it's a virgin region
          if (customersInCell.length === 0) {
            const center: [number, number] = [lat + gridSpacing/2, lng + gridSpacing/2];
            const nearestCustomers = customers
              .map(c => {
                if (!c.location) return null;
                const distance = calculateDistance(
                  center[0], center[1],
                  c.location.lat, c.location.lng
                );
                return { ...c, distance };
              })
              .filter(Boolean)
              .sort((a, b) => a!.distance - b!.distance)
              .slice(0, 5);

            const distanceToNearest = nearestCustomers[0]?.distance || 0;
            
            // Calculate business density in surrounding area (2km radius)
            const surroundingCustomers = customers.filter(c => {
              if (!c.location) return false;
              const distance = calculateDistance(
                center[0], center[1],
                c.location.lat, c.location.lng
              );
              return distance <= 2;
            });

            const businessDensity = surroundingCustomers.length;
            
            // Calculate potential value based on nearby business activity
            const potentialValue = surroundingCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0) / Math.max(1, distanceToNearest);

            // Determine priority
            let priority: 'high' | 'medium' | 'low' = 'low';
            if (businessDensity >= 5 && distanceToNearest <= 1) priority = 'high';
            else if (businessDensity >= 2 && distanceToNearest <= 2) priority = 'medium';

            // Recommendations
            const recommendedActions = [];
            if (priority === 'high') {
              recommendedActions.push('فوری: شناسایی کسب‌وکارهای بالقوه');
              recommendedActions.push('اعزام تیم بازاریابی');
              recommendedActions.push('ارائه پکیج‌های ویژه');
            } else if (priority === 'medium') {
              recommendedActions.push('بررسی دقیق‌تر منطقه');
              recommendedActions.push('تحلیل رقابت محلی');
            } else {
              recommendedActions.push('نظارت دوره‌ای');
              recommendedActions.push('ارزیابی آینده‌نگرانه');
            }

            const polygon: GeoJSON.Polygon = {
              type: 'Polygon',
              coordinates: [[
                [lng, lat],
                [lng + gridSpacing, lat],
                [lng + gridSpacing, lat + gridSpacing],
                [lng, lat + gridSpacing],
                [lng, lat]
              ]]
            };

            virginRegions.push({
              id: `virgin-${lat.toFixed(4)}-${lng.toFixed(4)}`,
              bounds: polygon,
              center,
              area: gridSpacing * gridSpacing * 111000 * 111000, // rough area in m²
              nearestCustomers,
              distanceToNearestCustomer: distanceToNearest,
              potentialValue,
              businessDensity,
              priority,
              recommendedActions
            });
          }
        }
      }

      // Sort by priority and potential value
      virginRegions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] - priorityOrder[a.priority]) || 
               (b.potentialValue - a.potentialValue);
      });

      setVirginRegions(virginRegions.slice(0, 20)); // Top 20 virgin regions
      
    } catch (error) {
      console.error('Virgin regions analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-zone creation
  const createAutoZones = async () => {
    setIsAnalyzing(true);
    
    try {
      const zones: AutoZone[] = [];
      const processedCustomers = new Set();

      // Group customers by proximity using clustering algorithm
      for (const customer of customers) {
        if (!customer.location || processedCustomers.has(customer.id)) continue;

        const nearbyCustomers = customers.filter(c => {
          if (!c.location || c.id === customer.id || processedCustomers.has(c.id)) return false;
          
          const distance = calculateDistance(
            customer.location.lat, customer.location.lng,
            c.location.lat, c.location.lng
          ) * 1000; // Convert to meters
          
          return distance <= autoZoneConfig.customerRadius;
        });

        nearbyCustomers.push(customer);

        if (nearbyCustomers.length >= autoZoneConfig.minCustomersPerZone) {
          // Create convex hull around customers
          const points: [number, number][] = nearbyCustomers.map(c => 
            [c.location.lat, c.location.lng]
          );
          
          const hull = createConvexHull(points);
          
          // Convert hull to GeoJSON polygon
          const coordinates = hull.map(p => [p[1], p[0]]); // Convert lat,lng to lng,lat
          coordinates.push(coordinates[0]); // Close polygon
          
          const zoneGeometry: GeoJSON.Polygon = {
            type: 'Polygon',
            coordinates: [coordinates]
          };

          const totalRevenue = nearbyCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
          const businessTypes = nearbyCustomers.reduce((acc, c) => {
            acc[c.businessType] = (acc[c.businessType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // Calculate center point
          const centerLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
          const centerLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;
          const centerPoint: [number, number] = [centerLat, centerLng];
          
          const dominantBusinessType = Object.entries(businessTypes)
            .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'متفرقه';

          zones.push({
            id: `auto-zone-${zones.length + 1}`,
            geometry: zoneGeometry,
            customersCount: nearbyCustomers.length,
            totalRevenue,
            businessTypes,
            centerPoint,
            name: `منطقه ${dominantBusinessType} #${zones.length + 1}`
          });

          // Mark customers as processed
          nearbyCustomers.forEach(c => processedCustomers.add(c.id));
        }
      }

      setAutoZones(zones);

    } catch (error) {
      console.error('Auto-zone creation failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Distribution analysis
  const analyzeCustomerDistribution = () => {
    const analysis = {
      totalCustomers: customers.length,
      coveredAreas: territories.length,
      virginRegionsCount: virginRegions.length,
      autoZonesCount: autoZones.length,
      distributionScore: 0,
      coverage: {
        covered: 0,
        uncovered: 0
      },
      recommendations: [] as string[]
    };

    // Calculate coverage score (simplified)
    const customersInTerritories = customers.filter(customer => {
      if (!customer.location) return false;
      return territories.some(territory => {
        // Simple check if customer is within territory bounds
        if (!territory.geometry || territory.geometry.type !== 'Polygon') return false;
        const coords = territory.geometry.coordinates[0];
        return pointInPolygon(customer.location.lat, customer.location.lng, coords);
      });
    });

    analysis.coverage.covered = customersInTerritories.length;
    analysis.coverage.uncovered = customers.length - customersInTerritories.length;
    analysis.distributionScore = customers.length > 0 ? Math.round((analysis.coverage.covered / customers.length) * 100) : 0;

    // Generate recommendations
    if (analysis.distributionScore < 60) {
      analysis.recommendations.push('🚨 پوشش ناکافی - نیاز به تعریف مناطق بیشتر');
    }
    if (virginRegions.filter(r => r.priority === 'high').length > 5) {
      analysis.recommendations.push('⭐ مناطق بکر اولویت‌دار شناسایی شد');
    }
    if (autoZones.length > territories.length) {
      analysis.recommendations.push('🎯 پیشنهاد استفاده از منطقه‌بندی خودکار');
    }

    setAnalysisResults(analysis);
  };

  // Auto assign zones to banking units
  const assignZonesToUnits = useMutation({
    mutationFn: async () => {
      const assignments = [];
      
      for (const zone of autoZones) {
        if (!zone.bankingUnitId) {
          // Find best banking unit based on capacity
          const zonesPerUnit = autoZones.reduce((acc, z) => {
            if (z.bankingUnitId) {
              acc[z.bankingUnitId] = (acc[z.bankingUnitId] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
          
          const bestUnit = bankingUnits.find(unit => 
            (zonesPerUnit[unit.id] || 0) < autoZoneConfig.maxZonesPerUnit
          );
          
          if (bestUnit) {
            assignments.push({
              zoneId: zone.id,
              bankingUnitId: bestUnit.id,
              geometry: zone.geometry,
              name: zone.name
            });
          }
        }
      }

      return assignments;
    },
    onSuccess: (assignments) => {
      // Update auto zones with assignments
      setAutoZones(prev => prev.map(zone => {
        const assignment = assignments.find(a => a.zoneId === zone.id);
        return assignment ? { ...zone, bankingUnitId: assignment.bankingUnitId } : zone;
      }));
    }
  });

  useEffect(() => {
    if (customers.length > 0) {
      analyzeCustomerDistribution();
    }
  }, [customers, territories, virginRegions, autoZones]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold">🗺️ تحلیل منطقه‌ای جامع</h3>
        <p className="text-muted-foreground">مدیریت مناطق، شناسایی مناطق بکر و منطقه‌بندی هوشمند</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="territories" data-testid="tab-territories">
            <Layers className="w-4 h-4 mr-2" />
            مدیریت مناطق
          </TabsTrigger>
          <TabsTrigger value="virgin" data-testid="tab-virgin">
            <Search className="w-4 h-4 mr-2" />
            مناطق بکر
          </TabsTrigger>
          <TabsTrigger value="auto-zones" data-testid="tab-auto-zones">
            <Zap className="w-4 h-4 mr-2" />
            منطقه‌بندی خودکار
          </TabsTrigger>
          <TabsTrigger value="analysis" data-testid="tab-analysis">
            <TrendingUp className="w-4 h-4 mr-2" />
            تحلیل توزیع
          </TabsTrigger>
        </TabsList>

        {/* Territory Management Tab */}
        <TabsContent value="territories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                مدیریت مناطق با رسم منحنی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TerritoryManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Virgin Regions Tab */}
        <TabsContent value="virgin" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">🔍 شناسایی مناطق بکر</h4>
              <p className="text-sm text-muted-foreground">مناطقی که هیچ مشتری ندارند</p>
            </div>
            <Button 
              onClick={analyzeVirginRegions} 
              disabled={isAnalyzing}
              data-testid="button-analyze-virgin"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full" />
                  در حال تحلیل...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  تحلیل مناطق بکر
                </>
              )}
            </Button>
          </div>

          {virginRegions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {virginRegions.slice(0, 9).map((region) => (
                <Card 
                  key={region.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    region.priority === 'high' ? 'border-red-300 bg-red-50' :
                    region.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                    'border-gray-300 bg-gray-50'
                  }`}
                  onClick={() => setSelectedVirginRegion(region)}
                  data-testid={`virgin-region-${region.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">منطقه بکر</CardTitle>
                      <Badge variant={
                        region.priority === 'high' ? 'destructive' :
                        region.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {region.priority === 'high' ? 'اولویت بالا' :
                         region.priority === 'medium' ? 'اولویت متوسط' : 'اولویت پایین'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">تراکم اطراف:</span>
                        <p className="font-semibold">{region.businessDensity} کسب‌وکار</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">فاصله:</span>
                        <p className="font-semibold">{region.distanceToNearestCustomer.toFixed(1)} کیلومتر</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">پتانسیل ارزش:</span>
                      <Progress 
                        value={Math.min(100, (region.potentialValue / 10000) * 100)} 
                        className="h-2 mt-1"
                      />
                    </div>
                    <div className="space-y-1">
                      {region.recommendedActions.slice(0, 2).map((action, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">• {action}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Auto Zones Tab */}
        <TabsContent value="auto-zones" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">⚡ منطقه‌بندی خودکار</h4>
              <p className="text-sm text-muted-foreground">تقسیم‌بندی هوشمند بر اساس تراکم مشتریان</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={createAutoZones} 
                disabled={isAnalyzing}
                data-testid="button-create-auto-zones"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full" />
                    در حال تولید...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    تولید مناطق خودکار
                  </>
                )}
              </Button>
              {autoZones.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => assignZonesToUnits.mutate()}
                  disabled={assignZonesToUnits.isPending}
                  data-testid="button-assign-zones"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  تخصیص به واحدها
                </Button>
              )}
            </div>
          </div>

          {/* Auto Zone Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">⚙️ تنظیمات منطقه‌بندی</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">شعاع (متر)</label>
                <Select 
                  value={autoZoneConfig.customerRadius.toString()} 
                  onValueChange={(v) => setAutoZoneConfig(prev => ({...prev, customerRadius: parseInt(v)}))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="750">750</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">حداقل مشتری</label>
                <Select 
                  value={autoZoneConfig.minCustomersPerZone.toString()} 
                  onValueChange={(v) => setAutoZoneConfig(prev => ({...prev, minCustomersPerZone: parseInt(v)}))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Auto Zones List */}
          {autoZones.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {autoZones.map((zone) => (
                <Card key={zone.id} data-testid={`auto-zone-${zone.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{zone.name}</CardTitle>
                      {zone.bankingUnitId && (
                        <Badge variant="outline">
                          {bankingUnits.find(u => u.id === zone.bankingUnitId)?.name || 'تخصیص‌یافته'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">مشتریان:</span>
                        <p className="font-semibold">{zone.customersCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">درآمد:</span>
                        <p className="font-semibold">{Math.round(zone.totalRevenue / 1000000)}M</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">انواع کسب‌وکار:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(zone.businessTypes).slice(0, 3).map(([type, count]) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Distribution Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Analysis Results */}
            {analysisResults && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    تحلیل توزیع مشتریان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600" data-testid="total-customers-analysis">
                        {analysisResults.totalCustomers}
                      </p>
                      <p className="text-xs text-muted-foreground">کل مشتریان</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600" data-testid="covered-areas">
                        {analysisResults.coveredAreas}
                      </p>
                      <p className="text-xs text-muted-foreground">مناطق تعریف‌شده</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600" data-testid="virgin-regions-count">
                        {analysisResults.virginRegionsCount}
                      </p>
                      <p className="text-xs text-muted-foreground">مناطق بکر</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600" data-testid="distribution-score">
                        {analysisResults.distributionScore}%
                      </p>
                      <p className="text-xs text-muted-foreground">امتیاز پوشش</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-2">📊 پوشش مناطق</h5>
                    <Progress value={analysisResults.distributionScore} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>پوشش‌دارده: {analysisResults.coverage.covered}</span>
                      <span>بدون پوشش: {analysisResults.coverage.uncovered}</span>
                    </div>
                  </div>

                  {analysisResults.recommendations.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2">💡 پیشنهادات</h5>
                      <div className="space-y-2">
                        {analysisResults.recommendations.map((rec: string, idx: number) => (
                          <Alert key={idx}>
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🚀 اقدامات سریع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={analyzeVirginRegions}
                  disabled={isAnalyzing}
                  data-testid="quick-analyze-virgin"
                >
                  <Search className="w-4 h-4 mr-2" />
                  شناسایی مناطق بکر
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={createAutoZones}
                  disabled={isAnalyzing}
                  data-testid="quick-create-zones"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  منطقه‌بندی خودکار
                </Button>
                {autoZones.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => assignZonesToUnits.mutate()}
                    disabled={assignZonesToUnits.isPending}
                    data-testid="quick-assign-zones"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    تخصیص به واحدها
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                نقشه تحلیل منطقه‌ای
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapRef} 
                className="w-full h-[500px] rounded-lg border"
                data-testid="analysis-map"
              />
              {!mapReady && (
                <div className="w-full h-[500px] rounded-lg border flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">در حال بارگیری نقشه...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}