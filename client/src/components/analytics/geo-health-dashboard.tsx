// Geo Health Score Dashboard Component
// Advanced location health monitoring and visualization

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MapPin, TrendingUp, TrendingDown, Activity, Shield, Building2, Zap, AlertTriangle, CheckCircle, Heart, Target } from 'lucide-react';
import geoHealthScoreEngine, { LocationHealthData, GeoHealthScore } from '@/lib/geo-health-score';
import { initializeMap, type MapInstance } from '@/lib/map-utils';

interface HealthMapProps {
  locations: LocationHealthData[];
  selectedLocation: LocationHealthData | null;
  onLocationSelect: (location: LocationHealthData) => void;
}

const HealthMap = ({ locations, selectedLocation, onLocationSelect }: HealthMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current && mounted) {
        try {
          mapInstanceRef.current = await initializeMap(mapRef.current);
          if (mounted && mapInstanceRef.current?.map) {
            setMapReady(true);
          }
        } catch (error) {
          console.error('Failed to initialize health map:', error);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current && mapInstanceRef.current.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add health markers for locations
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current?.map || typeof window === 'undefined' || !(window as any).L) {
      return;
    }

    const L = (window as any).L;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each location with health-based colors
    locations.forEach(location => {
      const isSelected = selectedLocation?.locationId === location.locationId;
      const healthColor = geoHealthScoreEngine.getHealthColor(location.score.overallScore);
      const healthEmoji = geoHealthScoreEngine.getHealthEmoji(location.score.healthStatus);
      
      const customIcon = L.divIcon({
        html: `
          <div style="
            background: ${healthColor};
            width: ${isSelected ? '32px' : '24px'};
            height: ${isSelected ? '32px' : '24px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            transform: scale(${isSelected ? 1.3 : 1});
            transition: all 0.3s ease;
            position: relative;
            z-index: ${isSelected ? '1000' : '100'};
          ">
            <span style="color: white; font-size: ${isSelected ? '16px' : '12px'};">${healthEmoji}</span>
          </div>
        `,
        iconSize: [isSelected ? 32 : 24, isSelected ? 32 : 24],
        iconAnchor: [isSelected ? 16 : 12, isSelected ? 16 : 12],
        popupAnchor: [0, isSelected ? -16 : -12],
        className: 'health-marker'
      });

      const marker = L.marker([location.coordinates[0], location.coordinates[1]], { 
        icon: customIcon 
      });

      // Health status translation helper
      const getStatusText = (status: string) => {
        switch (status) {
          case 'excellent': return 'عالی';
          case 'good': return 'خوب';
          case 'fair': return 'متوسط';
          case 'poor': return 'ضعیف';
          case 'critical': return 'بحرانی';
          default: return status;
        }
      };

      const getRiskText = (risk: string) => {
        switch (risk) {
          case 'low': return 'کم';
          case 'medium': return 'متوسط';
          case 'high': return 'زیاد';
          default: return risk;
        }
      };

      // Add popup with health information
      marker.bindPopup(`
        <div style="font-family: Vazirmatn, sans-serif; direction: rtl; min-width: 280px;">
          <div style="border-bottom: 3px solid ${healthColor}; padding-bottom: 10px; margin-bottom: 12px;">
            <h3 style="margin: 0; color: ${healthColor}; font-size: 18px; font-weight: bold; display: flex; align-items: center;">
              ${healthEmoji} ${location.name}
            </h3>
            <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">امتیاز سلامت: ${(location.score.overallScore * 100).toFixed(0)}%</p>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
              <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                <strong>🏥 وضعیت کلی:</strong><br/>
                <span style="color: ${healthColor}; font-weight: bold;">${getStatusText(location.score.healthStatus)}</span>
              </div>
              <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
                <strong>⚠️ سطح ریسک:</strong><br/>
                <span>${getRiskText(location.score.riskLevel)}</span>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 12px; font-size: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <div><strong>📈 سلامت تراکنش:</strong> ${(location.score.categoryScores.transactionHealth * 100).toFixed(0)}%</div>
              <div><strong>🏪 تنوع کسب‌وکار:</strong> ${(location.score.categoryScores.businessDiversity * 100).toFixed(0)}%</div>
              <div><strong>⚡ زیرساخت:</strong> ${(location.score.categoryScores.infrastructure * 100).toFixed(0)}%</div>
              <div><strong>🛡️ ایمنی:</strong> ${(location.score.categoryScores.riskProfile * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-top: 8px;">
            <strong style="color: #475569;">📊 آمار کلیدی:</strong>
            <div style="margin-top: 4px; font-size: 11px; color: #64748b;">
              💰 درآمد: ${(location.metrics.averageTransactionValue / 1000).toFixed(0)}K تومان | 
              📊 آپ‌تایم: ${(location.metrics.uptimePercentage * 100).toFixed(1)}% | 
              🏢 تنوع: ${location.metrics.businessTypeCount} نوع
            </div>
          </div>

          <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 11px; text-align: center;">
            کلیک برای انتخاب و مشاهده جزئیات کامل
          </p>
        </div>
      `, {
        maxWidth: 320,
        className: 'health-popup'
      });

      // Add click handler
      marker.on('click', () => {
        onLocationSelect(location);
      });

      marker.addTo(mapInstanceRef.current!.map);
      markersRef.current.push(marker);

      // Add health radius visualization for selected location
      if (isSelected && mapInstanceRef.current!.map) {
        const circle = L.circle([location.coordinates[0], location.coordinates[1]], {
          color: healthColor,
          fillColor: healthColor,
          fillOpacity: 0.1,
          radius: 800, // 800m radius
          weight: 2,
          dashArray: '8, 4'
        }).addTo(mapInstanceRef.current!.map);
        
        markersRef.current.push(circle);
      }
    });

    // Add legend control to map
    if (mapInstanceRef.current!.map) {
      const legend = L.control({ position: 'bottomright' });
      
      legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'health-legend');
        div.style.background = 'rgba(255, 255, 255, 0.95)';
        div.style.padding = '12px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
        div.style.fontFamily = 'Vazirmatn, sans-serif';
        div.style.fontSize = '12px';
        div.style.direction = 'rtl';
        
        div.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">راهنمای سلامت</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #10b981;"></div>
              <span>عالی (85%+)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #84cc16;"></div>
              <span>خوب (70-84%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #eab308;"></div>
              <span>متوسط (50-69%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #f97316;"></div>
              <span>ضعیف (30-49%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></div>
              <span>بحرانی (&lt;30%)</span>
            </div>
          </div>
        `;
        
        return div;
      };
      
      legend.addTo(mapInstanceRef.current!.map);
      markersRef.current.push({ remove: () => mapInstanceRef.current!.map.removeControl(legend) });
    }

  }, [mapReady, locations, selectedLocation]);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border shadow-lg">
      <div 
        ref={mapRef} 
        className="h-full w-full"
        data-testid="health-map"
      />
    </div>
  );
};

const LocationHealthCard = ({ location }: { location: LocationHealthData }) => {
  const radarData = [
    {
      subject: 'سلامت تراکنش',
      A: location.score.categoryScores.transactionHealth * 100,
      fullMark: 100,
    },
    {
      subject: 'تنوع کسب‌وکار',
      A: location.score.categoryScores.businessDiversity * 100,
      fullMark: 100,
    },
    {
      subject: 'زیرساخت',
      A: location.score.categoryScores.infrastructure * 100,
      fullMark: 100,
    },
    {
      subject: 'پروفایل ریسک',
      A: location.score.categoryScores.riskProfile * 100,
      fullMark: 100,
    },
    {
      subject: 'پتانسیل بازار',
      A: location.score.categoryScores.marketPotential * 100,
      fullMark: 100,
    },
  ];

  const getStatusColor = (status: GeoHealthScore['healthStatus']) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-lime-100 text-lime-800 border-lime-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getRiskColor = (riskLevel: GeoHealthScore['riskLevel']) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {location.name}
          </CardTitle>
          <Badge className={getStatusColor(location.score.healthStatus)}>
            {location.score.healthStatus === 'excellent' ? 'عالی' :
             location.score.healthStatus === 'good' ? 'خوب' :
             location.score.healthStatus === 'fair' ? 'متوسط' :
             location.score.healthStatus === 'poor' ? 'ضعیف' : 'بحرانی'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2" data-testid="text-overall-score">
            {(location.score.overallScore * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">امتیاز کلی سلامت</div>
          <Progress 
            value={location.score.overallScore * 100} 
            className="mt-2"
            data-testid="progress-health-score"
          />
        </div>

        {/* Risk and Trends */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">سطح ریسک</div>
            <Badge className={getRiskColor(location.score.riskLevel)}>
              {location.score.riskLevel === 'low' ? 'کم' :
               location.score.riskLevel === 'medium' ? 'متوسط' : 'زیاد'}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">روند کوتاه‌مدت</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getTrendIcon(location.score.trends.shortTerm)}
              <span className="text-sm">
                {location.score.trends.shortTerm === 'improving' ? 'بهبود' :
                 location.score.trends.shortTerm === 'stable' ? 'پایدار' : 'نزول'}
              </span>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">نمودار رادار سلامت</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" className="text-xs" />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                className="text-xs"
                tickCount={6}
              />
              <Radar
                name="امتیاز"
                dataKey="A"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                formatter={(value: any) => [`${Number(value).toFixed(0)}%`, 'امتیاز']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">رشد تراکنش:</div>
            <div className={`font-medium ${location.metrics.transactionGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(location.metrics.transactionGrowthRate * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">میانگین آپ‌تایم:</div>
            <div className="font-medium">
              {(location.metrics.uptimePercentage * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">تنوع کسب‌وکار:</div>
            <div className="font-medium">
              {location.metrics.businessTypeCount} نوع
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">کیفیت شبکه:</div>
            <div className="font-medium">
              {location.metrics.networkQuality.toFixed(1)}/10
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Target className="h-4 w-4" />
            توصیه‌های بهبود
          </h4>
          <div className="space-y-1">
            {location.score.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-xs p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                {rec}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HealthOverview = ({ locations }: { locations: LocationHealthData[] }) => {
  const stats = useMemo(() => {
    const total = locations.length;
    const excellent = locations.filter(l => l.score.healthStatus === 'excellent').length;
    const good = locations.filter(l => l.score.healthStatus === 'good').length;
    const fair = locations.filter(l => l.score.healthStatus === 'fair').length;
    const poor = locations.filter(l => l.score.healthStatus === 'poor').length;
    const critical = locations.filter(l => l.score.healthStatus === 'critical').length;
    
    const avgScore = locations.reduce((sum, l) => sum + l.score.overallScore, 0) / total;
    const highRisk = locations.filter(l => l.score.riskLevel === 'high').length;

    return { total, excellent, good, fair, poor, critical, avgScore, highRisk };
  }, [locations]);

  const chartData = [
    { name: 'عالی', value: stats.excellent, color: '#10b981' },
    { name: 'خوب', value: stats.good, color: '#84cc16' },
    { name: 'متوسط', value: stats.fair, color: '#eab308' },
    { name: 'ضعیف', value: stats.poor, color: '#f97316' },
    { name: 'بحرانی', value: stats.critical, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Overall Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">میانگین سلامت کلی</p>
              <p className="text-3xl font-bold text-primary" data-testid="text-avg-health">
                {(stats.avgScore * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">از {stats.total} مکان</p>
            </div>
            <Heart className="h-12 w-12 text-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* High Risk Locations */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مکان‌های پرریسک</p>
              <p className="text-3xl font-bold text-red-600" data-testid="text-high-risk">
                {stats.highRisk}
              </p>
              <p className="text-xs text-muted-foreground">نیاز به توجه فوری</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* Excellent Locations */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مکان‌های عالی</p>
              <p className="text-3xl font-bold text-green-600" data-testid="text-excellent">
                {stats.excellent}
              </p>
              <p className="text-xs text-muted-foreground">عملکرد بهینه</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Critical Locations */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مکان‌های بحرانی</p>
              <p className="text-3xl font-bold text-red-600" data-testid="text-critical">
                {stats.critical}
              </p>
              <p className="text-xs text-muted-foreground">اقدام اضطراری</p>
            </div>
            <Zap className="h-12 w-12 text-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution Chart */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>توزیع وضعیت سلامت مکان‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [value, 'تعداد مکان']}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default function GeoHealthDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<LocationHealthData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fetch data for locations
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  // Generate health data for locations
  const healthLocations = useMemo(() => {
    const locations: LocationHealthData[] = [];
    
    // Create health data from branches
    branches.forEach((branch) => {
      if (branch.latitude && branch.longitude) {
        const healthData = geoHealthScoreEngine.generateMockLocationHealthData(
          branch.id,
          branch.name,
          [parseFloat(branch.latitude), parseFloat(branch.longitude)]
        );
        locations.push(healthData);
      }
    });

    // Add some additional locations if we don't have enough
    if (locations.length < 10) {
      for (let i = locations.length; i < 10; i++) {
        const lat = 38.0742 + (Math.random() - 0.5) * 0.1;
        const lng = 46.2919 + (Math.random() - 0.5) * 0.1;
        locations.push(
          geoHealthScoreEngine.generateMockLocationHealthData(
            `loc_${i}`,
            `منطقه ${i + 1}`,
            [lat, lng]
          )
        );
      }
    }

    return locations;
  }, [branches]);

  // Filter locations based on selected filter
  const filteredLocations = useMemo(() => {
    if (selectedFilter === 'all') return healthLocations;
    if (selectedFilter === 'high-risk') return healthLocations.filter(l => l.score.riskLevel === 'high');
    if (selectedFilter === 'critical') return healthLocations.filter(l => l.score.healthStatus === 'critical');
    if (selectedFilter === 'excellent') return healthLocations.filter(l => l.score.healthStatus === 'excellent');
    return healthLocations;
  }, [healthLocations, selectedFilter]);

  return (
    <div className="space-y-8" data-testid="geo-health-dashboard">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          🏥 نمایه سلامت و امتیاز مکان‌ها (Geo Health Score)
        </h2>
        <p className="text-lg text-muted-foreground mt-3">
          ارزیابی جامع سلامت و عملکرد مکان‌های کسب‌وکار با امتیاز ۰ تا ۱
        </p>
        <div className="h-1 w-48 bg-gradient-to-r from-green-500 to-blue-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">نمایش:</label>
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48" data-testid="select-health-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه مکان‌ها</SelectItem>
            <SelectItem value="excellent">عالی</SelectItem>
            <SelectItem value="high-risk">پرریسک</SelectItem>
            <SelectItem value="critical">بحرانی</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredLocations.length} مکان
        </div>
      </div>

      {/* Overview Stats */}
      <HealthOverview locations={healthLocations} />

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">نمایش نقشه</TabsTrigger>
          <TabsTrigger value="cards">جزئیات مکان‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Interactive Health Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                نقشه تعاملی سلامت مکان‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthMap 
                locations={filteredLocations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
              />
            </CardContent>
          </Card>

          {/* Selected Location Details */}
          {selectedLocation && (
            <LocationHealthCard location={selectedLocation} />
          )}
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          {/* Location Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLocations.map(location => (
              <LocationHealthCard key={location.locationId} location={location} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}