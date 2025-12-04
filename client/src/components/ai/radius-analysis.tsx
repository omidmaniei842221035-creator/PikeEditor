import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, MapPin, Users, AlertTriangle, CheckCircle, Target, Navigation } from "lucide-react";

interface ServicePointAnalysis {
  id: string;
  name: string;
  type: 'branch' | 'banking_unit';
  location: { lat: number; lng: number };
  coverageRadius: number;
  customersInRadius: number;
  totalRevenue: number;
  coverageEfficiency: number;
}

interface UncoveredCustomer {
  customerId: string;
  shopName: string;
  location: { lat: number; lng: number };
  nearestServicePoint: {
    id: string;
    name: string;
    distance: number;
  };
  monthlyProfit: number;
}

interface CoverageStats {
  totalCustomers: number;
  coveredCustomers: number;
  uncoveredCustomers: number;
  coveragePercentage: number;
  avgDistanceToService: number;
  maxDistanceToService: number;
}

interface SuggestedLocation {
  location: { lat: number; lng: number };
  score: number;
  potentialCustomers: number;
  estimatedRevenue: number;
  reasoning: string;
}

interface RadiusAnalysisResult {
  servicePoints: ServicePointAnalysis[];
  uncoveredCustomers: UncoveredCustomer[];
  coverageStats: CoverageStats;
  suggestedLocations: SuggestedLocation[];
}

