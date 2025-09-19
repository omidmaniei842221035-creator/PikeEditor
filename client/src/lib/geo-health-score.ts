// Geo Health Score Calculation System
// Advanced location health assessment for POS management

export interface LocationHealthMetrics {
  // Transaction metrics
  transactionGrowthRate: number; // Monthly growth rate (-1 to 1)
  transactionStability: number; // Coefficient of variation (lower = more stable)
  averageTransactionValue: number; // Average transaction amount
  
  // Business diversity
  businessTypeCount: number; // Number of different business types
  businessDensity: number; // Businesses per square kilometer
  
  // Infrastructure & reliability
  uptimePercentage: number; // POS device uptime (0-1)
  networkQuality: number; // Internet connection quality (0-10)
  powerReliability: number; // Power infrastructure score (0-10)
  
  // Risk factors
  anomalyRiskScore: number; // Fraud/anomaly detection score (0-1, lower = better)
  competitionLevel: number; // Market saturation (0-10, balanced is good)
  
  // Demographic factors
  populationDensity: number; // People per square kilometer
  averageIncome: number; // Average household income
  footTraffic: number; // Estimated daily foot traffic
}

export interface GeoHealthScore {
  overallScore: number; // 0-1 composite health score
  categoryScores: {
    transactionHealth: number; // 0-1
    businessDiversity: number; // 0-1  
    infrastructure: number; // 0-1
    riskProfile: number; // 0-1 (higher = lower risk)
    marketPotential: number; // 0-1
  };
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  trends: {
    shortTerm: 'improving' | 'stable' | 'declining';
    longTerm: 'growth' | 'stagnation' | 'decline';
  };
}

export interface LocationHealthData {
  locationId: string;
  name: string;
  coordinates: [number, number];
  metrics: LocationHealthMetrics;
  score: GeoHealthScore;
  lastUpdated: Date;
}

export class GeoHealthScoreEngine {
  private readonly WEIGHTS = {
    transactionHealth: 0.3,
    businessDiversity: 0.2,
    infrastructure: 0.2,
    riskProfile: 0.15,
    marketPotential: 0.15
  };

  calculateTransactionHealth(metrics: LocationHealthMetrics): number {
    // Growth rate component (0-1)
    const growthScore = Math.max(0, Math.min(1, (metrics.transactionGrowthRate + 1) / 2));
    
    // Stability component (0-1, lower coefficient of variation = higher score)
    const stabilityScore = Math.max(0, Math.min(1, 1 - Math.min(metrics.transactionStability, 1)));
    
    // Transaction value health (normalized against expected range)
    const avgValueScore = Math.min(1, Math.max(0, metrics.averageTransactionValue / 100000)); // Normalized to 100k
    
    return (growthScore * 0.5 + stabilityScore * 0.3 + avgValueScore * 0.2);
  }

  calculateBusinessDiversity(metrics: LocationHealthMetrics): number {
    // Business type diversity (more types = better)
    const typeScore = Math.min(1, metrics.businessTypeCount / 10); // Max 10 types for perfect score
    
    // Business density (optimal range around 50 businesses per km²)
    const densityOptimal = 50;
    const densityScore = 1 - Math.abs(metrics.businessDensity - densityOptimal) / densityOptimal;
    const normalizedDensityScore = Math.max(0, Math.min(1, densityScore));
    
    return (typeScore * 0.6 + normalizedDensityScore * 0.4);
  }

  calculateInfrastructureScore(metrics: LocationHealthMetrics): number {
    // Uptime score (already 0-1)
    const uptimeScore = metrics.uptimePercentage;
    
    // Network quality (0-10 to 0-1)
    const networkScore = metrics.networkQuality / 10;
    
    // Power reliability (0-10 to 0-1)
    const powerScore = metrics.powerReliability / 10;
    
    return (uptimeScore * 0.5 + networkScore * 0.3 + powerScore * 0.2);
  }

  calculateRiskProfile(metrics: LocationHealthMetrics): number {
    // Anomaly risk (lower = better, so invert)
    const anomalyScore = 1 - metrics.anomalyRiskScore;
    
    // Competition level (optimal around 5, too low or high is bad)
    const competitionOptimal = 5;
    const competitionScore = 1 - Math.abs(metrics.competitionLevel - competitionOptimal) / competitionOptimal;
    const normalizedCompetitionScore = Math.max(0, Math.min(1, competitionScore));
    
    return (anomalyScore * 0.7 + normalizedCompetitionScore * 0.3);
  }

