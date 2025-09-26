import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Zap, Network, TrendingUp, Target, Eye, EyeOff } from "lucide-react";
import * as d3 from "d3";

interface NetworkNode {
  id: string;
  nodeType: string;
  entityId: string;
  label: string;
  value: number;
  group: string;
  color: string;
  size: number;
  properties: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface NetworkEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: string;
  weight: number;
  value: number;
  color: string;
  width: number;
  properties: any;
  source?: NetworkNode;
  target?: NetworkNode;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    businessTypeCount: number;
    bankingUnitCount: number;
    territoryCount: number;
  };
}

interface NetworkStatistics {
  nodeCount: number;
  edgeCount: number;
  avgConnections: number;
  totalRevenue: number;
  businessTypeDistribution: Array<{
    businessType: string;
    revenue: number;
    percentage: number;
    customerCount: number;
  }>;
  networkDensity: number;
}

interface PerformanceAnalytics {
  topPerformingUnits: Array<{
    unitId: string;
    unitName: string;
    revenue: number;
    deviceCount: number;
    efficiency: number;
  }>;
  underPerformingUnits: Array<{
    unitId: string;
    unitName: string;
    revenue: number;
    issues: string[];
  }>;
  centralityMetrics: Array<{
    nodeId: string;
    nodeName: string;
    betweennessCentrality: number;
    degreeCentrality: number;
    importance: 'high' | 'medium' | 'low';
  }>;
  connectionStrengths: Array<{
    sourceNode: string;
    targetNode: string;
    strength: number;
    type: string;
  }>;
}

