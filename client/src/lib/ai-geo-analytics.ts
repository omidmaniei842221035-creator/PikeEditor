import type { Customer, Branch, BankingUnit, PosMonthlyStats } from "@shared/schema";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface CustomerWithGeo extends Customer {
  latitude: string | null;
  longitude: string | null;
}

export interface ClusterResult {
  clusters: ClusterInfo[];
  customerAssignments: { customerId: string; clusterId: number }[];
  metrics: ClusterMetrics;
}

export interface ClusterInfo {
  id: number;
  centroid: GeoPoint;
  customerCount: number;
  totalRevenue: number;
  avgMonthlyProfit: number;
  dominantBusinessType: string;
  potentialLevel: 'high' | 'medium' | 'low';
  characteristics: string[];
}

export interface ClusterMetrics {
  totalClusters: number;
  silhouetteScore: number;
  inertia: number;
  highPotentialAreas: number;
  lowPotentialAreas: number;
}

export interface ForecastResult {
  areaForecasts: AreaForecast[];
  expansionSuggestions: ExpansionSuggestion[];
  overallGrowth: number;
  confidence: number;
}

export interface AreaForecast {
  areaId: string;
  areaName: string;
  currentSales: number;
  forecastedSales: number;
  growthRate: number;
  newCustomerPotential: number;
  trend: 'growing' | 'stable' | 'declining';
  monthlyPredictions: { month: string; value: number }[];
}

export interface ExpansionSuggestion {
  location: GeoPoint;
  areaName: string;
  potentialScore: number;
  estimatedRevenue: number;
  nearbyCustomers: number;
  reasoning: string[];
}

export interface RadiusAnalysisResult {
  servicePoints: ServicePointAnalysis[];
  uncoveredCustomers: UncoveredCustomer[];
  coverageStats: CoverageStats;
  suggestedLocations: SuggestedLocation[];
}

export interface ServicePointAnalysis {
  id: string;
  name: string;
  type: 'branch' | 'banking_unit';
  location: GeoPoint;
  coverageRadius: number;
  customersInRadius: number;
  totalRevenue: number;
  coverageEfficiency: number;
}

export interface UncoveredCustomer {
  customerId: string;
  shopName: string;
  location: GeoPoint;
  nearestServicePoint: {
    id: string;
    name: string;
    distance: number;
  };
  monthlyProfit: number;
}

export interface CoverageStats {
  totalCustomers: number;
  coveredCustomers: number;
  uncoveredCustomers: number;
  coveragePercentage: number;
  avgDistanceToService: number;
  maxDistanceToService: number;
}

export interface SuggestedLocation {
  location: GeoPoint;
  score: number;
  potentialCustomers: number;
  estimatedRevenue: number;
  reasoning: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeFeatures(data: number[][]): number[][] {
  if (data.length === 0) return [];
  
  const numFeatures = data[0].length;
  const mins: number[] = [];
  const maxs: number[] = [];
  
  for (let j = 0; j < numFeatures; j++) {
    const values = data.map(row => row[j]);
    mins.push(Math.min(...values));
    maxs.push(Math.max(...values));
  }
  
  return data.map(row => 
    row.map((val, j) => {
      const range = maxs[j] - mins[j];
      return range === 0 ? 0 : (val - mins[j]) / range;
    })
  );
}

function kMeansPlusPlus(data: number[][], k: number, maxIterations: number = 100): { assignments: number[]; centroids: number[][] } {
  const n = data.length;
  if (n === 0 || k <= 0) return { assignments: [], centroids: [] };
  
  const normalizedData = normalizeFeatures(data);
  const dim = normalizedData[0].length;
  
  const centroids: number[][] = [];
  centroids.push([...normalizedData[Math.floor(n / 2)]]);
  
  while (centroids.length < k) {
    const distances = normalizedData.map(point => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = Math.sqrt(point.reduce((sum, val, i) => sum + Math.pow(val - centroid[i], 2), 0));
        minDist = Math.min(minDist, dist);
      }
      return minDist * minDist;
    });
    
