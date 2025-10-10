import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
// Temporarily removing Leaflet imports to avoid dependency issues
// import { MapContainer, TileLayer, Polygon, Circle, Popup, useMap } from 'react-leaflet';
// import { LatLngExpression } from 'leaflet';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Map, Target } from 'lucide-react';
import { cellToBoundary } from 'h3-js';

import { 
  GeoForecastingEngine, 
  type GeoForecastResult, 
  type H3CellForecast,
  type ForecastMetrics 
} from '@/lib/geo-forecasting';

// Forecast visualization component
interface ForecastMapProps {
  forecasts: H3CellForecast[];
  showCurrent: boolean;
  selectedRiskLevel?: 'low' | 'medium' | 'high';
}

function ForecastMap({ forecasts, showCurrent, selectedRiskLevel }: ForecastMapProps) {
  const filteredForecasts = useMemo(() => {
    return forecasts.filter(f => 
      !selectedRiskLevel || f.riskLevel === selectedRiskLevel
    );
  }, [forecasts, selectedRiskLevel]);

  // Create H3 visualization data
  const hexagons = useMemo(() => {
    return filteredForecasts.map((forecast, index) => {
      const value = showCurrent ? forecast.currentTransactions : forecast.predictedTransactions;
      const maxValue = Math.max(...forecasts.map(f => 
        showCurrent ? f.currentTransactions : f.predictedTransactions
      ));
      
      const intensity = maxValue > 0 ? value / maxValue : 0;
      
      return {
        id: forecast.h3Index,
        forecast,
        value,
        intensity,
        x: (index % 8) * 12.5, // Grid layout percentage
        y: Math.floor(index / 8) * 20 // Grid layout percentage
      };
    });
  }, [filteredForecasts, showCurrent, forecasts]);

  return (
    <div className="relative w-full h-[500px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border overflow-hidden">
      {/* Map placeholder with grid visualization */}
      <div className="absolute inset-0 p-4">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300">
            نقشه H3 {showCurrent ? 'فعلی' : 'پیش‌بینی شده'} - شهر تبریز
          </h3>
          <p className="text-xs text-slate-500">
            {filteredForecasts.length} سلول H3 • {forecasts.length} کل سلول‌ها
          </p>
        </div>
        
        {/* Hexagon grid visualization */}
        <div className="relative w-full h-full">
          {hexagons.map((hex) => (
            <div
              key={hex.id}
              className="absolute group cursor-pointer transform transition-all hover:scale-110"
              style={{
                left: `${hex.x}%`,
                top: `${hex.y}%`,
                width: '40px',
                height: '40px'
              }}
            >
              <div
                className={`w-full h-full rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all
                  ${hex.forecast.trend === 'surge' ? 'bg-green-500/80 border-green-600 text-white' : 
                    hex.forecast.trend === 'decline' ? 'bg-red-500/80 border-red-600 text-white' : 
                    'bg-blue-500/80 border-blue-600 text-white'}
                `}
                style={{
                  opacity: 0.5 + hex.intensity * 0.5
                }}
              >
                {Math.round(hex.value / 1000)}K
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-black/90 text-white text-xs rounded-lg p-3 whitespace-nowrap" dir="rtl">
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {showCurrent ? 'تراکنش فعلی' : 'پیش‌بینی تراکنش'}: {hex.value.toLocaleString()}
                    </div>
                    <div className="text-xs opacity-80">
                      روند: {hex.forecast.trend === 'surge' ? 'رشد' : 
                              hex.forecast.trend === 'decline' ? 'کاهش' : 'پایدار'} |
                      ریسک: {hex.forecast.riskLevel === 'high' ? 'بالا' :
                               hex.forecast.riskLevel === 'medium' ? 'متوسط' : 'پایین'}
                    </div>
                    <div className="text-xs opacity-80">
                      دقت: {(hex.forecast.forecastAccuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs opacity-70 border-t border-white/20 pt-1">
                      باند اطمینان: {hex.forecast.confidenceLower.toFixed(0)} - {hex.forecast.confidenceUpper.toFixed(0)}
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Map overlay with Tabriz districts */}
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 space-y-1">
          <div>🏙️ مناطق شهر تبریز</div>
          <div>📍 مرکز شهر • شهرک صداقت • میدان ساعت</div>
          <div>🏬 بازار تبریز • ائل گلی • دانشگاه</div>
        </div>
        
        {/* Scale indicator */}
        <div className="absolute bottom-4 right-4 text-xs text-slate-500">
          <div>مقیاس: 1 سلول H3 ≈ 200m²</div>
        </div>
      </div>
    </div>
  );
}

// Main geo-forecast dashboard component
export function GeoForecastDashboard() {
  const [forecastEngine] = useState(() => new GeoForecastingEngine(9));
  const [forecastResult, setForecastResult] = useState<GeoForecastResult | null>(null);
  const [metrics, setMetrics] = useState<ForecastMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'current' | 'forecast' | 'comparison'>('forecast');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Initialize with sample data
  useEffect(() => {
    const initializeForecasting = async () => {
      setLoading(true);
      try {
        console.log('🗺️  Initializing geo-forecasting with sample data...');
        
        // Generate sample historical data
        const sampleData = forecastEngine.generateSampleData();
        forecastEngine.processRawData(sampleData);
        
        // Generate forecast
        const result = await forecastEngine.generateMonthlyForecast();
        setForecastResult(result);
        
        // Calculate sample metrics (in real app, use historical validation)
        const sampleMetrics = forecastEngine.calculateAccuracyMetrics(
          [100, 150, 120, 180, 200],
          [105, 145, 125, 175, 195]
        );
        setMetrics(sampleMetrics);
        
        console.log(`📊 Generated forecast for ${result.forecasts.length} H3 cells`);
        console.log(`🎯 Hotspots: ${result.overallTrend.hotspots.length}, Coldspots: ${result.overallTrend.coldspots.length}`);
        
      } catch (error) {
        console.error('❌ Error initializing geo-forecasting:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeForecasting();
  }, [forecastEngine]);

  if (loading) {
    return (
      <Card className="w-full" data-testid="geo-forecast-loading">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="text-sm text-muted-foreground">در حال تولید پیش‌بینی جغرافیایی...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecastResult) {
    return (
      <Card className="w-full" data-testid="geo-forecast-error">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-muted-foreground">
            خطا در بارگذاری داده‌های پیش‌بینی
          </div>
        </CardContent>
      </Card>
    );
  }

  const { forecasts, overallTrend } = forecastResult;

  // Risk distribution data for charts
  const riskDistribution = [
    { name: 'کم‌ریسک', value: forecasts.filter(f => f.riskLevel === 'low').length, fill: '#22c55e' },
    { name: 'متوسط', value: forecasts.filter(f => f.riskLevel === 'medium').length, fill: '#f59e0b' },
    { name: 'پرریسک', value: forecasts.filter(f => f.riskLevel === 'high').length, fill: '#ef4444' }
  ];

  const trendData = [
    { name: 'رشد', value: forecasts.filter(f => f.trend === 'surge').length, fill: '#22c55e' },
    { name: 'پایدار', value: forecasts.filter(f => f.trend === 'stable').length, fill: '#6b7280' },
    { name: 'کاهش', value: forecasts.filter(f => f.trend === 'decline').length, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-6" data-testid="geo-forecast-dashboard">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="heading-geo-forecast">
            پیش‌بینی جغرافیایی
          </h2>
          <p className="text-muted-foreground">
            تحلیل پیش‌بینی تراکنش‌های ماه آینده بر پایه شبکه H3
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-48" data-testid="select-view-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">نقشه فعلی</SelectItem>
              <SelectItem value="forecast">پیش‌بینی ماه آینده</SelectItem>
              <SelectItem value="comparison">مقایسه</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRisk} onValueChange={(value: any) => setSelectedRisk(value)}>
            <SelectTrigger className="w-36" data-testid="select-risk-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه ریسک‌ها</SelectItem>
              <SelectItem value="low">کم‌ریسک</SelectItem>
              <SelectItem value="medium">متوسط</SelectItem>
              <SelectItem value="high">پرریسک</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-forecast">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل پیش‌بینی</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-predicted">
              {overallTrend.totalPredicted.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {overallTrend.changePercent > 0 ? '+' : ''}{overallTrend.changePercent.toFixed(1)}% نسبت به ماه جاری
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-hotspots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نقاط داغ</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-hotspots-count">
              {overallTrend.hotspots.length}
            </div>
            <p className="text-xs text-muted-foreground">
              مناطق با رشد بالای تراکنش
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-coldspots">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نقاط سرد</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-coldspots-count">
              {overallTrend.coldspots.length}
            </div>
            <p className="text-xs text-muted-foreground">
              مناطق با کاهش تراکنش
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-accuracy">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">دقت مدل</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-model-accuracy">
              {metrics ? (metrics.accuracy).toFixed(1) : '85.2'}%
            </div>
            <Progress 
              value={metrics ? metrics.accuracy : 85.2} 
              className="mt-2" 
              data-testid="progress-model-accuracy"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map Visualization */}
        <Card className="lg:col-span-2" data-testid="card-forecast-map">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              نقشه پیش‌بینی H3
              <Badge variant="outline" className="ml-auto">
                {forecasts.length} سلول
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastMap 
              forecasts={forecasts}
              showCurrent={selectedView === 'current'}
              selectedRiskLevel={selectedRisk === 'all' ? undefined : selectedRisk as 'low' | 'medium' | 'high'}
            />
            
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>رشد</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>پایدار</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>کاهش</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Panel */}
        <div className="space-y-4">
          {/* Risk Distribution */}
          <Card data-testid="card-risk-distribution">
            <CardHeader>
              <CardTitle className="text-base">توزیع ریسک</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card data-testid="card-trend-analysis">
            <CardHeader>
              <CardTitle className="text-base">تحلیل روند</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Hotspots */}
          <Card data-testid="card-top-hotspots">
            <CardHeader>
              <CardTitle className="text-base">برترین نقاط داغ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overallTrend.hotspots.slice(0, 5).map((hotspot, index) => (
                <div 
                  key={hotspot.h3Index}
                  className="flex items-center justify-between p-2 bg-muted rounded"
                  data-testid={`hotspot-item-${index}`}
                >
                  <div className="text-sm">
                    #{index + 1}
                  </div>
                  <div className="text-sm font-mono">
                    +{(hotspot.predictedTransactions - hotspot.currentTransactions).toLocaleString()}
                  </div>
                  <Badge variant="default" className="text-xs">
                    {(hotspot.forecastAccuracy * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}