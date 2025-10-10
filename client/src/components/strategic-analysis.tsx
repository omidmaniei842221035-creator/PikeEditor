import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Users, Building2, Target, MapPin, DollarSign, Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface BankingUnitRecommendation {
  unitId: string;
  unitName: string;
  unitType: string;
  performanceLevel: string;
  metrics: {
    totalRevenue: number;
    avgRevenue: number;
    customerCount: number;
    deviceCount: number;
    activeDevices: number;
    deviceUtilization: number;
    diversityScore: number;
    businessTypes: number;
  };
  recommendations: string[];
  priorityActions: string[];
}

interface EmployeeRecommendation {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  performanceLevel: string;
  metrics: {
    totalRevenue: number;
    avgRevenue: number;
    customerCount: number;
    customerSatisfaction: number;
    efficiency: number;
  };
  developmentPlan: string[];
  incentives: string[];
  nextReviewDate: string;
}

interface RegionalMarketing {
  region: string;
  metrics: {
    customerCount: number;
    businessDiversity: number;
    totalRevenue: number;
    avgRevenue: number;
    marketPotential: number;
    currentCapture: number;
  };
  marketingStrategy: string[];
  targetSegments: string[];
  campaignBudget: number;
  expectedROI: number;
  timeframe: string;
}

interface PosInsight {
  deviceId: string;
  deviceCode: string;
  customerName: string;
  businessType: string;
  status: string;
  metrics: {
    utilizationScore: number;
    revenueScore: number;
    overallScore: number;
    monthlyRevenue: number;
  };
  recommendations: string[];
  flags: {
    maintenanceNeeded: boolean;
    upgradeSuggested: boolean;
    highPerformance: boolean;
    needsAttention: boolean;
  };
}

interface PosPerformanceData {
  insights: PosInsight[];
  aggregate: {
    totalDevices: number;
    highPerformance: number;
    needsMaintenance: number;
    upgradeRequired: number;
    avgPerformance: number;
    topPerformers: PosInsight[];
    underPerformers: PosInsight[];
  };
}

