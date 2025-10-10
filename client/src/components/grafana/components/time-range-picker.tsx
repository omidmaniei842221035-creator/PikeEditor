import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';

interface TimeRange {
  from: string;
  to: string;
}

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  disabled?: boolean;
}

const QUICK_RANGES = [
  { label: '5 دقیقه گذشته', value: { from: 'now-5m', to: 'now' } },
  { label: '15 دقیقه گذشته', value: { from: 'now-15m', to: 'now' } },
  { label: '30 دقیقه گذشته', value: { from: 'now-30m', to: 'now' } },
  { label: '1 ساعت گذشته', value: { from: 'now-1h', to: 'now' } },
  { label: '3 ساعت گذشته', value: { from: 'now-3h', to: 'now' } },
  { label: '6 ساعت گذشته', value: { from: 'now-6h', to: 'now' } },
  { label: '12 ساعت گذشته', value: { from: 'now-12h', to: 'now' } },
  { label: '24 ساعت گذشته', value: { from: 'now-24h', to: 'now' } },
  { label: '2 روز گذشته', value: { from: 'now-2d', to: 'now' } },
  { label: '7 روز گذشته', value: { from: 'now-7d', to: 'now' } },
  { label: '30 روز گذشته', value: { from: 'now-30d', to: 'now' } },
];

function formatTimeRange(timeRange: TimeRange): string {
  const quickRange = QUICK_RANGES.find(
    range => range.value.from === timeRange.from && range.value.to === timeRange.to
  );
  
  if (quickRange) {
    return quickRange.label;
  }
  
  return `${timeRange.from} تا ${timeRange.to}`;
}

export function TimeRangePicker({ value, onChange, disabled = false }: TimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const handleQuickRangeSelect = (range: TimeRange) => {
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    onChange({ from: customFrom, to: customTo });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="min-w-[200px] justify-start"
        >
          <Clock className="w-4 h-4 mr-2" />
          {formatTimeRange(value)}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">بازه‌های سریع</h4>
            <div className="grid grid-cols-1 gap-1">
              {QUICK_RANGES.map((range) => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8"
                  onClick={() => handleQuickRangeSelect(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">بازه سفارشی</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-muted-foreground">از:</label>
                <Input
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  placeholder="now-1h"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">تا:</label>
                <Input
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  placeholder="now"
                />
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleCustomApply}
              >
                اعمال
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}