  calculateMarketPotential(metrics: LocationHealthMetrics): number {
    // Population density component (higher is generally better, but with diminishing returns)
    const popScore = Math.min(1, Math.log(metrics.populationDensity + 1) / Math.log(10000)); // Log scale up to 10k/km²
    
    // Income component (higher income = better potential)
    const incomeScore = Math.min(1, metrics.averageIncome / 50000000); // Normalized to 50M IRR
    
    // Foot traffic component
    const trafficScore = Math.min(1, metrics.footTraffic / 5000); // Normalized to 5k daily
    
    return (popScore * 0.4 + incomeScore * 0.35 + trafficScore * 0.25);
  }

  calculateOverallScore(categoryScores: GeoHealthScore['categoryScores']): number {
    return (
      categoryScores.transactionHealth * this.WEIGHTS.transactionHealth +
      categoryScores.businessDiversity * this.WEIGHTS.businessDiversity +
      categoryScores.infrastructure * this.WEIGHTS.infrastructure +
      categoryScores.riskProfile * this.WEIGHTS.riskProfile +
      categoryScores.marketPotential * this.WEIGHTS.marketPotential
    );
  }

  getHealthStatus(score: number): GeoHealthScore['healthStatus'] {
    if (score >= 0.85) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    if (score >= 0.3) return 'poor';
    return 'critical';
  }

  getRiskLevel(riskScore: number, anomalyRisk: number): GeoHealthScore['riskLevel'] {
    const combinedRisk = (1 - riskScore) * 0.7 + anomalyRisk * 0.3;
    if (combinedRisk <= 0.3) return 'low';
    if (combinedRisk <= 0.6) return 'medium';
    return 'high';
  }

  generateRecommendations(metrics: LocationHealthMetrics, scores: GeoHealthScore['categoryScores']): string[] {
    const recommendations: string[] = [];

    // Transaction health recommendations
    if (scores.transactionHealth < 0.5) {
      if (metrics.transactionGrowthRate < 0) {
        recommendations.push('🔄 بررسی علت کاهش تراکنش‌ها و اجرای کمپین‌های بازاریابی محلی');
      }
      if (metrics.transactionStability > 0.5) {
        recommendations.push('📈 پیاده‌سازی استراتژی‌های تثبیت درآمد و کاهش نوسانات');
      }
    }

    // Business diversity recommendations
    if (scores.businessDiversity < 0.5) {
      recommendations.push('🏪 ترویج تنوع کسب‌وکارها و جذب اصناف جدید در منطقه');
      if (metrics.businessDensity < 20) {
        recommendations.push('📍 افزایش تراکم کسب‌وکارها از طریق مشوق‌های سرمایه‌گذاری');
      }
    }

    // Infrastructure recommendations  
    if (scores.infrastructure < 0.6) {
      if (metrics.uptimePercentage < 0.95) {
        recommendations.push('⚡ بهبود پایداری دستگاه‌های POS و اعمال نگهداری پیشگیرانه');
      }
      if (metrics.networkQuality < 7) {
        recommendations.push('🌐 ارتقاء زیرساخت اینترنت و شبکه منطقه');
      }
    }

    // Risk recommendations
    if (scores.riskProfile < 0.6) {
      if (metrics.anomalyRiskScore > 0.4) {
        recommendations.push('🔒 تقویت سیستم‌های امنیتی و تشخیص تقلب');
      }
      recommendations.push('⚠️ نظارت مستمر بر الگوهای مشکوک تراکنش');
    }

    // Market potential recommendations
    if (scores.marketPotential < 0.6) {
      recommendations.push('🎯 بررسی فرصت‌های توسعه بازار و جذب مشتری');
      if (metrics.footTraffic < 1000) {
        recommendations.push('🚶 اجرای برنامه‌های جذب مراجعه‌کننده و افزایش ترددد');
      }
    }

    // Overall recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ عملکرد منطقه مطلوب است - ادامه رویه فعلی و نظارت مستمر');
    }