export function SpiderWebNetwork() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeType, setSelectedNodeType] = useState("all");
  const [selectedEdgeType, setSelectedEdgeType] = useState("all");
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, undefined> | null>(null);

  const { data: networkData, isLoading, refetch } = useQuery<NetworkData>({
    queryKey: ["/api/network/spider-web"],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: networkStats } = useQuery<NetworkStatistics>({
    queryKey: ["/api/network/statistics"],
    refetchInterval: 30000,
  });

  const { data: performanceAnalytics } = useQuery<PerformanceAnalytics>({
    queryKey: ["/api/network/performance-analytics"],
    refetchInterval: 30000,
  });

  // Initialize and update the spider web visualization
  useEffect(() => {
    if (!networkData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Stop previous simulation if exists
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Clear previous content
    svg.selectAll("*").remove();

    // Set up SVG dimensions
    svg.attr("width", width).attr("height", height);

    // Create main group for zooming
    const g = svg.append("g");

    // Filter data based on selected types
    let filteredNodes = networkData.nodes;
    let filteredEdges = networkData.edges;

    if (selectedNodeType !== "all") {
      filteredNodes = networkData.nodes.filter(node => node.nodeType === selectedNodeType);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = networkData.edges.filter(edge => 
        nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)
      );
    }

    if (selectedEdgeType !== "all") {
      filteredEdges = filteredEdges.filter(edge => edge.edgeType === selectedEdgeType);
    }

    // Create link data with proper source/target references - filter out links with missing nodes
    const nodeIdSet = new Set(filteredNodes.map(n => n.id));
    const linkData = filteredEdges
      .filter(edge => nodeIdSet.has(edge.sourceNodeId) && nodeIdSet.has(edge.targetNodeId))
      .map(edge => {
        const source = filteredNodes.find(n => n.id === edge.sourceNodeId);
        const target = filteredNodes.find(n => n.id === edge.targetNodeId);
        if (!source || !target) return null; // Safety check
        return {
          ...edge,
          source,
          target,
        };
      })
      .filter(link => link !== null);

    // Helper function to get node size safely
    const getNodeSize = (node: NetworkNode): number => node.size || 10;
    
    // Create force simulation
    const simulation = d3.forceSimulation<NetworkNode>(filteredNodes)
      .force("link", d3.forceLink(linkData)
        .id((d: any) => d.id)
        .distance(d => 100 + (d.value / 1000000)) // Dynamic distance based on value
        .strength(0.3)
      )
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => getNodeSize(d as NetworkNode) + 5))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    simulationRef.current = simulation;

    // Create gradient definitions for links
    const defs = svg.append("defs");
    linkData.forEach(link => {
      const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${link.id}`)
        .attr("gradientUnits", "userSpaceOnUse");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", link.source.color);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", link.target.color);
    });

    // Create links (edges)
    const links = g.selectAll(".link")
      .data(linkData)
      .enter().append("line")
      .attr("class", "link")
      .attr("stroke", d => d.edgeType === 'revenue_flow' ? `url(#gradient-${d.id})` : d.color)
      .attr("stroke-width", d => d.width)
      .attr("stroke-opacity", 0.6)
      .style("filter", "drop-shadow(0px 0px 3px rgba(0,0,0,0.3))");

    // Add tooltips to links
    links.append("title")
      .text(d => `${d.edgeType}: ${d.properties?.revenue ? `${(d.properties.revenue / 1000000).toFixed(1)}M تومان` : d.value}`);

    // Create nodes
    const nodes = g.selectAll(".node")
      .data(filteredNodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add node circles with glowing effect
    nodes.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0px 0px 8px rgba(0,0,0,0.4))")
      .style("transition", "all 0.3s ease")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("r", d.size * 1.2)
          .style("filter", "drop-shadow(0px 0px 15px rgba(0,0,0,0.6))");
        
        // Highlight connected edges
        links.style("stroke-opacity", edge => 
          edge.source.id === d.id || edge.target.id === d.id ? 1 : 0.2
        );
        
        setSelectedNode(d);
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .attr("r", d.size)
          .style("filter", "drop-shadow(0px 0px 8px rgba(0,0,0,0.4))");
        
        // Reset edge opacity
        links.style("stroke-opacity", 0.6);
        
        setSelectedNode(null);
      });

    // Add node icons based on type
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", d => d.size * 0.8)
      .text(d => {
        switch (d.nodeType) {
          case 'banking_unit':
            return d.properties?.unitType === 'branch' ? '🏦' : 
                   d.properties?.unitType === 'counter' ? '🏪' : '🏧';
          case 'business_type':
            return '🏪';
          case 'territory':
            return '🗺️';
          default:
            return '●';
        }
      })
      .style("pointer-events", "none");

    // Add labels if enabled
    if (showLabels) {
      nodes.append("text")
        .attr("dx", d => d.size + 8)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .attr("fill", "#374151")
        .style("text-shadow", "1px 1px 2px rgba(255,255,255,0.8)")
        .text(d => d.label.length > 15 ? d.label.substring(0, 15) + "..." : d.label)
        .style("pointer-events", "none");
    }

    // Update positions on simulation tick
    simulation.on("tick", () => {
      links
        .attr("x1", d => d.source.x!)
        .attr("y1", d => d.source.y!)
        .attr("x2", d => d.target.x!)
        .attr("y2", d => d.target.y!);

      nodes
        .attr("transform", d => `translate(${d.x!},${d.y!})`);
    });

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      simulation.stop();
    };

  }, [networkData, selectedNodeType, selectedEdgeType, showLabels]);

  // Control simulation play/pause
  useEffect(() => {
    if (simulationRef.current) {
      if (isPlaying) {
        simulationRef.current.alphaTarget(0.1).restart();
      } else {
        simulationRef.current.stop();
      }
    }
  }, [isPlaying]);

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">در حال بارگیری نقشه تار عنکبوت...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Network className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-primary">{networkStats?.nodeCount || 0}</p>
            <p className="text-sm text-muted-foreground">گره‌های شبکه</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{networkStats?.edgeCount || 0}</p>
            <p className="text-sm text-muted-foreground">ارتباطات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">
              {networkStats?.totalRevenue ? `${(networkStats.totalRevenue / 1000000).toFixed(1)}M` : '0M'}
            </p>
            <p className="text-sm text-muted-foreground">کل درآمد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-purple-600">
              {networkStats?.networkDensity ? (networkStats.networkDensity * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">تراکم شبکه</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🕸️ نقشه تار عنکبوت تحلیل‌های شبکه‌ای
              {selectedNode && (
                <Badge variant="secondary" className="mr-2">
                  {selectedNode.label}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                data-testid="toggle-labels"
              >
                {showLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                برچسب‌ها
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                data-testid="toggle-simulation"
              >
                {isPlaying ? "⏸️" : "▶️"}
                {isPlaying ? "توقف" : "شروع"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                data-testid="refresh-network"
              >
                <RefreshCw className="h-4 w-4" />
                بروزرسانی
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع گره:</label>
              <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                <SelectTrigger className="w-[200px]" data-testid="node-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه گره‌ها</SelectItem>
                  <SelectItem value="banking_unit">🏦 واحدهای بانکی</SelectItem>
                  <SelectItem value="business_type">🏪 انواع اصناف</SelectItem>
                  <SelectItem value="territory">🗺️ مناطق</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">نوع ارتباط:</label>
              <Select value={selectedEdgeType} onValueChange={setSelectedEdgeType}>
                <SelectTrigger className="w-[200px]" data-testid="edge-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه ارتباطات</SelectItem>
                  <SelectItem value="banking_connection">🔗 ارتباط بانکی</SelectItem>
                  <SelectItem value="business_relation">🤝 ارتباط تجاری</SelectItem>
                  <SelectItem value="territorial_assignment">📍 تخصیص منطقه‌ای</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spider Web Visualization */}
          <div 
            ref={containerRef}
            className="w-full h-[500px] border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden"
            data-testid="spider-web-network"
          >
            <svg ref={svgRef} className="w-full h-full" />
            
            {/* Node Details Panel */}
            {selectedNode && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg max-w-[250px]">
                <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
                <p className="text-xs text-muted-foreground mb-2">{selectedNode.nodeType}</p>
                {selectedNode.value > 0 && (
                  <p className="text-xs">
                    💰 {(selectedNode.value / 1000000).toFixed(1)}M تومان
                  </p>
                )}
                {selectedNode.properties?.customerCount && (
                  <p className="text-xs">
                    👥 {selectedNode.properties.customerCount} مشتری
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Type Distribution */}
      {networkStats?.businessTypeDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>توزیع درآمد بر اساس نوع صنف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {networkStats.businessTypeDistribution.slice(0, 6).map((item, index) => (
                <div key={item.businessType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.businessType}</p>
                    <p className="text-xs text-muted-foreground">{item.customerCount} مشتری</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{(item.revenue / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Analytics */}
      {performanceAnalytics && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Performing Units */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                برترین واحدهای بانکی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAnalytics.topPerformingUnits.map((unit, index) => (
                  <div 
                    key={unit.unitId} 
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border-l-4 border-l-green-500"
                    data-testid={`top-unit-${index}`}
                  >
                    <div>
                      <div className="font-medium text-sm">{unit.unitName}</div>
                      <div className="text-xs text-muted-foreground">
                        {unit.deviceCount} دستگاه POS • {unit.efficiency.toFixed(1)}% کارایی
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-600 hover:bg-green-700">
                        #{index + 1}
                      </Badge>
                      <div className="text-sm font-bold text-green-700 mt-1">
                        {(unit.revenue / 1000000).toFixed(1)}M تومان
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Under Performing Units */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                واحدهای نیازمند توجه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAnalytics.underPerformingUnits.map((unit, index) => (
                  <div 
                    key={unit.unitId} 
                    className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border-l-4 border-l-red-500"
                    data-testid={`under-unit-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{unit.unitName}</div>
                      <div className="text-sm font-bold text-red-700">
                        {(unit.revenue / 1000000).toFixed(1)}M تومان
                      </div>
                    </div>
                    <div className="space-y-1">
                      {unit.issues.map((issue, issueIndex) => (
                        <Badge 
                          key={issueIndex}
                          variant="destructive" 
                          className="text-xs mr-1"
                          data-testid={`unit-issue-${index}-${issueIndex}`}
                        >
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Centrality and Connection Analysis */}
      {performanceAnalytics && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Network Centrality */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                مرکزیت شبکه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAnalytics.centralityMetrics.slice(0, 5).map((metric, index) => (
                  <div 
                    key={metric.nodeId} 
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg"
                    data-testid={`centrality-${index}`}
                  >
                    <div>
                      <div className="font-medium text-sm">{metric.nodeName}</div>
                      <div className="text-xs text-muted-foreground">
                        اهمیت: {metric.importance === 'high' ? 'بالا' : metric.importance === 'medium' ? 'متوسط' : 'پایین'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-blue-700">
                        میزان ارتباط: {metric.degreeCentrality}%
                      </div>
                      <div className="text-xs text-blue-600">
                        واسطگی: {metric.betweennessCentrality}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connection Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                قدرت ارتباطات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAnalytics.connectionStrengths.slice(0, 5).map((connection, index) => (
                  <div 
                    key={`${connection.sourceNode}-${connection.targetNode}`}
                    className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg"
                    data-testid={`connection-${index}`}
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {connection.sourceNode} ← → {connection.targetNode}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {connection.type === 'revenue_connection' ? 'ارتباط درآمدی' : connection.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-purple-600 hover:bg-purple-700">
                        {connection.strength}M
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}