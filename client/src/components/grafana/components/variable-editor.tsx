import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Variable } from 'lucide-react';

interface Variable {
  id: string;
  name: string;
  label: string;
  type: 'query' | 'custom' | 'constant' | 'datasource' | 'interval';
  query?: string;
  options?: string[];
  current?: {
    value: string | string[];
    text: string | string[];
  };
  datasource?: string;
  multi: boolean;
  includeAll: boolean;
  regex?: string;
  sort?: number;
}

interface VariableEditorProps {
  variables: Variable[];
  dataSources: any[];
  onChange: (variables: Variable[]) => void;
}

export function VariableEditor({ variables, dataSources, onChange }: VariableEditorProps) {
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const createNewVariable = (): Variable => ({
    id: Date.now().toString(),
    name: 'new_variable',
    label: 'متغیر جدید',
    type: 'query',
    multi: false,
    includeAll: false,
    sort: 0
  });

  const handleCreateVariable = () => {
    const newVariable = createNewVariable();
    setEditingVariable(newVariable);
    setIsCreateMode(true);
  };

  const handleEditVariable = (variable: Variable) => {
    setEditingVariable({ ...variable });
    setIsCreateMode(false);
  };

  const handleSaveVariable = () => {
    if (!editingVariable) return;

    const updatedVariables = isCreateMode
      ? [...variables, editingVariable]
      : variables.map(v => v.id === editingVariable.id ? editingVariable : v);

    onChange(updatedVariables);
    setEditingVariable(null);
    setIsCreateMode(false);
  };

  const handleDeleteVariable = (variableId: string) => {
    onChange(variables.filter(v => v.id !== variableId));
  };

  const updateEditingVariable = (updates: Partial<Variable>) => {
    if (editingVariable) {
      setEditingVariable({ ...editingVariable, ...updates });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Variable className="w-5 h-5" />
          متغیرهای داشبورد
        </h3>
        <Button size="sm" onClick={handleCreateVariable}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن متغیر
        </Button>
      </div>

      {variables.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Variable className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">هیچ متغیری تعریف نشده</p>
            <Button variant="outline" onClick={handleCreateVariable}>
              <Plus className="w-4 h-4 mr-2" />
              اولین متغیر را اضافه کنید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {variables.map(variable => (
            <Card key={variable.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{variable.label || variable.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${variable.name} • {variable.type}
                        {variable.multi && ' • چندتایی'}
                        {variable.includeAll && ' • شامل همه'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline">{variable.type}</Badge>
                      {variable.multi && <Badge variant="secondary">Multi</Badge>}
                      {variable.includeAll && <Badge variant="secondary">All</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditVariable(variable)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteVariable(variable.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {variable.current && (
                  <div className="mt-2 text-sm">
                    <strong>مقدار فعلی:</strong> {
                      Array.isArray(variable.current.value)
                        ? variable.current.value.join(', ')
                        : variable.current.value
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Variable Editor Dialog */}
      <Dialog
        open={editingVariable !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVariable(null);
            setIsCreateMode(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'ایجاد متغیر جدید' : 'ویرایش متغیر'}
            </DialogTitle>
            <DialogDescription>
              متغیرها امکان فیلتر کردن و تعامل با داده‌های داشبورد را فراهم می‌کنند
            </DialogDescription>
          </DialogHeader>

          {editingVariable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="var-name">نام متغیر</Label>
                  <Input
                    id="var-name"
                    value={editingVariable.name}
                    onChange={(e) => updateEditingVariable({ name: e.target.value })}
                    placeholder="variable_name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="var-label">برچسب</Label>
                  <Input
                    id="var-label"
                    value={editingVariable.label}
                    onChange={(e) => updateEditingVariable({ label: e.target.value })}
                    placeholder="نام نمایشی"
                  />
                </div>
              </div>

              <div>
                <Label>نوع متغیر</Label>
                <Select
                  value={editingVariable.type}
                  onValueChange={(value: any) => updateEditingVariable({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="query">کوئری</SelectItem>
                    <SelectItem value="custom">سفارشی</SelectItem>
                    <SelectItem value="constant">ثابت</SelectItem>
                    <SelectItem value="datasource">منبع داده</SelectItem>
                    <SelectItem value="interval">بازه زمانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingVariable.type === 'query' && (
                <>
                  <div>
                    <Label>منبع داده</Label>
                    <Select
                      value={editingVariable.datasource || ''}
                      onValueChange={(value) => updateEditingVariable({ datasource: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب منبع داده" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map(ds => (
                          <SelectItem key={ds.id} value={ds.name}>
                            {ds.name} ({ds.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>کوئری</Label>
                    <Textarea
                      value={editingVariable.query || ''}
                      onChange={(e) => updateEditingVariable({ query: e.target.value })}
                      placeholder="label_values(up, instance)"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {editingVariable.type === 'custom' && (
                <div>
                  <Label>مقادیر سفارشی</Label>
                  <Textarea
                    value={editingVariable.options?.join('\n') || ''}
                    onChange={(e) => updateEditingVariable({ 
                      options: e.target.value.split('\n').filter(v => v.trim()) 
                    })}
                    placeholder="مقدار اول&#10;مقدار دوم&#10;مقدار سوم"
                    rows={4}
                  />
                </div>
              )}

              {editingVariable.type === 'constant' && (
                <div>
                  <Label>مقدار ثابت</Label>
                  <Input
                    value={editingVariable.current?.value as string || ''}
                    onChange={(e) => updateEditingVariable({ 
                      current: { value: e.target.value, text: e.target.value }
                    })}
                    placeholder="مقدار ثابت"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="multi-select">انتخاب چندتایی</Label>
                  <Switch
                    id="multi-select"
                    checked={editingVariable.multi}
                    onCheckedChange={(checked) => updateEditingVariable({ multi: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-all">شامل گزینه "همه"</Label>
                  <Switch
                    id="include-all"
                    checked={editingVariable.includeAll}
                    onCheckedChange={(checked) => updateEditingVariable({ includeAll: checked })}
                  />
                </div>
              </div>

              <div>
                <Label>Regex فیلتر</Label>
                <Input
                  value={editingVariable.regex || ''}
                  onChange={(e) => updateEditingVariable({ regex: e.target.value })}
                  placeholder="/.*/"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingVariable(null);
                    setIsCreateMode(false);
                  }}
                >
                  انصراف
                </Button>
                <Button onClick={handleSaveVariable}>
                  {isCreateMode ? 'ایجاد' : 'ذخیره'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}