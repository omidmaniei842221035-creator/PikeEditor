import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Filter, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Building2, 
  Users, 
  DollarSign,
  Target,
  Activity,
  Settings,
  Eye,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Import existing analytics components
import { SmallMultiplesChart } from './small-multiples-chart';
import { BoxPlotChart } from './box-plot-chart';
import { BulletChart } from './bullet-chart';
import { SankeyFlowChart } from './sankey-flow-chart';
import { BankingUnitTrends } from './banking-unit-trends';
import { UrbanGraphAnalysis } from './urban-graph-analysis';
import { FlowODAnalysis } from './flow-od-analysis';
import { ProfessionalFlowMaps } from './professional-flow-maps';
import WhatIfSimulator from './what-if-simulator';
import GeoHealthDashboard from './geo-health-dashboard';
import { GeoForecastDashboard } from './geo-forecast-dashboard';

// Report Configuration Types
interface ReportFilters {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  businessTypes: string[];
  customerStatus: string[];
  regions: string[];
  branches: string[];
  bankingUnits: string[];
  metrics: string[];
  minRevenue?: number;
  maxRevenue?: number;
}

interface ReportSection {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  category: 'performance' | 'geographic' | 'flow' | 'predictive' | 'comparative';
  icon: React.ComponentType<any>;
  enabled: boolean;
  priority: number;
}

// Color schemes for professional reports
const REPORT_COLORS = {
  primary: ['#3b82f6', '#1e40af', '#1d4ed8', '#2563eb', '#3730a3'],
  success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  info: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95']
};

// Date picker components
interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
}

function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  return (
    <Input
      type="date"
      value={value ? format(value, 'yyyy-MM-dd') : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : undefined;
        onChange?.(date);
      }}
      placeholder={placeholder}
      data-testid="date-picker-input"
    />
  );
}

