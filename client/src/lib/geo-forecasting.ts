import { latLngToCell, cellToBoundary, cellToLatLng, gridDisk } from 'h3-js';
// @ts-ignore - regression module doesn't have types
import regression from 'regression';
import { mean, standardDeviation } from 'simple-statistics';
// Note: Using timeseries-analysis instead of deprecated forecast package

// Types for geo-forecasting
export interface GeoTimeSeriesData {
  date: Date;
  h3Index: string;
  transactions: number;
  revenue: number;
  lat: number;
  lng: number;
  neighborhood?: string;
}

export interface H3CellForecast {
  h3Index: string;
  lat: number;
  lng: number;
  currentTransactions: number;
  predictedTransactions: number;
  confidenceLower: number;
  confidenceUpper: number;
  trend: 'surge' | 'decline' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  forecastAccuracy: number;
}

export interface GeoForecastResult {
  date: Date;
  forecasts: H3CellForecast[];
  overallTrend: {
    totalPredicted: number;
    totalCurrent: number;
    changePercent: number;
    hotspots: H3CellForecast[];
    coldspots: H3CellForecast[];
  };
}

export interface ForecastMetrics {
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  accuracy: number; // Percentage accuracy
}

export class GeoForecastingEngine {
  private resolution: number = 9; // H3 resolution level (9 = ~200m hexagons)
  private historicalData: GeoTimeSeriesData[] = [];
  private h3Aggregations: Map<string, GeoTimeSeriesData[]> = new Map();

  constructor(resolution: number = 9) {
    this.resolution = resolution;
  }

  // Convert geographic points to H3 grid and aggregate time series
  public processRawData(data: Array<{
    date: Date;
    lat: number;
    lng: number;
    transactions: number;
    revenue: number;
    neighborhood?: string;
  }>): void {
    this.historicalData = [];
    this.h3Aggregations.clear();

    // Convert each data point to H3 index and aggregate
    data.forEach(point => {
      const h3Index = latLngToCell(point.lat, point.lng, this.resolution);
      const [lat, lng] = cellToLatLng(h3Index);
      
      const geoData: GeoTimeSeriesData = {
        date: point.date,
        h3Index,
        lat,
        lng,
        transactions: point.transactions,
        revenue: point.revenue,
        neighborhood: point.neighborhood
      };

      this.historicalData.push(geoData);

      // Aggregate by H3 cell
      if (!this.h3Aggregations.has(h3Index)) {
        this.h3Aggregations.set(h3Index, []);
      }
      this.h3Aggregations.get(h3Index)!.push(geoData);
    });

    console.log(`🗺️  Processed ${data.length} points into ${this.h3Aggregations.size} H3 cells`);
  }

  // Time series forecasting using regression analysis for each H3 cell
  private forecastCellTimeSeries(cellData: GeoTimeSeriesData[]): {
    prediction: number;
    confidence: { lower: number; upper: number };
    trend: 'surge' | 'decline' | 'stable';
    accuracy: number;
  } {
    if (cellData.length < 3) {
      return {
        prediction: cellData[cellData.length - 1]?.transactions || 0,
        confidence: { lower: 0, upper: 0 },
        trend: 'stable',
        accuracy: 0.5
      };
    }

    // Sort by date
    const sortedData = cellData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Prepare regression data (time as x, transactions as y)
    const regressionData: [number, number][] = sortedData.map((d, i) => [i, d.transactions]);
    
    // Multiple regression models for comparison
    const linearModel = regression.linear(regressionData);
    const polyModel = regression.polynomial(regressionData, { order: 2 });
    // Skip exponential model as it may have compatibility issues
    const models = [
      { name: 'linear', model: linearModel },
      { name: 'polynomial', model: polyModel }
    ];

    // Choose best model based on R²
    const sortedModels = models.sort((a, b) => b.model.r2 - a.model.r2);
    const bestModel = sortedModels[0].model;
    const nextTimeStep = sortedData.length;
    
    // Predict next month
    const prediction = Math.max(0, bestModel.predict(nextTimeStep)[1]);
    
    // Calculate prediction intervals using residuals
    const residuals = sortedData.map((d, i) => 
      d.transactions - bestModel.predict(i)[1]
    );
    const residualStd = standardDeviation(residuals);
    const confidence = {
      lower: Math.max(0, prediction - 1.96 * residualStd),
      upper: prediction + 1.96 * residualStd
    };

    // Determine trend
    const recentTrend = sortedData.length >= 2 
      ? sortedData[sortedData.length - 1].transactions - sortedData[sortedData.length - 2].transactions
      : 0;
    const trendThreshold = mean(sortedData.map(d => d.transactions)) * 0.1;
    
    let trend: 'surge' | 'decline' | 'stable' = 'stable';
    if (prediction - sortedData[sortedData.length - 1].transactions > trendThreshold) {
      trend = 'surge';
    } else if (sortedData[sortedData.length - 1].transactions - prediction > trendThreshold) {
      trend = 'decline';
    }

    return {
      prediction,
      confidence,
      trend,
      accuracy: Math.max(0, Math.min(1, bestModel.r2))
    };
  }

