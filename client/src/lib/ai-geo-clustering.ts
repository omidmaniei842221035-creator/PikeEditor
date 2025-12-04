// AI Geographic Clustering and Analysis Engine
// خوشه‌بندی هوشمند جغرافیایی با هوش مصنوعی

import { latLngToCell, cellToLatLng, gridDisk, cellToBoundary } from 'h3-js';

// Types
export interface CustomerLocation {
  id: string;
  shopName: string;
  latitude: number;
  longitude: number;
  monthlyProfit: number;
  businessType: string;
  status: string;
  createdAt?: string;
  bankingUnitId?: string;
}

export interface BranchLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'branch' | 'bankingUnit' | 'warehouse';
}

export interface GeoCluster {
  id: string;
  centroid: [number, number];
  customers: CustomerLocation[];
  totalRevenue: number;
  avgRevenue: number;
  customerCount: number;
  businessTypes: Record<string, number>;
  radius: number; // km
  density: number; // customers per sq km
  potential: 'high' | 'medium' | 'low';
  characteristics: string[];
  color: string;
  h3Cells: string[];
}

export interface RegionalForecast {
  regionId: string;
  regionName: string;
  center: [number, number];
  currentCustomers: number;
  predictedCustomers: number;
  growthRate: number;
  confidenceInterval: [number, number];
  trend: 'surge' | 'growing' | 'stable' | 'declining';
  bestMonthsForExpansion: string[];
  recommendedActions: string[];
  salesForecast: {
    currentMonthly: number;
    predictedMonthly: number;
    changePercent: number;
  };
  expansionScore: number; // 0-100
}

export interface RadiusAnalysis {
  servicePoint: BranchLocation;
  coverageRadius: number; // km
  customersInRadius: CustomerLocation[];
  totalCoveredRevenue: number;
  coveragePercentage: number;
  gaps: {
    direction: string;
    distance: number;
    potentialCustomers: number;
  }[];
  optimalNewLocation?: {
    latitude: number;
    longitude: number;
    reason: string;
    expectedCoverage: number;
  };
}

export interface ServiceCoverageResult {
  totalCustomers: number;
  coveredCustomers: number;
  uncoveredCustomers: CustomerLocation[];
  coveragePercentage: number;
  avgDistanceToService: number;
  maxDistanceToService: number;
  recommendations: string[];
  optimalLocations: {
    latitude: number;
    longitude: number;
    potentialCoverage: number;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }[];
}

// Haversine distance calculation
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate mean of array
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Standard deviation
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

// Linear regression for forecasting
function linearRegression(data: [number, number][]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.[1] || 0, r2: 0 };

  const sumX = data.reduce((s, d) => s + d[0], 0);
  const sumY = data.reduce((s, d) => s + d[1], 0);
  const sumXY = data.reduce((s, d) => s + d[0] * d[1], 0);
  const sumXX = data.reduce((s, d) => s + d[0] * d[0], 0);
  const sumYY = data.reduce((s, d) => s + d[1] * d[1], 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssRes = data.reduce((s, d) => s + Math.pow(d[1] - (slope * d[0] + intercept), 2), 0);
  const ssTot = data.reduce((s, d) => s + Math.pow(d[1] - yMean, 2), 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, intercept, r2 };
}

// Color palette for clusters
const CLUSTER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#84cc16'
];

// Persian month names
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * AI Geographic Clustering Engine
 * خوشه‌بندی هوشمند مشتریان بر اساس موقعیت، خرید و رفتار
 */
export class AIGeoClustering {
  private customers: CustomerLocation[] = [];
  private branches: BranchLocation[] = [];
  private h3Resolution: number = 8; // ~500m hexagons

  constructor(customers: CustomerLocation[], branches: BranchLocation[], resolution: number = 8) {
    this.customers = customers.filter(c => c.latitude && c.longitude);
    this.branches = branches;
    this.h3Resolution = resolution;
  }