    const totalDist = distances.reduce((a, b) => a + b, 0);
    const cumulative = distances.map((_, i) => 
      distances.slice(0, i + 1).reduce((a, b) => a + b, 0) / totalDist
    );
    
    const r = (centroids.length * 0.3) % 1;
    const idx = cumulative.findIndex(c => c >= r);
    centroids.push([...normalizedData[idx >= 0 ? idx : n - 1]]);
  }
  
  let assignments = new Array(n).fill(0);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = normalizedData.map(point => {
      let minDist = Infinity;
      let nearest = 0;
      
      for (let c = 0; c < k; c++) {
        const dist = Math.sqrt(point.reduce((sum, val, i) => sum + Math.pow(val - centroids[c][i], 2), 0));
        if (dist < minDist) {
          minDist = dist;
          nearest = c;
        }
      }
      return nearest;
    });
    
    for (let c = 0; c < k; c++) {
      const clusterPoints = normalizedData.filter((_, i) => newAssignments[i] === c);
      if (clusterPoints.length > 0) {
        for (let j = 0; j < dim; j++) {
          centroids[c][j] = clusterPoints.reduce((sum, p) => sum + p[j], 0) / clusterPoints.length;
        }
      }
    }
    
    if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) break;
    assignments = newAssignments;
  }
  
  return { assignments, centroids };
}

function calculateSilhouetteScore(data: number[][], assignments: number[], k: number): number {
  if (data.length < 2 || k < 2) return 0;
  
  const normalizedData = normalizeFeatures(data);
  let totalScore = 0;
  
  for (let i = 0; i < normalizedData.length; i++) {
    const cluster = assignments[i];
    const sameCluster = normalizedData.filter((_, j) => assignments[j] === cluster && j !== i);
    const a = sameCluster.length > 0 
      ? sameCluster.reduce((sum, p) => sum + Math.sqrt(normalizedData[i].reduce((s, v, k) => s + Math.pow(v - p[k], 2), 0)), 0) / sameCluster.length
      : 0;
    
    let minB = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === cluster) continue;
      const otherCluster = normalizedData.filter((_, j) => assignments[j] === c);
      if (otherCluster.length > 0) {
        const b = otherCluster.reduce((sum, p) => sum + Math.sqrt(normalizedData[i].reduce((s, v, k) => s + Math.pow(v - p[k], 2), 0)), 0) / otherCluster.length;
        minB = Math.min(minB, b);
      }
    }
    
    if (minB === Infinity) minB = 0;
    const s = Math.max(a, minB) === 0 ? 0 : (minB - a) / Math.max(a, minB);
    totalScore += s;
  }
  
  return totalScore / normalizedData.length;
}