export function RadiusAnalysis() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [radius, setRadius] = useState(5);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showCoverageCircles, setShowCoverageCircles] = useState(true);
  const [showUncoveredCustomers, setShowUncoveredCustomers] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const { data: radiusData, isLoading, refetch } = useQuery<RadiusAnalysisResult>({
    queryKey: ['/api/ai/radius', radius],
    queryFn: async () => {
      const response = await fetch(`/api/ai/radius?radius=${radius}`);
      if (!response.ok) throw new Error('Failed to fetch radius analysis');
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

      mapInstanceRef.current = { map, markers: [], circles: [], lines: [] };
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
    if (!isMapReady || !mapInstanceRef.current || !radiusData) return;

    const L = (window as any).L;
    const { map, markers, circles, lines } = mapInstanceRef.current;

    markers.forEach((m: any) => m.remove());
    circles.forEach((c: any) => c.remove());
    lines.forEach((l: any) => l.remove());
    mapInstanceRef.current.markers = [];
    mapInstanceRef.current.circles = [];
    mapInstanceRef.current.lines = [];

    radiusData.servicePoints.forEach((sp) => {
      const color = sp.type === 'branch' ? '#3b82f6' : '#8b5cf6';
      const icon = sp.type === 'branch' ? '🏦' : '🏪';
      
      const marker = L.marker([sp.location.lat, sp.location.lng], {
        icon: L.divIcon({
          className: 'service-point-marker',
          html: `<div style="background-color: ${color}; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">${icon}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map);

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: ${color};">${sp.name}</h4>
          <p><strong>نوع:</strong> ${sp.type === 'branch' ? 'شعبه' : 'واحد بانکی'}</p>
          <p><strong>شعاع پوشش:</strong> ${sp.coverageRadius} کیلومتر</p>
          <p><strong>مشتریان در محدوده:</strong> ${sp.customersInRadius}</p>
          <p><strong>درآمد:</strong> ${(sp.totalRevenue / 1000000).toFixed(1)} میلیون تومان</p>
          <p><strong>کارایی پوشش:</strong> ${sp.coverageEfficiency}%</p>
        </div>
      `);

      mapInstanceRef.current.markers.push(marker);

      if (showCoverageCircles) {
        const circle = L.circle([sp.location.lat, sp.location.lng], {
          radius: sp.coverageRadius * 1000,
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2
        }).addTo(map);
        mapInstanceRef.current.circles.push(circle);
      }
    });

    if (showUncoveredCustomers) {
      radiusData.uncoveredCustomers.forEach((customer) => {
        const marker = L.circleMarker([customer.location.lat, customer.location.lng], {
          radius: 6,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
          <div style="direction: rtl; text-align: right;">
            <strong style="color: #ef4444;">${customer.shopName}</strong><br/>
            <span>بدون پوشش</span><br/>
            <span>نزدیک‌ترین: ${customer.nearestServicePoint.name}</span><br/>
            <span>فاصله: ${customer.nearestServicePoint.distance.toFixed(1)} کیلومتر</span><br/>
            <span>سود ماهانه: ${(customer.monthlyProfit / 1000000).toFixed(1)}M تومان</span>
          </div>
        `);

        mapInstanceRef.current.markers.push(marker);

        const servicePoint = radiusData.servicePoints.find(sp => sp.id === customer.nearestServicePoint.id);
        if (servicePoint) {
          const line = L.polyline([
            [customer.location.lat, customer.location.lng],
            [servicePoint.location.lat, servicePoint.location.lng]
          ], {
            color: '#ef4444',
            weight: 1,
            opacity: 0.4,
            dashArray: '5, 5'
          }).addTo(map);
          mapInstanceRef.current.lines.push(line);
        }
      });
    }

    if (showSuggestions) {
      radiusData.suggestedLocations.forEach((suggestion, index) => {
        const marker = L.marker([suggestion.location.lat, suggestion.location.lng], {
          icon: L.divIcon({
            className: 'suggestion-marker',
            html: `<div style="background: linear-gradient(135deg, #10b981, #059669); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: pulse 2s infinite;">⭐</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(map);

        marker.bindPopup(`
          <div style="direction: rtl; text-align: right; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #10b981;">پیشنهاد شعبه جدید #${index + 1}</h4>
            <p><strong>امتیاز:</strong> ${suggestion.score}</p>
            <p><strong>مشتریان پتانسیل:</strong> ${suggestion.potentialCustomers}</p>
            <p><strong>درآمد تخمینی:</strong> ${(suggestion.estimatedRevenue / 1000000).toFixed(1)}M/سال</p>
            <p style="font-size: 0.85em; color: #666;">${suggestion.reasoning}</p>
          </div>
        `);

        mapInstanceRef.current.markers.push(marker);

        const suggestionCircle = L.circle([suggestion.location.lat, suggestion.location.lng], {
          radius: radius * 1000,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.05,
          weight: 2,
          dashArray: '10, 5'
        }).addTo(map);
        mapInstanceRef.current.circles.push(suggestionCircle);
      });
    }

    const allPoints = [
      ...radiusData.servicePoints.map(sp => [sp.location.lat, sp.location.lng]),
      ...radiusData.uncoveredCustomers.slice(0, 10).map(c => [c.location.lat, c.location.lng]),
      ...radiusData.suggestedLocations.map(s => [s.location.lat, s.location.lng])
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [isMapReady, radiusData, showCoverageCircles, showUncoveredCustomers, showSuggestions]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Navigation className="h-6 w-6 text-primary" />
            تحلیل شعاع دسترسی
          </h2>
          <p className="text-muted-foreground mt-1">
            بررسی پوشش خدمات و فاصله مشتریان تا نقاط خدمات‌رسانی
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">شعاع پوشش:</span>
            <div className="w-32 flex items-center gap-2">
              <Slider
                value={[radius]}
                onValueChange={([v]) => setRadius(v)}
                min={1}
                max={20}
                step={1}
                data-testid="slider-radius"
              />
              <span className="text-sm font-medium w-12">{radius} km</span>
            </div>
          </div>
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            data-testid="button-refresh-radius"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {radiusData?.coverageStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">کل مشتریان</p>
                  <p className="text-xl font-bold">{radiusData.coverageStats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">تحت پوشش</p>
                  <p className="text-xl font-bold">{radiusData.coverageStats.coveredCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">بدون پوشش</p>
                  <p className="text-xl font-bold">{radiusData.coverageStats.uncoveredCustomers}</p>
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
                  <p className="text-xs text-muted-foreground">درصد پوشش</p>
                  <p className="text-xl font-bold">{radiusData.coverageStats.coveragePercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Navigation className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">میانگین فاصله</p>
                  <p className="text-xl font-bold">{radiusData.coverageStats.avgDistanceToService} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">بیشترین فاصله</p>
                  <p className="text-xl font-bold">{radiusData.coverageStats.maxDistanceToService} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-6 flex-wrap p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Switch
            checked={showCoverageCircles}
            onCheckedChange={setShowCoverageCircles}
            data-testid="switch-coverage-circles"
          />
          <span className="text-sm">نمایش محدوده پوشش</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={showUncoveredCustomers}
            onCheckedChange={setShowUncoveredCustomers}
            data-testid="switch-uncovered"
          />
          <span className="text-sm">نمایش مشتریان بدون پوشش</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={showSuggestions}
            onCheckedChange={setShowSuggestions}
            data-testid="switch-suggestions"
          />
          <span className="text-sm">نمایش پیشنهادات</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                نقشه پوشش خدمات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapRef} 
                className="h-[500px] rounded-lg border"
                data-testid="map-radius"
              />
              <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500" />
                  <span>شعبه</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-500" />
                  <span>واحد بانکی</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-500" />
                  <span>مشتری بدون پوشش</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-green-500" />
                  <span>پیشنهاد شعبه جدید</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                پیشنهاد مکان جدید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[220px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : radiusData?.suggestedLocations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  پیشنهادی یافت نشد
                </p>
              ) : (
                radiusData?.suggestedLocations.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border bg-green-50 dark:bg-green-950"
                    data-testid={`suggestion-${index}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">پیشنهاد #{index + 1}</span>
                      <Badge variant="secondary" className="text-xs">امتیاز: {suggestion.score}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>{suggestion.potentialCustomers} مشتری • {(suggestion.estimatedRevenue / 1000000).toFixed(1)}M/سال</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                مشتریان بدون پوشش
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[220px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : radiusData?.uncoveredCustomers.length === 0 ? (
                <p className="text-center text-green-600 py-4 text-sm">
                  همه مشتریان تحت پوشش هستند
                </p>
              ) : (
                radiusData?.uncoveredCustomers.slice(0, 10).map((customer, index) => (
                  <div 
                    key={index}
                    className="p-2 rounded-lg border text-sm"
                    data-testid={`uncovered-customer-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{customer.shopName}</span>
                      <Badge variant="destructive" className="text-xs">
                        {customer.nearestServicePoint.distance.toFixed(1)} km
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      نزدیک‌ترین: {customer.nearestServicePoint.name}
                    </p>
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