  /**
   * Perform K-means clustering on customer locations with behavior features
   */
  performGeoClustering(k: number = 5): GeoCluster[] {
    if (this.customers.length < k) {
      k = Math.max(1, this.customers.length);
    }

    // Prepare feature vectors: [lat, lng, normalized_profit, distance_to_nearest_branch]
    const featureVectors = this.customers.map(customer => {
      const nearestBranchDist = this.findNearestBranchDistance(customer);
      const normalizedProfit = customer.monthlyProfit / 100000000; // Normalize to 0-1 range
      return [
        customer.latitude,
        customer.longitude,
        normalizedProfit,
        Math.min(nearestBranchDist / 10, 1) // Normalize distance (max 10km = 1)
      ];
    });

    // K-means clustering
    const assignments = this.kMeans(featureVectors, k);

    // Group customers by cluster
    const clusterGroups: Map<number, CustomerLocation[]> = new Map();
    assignments.forEach((clusterId, idx) => {
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, []);
      }
      clusterGroups.get(clusterId)!.push(this.customers[idx]);
    });

    // Build cluster objects
    const clusters: GeoCluster[] = [];
    clusterGroups.forEach((customers, clusterId) => {
      const cluster = this.buildCluster(clusterId, customers);
      clusters.push(cluster);
    });

    // Sort by revenue (highest first)
    clusters.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return clusters;
  }

  /**
   * K-means clustering algorithm
   */
  private kMeans(data: number[][], k: number, maxIterations: number = 100): number[] {
    const n = data.length;
    const dim = data[0].length;

    // Initialize centroids using k-means++ style (evenly spaced)
    const centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(i * (n - 1) / Math.max(1, k - 1));
      centroids.push([...data[idx]]);
    }

    let assignments = new Array(n).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      const newAssignments = new Array(n);

      // Assign points to nearest centroid
      for (let i = 0; i < n; i++) {
        let minDist = Infinity;
        let nearest = 0;

        for (let c = 0; c < k; c++) {
          let dist = 0;
          for (let d = 0; d < dim; d++) {
            // Weight geographic distance more heavily
            const weight = d < 2 ? 100 : 1; // lat/lng weighted 100x
            dist += weight * Math.pow(data[i][d] - centroids[c][d], 2);
          }
          if (dist < minDist) {
            minDist = dist;
            nearest = c;
          }
        }
        newAssignments[i] = nearest;
      }

      // Update centroids
      for (let c = 0; c < k; c++) {
        const clusterPoints = data.filter((_, i) => newAssignments[i] === c);
        if (clusterPoints.length > 0) {
          for (let d = 0; d < dim; d++) {
            centroids[c][d] = mean(clusterPoints.map(p => p[d]));
          }
        }
      }

      // Check convergence
      if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
        break;
      }
      assignments = newAssignments;
    }

    return assignments;
  }

  /**
   * Build a cluster object from grouped customers
   */
  private buildCluster(id: number, customers: CustomerLocation[]): GeoCluster {
    const lats = customers.map(c => c.latitude);
    const lngs = customers.map(c => c.longitude);
    const centroid: [number, number] = [mean(lats), mean(lngs)];

    // Calculate radius (max distance from centroid)
    const distances = customers.map(c => 
      haversineDistance(centroid[0], centroid[1], c.latitude, c.longitude)
    );
    const radius = Math.max(...distances, 0.5); // minimum 500m

    // Calculate density
    const area = Math.PI * radius * radius; // sq km
    const density = customers.length / Math.max(area, 0.1);

    // Business type distribution
    const businessTypes: Record<string, number> = {};
    customers.forEach(c => {
      businessTypes[c.businessType] = (businessTypes[c.businessType] || 0) + 1;
    });

    // Calculate revenues
    const totalRevenue = customers.reduce((s, c) => s + (c.monthlyProfit || 0), 0);
    const avgRevenue = customers.length > 0 ? totalRevenue / customers.length : 0;

    // Determine potential
    let potential: 'high' | 'medium' | 'low' = 'medium';
    const activeRatio = customers.filter(c => c.status === 'active').length / customers.length;
    if (avgRevenue > 50000000 && activeRatio > 0.7) {
      potential = 'high';
    } else if (avgRevenue < 20000000 || activeRatio < 0.3) {
      potential = 'low';
    }

    // Generate characteristics
    const characteristics: string[] = [];
    const topBusinessType = Object.entries(businessTypes).sort((a, b) => b[1] - a[1])[0];
    if (topBusinessType) {
      characteristics.push(`عمده فعالیت: ${topBusinessType[0]}`);
    }
    if (density > 10) {
      characteristics.push('تراکم بالای مشتری');
    } else if (density < 2) {
      characteristics.push('پراکندگی جغرافیایی');
    }
    if (activeRatio > 0.8) {
      characteristics.push('فعالیت بالا');
    } else if (activeRatio < 0.4) {
      characteristics.push('نیاز به فعال‌سازی');
    }

    // Get H3 cells for this cluster
    const h3Cells = customers.map(c => 
      latLngToCell(c.latitude, c.longitude, this.h3Resolution)
    );

    return {
      id: `cluster-${id}`,
      centroid,
      customers,
      totalRevenue,
      avgRevenue,
      customerCount: customers.length,
      businessTypes,
      radius,
      density,
      potential,
      characteristics,
      color: CLUSTER_COLORS[id % CLUSTER_COLORS.length],
      h3Cells: [...new Set(h3Cells)]
    };
  }

  /**
   * Find distance to nearest branch/service point
   */
  private findNearestBranchDistance(customer: CustomerLocation): number {
    if (this.branches.length === 0) return 10; // Default 10km if no branches

    let minDist = Infinity;
    this.branches.forEach(branch => {
      const dist = haversineDistance(
        customer.latitude, customer.longitude,
        branch.latitude, branch.longitude
      );
      if (dist < minDist) minDist = dist;
    });
    return minDist;
  }
}

