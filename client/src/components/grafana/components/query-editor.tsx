import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Editor from '@monaco-editor/react';
import { Database, Play, Eye, EyeOff } from 'lucide-react';

interface QueryTarget {
  id?: string;
  refId: string;
  expr?: string;
  query?: string;
  rawSql?: string;
  datasource: string;
  hide: boolean;
  [key: string]: any;
}

interface QueryEditorProps {
  datasource: string;
  query: QueryTarget;
  onChange: (updates: Partial<QueryTarget>) => void;
}

// Mock datasource types and their query formats
const DATASOURCE_CONFIGS: Record<string, any> = {
  prometheus: {
    placeholder: 'up{job="prometheus"}',
    language: 'promql',
    examples: [
      'rate(http_requests_total[5m])',
      'up{instance="localhost:9090"}',
      'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))'
    ]
  },
  loki: {
    placeholder: '{job="varlogs"}',
    language: 'logql',
    examples: [
      '{job="varlogs"} |= "error"',
      'sum(rate({job="mysql"}[5m])) by (level)',
      '{job="nginx"} | json | line_format "{{.method}} {{.uri}}{{.status}}"'
    ]
  },
  postgresql: {
    placeholder: 'SELECT time, value FROM metrics WHERE $__timeFilter(time)',
    language: 'sql',
    examples: [
      'SELECT time, count(*) as value FROM transactions WHERE $__timeFilter(time) GROUP BY time ORDER BY time',
      'SELECT branch_name, sum(amount) as total FROM pos_transactions GROUP BY branch_name',
      'SELECT * FROM customers WHERE status = \'active\' LIMIT 100'
    ]
  },
  clickhouse: {
    placeholder: 'SELECT toDateTime(time) as time, count() as value FROM events WHERE time >= $__fromTime AND time <= $__toTime GROUP BY time ORDER BY time',
    language: 'sql',
    examples: [
      'SELECT toStartOfHour(timestamp) as time, count() as transactions FROM pos_events WHERE timestamp >= $__fromTime AND timestamp <= $__toTime GROUP BY time ORDER BY time',
      'SELECT device_id, avg(transaction_amount) as avg_amount FROM pos_transactions GROUP BY device_id',
      'SELECT uniqExact(customer_id) as unique_customers FROM transactions WHERE date = today()'
    ]
  },
  csv: {
    placeholder: 'فیلتر یا تبدیل داده‌های CSV',
    language: 'json',
    examples: [
      '{"filter": {"status": "active"}}',
      '{"group_by": "branch_name", "aggregate": "sum", "field": "amount"}',
      '{"sort": {"field": "timestamp", "order": "desc"}, "limit": 100}'
    ]
  },
  json: {
    placeholder: 'مسیر JSON یا فیلتر',
    language: 'json',
    examples: [
      '$.data[*].transactions',
      '{"path": "$.metrics.pos_stats", "filter": {"status": "online"}}',
      '{"select": ["device_id", "transaction_count", "last_seen"]}'
    ]
  }
};

export function QueryEditor({ datasource, query, onChange }: QueryEditorProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const datasourceType = datasource.toLowerCase();
  const config = DATASOURCE_CONFIGS[datasourceType] || DATASOURCE_CONFIGS.prometheus;

  const handleQueryChange = (value: string | undefined) => {
    if (datasourceType === 'postgresql' || datasourceType === 'clickhouse') {
      onChange({ rawSql: value || '' });
    } else {
      onChange({ expr: value || '' });
    }
  };

  const getCurrentQuery = () => {
    if (datasourceType === 'postgresql' || datasourceType === 'clickhouse') {
      return query.rawSql || '';
    }
    return query.expr || '';
  };

  const handleRunQuery = async () => {
    setIsRunning(true);
    // Simulate query execution
    setTimeout(() => {
      setIsRunning(false);
    }, 1000);
  };

  const insertExample = (example: string) => {
    handleQueryChange(example);
    setShowExamples(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          <Badge variant="outline">{datasourceType}</Badge>
          <span className="text-sm text-muted-foreground">Query {query.refId}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExamples(!showExamples)}
          >
            {showExamples ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showExamples ? 'پنهان کردن' : 'مثال‌ها'}
          </Button>
          
          <Button
            size="sm"
            onClick={handleRunQuery}
            disabled={isRunning}
            className="min-w-[80px]"
          >
            <Play className="w-3 h-3 mr-1" />
            {isRunning ? 'در حال اجرا...' : 'اجرا'}
          </Button>
        </div>
      </div>

      {showExamples && config.examples && (
        <Card>
          <CardContent className="p-3">
            <Label className="text-sm font-medium">مثال‌های کوئری:</Label>
            <div className="space-y-2 mt-2">
              {config.examples.map((example: string, index: number) => (
                <div
                  key={index}
                  className="cursor-pointer p-2 text-sm bg-muted/50 rounded hover:bg-muted transition-colors"
                  onClick={() => insertExample(example)}
                >
                  <code className="text-xs">{example}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-md">
        <div className="bg-muted px-3 py-2 text-sm border-b">
          <Label>کوئری {config.language?.toUpperCase()}</Label>
        </div>
        
        <div className="min-h-[120px]">
          <Editor
            height="120px"
            defaultLanguage={config.language}
            value={getCurrentQuery()}
            onChange={handleQueryChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                horizontal: 'auto',
                vertical: 'auto'
              },
              automaticLayout: true,
              wordWrap: 'on'
            }}
            theme="vs-dark"
          />
        </div>
      </div>

      {/* Query-specific options */}
      {(datasourceType === 'postgresql' || datasourceType === 'clickhouse') && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-sm">فرمت زمان</Label>
            <Select
              value={query.timeColumn || 'time'}
              onValueChange={(value) => onChange({ timeColumn: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">time</SelectItem>
                <SelectItem value="timestamp">timestamp</SelectItem>
                <SelectItem value="created_at">created_at</SelectItem>
                <SelectItem value="datetime">datetime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm">فیلد مقدار</Label>
            <Input
              value={query.metricColumn || 'value'}
              onChange={(e) => onChange({ metricColumn: e.target.value })}
              placeholder="value"
            />
          </div>
        </div>
      )}

      {datasourceType === 'prometheus' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-sm">بازه زمانی</Label>
            <Select
              value={query.interval || ''}
              onValueChange={(value) => onChange({ interval: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="پیش‌فرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15s">15 ثانیه</SelectItem>
                <SelectItem value="30s">30 ثانیه</SelectItem>
                <SelectItem value="1m">1 دقیقه</SelectItem>
                <SelectItem value="5m">5 دقیقه</SelectItem>
                <SelectItem value="10m">10 دقیقه</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm">نوع کوئری</Label>
            <Select
              value={query.queryType || 'instant'}
              onValueChange={(value) => onChange({ queryType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="range">Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>وضعیت:</span>
        {isRunning ? (
          <Badge variant="secondary">در حال اجرا...</Badge>
        ) : (
          <Badge variant="outline">آماده</Badge>
        )}
      </div>
    </div>
  );
}