export function performCustomerClustering(
  customers: CustomerWithGeo[],
  monthlyStats: PosMonthlyStats[],
  k: number = 5
): ClusterResult {
  const validCustomers = customers.filter(c => c.latitude && c.longitude);
  
  if (validCustomers.length < k) {
    return {
      clusters: [],
      customerAssignments: [],
      metrics: {
        totalClusters: 0,
        silhouetteScore: 0,
        inertia: 0,
        highPotentialAreas: 0,
        lowPotentialAreas: 0
      }
    };
  }
  
  const customerStats = new Map<string, { totalAmount: number; transactionCount: number }>();
  monthlyStats.forEach(stat => {
    if (!stat.customerId) return;
    const existing = customerStats.get(stat.customerId) || { totalAmount: 0, transactionCount: 0 };
    customerStats.set(stat.customerId, {
      totalAmount: existing.totalAmount + (stat.totalAmount || 0),
      transactionCount: existing.transactionCount + (stat.totalTransactions || 0)
    });
  });
  
  const businessTypeToNum: Record<string, number> = {};
  let typeCounter = 0;
  validCustomers.forEach(c => {
    if (!(c.businessType in businessTypeToNum)) {
      businessTypeToNum[c.businessType] = typeCounter++;
    }
  });
  
  const statusScores: Record<string, number> = {
    'active': 4,
    'normal': 3,
    'marketing': 2,
    'collected': 1,
    'loss': 0
  };
  
  const featureData = validCustomers.map(c => {
    const lat = parseFloat(c.latitude!);
    const lng = parseFloat(c.longitude!);
    const stats = customerStats.get(c.id) || { totalAmount: 0, transactionCount: 0 };
    
    return [
      lat,
      lng,
      c.monthlyProfit || 0,
      stats.totalAmount,
      stats.transactionCount,
      businessTypeToNum[c.businessType] || 0,
      statusScores[c.status] || 2
    ];
  });
  
  const { assignments, centroids } = kMeansPlusPlus(featureData, k);
  const silhouetteScore = calculateSilhouetteScore(featureData, assignments, k);
  
  const clusters: ClusterInfo[] = [];
  
  for (let i = 0; i < k; i++) {
    const clusterCustomers = validCustomers.filter((_, idx) => assignments[idx] === i);
    if (clusterCustomers.length === 0) continue;
    
    const avgLat = clusterCustomers.reduce((sum, c) => sum + parseFloat(c.latitude!), 0) / clusterCustomers.length;
    const avgLng = clusterCustomers.reduce((sum, c) => sum + parseFloat(c.longitude!), 0) / clusterCustomers.length;
    
    const totalRevenue = clusterCustomers.reduce((sum, c) => {
      const stats = customerStats.get(c.id);
      return sum + (stats?.totalAmount || 0);
    }, 0);
    
    const avgProfit = clusterCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0) / clusterCustomers.length;
    
    const businessTypeCounts: Record<string, number> = {};
    clusterCustomers.forEach(c => {
      businessTypeCounts[c.businessType] = (businessTypeCounts[c.businessType] || 0) + 1;
    });
    const dominantType = Object.entries(businessTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'نامشخص';
    
    const activeRatio = clusterCustomers.filter(c => c.status === 'active').length / clusterCustomers.length;
    let potentialLevel: 'high' | 'medium' | 'low' = 'medium';
    
    if (avgProfit > 5000000 && activeRatio > 0.7) potentialLevel = 'high';
    else if (avgProfit < 1000000 || activeRatio < 0.3) potentialLevel = 'low';
    
    const characteristics: string[] = [];
    if (activeRatio > 0.8) characteristics.push('فعالیت بالا');
    if (avgProfit > 5000000) characteristics.push('درآمد بالا');
    if (clusterCustomers.length > 5) characteristics.push('تراکم بالا');
    if (dominantType) characteristics.push(`غالباً ${dominantType}`);
    
    clusters.push({
      id: i,
      centroid: { lat: avgLat, lng: avgLng },
      customerCount: clusterCustomers.length,
      totalRevenue,
      avgMonthlyProfit: Math.round(avgProfit),
      dominantBusinessType: dominantType,
      potentialLevel,
      characteristics
    });
  }
  
  const inertia = featureData.reduce((sum, point, idx) => {
    const clusterId = assignments[idx];
    if (!centroids[clusterId]) return sum;
    return sum + point.reduce((s, v, j) => s + Math.pow(v - centroids[clusterId][j], 2), 0);
  }, 0);
  
  return {
    clusters,
    customerAssignments: validCustomers.map((c, idx) => ({
      customerId: c.id,
      clusterId: assignments[idx]
    })),
    metrics: {
      totalClusters: clusters.length,
      silhouetteScore: Math.max(0, silhouetteScore),
      inertia,
      highPotentialAreas: clusters.filter(c => c.potentialLevel === 'high').length,
      lowPotentialAreas: clusters.filter(c => c.potentialLevel === 'low').length
    }
  };
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0, r2: 0 };
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  
  return { slope, intercept, r2: Math.max(0, r2) };
}

