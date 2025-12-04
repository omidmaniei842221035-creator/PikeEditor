import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Plus,
  Save,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Download,
  Settings,
  BarChart3,
  LineChart,
  PieChart,
  Map,
  Table,
  Gauge,
  Activity,
  TrendingUp,
  Clock,
  Filter,
  RefreshCw,
  Layers,
  Database,
  Monitor,
  AlertTriangle,
  Zap,
  Target,
  Brain,
  Home,
  ArrowRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import Plot from 'react-plotly.js';
import { MapLibrePanel } from './panels/maplibre-panel';
import { TimeRangePicker } from './components/time-range-picker';
import { VariableEditor } from './components/variable-editor';
import { QueryEditor } from './components/query-editor';
import { PanelEditor } from './panels/panel-editor';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface Panel {
  id: string;
  type: string;
  title: string;
  datasource: string;
  targets: any[];
  options: any;
  fieldConfig: any;
  gridPos: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface Dashboard {
  id?: string;
  uid: string;
  title: string;
  tags: string[];
  panels: Panel[];
  timeRange: {
    from: string;
    to: string;
  };
  variables: any[];
  version: number;
  organizationId?: string;
}

interface PanelType {
  id: string;
  name: string;
  icon: any;
  category: string;
  description: string;
}

const PANEL_TYPES: PanelType[] = [
  { id: 'timeseries', name: 'Time Series', icon: LineChart, category: 'Charts', description: 'خط زمانی برای نمایش داده‌های متغیر با زمان' },
  { id: 'bargraph', name: 'Bar Chart', icon: BarChart3, category: 'Charts', description: 'نمودار ستونی برای مقایسه داده‌ها' },
  { id: 'piechart', name: 'Pie Chart', icon: PieChart, category: 'Charts', description: 'نمودار دایره‌ای برای نمایش درصدها' },
  { id: 'gauge', name: 'Gauge', icon: Gauge, category: 'Charts', description: 'عقربه‌ای برای نمایش مقدار فعلی' },
  { id: 'stat', name: 'Stat', icon: Activity, category: 'Single Value', description: 'نمایش تک مقدار با فرمت‌بندی' },
  { id: 'table', name: 'Table', icon: Table, category: 'Data', description: 'جدول داده‌ها با قابلیت مرتب‌سازی' },
  { id: 'map', name: 'Map', icon: Map, category: 'Geospatial', description: 'نقشه تعاملی با لایه‌های جغرافیایی' },
  { id: 'heatmap', name: 'Heatmap', icon: Target, category: 'Geospatial', description: 'نقشه حرارتی H3 برای داده‌های مکانی' },
  { id: 'anomaly', name: 'Anomaly', icon: Brain, category: 'ML', description: 'تشخیص ناهنجاری با ML' },
  { id: 'forecast', name: 'Forecast', icon: TrendingUp, category: 'ML', description: 'پیش‌بینی با مدل‌های یادگیری ماشین' }
];

interface DashboardBuilderProps {
  uid?: string;
}

export function DashboardBuilder({ uid }: DashboardBuilderProps = {}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dashboard, setDashboard] = useState<Dashboard>({
    uid: uuidv4(),
    title: 'داشبورد جدید',
    tags: [],
    panels: [],
    timeRange: { from: 'now-1h', to: 'now' },
    variables: [],
    version: 1
  });
  
  const [isEditing, setIsEditing] = useState(true);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [showPanelLibrary, setShowPanelLibrary] = useState(false);
  const [layout, setLayout] = useState<Layout[]>([]);

  // Load data sources
  const { data: dataSources = [] } = useQuery({
    queryKey: ['/api/grafana/datasources'],
    enabled: isEditing
  });

  // Dashboard CRUD operations
  const saveDashboardMutation = useMutation({
    mutationFn: async () => {
      const dashboardData = {
        ...dashboard,
        panels: dashboard.panels.map(panel => ({
          ...panel,
          gridPos: layout.find(l => l.i === panel.id) || panel.gridPos
        }))
      };
      
      if (dashboard.id) {
        return apiRequest(`/api/grafana/dashboards/${dashboard.id}`, {
          method: 'PUT',
          body: JSON.stringify(dashboardData)
        });
      } else {
        return apiRequest('/api/grafana/dashboards', {
          method: 'POST',
          body: JSON.stringify(dashboardData)
        });
      }
    },
    onSuccess: (result) => {
      setDashboard({ ...dashboard, id: result.id });
      toast({
        title: "✅ ذخیره شد",
        description: "داشبورد با موفقیت ذخیره شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grafana/dashboards'] });
    }
  });

  // Add new panel
  const addPanel = useCallback((panelType: PanelType) => {
    const newPanel: Panel = {
      id: uuidv4(),
      type: panelType.id,
      title: panelType.name,
      datasource: dataSources[0]?.name || '',
      targets: [],
      options: {},
      fieldConfig: {},
      gridPos: { x: 0, y: 0, w: 12, h: 8 }
    };
    
    setDashboard(prev => ({
      ...prev,
      panels: [...prev.panels, newPanel]
    }));
    
    // Add to layout
    setLayout(prev => [...prev, {
      i: newPanel.id,
      x: 0,
      y: Math.max(0, ...prev.map(l => l.y + l.h), 0),
      w: 12,
      h: 8
    }]);
    
    setShowPanelLibrary(false);
    setSelectedPanel(newPanel);
  }, [dataSources]);

  // Update layout
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
  }, []);

  // Render panel content
  const renderPanelContent = useCallback((panel: Panel) => {
    const layoutInfo = layout.find(l => l.i === panel.id);
    const width = layoutInfo ? layoutInfo.w * 85 : 400;
    const height = layoutInfo ? layoutInfo.h * 40 : 200;

    switch (panel.type) {
      case 'timeseries':
        return (
          <div className="h-full">
            <Line
              data={{
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                  label: 'تراکنش‌ها',
                  data: [12, 19, 3, 5, 2, 3],
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' as const }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        );
        
      case 'bargraph':
        return (
          <div className="h-full">
            <Bar
              data={{
                labels: ['شعبه 1', 'شعبه 2', 'شعبه 3', 'شعبه 4'],
                datasets: [{
                  label: 'تراکنش‌ها',
                  data: [45, 23, 56, 34],
                  backgroundColor: 'rgba(34, 197, 94, 0.8)'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          </div>
        );

      case 'piechart':
        return (
          <div className="h-full">
            <Pie
              data={{
                labels: ['سوپرمارکت', 'رستوران', 'داروخانه', 'کافه'],
                datasets: [{
                  data: [30, 25, 20, 25],
                  backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                  ]
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false
              }}
            />
          </div>
        );

      case 'map':
        return <MapLibrePanel panel={panel} />;

      case 'stat':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">1,234</div>
              <div className="text-sm text-muted-foreground">تراکنش امروز</div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-2">شعبه</th>
                  <th className="text-right p-2">تراکنش</th>
                  <th className="text-right p-2">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">شعبه مرکزی</td>
                  <td className="p-2">45</td>
                  <td className="p-2">2,340,000</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">شعبه ولیعصر</td>
                  <td className="p-2">32</td>
                  <td className="p-2">1,890,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'anomaly':
        return (
          <div className="h-full p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-medium">تشخیص ناهنجاری ML</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>ناهنجاری شناسایی شد در POS-001</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>عملکرد طبیعی در سایر دستگاه‌ها</span>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                مدل: RandomForest | دقت: 96.2%
              </div>
            </div>
          </div>
        );

      case 'forecast':
        return (
          <div className="h-full">
            <Plot
              data={[
                {
                  x: ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05'],
                  y: [100, 120, 140, 160, 180],
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'پیش‌بینی',
                  line: { color: '#8B5CF6', dash: 'dash' }
                },
                {
                  x: ['2024-12-28', '2024-12-29', '2024-12-30', '2024-12-31'],
                  y: [80, 90, 95, 100],
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'داده‌های واقعی',
                  line: { color: '#3B82F6' }
                }
              ]}
              layout={{
                width,
                height: height - 20,
                margin: { t: 20, r: 20, b: 40, l: 60 },
                xaxis: { title: 'تاریخ' },
                yaxis: { title: 'تعداد تراکنش' },
                showlegend: true,
                legend: { x: 0, y: 1 }
              }}
              config={{ displayModeBar: false }}
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Monitor className="w-8 h-8 mx-auto mb-2" />
              <p>پنل {panel.type}</p>
            </div>
          </div>
        );
    }
  }, [layout]);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                className="flex items-center gap-2"
                data-testid="back-to-main"
              >
                <Home className="h-4 w-4" />
                <span>بازگشت به منوی اصلی</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Input
                value={dashboard.title}
                onChange={(e) => setDashboard(prev => ({ ...prev, title: e.target.value }))}
                className="text-lg font-semibold border-none bg-transparent p-0 h-auto"
                disabled={!isEditing}
              />
              <div className="flex gap-1">
                {dashboard.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <TimeRangePicker
                value={dashboard.timeRange}
                onChange={(timeRange) => setDashboard(prev => ({ ...prev, timeRange }))}
                disabled={!isEditing}
              />
              
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditing ? 'مشاهده' : 'ویرایش'}
              </Button>
              
              <Button
                size="sm"
                onClick={() => saveDashboardMutation.mutate()}
                disabled={saveDashboardMutation.isPending}
              >
                <Save className="w-4 h-4" />
                ذخیره
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {isEditing && (
          <div className="border-b bg-card p-2">
            <div className="flex items-center gap-2">
              <Dialog open={showPanelLibrary} onOpenChange={setShowPanelLibrary}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4" />
                    افزودن پنل
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>کتابخانه پنل‌ها</DialogTitle>
                    <DialogDescription>
                      پنل مناسب برای نمایش داده‌هایتان انتخاب کنید
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="Charts" className="w-full">
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="Charts">نمودارها</TabsTrigger>
                      <TabsTrigger value="Single Value">تک مقدار</TabsTrigger>
                      <TabsTrigger value="Data">داده</TabsTrigger>
                      <TabsTrigger value="Geospatial">جغرافیایی</TabsTrigger>
                      <TabsTrigger value="ML">هوش مصنوعی</TabsTrigger>
                    </TabsList>
                    
                    {['Charts', 'Single Value', 'Data', 'Geospatial', 'ML'].map(category => (
                      <TabsContent key={category} value={category}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {PANEL_TYPES.filter(p => p.category === category).map(panelType => (
                            <Card
                              key={panelType.id}
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => addPanel(panelType)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <panelType.icon className="w-6 h-6 text-primary" />
                                  <span className="font-medium">{panelType.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {panelType.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </DialogContent>
              </Dialog>
              
              <Button size="sm" variant="outline">
                <RefreshCw className="w-4 h-4" />
                بروزرسانی
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 p-4 overflow-auto">
          {dashboard.panels.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">داشبورد خالی</h3>
                <p className="text-muted-foreground mb-4">
                  برای شروع، اولین پنل خود را اضافه کنید
                </p>
                <Button onClick={() => setShowPanelLibrary(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  افزودن پنل
                </Button>
              </div>
            </div>
          ) : (
            <GridLayout
              className="layout"
              layout={layout}
              onLayoutChange={handleLayoutChange}
              cols={24}
              rowHeight={40}
              width={1200}
              isDraggable={isEditing}
              isResizable={isEditing}
              margin={[16, 16]}
            >
              {dashboard.panels.map(panel => (
                <div key={panel.id} className="panel-container">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{panel.title}</CardTitle>
                        {isEditing && (
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedPanel(panel)}
                                >
                                  <Settings className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>تنظیمات پنل</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setDashboard(prev => ({
                                      ...prev,
                                      panels: prev.panels.filter(p => p.id !== panel.id)
                                    }));
                                    setLayout(prev => prev.filter(l => l.i !== panel.id));
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>حذف پنل</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0">
                      {renderPanelContent(panel)}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </GridLayout>
          )}
        </div>

        {/* Panel Editor */}
        {selectedPanel && (
          <PanelEditor
            panel={selectedPanel}
            dataSources={dataSources}
            onSave={(updatedPanel) => {
              setDashboard(prev => ({
                ...prev,
                panels: prev.panels.map(p => 
                  p.id === updatedPanel.id ? updatedPanel : p
                )
              }));
              setSelectedPanel(null);
            }}
            onClose={() => setSelectedPanel(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}