/**
 * AI Regional Forecasting Engine
 * پیش‌بینی رشد و جذب مشتری در مناطق مختلف
 */
export class AIRegionalForecasting {
  private customers: CustomerLocation[] = [];
  private regions: Map<string, CustomerLocation[]> = new Map();

  constructor(customers: CustomerLocation[]) {
    this.customers = customers.filter(c => c.latitude && c.longitude);
    this.groupByRegion();
  }

  /**
   * Group customers into H3 regions
   */
  private groupByRegion(): void {
    this.regions.clear();
    const resolution = 7; // ~1.5km hexagons for regional analysis

    this.customers.forEach(customer => {
      const h3Index = latLngToCell(customer.latitude, customer.longitude, resolution);
      if (!this.regions.has(h3Index)) {
        this.regions.set(h3Index, []);
      }
      this.regions.get(h3Index)!.push(customer);
    });
  }

  /**
   * Generate forecasts for all regions
   */
  generateRegionalForecasts(): RegionalForecast[] {
    const forecasts: RegionalForecast[] = [];

    this.regions.forEach((customers, regionId) => {
      const forecast = this.forecastRegion(regionId, customers);
      forecasts.push(forecast);
    });

    // Sort by expansion score (highest first)
    forecasts.sort((a, b) => b.expansionScore - a.expansionScore);

    return forecasts;
  }

  /**
   * Forecast for a specific region
   */
  private forecastRegion(regionId: string, customers: CustomerLocation[]): RegionalForecast {
    const [lat, lng] = cellToLatLng(regionId);

    // Analyze customer acquisition over time
    const customersByMonth = this.groupCustomersByMonth(customers);
    const monthlyData = Array.from(customersByMonth.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry, idx) => [idx, entry[1].length] as [number, number]);