export function performSalesForecasting(
  customers: CustomerWithGeo[],
  branches: Branch[],
  bankingUnits: BankingUnit[],
  monthlyStats: PosMonthlyStats[],
  horizonMonths: number = 3
): ForecastResult {
  const branchStats = new Map<string, Map<string, number>>();
  
  monthlyStats.forEach(stat => {
    if (!stat.branchId) return;
    const key = `${stat.year}-${String(stat.month).padStart(2, '0')}`;
    
    if (!branchStats.has(stat.branchId)) {
      branchStats.set(stat.branchId, new Map());
    }
    const existing = branchStats.get(stat.branchId)!.get(key) || 0;
    branchStats.get(stat.branchId)!.set(key, existing + (stat.totalAmount || 0));
  });
  
  const areaForecasts: AreaForecast[] = [];
  
  branches.forEach(branch => {
    const stats = branchStats.get(branch.id);
    if (!stats || stats.size < 2) return;
    
    const sortedMonths = Array.from(stats.keys()).sort();
    const amounts = sortedMonths.map(m => stats.get(m)!);
    const indices = sortedMonths.map((_, i) => i);
    
    const { slope, intercept, r2 } = linearRegression(indices, amounts);
    
    const currentSales = amounts[amounts.length - 1] || 0;
    const monthlyPredictions: { month: string; value: number }[] = [];
    
    for (let i = 1; i <= horizonMonths; i++) {
      const predicted = Math.max(0, slope * (indices.length + i - 1) + intercept);
      monthlyPredictions.push({
        month: `ماه ${i}`,
        value: Math.round(predicted)
      });
    }
    
    const forecastedSales = monthlyPredictions[horizonMonths - 1]?.value || currentSales;
    const growthRate = currentSales > 0 ? ((forecastedSales - currentSales) / currentSales) * 100 : 0;
    
    const branchCustomers = customers.filter(c => c.branchId === branch.id);
    const activeCustomers = branchCustomers.filter(c => c.status === 'active').length;
    const newCustomerPotential = Math.round(activeCustomers * (growthRate > 0 ? 0.1 : 0.05) * (1 + r2));
    
    let trend: 'growing' | 'stable' | 'declining' = 'stable';
    if (growthRate > 5) trend = 'growing';
    else if (growthRate < -5) trend = 'declining';
    
    areaForecasts.push({
      areaId: branch.id,
      areaName: branch.name,
      currentSales,
      forecastedSales,
      growthRate: Math.round(growthRate * 10) / 10,
      newCustomerPotential,
      trend,
      monthlyPredictions
    });
  });
  
  const expansionSuggestions: ExpansionSuggestion[] = [];
  
  const validCustomers = customers.filter(c => c.latitude && c.longitude);
  if (validCustomers.length > 10) {
    const gridSize = 0.05;
    const grid = new Map<string, CustomerWithGeo[]>();
    
    validCustomers.forEach(c => {
      const lat = Math.floor(parseFloat(c.latitude!) / gridSize) * gridSize;
      const lng = Math.floor(parseFloat(c.longitude!) / gridSize) * gridSize;
      const key = `${lat},${lng}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(c);
    });
    
    const allServicePoints = [
      ...branches.filter(b => b.latitude && b.longitude).map(b => ({
        lat: parseFloat(b.latitude!.toString()),
        lng: parseFloat(b.longitude!.toString())
      })),
      ...bankingUnits.filter(u => u.latitude && u.longitude).map(u => ({
        lat: parseFloat(u.latitude!.toString()),
        lng: parseFloat(u.longitude!.toString())
      }))
    ];
    
    Array.from(grid.entries())
      .filter(([_, customers]) => customers.length >= 3)
      .forEach(([key, gridCustomers]) => {
        const [lat, lng] = key.split(',').map(Number);
        const centerLat = lat + gridSize / 2;
        const centerLng = lng + gridSize / 2;
        
        const minDistToService = allServicePoints.length > 0
          ? Math.min(...allServicePoints.map(sp => haversineDistance(centerLat, centerLng, sp.lat, sp.lng)))
          : Infinity;
        
        if (minDistToService > 3) {
          const totalRevenue = gridCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
          const activeRatio = gridCustomers.filter(c => c.status === 'active').length / gridCustomers.length;
          const potentialScore = (gridCustomers.length * 10 + totalRevenue / 100000 + activeRatio * 50) * (minDistToService / 5);
          
          const reasoning: string[] = [];
          reasoning.push(`${gridCustomers.length} مشتری در این ناحیه`);
          reasoning.push(`فاصله ${Math.round(minDistToService)} کیلومتر از نزدیک‌ترین نقطه خدمات`);
          if (activeRatio > 0.7) reasoning.push('نرخ فعالیت بالا');
          
          expansionSuggestions.push({
            location: { lat: centerLat, lng: centerLng },
            areaName: `ناحیه (${centerLat.toFixed(2)}, ${centerLng.toFixed(2)})`,
            potentialScore: Math.round(potentialScore),
            estimatedRevenue: totalRevenue * 12,
            nearbyCustomers: gridCustomers.length,
            reasoning
          });
        }
      });
    
    expansionSuggestions.sort((a, b) => b.potentialScore - a.potentialScore);
  }
  
  const overallGrowth = areaForecasts.length > 0
    ? areaForecasts.reduce((sum, a) => sum + a.growthRate, 0) / areaForecasts.length
    : 0;
  
  const confidence = areaForecasts.length > 0 ? Math.min(0.95, 0.7 + (areaForecasts.length / 20) * 0.25) : 0.5;
  
  return {
    areaForecasts,
    expansionSuggestions: expansionSuggestions.slice(0, 5),
    overallGrowth: Math.round(overallGrowth * 10) / 10,
    confidence
  };
}

export function performRadiusAnalysis(
  customers: CustomerWithGeo[],
  branches: Branch[],
  bankingUnits: BankingUnit[],
  defaultRadius: number = 5
): RadiusAnalysisResult {
  const servicePoints: ServicePointAnalysis[] = [];
  const validCustomers = customers.filter(c => c.latitude && c.longitude);
  
  const allServicePointsRaw = [
    ...branches.filter(b => b.latitude && b.longitude).map(b => ({
      id: b.id,
      name: b.name,
      type: 'branch' as const,
      lat: parseFloat(b.latitude!.toString()),
      lng: parseFloat(b.longitude!.toString()),
      coverageRadius: b.coverageRadius || defaultRadius
    })),
    ...bankingUnits.filter(u => u.latitude && u.longitude).map(u => ({
      id: u.id,
      name: u.name,
      type: 'banking_unit' as const,
      lat: parseFloat(u.latitude!.toString()),
      lng: parseFloat(u.longitude!.toString()),
      coverageRadius: defaultRadius
    }))
  ];
  
  allServicePointsRaw.forEach(sp => {
    const customersInRadius = validCustomers.filter(c => {
      const dist = haversineDistance(sp.lat, sp.lng, parseFloat(c.latitude!), parseFloat(c.longitude!));
      return dist <= sp.coverageRadius;
    });
    
    const totalRevenue = customersInRadius.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
    const maxPossibleCustomers = validCustomers.length;
    const coverageEfficiency = maxPossibleCustomers > 0 
      ? (customersInRadius.length / maxPossibleCustomers) * 100 
      : 0;
    
    servicePoints.push({
      id: sp.id,
      name: sp.name,
      type: sp.type,
      location: { lat: sp.lat, lng: sp.lng },
      coverageRadius: sp.coverageRadius,
      customersInRadius: customersInRadius.length,
      totalRevenue,
      coverageEfficiency: Math.round(coverageEfficiency * 10) / 10
    });
  });
  
  const uncoveredCustomers: UncoveredCustomer[] = [];
  const customerDistances: number[] = [];
  
  validCustomers.forEach(c => {
    const customerLat = parseFloat(c.latitude!);
    const customerLng = parseFloat(c.longitude!);
    
    let nearestPointData: { id: string; name: string; distance: number } | null = null;
    
    for (const sp of allServicePointsRaw) {
      const dist = haversineDistance(customerLat, customerLng, sp.lat, sp.lng);
      if (!nearestPointData || dist < nearestPointData.distance) {
        nearestPointData = { id: sp.id, name: sp.name, distance: dist };
      }
    }
    
    if (nearestPointData !== null) {
      const foundPoint = nearestPointData;
      customerDistances.push(foundPoint.distance);
      
      const inAnyCoverage = allServicePointsRaw.some(sp => 
        haversineDistance(customerLat, customerLng, sp.lat, sp.lng) <= sp.coverageRadius
      );
      
      if (!inAnyCoverage) {
        uncoveredCustomers.push({
          customerId: c.id,
          shopName: c.shopName,
          location: { lat: customerLat, lng: customerLng },
          nearestServicePoint: foundPoint,
          monthlyProfit: c.monthlyProfit || 0
        });
      }
    }
  });
  
  uncoveredCustomers.sort((a, b) => b.monthlyProfit - a.monthlyProfit);
  
  const coverageStats: CoverageStats = {
    totalCustomers: validCustomers.length,
    coveredCustomers: validCustomers.length - uncoveredCustomers.length,
    uncoveredCustomers: uncoveredCustomers.length,
    coveragePercentage: validCustomers.length > 0 
      ? Math.round(((validCustomers.length - uncoveredCustomers.length) / validCustomers.length) * 100) 
      : 0,
    avgDistanceToService: customerDistances.length > 0 
      ? Math.round(customerDistances.reduce((a, b) => a + b, 0) / customerDistances.length * 10) / 10 
      : 0,
    maxDistanceToService: customerDistances.length > 0 
      ? Math.round(Math.max(...customerDistances) * 10) / 10 
      : 0
  };
  
  const suggestedLocations: SuggestedLocation[] = [];
  
  if (uncoveredCustomers.length >= 3) {
    const gridSize = 0.03;
    const grid = new Map<string, UncoveredCustomer[]>();
    
    uncoveredCustomers.forEach(c => {
      const lat = Math.floor(c.location.lat / gridSize) * gridSize;
      const lng = Math.floor(c.location.lng / gridSize) * gridSize;
      const key = `${lat},${lng}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(c);
    });
    
    Array.from(grid.entries())
      .filter(([_, customers]) => customers.length >= 2)
      .forEach(([key, gridCustomers]) => {
        const [lat, lng] = key.split(',').map(Number);
        const centerLat = lat + gridSize / 2;
        const centerLng = lng + gridSize / 2;
        
        const estimatedRevenue = gridCustomers.reduce((sum, c) => sum + c.monthlyProfit, 0) * 12;
        const score = gridCustomers.length * 100 + estimatedRevenue / 10000;
        
        suggestedLocations.push({
          location: { lat: centerLat, lng: centerLng },
          score: Math.round(score),
          potentialCustomers: gridCustomers.length,
          estimatedRevenue,
          reasoning: `پوشش ${gridCustomers.length} مشتری بدون دسترسی با درآمد سالانه ${(estimatedRevenue / 1000000).toFixed(1)} میلیون تومان`
        });
      });
    
    suggestedLocations.sort((a, b) => b.score - a.score);
  }
  
  return {
    servicePoints,
    uncoveredCustomers: uncoveredCustomers.slice(0, 20),
    coverageStats,
    suggestedLocations: suggestedLocations.slice(0, 5)
  };
}

export function getClusterColor(clusterId: number): string {
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#6366f1'
  ];
  return colors[clusterId % colors.length];
}

export function getPotentialColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'low': return '#ef4444';
  }
}
