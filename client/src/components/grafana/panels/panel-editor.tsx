import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { QueryEditor } from '../components/query-editor';
import { Save, X, Settings, Database, Palette, Grid3X3 } from 'lucide-react';

interface Panel {
  id: string;
  type: string;
  title: string;
  datasource: string;
  targets: any[];
  options: any;
  fieldConfig: any;
  gridPos?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  url?: string;
  isDefault?: boolean;
}

interface PanelEditorProps {
  panel: Panel;
  dataSources: DataSource[];
  onSave: (panel: Panel) => void;
  onClose: () => void;
}

export function PanelEditor({ panel, dataSources, onSave, onClose }: PanelEditorProps) {
  const [editedPanel, setEditedPanel] = useState<Panel>({ ...panel });

  const handleSave = () => {
    onSave(editedPanel);
  };

  const updatePanel = (updates: Partial<Panel>) => {
    setEditedPanel(prev => ({ ...prev, ...updates }));
  };

  const updateOptions = (optionPath: string, value: any) => {
    setEditedPanel(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [optionPath]: value
      }
    }));
  };

  const updateFieldConfig = (configPath: string, value: any) => {
    setEditedPanel(prev => ({
      ...prev,
      fieldConfig: {
        ...prev.fieldConfig,
        [configPath]: value
      }
    }));
  };

  const addTarget = () => {
    setEditedPanel(prev => ({
      ...prev,
      targets: [
        ...prev.targets,
        {
          id: Date.now().toString(),
          expr: '',
          datasource: editedPanel.datasource,
          refId: String.fromCharCode(65 + prev.targets.length), // A, B, C...
          hide: false
        }
      ]
    }));
  };

  const updateTarget = (index: number, updates: any) => {
    setEditedPanel(prev => ({
      ...prev,
      targets: prev.targets.map((target, i) => 
        i === index ? { ...target, ...updates } : target
      )
    }));
  };

  const removeTarget = (index: number) => {
    setEditedPanel(prev => ({
      ...prev,
      targets: prev.targets.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            ویرایش پنل: {panel.title}
          </DialogTitle>
          <DialogDescription>
            تنظیمات پنل، منابع داده و نمایش را مدیریت کنید
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="general" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="general">عمومی</TabsTrigger>
              <TabsTrigger value="query">داده‌ها</TabsTrigger>
              <TabsTrigger value="display">نمایش</TabsTrigger>
              <TabsTrigger value="advanced">پیشرفته</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="general" className="mt-0 p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">اطلاعات پایه</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">عنوان پنل</Label>
                      <Input
                        id="title"
                        value={editedPanel.title}
                        onChange={(e) => updatePanel({ title: e.target.value })}
                        placeholder="عنوان پنل را وارد کنید"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">توضیحات</Label>
                      <Textarea
                        id="description"
                        value={editedPanel.options?.description || ''}
                        onChange={(e) => updateOptions('description', e.target.value)}
                        placeholder="توضیح مختصر درباره پنل"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>نوع پنل</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{editedPanel.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          برای تغییر نوع پنل، پنل جدید ایجاد کنید
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="query" className="mt-0 p-4 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        منبع داده
                      </CardTitle>
                    </div>
                    <Button size="sm" onClick={addTarget}>
                      افزودن کوئری
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>منبع داده</Label>
                      <Select
                        value={editedPanel.datasource}
                        onValueChange={(value) => updatePanel({ datasource: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map(ds => (
                            <SelectItem key={ds.id} value={ds.name}>
                              {ds.name} ({ds.type})
                              {ds.isDefault && ' - پیش‌فرض'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>کوئری‌ها</Label>
                      {editedPanel.targets.map((target, index) => (
                        <div key={target.id || index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline">{target.refId}</Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateTarget(index, { hide: !target.hide })}
                              >
                                {target.hide ? 'نمایش' : 'مخفی'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTarget(index)}
                                disabled={editedPanel.targets.length === 1}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <QueryEditor
                            datasource={editedPanel.datasource}
                            query={target}
                            onChange={(updates) => updateTarget(index, updates)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="display" className="mt-0 p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      تنظیمات نمایش
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Panel-specific display options based on type */}
                    {editedPanel.type === 'timeseries' && (
                      <>
                        <div>
                          <Label>رنگ خط</Label>
                          <Input
                            type="color"
                            value={editedPanel.fieldConfig?.color || '#3b82f6'}
                            onChange={(e) => updateFieldConfig('color', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>ضخامت خط</Label>
                          <Select
                            value={editedPanel.fieldConfig?.lineWidth?.toString() || '2'}
                            onValueChange={(value) => updateFieldConfig('lineWidth', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">نازک</SelectItem>
                              <SelectItem value="2">متوسط</SelectItem>
                              <SelectItem value="3">ضخیم</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {editedPanel.type === 'stat' && (
                      <>
                        <div>
                          <Label>واحد</Label>
                          <Input
                            value={editedPanel.fieldConfig?.unit || ''}
                            onChange={(e) => updateFieldConfig('unit', e.target.value)}
                            placeholder="مثال: تومان، درصد"
                          />
                        </div>
                        <div>
                          <Label>اعشار</Label>
                          <Select
                            value={editedPanel.fieldConfig?.decimals?.toString() || '0'}
                            onValueChange={(value) => updateFieldConfig('decimals', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    <div>
                      <Label>نمایش راهنما</Label>
                      <Select
                        value={editedPanel.options?.legend?.displayMode || 'table'}
                        onValueChange={(value) => updateOptions('legend', { 
                          ...editedPanel.options?.legend, 
                          displayMode: value 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">جدول</SelectItem>
                          <SelectItem value="list">لیست</SelectItem>
                          <SelectItem value="hidden">مخفی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 p-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Grid3X3 className="w-5 h-5" />
                      تنظیمات پیشرفته
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>تنظیمات JSON سفارشی</Label>
                      <Textarea
                        value={JSON.stringify(editedPanel.options, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updatePanel({ options: parsed });
                          } catch (error) {
                            // Invalid JSON, ignore
                          }
                        }}
                        rows={8}
                        className="font-mono text-sm"
                        placeholder='{"key": "value"}'
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        فرمت JSON معتبر وارد کنید
                      </p>
                    </div>

                    <div>
                      <Label>فیلدهای پیکربندی</Label>
                      <Textarea
                        value={JSON.stringify(editedPanel.fieldConfig, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updatePanel({ fieldConfig: parsed });
                          } catch (error) {
                            // Invalid JSON, ignore
                          }
                        }}
                        rows={6}
                        className="font-mono text-sm"
                        placeholder='{"defaults": {}}'
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex-shrink-0 flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            ذخیره تغییرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}