    // Linear regression for customer growth
    const { slope, intercept, r2 } = linearRegression(monthlyData);
    const currentCustomers = customers.length;
    const predictedCustomers = Math.max(0, Math.round(
      intercept + slope * (monthlyData.length + 3) // 3 months ahead
    ));

    // Calculate growth rate
    const growthRate = currentCustomers > 0 
      ? ((predictedCustomers - currentCustomers) / currentCustomers) * 100 
      : 0;

    // Determine trend
    let trend: 'surge' | 'growing' | 'stable' | 'declining' = 'stable';
    if (growthRate > 20) trend = 'surge';
    else if (growthRate > 5) trend = 'growing';
    else if (growthRate < -10) trend = 'declining';

    // Sales forecast
    const currentRevenue = customers.reduce((s, c) => s + (c.monthlyProfit || 0), 0);
    const revenuePerCustomer = currentCustomers > 0 ? currentRevenue / currentCustomers : 0;
    const predictedRevenue = predictedCustomers * revenuePerCustomer;

    // Confidence interval
    const stdError = stdDev(monthlyData.map(d => d[1])) / Math.sqrt(monthlyData.length || 1);
    const confidenceInterval: [number, number] = [
      Math.max(0, predictedCustomers - 1.96 * stdError),
      predictedCustomers + 1.96 * stdError
    ];

    // Best months for expansion (based on historical patterns)
    const bestMonths = this.findBestExpansionMonths(customersByMonth);

    // Expansion score (0-100)
    const activeRatio = customers.filter(c => c.status === 'active').length / customers.length;
    const revenueScore = Math.min(currentRevenue / 100000000, 1) * 40;
    const growthScore = Math.min(Math.max(growthRate, 0), 50) * 0.8;
    const activityScore = activeRatio * 20;
    const expansionScore = Math.round(revenueScore + growthScore + activityScore);

    // Recommended actions
    const recommendedActions: string[] = [];
    if (trend === 'surge') {
      recommendedActions.push('افزایش ظرفیت خدمات در این منطقه');
      recommendedActions.push('استخدام نیروی جدید برای پوشش منطقه');
    } else if (trend === 'growing') {
      recommendedActions.push('تمرکز بازاریابی بر این منطقه');
      recommendedActions.push('بررسی نیاز به شعبه جدید');
    } else if (trend === 'declining') {
      recommendedActions.push('بررسی علل کاهش مشتری');
      recommendedActions.push('برنامه ویژه نگهداشت مشتری');
    }

    // Generate region name
    const topBusinessType = this.getTopBusinessType(customers);
    const regionName = `منطقه ${topBusinessType || 'عمومی'}`;

    return {
      regionId,
      regionName,
      center: [lat, lng],
      currentCustomers,
      predictedCustomers,
      growthRate: Math.round(growthRate * 10) / 10,
      confidenceInterval,
      trend,
      bestMonthsForExpansion: bestMonths,
      recommendedActions,
      salesForecast: {
        currentMonthly: currentRevenue,
        predictedMonthly: predictedRevenue,
        changePercent: Math.round(((predictedRevenue - currentRevenue) / Math.max(currentRevenue, 1)) * 100)
      },
      expansionScore
    };
  }

  /**
   * Group customers by their creation month
   */
  private groupCustomersByMonth(customers: CustomerLocation[]): Map<number, CustomerLocation[]> {
    const grouped = new Map<number, CustomerLocation[]>();
    
    customers.forEach(customer => {
      if (!customer.createdAt) return;
      const date = new Date(customer.createdAt);
      const monthKey = date.getFullYear() * 12 + date.getMonth();
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(customer);
    });

    return grouped;
  }

  /**
   * Find best months for expansion based on historical acquisition
   */
  private findBestExpansionMonths(monthlyData: Map<number, CustomerLocation[]>): string[] {
    const monthlyAcquisition = new Array(12).fill(0);
    
    monthlyData.forEach((customers, monthKey) => {
      const monthOfYear = monthKey % 12;
      monthlyAcquisition[monthOfYear] += customers.length;
    });

    // Find top 3 months
    const indexed = monthlyAcquisition.map((count, idx) => ({ count, idx }));
    indexed.sort((a, b) => b.count - a.count);
    
    return indexed.slice(0, 3).map(m => PERSIAN_MONTHS[m.idx]);
  }

  /**
   * Get most common business type
   */
  private getTopBusinessType(customers: CustomerLocation[]): string | null {
    const typeCounts: Record<string, number> = {};
    customers.forEach(c => {
      typeCounts[c.businessType] = (typeCounts[c.businessType] || 0) + 1;
    });
    
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  }

  /**
   * Suggest cities/areas for business expansion
   */
  suggestExpansionAreas(): {
    area: string;
    coordinates: [number, number];
    score: number;
    reasons: string[];
  }[] {
    const forecasts = this.generateRegionalForecasts();
    
    return forecasts
      .filter(f => f.trend === 'surge' || f.trend === 'growing')
      .slice(0, 5)
      .map(f => ({
        area: f.regionName,
        coordinates: f.center,
        score: f.expansionScore,
        reasons: f.recommendedActions
      }));
  }
}

