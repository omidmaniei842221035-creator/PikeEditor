import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Maximize2, Minimize2, Target, AlertTriangle, TrendingDown, Radar, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Customer {
  id: string;
  shopName: string;
  ownerName: string;
  businessType: string;
  latitude: string | null;
  longitude: string | null;
  monthlyProfit: number;
  status: string;
  address?: string;
  phone?: string;
}

// Inject styles once globally
const STYLE_ID = "loss-radar-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes loss-radar-pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
    }
    @keyframes loss-radar-ring {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
    .loss-device-marker {
      background: transparent !important;
      border: none !important;
    }
  `;
  document.head.appendChild(style);
}

export function LossRadarFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [radarEnabled, setRadarEnabled] = useState(true);
  const [radarRadius, setRadarRadius] = useState([50]);
  const [selectedLossDevice, setSelectedLossDevice] = useState<Customer | null>(null);
  const [filterThreshold, setFilterThreshold] = useState<string>("all");
  const [animationSpeed, setAnimationSpeed] = useState([2]);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radarSweepRef = useRef<L.Polygon | null>(null);
  const animationRef = useRef<number | null>(null);
  const angleRef = useRef(0);
  const radarRadiusRef = useRef(radarRadius[0]);
  const animationSpeedRef = useRef(animationSpeed[0]);

  // Keep refs in sync with state
  useEffect(() => {
    radarRadiusRef.current = radarRadius[0];
  }, [radarRadius]);

  useEffect(() => {
    animationSpeedRef.current = animationSpeed[0];
  }, [animationSpeed]);

  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const lossDevices = useMemo(() => {
    let filtered = customers.filter(c => 
      c.status === "loss" && 
      c.latitude && 
      c.longitude
    );
    
    if (filterThreshold === "high") {
      filtered = filtered.filter(c => c.monthlyProfit < -5000000);
    } else if (filterThreshold === "medium") {
      filtered = filtered.filter(c => c.monthlyProfit >= -5000000 && c.monthlyProfit < -1000000);
    } else if (filterThreshold === "low") {
      filtered = filtered.filter(c => c.monthlyProfit >= -1000000);
    }
    
    return filtered;
  }, [customers, filterThreshold]);

  const allDevicesWithCoords = useMemo(() => {
    return customers.filter(c => c.latitude && c.longitude);
  }, [customers]);

  const centerLat = 38.0800;
  const centerLng = 46.2919;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    radarLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    
    mapRef.current = map;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw radar circles
  useEffect(() => {
    if (!mapRef.current || !radarLayerRef.current) return;

    radarLayerRef.current.clearLayers();

    if (!radarEnabled) return;

    const radiusKm = radarRadius[0];
    const circleCount = 5;
    
    for (let i = 1; i <= circleCount; i++) {
      const circleRadius = (radiusKm / circleCount) * i * 1000;
      L.circle([centerLat, centerLng], {
        radius: circleRadius,
        color: "#22c55e",
        weight: 1,
        opacity: 0.4,
        fill: false,
        dashArray: "5, 5",
      }).addTo(radarLayerRef.current!);
    }

    const lineLength = radiusKm * 1000;
    const lines = [
      [[centerLat, centerLng - lineLength / 111320], [centerLat, centerLng + lineLength / 111320]],
      [[centerLat - lineLength / 111320, centerLng], [centerLat + lineLength / 111320, centerLng]],
    ];

    lines.forEach(coords => {
      L.polyline(coords as L.LatLngExpression[], {
        color: "#22c55e",
        weight: 1,
        opacity: 0.3,
        dashArray: "3, 3",
      }).addTo(radarLayerRef.current!);
    });

  }, [radarEnabled, radarRadius]);

  // Animate radar sweep using refs only (no state updates per frame)
  useEffect(() => {
    if (!mapRef.current || !radarLayerRef.current || !radarEnabled) {
      if (radarSweepRef.current && radarLayerRef.current) {
        radarLayerRef.current.removeLayer(radarSweepRef.current);
        radarSweepRef.current = null;
      }
      return;
    }

    const animate = () => {
      angleRef.current = (angleRef.current + animationSpeedRef.current) % 360;

      if (radarSweepRef.current && radarLayerRef.current) {
        radarLayerRef.current.removeLayer(radarSweepRef.current);
      }

      const radiusKm = radarRadiusRef.current;
      const radiusMeters = radiusKm * 1000;
      const sweepWidth = 30;
      const angle = angleRef.current;

      const points: L.LatLngExpression[] = [[centerLat, centerLng]];
      for (let i = 0; i <= sweepWidth; i += 2) {
        const currentAngle = ((angle - i) * Math.PI) / 180;
        const lat = centerLat + (radiusMeters / 111320) * Math.cos(currentAngle);
        const lng = centerLng + (radiusMeters / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(currentAngle);
        points.push([lat, lng]);
      }

      if (radarLayerRef.current) {
        radarSweepRef.current = L.polygon(points, {
          color: "#22c55e",
          fillColor: "#22c55e",
          fillOpacity: 0.15,
          weight: 0,
        }).addTo(radarLayerRef.current);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [radarEnabled]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    allDevicesWithCoords.forEach(device => {
      if (device.status !== "loss") {
        const lat = parseFloat(device.latitude!);
        const lng = parseFloat(device.longitude!);
        
        const color = device.status === "active" ? "#22c55e" : 
                      device.status === "marketing" ? "#eab308" : 
                      device.status === "collected" ? "#3b82f6" : "#6b7280";

        L.circleMarker([lat, lng], {
          radius: 4,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.6,
          fillOpacity: 0.4,
        }).addTo(markersLayerRef.current!);
      }
    });

    lossDevices.forEach(device => {
      const lat = parseFloat(device.latitude!);
      const lng = parseFloat(device.longitude!);
      
      const pulseHtml = `
        <div class="loss-marker-container" data-testid="marker-loss-${device.id}" style="position: relative; width: 40px; height: 40px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #ef4444 0%, #dc2626 50%, #b91c1c 100%);
            border-radius: 50%;
            box-shadow: 0 0 20px #ef4444, 0 0 40px #ef444480;
            animation: loss-radar-pulse 1.5s ease-in-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border: 2px solid #ef4444;
            border-radius: 50%;
            animation: loss-radar-ring 1.5s ease-out infinite;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        html: pulseHtml,
        className: "loss-device-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(`
          <div dir="rtl" style="text-align: right; min-width: 200px;" data-testid="popup-loss-device-${device.id}">
            <div style="font-weight: bold; color: #dc2626; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 18px;">&#x26A0;</span>
              <span data-testid="popup-title-${device.id}">دستگاه زیان‌ده شناسایی شد</span>
            </div>
            <div style="border-top: 1px solid #fee2e2; padding-top: 8px;">
              <p style="margin: 4px 0;" data-testid="popup-shop-${device.id}"><strong>فروشگاه:</strong> ${device.shopName}</p>
              <p style="margin: 4px 0;" data-testid="popup-owner-${device.id}"><strong>مالک:</strong> ${device.ownerName}</p>
              <p style="margin: 4px 0;" data-testid="popup-type-${device.id}"><strong>نوع:</strong> ${device.businessType}</p>
              <p style="margin: 4px 0; color: #dc2626;" data-testid="popup-loss-${device.id}"><strong>زیان ماهانه:</strong> ${Math.abs(device.monthlyProfit).toLocaleString()} تومان</p>
            </div>
          </div>
        `)
        .addTo(markersLayerRef.current!);

      marker.on("click", () => {
        setSelectedLossDevice(device);
      });
    });

  }, [allDevicesWithCoords, lossDevices]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);
  const handleReset = useCallback(() => {
    mapRef.current?.setView([centerLat, centerLng], 12);
  }, []);

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-background" 
    : "relative h-[600px] rounded-xl overflow-hidden";

  return (
    <div className="mb-12" dir="rtl" data-testid="loss-radar-section">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-red-600 bg-clip-text text-transparent" data-testid="title-loss-radar">
          رادار شناسایی دستگاه‌های زیان‌ده
        </h2>
        <p className="text-lg text-muted-foreground mt-3" data-testid="subtitle-loss-radar">
          اسکن هوشمند و شناسایی آنی دستگاه‌های POS با عملکرد منفی
        </p>
        <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-orange-500 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className={containerClass} data-testid="loss-radar-container">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 z-0"
          data-testid="loss-radar-map"
        />

        {radarEnabled && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-4 left-4 flex items-center gap-2" dir="ltr">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 font-mono text-sm" data-testid="text-scanning">SCANNING...</span>
            </div>
          </div>
        )}

        <Card className="absolute top-4 right-4 z-20 w-72 bg-background/95 backdrop-blur-sm" data-testid="card-radar-control">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Radar className="w-5 h-5 text-red-500" />
              <span>پنل کنترل رادار</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="radar-toggle" className="text-sm">فعال‌سازی رادار</Label>
              <Switch
                id="radar-toggle"
                checked={radarEnabled}
                onCheckedChange={setRadarEnabled}
                data-testid="switch-radar-toggle"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">شعاع اسکن: {radarRadius[0]} کیلومتر</Label>
              <Slider
                value={radarRadius}
                onValueChange={setRadarRadius}
                min={10}
                max={100}
                step={5}
                disabled={!radarEnabled}
                data-testid="slider-radar-radius"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">سرعت اسکن</Label>
              <Slider
                value={animationSpeed}
                onValueChange={setAnimationSpeed}
                min={0.5}
                max={5}
                step={0.5}
                disabled={!radarEnabled}
                data-testid="slider-animation-speed"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">فیلتر شدت زیان</Label>
              <Select value={filterThreshold} onValueChange={setFilterThreshold}>
                <SelectTrigger data-testid="select-loss-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه موارد</SelectItem>
                  <SelectItem value="high">زیان بالا (بیش از 5 میلیون)</SelectItem>
                  <SelectItem value="medium">زیان متوسط (1-5 میلیون)</SelectItem>
                  <SelectItem value="low">زیان کم (کمتر از 1 میلیون)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="absolute bottom-4 right-4 z-20 bg-background/95 backdrop-blur-sm" data-testid="card-radar-stats">
          <CardContent className="p-4">
            <div className="flex items-center gap-6" dir="ltr">
              <div className="text-center">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-2xl font-bold" data-testid="text-loss-count">{lossDevices.length}</span>
                </div>
                <span className="text-xs text-muted-foreground">دستگاه زیان‌ده</span>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-2xl font-bold" data-testid="text-total-loss">
                    {Math.abs(lossDevices.reduce((sum, d) => sum + d.monthlyProfit, 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">زیان کل (تومان)</span>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-2xl font-bold" data-testid="text-all-devices">{allDevicesWithCoords.length}</span>
                </div>
                <span className="text-xs text-muted-foreground">کل دستگاه‌ها</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={handleZoomIn} data-testid="button-zoom-in">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomOut} data-testid="button-zoom-out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleReset} data-testid="button-reset-view">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 left-4 z-20"
          onClick={() => setIsFullscreen(!isFullscreen)}
          data-testid="button-fullscreen-toggle"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>

        {isFullscreen && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-4 left-16 z-20"
            onClick={() => setIsFullscreen(false)}
            data-testid="button-close-fullscreen"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {selectedLossDevice && (
          <Card className="absolute bottom-4 left-20 z-20 w-80 bg-background/95 backdrop-blur-sm border-red-200 dark:border-red-900" data-testid="card-selected-device">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  جزئیات دستگاه زیان‌ده
                </CardTitle>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6"
                  onClick={() => setSelectedLossDevice(null)}
                  data-testid="button-close-details"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">فروشگاه:</span>
                <span className="font-medium" data-testid="text-shop-name">{selectedLossDevice.shopName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">مالک:</span>
                <span data-testid="text-owner-name">{selectedLossDevice.ownerName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">نوع کسب‌وکار:</span>
                <Badge variant="outline" data-testid="badge-business-type">{selectedLossDevice.businessType}</Badge>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">زیان ماهانه:</span>
                <Badge variant="destructive" data-testid="badge-monthly-loss">
                  {Math.abs(selectedLossDevice.monthlyProfit).toLocaleString()} تومان
                </Badge>
              </div>
              {selectedLossDevice.address && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">آدرس:</span>
                  <p className="mt-1 text-xs" data-testid="text-address">{selectedLossDevice.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="absolute top-20 left-4 z-20 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2" data-testid="legend-radar">
          <div className="font-medium mb-2">راهنما</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span>زیان‌ده</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>کارآمد</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span>بازاریابی</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>جمع‌آوری شده</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span>غیرفعال</span>
          </div>
        </div>
      </div>
    </div>
  );
}
