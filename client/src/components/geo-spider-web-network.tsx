import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Network, TrendingUp, Target, Layers, ZoomIn, ZoomOut } from "lucide-react";
import { initializeMap } from "@/lib/map-utils";

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
  // Geographic coordinates for map placement
  latitude?: number;
  longitude?: number;
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
}

// Tabriz coordinates bounds for node placement
const TABRIZ_BOUNDS = {
  north: 38.1200,
  south: 38.0400,
  east: 46.3400,
  west: 46.2200
};

// Generate geographic coordinates for nodes based on their type and properties
function generateNodeCoordinates(node: NetworkNode, index: number, totalNodes: number): { lat: number, lng: number } {
  const baseLatitude = 38.0800; // Tabriz center latitude
  const baseLongitude = 46.2919; // Tabriz center longitude
  
  // Different placement strategies based on node type
  switch (node.nodeType) {
    case 'banking_unit':
      // Banking units spread around the city center
      const bankingAngle = (index * 2 * Math.PI) / totalNodes;
      const bankingRadius = 0.015; // ~1.5km radius
      return {
        lat: baseLatitude + Math.cos(bankingAngle) * bankingRadius,
        lng: baseLongitude + Math.sin(bankingAngle) * bankingRadius
      };
      
    case 'business_type':
      // Business types in different districts
      const businessAngle = (index * 2 * Math.PI) / totalNodes + Math.PI / 4;
      const businessRadius = 0.025; // ~2.5km radius
      return {
        lat: baseLatitude + Math.cos(businessAngle) * businessRadius,
        lng: baseLongitude + Math.sin(businessAngle) * businessRadius
      };
      
    case 'territory':
      // Territories at outer edges
      const territoryAngle = (index * 2 * Math.PI) / totalNodes + Math.PI / 2;
      const territoryRadius = 0.035; // ~3.5km radius
      return {
        lat: baseLatitude + Math.cos(territoryAngle) * territoryRadius,
        lng: baseLongitude + Math.sin(territoryAngle) * territoryRadius
      };
      
    default:
      // Random placement within city bounds
      return {
        lat: TABRIZ_BOUNDS.south + Math.random() * (TABRIZ_BOUNDS.north - TABRIZ_BOUNDS.south),
        lng: TABRIZ_BOUNDS.west + Math.random() * (TABRIZ_BOUNDS.east - TABRIZ_BOUNDS.west)
      };
  }
}