  // Enhanced forecasting using XGBoost-like multivariate features
  private enhancedForecast(cellData: GeoTimeSeriesData[], neighborData: GeoTimeSeriesData[][]): {
    prediction: number;
    confidence: { lower: number; upper: number };
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const timeSeries = this.forecastCellTimeSeries(cellData);
    
    // Neighbor influence (spillover effect)
    const neighborMean = neighborData.flat()
      .filter(d => d.date.getTime() >= Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 3 months
      .map(d => d.transactions);
    
    const neighborAvg = neighborMean.length > 0 ? mean(neighborMean) : 0;
    const cellAvg = mean(cellData.map(d => d.transactions));
    
    // Adjust prediction based on neighborhood trends
    const neighborInfluence = 0.15; // 15% influence from neighbors
    const adjustedPrediction = timeSeries.prediction * (1 - neighborInfluence) + 
                              neighborAvg * neighborInfluence;

    // Risk assessment based on variance and confidence
    const variance = cellData.length > 1 
      ? standardDeviation(cellData.map(d => d.transactions)) / mean(cellData.map(d => d.transactions))
      : 0;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (variance > 0.5 || timeSeries.accuracy < 0.6) riskLevel = 'high';
    else if (variance > 0.3 || timeSeries.accuracy < 0.8) riskLevel = 'medium';

    return {
      prediction: Math.max(0, adjustedPrediction),
      confidence: timeSeries.confidence,
      riskLevel
    };
  }

  // Main forecasting method
  public async generateMonthlyForecast(targetDate: Date = new Date()): Promise<GeoForecastResult> {
    const forecasts: H3CellForecast[] = [];
    let totalPredicted = 0;
    let totalCurrent = 0;

    // Process each H3 cell
    for (const [h3Index, cellData] of Array.from(this.h3Aggregations.entries())) {
      if (cellData.length === 0) continue;

      const [lat, lng] = cellToLatLng(h3Index);
      const currentTransactions = cellData[cellData.length - 1]?.transactions || 0;

      // Get neighboring cells for spillover analysis
      const neighborIndices = gridDisk(h3Index, 1); // 1-ring neighbors
      const neighborData = neighborIndices
        .filter(idx => idx !== h3Index)
        .map(idx => this.h3Aggregations.get(idx) || [])
        .filter(data => data.length > 0);

      // Enhanced prediction
      const enhanced = this.enhancedForecast(cellData, neighborData);
      const timeSeries = this.forecastCellTimeSeries(cellData);

      const forecast: H3CellForecast = {
        h3Index,
        lat,
        lng,
        currentTransactions,
        predictedTransactions: enhanced.prediction,
        confidenceLower: enhanced.confidence.lower,
        confidenceUpper: enhanced.confidence.upper,
        trend: timeSeries.trend,
        riskLevel: enhanced.riskLevel,
        forecastAccuracy: timeSeries.accuracy
      };

      forecasts.push(forecast);
      totalPredicted += enhanced.prediction;
      totalCurrent += currentTransactions;
    }

    // Identify hotspots and coldspots
    const sorted = forecasts.sort((a, b) => 
      (b.predictedTransactions - b.currentTransactions) - (a.predictedTransactions - a.currentTransactions)
    );

    const hotspots = sorted.slice(0, Math.min(10, Math.floor(sorted.length * 0.1)))
      .filter(f => f.trend === 'surge');
    
    const coldspots = sorted.slice(-Math.min(10, Math.floor(sorted.length * 0.1)))
      .filter(f => f.trend === 'decline');

    return {
      date: targetDate,
      forecasts,
      overallTrend: {
        totalPredicted,
        totalCurrent,
        changePercent: totalCurrent > 0 ? ((totalPredicted - totalCurrent) / totalCurrent) * 100 : 0,
        hotspots,
        coldspots
      }
    };
  }

  // Calculate forecast accuracy metrics
  public calculateAccuracyMetrics(actual: number[], predicted: number[]): ForecastMetrics {
    if (actual.length !== predicted.length || actual.length === 0) {
      return { mae: 0, mape: 0, rmse: 0, accuracy: 0 };
    }

    const errors = actual.map((a, i) => a - predicted[i]);
    const absErrors = errors.map(e => Math.abs(e));
    const sqErrors = errors.map(e => e * e);
    
    const mae = mean(absErrors);
    const rmse = Math.sqrt(mean(sqErrors));
    
    // MAPE with protection against division by zero
    const percentErrors = actual.map((a, i) => 
      a !== 0 ? Math.abs((a - predicted[i]) / a) : 0
    );
    const mape = mean(percentErrors) * 100;
    
    // Accuracy as 1 - normalized MAPE
    const accuracy = Math.max(0, 1 - mape / 100) * 100;

    return { mae, mape, rmse, accuracy };
  }

  // Generate sample data for demonstration
  public generateSampleData(): Array<{
    date: Date;
    lat: number;
    lng: number;
    transactions: number;
    revenue: number;
    neighborhood?: string;
  }> {
    const sampleData = [];
    const tabrizCenter = { lat: 38.0962, lng: 46.2738 }; // Tabriz coordinates
    const neighborhoods = [
      'شهرک صداقت', 'خیابان شهید مطهری', 'میدان ساعت', 
      'بازار تبریز', 'پارک ائل گلی', 'دانشگاه تبریز'
    ];
    
    // Generate 12 months of historical data
    for (let month = 0; month < 12; month++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (12 - month));
      
      // Generate points around Tabriz with seasonal variation
      for (let i = 0; i < 50; i++) {
        const lat = tabrizCenter.lat + (Math.random() - 0.5) * 0.1; // ~5km radius
        const lng = tabrizCenter.lng + (Math.random() - 0.5) * 0.1;
        
        // Seasonal pattern + random variation
        const seasonalFactor = 1 + 0.3 * Math.sin((month / 12) * 2 * Math.PI);
        const baseTransactions = 100 + Math.random() * 200;
        const transactions = Math.floor(baseTransactions * seasonalFactor);
        
        sampleData.push({
          date,
          lat,
          lng,
          transactions,
          revenue: transactions * (50 + Math.random() * 100), // Revenue per transaction
          neighborhood: neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
        });
      }
    }

    return sampleData;
  }
}