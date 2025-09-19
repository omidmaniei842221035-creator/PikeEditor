// What-If Simulator Component
// Interactive scenario planning with ML predictions and map selection

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Play, Zap, TrendingUp, AlertTriangle, CheckCircle, MapPin, Target, DollarSign, Users, Clock, Building2, Lightbulb, Cpu, Brain } from 'lucide-react';
import { MLPredictionEngine, ScenarioInput, ScenarioPrediction, RegionData } from '@/lib/prediction-models';

// Simple Map Selection with Click Interaction

interface MapSelectionProps {
  selectedRegion: RegionData | null;
  onRegionSelect: (region: RegionData) => void;
  regions: RegionData[];
}

const MapSelection = ({ selectedRegion, onRegionSelect, regions }: MapSelectionProps) => {
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to approximate lat/lng for Tabriz area
    const lat = 38.0742 + (y - rect.height / 2) * -0.0001; // Approximate conversion
    const lng = 46.2919 + (x - rect.width / 2) * 0.0001;
    
    setSelectedCoords([lat, lng]);
    
    // Find nearest region or create a new one
    const nearestRegion = findNearestRegion([lat, lng], regions) || createRegionFromCoords([lat, lng]);
    onRegionSelect(nearestRegion);
  };

  const findNearestRegion = (coords: [number, number], regions: RegionData[]): RegionData | null => {
    if (regions.length === 0) return null;
    
    let nearest = regions[0];
    let minDistance = calculateDistance(coords, nearest.coordinates);
    
    regions.forEach(region => {
      const distance = calculateDistance(coords, region.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = region;
      }
    });
    
    return minDistance < 5000 ? nearest : null; // Within 5km
  };

  const createRegionFromCoords = (coords: [number, number]): RegionData => {
    return {
      id: `region_${Date.now()}`,
      name: `منطقه انتخابی (${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})`,
      coordinates: coords,
      currentMetrics: {
        revenue: 2500000 + Math.random() * 5000000,
        transactions: 1500 + Math.random() * 3000,
        posCount: 3 + Math.floor(Math.random() * 15),
        customerCount: 800 + Math.floor(Math.random() * 2000),
        operatingHours: 12 + Math.floor(Math.random() * 12),
        averageTransactionValue: 45000 + Math.random() * 50000,
        customerSatisfaction: 0.7 + Math.random() * 0.3,
        operationalCosts: 500000 + Math.random() * 1000000
      },
      demographics: {
        population: 5000 + Math.floor(Math.random() * 50000),
        avgIncome: 25000000 + Math.random() * 30000000,
        businessDensity: 20 + Math.random() * 70,
        competitionLevel: 3 + Math.random() * 6
      },
      infrastructure: {
        internetQuality: 6 + Math.random() * 4,
        powerReliability: 7 + Math.random() * 3,
        transportAccess: 5 + Math.random() * 5
      }
    };
  };

  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Convert lat/lng to pixel position for display
  const coordsToPixels = (coords: [number, number], containerWidth: number, containerHeight: number) => {
    const [lat, lng] = coords;
    const centerLat = 38.0742;
    const centerLng = 46.2919;
    
    const x = ((lng - centerLng) / 0.0001) + containerWidth / 2;
    const y = ((centerLat - lat) / 0.0001) + containerHeight / 2;
    
    return { x: Math.max(0, Math.min(containerWidth, x)), y: Math.max(0, Math.min(containerHeight, y)) };
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border bg-gradient-to-br from-blue-50 to-cyan-50 relative">
      <div 
        className="absolute inset-0 cursor-crosshair"
        onClick={handleMapClick}
        data-testid="map-selection"
      >
        {/* Background map representation */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 opacity-30">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl text-blue-300">
            🗺️
          </div>
        </div>
        
        {/* Show existing regions */}
        {regions.map(region => {
          const pos = coordsToPixels(region.coordinates, 400, 300);
          return (
            <div
              key={region.id}
              className={`absolute w-4 h-4 rounded-full cursor-pointer transition-all ${
                selectedRegion?.id === region.id 
                  ? 'bg-red-500 border-2 border-red-300 scale-125' 
                  : 'bg-blue-500 border-2 border-blue-300 hover:scale-110'
              }`}
              style={{
                left: pos.x - 8,
                top: pos.y - 8,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRegionSelect(region);
              }}
              title={`${region.name}: ${(region.currentMetrics.revenue / 1000000).toFixed(1)}M تومان`}
            >
              <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                <strong>{region.name}</strong><br/>
                درآمد: {(region.currentMetrics.revenue / 1000000).toFixed(1)}M تومان<br/>
                تراکنش: {region.currentMetrics.transactions.toLocaleString()}<br/>
                نقاط فروش: {region.currentMetrics.posCount}
              </div>
            </div>
          );
        })}

        {/* Show selected coordinates */}
        {selectedCoords && (
          <div
            className="absolute w-6 h-6 rounded-full bg-yellow-500 border-3 border-yellow-300 animate-pulse"
            style={{
              left: coordsToPixels(selectedCoords, 400, 300).x - 12,
              top: coordsToPixels(selectedCoords, 400, 300).y - 12,
            }}
            title={`منطقه انتخابی: ${selectedCoords[0].toFixed(4)}, ${selectedCoords[1].toFixed(4)}`}
          />
        )}

        {/* Show selection radius if region is selected */}
        {selectedRegion && (
          <div
            className="absolute rounded-full border-2 border-green-400 bg-green-100 bg-opacity-30 pointer-events-none"
            style={{
              width: 100,
              height: 100,
              left: coordsToPixels(selectedRegion.coordinates, 400, 300).x - 50,
              top: coordsToPixels(selectedRegion.coordinates, 400, 300).y - 50,
            }}
          />
        )}
        
        {/* Map overlay info */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded text-xs">
          📍 کلیک برای انتخاب منطقه<br/>
          🎯 نقاط آبی: مناطق موجود
        </div>
      </div>
    </div>
  );
};

const ScenarioControls = ({ 
  scenarioInput, 
  onScenarioChange, 
  onRunSimulation, 
  isRunning 
}: {
  scenarioInput: ScenarioInput;
  onScenarioChange: (input: ScenarioInput) => void;
  onRunSimulation: () => void;
  isRunning: boolean;
}) => {
  const updateScenario = (updates: Partial<ScenarioInput>) => {
    onScenarioChange({ ...scenarioInput, ...updates });
  };

  const updateParameters = (params: Partial<ScenarioInput['parameters']>) => {
    onScenarioChange({
      ...scenarioInput,
      parameters: { ...scenarioInput.parameters, ...params }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          🎯 تنظیمات سناریو
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">نوع سناریو</Label>
          <Select 
            value={scenarioInput.scenarioType} 
            onValueChange={(value: any) => updateScenario({ scenarioType: value })}
          >
            <SelectTrigger data-testid="select-scenario-type">
              <SelectValue placeholder="انتخاب نوع سناریو" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add_pos">📍 افزودن نقاط فروش جدید</SelectItem>
              <SelectItem value="increase_hours">⏰ افزایش ساعات کاری</SelectItem>
              <SelectItem value="increase_users">👥 افزایش تعداد کاربران</SelectItem>
              <SelectItem value="add_branch">🏢 افزودن شعبه جدید</SelectItem>
              <SelectItem value="optimize_location">🎯 بهینه‌سازی موقعیت</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Parameters based on Scenario Type */}
        <div className="space-y-4">
          {scenarioInput.scenarioType === 'add_pos' && (
            <div className="space-y-3">
              <Label>تعداد نقاط فروش جدید: {scenarioInput.parameters.posCount || 10}</Label>
              <Slider
                value={[scenarioInput.parameters.posCount || 10]}
                onValueChange={([value]) => updateParameters({ posCount: value })}
                min={1}
                max={100}
                step={1}
                className="w-full"
                data-testid="slider-pos-count"
              />
              <div className="text-xs text-muted-foreground">
                هزینه تخمینی: {((scenarioInput.parameters.posCount || 10) * 2000000).toLocaleString()} تومان
              </div>
            </div>
          )}

          {scenarioInput.scenarioType === 'increase_hours' && (
            <div className="space-y-3">
              <Label>افزایش ساعات کاری: {scenarioInput.parameters.hoursIncrease || 4} ساعت</Label>
              <Slider
                value={[scenarioInput.parameters.hoursIncrease || 4]}
                onValueChange={([value]) => updateParameters({ hoursIncrease: value })}
                min={1}
                max={12}
                step={1}
                className="w-full"
                data-testid="slider-hours-increase"
              />
              <div className="text-xs text-muted-foreground">
                افزایش هزینه عملیاتی روزانه تخمینی
              </div>
            </div>
          )}

          {scenarioInput.scenarioType === 'increase_users' && (
            <div className="space-y-3">
              <Label>درصد افزایش کاربران: {scenarioInput.parameters.userIncrease || 25}%</Label>
              <Slider
                value={[scenarioInput.parameters.userIncrease || 25]}
                onValueChange={([value]) => updateParameters({ userIncrease: value })}
                min={5}
                max={200}
                step={5}
                className="w-full"
                data-testid="slider-user-increase"
              />
              <div className="text-xs text-muted-foreground">
                تأثیر بر ظرفیت شبکه و زیرساخت
              </div>
            </div>
          )}

          {scenarioInput.scenarioType === 'add_branch' && (
            <div className="space-y-3">
              <Label>تعداد شعب جدید: {scenarioInput.parameters.branchCount || 2}</Label>
              <Slider
                value={[scenarioInput.parameters.branchCount || 2]}
                onValueChange={([value]) => updateParameters({ branchCount: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
                data-testid="slider-branch-count"
              />
              <div className="text-xs text-muted-foreground">
                سرمایه‌گذاری بزرگ: {((scenarioInput.parameters.branchCount || 2) * 50000000).toLocaleString()} تومان
              </div>
            </div>
          )}

          {scenarioInput.scenarioType === 'optimize_location' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-optimization"
                  checked={scenarioInput.parameters.locationOptimization || false}
                  onChange={(e) => updateParameters({ locationOptimization: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="location-optimization">فعال‌سازی بهینه‌سازی موقعیت</Label>
              </div>
              <div className="text-xs text-muted-foreground">
                بهبود زیرساخت، دسترسی و موقعیت استراتژیک
              </div>
            </div>
          )}
        </div>

        {/* Target Area Info */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm space-y-1">
            <div className="font-medium">🎯 منطقه هدف:</div>
            <div>{scenarioInput.targetArea.regionName}</div>
            <div className="text-xs text-muted-foreground">
              شعاع تأثیر: {(scenarioInput.targetArea.radius / 1000).toFixed(1)} کیلومتر
            </div>
          </div>
        </div>

        {/* Run Simulation Button */}
        <Button 
          onClick={onRunSimulation}
          disabled={isRunning}
          className="w-full"
          size="lg"
          data-testid="button-run-simulation"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
              در حال پردازش...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              🚀 اجرای شبیه‌سازی هوشمند
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

const PredictionResults = ({ prediction }: { prediction: ScenarioPrediction | null }) => {
  if (!prediction) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 20) return 'text-green-600';
    if (roi > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Chart data for time horizons
  const timeHorizonData = [
    {
      period: 'کوتاه‌مدت',
      revenue: prediction.timeHorizons.shortTerm.revenue / 1000000,
      transactions: prediction.timeHorizons.shortTerm.transactions,
      profitability: prediction.timeHorizons.shortTerm.profitability / 1000000
    },
    {
      period: 'میان‌مدت',
      revenue: prediction.timeHorizons.mediumTerm.revenue / 1000000,
      transactions: prediction.timeHorizons.mediumTerm.transactions,
      profitability: prediction.timeHorizons.mediumTerm.profitability / 1000000
    },
    {
      period: 'بلندمدت',
      revenue: prediction.timeHorizons.longTerm.revenue / 1000000,
      transactions: prediction.timeHorizons.longTerm.transactions,
      profitability: prediction.timeHorizons.longTerm.profitability / 1000000
    }
  ];

  // KPI comparison data
  const kpiData = [
    {
      metric: 'درآمد',
      current: prediction.predictions.revenue.current / 1000000,
      predicted: prediction.predictions.revenue.predicted / 1000000,
      change: prediction.predictions.revenue.changePercent
    },
    {
      metric: 'تراکنش',
      current: prediction.predictions.transactions.current,
      predicted: prediction.predictions.transactions.predicted,
      change: prediction.predictions.transactions.changePercent
    },
    {
      metric: 'رضایت مشتری',
      current: prediction.predictions.customerSatisfaction.current * 100,
      predicted: prediction.predictions.customerSatisfaction.predicted * 100,
      change: prediction.predictions.customerSatisfaction.changePercent
    }
  ];

  return (
    <div className="space-y-6" data-testid="prediction-results">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">درآمد (میلیون تومان)</p>
                <p className="text-2xl font-bold" data-testid="text-revenue-predicted">
                  {(prediction.predictions.revenue.predicted / 1000000).toFixed(1)}
                </p>
                <p className={`text-sm ${prediction.predictions.revenue.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {prediction.predictions.revenue.change > 0 ? '+' : ''}{(prediction.predictions.revenue.change / 1000000).toFixed(1)}M
                  ({prediction.predictions.revenue.changePercent.toFixed(1)}%)
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تراکنش</p>
                <p className="text-2xl font-bold" data-testid="text-transactions-predicted">
                  {prediction.predictions.transactions.predicted.toLocaleString()}
                </p>
                <p className={`text-sm ${prediction.predictions.transactions.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {prediction.predictions.transactions.change > 0 ? '+' : ''}{prediction.predictions.transactions.change.toFixed(0)}
                  ({prediction.predictions.transactions.changePercent.toFixed(1)}%)
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ROI</p>
                <p className={`text-2xl font-bold ${getROIColor(prediction.predictions.roi.predicted)}`} data-testid="text-roi-predicted">
                  {prediction.predictions.roi.predicted.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  بازگشت: {prediction.predictions.roi.paybackPeriod.toFixed(1)} ماه
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ریسک</p>
                <Badge className={getRiskColor(prediction.risks.level)}>
                  {prediction.risks.level === 'low' ? 'کم' : 
                   prediction.risks.level === 'medium' ? 'متوسط' : 'بالا'}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {prediction.risks.factors.length} عامل ریسک
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${
                prediction.risks.level === 'low' ? 'text-green-500' :
                prediction.risks.level === 'medium' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>📊 مقایسه شاخص‌های کلیدی</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    name === 'current' ? 'فعلی' : 'پیش‌بینی'
                  ]}
                />
                <Legend />
                <Bar dataKey="current" fill="#94a3b8" name="فعلی" />
                <Bar dataKey="predicted" fill="#3b82f6" name="پیش‌بینی" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Horizon Trend */}
        <Card>
          <CardHeader>
            <CardTitle>📈 روند زمانی پیش‌بینی</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeHorizonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    value.toFixed(1),
                    name === 'revenue' ? 'درآمد (میلیون)' :
                    name === 'transactions' ? 'تراکنش' : 'سودآوری (میلیون)'
                  ]}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="درآمد" />
                <Line type="monotone" dataKey="profitability" stroke="#3b82f6" strokeWidth={2} name="سودآوری" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ ارزیابی ریسک و راهکارها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-red-700">🚨 عوامل ریسک:</h4>
              <ul className="space-y-2">
                {prediction.risks.factors.map((factor, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-green-700">💡 راهکارهای کاهش ریسک:</h4>
              <ul className="space-y-2">
                {prediction.risks.mitigation.map((solution, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    {solution}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            🎯 توصیه‌های هوشمند سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prediction.recommendations.map((recommendation, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-sm">
                  {recommendation}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function WhatIfSimulator() {
  const [predictionEngine] = useState(() => new MLPredictionEngine());
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [scenarioInput, setScenarioInput] = useState<ScenarioInput>({
    scenarioType: 'add_pos',
    parameters: {
      posCount: 10
    },
    targetArea: {
      regionId: '',
      regionName: 'منطقه انتخابی',
      coordinates: [38.0742, 46.2919],
      radius: 3000
    }
  });
  const [prediction, setPrediction] = useState<ScenarioPrediction | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch data for regions
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  // Create regions from available data
  const regions = useMemo(() => {
    const regions: RegionData[] = [];
    
    // Create regions from branches
    branches.forEach((branch, index) => {
      if (branch.latitude && branch.longitude) {
        regions.push({
          id: `branch_${branch.id}`,
          name: `منطقه ${branch.name}`,
          coordinates: [parseFloat(branch.latitude), parseFloat(branch.longitude)],
          currentMetrics: {
            revenue: 2000000 + Math.random() * 8000000,
            transactions: 1200 + Math.random() * 2500,
            posCount: 5 + Math.floor(Math.random() * 20),
            customerCount: 600 + Math.floor(Math.random() * 1500),
            operatingHours: 10 + Math.floor(Math.random() * 14),
            averageTransactionValue: 40000 + Math.random() * 60000,
            customerSatisfaction: 0.75 + Math.random() * 0.25,
            operationalCosts: 400000 + Math.random() * 1200000
          },
          demographics: {
            population: 8000 + Math.floor(Math.random() * 40000),
            avgIncome: 20000000 + Math.random() * 40000000,
            businessDensity: 30 + Math.random() * 60,
            competitionLevel: 2 + Math.random() * 7
          },
          infrastructure: {
            internetQuality: 5 + Math.random() * 5,
            powerReliability: 7 + Math.random() * 3,
            transportAccess: 4 + Math.random() * 6
          }
        });
      }
    });

    // Add some default regions if no branches
    if (regions.length === 0) {
      regions.push({
        id: 'default_tabriz_center',
        name: 'مرکز شهر تبریز',
        coordinates: [38.0742, 46.2919],
        currentMetrics: {
          revenue: 5000000,
          transactions: 2500,
          posCount: 12,
          customerCount: 1200,
          operatingHours: 14,
          averageTransactionValue: 65000,
          customerSatisfaction: 0.85,
          operationalCosts: 800000
        },
        demographics: {
          population: 25000,
          avgIncome: 35000000,
          businessDensity: 80,
          competitionLevel: 6
        },
        infrastructure: {
          internetQuality: 8,
          powerReliability: 9,
          transportAccess: 9
        }
      });
    }
    
    return regions;
  }, [branches]);

  // Check if prediction engine is ready
  useEffect(() => {
    const checkEngine = () => {
      setIsEngineReady(predictionEngine.isReady());
      if (!predictionEngine.isReady()) {
        setTimeout(checkEngine, 1000);
      }
    };
    checkEngine();
  }, [predictionEngine]);

  // Update target area when region is selected
  useEffect(() => {
    if (selectedRegion) {
      setScenarioInput(prev => ({
        ...prev,
        targetArea: {
          regionId: selectedRegion.id,
          regionName: selectedRegion.name,
          coordinates: selectedRegion.coordinates,
          radius: 3000
        }
      }));
    }
  }, [selectedRegion]);

  const handleRunSimulation = async () => {
    if (!selectedRegion || !isEngineReady) return;

    setIsRunning(true);
    setPrediction(null);

    try {
      const result = await predictionEngine.predictScenario(scenarioInput, selectedRegion);
      setPrediction(result);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="what-if-simulator">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🧠 شبیه‌ساز سناریو هوشمند (What-If Simulator)
        </h2>
        <p className="text-lg text-muted-foreground mt-3">
          پیش‌بینی تأثیر تصمیمات استراتژیک بر KPIها با قدرت هوش مصنوعی
        </p>
        <div className="h-1 w-48 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
        
        {/* Engine Status */}
        <div className="mt-4">
          <Badge variant={isEngineReady ? "default" : "secondary"} className="px-4 py-2">
            {isEngineReady ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                موتور ML آماده
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                آماده‌سازی موتور ML...
              </>
            )}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Map Selection */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                🗺️ انتخاب منطقه هدف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapSelection 
                selectedRegion={selectedRegion}
                onRegionSelect={setSelectedRegion}
                regions={regions}
              />
              
              {selectedRegion && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📍 اطلاعات منطقه انتخابی:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">درآمد فعلی:</span><br />
                      {(selectedRegion.currentMetrics.revenue / 1000000).toFixed(1)}M تومان
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">تراکنش:</span><br />
                      {selectedRegion.currentMetrics.transactions.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">نقاط فروش:</span><br />
                      {selectedRegion.currentMetrics.posCount}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">مشتریان:</span><br />
                      {selectedRegion.currentMetrics.customerCount.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">ساعات کاری:</span><br />
                      {selectedRegion.currentMetrics.operatingHours}h
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">رضایت:</span><br />
                      {(selectedRegion.currentMetrics.customerSatisfaction * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scenario Controls */}
        <div className="space-y-6">
          <ScenarioControls 
            scenarioInput={scenarioInput}
            onScenarioChange={setScenarioInput}
            onRunSimulation={handleRunSimulation}
            isRunning={isRunning}
          />
        </div>
      </div>

      {/* Results */}
      {(prediction || isRunning) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              📊 نتایج شبیه‌سازی هوشمند
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isRunning ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto" />
                  <p className="text-lg font-medium">در حال پردازش با موتور ML...</p>
                  <p className="text-sm text-muted-foreground">
                    تحلیل داده‌ها و پیش‌بینی تأثیرات
                  </p>
                </div>
              </div>
            ) : (
              <PredictionResults prediction={prediction} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}