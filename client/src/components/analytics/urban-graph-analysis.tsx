import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { MapPin, GitBranch, TrendingUp, Users, Network, Target, Zap } from "lucide-react";
import { UrbanGraphAnalyzer, createUrbanGraphFromData, Community, CentralityResult, SpilloverEffect } from "@/lib/urban-graph";

export function UrbanGraphAnalysis() {
  const [analysisType, setAnalysisType] = useState<"communities" | "centrality" | "spillover">("communities");
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: bankingUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/banking-units"],
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  // Create urban graph from data
  const { graphAnalyzer, graphData } = useMemo(() => {
    if (customers.length === 0 || bankingUnits.length === 0) {
      return { graphAnalyzer: null, graphData: { nodes: [], edges: [] } };
    }

    const data = createUrbanGraphFromData(customers, bankingUnits, branches);
    const analyzer = new UrbanGraphAnalyzer(data.nodes, data.edges);
    
    return { graphAnalyzer: analyzer, graphData: data };
  }, [customers, bankingUnits, branches]);

  // Analysis results
  const [communities, setCommunities] = useState<Community[]>([]);
  const [centralityResults, setCentralityResults] = useState<CentralityResult[]>([]);
  const [spilloverResults, setSpilloverResults] = useState<SpilloverEffect[]>([]);

  // Run analysis when graph is ready
  useEffect(() => {
    if (!graphAnalyzer || graphData.nodes.length > 50) { // Performance limit
      return;
    }

    setIsAnalyzing(true);
    
    // Run community detection
    const detectedCommunities = graphAnalyzer.detectCommunities();
    setCommunities(detectedCommunities);

    // Calculate centrality for key nodes only (performance optimization)
    const keyNodeIds = graphData.nodes
      .filter(n => n.type === 'banking_unit' || 
                  (n.properties.customerCount && n.properties.customerCount > 10))
      .slice(0, 20)
      .map(n => n.id);
    
    const centralities = keyNodeIds.map(nodeId => 
      graphAnalyzer.calculateBetweennessCentrality(nodeId)
    );
    setCentralityResults(centralities);

    // Analyze spillover effects for key nodes
    const keyNodes = centralities
      .sort((a, b) => b.betweenness - a.betweenness)
      .slice(0, 5);
    
    const spillovers = keyNodes.map(node => 
      graphAnalyzer.analyzeSpilloverEffects(node.nodeId, 2000)
    );
    setSpilloverResults(spillovers);

    setIsAnalyzing(false);
  }, [graphAnalyzer, graphData.nodes]);

  if (!graphAnalyzer) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">در حال بارگذاری داده‌های گراف شهری...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          🌐 تحلیل‌های مبتنی بر گراف شهری
        </h3>
        <p className="text-muted-foreground">
          تحلیل ارتباطات و روابط میان مناطق، اصناف و واحدهای بانکی با استفاده از الگوریتم‌های گراف پیشرفته
        </p>
      </div>

      {/* Graph Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GitBranch className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600" data-testid="total-nodes">
                {graphData.nodes.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">کل عقدها (Nodes)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Network className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600" data-testid="total-edges">
                {graphData.edges.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">کل یال‌ها (Edges)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600" data-testid="total-communities">
                {communities.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">جوامع شناسایی شده</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">
                {Math.round(graphData.edges.length / graphData.nodes.length * 100) / 100}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">میانگین اتصال</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            تنظیمات تحلیل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع تحلیل:</label>
              <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
                <SelectTrigger className="w-48" data-testid="analysis-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="communities">🏘️ خوشه‌بندی جوامع</SelectItem>
                  <SelectItem value="centrality">🎯 تحلیل مرکزیت</SelectItem>
                  <SelectItem value="spillover">🌊 تأثیرات سرریز</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {analysisType === "spillover" && (
              <div>
                <label className="block text-sm font-medium mb-2">عقده مرجع:</label>
                <Select value={selectedNode} onValueChange={setSelectedNode}>
                  <SelectTrigger className="w-48" data-testid="node-select">
                    <SelectValue placeholder="انتخاب عقده..." />
                  </SelectTrigger>
                  <SelectContent>
                    {graphData.nodes.slice(0, 20).map(node => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.type === 'banking_unit' ? '🏦' : 
                         node.type === 'business_cluster' ? '🏪' : '📍'} {node.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">در حال تحلیل...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Tabs value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="communities">خوشه‌بندی جوامع</TabsTrigger>
          <TabsTrigger value="centrality">تحلیل مرکزیت</TabsTrigger>
          <TabsTrigger value="spillover">تأثیرات سرریز</TabsTrigger>
        </TabsList>

        {/* Community Detection Results */}
        <TabsContent value="communities" className="space-y-4">
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">🏘️ جوامع تجاری شناسایی شده</h4>
            <p className="text-sm text-muted-foreground">
              خوشه‌های طبیعی مشاغل بر اساس شباهت نوع کسب‌وکار، نزدیکی جغرافیایی و جریان مشتری
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {communities.map((community, index) => (
              <Card key={community.id} data-testid={`community-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>جامعه {index + 1}</span>
                    <Badge variant="outline">
                      {community.nodes.length} عقده
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">اصناف غالب:</p>
                    <div className="flex flex-wrap gap-1">
                      {community.characteristics.dominantBusinessTypes.map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">میانگین درآمد:</span>
                      <div className="font-medium">
                        {Math.round(community.characteristics.averageRevenue / 1000000)}M تومان
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تراکم مشتری:</span>
                      <div className="font-medium">
                        {Math.round(community.characteristics.customerDensity)} نفر
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">نمره مرکزیت:</span>
                      <div className="font-medium">
                        {(community.centralityScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">اتصال درونی:</span>
                      <div className="font-medium">
                        {(community.characteristics.connectivity * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>قدرت اتصال</span>
                      <span>{(community.characteristics.connectivity * 100).toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={community.characteristics.connectivity * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Centrality Analysis Results */}
        <TabsContent value="centrality" className="space-y-4">
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">🎯 تحلیل مرکزیت عقدها</h4>
            <p className="text-sm text-muted-foreground">
              شناسایی مناطق کلیدی و گلوگاه‌ها در شبکه تجاری شهر
            </p>
          </div>

          <div className="space-y-3">
            {centralityResults
              .sort((a, b) => b.betweenness - a.betweenness)
              .slice(0, 10)
              .map((result, index) => {
                const node = graphData.nodes.find(n => n.id === result.nodeId);
                if (!node) return null;

                return (
                  <Card key={result.nodeId} data-testid={`centrality-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {node.type === 'banking_unit' ? '🏦' : 
                             node.type === 'business_cluster' ? '🏪' : '📍'}
                          </div>
                          <div>
                            <h5 className="font-medium">{node.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {node.type === 'banking_unit' ? 'واحد بانکی' : 
                               node.type === 'business_cluster' ? 'خوشه تجاری' : 'منطقه'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={result.betweenness > 0.1 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              مرکزیت: {(result.betweenness * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            درجه: {result.degree} | نزدیکی: {result.closeness.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>اهمیت استراتژیک</span>
                          <span>{(result.betweenness * 100).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={result.betweenness * 100} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        {/* Spillover Effects Results */}
        <TabsContent value="spillover" className="space-y-4">
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">🌊 تحلیل تأثیرات سرریز</h4>
            <p className="text-sm text-muted-foreground">
              بررسی تأثیر رشد یک منطقه بر مناطق اطراف و زنجیره‌های تأثیر
            </p>
          </div>

          {spilloverResults.length > 0 ? (
            <div className="space-y-4">
              {spilloverResults.slice(0, 3).map((spillover, index) => {
                const sourceNode = graphData.nodes.find(n => n.id === spillover.sourceNode);
                if (!sourceNode) return null;

                return (
                  <Card key={spillover.sourceNode} data-testid={`spillover-${index}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        <span>منبع تأثیر: {sourceNode.name}</span>
                        <Badge variant="outline">
                          {spillover.affectedNodes.length} منطقه تحت تأثیر
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {spillover.affectedNodes.slice(0, 8).map(affected => {
                          const affectedNode = graphData.nodes.find(n => n.id === affected.nodeId);
                          if (!affectedNode) return null;

                          const impactColor = 
                            affected.impactType === 'revenue_boost' ? 'text-green-600' :
                            affected.impactType === 'business_expansion' ? 'text-blue-600' :
                            'text-orange-600';

                          const impactIcon = 
                            affected.impactType === 'revenue_boost' ? '💰' :
                            affected.impactType === 'business_expansion' ? '📈' :
                            '👥';

                          return (
                            <div key={affected.nodeId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{impactIcon}</span>
                                <div>
                                  <p className="font-medium text-sm">{affectedNode.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {affected.impactType === 'revenue_boost' ? 'افزایش درآمد' :
                                     affected.impactType === 'business_expansion' ? 'گسترش کسب‌وکار' :
                                     'افزایش مشتری'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${impactColor}`}>
                                  {(affected.impactStrength * 100).toFixed(0)}%
                                </div>
                                <Progress 
                                  value={affected.impactStrength * 100} 
                                  className="w-16 h-2 mt-1"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span>شعاع تأثیر:</span>
                          <span className="font-medium">{(spillover.decayRadius / 1000).toFixed(1)} کیلومتر</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  برای مشاهده تأثیرات سرریز، یک عقده مرجع انتخاب کنید
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            بینش‌ها و پیشنهادات استراتژیک
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                قوی‌ترین جوامع تجاری
              </h5>
              <p className="text-sm text-muted-foreground">
                {communities.length > 0 
                  ? `${communities[0]?.characteristics.dominantBusinessTypes.join('، ')} با بیشترین اتصال درونی`
                  : 'در حال تحلیل...'
                }
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                نقاط کلیدی شبکه
              </h5>
              <p className="text-sm text-muted-foreground">
                {centralityResults.length > 0
                  ? `${centralityResults[0]?.nodeId} با بالاترین مرکزیت میانی`
                  : 'در حال تحلیل...'
                }
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                پتانسیل رشد
              </h5>
              <p className="text-sm text-muted-foreground">
                {spilloverResults.length > 0
                  ? `${spilloverResults[0]?.affectedNodes.length} منطقه تحت تأثیر مثبت`
                  : 'در حال تحلیل...'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}