/**
 * Radius and Service Coverage Analysis
 * تحلیل شعاع دسترسی و پوشش خدمات
 */
export class RadiusCoverageAnalysis {
  private customers: CustomerLocation[] = [];
  private servicePoints: BranchLocation[] = [];
  private defaultRadius: number = 5; // km

  constructor(
    customers: CustomerLocation[],
    servicePoints: BranchLocation[],
    defaultRadius: number = 5
  ) {
    this.customers = customers.filter(c => c.latitude && c.longitude);
    this.servicePoints = servicePoints.filter(s => s.latitude && s.longitude);
    this.defaultRadius = defaultRadius;
  }

  /**
   * Analyze coverage for a specific service point
   */
  analyzeServicePointCoverage(servicePoint: BranchLocation, radius: number = this.defaultRadius): RadiusAnalysis {
    const customersInRadius: CustomerLocation[] = [];
    const customersOutside: CustomerLocation[] = [];

    this.customers.forEach(customer => {
      const distance = haversineDistance(
        servicePoint.latitude, servicePoint.longitude,
        customer.latitude, customer.longitude
      );
      if (distance <= radius) {
        customersInRadius.push(customer);
      } else {
        customersOutside.push(customer);
      }
    });

    const totalCoveredRevenue = customersInRadius.reduce((s, c) => s + (c.monthlyProfit || 0), 0);
    const coveragePercentage = this.customers.length > 0
      ? (customersInRadius.length / this.customers.length) * 100
      : 0;

    // Analyze gaps in coverage (directions where customers are not covered)
    const gaps = this.analyzeGaps(servicePoint, customersOutside);

    // Find optimal location for new service point
    const optimalNewLocation = this.findOptimalNewLocation(customersOutside);

    return {
      servicePoint,
      coverageRadius: radius,
      customersInRadius,
      totalCoveredRevenue,
      coveragePercentage,
      gaps,
      optimalNewLocation
    };
  }

