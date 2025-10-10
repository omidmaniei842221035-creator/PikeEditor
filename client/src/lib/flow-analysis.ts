// Flow and Origin-Destination Analysis Library
// Advanced flow analysis for customer movements and transaction patterns

export interface FlowNode {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'source' | 'destination' | 'hub';
  properties: {
    district?: string;
    totalIn: number;
    totalOut: number;
    netFlow: number;
    businessTypes: string[];
    customerCount: number;
    monthlyVolume: number;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  properties: {
    volume: number;
    value: number;
    growth: number; // Percentage growth/decline
    transactionCount: number;
    averageValue: number;
    seasonality: 'peak' | 'normal' | 'low';
    direction: 'bidirectional' | 'unidirectional';
  };
}

export interface ODPair {
  origin: [number, number];
  destination: [number, number];
  volume: number;
  value: number;
  growth: number;
  type: string;
  color: [number, number, number];
  thickness: number;
}

export interface FlowMetrics {
  totalVolume: number;
  totalValue: number;
  avgGrowth: number;
  topSources: FlowNode[];
  topDestinations: FlowNode[];
  dominantFlows: FlowEdge[];
  emergingRoutes: FlowEdge[];
  decliningRoutes: FlowEdge[];
}

export class FlowODAnalyzer {
  private nodes: FlowNode[] = [];
  private edges: FlowEdge[] = [];
  private odPairs: ODPair[] = [];

  constructor(customers: any[], branches: any[], bankingUnits: any[], transactions: any[] = []) {
    this.initializeFromData(customers, branches, bankingUnits, transactions);
  }

  private initializeFromData(customers: any[], branches: any[], bankingUnits: any[], transactions: any[]): void {
    // Create nodes from branches and banking units
    this.nodes = this.createFlowNodes(customers, branches, bankingUnits);
    
    // Create edges from customer relationships and transaction patterns
    this.edges = this.createFlowEdges(customers, branches, bankingUnits);
    
    // Generate OD pairs for visualization
    this.odPairs = this.createODPairs();
  }

