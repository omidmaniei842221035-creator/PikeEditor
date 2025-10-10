import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, BarChart3, GitCompare, Zap, Clock, TrendingUp, Users, CreditCard } from "lucide-react";

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

interface TimeSliderProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

function TimeSlider({ selectedMonth, onMonthChange, selectedYear, onYearChange }: TimeSliderProps) {
  const currentYear = 1403; // Current Persian year
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          ناوبری زمانی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Year Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">سال:</label>
          <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
            <SelectTrigger className="h-8 text-xs" data-testid="year-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">ماه:</label>
            <Badge variant="secondary" className="text-xs">
              {PERSIAN_MONTHS[selectedMonth - 1]}
            </Badge>
          </div>
          <Slider
            value={[selectedMonth]}
            onValueChange={(value) => onMonthChange(value[0])}
            min={1}
            max={12}
            step={1}
            className="w-full"
            data-testid="month-slider"
          />
          <div className="grid grid-cols-6 gap-1 text-xs text-gray-500 dark:text-gray-400">
            {PERSIAN_MONTHS.slice(0, 6).map((month, index) => (
              <div key={index} className="text-center truncate">{month.slice(0, 3)}</div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1 text-xs text-gray-500 dark:text-gray-400">
            {PERSIAN_MONTHS.slice(6).map((month, index) => (
              <div key={index + 6} className="text-center truncate">{month.slice(0, 3)}</div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DrillDownPanelProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedCell: any;
  onCellClick: (cell: any) => void;
}

function DrillDownPanel({ isEnabled, onToggle, selectedCell }: DrillDownPanelProps) {
  return (
    <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4" />
          جزئیات محله‌ای
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">فعال‌سازی کلیک</label>
          <Switch 
            checked={isEnabled}
            onCheckedChange={onToggle}
            data-testid="drill-down-toggle"
          />
        </div>
        
        {isEnabled && (
          <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            روی هر محله کلیک کنید تا جزئیات آن را ببینید
          </div>
        )}

        {selectedCell && (
          <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
              محله انتخاب شده
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>شعب: {selectedCell.branches || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                <span>POS: {selectedCell.terminals || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>درآمد: {selectedCell.revenue || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span>تراکنش: {selectedCell.transactions || 0}</span>
              </div>
            </div>
            <Button size="sm" className="w-full text-xs" data-testid="view-cell-details">
              مشاهده جزئیات کامل
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ComparisonModeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  comparisonType: "month" | "business";
  onComparisonTypeChange: (type: "month" | "business") => void;
  leftSelection: string;
  rightSelection: string;
  onLeftSelectionChange: (selection: string) => void;
  onRightSelectionChange: (selection: string) => void;
}

function ComparisonMode({
  isEnabled,
  onToggle,
  comparisonType,
  onComparisonTypeChange,
  leftSelection,
  rightSelection,
  onLeftSelectionChange,
  onRightSelectionChange
}: ComparisonModeProps) {
  const businessTypes = [
    { value: "supermarket", label: "سوپرمارکت" },
    { value: "restaurant", label: "رستوران" },
    { value: "pharmacy", label: "داروخانه" },
    { value: "cafe", label: "کافه" },
    { value: "bakery", label: "نانوایی" }
  ];

  return (
    <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <GitCompare className="w-4 h-4" />
          حالت مقایسه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">فعال‌سازی مقایسه</label>
          <Switch 
            checked={isEnabled}
            onCheckedChange={onToggle}
            data-testid="comparison-mode-toggle"
          />
        </div>

        {isEnabled && (
          <div className="space-y-3">
            {/* Comparison Type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">نوع مقایسه:</label>
              <Select value={comparisonType} onValueChange={onComparisonTypeChange}>
                <SelectTrigger className="h-8 text-xs" data-testid="comparison-type-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">مقایسه ماهانه</SelectItem>
                  <SelectItem value="business">مقایسه اصناف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Left Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">انتخاب چپ:</label>
              <Select value={leftSelection} onValueChange={onLeftSelectionChange}>
                <SelectTrigger className="h-8 text-xs" data-testid="left-selection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {comparisonType === "month" ? (
                    PERSIAN_MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>{month}</SelectItem>
                    ))
                  ) : (
                    businessTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Right Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">انتخاب راست:</label>
              <Select value={rightSelection} onValueChange={onRightSelectionChange}>
                <SelectTrigger className="h-8 text-xs" data-testid="right-selection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {comparisonType === "month" ? (
                    PERSIAN_MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>{month}</SelectItem>
                    ))
                  ) : (
                    businessTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-blue-600 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              دو نقشه کنار هم برای مقایسه نمایش داده می‌شود
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface WhatIfScenariosProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedScenario: string;
  onScenarioChange: (scenario: string) => void;
}

function WhatIfScenarios({ isEnabled, onToggle, selectedScenario, onScenarioChange }: WhatIfScenariosProps) {
  const scenarios = [
    { value: "base", label: "سناریو پایه", description: "وضعیت فعلی" },
    { value: "expansion", label: "توسعه شعب", description: "+20% شعب جدید" },
    { value: "optimization", label: "بهینه‌سازی", description: "بازآرایی موقعیت‌ها" },
    { value: "competitive", label: "رقابتی", description: "ورود رقیب جدید" }
  ];

  const selectedScenarioData = scenarios.find(s => s.value === selectedScenario);

  return (
    <Card className="border-0 bg-white/70 dark:bg-gray-800/70 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4" />
          سناریوهای چه‌اگر
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">فعال‌سازی سناریو</label>
          <Switch 
            checked={isEnabled}
            onCheckedChange={onToggle}
            data-testid="whatif-toggle"
          />
        </div>

        {isEnabled && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">انتخاب سناریو:</label>
              <Select value={selectedScenario} onValueChange={onScenarioChange}>
                <SelectTrigger className="h-8 text-xs" data-testid="scenario-selector">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map(scenario => (
                    <SelectItem key={scenario.value} value={scenario.value}>
                      {scenario.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedScenarioData && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-xs font-medium text-purple-800 dark:text-purple-200">
                  {selectedScenarioData.label}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {selectedScenarioData.description}
                </div>
                
                {/* Mock scenario results */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                    <div className="font-medium">درآمد</div>
                    <div className="text-green-600">+15%</div>
                  </div>
                  <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                    <div className="font-medium">پوشش</div>
                    <div className="text-blue-600">+8%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdvancedAnalytics() {
  // Time Slider State
  const [selectedMonth, setSelectedMonth] = useState(7); // مهر
  const [selectedYear, setSelectedYear] = useState(1403);

  // Drill-down State
  const [drillDownEnabled, setDrillDownEnabled] = useState(false);
  const [selectedCell, setSelectedCell] = useState<any>(null);

  // Comparison Mode State
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonType, setComparisonType] = useState<"month" | "business">("month");
  const [leftSelection, setLeftSelection] = useState("6"); // شهریور
  const [rightSelection, setRightSelection] = useState("7"); // مهر

  // What-if Scenarios State
  const [whatIfEnabled, setWhatIfEnabled] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("base");

  const handleCellClick = useCallback((cell: any) => {
    if (drillDownEnabled) {
      setSelectedCell(cell);
    }
  }, [drillDownEnabled]);

  return (
    <div className="space-y-4" data-testid="advanced-analytics">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          تحلیل‌های پیشرفته
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time Slider */}
        <TimeSlider
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* Drill-down Panel */}
        <DrillDownPanel
          isEnabled={drillDownEnabled}
          onToggle={setDrillDownEnabled}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
        />

        {/* Comparison Mode */}
        <ComparisonMode
          isEnabled={comparisonEnabled}
          onToggle={setComparisonEnabled}
          comparisonType={comparisonType}
          onComparisonTypeChange={setComparisonType}
          leftSelection={leftSelection}
          rightSelection={rightSelection}
          onLeftSelectionChange={setLeftSelection}
          onRightSelectionChange={setRightSelection}
        />

        {/* What-if Scenarios */}
        <WhatIfScenarios
          isEnabled={whatIfEnabled}
          onToggle={setWhatIfEnabled}
          selectedScenario={selectedScenario}
          onScenarioChange={setSelectedScenario}
        />
      </div>
    </div>
  );
}