  /**
   * Analyze all service points coverage
   */
  analyzeAllServiceCoverage(radius: number = this.defaultRadius): ServiceCoverageResult {
    const coveredCustomerIds = new Set<string>();
    const uncoveredCustomers: CustomerLocation[] = [];
    const distances: number[] = [];

    this.customers.forEach(customer => {
      let minDistance = Infinity;
      let isCovered = false;

      this.servicePoints.forEach(sp => {
        const dist = haversineDistance(
          sp.latitude, sp.longitude,
          customer.latitude, customer.longitude
        );
        if (dist < minDistance) minDistance = dist;
        if (dist <= radius) isCovered = true;
      });

      distances.push(minDistance);
      if (isCovered) {
        coveredCustomerIds.add(customer.id);
      } else {
        uncoveredCustomers.push(customer);
      }
    });

    const avgDistance = mean(distances);
    const maxDistance = Math.max(...distances);

    // Find optimal locations for new service points
    const optimalLocations = this.findMultipleOptimalLocations(uncoveredCustomers, 3);

    // Generate recommendations
    const recommendations: string[] = [];
    const coveragePercent = (coveredCustomerIds.size / this.customers.length) * 100;
    
    if (coveragePercent < 50) {
      recommendations.push('پوشش خدمات کمتر از ۵۰٪ است - نیاز فوری به شعب جدید');
    } else if (coveragePercent < 70) {
      recommendations.push('پوشش خدمات متوسط است - بررسی افتتاح شعبه در مناطق کم‌پوشش');
    } else if (coveragePercent < 90) {
      recommendations.push('پوشش خوب - بهینه‌سازی شعب موجود');
    } else {
      recommendations.push('پوشش عالی - تمرکز بر کیفیت خدمات');
    }

    if (avgDistance > 3) {
      recommendations.push('میانگین فاصله مشتریان بالاست - بررسی توزیع جغرافیایی شعب');
    }

    if (uncoveredCustomers.length > 5) {
      recommendations.push(`${uncoveredCustomers.length} مشتری خارج از شعاع خدمات هستند`);
    }

    return {
      totalCustomers: this.customers.length,
      coveredCustomers: coveredCustomerIds.size,
      uncoveredCustomers,
      coveragePercentage: Math.round(coveragePercent * 10) / 10,
      avgDistanceToService: Math.round(avgDistance * 100) / 100,
      maxDistanceToService: Math.round(maxDistance * 100) / 100,
      recommendations,
      optimalLocations
    };
  }

  /**
   * Analyze gaps in coverage from a service point
   */
  private analyzeGaps(
    servicePoint: BranchLocation,
    uncoveredCustomers: CustomerLocation[]
  ): RadiusAnalysis['gaps'] {
    const directions = ['شمال', 'شمال‌شرقی', 'شرق', 'جنوب‌شرقی', 'جنوب', 'جنوب‌غربی', 'غرب', 'شمال‌غربی'];
    const directionGaps: { direction: string; customers: CustomerLocation[]; avgDistance: number }[] = 
      directions.map(d => ({ direction: d, customers: [], avgDistance: 0 }));

    uncoveredCustomers.forEach(customer => {
      const bearing = this.calculateBearing(
        servicePoint.latitude, servicePoint.longitude,
        customer.latitude, customer.longitude
      );
      const distance = haversineDistance(
        servicePoint.latitude, servicePoint.longitude,
        customer.latitude, customer.longitude
      );

      // Map bearing to direction index (0-7)
      const dirIdx = Math.round(((bearing + 360) % 360) / 45) % 8;
      directionGaps[dirIdx].customers.push(customer);
    });

    // Calculate average distance for each direction
    directionGaps.forEach(gap => {
      if (gap.customers.length > 0) {
        gap.avgDistance = mean(gap.customers.map(c =>
          haversineDistance(servicePoint.latitude, servicePoint.longitude, c.latitude, c.longitude)
        ));
      }
    });

    return directionGaps
      .filter(g => g.customers.length > 0)
      .sort((a, b) => b.customers.length - a.customers.length)
      .slice(0, 4)
      .map(g => ({
        direction: g.direction,
        distance: Math.round(g.avgDistance * 100) / 100,
        potentialCustomers: g.customers.length
      }));
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  /**
   * Find optimal location for a new service point
   */
  private findOptimalNewLocation(uncoveredCustomers: CustomerLocation[]): RadiusAnalysis['optimalNewLocation'] {
    if (uncoveredCustomers.length === 0) return undefined;

    // Calculate centroid of uncovered customers
    const avgLat = mean(uncoveredCustomers.map(c => c.latitude));
    const avgLng = mean(uncoveredCustomers.map(c => c.longitude));

    // Calculate expected coverage
    const expectedCoverage = uncoveredCustomers.filter(c =>
      haversineDistance(avgLat, avgLng, c.latitude, c.longitude) <= this.defaultRadius
    ).length;

    return {
      latitude: avgLat,
      longitude: avgLng,
      reason: `پوشش ${expectedCoverage} مشتری بدون سرویس`,
      expectedCoverage
    };
  }

  /**
   * Find multiple optimal locations for new service points
   */
  private findMultipleOptimalLocations(
    uncoveredCustomers: CustomerLocation[],
    count: number
  ): ServiceCoverageResult['optimalLocations'] {
    if (uncoveredCustomers.length === 0) return [];

    const locations: ServiceCoverageResult['optimalLocations'] = [];
    let remaining = [...uncoveredCustomers];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      const avgLat = mean(remaining.map(c => c.latitude));
      const avgLng = mean(remaining.map(c => c.longitude));

      const coveredByNew = remaining.filter(c =>
        haversineDistance(avgLat, avgLng, c.latitude, c.longitude) <= this.defaultRadius
      );

      if (coveredByNew.length === 0) break;

      const totalRevenue = coveredByNew.reduce((s, c) => s + (c.monthlyProfit || 0), 0);
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (coveredByNew.length > 5 || totalRevenue > 100000000) priority = 'high';
      else if (coveredByNew.length < 2) priority = 'low';

      locations.push({
        latitude: avgLat,
        longitude: avgLng,
        potentialCoverage: coveredByNew.length,
        priority,
        reason: `پوشش ${coveredByNew.length} مشتری با درآمد ${Math.round(totalRevenue / 1000000)} میلیون`
      });

      // Remove covered customers for next iteration
      const coveredIds = new Set(coveredByNew.map(c => c.id));
      remaining = remaining.filter(c => !coveredIds.has(c.id));
    }

    return locations;
  }