export function ComprehensiveReportingSystem() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('configure');
  const [reportGenerated, setReportGenerated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {},
    businessTypes: [],
    customerStatus: [],
    regions: [],
    branches: [],
    bankingUnits: [],
    metrics: ['revenue', 'profit', 'transactions']
  });

  // Report sections configuration
  const [reportSections, setReportSections] = useState<ReportSection[]>([
    {
      id: 'executive-summary',
      name: 'خلاصه مدیریتی',
      description: 'نمای کلی از عملکرد و آمارهای کلیدی',
      component: () => <ExecutiveSummarySection filters={filters} />,
      category: 'performance',
      icon: BarChart3,
      enabled: true,
      priority: 1
    },
    {
      id: 'performance-trends',
      name: 'روندهای عملکرد',
      description: 'تحلیل روندهای زمانی درآمد، سود و تراکنش‌ها',
      component: BankingUnitTrends,
      category: 'performance',
      icon: TrendingUp,
      enabled: true,
      priority: 2
    },
    {
      id: 'geographic-analysis',
      name: 'تحلیل جغرافیایی',
      description: 'پراکندگی جغرافیایی و تحلیل مکانی',
      component: () => <GeographicSection filters={filters} />,
      category: 'geographic',
      icon: MapPin,
      enabled: true,
      priority: 3
    },
    {
      id: 'flow-analysis',
      name: 'تحلیل جریانات',
      description: 'بررسی جریان مشتریان و تراکنش‌ها',
      component: ProfessionalFlowMaps,
      category: 'flow',
      icon: Activity,
      enabled: true,
      priority: 4
    },
    {
      id: 'comparative-analysis',
      name: 'تحلیل مقایسه‌ای',
      description: 'مقایسه عملکرد شعبه‌ها و واحدهای مختلف',
      component: () => <ComparativeSection filters={filters} />,
      category: 'comparative',
      icon: PieChart,
      enabled: true,
      priority: 5
    },
    {
      id: 'predictive-analysis',
      name: 'تحلیل پیش‌بینی',
      description: 'پیش‌بینی روندها و شبیه‌سازی سناریوها',
      component: () => <PredictiveSection filters={filters} />,
      category: 'predictive',
      icon: Target,
      enabled: false,
      priority: 6
    }
  ]);

  // Data queries
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['/api/branches']
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ['/api/banking-units']
  });

  const { data: posStats = [] } = useQuery<any[]>({
    queryKey: ['/api/pos-stats']
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview']
  });

  // Filter helpers
  const businessTypeOptions = useMemo(() => {
    const types = new Set(customers.map(c => c.businessType).filter(Boolean));
    return Array.from(types).map(type => ({ value: type, label: type }));
  }, [customers]);

  const statusOptions = [
    { value: 'active', label: 'فعال' },
    { value: 'inactive', label: 'غیرفعال' },
    { value: 'marketing', label: 'بازاریابی' },
    { value: 'loss', label: 'زیان‌ده' },
    { value: 'collected', label: 'جمع‌آوری شده' }
  ];

  // Filtered data based on current filters
  const filteredData = useMemo(() => {
    let filteredCustomers = customers;
    let filteredBranches = branches;
    let filteredUnits = bankingUnits;
    let filteredStats = posStats;

    // Apply business type filter
    if (filters.businessTypes.length > 0) {
      filteredCustomers = filteredCustomers.filter(c => 
        filters.businessTypes.includes(c.businessType)
      );
    }

    // Apply status filter
    if (filters.customerStatus.length > 0) {
      filteredCustomers = filteredCustomers.filter(c => 
        filters.customerStatus.includes(c.status)
      );
    }

    // Apply branch filter
    if (filters.branches.length > 0) {
      filteredBranches = filteredBranches.filter(b => 
        filters.branches.includes(b.id)
      );
      filteredCustomers = filteredCustomers.filter(c => 
        filters.branches.includes(c.branchId)
      );
    }

    // Apply banking unit filter
    if (filters.bankingUnits.length > 0) {
      filteredUnits = filteredUnits.filter(u => 
        filters.bankingUnits.includes(u.id)
      );
      filteredCustomers = filteredCustomers.filter(c => 
        filters.bankingUnits.includes(c.bankingUnitId)
      );
    }

    // Apply revenue range filter
    if (filters.minRevenue || filters.maxRevenue) {
      filteredCustomers = filteredCustomers.filter(c => {
        const revenue = c.monthlyProfit || 0;
        if (filters.minRevenue && revenue < filters.minRevenue) return false;
        if (filters.maxRevenue && revenue > filters.maxRevenue) return false;
        return true;
      });
    }

    // Filter POS stats based on filtered customers
    const customerIds = new Set(filteredCustomers.map(c => c.id));
    filteredStats = filteredStats.filter(s => customerIds.has(s.customerId));

    return {
      customers: filteredCustomers,
      branches: filteredBranches,
      bankingUnits: filteredUnits,
      posStats: filteredStats
    };
  }, [customers, branches, bankingUnits, posStats, filters]);

  // Report generation
  const handleGenerateReport = useCallback(async () => {
    setIsGenerating(true);
    setReportProgress(0);
    setActiveTab('preview');

    // Simulate report generation progress
    const progressSteps = [
      { step: 'جمع‌آوری داده‌ها', progress: 20 },
      { step: 'تحلیل داده‌ها', progress: 40 },
      { step: 'ایجاد نمودارها', progress: 60 },
      { step: 'تولید گزارش', progress: 80 },
      { step: 'نهایی‌سازی', progress: 100 }
    ];

    for (const { progress } of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setReportProgress(progress);
    }

    setIsGenerating(false);
    setReportGenerated(true);
  }, []);

  // Export functions
  const handleExportPDF = useCallback(() => {
    if (reportRef.current) {
      window.print();
    }
  }, []);

  const handleExportExcel = useCallback(() => {
    // Create CSV data
    const csvData = [
      ['نام', 'نوع کسب‌وکار', 'وضعیت', 'درآمد ماهیانه'],
      ...filteredData.customers.map(c => [
        c.shopName || c.customerName,
        c.businessType,
        c.status,
        c.monthlyProfit || 0
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `comprehensive-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  }, [filteredData]);

  return (
    <div className="space-y-6" data-testid="comprehensive-reporting-system">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📊 سامانه گزارش‌گیری جامع
            </h1>
            <p className="text-muted-foreground mt-2">
              گزارش‌گیری حرفه‌ای و تحلیل جامع از عملکرد سامانه
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              disabled={!reportGenerated}
              data-testid="export-pdf-button"
            >
              <Printer className="w-4 h-4 mr-2" />
              چاپ گزارش
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              disabled={!reportGenerated}
              data-testid="export-excel-button"
            >
              <Download className="w-4 h-4 mr-2" />
              اکسپورت Excel
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        {isGenerating && (
          <Alert>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <AlertDescription>
              <div className="flex items-center gap-4">
                <span>در حال تولید گزارش...</span>
                <Progress value={reportProgress} className="flex-1" />
                <span>{reportProgress}%</span>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">
            <Settings className="w-4 h-4 mr-2" />
            پیکربندی گزارش
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            پیش‌نمایش گزارش
          </TabsTrigger>
          <TabsTrigger value="sections" disabled={!reportGenerated}>
            <BarChart3 className="w-4 h-4 mr-2" />
            بخش‌های تحلیلی
          </TabsTrigger>
        </TabsList>

        {/* Configuration tab */}
        <TabsContent value="configure" className="space-y-6">
          <ReportConfigurationPanel 
            filters={filters}
            setFilters={setFilters}
            reportSections={reportSections}
            setReportSections={setReportSections}
            businessTypeOptions={businessTypeOptions}
            statusOptions={statusOptions}
            branches={branches}
            bankingUnits={bankingUnits}
            onGenerateReport={handleGenerateReport}
            isGenerating={isGenerating}
          />
        </TabsContent>

        {/* Preview tab */}
        <TabsContent value="preview">
          <div ref={reportRef} className="print:p-0">
            <ReportPreview 
              filters={filters}
              filteredData={filteredData}
              reportSections={reportSections.filter(s => s.enabled)}
              isGenerating={isGenerating}
              reportGenerated={reportGenerated}
            />
          </div>
        </TabsContent>

        {/* Detailed sections tab */}
        <TabsContent value="sections">
          <DetailedAnalysisSections 
            reportSections={reportSections.filter(s => s.enabled)}
            filteredData={filteredData}
            filters={filters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Report Configuration Panel Component
interface ReportConfigurationPanelProps {
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  reportSections: ReportSection[];
  setReportSections: (sections: ReportSection[]) => void;
  businessTypeOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  branches: any[];
  bankingUnits: any[];
  onGenerateReport: () => void;
  isGenerating: boolean;
}

function ReportConfigurationPanel({
  filters,
  setFilters,
  reportSections,
  setReportSections,
  businessTypeOptions,
  statusOptions,
  branches,
  bankingUnits,
  onGenerateReport,
  isGenerating
}: ReportConfigurationPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Filters Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلترهای گزارش
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>بازه زمانی</Label>
            <div className="flex gap-2">
              <DatePicker
                value={filters.dateRange.from}
                onChange={(date: Date | undefined) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, from: date }
                })}
                placeholder="از تاریخ"
              />
              <DatePicker
                value={filters.dateRange.to}
                onChange={(date: Date | undefined) => setFilters({
                  ...filters,
                  dateRange: { ...filters.dateRange, to: date }
                })}
                placeholder="تا تاریخ"
              />
            </div>
          </div>

          {/* Business Types */}
          <div className="space-y-2">
            <Label>نوع کسب‌وکار</Label>
            <div className="space-y-2">
              {businessTypeOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`business-${option.value}`}
                    checked={filters.businessTypes.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters({
                          ...filters,
                          businessTypes: [...filters.businessTypes, option.value]
                        });
                      } else {
                        setFilters({
                          ...filters,
                          businessTypes: filters.businessTypes.filter(t => t !== option.value)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={`business-${option.value}`} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Status */}
          <div className="space-y-2">
            <Label>وضعیت مشتری</Label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={filters.customerStatus.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters({
                          ...filters,
                          customerStatus: [...filters.customerStatus, option.value]
                        });
                      } else {
                        setFilters({
                          ...filters,
                          customerStatus: filters.customerStatus.filter(s => s !== option.value)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={option.value} className="text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Range */}
          <div className="space-y-2">
            <Label>محدوده درآمد (تومان)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="حداقل"
                value={filters.minRevenue || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  minRevenue: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
              <Input
                type="number"
                placeholder="حداکثر"
                value={filters.maxRevenue || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  maxRevenue: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Sections Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            بخش‌های گزارش
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportSections.map(section => (
            <div key={section.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Switch
                checked={section.enabled}
                onCheckedChange={(enabled) => {
                  setReportSections(
                    reportSections.map(s => 
                      s.id === section.id ? { ...s, enabled } : s
                    )
                  );
                }}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4" />
                  <h4 className="font-medium">{section.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {section.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </div>
          ))}

          <Button
            onClick={onGenerateReport}
            disabled={isGenerating || reportSections.filter(s => s.enabled).length === 0}
            className="w-full"
            size="lg"
            data-testid="generate-report-button"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            تولید گزارش جامع
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Executive Summary Section
function ExecutiveSummarySection({ filters }: { filters: ReportFilters }) {
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/overview']
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });

  const summaryMetrics = useMemo(() => {
    const totalRevenue = customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const avgRevenue = customers.length > 0 ? totalRevenue / customers.length : 0;
    
    const businessTypes = customers.reduce((acc, c) => {
      acc[c.businessType] = (acc[c.businessType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      activeCustomers,
      avgRevenue,
      totalCustomers: customers.length,
      businessTypes: Object.entries(businessTypes).slice(0, 5)
    };
  }, [customers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          خلاصه مدیریتی
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {summaryMetrics.totalCustomers.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-muted-foreground">کل مشتریان</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {summaryMetrics.activeCustomers.toLocaleString('fa-IR')}
            </div>
            <div className="text-sm text-muted-foreground">مشتریان فعال</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(summaryMetrics.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-muted-foreground">کل درآمد</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {(summaryMetrics.avgRevenue / 1000000).toFixed(2)}M
            </div>
            <div className="text-sm text-muted-foreground">میانگین درآمد</div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={summaryMetrics.businessTypes.map(([type, count]) => ({
                  name: type,
                  value: count,
                  fill: REPORT_COLORS.primary[summaryMetrics.businessTypes.findIndex(([t]) => t === type)]
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {summaryMetrics.businessTypes.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={REPORT_COLORS.primary[index % REPORT_COLORS.primary.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Geographic Section
function GeographicSection({ filters }: { filters: ReportFilters }) {
  return (
    <div className="space-y-4">
      <GeoHealthDashboard />
      <GeoForecastDashboard />
    </div>
  );
}

// Comparative Section
function ComparativeSection({ filters }: { filters: ReportFilters }) {
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ['/api/customers']
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['/api/branches']
  });

  const { data: posStats = [] } = useQuery<any[]>({
    queryKey: ['/api/pos-stats']
  });

  // Prepare data for charts based on current filters
  const chartData = useMemo(() => {
    // Prepare small multiples data
    const smallMultiplesData = branches.slice(0, 8).map((branch: any) => {
      const branchStats = posStats.filter((stat: any) => stat.branchId === branch.id);
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthIndex = i + 1;
        const monthStats = branchStats.filter((stat: any) => stat.month === monthIndex);
        return {
          month: `${monthIndex}`,
          monthIndex: monthIndex,
          revenue: monthStats.reduce((sum: number, stat: any) => sum + (stat.revenue || 0), 0),
          profit: monthStats.reduce((sum: number, stat: any) => sum + (stat.profit || 0), 0),
          transactions: monthStats.reduce((sum: number, stat: any) => sum + (stat.totalTransactions || 0), 0)
        };
      });

      return {
        branchId: branch.id,
        branchName: branch.name,
        monthlyData
      };
    });

    // Prepare box plot data
    const boxPlotData = branches.slice(0, 6).map((branch: any) => {
      const branchStats = posStats.filter((stat: any) => stat.branchId === branch.id);
      return {
        branchId: branch.id,
        branchName: branch.name,
        values: branchStats.map((stat: any) => stat.revenue || 0),
        stats: null
      };
    });

    // Prepare bullet chart data
    const bulletData = branches.slice(0, 6).map((branch: any) => {
      const branchStats = posStats.filter((stat: any) => stat.branchId === branch.id);
      const actual = branchStats.reduce((sum: number, stat: any) => sum + (stat.revenue || 0), 0);
      const target = actual * 1.2; // 20% higher target

      return {
        branchId: branch.id,
        branchName: branch.name,
        actual,
        target,
        previous: actual * 0.9,
        benchmarks: {
          poor: target * 0.6,
          satisfactory: target * 0.8,
          good: target
        }
      };
    });

    return { smallMultiplesData, boxPlotData, bulletData };
  }, [branches, posStats]);

  return (
    <div className="space-y-6">
      <SmallMultiplesChart
        data={chartData.smallMultiplesData}
        metric="revenue"
        title="روند ماهیانه درآمد شعبه‌ها"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BoxPlotChart
          data={chartData.boxPlotData}
          metric="revenue"
          title="توزیع درآمد شعبه‌ها"
        />
        
        <BulletChart
          data={chartData.bulletData}
          metric="revenue"
          title="عملکرد در برابر هدف"
        />
      </div>
    </div>
  );
}

// Predictive Section
function PredictiveSection({ filters }: { filters: ReportFilters }) {
  return (
    <div className="space-y-6">
      <WhatIfSimulator />
      <UrbanGraphAnalysis />
    </div>
  );
}

// Report Preview Component
interface ReportPreviewProps {
  filters: ReportFilters;
  filteredData: any;
  reportSections: ReportSection[];
  isGenerating: boolean;
  reportGenerated: boolean;
}

function ReportPreview({
  filters,
  filteredData,
  reportSections,
  isGenerating,
  reportGenerated
}: ReportPreviewProps) {
  if (isGenerating) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-lg">در حال تولید گزارش...</p>
            <p className="text-muted-foreground">
              لطفاً صبر کنید تا گزارش جامع تولید شود
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportGenerated) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-lg">گزارش آماده نشده است</p>
            <p className="text-muted-foreground">
              ابتدا در تب "پیکربندی گزارش" تنظیمات را انجام داده و گزارش را تولید کنید
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Report Header */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            گزارش جامع سامانه مانیتورینگ پایانه‌های فروشگاهی
          </CardTitle>
          <p className="text-muted-foreground">
            تاریخ تولید: {format(new Date(), 'yyyy/MM/dd - HH:mm')}
          </p>
          {(filters.dateRange.from || filters.dateRange.to) && (
            <p className="text-sm">
              بازه گزارش: {filters.dateRange.from ? format(filters.dateRange.from, 'yyyy/MM/dd') : 'نامحدود'} 
              {' تا '} 
              {filters.dateRange.to ? format(filters.dateRange.to, 'yyyy/MM/dd') : 'امروز'}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Report Sections */}
      {reportSections
        .sort((a, b) => a.priority - b.priority)
        .map(section => (
          <div key={section.id} className="print:break-inside-avoid">
            <section.component />
          </div>
        ))}

      {/* Report Footer */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>این گزارش به صورت خودکار توسط سامانه مانیتورینگ هوشمند تولید شده است</p>
          <p>© 2024 سامانه مانیتورینگ پایانه‌های فروشگاهی</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Detailed Analysis Sections
interface DetailedAnalysisSectionsProps {
  reportSections: ReportSection[];
  filteredData: any;
  filters: ReportFilters;
}

function DetailedAnalysisSections({
  reportSections,
  filteredData,
  filters
}: DetailedAnalysisSectionsProps) {
  const [activeSection, setActiveSection] = useState(reportSections[0]?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Section Navigation */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>بخش‌های تحلیلی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportSections.map(section => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(section.id)}
                  data-testid={`section-nav-${section.id}`}
                >
                  <section.icon className="w-4 h-4 mr-2" />
                  {section.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Content */}
      <div className="lg:col-span-3">
        {reportSections
          .filter(s => s.id === activeSection)
          .map(section => (
            <div key={section.id}>
              <section.component />
            </div>
          ))}
      </div>
    </div>
  );
}

export default ComprehensiveReportingSystem;