export function StrategicAnalysis() {
  const [activeTab, setActiveTab] = useState('banking-units');

  const { data: bankingUnits, isLoading: unitsLoading } = useQuery<BankingUnitRecommendation[]>({
    queryKey: ['/api/strategic/banking-unit-recommendations'],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<EmployeeRecommendation[]>({
    queryKey: ['/api/strategic/employee-recommendations'],
  });

  const { data: regionalMarketing, isLoading: marketingLoading } = useQuery<RegionalMarketing[]>({
    queryKey: ['/api/strategic/regional-marketing'],
  });

  const { data: posPerformance, isLoading: posLoading } = useQuery<PosPerformanceData>({
    queryKey: ['/api/strategic/pos-performance'],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPerformanceBadgeColor = (level: string) => {
    switch (level) {
      case 'عالی':
      case 'برتر':
        return 'bg-green-500 hover:bg-green-600';
      case 'خوب':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'متوسط':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'ضعیف':
      case 'نیاز به بهبود':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'عالی':
      case 'برتر':
        return <TrendingUp className="h-4 w-4" />;
      case 'خوب':
        return <CheckCircle className="h-4 w-4" />;
      case 'متوسط':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="strategic-analysis">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-strategic-analysis">
            تحلیل استراتژیک
          </h1>
          <p className="text-muted-foreground">
            پیشنهادات هوشمند برای بهبود عملکرد و توسعه کسب‌وکار
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="banking-units" data-testid="tab-banking-units">
            <Building2 className="h-4 w-4 ml-2" />
            واحدهای بانکی
          </TabsTrigger>
          <TabsTrigger value="employees" data-testid="tab-employees">
            <Users className="h-4 w-4 ml-2" />
            کارمندان
          </TabsTrigger>
          <TabsTrigger value="regional" data-testid="tab-regional">
            <MapPin className="h-4 w-4 ml-2" />
            بازاریابی منطقه‌ای
          </TabsTrigger>
          <TabsTrigger value="pos-devices" data-testid="tab-pos-devices">
            <Target className="h-4 w-4 ml-2" />
            عملکرد POS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banking-units" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                تحلیل و پیشنهادات واحدهای بانکی
              </CardTitle>
              <CardDescription>
                ارزیابی عملکرد و استراتژی‌های بهبود برای هر واحد بانکی
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {bankingUnits?.map((unit) => (
                    <Card key={unit.unitId} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg" data-testid={`unit-name-${unit.unitId}`}>
                              {unit.unitName}
                            </CardTitle>
                            <CardDescription>{unit.unitType}</CardDescription>
                          </div>
                          <Badge 
                            className={`${getPerformanceBadgeColor(unit.performanceLevel)} text-white`}
                            data-testid={`unit-performance-${unit.unitId}`}
                          >
                            {getPerformanceIcon(unit.performanceLevel)}
                            {unit.performanceLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600" data-testid={`unit-revenue-${unit.unitId}`}>
                              {formatCurrency(unit.metrics.totalRevenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">درآمد کل</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`unit-customers-${unit.unitId}`}>
                              {unit.metrics.customerCount}
                            </div>
                            <div className="text-sm text-muted-foreground">مشتریان</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`unit-devices-${unit.unitId}`}>
                              {unit.metrics.activeDevices}/{unit.metrics.deviceCount}
                            </div>
                            <div className="text-sm text-muted-foreground">POS فعال</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`unit-diversity-${unit.unitId}`}>
                              {unit.metrics.businessTypes}
                            </div>
                            <div className="text-sm text-muted-foreground">نوع کسب‌وکار</div>
                          </div>
                        </div>

                        {/* Device Utilization Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>استفاده از POS</span>
                            <span>{Math.round(unit.metrics.deviceUtilization)}%</span>
                          </div>
                          <Progress 
                            value={unit.metrics.deviceUtilization} 
                            className="h-2"
                            data-testid={`unit-utilization-${unit.unitId}`}
                          />
                        </div>

                        {/* Priority Actions */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">اقدامات اولویت‌دار:</h4>
                          <div className="space-y-2">
                            {unit.priorityActions.map((action, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded"
                                data-testid={`unit-action-${unit.unitId}-${index}`}
                              >
                                <Target className="h-4 w-4 text-blue-600" />
                                {action}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* All Recommendations */}
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                            مشاهده تمام پیشنهادات ({unit.recommendations.length})
                          </summary>
                          <div className="mt-3 space-y-2">
                            {unit.recommendations.map((rec, index) => (
                              <div 
                                key={index} 
                                className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                data-testid={`unit-recommendation-${unit.unitId}-${index}`}
                              >
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ارزیابی و توسعه کارمندان
              </CardTitle>
              <CardDescription>
                برنامه‌های توسعه شخصی و سیستم پاداش‌ها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {employees?.map((employee) => (
                    <Card key={employee.employeeId} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg" data-testid={`employee-name-${employee.employeeId}`}>
                              {employee.employeeName}
                            </CardTitle>
                            <CardDescription>کد کارمند: {employee.employeeCode}</CardDescription>
                          </div>
                          <Badge 
                            className={`${getPerformanceBadgeColor(employee.performanceLevel)} text-white`}
                            data-testid={`employee-performance-${employee.employeeId}`}
                          >
                            {getPerformanceIcon(employee.performanceLevel)}
                            {employee.performanceLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Employee Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600" data-testid={`employee-revenue-${employee.employeeId}`}>
                              {formatCurrency(employee.metrics.totalRevenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">درآمد کل</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`employee-customers-${employee.employeeId}`}>
                              {employee.metrics.customerCount}
                            </div>
                            <div className="text-sm text-muted-foreground">مشتریان</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`employee-efficiency-${employee.employeeId}`}>
                              {employee.metrics.efficiency}%
                            </div>
                            <div className="text-sm text-muted-foreground">کارایی</div>
                          </div>
                        </div>

                        {/* Satisfaction Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>رضایت مشتریان</span>
                            <span>{employee.metrics.customerSatisfaction}%</span>
                          </div>
                          <Progress 
                            value={employee.metrics.customerSatisfaction} 
                            className="h-2"
                            data-testid={`employee-satisfaction-${employee.employeeId}`}
                          />
                        </div>

                        {/* Development Plan & Incentives */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              برنامه توسعه:
                            </h4>
                            <div className="space-y-2">
                              {employee.developmentPlan.slice(0, 2).map((plan, index) => (
                                <div 
                                  key={index} 
                                  className="text-sm bg-purple-50 dark:bg-purple-950 p-2 rounded"
                                  data-testid={`employee-development-${employee.employeeId}-${index}`}
                                >
                                  • {plan}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              پاداش‌ها:
                            </h4>
                            <div className="space-y-2">
                              {employee.incentives.slice(0, 2).map((incentive, index) => (
                                <div 
                                  key={index} 
                                  className="text-sm bg-green-50 dark:bg-green-950 p-2 rounded"
                                  data-testid={`employee-incentive-${employee.employeeId}-${index}`}
                                >
                                  • {incentive}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Next Review Date */}
                        <div className="text-center text-sm text-muted-foreground border-t pt-3">
                          بررسی بعدی: {new Date(employee.nextReviewDate).toLocaleDateString('fa-IR')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                استراتژی بازاریابی منطقه‌ای
              </CardTitle>
              <CardDescription>
                تحلیل بازار و پیشنهادات توسعه در مناطق مختلف
              </CardDescription>
            </CardHeader>
            <CardContent>
              {marketingLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {regionalMarketing?.map((region, index) => (
                    <Card key={index} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg" data-testid={`region-name-${index}`}>
                            منطقه {region.region}
                          </CardTitle>
                          <Badge variant="outline" data-testid={`region-capture-${index}`}>
                            {region.metrics.currentCapture}% تسخیر بازار
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Market Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`region-customers-${index}`}>
                              {region.metrics.customerCount}
                            </div>
                            <div className="text-sm text-muted-foreground">مشتریان</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" data-testid={`region-diversity-${index}`}>
                              {region.metrics.businessDiversity}
                            </div>
                            <div className="text-sm text-muted-foreground">تنوع کسب‌وکار</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600" data-testid={`region-revenue-${index}`}>
                              {formatCurrency(region.metrics.totalRevenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">درآمد کل</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600" data-testid={`region-budget-${index}`}>
                              {formatCurrency(region.campaignBudget)}
                            </div>
                            <div className="text-sm text-muted-foreground">بودجه کمپین</div>
                          </div>
                        </div>

                        {/* Market Capture Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>تسخیر بازار</span>
                            <span>{region.metrics.currentCapture}%</span>
                          </div>
                          <Progress 
                            value={region.metrics.currentCapture} 
                            className="h-2"
                            data-testid={`region-progress-${index}`}
                          />
                        </div>

                        {/* Marketing Strategy & Target Segments */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">استراتژی بازاریابی:</h4>
                            <div className="space-y-2">
                              {region.marketingStrategy.slice(0, 2).map((strategy, strategyIndex) => (
                                <div 
                                  key={strategyIndex} 
                                  className="text-sm bg-orange-50 dark:bg-orange-950 p-2 rounded"
                                  data-testid={`region-strategy-${index}-${strategyIndex}`}
                                >
                                  • {strategy}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">بخش‌های هدف:</h4>
                            <div className="space-y-2">
                              {region.targetSegments.slice(0, 2).map((segment, segmentIndex) => (
                                <div 
                                  key={segmentIndex} 
                                  className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded"
                                  data-testid={`region-segment-${index}-${segmentIndex}`}
                                >
                                  • {segment}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Campaign Info */}
                        <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-3">
                          <span>بازده مورد انتظار: {region.expectedROI}%</span>
                          <span>مدت زمان: {region.timeframe}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos-devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                تحلیل عملکرد دستگاه‌های POS
              </CardTitle>
              <CardDescription>
                بررسی وضعیت و پیشنهادات بهبود برای دستگاه‌های POS
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aggregate Overview */}
                  {posPerformance?.aggregate && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold" data-testid="pos-total-devices">
                          {posPerformance.aggregate.totalDevices}
                        </div>
                        <div className="text-sm text-muted-foreground">کل دستگاه‌ها</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600" data-testid="pos-high-performance">
                          {posPerformance.aggregate.highPerformance}
                        </div>
                        <div className="text-sm text-muted-foreground">عملکرد عالی</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600" data-testid="pos-needs-maintenance">
                          {posPerformance.aggregate.needsMaintenance}
                        </div>
                        <div className="text-sm text-muted-foreground">نیاز تعمیر</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600" data-testid="pos-upgrade-required">
                          {posPerformance.aggregate.upgradeRequired}
                        </div>
                        <div className="text-sm text-muted-foreground">نیاز ارتقا</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" data-testid="pos-avg-performance">
                          {posPerformance.aggregate.avgPerformance}%
                        </div>
                        <div className="text-sm text-muted-foreground">میانگین عملکرد</div>
                      </div>
                    </div>
                  )}

                  {/* Top and Under Performers */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-green-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-700">برترین عملکردها</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {posPerformance?.aggregate.topPerformers.map((device, index) => (
                          <div key={device.deviceId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                            <div>
                              <div className="font-medium" data-testid={`top-performer-name-${index}`}>
                                {device.customerName}
                              </div>
                              <div className="text-sm text-muted-foreground">{device.deviceCode}</div>
                            </div>
                            <Badge className="bg-green-600 hover:bg-green-700" data-testid={`top-performer-score-${index}`}>
                              {device.metrics.overallScore}%
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-700">نیازمند توجه</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {posPerformance?.aggregate.underPerformers.map((device, index) => (
                          <div key={device.deviceId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded">
                            <div>
                              <div className="font-medium" data-testid={`under-performer-name-${index}`}>
                                {device.customerName}
                              </div>
                              <div className="text-sm text-muted-foreground">{device.deviceCode}</div>
                            </div>
                            <Badge variant="destructive" data-testid={`under-performer-score-${index}`}>
                              {device.metrics.overallScore}%
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* All POS Devices */}
                  <Card>
                    <CardHeader>
                      <CardTitle>تمام دستگاه‌های POS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {posPerformance?.insights.map((device) => (
                          <Card key={device.deviceId} className="border-l-4 border-l-cyan-500">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <div className="font-medium" data-testid={`device-customer-${device.deviceId}`}>
                                    {device.customerName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {device.deviceCode} • {device.businessType}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {device.flags.maintenanceNeeded && (
                                    <Badge variant="destructive" data-testid={`device-maintenance-${device.deviceId}`}>
                                      <AlertTriangle className="h-3 w-3 ml-1" />
                                      تعمیر
                                    </Badge>
                                  )}
                                  {device.flags.upgradeSuggested && (
                                    <Badge variant="secondary" data-testid={`device-upgrade-${device.deviceId}`}>
                                      ارتقا
                                    </Badge>
                                  )}
                                  <Badge 
                                    className={device.flags.highPerformance ? 'bg-green-600' : device.flags.needsAttention ? 'bg-red-600' : 'bg-yellow-600'}
                                    data-testid={`device-score-${device.deviceId}`}
                                  >
                                    {device.metrics.overallScore}%
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <div className="text-sm text-muted-foreground">استفاده</div>
                                  <Progress value={device.metrics.utilizationScore} className="h-2 mt-1" />
                                  <div className="text-xs mt-1">{device.metrics.utilizationScore}%</div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">درآمد</div>
                                  <Progress value={device.metrics.revenueScore} className="h-2 mt-1" />
                                  <div className="text-xs mt-1">{device.metrics.revenueScore}%</div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">کلی</div>
                                  <Progress value={device.metrics.overallScore} className="h-2 mt-1" />
                                  <div className="text-xs mt-1">{device.metrics.overallScore}%</div>
                                </div>
                              </div>

                              <details className="group">
                                <summary className="cursor-pointer text-sm font-medium text-cyan-600 hover:text-cyan-800">
                                  پیشنهادات ({device.recommendations.length})
                                </summary>
                                <div className="mt-2 space-y-1">
                                  {device.recommendations.map((rec, index) => (
                                    <div 
                                      key={index} 
                                      className="text-sm p-2 bg-cyan-50 dark:bg-cyan-950 rounded"
                                      data-testid={`device-recommendation-${device.deviceId}-${index}`}
                                    >
                                      • {rec}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}