  /**
   * Generate coverage circles for visualization
   */
  generateCoverageCircles(radius: number = this.defaultRadius): {
    center: [number, number];
    radius: number;
    name: string;
    customersCount: number;
    type: 'branch' | 'bankingUnit' | 'warehouse';
  }[] {
    return this.servicePoints.map(sp => {
      const customersCount = this.customers.filter(c =>
        haversineDistance(sp.latitude, sp.longitude, c.latitude, c.longitude) <= radius
      ).length;

      return {
        center: [sp.latitude, sp.longitude] as [number, number],
        radius,
        name: sp.name,
        customersCount,
        type: sp.type
      };
    });
  }
}

/**
 * Main AI Geographic Analysis Engine
 * موتور اصلی تحلیل جغرافیایی هوشمند
 */
export function performFullGeoAnalysis(
  customers: CustomerLocation[],
  branches: BranchLocation[],
  options: {
    clusterCount?: number;
    coverageRadius?: number;
    h3Resolution?: number;
  } = {}
): {
  clusters: GeoCluster[];
  forecasts: RegionalForecast[];
  coverage: ServiceCoverageResult;
  expansionSuggestions: ReturnType<AIRegionalForecasting['suggestExpansionAreas']>;
} {
  const { clusterCount = 5, coverageRadius = 5, h3Resolution = 8 } = options;

  // Perform clustering
  const clusteringEngine = new AIGeoClustering(customers, branches, h3Resolution);
  const clusters = clusteringEngine.performGeoClustering(clusterCount);

  // Generate forecasts
  const forecastingEngine = new AIRegionalForecasting(customers);
  const forecasts = forecastingEngine.generateRegionalForecasts();
  const expansionSuggestions = forecastingEngine.suggestExpansionAreas();

  // Analyze coverage
  const coverageEngine = new RadiusCoverageAnalysis(customers, branches, coverageRadius);
  const coverage = coverageEngine.analyzeAllServiceCoverage(coverageRadius);

  return {
    clusters,
    forecasts,
    coverage,
    expansionSuggestions
  };
}
