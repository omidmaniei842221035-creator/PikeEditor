import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  MapPin,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Layers,
  Radar,
  CircleDot,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  AIGeoClustering,
  AIRegionalForecasting,
  RadiusCoverageAnalysis,
  performFullGeoAnalysis,
  type GeoCluster,
  type RegionalForecast,
  type ServiceCoverageResult,
  type CustomerLocation,
  type BranchLocation
} from '@/lib/ai-geo-clustering';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AIGeoAnalysisDashboardProps {
  className?: string;
}

export function AIGeoAnalysisDashboard({ className }: AIGeoAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('clustering');
  const [clusterCount, setClusterCount] = useState(5);
  const [coverageRadius, setCoverageRadius] = useState(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    clusters: GeoCluster[];
    forecasts: RegionalForecast[];
    coverage: ServiceCoverageResult;
    expansionSuggestions: ReturnType<AIRegionalForecasting['suggestExpansionAreas']>;
  } | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Fetch customers
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });

  // Fetch branches
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['/api/branches']
  });

  // Fetch banking units
  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ['/api/banking-units']
  });

  // Prepare data for analysis
  const customerLocations: CustomerLocation[] = useMemo(() => {
    return customers
      .filter((c: any) => c.latitude && c.longitude)
      .map((c: any) => ({
        id: c.id,
        shopName: c.shopName,
        latitude: parseFloat(c.latitude),
        longitude: parseFloat(c.longitude),
        monthlyProfit: c.monthlyProfit || 0,
        businessType: c.businessType || 'سایر',
        status: c.status || 'active',
        createdAt: c.createdAt,
        bankingUnitId: c.bankingUnitId
      }));
  }, [customers]);

  const servicePoints: BranchLocation[] = useMemo(() => {
    const branchPoints = branches.map((b: any) => ({
      id: b.id,
      name: b.name,
      latitude: parseFloat(b.latitude || '0'),
      longitude: parseFloat(b.longitude || '0'),
      type: 'branch' as const
    })).filter((b: any) => b.latitude && b.longitude);

    const unitPoints = bankingUnits.map((u: any) => ({
      id: u.id,
      name: u.name,
      latitude: parseFloat(u.latitude || '0'),
      longitude: parseFloat(u.longitude || '0'),
      type: 'bankingUnit' as const
    })).filter((u: any) => u.latitude && u.longitude);

    return [...branchPoints, ...unitPoints];
  }, [branches, bankingUnits]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [38.0962, 46.2738],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Run analysis
  const runAnalysis = () => {
    if (customerLocations.length === 0) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const result = performFullGeoAnalysis(customerLocations, servicePoints, {
        clusterCount,
        coverageRadius,
        h3Resolution: 8
      });
      
      setAnalysisResult(result);
      setIsAnalyzing(false);
      
      // Update map visualization
      updateMapVisualization(result);
    }, 500);
  };

  // Update map based on active tab and results
  const updateMapVisualization = (result: typeof analysisResult) => {
    if (!mapRef.current || !layerGroupRef.current || !result) return;

    layerGroupRef.current.clearLayers();

    if (activeTab === 'clustering') {
      visualizeClusters(result.clusters);
    } else if (activeTab === 'forecasting') {
      visualizeForecasts(result.forecasts);
    } else if (activeTab === 'radius') {
      visualizeCoverage(result.coverage);
    }
  };

  // Visualize clusters on map
  const visualizeClusters = (clusters: GeoCluster[]) => {
    if (!layerGroupRef.current) return;

    clusters.forEach(cluster => {
      // Draw cluster area
      const circle = L.circle([cluster.centroid[0], cluster.centroid[1]], {
        radius: cluster.radius * 1000,
        color: cluster.color,
        fillColor: cluster.color,
        fillOpacity: 0.15,
        weight: 2
      });
      
      circle.bindPopup(`
        <div dir="rtl" style="font-family: Vazirmatn, sans-serif; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">خوشه ${cluster.id.replace('cluster-', '')}</h4>
          <p style="margin: 4px 0;"><strong>تعداد مشتری:</strong> ${cluster.customerCount}</p>
          <p style="margin: 4px 0;"><strong>درآمد کل:</strong> ${(cluster.totalRevenue / 1000000).toFixed(0)} میلیون</p>
          <p style="margin: 4px 0;"><strong>تراکم:</strong> ${cluster.density.toFixed(1)} مشتری/کیلومتر²</p>
          <p style="margin: 4px 0;"><strong>پتانسیل:</strong> 
            <span style="color: ${cluster.potential === 'high' ? '#22c55e' : cluster.potential === 'medium' ? '#eab308' : '#ef4444'}">
              ${cluster.potential === 'high' ? 'بالا' : cluster.potential === 'medium' ? 'متوسط' : 'پایین'}
            </span>
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">${cluster.characteristics.join(' • ')}</p>
        </div>
      `);
      
      layerGroupRef.current!.addLayer(circle);

      // Draw centroid marker
      const marker = L.circleMarker([cluster.centroid[0], cluster.centroid[1]], {
        radius: 10,
        color: cluster.color,
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 3
      });
      
      layerGroupRef.current!.addLayer(marker);

      // Add customer markers
      cluster.customers.forEach(customer => {
        const customerMarker = L.circleMarker([customer.latitude, customer.longitude], {
          radius: 5,
          color: cluster.color,
          fillColor: cluster.color,
          fillOpacity: 0.7,
          weight: 1
        });
        
        customerMarker.bindTooltip(customer.shopName, { direction: 'top' });
        layerGroupRef.current!.addLayer(customerMarker);
      });
    });
  };

  // Visualize forecasts on map
  const visualizeForecasts = (forecasts: RegionalForecast[]) => {
    if (!layerGroupRef.current) return;

    forecasts.forEach(forecast => {
      const color = forecast.trend === 'surge' ? '#22c55e' :
                   forecast.trend === 'growing' ? '#3b82f6' :
                   forecast.trend === 'declining' ? '#ef4444' : '#6b7280';

      const circle = L.circle([forecast.center[0], forecast.center[1]], {
        radius: 1000,
        color,
        fillColor: color,
        fillOpacity: 0.3,
        weight: 2
      });

      const trendIcon = forecast.trend === 'surge' ? '🚀' :
                       forecast.trend === 'growing' ? '📈' :
                       forecast.trend === 'declining' ? '📉' : '➡️';

      circle.bindPopup(`
        <div dir="rtl" style="font-family: Vazirmatn, sans-serif; min-width: 220px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${forecast.regionName} ${trendIcon}</h4>
          <p style="margin: 4px 0;"><strong>مشتریان فعلی:</strong> ${forecast.currentCustomers}</p>
          <p style="margin: 4px 0;"><strong>پیش‌بینی:</strong> ${forecast.predictedCustomers}</p>
          <p style="margin: 4px 0;"><strong>نرخ رشد:</strong> 
            <span style="color: ${forecast.growthRate > 0 ? '#22c55e' : '#ef4444'}">
              ${forecast.growthRate > 0 ? '+' : ''}${forecast.growthRate}%
            </span>
          </p>
          <p style="margin: 4px 0;"><strong>امتیاز توسعه:</strong> ${forecast.expansionScore}/100</p>
          <p style="margin: 8px 0 4px 0; font-size: 12px; font-weight: bold;">بهترین ماه‌ها:</p>
          <p style="margin: 0; font-size: 12px; color: #666;">${forecast.bestMonthsForExpansion.join('، ')}</p>
        </div>
      `);

      layerGroupRef.current!.addLayer(circle);
    });
  };

  // Visualize coverage on map
  const visualizeCoverage = (coverage: ServiceCoverageResult) => {
    if (!layerGroupRef.current) return;

    // Draw service point coverage circles
    servicePoints.forEach(sp => {
      const circle = L.circle([sp.latitude, sp.longitude], {
        radius: coverageRadius * 1000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5'
      });

      circle.bindPopup(`
        <div dir="rtl" style="font-family: Vazirmatn, sans-serif;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${sp.name}</h4>
          <p style="margin: 4px 0;"><strong>نوع:</strong> ${sp.type === 'branch' ? 'شعبه' : 'واحد بانکی'}</p>
          <p style="margin: 4px 0;"><strong>شعاع پوشش:</strong> ${coverageRadius} کیلومتر</p>
        </div>
      `);

      layerGroupRef.current!.addLayer(circle);

      // Service point marker
      const marker = L.marker([sp.latitude, sp.longitude], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${sp.type === 'branch' ? '🏦' : '🏢'}
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      });
      
      layerGroupRef.current!.addLayer(marker);
    });

    // Draw uncovered customers
    coverage.uncoveredCustomers.forEach(customer => {
      const marker = L.circleMarker([customer.latitude, customer.longitude], {
        radius: 6,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.8,
        weight: 2
      });

      marker.bindTooltip(`${customer.shopName} (بدون پوشش)`, { direction: 'top' });
      layerGroupRef.current!.addLayer(marker);
    });

    // Draw optimal new locations
    coverage.optimalLocations.forEach((loc, idx) => {
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background: ${loc.priority === 'high' ? '#22c55e' : loc.priority === 'medium' ? '#eab308' : '#6b7280'}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
            ⭐
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      });

      marker.bindPopup(`
        <div dir="rtl" style="font-family: Vazirmatn, sans-serif; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #22c55e;">📍 پیشنهاد شعبه جدید ${idx + 1}</h4>
          <p style="margin: 4px 0;"><strong>پوشش بالقوه:</strong> ${loc.potentialCoverage} مشتری</p>
          <p style="margin: 4px 0;"><strong>اولویت:</strong> 
            <span style="color: ${loc.priority === 'high' ? '#22c55e' : loc.priority === 'medium' ? '#eab308' : '#6b7280'}">
              ${loc.priority === 'high' ? 'بالا' : loc.priority === 'medium' ? 'متوسط' : 'پایین'}
            </span>
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">${loc.reason}</p>
        </div>
      `);

      layerGroupRef.current!.addLayer(marker);
    });
  };

  // Update visualization when tab changes
  useEffect(() => {
    if (analysisResult) {
      updateMapVisualization(analysisResult);
    }
  }, [activeTab, analysisResult]);

  // Update coverage visualization when radius changes
  useEffect(() => {
    if (analysisResult && activeTab === 'radius') {
      // Re-run analysis with new radius for coverage tab
      const newResult = performFullGeoAnalysis(customerLocations, servicePoints, {
        clusterCount,
        coverageRadius,
        h3Resolution: 8
      });
      setAnalysisResult(newResult);
    }
  }, [coverageRadius]);

  // Run initial analysis
  useEffect(() => {
    if (customerLocations.length > 0 && !analysisResult) {
      runAnalysis();
    }
  }, [customerLocations.length]);

  return (
    <div className={`space-y-4 ${className}`} data-testid="ai-geo-analysis-dashboard">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>تحلیل جغرافیایی هوشمند</CardTitle>
                <CardDescription>خوشه‌بندی، پیش‌بینی و تحلیل پوشش با هوش مصنوعی</CardDescription>
              </div>
            </div>
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing || customerLocations.length === 0}
              data-testid="run-analysis-button"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  در حال تحلیل...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  اجرای تحلیل
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clustering" className="flex items-center gap-2" data-testid="tab-clustering">
            <Layers className="h-4 w-4" />
            خوشه‌بندی AI
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="flex items-center gap-2" data-testid="tab-forecasting">
            <TrendingUp className="h-4 w-4" />
            پیش‌بینی منطقه‌ای
          </TabsTrigger>
          <TabsTrigger value="radius" className="flex items-center gap-2" data-testid="tab-radius">
            <Radar className="h-4 w-4" />
            شعاع دسترسی
          </TabsTrigger>
        </TabsList>

        {/* Clustering Tab */}
        <TabsContent value="clustering" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">تنظیمات خوشه‌بندی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">تعداد خوشه‌ها: {clusterCount}</label>
                  <Slider
                    value={[clusterCount]}
                    onValueChange={([v]) => setClusterCount(v)}
                    min={2}
                    max={10}
                    step={1}
                    className="mt-2"
                    data-testid="cluster-count-slider"
                  />
                </div>
                
                {analysisResult && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>کل مشتریان:</span>
                      <Badge variant="secondary">{customerLocations.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>خوشه‌های شناسایی‌شده:</span>
                      <Badge>{analysisResult.clusters.length}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clusters List */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  خوشه‌های شناسایی‌شده
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult?.clusters && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analysisResult.clusters.map((cluster, idx) => (
                      <div
                        key={cluster.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`cluster-item-${idx}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: cluster.color }}
                            />
                            <span className="font-medium">خوشه {idx + 1}</span>
                            <Badge variant={
                              cluster.potential === 'high' ? 'default' :
                              cluster.potential === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {cluster.potential === 'high' ? 'پتانسیل بالا' :
                               cluster.potential === 'medium' ? 'متوسط' : 'پایین'}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {cluster.customerCount} مشتری
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">درآمد:</span>
                            <span className="font-medium mr-1">
                              {(cluster.totalRevenue / 1000000).toFixed(0)}M
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">تراکم:</span>
                            <span className="font-medium mr-1">
                              {cluster.density.toFixed(1)}/km²
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">شعاع:</span>
                            <span className="font-medium mr-1">
                              {cluster.radius.toFixed(1)} km
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {cluster.characteristics.join(' • ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Expansion Suggestions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  پیشنهاد توسعه
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult?.expansionSuggestions && (
                  <div className="space-y-3">
                    {analysisResult.expansionSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/20"
                        data-testid={`expansion-suggestion-${idx}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{suggestion.area}</span>
                          <Badge className="bg-green-500">
                            {suggestion.score}/100
                          </Badge>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {suggestion.reasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forecasts List */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  پیش‌بینی مناطق
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult?.forecasts && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analysisResult.forecasts.slice(0, 8).map((forecast, idx) => (
                      <div
                        key={forecast.regionId}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`forecast-item-${idx}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {forecast.trend === 'surge' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : forecast.trend === 'growing' ? (
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                            ) : forecast.trend === 'declining' ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <CircleDot className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="font-medium">{forecast.regionName}</span>
                            <Badge variant={
                              forecast.trend === 'surge' ? 'default' :
                              forecast.trend === 'growing' ? 'secondary' :
                              forecast.trend === 'declining' ? 'destructive' : 'outline'
                            }>
                              {forecast.trend === 'surge' ? 'رشد سریع' :
                               forecast.trend === 'growing' ? 'رشد' :
                               forecast.trend === 'declining' ? 'کاهش' : 'پایدار'}
                            </Badge>
                          </div>
                          <span className={`text-sm font-bold ${
                            forecast.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {forecast.growthRate > 0 ? '+' : ''}{forecast.growthRate}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">فعلی:</span>
                            <span className="font-medium mr-1">{forecast.currentCustomers}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">پیش‌بینی:</span>
                            <span className="font-medium mr-1">{forecast.predictedCustomers}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">امتیاز:</span>
                            <span className="font-medium mr-1">{forecast.expansionScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Radius Analysis Tab */}
        <TabsContent value="radius" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Settings & Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">تنظیمات شعاع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    شعاع پوشش: {coverageRadius} کیلومتر
                  </label>
                  <Slider
                    value={[coverageRadius]}
                    onValueChange={([v]) => setCoverageRadius(v)}
                    min={1}
                    max={15}
                    step={0.5}
                    className="mt-2"
                    data-testid="coverage-radius-slider"
                  />
                </div>

                {analysisResult?.coverage && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>درصد پوشش:</span>
                        <span className="font-bold">
                          {analysisResult.coverage.coveragePercentage}%
                        </span>
                      </div>
                      <Progress 
                        value={analysisResult.coverage.coveragePercentage} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                        <div className="text-green-600 font-bold">
                          {analysisResult.coverage.coveredCustomers}
                        </div>
                        <div className="text-xs text-muted-foreground">با پوشش</div>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                        <div className="text-red-600 font-bold">
                          {analysisResult.coverage.uncoveredCustomers.length}
                        </div>
                        <div className="text-xs text-muted-foreground">بدون پوشش</div>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">میانگین فاصله:</span>
                        <span>{analysisResult.coverage.avgDistanceToService} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">حداکثر فاصله:</span>
                        <span>{analysisResult.coverage.maxDistanceToService} km</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations & Optimal Locations */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  پیشنهادات و مکان‌های بهینه
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult?.coverage && (
                  <div className="space-y-4">
                    {/* Recommendations */}
                    <div className="space-y-2">
                      {analysisResult.coverage.recommendations.map((rec, idx) => (
                        <Alert key={idx} className="py-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>

                    {/* Optimal Locations */}
                    {analysisResult.coverage.optimalLocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          مکان‌های پیشنهادی برای شعبه جدید
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.coverage.optimalLocations.map((loc, idx) => (
                            <div
                              key={idx}
                              className={`p-3 border rounded-lg ${
                                loc.priority === 'high' ? 'border-green-300 bg-green-50 dark:bg-green-950/20' :
                                loc.priority === 'medium' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' :
                                'border-gray-200'
                              }`}
                              data-testid={`optimal-location-${idx}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    loc.priority === 'high' ? 'bg-green-500' :
                                    loc.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`} />
                                  <span className="font-medium">پیشنهاد {idx + 1}</span>
                                </div>
                                <Badge variant={
                                  loc.priority === 'high' ? 'default' :
                                  loc.priority === 'medium' ? 'secondary' : 'outline'
                                }>
                                  {loc.priority === 'high' ? 'اولویت بالا' :
                                   loc.priority === 'medium' ? 'اولویت متوسط' : 'اولویت پایین'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{loc.reason}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                موقعیت: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            نقشه تحلیل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={mapContainerRef}
            className="w-full h-[400px] rounded-lg border"
            data-testid="analysis-map"
          />
        </CardContent>
      </Card>
    </div>
  );
}