    return recommendations;
  }

  calculateTrends(historicalData: LocationHealthMetrics[]): GeoHealthScore['trends'] {
    if (historicalData.length < 3) {
      return { shortTerm: 'stable', longTerm: 'stagnation' };
    }

    // Short-term trend (last 3 months)
    const recent = historicalData.slice(-3);
    const recentGrowthTrend = recent[recent.length - 1].transactionGrowthRate;
    
    // Long-term trend (overall trajectory)
    const longTermGrowthAvg = historicalData.reduce((sum, m) => sum + m.transactionGrowthRate, 0) / historicalData.length;

    const shortTerm: GeoHealthScore['trends']['shortTerm'] = 
      recentGrowthTrend > 0.05 ? 'improving' :
      recentGrowthTrend < -0.05 ? 'declining' : 'stable';

    const longTerm: GeoHealthScore['trends']['longTerm'] = 
      longTermGrowthAvg > 0.03 ? 'growth' :
      longTermGrowthAvg < -0.03 ? 'decline' : 'stagnation';

    return { shortTerm, longTerm };
  }

  calculateGeoHealthScore(
    metrics: LocationHealthMetrics, 
    historicalData: LocationHealthMetrics[] = []
  ): GeoHealthScore {
    // Calculate category scores
    const categoryScores = {
      transactionHealth: this.calculateTransactionHealth(metrics),
      businessDiversity: this.calculateBusinessDiversity(metrics),
      infrastructure: this.calculateInfrastructureScore(metrics),
      riskProfile: this.calculateRiskProfile(metrics),
      marketPotential: this.calculateMarketPotential(metrics)
    };

    // Calculate overall score
    const overallScore = this.calculateOverallScore(categoryScores);

    // Determine health status and risk level
    const healthStatus = this.getHealthStatus(overallScore);
    const riskLevel = this.getRiskLevel(categoryScores.riskProfile, metrics.anomalyRiskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, categoryScores);

    // Calculate trends
    const trends = this.calculateTrends([...historicalData, metrics]);

    return {
      overallScore,
      categoryScores,
      healthStatus,
      riskLevel,
      recommendations,
      trends
    };
  }

  // Color mapping for map display
  getHealthColor(score: number): string {
    if (score >= 0.85) return '#10b981'; // Green (excellent)
    if (score >= 0.7) return '#84cc16';  // Light green (good)
    if (score >= 0.5) return '#eab308';  // Yellow (fair) 
    if (score >= 0.3) return '#f97316';  // Orange (poor)
    return '#ef4444';                    // Red (critical)
  }

  // Health status emoji
  getHealthEmoji(status: GeoHealthScore['healthStatus']): string {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'fair': return '🟠';
      case 'poor': return '🔴';
      case 'critical': return '🚨';
    }
  }

  // Generate mock data for demonstration
  generateMockLocationHealthData(locationId: string, name: string, coordinates: [number, number]): LocationHealthData {
    const mockMetrics: LocationHealthMetrics = {
      transactionGrowthRate: (Math.random() - 0.5) * 0.4, // -0.2 to 0.2
      transactionStability: Math.random() * 0.8, // 0 to 0.8
      averageTransactionValue: 30000 + Math.random() * 100000, // 30k to 130k IRR
      businessTypeCount: Math.floor(Math.random() * 8) + 3, // 3 to 10
      businessDensity: Math.random() * 80 + 10, // 10 to 90
      uptimePercentage: 0.85 + Math.random() * 0.15, // 85% to 100%
      networkQuality: Math.random() * 3 + 7, // 7 to 10
      powerReliability: Math.random() * 2 + 8, // 8 to 10  
      anomalyRiskScore: Math.random() * 0.3, // 0 to 0.3
      competitionLevel: Math.random() * 8 + 1, // 1 to 9
      populationDensity: Math.random() * 8000 + 1000, // 1k to 9k per km²
      averageIncome: 20000000 + Math.random() * 40000000, // 20M to 60M IRR
      footTraffic: Math.random() * 4000 + 500 // 500 to 4500 daily
    };

    const score = this.calculateGeoHealthScore(mockMetrics);

    return {
      locationId,
      name,
      coordinates,
      metrics: mockMetrics,
      score,
      lastUpdated: new Date()
    };
  }
}

export default new GeoHealthScoreEngine();