export function GeoSpiderWebNetwork() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const linesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState("all");
  const [selectedEdgeType, setSelectedEdgeType] = useState("all");
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const { data: networkData, isLoading, refetch } = useQuery<NetworkData>({
    queryKey: ["/api/network/spider-web"],
    refetchInterval: 30000,
  });

  const { data: performanceAnalytics } = useQuery<PerformanceAnalytics>({
    queryKey: ["/api/network/performance-analytics"],
    refetchInterval: 30000,
  });

  // Initialize map
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      if (mapRef.current && !mapInstanceRef.current && mounted) {
        try {
          mapInstanceRef.current = await initializeMap(mapRef.current);
          if (mounted && mapInstanceRef.current?.map) {
            setMapReady(true);
          }
        } catch (error) {
          console.error('Failed to initialize geo spider web map:', error);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Clear existing markers and lines
  const clearMapElements = useCallback(() => {
    if (typeof window === 'undefined' || !(window as any).L) return;
    
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    linesRef.current.forEach(line => line.remove());
    linesRef.current = [];
  }, []);

  // Add network visualization to map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current?.map || !networkData || typeof window === 'undefined' || !(window as any).L) {
      return;
    }

    const L = (window as any).L;
    clearMapElements();

    // Filter nodes based on selected type
    let filteredNodes = networkData.nodes;
    if (selectedNodeType !== "all") {
      filteredNodes = filteredNodes.filter(node => node.nodeType === selectedNodeType);
    }

    // Assign geographic coordinates to nodes
    const nodesWithCoords = filteredNodes.map((node, index) => {
      const coords = generateNodeCoordinates(node, index, filteredNodes.length);
      return { ...node, latitude: coords.lat, longitude: coords.lng };
    });

    // Filter edges based on node availability and selected type
    let filteredEdges = networkData.edges;
    if (selectedEdgeType !== "all") {
      filteredEdges = filteredEdges.filter(edge => edge.edgeType === selectedEdgeType);
    }
    
    const nodeIdSet = new Set(nodesWithCoords.map(n => n.id));
    const validEdges = filteredEdges.filter(edge => 
      nodeIdSet.has(edge.sourceNodeId) && nodeIdSet.has(edge.targetNodeId)
    );

    // Add edges as lines first (so they appear behind markers)
    validEdges.forEach(edge => {
      const sourceNode = nodesWithCoords.find(n => n.id === edge.sourceNodeId);
      const targetNode = nodesWithCoords.find(n => n.id === edge.targetNodeId);
      
      if (sourceNode && targetNode && sourceNode.latitude && sourceNode.longitude && 
          targetNode.latitude && targetNode.longitude) {
        
        const line = L.polyline([
          [sourceNode.latitude, sourceNode.longitude],
          [targetNode.latitude, targetNode.longitude]
        ], {
          color: edge.color,
          weight: Math.max(1, edge.width),
          opacity: 0.7,
          dashArray: edge.edgeType === 'revenue_flow' ? '5, 5' : undefined
        });

        line.bindPopup(`
          <div class="text-right" dir="rtl">
            <strong>${edge.edgeType}</strong><br>
            <span class="text-sm">ارزش: ${(edge.value / 1000000).toFixed(1)}M ریال</span><br>
            <span class="text-sm">وزن: ${edge.weight}</span>
          </div>
        `);

        line.addTo(mapInstanceRef.current.map);
        linesRef.current.push(line);
      }
    });

    // Add nodes as markers
    nodesWithCoords.forEach(node => {
      if (!node.latitude || !node.longitude) return;

      // Create custom icon based on node type
      const iconSize = Math.max(20, Math.min(60, node.size));
      const iconHtml = `
        <div style="
          background: ${node.color};
          width: ${iconSize}px;
          height: ${iconSize}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.max(10, iconSize / 4)}px;
        ">
          ${node.nodeType === 'banking_unit' ? '🏦' : 
            node.nodeType === 'business_type' ? '🏢' : 
            node.nodeType === 'territory' ? '📍' : '⭐'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'geo-network-node',
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2]
      });

      const marker = L.marker([node.latitude, node.longitude], { 
        icon: customIcon 
      });

      // Add popup with node information
      const popupContent = `
        <div class="text-right" dir="rtl">
          <h4 class="font-bold mb-2">${node.label}</h4>
          <div class="space-y-1 text-sm">
            <div><strong>نوع:</strong> ${node.nodeType}</div>
            <div><strong>ارزش:</strong> ${(node.value / 1000000).toFixed(1)}M ریال</div>
            <div><strong>گروه:</strong> ${node.group}</div>
            ${node.properties?.customerCount ? `<div><strong>تعداد مشتری:</strong> ${node.properties.customerCount}</div>` : ''}
            ${node.properties?.avgRevenue ? `<div><strong>متوسط درآمد:</strong> ${(node.properties.avgRevenue / 1000000).toFixed(1)}M ریال</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Handle node selection
      marker.on('click', () => {
        setSelectedNode(node);
      });

      marker.addTo(mapInstanceRef.current.map);
      markersRef.current.push(marker);

      // Add label if enabled
      if (showLabels) {
        const label = L.marker([node.latitude, node.longitude], {
          icon: L.divIcon({
            html: `<div style="
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              white-space: nowrap;
              transform: translateY(-${iconSize + 10}px);
            ">${node.label}</div>`,
            className: 'geo-network-label',
            iconSize: [0, 0]
          })
        });
        label.addTo(mapInstanceRef.current.map);
        markersRef.current.push(label);
      }
    });

  }, [mapReady, networkData, selectedNodeType, selectedEdgeType, showLabels, clearMapElements]);

  const nodeTypes = networkData?.nodes 
    ? Array.from(new Set(networkData.nodes.map(node => node.nodeType)))
    : [];
    
  const edgeTypes = networkData?.edges 
    ? Array.from(new Set(networkData.edges.map(edge => edge.edgeType)))
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>در حال بارگذاری نقشه تار عنکبوت جغرافیایی...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Control Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              نقشه تار عنکبوت جغرافیایی
            </CardTitle>
            <Button onClick={() => refetch()} size="sm" variant="outline" data-testid="button-refresh-geo-network">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="node-type-select" className="text-sm font-medium">نوع گره:</label>
              <Select value={selectedNodeType} onValueChange={setSelectedNodeType}>
                <SelectTrigger className="w-40" data-testid="select-node-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {nodeTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="edge-type-select" className="text-sm font-medium">نوع ارتباط:</label>
              <Select value={selectedEdgeType} onValueChange={setSelectedEdgeType}>
                <SelectTrigger className="w-40" data-testid="select-edge-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {edgeTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={() => setShowLabels(!showLabels)} 
              variant={showLabels ? "default" : "outline"}
              size="sm"
              data-testid="button-toggle-labels"
            >
              {showLabels ? "مخفی کردن برچسب‌ها" : "نمایش برچسب‌ها"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg"
            data-testid="geo-spider-web-map"
          />
        </CardContent>
      </Card>

      {/* Network Statistics */}
      {networkData && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{networkData.metadata.nodeCount}</div>
              <p className="text-xs text-muted-foreground">تعداد گره‌ها</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{networkData.metadata.edgeCount}</div>
              <p className="text-xs text-muted-foreground">تعداد ارتباطات</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{networkData.metadata.businessTypeCount}</div>
              <p className="text-xs text-muted-foreground">انواع کسب‌وکار</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{networkData.metadata.bankingUnitCount}</div>
              <p className="text-xs text-muted-foreground">واحدهای بانکی</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Analytics Panel */}
      {performanceAnalytics && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Top Performing Units */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                واحدهای برتر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAnalytics.topPerformingUnits.map((unit) => (
                  <div key={unit.unitId} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">{unit.unitName}</div>
                      <div className="text-sm text-gray-600">
                        {unit.deviceCount} دستگاه POS • کارایی {unit.efficiency}%
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-green-600">
                        {(unit.revenue / 1000000).toFixed(1)}M ریال
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Underperforming Units */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Target className="h-5 w-5" />
                واحدهای نیازمند توجه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceAnalytics.underPerformingUnits.map((unit) => (
                  <div key={unit.unitId} className="flex justify-between items-start p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{unit.unitName}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        درآمد: {(unit.revenue / 1000000).toFixed(1)}M ریال
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {unit.issues.map((issue, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>جزئیات گره انتخاب شده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>نام:</strong> {selectedNode.label}</div>
              <div><strong>نوع:</strong> {selectedNode.nodeType}</div>
              <div><strong>ارزش:</strong> {(selectedNode.value / 1000000).toFixed(2)} میلیون ریال</div>
              <div><strong>گروه:</strong> {selectedNode.group}</div>
              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <div>
                  <strong>ویژگی‌های اضافی:</strong>
                  <pre className="text-sm mt-1 p-2 bg-gray-100 rounded">
                    {JSON.stringify(selectedNode.properties, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}