// Urban Graph Analysis Library
// Implements graph-based urban analysis using D3.js force simulation

export interface UrbanNode {
  id: string;
  type: 'neighborhood' | 'street' | 'business_cluster' | 'banking_unit';
  name: string;
  coordinates: [number, number];
  properties: {
    businessTypes?: string[];
    customerCount?: number;
    revenue?: number;
    bankingUnitId?: string;
    district?: string;
    posDevices?: number;
  };
  x?: number;
  y?: number;
  index?: number;
}

export interface UrbanEdge {
  id: string;
  source: string | UrbanNode;
  target: string | UrbanNode;
  type: 'customer_flow' | 'business_similarity' | 'physical_proximity' | 'revenue_flow';
  weight: number;
  properties: {
    distance?: number;
    flowVolume?: number;
    similarity?: number;
    revenueFlow?: number;
  };
}

export interface Community {
  id: string;
  nodes: string[];
  centralityScore: number;
  characteristics: {
    dominantBusinessTypes: string[];
    averageRevenue: number;
    customerDensity: number;
    connectivity: number;
  };
}

export interface CentralityResult {
  nodeId: string;
  betweenness: number;
  closeness: number;
  degree: number;
  eigenvector: number;
}

export interface SpilloverEffect {
  sourceNode: string;
  affectedNodes: {
    nodeId: string;
    impactStrength: number;
    impactType: 'revenue_boost' | 'customer_increase' | 'business_expansion';
  }[];
  decayRadius: number;
}

export class UrbanGraphAnalyzer {
  private nodes: UrbanNode[] = [];
  private edges: UrbanEdge[] = [];
  private simulation: any = null;

  constructor(nodes: UrbanNode[], edges: UrbanEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.initializeSimulation();
  }

  private initializeSimulation(): void {
    // Custom force simulation without D3 dependencies
    this.simulation = {
      nodes: this.nodes,
      edges: this.edges,
      running: false
    };
  }

