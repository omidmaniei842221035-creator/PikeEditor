import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, TrendingDown, Minus, MapPin, Target, Lightbulb, BarChart3 } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from "recharts";

interface AreaForecast {
  areaId: string;
  areaName: string;
  currentSales: number;
  forecastedSales: number;
  growthRate: number;
  newCustomerPotential: number;
  trend: 'growing' | 'stable' | 'declining';
  monthlyPredictions: { month: string; value: number }[];
}

interface ExpansionSuggestion {
  location: { lat: number; lng: number };
  areaName: string;
  potentialScore: number;
  estimatedRevenue: number;
  nearbyCustomers: number;
  reasoning: string[];
}

interface ForecastResult {
  areaForecasts: AreaForecast[];
  expansionSuggestions: ExpansionSuggestion[];
  overallGrowth: number;
  confidence: number;
}

export function AIForecasting() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [horizonMonths, setHorizonMonths] = useState(3);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AreaForecast | null>(null);

  const { data: forecastData, isLoading, refetch } = useQuery<ForecastResult>({
    queryKey: ['/api/ai/forecast', horizonMonths],
    queryFn: async () => {
      const response = await fetch(`/api/ai/forecast?horizon=${horizonMonths}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      return response.json();
    },
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

      const map = L.map(mapRef.current).setView([38.0792, 46.2887], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = { map, markers: [] };
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
    if (!isMapReady || !mapInstanceRef.current || !forecastData) return;

    const L = (window as any).L;
    const { map, markers } = mapInstanceRef.current;

    markers.forEach((m: any) => m.remove());
    mapInstanceRef.current.markers = [];

    forecastData.expansionSuggestions.forEach((suggestion, index) => {
      const marker = L.marker([suggestion.location.lat, suggestion.location.lng], {
        icon: L.divIcon({
          className: 'expansion-marker',
          html: `<div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">${index + 1}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map);

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; min-width: 220px;">
          <h4 style="margin: 0 0 8px 0; color: #3b82f6;">پیشنهاد گسترش #${index + 1}</h4>
          <p><strong>امتیاز پتانسیل:</strong> ${suggestion.potentialScore}</p>
          <p><strong>مشتریان نزدیک:</strong> ${suggestion.nearbyCustomers}</p>
          <p><strong>درآمد تخمینی:</strong> ${(suggestion.estimatedRevenue / 1000000).toFixed(1)} میلیون تومان/سال</p>
          <hr style="margin: 8px 0;"/>
          <p style="font-size: 0.85em; color: #666;">${suggestion.reasoning.join(' • ')}</p>
        </div>
      `);

      mapInstanceRef.current.markers.push(marker);
    });

    if (forecastData.expansionSuggestions.length > 0) {
      const bounds = L.latLngBounds(
        forecastData.expansionSuggestions.map(s => [s.location.lat, s.location.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [isMapReady, forecastData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'growing': return 'text-green-600 dark:text-green-400';
      case 'declining': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const chartData = forecastData?.areaForecasts.map(area => ({
    name: area.areaName,
    current: area.currentSales / 1000000,
    forecast: area.forecastedSales / 1000000,
    growth: area.growthRate
  })) || [];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            پیش‌بینی هوشمند فروش
          </h2>
          <p className="text-muted-foreground mt-1">
            پیش‌بینی فروش و شناسایی مناطق مناسب برای گسترش کسب‌وکار
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">افق پیش‌بینی:</span>
            <Select 
              value={horizonMonths.toString()} 
              onValueChange={(v) => setHorizonMonths(parseInt(v))}
            >
              <SelectTrigger className="w-28" data-testid="select-horizon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 6, 9, 12].map(n => (
                  <SelectItem key={n} value={n.toString()}>{n} ماه</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            data-testid="button-refresh-forecast"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {forecastData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رشد کلی</p>
                  <p className={`text-2xl font-bold ${forecastData.overallGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {forecastData.overallGrowth >= 0 ? '+' : ''}{forecastData.overallGrowth}%
                  </p>
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
                  <p className="text-sm text-muted-foreground">مناطق رو به رشد</p>
                  <p className="text-2xl font-bold">
                    {forecastData.areaForecasts.filter(a => a.trend === 'growing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">پیشنهاد گسترش</p>
                  <p className="text-2xl font-bold">{forecastData.expansionSuggestions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">دقت پیش‌بینی</p>
                  <p className="text-2xl font-bold">{Math.round(forecastData.confidence * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>مقایسه فروش فعلی و پیش‌بینی شده</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                داده‌ای برای نمایش وجود ندارد
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${v}M`} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(1)} میلیون تومان`]}
                    labelStyle={{ direction: 'rtl' }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="فروش فعلی" fill="#94a3b8" />
                  <Bar dataKey="forecast" name="پیش‌بینی" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              مناطق پیشنهادی برای گسترش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="h-[300px] rounded-lg border"
              data-testid="map-forecast"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>پیش‌بینی به تفکیک منطقه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : forecastData?.areaForecasts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                داده کافی برای پیش‌بینی وجود ندارد
              </p>
            ) : (
              forecastData?.areaForecasts.map((area) => (
                <div 
                  key={area.areaId}
                  className={`p-4 rounded-lg border hover-elevate cursor-pointer ${selectedArea?.areaId === area.areaId ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedArea(selectedArea?.areaId === area.areaId ? null : area)}
                  data-testid={`forecast-area-${area.areaId}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold flex items-center gap-2">
                      {getTrendIcon(area.trend)}
                      {area.areaName}
                    </span>
                    <Badge className={`${area.growthRate >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {area.growthRate >= 0 ? '+' : ''}{area.growthRate}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>فعلی: {(area.currentSales / 1000000).toFixed(1)}M</div>
                    <div>پیش‌بینی: {(area.forecastedSales / 1000000).toFixed(1)}M</div>
                    <div className="col-span-2">پتانسیل مشتری جدید: {area.newCustomerPotential} نفر</div>
                  </div>
                  
                  {selectedArea?.areaId === area.areaId && area.monthlyPredictions.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">پیش‌بینی ماهانه:</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={area.monthlyPredictions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: any) => [`${(v/1000000).toFixed(1)}M تومان`]} />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              پیشنهادات گسترش کسب‌وکار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : forecastData?.expansionSuggestions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                پیشنهاد گسترش یافت نشد
              </p>
            ) : (
              forecastData?.expansionSuggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg border bg-gradient-to-l from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950"
                  data-testid={`expansion-suggestion-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      {suggestion.areaName}
                    </span>
                    <Badge variant="secondary">امتیاز: {suggestion.potentialScore}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                    <div>مشتریان نزدیک: {suggestion.nearbyCustomers}</div>
                    <div>درآمد تخمینی: {(suggestion.estimatedRevenue / 1000000).toFixed(1)}M/سال</div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                    {suggestion.reasoning.join(' • ')}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
