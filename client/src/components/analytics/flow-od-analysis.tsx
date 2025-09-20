import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import DeckGL from '@deck.gl/react';
import { ArcLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
// TileLayer from geo-layers - temporarily commented for compatibility
// import { TileLayer } from '@deck.gl/geo-layers';
import { MapView } from '@deck.gl/core';
import { FlowODAnalyzer, ODPair, FlowNode, FlowMetrics } from "@/lib/flow-analysis";
import { Navigation, TrendingUp, MapPin, ArrowRight, Target, Zap, Users, DollarSign } from "lucide-react";

// Enhanced OpenStreetMap configuration
const OSM_TILE_SERVERS = [
  'https://a.tile.openstreetmap.org',
  'https://b.tile.openstreetmap.org', 
  'https://c.tile.openstreetmap.org'
];

// Professional map styles
const MAP_STYLES = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
};

const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export function FlowODAnalysis() {
  const [analysisType, setAnalysisType] = useState<"flows" | "origins" | "destinations" | "expansion">("flows");
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 46.2919,
    latitude: 38.0962,
    zoom: 11,
    pitch: 45,
    bearing: 0
  });
  
  const [selectedMetric, setSelectedMetric] = useState<"volume" | "growth" | "transactions">("volume");
  const [flowThreshold, setFlowThreshold] = useState<number>(1000000);
  const [isLoading, setIsLoading] = useState(false);

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  // Initialize Flow Analyzer
  const { analyzer, flowData } = useMemo(() => {
    if (customers.length === 0 || bankingUnits.length === 0) {
      return { analyzer: null, flowData: { odPairs: [], nodes: [], metrics: null } };
    }

    const flowAnalyzer = new FlowODAnalyzer(customers, branches, bankingUnits, []);
    const odPairs = flowAnalyzer.getODPairs().filter(pair => pair !== null);
    const nodes = flowAnalyzer.getNodes();
    const metrics = flowAnalyzer.getFlowMetrics();

    return { 
      analyzer: flowAnalyzer, 
      flowData: { odPairs, nodes, metrics }
    };
  }, [customers, bankingUnits, branches]);

  // Handle loading state
  useEffect(() => {
    setIsLoading(customers.length === 0 || bankingUnits.length === 0);
  }, [customers.length, bankingUnits.length]);

  // Filter data based on selected metric, threshold, and analysis type
  const filteredData = useMemo(() => {
    if (!flowData.odPairs) return { odPairs: [], nodes: [] };

    let filtered = flowData.odPairs.filter(pair => {
      if (selectedMetric === "volume") return pair.volume >= flowThreshold;
      if (selectedMetric === "growth") return Math.abs(pair.growth) >= flowThreshold / 100000;
      return pair.volume >= flowThreshold;
    });

    // Apply analysis type filter
    if (analysisType === "origins") {
      filtered = filtered.filter(pair => pair.growth > 5); // Growing flows from sources
    } else if (analysisType === "destinations") {
      filtered = filtered.filter(pair => pair.growth < -5 || pair.volume > flowThreshold * 2); // High volume or declining flows to destinations
    } else if (analysisType === "expansion") {
      filtered = filtered.filter(pair => pair.growth > 15 && pair.volume > flowThreshold * 1.5); // High growth, high volume flows
    }

    const filteredNodes = flowData.nodes || [];
    let visibleNodes = filteredNodes;
    
    if (analysisType === "origins") {
      visibleNodes = filteredNodes.filter(node => node.type === 'source' || node.type === 'hub');
    } else if (analysisType === "destinations") {
      visibleNodes = filteredNodes.filter(node => node.type === 'destination' || node.type === 'hub');
    }

    return {
      odPairs: filtered,
      nodes: visibleNodes
    };
  }, [flowData, selectedMetric, flowThreshold, analysisType]);

  // Create deck.gl layers
  const layers = useMemo(() => {
    if (!analyzer || !filteredData.odPairs.length) return [];

    const arcLayer = new ArcLayer({
      id: 'flow-arcs',
      data: filteredData.odPairs,
      getSourcePosition: (d: ODPair) => [d.origin[1], d.origin[0]], // lng, lat
      getTargetPosition: (d: ODPair) => [d.destination[1], d.destination[0]], // lng, lat
      getWidth: (d: ODPair) => Math.max(2, d.thickness),
      getSourceColor: (d: ODPair) => [...d.color, 200] as [number, number, number, number],
      getTargetColor: (d: ODPair) => [...d.color, 100] as [number, number, number, number],
      getHeight: (d: ODPair) => d.thickness * 0.1,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 128]
    });

    const nodesLayer = new ScatterplotLayer({
      id: 'flow-nodes',
      data: filteredData.nodes,
      getPosition: (d: FlowNode) => [d.coordinates[1], d.coordinates[0]], // lng, lat
      getRadius: (d: FlowNode) => Math.max(50, Math.sqrt(d.properties.monthlyVolume) / 100),
      getFillColor: (d: FlowNode) => {
        if (d.type === 'hub') return [255, 165, 0, 180]; // Orange for hubs
        if (d.type === 'source') return [0, 255, 0, 150]; // Green for sources  
        return [0, 100, 255, 150]; // Blue for destinations
      },
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 2,
      pickable: true,
      autoHighlight: true
    });

    const labelsLayer = new TextLayer({
      id: 'node-labels',
      data: filteredData.nodes.filter(n => n.type === 'hub'),
      getPosition: (d: FlowNode) => [d.coordinates[1], d.coordinates[0]], // lng, lat
      getText: (d: FlowNode) => d.name,
      getColor: [255, 255, 255, 255],
      getSize: 12,
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      background: true,
      getBackgroundColor: [0, 0, 0, 128],
      fontFamily: 'Vazirmatn, Arial, sans-serif'
    });

    return [arcLayer, nodesLayer, labelsLayer];
  }, [analyzer, filteredData, selectedMetric]);

  if (!analyzer) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">در حال بارگذاری داده‌های تحليل جريانات...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            🌊
          </div>
          تحليل جريانات و مسارها (Flow / OD Analysis)
        </h3>
        <p className="text-muted-foreground mt-2">
          بررسي حرکت مشتريان، جريان تراکنشات و کشف الگوهاي مکاني
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            تنظیمات تحلیل جریانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع نمايش:</label>
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger data-testid="analysis-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flows">🌊 جریانات کلی</SelectItem>
                  <SelectItem value="origins">📍 مناطق مولد</SelectItem>
                  <SelectItem value="destinations">🎯 مناطق مصرف‌کننده</SelectItem>
                  <SelectItem value="expansion">📈 نقاط بهينه توسعه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">معیار نمایش:</label>
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger data-testid="metric-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">💰 حجم مالی</SelectItem>
                  <SelectItem value="growth">📈 رشد/افت</SelectItem>
                  <SelectItem value="transactions">🔄 تعداد تراکنش</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                آستانه فیلتر: {(flowThreshold / 1000000).toFixed(1)}M
              </label>
              <input
                type="range"
                min={100000}
                max={10000000}
                step={500000}
                value={flowThreshold}
                onChange={(e) => setFlowThreshold(parseInt(e.target.value))}
                className="w-full"
                data-testid="threshold-slider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">زاویه دید:</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={viewState.pitch === 0 ? "default" : "outline"}
                  onClick={() => setViewState(prev => ({ ...prev, pitch: 0, bearing: 0 }))}
                  data-testid="view-2d"
                >
                  2D
                </Button>
                <Button
                  size="sm"
                  variant={viewState.pitch > 0 ? "default" : "outline"}
                  onClick={() => setViewState(prev => ({ ...prev, pitch: 45, bearing: 15 }))}
                  data-testid="view-3d"
                >
                  3D
                </Button>
              </div>
            </div>
          </div>
          
          {isLoading && (
            <div className="mt-4 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">در حال تحلیل جریانات...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flow Metrics Summary */}
      {flowData.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">کل حجم جریان</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {Math.round(flowData.metrics.totalVolume / 1000000)}M
                  </p>
                  <p className="text-xs text-blue-600">میلیون تومان</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">میانگین رشد</p>
                  <p className="text-2xl font-bold text-green-900">
                    {flowData.metrics.avgGrowth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-green-600">ماهانه</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">مناطق فعال</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {flowData.nodes.length}
                  </p>
                  <p className="text-xs text-purple-600">منطقه</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">جریانات شناسایی شده</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {filteredData.odPairs.length}
                  </p>
                  <p className="text-xs text-orange-600">مسیر فعال</p>
                </div>
                <Navigation className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flows">جریانات کلی</TabsTrigger>
          <TabsTrigger value="origins">مناطق مولد</TabsTrigger>
          <TabsTrigger value="destinations">مناطق مصرف‌کننده</TabsTrigger>
          <TabsTrigger value="expansion">توسعه بهینه</TabsTrigger>
        </TabsList>

        {/* Interactive Flow Map */}
        <TabsContent value="flows" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🌊 نقشه تعاملی جریانات
                <Badge variant="outline" className="mr-auto">
                  {filteredData.odPairs.length} جریان فعال
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative w-full h-96 rounded-lg overflow-hidden border"
                style={{
                  background: `
                    linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.1)),
                    url('https://tile.openstreetmap.org/${Math.floor(viewState.zoom)}/${Math.floor((viewState.longitude + 180) / 360 * Math.pow(2, viewState.zoom))}/${Math.floor((1 - Math.log(Math.tan(viewState.latitude * Math.PI / 180) + 1 / Math.cos(viewState.latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, viewState.zoom))}.png')
                  `,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <DeckGL
                  viewState={viewState}
                  onViewStateChange={({viewState: newViewState}) => {
                    if (newViewState && 'longitude' in newViewState) {
                      setViewState({
                        longitude: newViewState.longitude,
                        latitude: newViewState.latitude,
                        zoom: newViewState.zoom,
                        pitch: newViewState.pitch || 45,
                        bearing: newViewState.bearing || 0
                      });
                    }
                  }}
                  controller={true}
                  layers={layers}
                  getTooltip={({ object, index }) => {
                    if (!object) return null;
                    
                    if (object.origin && object.destination) {
                      // Arc tooltip
                      return {
                        html: `
                          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-w-xs">
                            <div class="font-semibold text-sm mb-2">🌊 جریان تجاری</div>
                            <div class="text-xs space-y-1">
                              <div>💰 حجم: <span class="font-medium">${(object.volume / 1000000).toFixed(1)}M تومان</span></div>
                              <div>📈 رشد: <span class="font-medium ${object.growth > 0 ? 'text-green-600' : 'text-red-600'}">${object.growth.toFixed(1)}%</span></div>
                              <div>📍 نوع: <span class="font-medium">${object.type}</span></div>
                            </div>
                          </div>
                        `,
                        style: {
                          fontSize: '12px',
                          fontFamily: 'Vazirmatn, Arial, sans-serif'
                        }
                      };
                    } else if (object.coordinates) {
                      // Node tooltip
                      return {
                        html: `
                          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border max-w-xs">
                            <div class="font-semibold text-sm mb-2">${object.type === 'hub' ? '🏦' : object.type === 'source' ? '📍' : '🎯'} ${object.name}</div>
                            <div class="text-xs space-y-1">
                              <div>💰 حجم ماهانه: <span class="font-medium">${(object.properties.monthlyVolume / 1000000).toFixed(1)}M</span></div>
                              <div>👥 مشتریان: <span class="font-medium">${object.properties.customerCount}</span></div>
                              <div>🏢 نوع: <span class="font-medium">${object.type === 'hub' ? 'واحد بانکی' : object.type === 'source' ? 'منطقه مولد' : 'منطقه مصرف‌کننده'}</span></div>
                            </div>
                          </div>
                        `,
                        style: {
                          fontSize: '12px',
                          fontFamily: 'Vazirmatn, Arial, sans-serif'
                        }
                      };
                    }
                    return null;
                  }}
                />
                
                {/* Map Legend */}
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                  <h4 className="font-semibold text-sm mb-2">راهنمای رنگ‌ها</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-green-500 rounded"></div>
                      <span>رشد بالا (&gt;10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-yellow-500 rounded"></div>
                      <span>رشد متوسط (0-10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-orange-500 rounded"></div>
                      <span>افت خفیف (0 تا -10%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-red-500 rounded"></div>
                      <span>افت شدید (&lt;-10%)</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border">
                  <div className="text-xs text-muted-foreground">
                    🖱️ کلیک و کشیدن: حرکت نقشه<br/>
                    🔍 اسکرول: زوم<br/>
                    ⌨️ Ctrl + کلیک: چرخش
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Origin Analysis */}
        <TabsContent value="origins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>📍 تحلیل مناطق مولد</CardTitle>
              <p className="text-sm text-muted-foreground">
                مناطقی که بیشترین جریان خروجی را دارند
              </p>
            </CardHeader>
            <CardContent>
              {flowData.metrics && (
                <div className="space-y-4">
                  {flowData.metrics.topSources.map((source, index) => (
                    <div key={source.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{source.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {source.properties.customerCount} مشتری • {source.properties.businessTypes.slice(0, 2).join('، ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {Math.round(source.properties.totalOut / 1000000)}M
                        </p>
                        <p className="text-sm text-muted-foreground">تومان/ماه</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Destination Analysis */}
        <TabsContent value="destinations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>🎯 تحلیل مناطق مصرف‌کننده</CardTitle>
              <p className="text-sm text-muted-foreground">
                مناطقی که بیشترین جریان ورودی را دارند
              </p>
            </CardHeader>
            <CardContent>
              {flowData.metrics && (
                <div className="space-y-4">
                  {flowData.metrics.topDestinations.map((dest, index) => (
                    <div key={dest.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{dest.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {dest.properties.customerCount} مشتری • {dest.properties.businessTypes.slice(0, 2).join('، ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {Math.round(dest.properties.totalIn / 1000000)}M
                        </p>
                        <p className="text-sm text-muted-foreground">تومان/ماه</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expansion Opportunities */}
        <TabsContent value="expansion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>📈 فرصت‌های توسعه بهینه</CardTitle>
              <p className="text-sm text-muted-foreground">
                نقاط پیشنهادی برای توسعه شعب جدید بر اساس تحلیل جریانات
              </p>
            </CardHeader>
            <CardContent>
              {analyzer && (
                <div className="space-y-4">
                  {analyzer.findOptimalExpansionSites(flowData.nodes).map((site, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-700 dark:text-green-300">
                              موقعیت پیشنهادی #{index + 1}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              📍 عرض: {site.coordinates[0].toFixed(4)} • طول: {site.coordinates[1].toFixed(4)}
                            </p>
                            <p className="text-sm mt-2">
                              {site.reasoning}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">امتیاز:</span>
                            <Badge variant="secondary">
                              {site.score.toFixed(1)}
                            </Badge>
                          </div>
                          <Progress value={Math.min(100, site.score * 10)} className="w-20 mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights Panel */}
      {flowData.metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              بینش‌ها و توصیه‌های استراتژیک
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  جریانات در حال رشد
                </h5>
                <div className="space-y-2">
                  {flowData.metrics.emergingRoutes.slice(0, 3).map((route, index) => (
                    <div key={route.id} className="text-sm">
                      <span className="text-green-600 font-medium">+{route.properties.growth.toFixed(1)}%</span>
                      <span className="text-muted-foreground ml-2">
                        {Math.round(route.properties.volume / 1000000)}M حجم
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  جریانات غالب
                </h5>
                <div className="space-y-2">
                  {flowData.metrics.dominantFlows.slice(0, 3).map((flow, index) => (
                    <div key={flow.id} className="text-sm">
                      <span className="font-medium">
                        {Math.round(flow.properties.volume / 1000000)}M
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {flow.properties.transactionCount} تراکنش
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-red-500" />
                  جریانات در حال افت
                </h5>
                <div className="space-y-2">
                  {flowData.metrics.decliningRoutes.slice(0, 3).map((route, index) => (
                    <div key={route.id} className="text-sm">
                      <span className="text-red-600 font-medium">{route.properties.growth.toFixed(1)}%</span>
                      <span className="text-muted-foreground ml-2">
                        نیاز به بررسی
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}