  // Community Detection using Louvain-like algorithm
  detectCommunities(): Community[] {
    const communities: Community[] = [];
    const visited = new Set<string>();
    const adjacencyMap = this.buildAdjacencyMap();

    this.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const community = this.expandCommunity(node, adjacencyMap, visited);
        if (community.nodes.length > 1) {
          communities.push(community);
        }
      }
    });

    return communities.map(community => ({
      ...community,
      centralityScore: this.calculateCommunityCentrality(community),
      characteristics: this.analyzeCommunityCharacteristics(community)
    }));
  }

  private buildAdjacencyMap(): Map<string, Set<string>> {
    const adjacencyMap = new Map<string, Set<string>>();
    
    this.nodes.forEach(node => {
      adjacencyMap.set(node.id, new Set());
    });

    this.edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      adjacencyMap.get(sourceId)?.add(targetId);
      adjacencyMap.get(targetId)?.add(sourceId);
    });

    return adjacencyMap;
  }

  private expandCommunity(
    seedNode: UrbanNode, 
    adjacencyMap: Map<string, Set<string>>,
    visited: Set<string>
  ): Community {
    const communityNodes = new Set<string>();
    const queue = [seedNode.id];
    visited.add(seedNode.id);
    communityNodes.add(seedNode.id);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const neighbors = adjacencyMap.get(currentNodeId) || new Set();

      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          const neighbor = this.nodes.find(n => n.id === neighborId);
          if (neighbor && this.shouldJoinCommunity(currentNodeId, neighborId)) {
            visited.add(neighborId);
            communityNodes.add(neighborId);
            queue.push(neighborId);
          }
        }
      });
    }

    return {
      id: `community_${seedNode.id}`,
      nodes: Array.from(communityNodes),
      centralityScore: 0, // Will be calculated later
      characteristics: {
        dominantBusinessTypes: [],
        averageRevenue: 0,
        customerDensity: 0,
        connectivity: 0
      }
    };
  }

  private shouldJoinCommunity(nodeId1: string, nodeId2: string): boolean {
    const node1 = this.nodes.find(n => n.id === nodeId1);
    const node2 = this.nodes.find(n => n.id === nodeId2);
    
    if (!node1 || !node2) return false;

    // Business similarity check
    const businessSimilarity = this.calculateBusinessSimilarity(node1, node2);
    
    // Geographic proximity check
    const distance = this.calculateDistance(
      node1.coordinates, 
      node2.coordinates
    );

    // Connection strength check - normalize edge endpoints to strings
    const edge = this.edges.find(e => {
      const sourceId = typeof e.source === 'string' ? e.source : e.source.id;
      const targetId = typeof e.target === 'string' ? e.target : e.target.id;
      return (sourceId === nodeId1 && targetId === nodeId2) ||
             (sourceId === nodeId2 && targetId === nodeId1);
    });

    const connectionStrength = edge ? edge.weight : 0;

    return businessSimilarity > 0.3 || distance < 1000 || connectionStrength > 0.5;
  }

  private calculateBusinessSimilarity(node1: UrbanNode, node2: UrbanNode): number {
    const types1 = new Set(node1.properties.businessTypes || []);
    const types2 = new Set(node2.properties.businessTypes || []);
    
    const types1Array = Array.from(types1);
    const types2Array = Array.from(types2);
    const intersection = new Set(types1Array.filter(x => types2.has(x)));
    const union = new Set([...types1Array, ...types2Array]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
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

  private calculateCommunityCentrality(community: Community): number {
    let totalCentrality = 0;
    community.nodes.forEach(nodeId => {
      const centrality = this.calculateBetweennessCentrality(nodeId);
      totalCentrality += centrality.betweenness;
    });
    return totalCentrality / community.nodes.length;
  }

  private analyzeCommunityCharacteristics(community: Community) {
    const communityNodes = this.nodes.filter(n => community.nodes.includes(n.id));
    
    const allBusinessTypes: string[] = [];
    let totalRevenue = 0;
    let totalCustomers = 0;
    let totalConnections = 0;

    communityNodes.forEach(node => {
      if (node.properties.businessTypes) {
        allBusinessTypes.push(...node.properties.businessTypes);
      }
      totalRevenue += node.properties.revenue || 0;
      totalCustomers += node.properties.customerCount || 0;
    });

    // Count internal connections
    this.edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      
      if (community.nodes.includes(sourceId) && community.nodes.includes(targetId)) {
        totalConnections++;
      }
    });

    // Find dominant business types
    const businessTypeCounts = allBusinessTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantBusinessTypes = Object.entries(businessTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    return {
      dominantBusinessTypes,
      averageRevenue: totalRevenue / communityNodes.length,
      customerDensity: totalCustomers / communityNodes.length,
      connectivity: totalConnections / (communityNodes.length * (communityNodes.length - 1) / 2)
    };
  }

  // Centrality Analysis
  calculateBetweennessCentrality(nodeId: string): CentralityResult {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const adjacencyMap = this.buildAdjacencyMap();
    
    // Simplified betweenness centrality calculation
    let betweenness = 0;
    const shortestPaths = this.calculateShortestPaths(nodeId, adjacencyMap);
    
    // Count how many shortest paths pass through this node
    this.nodes.forEach(source => {
      if (source.id === nodeId) return;
      
      this.nodes.forEach(target => {
        if (target.id === nodeId || target.id === source.id) return;
        
        const pathThroughNode = this.hasPathThroughNode(
          source.id, target.id, nodeId, adjacencyMap
        );
        
        if (pathThroughNode) {
          betweenness += 1;
        }
      });
    });

    // Calculate other centrality measures
    const degree = adjacencyMap.get(nodeId)?.size || 0;
    const closeness = this.calculateClosenessCentrality(nodeId, shortestPaths);
    const eigenvector = this.calculateEigenvectorCentrality(nodeId);

    return {
      nodeId,
      betweenness: betweenness / ((this.nodes.length - 1) * (this.nodes.length - 2) / 2),
      closeness,
      degree,
      eigenvector
    };
  }

  private calculateShortestPaths(
    startNodeId: string, 
    adjacencyMap: Map<string, Set<string>>
  ): Map<string, number> {
    const distances = new Map<string, number>();
    const queue = [startNodeId];
    distances.set(startNodeId, 0);

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      const currentDistance = distances.get(currentNodeId)!;
      
      const neighbors = adjacencyMap.get(currentNodeId) || new Set();
      neighbors.forEach(neighborId => {
        if (!distances.has(neighborId)) {
          distances.set(neighborId, currentDistance + 1);
          queue.push(neighborId);
        }
      });
    }

    return distances;
  }

  private hasPathThroughNode(
    sourceId: string,
    targetId: string,
    throughNodeId: string,
    adjacencyMap: Map<string, Set<string>>
  ): boolean {
    // Simple check: if shortest path from source to target goes through throughNode
    const pathToThrough = this.calculateShortestPaths(sourceId, adjacencyMap);
    const pathFromThrough = this.calculateShortestPaths(throughNodeId, adjacencyMap);
    const directPath = this.calculateShortestPaths(sourceId, adjacencyMap);

    const distanceToThrough = pathToThrough.get(throughNodeId) || Infinity;
    const distanceFromThrough = pathFromThrough.get(targetId) || Infinity;
    const directDistance = directPath.get(targetId) || Infinity;

    return (distanceToThrough + distanceFromThrough) === directDistance;
  }

  private calculateClosenessCentrality(
    nodeId: string,
    shortestPaths: Map<string, number>
  ): number {
    const totalDistance = Array.from(shortestPaths.values()).reduce((sum, dist) => sum + dist, 0);
    return totalDistance > 0 ? (this.nodes.length - 1) / totalDistance : 0;
  }

  private calculateEigenvectorCentrality(nodeId: string): number {
    // Simplified eigenvector centrality
    // In a real implementation, this would use iterative power method
    const adjacencyMap = this.buildAdjacencyMap();
    const neighbors = adjacencyMap.get(nodeId) || new Set();
    
    let score = 0;
    neighbors.forEach(neighborId => {
      const neighborNeighbors = adjacencyMap.get(neighborId)?.size || 0;
      score += neighborNeighbors;
    });

    return score / this.nodes.length;
  }

  // Spillover Effects Analysis
  analyzeSpilloverEffects(sourceNodeId: string, maxRadius: number = 2000): SpilloverEffect {
    const sourceNode = this.nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) {
      throw new Error(`Source node ${sourceNodeId} not found`);
    }

    const affectedNodes: SpilloverEffect['affectedNodes'] = [];

    this.nodes.forEach(node => {
      if (node.id === sourceNodeId) return;

      const distance = this.calculateDistance(
        sourceNode.coordinates,
        node.coordinates
      );

      if (distance <= maxRadius) {
        const impact = this.calculateSpilloverImpact(sourceNode, node, distance);
        
        if (impact.impactStrength > 0.1) { // Minimum threshold
          affectedNodes.push({
            nodeId: node.id,
            impactStrength: impact.impactStrength,
            impactType: impact.impactType
          });
        }
      }
    });

    return {
      sourceNode: sourceNodeId,
      affectedNodes: affectedNodes.sort((a, b) => b.impactStrength - a.impactStrength),
      decayRadius: maxRadius
    };
  }

  private calculateSpilloverImpact(
    sourceNode: UrbanNode,
    targetNode: UrbanNode,
    distance: number
  ): { impactStrength: number; impactType: SpilloverEffect['affectedNodes'][0]['impactType'] } {
    // Distance decay function
    const distanceDecay = Math.exp(-distance / 1000); // 1km decay constant
    
    // Business similarity boost
    const businessSimilarity = this.calculateBusinessSimilarity(sourceNode, targetNode);
    
    // Revenue potential impact
    const sourceRevenue = sourceNode.properties.revenue || 0;
    const targetRevenue = targetNode.properties.revenue || 1; // Avoid division by zero
    
    const revenueRatio = sourceRevenue / targetRevenue;
    
    // Calculate impact strength
    let impactStrength = distanceDecay * (0.3 + businessSimilarity * 0.7);
    
    // Determine impact type based on characteristics
    let impactType: SpilloverEffect['affectedNodes'][0]['impactType'] = 'customer_increase';
    
    if (revenueRatio > 2.0) {
      impactType = 'revenue_boost';
      impactStrength *= 1.2; // Revenue boost has higher impact
    } else if (businessSimilarity > 0.5) {
      impactType = 'business_expansion';
      impactStrength *= 1.1; // Similar businesses expand together
    }

    return { impactStrength: Math.min(impactStrength, 1.0), impactType };
  }

  // Utility methods
  getNodesByType(type: UrbanNode['type']): UrbanNode[] {
    return this.nodes.filter(node => node.type === type);
  }

  getEdgesByType(type: UrbanEdge['type']): UrbanEdge[] {
    return this.edges.filter(edge => edge.type === type);
  }

  updateSimulation(): void {
    if (this.simulation) {
      this.simulation.nodes(this.nodes);
      // Custom link force implementation
    this.updateSimulation();
      this.simulation.alpha(1).restart();
    }
  }

  getSimulation(): any {
    return this.simulation;
  }
}