  private createFlowNodes(customers: any[], branches: any[], bankingUnits: any[]): FlowNode[] {
    const nodes: FlowNode[] = [];
    const nodeMap = new Map<string, FlowNode>();

    // Create nodes from banking units (major hubs)
    bankingUnits.forEach(unit => {
      const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
      const totalOut = unitCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
      
      const node: FlowNode = {
        id: `banking_${unit.id}`,
        name: unit.name,
        coordinates: [parseFloat(unit.latitude), parseFloat(unit.longitude)],
        type: 'hub',
        properties: {
          district: unit.address,
          totalIn: totalOut * 0.8, // Simulated incoming flow
          totalOut: totalOut,
          netFlow: totalOut * 0.2,
          businessTypes: [...new Set(unitCustomers.map(c => c.businessType))],
          customerCount: unitCustomers.length,
          monthlyVolume: totalOut
        }
      };
      
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Create nodes from customer clusters (by district/area)
    const customerClusters = this.clusterCustomersByArea(customers);
    
    customerClusters.forEach(cluster => {
      const totalVolume = cluster.customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
      const avgLat = cluster.customers.reduce((sum, c) => sum + parseFloat(c.latitude), 0) / cluster.customers.length;
      const avgLng = cluster.customers.reduce((sum, c) => sum + parseFloat(c.longitude), 0) / cluster.customers.length;
      
      // Determine if it's primarily a source or destination
      const isSource = cluster.customers.some(c => ['سوپرمارکت', 'فروشگاه', 'مرکز خرید'].includes(c.businessType));
      
      const node: FlowNode = {
        id: `cluster_${cluster.id}`,
        name: `منطقه ${cluster.name}`,
        coordinates: [avgLat, avgLng],
        type: isSource ? 'source' : 'destination',
        properties: {
          district: cluster.name,
          totalIn: isSource ? totalVolume * 0.3 : totalVolume,
          totalOut: isSource ? totalVolume : totalVolume * 0.7,
          netFlow: isSource ? totalVolume * 0.7 : -totalVolume * 0.3,
          businessTypes: [...new Set(cluster.customers.map(c => c.businessType))],
          customerCount: cluster.customers.length,
          monthlyVolume: totalVolume
        }
      };
      
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    return nodes;
  }

  private clusterCustomersByArea(customers: any[]): any[] {
    const clusters: any[] = [];
    const gridSize = 0.01; // ~1km grid
    const clusterMap = new Map<string, any>();

    customers.forEach(customer => {
      const lat = parseFloat(customer.latitude);
      const lng = parseFloat(customer.longitude);
      const gridKey = `${Math.floor(lat / gridSize)}_${Math.floor(lng / gridSize)}`;
      
      if (!clusterMap.has(gridKey)) {
        clusterMap.set(gridKey, {
          id: gridKey,
          name: this.generateAreaName(lat, lng),
          customers: [],
          bounds: {
            minLat: Math.floor(lat / gridSize) * gridSize,
            maxLat: (Math.floor(lat / gridSize) + 1) * gridSize,
            minLng: Math.floor(lng / gridSize) * gridSize,
            maxLng: (Math.floor(lng / gridSize) + 1) * gridSize
          }
        });
      }
      
      clusterMap.get(gridKey)!.customers.push(customer);
    });

    return Array.from(clusterMap.values()).filter(cluster => cluster.customers.length >= 2);
  }

  private generateAreaName(lat: number, lng: number): string {
    // Simple area naming based on coordinates
    const areaNames = [
      'شمال شرق', 'شمال غرب', 'جنوب شرق', 'جنوب غرب', 
      'مرکز شهر', 'حومه شمال', 'حومه جنوب', 'منطقه صنعتی',
      'بازار مرکزی', 'منطقه تجاری', 'محله سکونی', 'منطقه اداری'
    ];
    
    const hash = Math.abs((lat * lng * 1000) % areaNames.length);
    return areaNames[Math.floor(hash)];
  }

  private createFlowEdges(customers: any[], branches: any[], bankingUnits: any[]): FlowEdge[] {
    const edges: FlowEdge[] = [];
    const connectionMap = new Map<string, FlowEdge>();
    const maxEdges = 1000; // Performance cap
    let edgeCount = 0;

    // Create flows between banking units and customer clusters
    const hubNodes = this.nodes.filter(n => n.type === 'hub');
    const nonHubNodes = this.nodes.filter(n => n.type !== 'hub');

    hubNodes.forEach(sourceNode => {
      if (edgeCount >= maxEdges) return;
      
      // Use spatial filtering to reduce computation
      const nearbyNodes = nonHubNodes.filter(targetNode => {
        const distance = this.calculateDistance(sourceNode.coordinates, targetNode.coordinates);
        return distance < 10000; // Pre-filter by 10km radius
      });

      nearbyNodes.forEach(targetNode => {
        if (edgeCount >= maxEdges) return;
        
        const distance = this.calculateDistance(sourceNode.coordinates, targetNode.coordinates);
        const flowVolume = Math.min(
          sourceNode.properties.totalOut,
          targetNode.properties.totalIn
        ) * (1 / Math.max(1, distance / 1000)); // Distance decay with minimum
        
        if (flowVolume > 1000000) { // Minimum threshold
          const growth = this.calculateGrowth(sourceNode, targetNode);
          
          const edge: FlowEdge = {
            id: `flow_${sourceNode.id}_${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
            properties: {
              volume: flowVolume,
              value: flowVolume,
              growth: growth,
              transactionCount: Math.floor(flowVolume / 50000),
              averageValue: 50000,
              seasonality: growth > 10 ? 'peak' : growth < -5 ? 'low' : 'normal',
              direction: flowVolume > sourceNode.properties.totalOut * 0.1 ? 'bidirectional' : 'unidirectional'
            }
          };
          
          edges.push(edge);
          connectionMap.set(edge.id, edge);
          edgeCount++;
        }
      });
    });

    // Create inter-cluster flows with spatial grid optimization
    if (edgeCount < maxEdges) {
      const gridSize = 0.02; // ~2km grid for spatial hashing
      const spatialGrid = new Map<string, FlowNode[]>();
      
      // Build spatial grid
      nonHubNodes.forEach(node => {
        const [lat, lng] = node.coordinates;
        if (this.isValidCoordinate([lat, lng])) {
          const gridKey = `${Math.floor(lat / gridSize)}_${Math.floor(lng / gridSize)}`;
          if (!spatialGrid.has(gridKey)) {
            spatialGrid.set(gridKey, []);
          }
          spatialGrid.get(gridKey)!.push(node);
        }
      });

      // Generate flows within and between adjacent grid cells
      spatialGrid.forEach((gridNodes, gridKey) => {
        if (edgeCount >= maxEdges) return;
        
        gridNodes.forEach(source => {
          if (edgeCount >= maxEdges) return;
          
          // Check same grid and adjacent grids
          const [gridLat, gridLng] = gridKey.split('_').map(Number);
          for (let dLat = -1; dLat <= 1; dLat++) {
            for (let dLng = -1; dLng <= 1; dLng++) {
              const adjacentKey = `${gridLat + dLat}_${gridLng + dLng}`;
              const adjacentNodes = spatialGrid.get(adjacentKey) || [];
              
              adjacentNodes.forEach(target => {
                if (edgeCount >= maxEdges || source.id === target.id) return;
                
                const distance = this.calculateDistance(source.coordinates, target.coordinates);
                const businessSimilarity = this.calculateBusinessSimilarity(
                  source.properties.businessTypes,
                  target.properties.businessTypes
                );
                
                if (distance < 5000 && businessSimilarity > 0.3) {
                  const flowVolume = Math.min(source.properties.totalOut, target.properties.totalIn) * businessSimilarity * 0.1;
                  
                  if (flowVolume > 500000) {
                    const growth = this.calculateGrowth(source, target);
                    
                    const edge: FlowEdge = {
                      id: `inter_${source.id}_${target.id}`,
                      source: source.id,
                      target: target.id,
                      properties: {
                        volume: flowVolume,
                        value: flowVolume,
                        growth: growth,
                        transactionCount: Math.floor(flowVolume / 30000),
                        averageValue: 30000,
                        seasonality: 'normal',
                        direction: 'bidirectional'
                      }
                    };
                    
                    edges.push(edge);
                    edgeCount++;
                  }
                }
              });
            }
          }
        });
      });
    }

    return edges;
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private calculateBusinessSimilarity(types1: string[], types2: string[]): number {
    const set1 = new Set(types1);
    const set2 = new Set(types2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateGrowth(source: FlowNode, target: FlowNode): number {
    // Simulate growth based on node characteristics
    const sourceGrowth = source.properties.netFlow > 0 ? 15 : -5;
    const targetGrowth = target.properties.netFlow > 0 ? 10 : -8;
    const distanceDecay = this.calculateDistance(source.coordinates, target.coordinates) / 1000;
    
    return (sourceGrowth + targetGrowth) / 2 - distanceDecay * 0.5 + (Math.random() - 0.5) * 10;
  }

  private createODPairs(): ODPair[] {
    const validEdges = this.edges.filter(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);
      return sourceNode && targetNode && 
             this.isValidCoordinate(sourceNode.coordinates) && 
             this.isValidCoordinate(targetNode.coordinates);
    });

    if (validEdges.length === 0) return [];

    const maxVolume = Math.max(...validEdges.map(e => e.properties.volume));
    
    return validEdges.map(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source)!;
      const targetNode = this.nodes.find(n => n.id === edge.target)!;

      // Determine color based on growth
      let color: [number, number, number];
      if (edge.properties.growth > 10) {
        color = [0, 255, 0]; // Green for high growth
      } else if (edge.properties.growth > 0) {
        color = [255, 255, 0]; // Yellow for moderate growth
      } else if (edge.properties.growth > -10) {
        color = [255, 165, 0]; // Orange for slight decline
      } else {
        color = [255, 0, 0]; // Red for significant decline
      }

      // Calculate thickness based on volume (clamped)
      const minThickness = 2;
      const maxThickness = 15;
      const normalizedVolume = maxVolume > 0 ? edge.properties.volume / maxVolume : 0;
      const thickness = Math.max(minThickness, Math.min(maxThickness, minThickness + normalizedVolume * (maxThickness - minThickness)));

      return {
        origin: sourceNode.coordinates, // Keep [lat, lng] format - will be flipped in render
        destination: targetNode.coordinates, // Keep [lat, lng] format - will be flipped in render
        volume: edge.properties.volume,
        value: edge.properties.value,
        growth: edge.properties.growth,
        type: edge.properties.seasonality,
        color: color,
        thickness: thickness
      };
    });
  }

  private isValidCoordinate(coord: [number, number]): boolean {
    const [lat, lng] = coord;
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  // Public methods
  getFlowMetrics(): FlowMetrics {
    const totalVolume = this.edges.reduce((sum, e) => sum + e.properties.volume, 0);
    const totalValue = this.edges.reduce((sum, e) => sum + e.properties.value, 0);
    const avgGrowth = this.edges.reduce((sum, e) => sum + e.properties.growth, 0) / this.edges.length;

    const sortedEdges = [...this.edges].sort((a, b) => b.properties.volume - a.properties.volume);
    const growingEdges = this.edges.filter(e => e.properties.growth > 5).sort((a, b) => b.properties.growth - a.properties.growth);
    const decliningEdges = this.edges.filter(e => e.properties.growth < -5).sort((a, b) => a.properties.growth - b.properties.growth);

    return {
      totalVolume,
      totalValue,
      avgGrowth,
      topSources: this.nodes.filter(n => n.type === 'source').sort((a, b) => b.properties.totalOut - a.properties.totalOut).slice(0, 5),
      topDestinations: this.nodes.filter(n => n.type === 'destination').sort((a, b) => b.properties.totalIn - a.properties.totalIn).slice(0, 5),
      dominantFlows: sortedEdges.slice(0, 10),
      emergingRoutes: growingEdges.slice(0, 5),
      decliningRoutes: decliningEdges.slice(0, 5)
    };
  }

  getODPairs(): ODPair[] {
    return this.odPairs;
  }

  getNodes(): FlowNode[] {
    return this.nodes;
  }

  getEdges(): FlowEdge[] {
    return this.edges;
  }

  // Advanced analytics
  identifyBottlenecks(): FlowNode[] {
    return this.nodes.filter(node => {
      const incomingFlow = this.edges.filter(e => e.target === node.id).reduce((sum, e) => sum + e.properties.volume, 0);
      const outgoingFlow = this.edges.filter(e => e.source === node.id).reduce((sum, e) => sum + e.properties.volume, 0);
      
      return Math.abs(incomingFlow - outgoingFlow) / Math.max(incomingFlow, outgoingFlow) > 0.3;
    });
  }

  findOptimalExpansionSites(currentNodes: FlowNode[]): { coordinates: [number, number], score: number, reasoning: string }[] {
    const expansionSites: { coordinates: [number, number], score: number, reasoning: string }[] = [];
    
    // Find areas with high flow but low service coverage
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && edge.properties.volume > 2000000) {
        const midpoint: [number, number] = [
          (sourceNode.coordinates[0] + targetNode.coordinates[0]) / 2,
          (sourceNode.coordinates[1] + targetNode.coordinates[1]) / 2
        ];
        
        const nearbyService = this.nodes.find(n => 
          n.type === 'hub' && this.calculateDistance(n.coordinates, midpoint) < 3000
        );
        
        if (!nearbyService) {
          const score = edge.properties.volume / 1000000 + edge.properties.growth * 0.1;
          expansionSites.push({
            coordinates: midpoint,
            score,
            reasoning: `منطقه پرترافیک با حجم ${Math.round(edge.properties.volume / 1000000)}M و رشد ${edge.properties.growth.toFixed(1)}%`
          });
        }
      }
    });
    
    return expansionSites.sort((a, b) => b.score - a.score).slice(0, 5);
  }
}