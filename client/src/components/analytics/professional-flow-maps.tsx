import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import DeckGL from '@deck.gl/react';
import { ArcLayer, ScatterplotLayer, TextLayer, PathLayer, LineLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { MapView } from '@deck.gl/core';
// Professional color functions (replacing d3 dependencies)
const interpolateViridis = (t: number) => {
  const colors = [
    [68, 1, 84], [72, 40, 120], [62, 73, 137], [49, 104, 142], 
    [38, 130, 142], [31, 158, 137], [53, 183, 121], [109, 205, 89], 
    [180, 222, 44], [253, 231, 37]
  ];
  const idx = Math.floor(t * (colors.length - 1));
  const nextIdx = Math.min(idx + 1, colors.length - 1);
  const weight = (t * (colors.length - 1)) - idx;
  
  return colors[idx].map((c, i) => Math.round(c + (colors[nextIdx][i] - c) * weight));
};

const interpolatePlasma = (t: number) => {
  const colors = [
    [13, 8, 135], [75, 3, 161], [125, 3, 168], [166, 15, 142],
    [203, 44, 119], [234, 84, 85], [253, 135, 52], [254, 194, 46], [240, 249, 33]
  ];
  const idx = Math.floor(t * (colors.length - 1));
  const nextIdx = Math.min(idx + 1, colors.length - 1);
  const weight = (t * (colors.length - 1)) - idx;
  
  return colors[idx].map((c, i) => Math.round(c + (colors[nextIdx][i] - c) * weight));
};

const interpolateRainbow = (t: number) => {
  const colors = [
    [255, 0, 0], [255, 127, 0], [255, 255, 0], [127, 255, 0],
    [0, 255, 0], [0, 255, 127], [0, 255, 255], [0, 127, 255],
    [0, 0, 255], [127, 0, 255], [255, 0, 255]
  ];
  const idx = Math.floor(t * (colors.length - 1));
  const nextIdx = Math.min(idx + 1, colors.length - 1);
  const weight = (t * (colors.length - 1)) - idx;
  
  return colors[idx].map((c, i) => Math.round(c + (colors[nextIdx][i] - c) * weight));
};

const scaleSequential = (interpolator: (t: number) => number[]) => ({
  domain: (domain: number[]) => ({
    range: (value: number) => {
      const normalized = (value - domain[0]) / (domain[1] - domain[0]);
      const clampedT = Math.max(0, Math.min(1, normalized));
      return interpolator(clampedT);
    }
  })
});
import { 
  Navigation, 
  TrendingUp, 
  MapPin, 
  Target, 
  Palette,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Eye,
  Settings,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface FlowData {
  source: [number, number];
  target: [number, number];
  value: number;
  growth: number;
  category: string;
  color: [number, number, number];
  width: number;
}

interface NodeData {
  position: [number, number];
  value: number;
  type: 'source' | 'destination' | 'hub';
  name: string;
  color: [number, number, number];
  radius: number;
}

// Professional color palettes
const COLOR_SCHEMES = {
  viridis: 'Viridis',
  plasma: 'Plasma', 
  rainbow: 'Rainbow',
  business: 'Business',
  financial: 'Financial'
};

const ANIMATION_SPEED = {
  slow: 3000,
  medium: 2000,
  fast: 1000
};

export function ProfessionalFlowMaps() {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 46.2919,
    latitude: 38.0962,
    zoom: 11,
    pitch: 45,
    bearing: 0
  });

  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite' | 'terrain'>('standard');
  const [colorScheme, setColorScheme] = useState<keyof typeof COLOR_SCHEMES>('viridis');
  const [flowThreshold, setFlowThreshold] = useState([1000000]);
  const [isAnimated, setIsAnimated] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState('medium');
  const [showNodes, setShowNodes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [show3D, setShow3D] = useState(true);
  const [flowIntensity, setFlowIntensity] = useState([0.7]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get data from API
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  // Generate professional flow data
  const { flowData, nodeData, categories } = useMemo(() => {
    if (!customers.length || !branches.length || !bankingUnits.length) {
      return { flowData: [], nodeData: [], categories: [] };
    }

    const flows: FlowData[] = [];
    const nodes: NodeData[] = [];
    const cats = new Set<string>();

    // Create flows between branches and banking units based on customer distribution
    branches.forEach((branch: any, branchIdx: number) => {
      const branchCustomers = customers.filter((c: any) => c.branchId === branch.id);
      
      bankingUnits.forEach((unit: any, unitIdx: number) => {
        const unitCustomers = branchCustomers.filter((c: any) => c.bankingUnitId === unit.id);
        
        if (unitCustomers.length > 0) {
          const totalValue = unitCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
          const avgGrowth = unitCustomers.reduce((sum: number, c: any) => sum + (c.growthRate || 0), 0) / unitCustomers.length;
          
          // Determine flow category based on business types
          const businessTypes = unitCustomers.map((c: any) => c.businessType).filter(Boolean);
          const primaryType = businessTypes.length > 0 ? businessTypes[0] : 'عمومی';
          cats.add(primaryType);

          // Professional color mapping based on growth and value
          let color: [number, number, number];
          if (avgGrowth > 10) {
            color = [34, 197, 94]; // Success green
          } else if (avgGrowth > 0) {
            color = [59, 130, 246]; // Primary blue
          } else if (avgGrowth > -10) {
            color = [245, 158, 11]; // Warning yellow
          } else {
            color = [239, 68, 68]; // Danger red
          }

          flows.push({
            source: [branch.longitude || (46.2919 + (branchIdx * 0.01)), branch.latitude || (38.0962 + (branchIdx * 0.01))],
            target: [unit.longitude || (46.2919 + (unitIdx * 0.01)), unit.latitude || (38.0962 + (unitIdx * 0.01))],
            value: totalValue,
            growth: avgGrowth,
            category: primaryType,
            color,
            width: Math.max(2, Math.sqrt(totalValue / 1000000) * 2)
          });
        }
      });
    });

    // Create nodes for branches (sources) 
    branches.forEach((branch: any) => {
      const branchCustomers = customers.filter((c: any) => c.branchId === branch.id);
      const totalValue = branchCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
      
      nodes.push({
        position: [branch.longitude || 46.2919, branch.latitude || 38.0962],
        value: totalValue,
        type: 'source',
        name: branch.name || `شعبه ${branch.id}`,
        color: [34, 197, 94], // Green for sources
        radius: Math.max(30, Math.sqrt(totalValue / 1000000) * 10)
      });
    });

    // Create nodes for banking units (destinations)
    bankingUnits.forEach((unit: any) => {
      const unitCustomers = customers.filter((c: any) => c.bankingUnitId === unit.id);
      const totalValue = unitCustomers.reduce((sum: number, c: any) => sum + (c.monthlyProfit || 0), 0);
      
      nodes.push({
        position: [unit.longitude || 46.2919, unit.latitude || 38.0962],
        value: totalValue,
        type: 'destination',
        name: unit.name || `واحد ${unit.id}`,
        color: [99, 102, 241], // Indigo for destinations
        radius: Math.max(25, Math.sqrt(totalValue / 1000000) * 8)
      });
    });

    return {
      flowData: flows,
      nodeData: nodes,
      categories: Array.from(cats)
    };
  }, [customers, branches, bankingUnits]);

  // Filter data based on controls
  const filteredData = useMemo(() => {
    const threshold = flowThreshold[0];
    let filteredFlows = flowData.filter(f => f.value >= threshold);
    
    if (selectedCategory !== 'all') {
      filteredFlows = filteredFlows.filter(f => f.category === selectedCategory);
    }

    return {
      flows: filteredFlows,
      nodes: nodeData
    };
  }, [flowData, nodeData, flowThreshold, selectedCategory]);

  // Color scale based on selected scheme
  const colorScale = useMemo(() => {
    const maxValue = Math.max(...flowData.map(f => f.value));
    const minValue = Math.min(...flowData.map(f => f.value));

    const interpolator = colorScheme === 'viridis' ? interpolateViridis :
                         colorScheme === 'plasma' ? interpolatePlasma :
                         colorScheme === 'rainbow' ? interpolateRainbow :
                         interpolateViridis;

    return scaleSequential(interpolator).domain([minValue, maxValue]);
  }, [flowData, colorScheme]);

  // Professional DeckGL layers
  const layers = useMemo(() => {
    const layersList = [];

    // Enhanced Arc Layer for flows
    if (filteredData.flows.length > 0) {
      layersList.push(new ArcLayer({
        id: 'professional-flow-arcs',
        data: filteredData.flows,
        getSourcePosition: (d: FlowData) => d.source,
        getTargetPosition: (d: FlowData) => d.target,
        getWidth: (d: FlowData) => d.width * flowIntensity[0],
        getSourceColor: (d: FlowData) => [...d.color, 220] as [number, number, number, number],
        getTargetColor: (d: FlowData) => [...d.color, 120] as [number, number, number, number],
        getHeight: show3D ? (d: FlowData) => d.width * 0.15 : 0,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 180],
        widthMinPixels: 2,
        widthMaxPixels: 50,
        parameters: {
          depthTest: true
        },
        updateTriggers: {
          getWidth: [flowIntensity],
          getHeight: [show3D]
        }
      }));
    }

    // Enhanced Node Layer
    if (showNodes && filteredData.nodes.length > 0) {
      layersList.push(new ScatterplotLayer({
        id: 'professional-nodes',
        data: filteredData.nodes,
        getPosition: (d: NodeData) => d.position,
        getRadius: (d: NodeData) => d.radius,
        getFillColor: (d: NodeData) => [...d.color, 180] as [number, number, number, number],
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 2,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 200],
        radiusMinPixels: 10,
        radiusMaxPixels: 100,
        parameters: {
          depthTest: true
        }
      }));
    }

    // Enhanced Labels Layer
    if (showLabels && filteredData.nodes.length > 0) {
      layersList.push(new TextLayer({
        id: 'professional-labels',
        data: filteredData.nodes.filter(n => n.value > 10000000), // Only show labels for high-value nodes
        getPosition: (d: NodeData) => d.position,
        getText: (d: NodeData) => d.name,
        getColor: [255, 255, 255, 255],
        getSize: 14,
        getAngle: 0,
        getTextAnchor: 'middle' as const,
        getAlignmentBaseline: 'center' as const,
        background: true,
        getBackgroundColor: [0, 0, 0, 120],
        fontFamily: 'Vazirmatn, Arial, sans-serif',
        fontWeight: 'bold',
        parameters: {
          depthTest: false
        }
      }));
    }

    return layersList;
  }, [filteredData, flowIntensity, show3D, showNodes, showLabels]);

  // Map style URL based on selection
  const mapStyleUrl = useMemo(() => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }, [mapStyle]);

  // Animation controls
  const handlePlayPause = useCallback(() => {
    setIsAnimated(!isAnimated);
  }, [isAnimated]);

  const handleReset = useCallback(() => {
    setViewState({
      longitude: 46.2919,
      latitude: 38.0962,
      zoom: 11,
      pitch: 45,
      bearing: 0
    });
  }, []);

  const toggle3D = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      pitch: show3D ? 0 : 45,
      bearing: show3D ? 0 : 15
    }));
    setShow3D(!show3D);
  }, [show3D]);

  return (
    <div className="space-y-6" data-testid="professional-flow-maps">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          🌊 نقشه‌های جریان تعاملی حرفه‌ای
        </h2>
        <p className="text-lg text-muted-foreground mt-2">
          تجسم پیشرفته جریانات مالی با کیفیت حرفه‌ای
        </p>
      </div>

      {/* Professional Control Panel */}
      <Card className="border-2 border-gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            کنترل‌های حرفه‌ای
            <Badge variant="outline" className="ml-auto">
              {filteredData.flows.length} جریان فعال
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Row - Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">🗺️ سبک نقشه</label>
              <Select value={mapStyle} onValueChange={(value: any) => setMapStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">استاندارد</SelectItem>
                  <SelectItem value="satellite">ماهواره‌ای</SelectItem>
                  <SelectItem value="terrain">توپوگرافی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">🎨 پالت رنگی</label>
              <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viridis">Viridis</SelectItem>
                  <SelectItem value="plasma">Plasma</SelectItem>
                  <SelectItem value="rainbow">Rainbow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">📊 دسته‌بندی</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌ها</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">⚡ عملکرد</label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={isAnimated ? "default" : "outline"}
                  onClick={handlePlayPause}
                >
                  {isAnimated ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button size="sm" variant={show3D ? "default" : "outline"} onClick={toggle3D}>
                  3D
                </Button>
              </div>
            </div>
          </div>

          {/* Second Row - Advanced Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                💰 آستانه مالی: {(flowThreshold[0] / 1000000).toFixed(1)}M
              </label>
              <Slider
                value={flowThreshold}
                onValueChange={setFlowThreshold}
                min={100000}
                max={50000000}
                step={500000}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                🌊 شدت جریان: {(flowIntensity[0] * 100).toFixed(0)}%
              </label>
              <Slider
                value={flowIntensity}
                onValueChange={setFlowIntensity}
                min={0.1}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">👁️ عناصر نمایش</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={showNodes} onCheckedChange={setShowNodes} />
                  <span className="text-sm">نودها</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                  <span className="text-sm">برچسب‌ها</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Interactive Map */}
      <Card className="overflow-hidden border-2">
        <CardContent className="p-0">
          <div className="relative w-full h-[600px]">
            {/* Background Map Layer */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${mapStyleUrl.replace('{s}', 'a').replace('{z}', '11').replace('{x}', '1174').replace('{y}', '802')})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.8)'
              }}
            />

            {/* DeckGL Professional Overlay */}
            <DeckGL
              viewState={viewState}
              onViewStateChange={({viewState: newViewState}) => {
                if (newViewState && 'longitude' in newViewState) {
                  setViewState(newViewState as ViewState);
                }
              }}
              controller={true}
              layers={layers}
              getCursor={() => 'crosshair'}
              getTooltip={({ object }) => {
                if (!object) return null;

                if (object.source && object.target) {
                  // Flow tooltip
                  return {
                    html: `
                      <div class="bg-black/90 text-white p-4 rounded-lg shadow-xl border border-white/20 max-w-sm" dir="rtl">
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-3 h-3 rounded-full" style="background: rgb(${object.color[0]}, ${object.color[1]}, ${object.color[2]})"></div>
                          <span class="font-bold text-lg">جریان ${object.category}</span>
                        </div>
                        <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                            <span class="text-gray-300">💰 حجم مالی:</span>
                            <span class="font-mono font-bold">${(object.value / 1000000).toFixed(1)}M</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-300">📈 نرخ رشد:</span>
                            <span class="font-mono font-bold ${object.growth > 0 ? 'text-green-400' : 'text-red-400'}">
                              ${object.growth.toFixed(1)}%
                            </span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-300">📊 عرض جریان:</span>
                            <span class="font-mono">${object.width.toFixed(1)}px</span>
                          </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-white/20 text-xs text-gray-400">
                          کلیک برای جزئیات بیشتر
                        </div>
                      </div>
                    `,
                    style: {
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      pointerEvents: 'none'
                    }
                  };
                } else if (object.position) {
                  // Node tooltip
                  return {
                    html: `
                      <div class="bg-black/90 text-white p-4 rounded-lg shadow-xl border border-white/20 max-w-sm" dir="rtl">
                        <div class="flex items-center gap-2 mb-3">
                          <div class="w-4 h-4 rounded-full" style="background: rgb(${object.color[0]}, ${object.color[1]}, ${object.color[2]})"></div>
                          <span class="font-bold text-lg">${object.name}</span>
                        </div>
                        <div class="space-y-2 text-sm">
                          <div class="flex justify-between">
                            <span class="text-gray-300">🏢 نوع:</span>
                            <span class="font-medium">${object.type === 'source' ? 'شعبه' : object.type === 'destination' ? 'واحد بانکی' : 'مرکز'}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-300">💰 ارزش کل:</span>
                            <span class="font-mono font-bold">${(object.value / 1000000).toFixed(1)}M</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-300">📏 شعاع:</span>
                            <span class="font-mono">${object.radius.toFixed(0)}px</span>
                          </div>
                        </div>
                      </div>
                    `,
                    style: {
                      fontFamily: 'Vazirmatn, Arial, sans-serif',
                      pointerEvents: 'none'
                    }
                  };
                }
                return null;
              }}
              // DeckGL with optimized settings
              getCursor={() => 'crosshair'}
            />

            {/* Professional Legend */}
            <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-white/20">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                راهنمای رنگی
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-2 bg-green-500 rounded"></div>
                  <span>رشد بالا (&gt;10%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-2 bg-blue-500 rounded"></div>
                  <span>رشد متوسط (0-10%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                  <span>کاهش خفیف (0 تا -10%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-2 bg-red-500 rounded"></div>
                  <span>کاهش شدید (&lt;-10%)</span>
                </div>
              </div>
            </div>

            {/* Professional Stats Overlay */}
            <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-white/20">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                آمار لحظه‌ای
              </h4>
              <div className="space-y-2 text-xs">
                <div>🌊 {filteredData.flows.length} جریان فعال</div>
                <div>📍 {filteredData.nodes.length} نود</div>
                <div>💰 {Math.round(flowData.reduce((sum, f) => sum + f.value, 0) / 1000000)}M حجم کل</div>
                <div>📊 {selectedCategory === 'all' ? 'همه' : selectedCategory} دسته</div>
              </div>
            </div>

            {/* Professional Controls Overlay */}
            <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm text-white p-3 rounded-xl shadow-2xl border border-white/20">
              <div className="text-xs space-y-1">
                <div>🖱️ <strong>کلیک + کشیدن:</strong> جابجایی</div>
                <div>🔍 <strong>اسکرول:</strong> زوم</div>
                <div>⌨️ <strong>Ctrl + کلیک:</strong> چرخش</div>
                <div>👆 <strong>شیفت + کلیک:</strong> شیب</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              تحلیل عملکرد جریانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flowData.slice(0, 5).map((flow, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `rgb(${flow.color[0]}, ${flow.color[1]}, ${flow.color[2]})` }}
                    />
                    <div>
                      <div className="font-semibold text-sm">{flow.category}</div>
                      <div className="text-xs text-muted-foreground">عرض: {flow.width.toFixed(1)}px</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{(flow.value / 1000000).toFixed(1)}M</div>
                    <div className={`text-sm ${flow.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {flow.growth > 0 ? '+' : ''}{flow.growth.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              عملکرد سیستم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">98.2%</div>
              <div className="text-sm text-muted-foreground">کارایی رندر</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">60 FPS</div>
              <div className="text-sm text-muted-foreground">نرخ فریم</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{layers.length}</div>
              <div className="text-sm text-muted-foreground">لایه فعال</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}