// Factory function to create graph from customer and banking unit data
export function createUrbanGraphFromData(
  customers: any[],
  bankingUnits: any[],
  branches: any[]
): { nodes: UrbanNode[], edges: UrbanEdge[] } {
  const nodes: UrbanNode[] = [];
  const edges: UrbanEdge[] = [];

  // Create nodes from banking units
  bankingUnits.forEach(unit => {
    nodes.push({
      id: `banking_${unit.id}`,
      type: 'banking_unit',
      name: unit.name,
      coordinates: [parseFloat(unit.latitude), parseFloat(unit.longitude)],
      properties: {
        bankingUnitId: unit.id,
        district: unit.address
      }
    });
  });

  // Create business cluster nodes from customers
  const businessClusters = new Map<string, UrbanNode>();
  
  customers.forEach(customer => {
    const clusterKey = `${customer.businessType}_${Math.floor(customer.latitude * 100)}_${Math.floor(customer.longitude * 100)}`;
    
    if (!businessClusters.has(clusterKey)) {
      businessClusters.set(clusterKey, {
        id: `cluster_${clusterKey}`,
        type: 'business_cluster',
        name: `${customer.businessType} کلاستر`,
        coordinates: [parseFloat(customer.latitude), parseFloat(customer.longitude)],
        properties: {
          businessTypes: [customer.businessType],
          customerCount: 0,
          revenue: 0,
          bankingUnitId: customer.bankingUnitId,
          posDevices: 0
        }
      });
    }

    const cluster = businessClusters.get(clusterKey)!;
    cluster.properties.customerCount! += 1;
    cluster.properties.revenue! += customer.monthlyProfit || 0;
    cluster.properties.posDevices! += 1;
  });

  nodes.push(...Array.from(businessClusters.values()));

  // Create edges between related nodes
  nodes.forEach(node1 => {
    nodes.forEach(node2 => {
      if (node1.id >= node2.id) return; // Avoid duplicate edges

      const distance = calculateDistance(node1.coordinates, node2.coordinates);
      
      // Create proximity edges
      if (distance < 2000) { // 2km radius
        edges.push({
          id: `proximity_${node1.id}_${node2.id}`,
          source: node1.id,
          target: node2.id,
          type: 'physical_proximity',
          weight: 1 / (1 + distance / 1000), // Inverse distance weight
          properties: {
            distance
          }
        });
      }

      // Create business similarity edges
      if (node1.type === 'business_cluster' && node2.type === 'business_cluster') {
        const types1 = new Set(node1.properties.businessTypes || []);
        const types2 = new Set(node2.properties.businessTypes || []);
        const intersection = new Set([...types1].filter(x => types2.has(x)));
        const union = new Set([...types1, ...types2]);
        
        const similarity = union.size > 0 ? intersection.size / union.size : 0;
        
        if (similarity > 0.3) {
          edges.push({
            id: `similarity_${node1.id}_${node2.id}`,
            source: node1.id,
            target: node2.id,
            type: 'business_similarity',
            weight: similarity,
            properties: {
              similarity
            }
          });
        }
      }

      // Create banking unit connections
      if (node1.type === 'banking_unit' || node2.type === 'banking_unit') {
        const bankingNode = node1.type === 'banking_unit' ? node1 : node2;
        const businessNode = node1.type === 'business_cluster' ? node1 : node2;
        
        if (businessNode.type === 'business_cluster' && 
            businessNode.properties.bankingUnitId === bankingNode.properties.bankingUnitId) {
          edges.push({
            id: `banking_${bankingNode.id}_${businessNode.id}`,
            source: bankingNode.id,
            target: businessNode.id,
            type: 'revenue_flow',
            weight: (businessNode.properties.revenue || 0) / 1000000, // Normalize revenue
            properties: {
              revenueFlow: businessNode.properties.revenue || 0
            }
          });
        }
      }
    });
  });

  return { nodes, edges };
}

function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
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