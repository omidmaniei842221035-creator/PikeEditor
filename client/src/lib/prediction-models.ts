// Machine Learning Prediction Models Library
// Advanced What-If Simulation System for POS Management

import * as tf from '@tensorflow/tfjs';
import { standardDeviation, mean, median } from 'simple-statistics';

// Type declaration for ml-regression
declare module 'ml-regression' {
  export const regression: any;
}

export interface ScenarioInput {
  scenarioType: 'add_pos' | 'increase_hours' | 'increase_users' | 'add_branch' | 'optimize_location';
  parameters: {
    posCount?: number;
    hoursIncrease?: number;
    userIncrease?: number;
    branchCount?: number;
    locationOptimization?: boolean;
  };
  targetArea: {
    regionId: string;
    regionName: string;
    coordinates: [number, number];
    radius: number; // in meters
  };
}

export interface ScenarioPrediction {
  scenarioId: string;
  input: ScenarioInput;
  predictions: {
    revenue: {
      current: number;
      predicted: number;
      change: number;
      changePercent: number;
      confidence: number;
    };
    transactions: {
      current: number;
      predicted: number;
      change: number;
      changePercent: number;
      confidence: number;
    };
    customerSatisfaction: {
      current: number;
      predicted: number;
      change: number;
      changePercent: number;
      confidence: number;
    };
    operationalCosts: {
      current: number;
      predicted: number;
      change: number;
      changePercent: number;
      confidence: number;
    };
    roi: {
      predicted: number;
      paybackPeriod: number; // months
      confidence: number;
    };
  };
  timeHorizons: {
    shortTerm: ScenarioKPIs; // 3 months
    mediumTerm: ScenarioKPIs; // 12 months
    longTerm: ScenarioKPIs; // 24 months
  };
  risks: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
  recommendations: string[];
}

interface ScenarioKPIs {
  revenue: number;
  transactions: number;
  customerCount: number;
  profitability: number;
}

export interface RegionData {
  id: string;
  name: string;
  coordinates: [number, number];
  currentMetrics: {
    revenue: number;
    transactions: number;
    posCount: number;
    customerCount: number;
    operatingHours: number;
    averageTransactionValue: number;
    customerSatisfaction: number;
    operationalCosts: number;
  };
  demographics: {
    population: number;
    avgIncome: number;
    businessDensity: number;
    competitionLevel: number;
  };
  infrastructure: {
    internetQuality: number;
    powerReliability: number;
    transportAccess: number;
  };
}

export class MLPredictionEngine {
  private revenueModel: tf.LayersModel | null = null;
  private transactionModel: tf.LayersModel | null = null;
  private satisfactionModel: tf.LayersModel | null = null;
  private costModel: tf.LayersModel | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    try {
      await tf.ready();
      
      // Create simple regression models for prediction
      this.revenueModel = this.createRevenueModel();
      this.transactionModel = this.createTransactionModel();
      this.satisfactionModel = this.createSatisfactionModel();
      this.costModel = this.createCostModel();
      
      // Train models with synthetic data
      await this.trainModels();
      
      this.isInitialized = true;
      console.log('🤖 ML Prediction models initialized successfully');
    } catch (error) {
      console.error('Error initializing ML models:', error);
    }
  }

  private createRevenueModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private createTransactionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 24, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 12, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private createSatisfactionModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 8, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  private createCostModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 20, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  private async trainModels(): Promise<void> {
    // Generate synthetic training data
    const trainingData = this.generateTrainingData(1000);
    
    const features = tf.tensor2d(trainingData.features);
    const revenueLabels = tf.tensor2d(trainingData.revenue, [trainingData.revenue.length, 1]);
    const transactionLabels = tf.tensor2d(trainingData.transactions, [trainingData.transactions.length, 1]);
    const satisfactionLabels = tf.tensor2d(trainingData.satisfaction, [trainingData.satisfaction.length, 1]);
    const costLabels = tf.tensor2d(trainingData.costs, [trainingData.costs.length, 1]);

    // Train models
    if (this.revenueModel) {
      await this.revenueModel.fit(features, revenueLabels, {
        epochs: 50,
        batchSize: 32,
        verbose: 0
      });
    }

    if (this.transactionModel) {
      await this.transactionModel.fit(features, transactionLabels, {
        epochs: 50,
        batchSize: 32,
        verbose: 0
      });
    }

    if (this.satisfactionModel) {
      await this.satisfactionModel.fit(features, satisfactionLabels, {
        epochs: 50,
        batchSize: 32,
        verbose: 0
      });
    }

    if (this.costModel) {
      await this.costModel.fit(features, costLabels, {
        epochs: 50,
        batchSize: 32,
        verbose: 0
      });
    }

    // Clean up tensors
    features.dispose();
    revenueLabels.dispose();
    transactionLabels.dispose();
    satisfactionLabels.dispose();
    costLabels.dispose();
  }

  private generateTrainingData(samples: number) {
    const features: number[][] = [];
    const revenue: number[] = [];
    const transactions: number[] = [];
    const satisfaction: number[] = [];
    const costs: number[] = [];

    for (let i = 0; i < samples; i++) {
      // Feature vector: [posCount, operatingHours, population, avgIncome, businessDensity, competitionLevel, internetQuality, transportAccess]
      const posCount = Math.random() * 100 + 1;
      const operatingHours = Math.random() * 24 + 8;
      const population = Math.random() * 100000 + 10000;
      const avgIncome = Math.random() * 50000 + 20000;
      const businessDensity = Math.random() * 100;
      const competitionLevel = Math.random() * 10;
      const internetQuality = Math.random() * 10;
      const transportAccess = Math.random() * 10;

      const feature = [
        posCount / 100, // Normalize
        operatingHours / 24,
        population / 100000,
        avgIncome / 70000,
        businessDensity / 100,
        competitionLevel / 10,
        internetQuality / 10,
        transportAccess / 10
      ];

      features.push(feature);

      // Generate realistic target values
      const baseRevenue = posCount * operatingHours * (population / 1000) * (avgIncome / 30000) * businessDensity * (11 - competitionLevel) * internetQuality * transportAccess;
      revenue.push(baseRevenue / 1000000); // Normalize to millions

      const baseTransactions = posCount * operatingHours * 10 * (population / 10000) * (businessDensity / 20);
      transactions.push(baseTransactions / 1000); // Normalize to thousands

      const baseSatisfaction = (operatingHours / 24) * ((11 - competitionLevel) / 10) * (internetQuality / 10) * 0.9 + Math.random() * 0.1;
      satisfaction.push(Math.min(1, baseSatisfaction));

      const baseCosts = posCount * 500 + operatingHours * 50 * posCount + (population / 1000) * 10;
      costs.push(baseCosts / 100000); // Normalize
    }

    return { features, revenue, transactions, satisfaction, costs };
  }

  public async predictScenario(input: ScenarioInput, regionData: RegionData): Promise<ScenarioPrediction> {
    if (!this.isInitialized) {
      await this.initializeModels();
    }

    const scenarioId = `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Apply scenario changes to region data
    const modifiedData = this.applyScenarioChanges(regionData, input);
    
    // Create feature vectors for prediction
    const currentFeatures = this.createFeatureVector(regionData);
    const modifiedFeatures = this.createFeatureVector(modifiedData);

    // Make predictions
    const predictions = await this.makePredictions(currentFeatures, modifiedFeatures, regionData);
    
    // Calculate time horizons
    const timeHorizons = this.calculateTimeHorizons(predictions, input);
    
    // Assess risks
    const risks = this.assessRisks(input, regionData, predictions);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(input, predictions, risks);

    return {
      scenarioId,
      input,
      predictions,
      timeHorizons,
      risks,
      recommendations
    };
  }

  private applyScenarioChanges(regionData: RegionData, input: ScenarioInput): RegionData {
    const modified = JSON.parse(JSON.stringify(regionData)); // Deep clone

    switch (input.scenarioType) {
      case 'add_pos':
        modified.currentMetrics.posCount += input.parameters.posCount || 0;
        modified.currentMetrics.operationalCosts += (input.parameters.posCount || 0) * 500; // $500 per POS monthly
        break;
      
      case 'increase_hours':
        modified.currentMetrics.operatingHours += input.parameters.hoursIncrease || 0;
        modified.currentMetrics.operationalCosts += (input.parameters.hoursIncrease || 0) * 50 * modified.currentMetrics.posCount;
        break;
      
      case 'increase_users':
        const userMultiplier = 1 + ((input.parameters.userIncrease || 0) / 100);
        modified.currentMetrics.customerCount *= userMultiplier;
        modified.demographics.population *= userMultiplier;
        break;
      
      case 'add_branch':
        modified.currentMetrics.posCount += (input.parameters.branchCount || 1) * 5; // Assume 5 POS per branch
        modified.currentMetrics.operationalCosts += (input.parameters.branchCount || 1) * 5000; // $5000 per branch monthly
        break;
      
      case 'optimize_location':
        if (input.parameters.locationOptimization) {
          modified.infrastructure.internetQuality = Math.min(10, modified.infrastructure.internetQuality * 1.2);
          modified.infrastructure.transportAccess = Math.min(10, modified.infrastructure.transportAccess * 1.15);
          modified.demographics.businessDensity = Math.min(100, modified.demographics.businessDensity * 1.1);
        }
        break;
    }

    return modified;
  }

  private createFeatureVector(regionData: RegionData): number[] {
    return [
      regionData.currentMetrics.posCount / 100,
      regionData.currentMetrics.operatingHours / 24,
      regionData.demographics.population / 100000,
      regionData.demographics.avgIncome / 70000,
      regionData.demographics.businessDensity / 100,
      regionData.demographics.competitionLevel / 10,
      regionData.infrastructure.internetQuality / 10,
      regionData.infrastructure.transportAccess / 10
    ];
  }

  private async makePredictions(currentFeatures: number[], modifiedFeatures: number[], regionData: RegionData) {
    const currentTensor = tf.tensor2d([currentFeatures]);
    const modifiedTensor = tf.tensor2d([modifiedFeatures]);

    const currentRevenue = regionData.currentMetrics.revenue;
    const currentTransactions = regionData.currentMetrics.transactions;
    const currentSatisfaction = regionData.currentMetrics.customerSatisfaction;
    const currentCosts = regionData.currentMetrics.operationalCosts;

    // Make predictions
    let predictedRevenue = currentRevenue;
    let predictedTransactions = currentTransactions;
    let predictedSatisfaction = currentSatisfaction;
    let predictedCosts = currentCosts;

    try {
      if (this.revenueModel) {
        const revenueResult = this.revenueModel.predict(modifiedTensor) as tf.Tensor;
        predictedRevenue = (await revenueResult.data())[0] * 1000000;
        revenueResult.dispose();
      }

      if (this.transactionModel) {
        const transactionResult = this.transactionModel.predict(modifiedTensor) as tf.Tensor;
        predictedTransactions = (await transactionResult.data())[0] * 1000;
        transactionResult.dispose();
      }

      if (this.satisfactionModel) {
        const satisfactionResult = this.satisfactionModel.predict(modifiedTensor) as tf.Tensor;
        predictedSatisfaction = (await satisfactionResult.data())[0];
        satisfactionResult.dispose();
      }

      if (this.costModel) {
        const costResult = this.costModel.predict(modifiedTensor) as tf.Tensor;
        predictedCosts = (await costResult.data())[0] * 100000;
        costResult.dispose();
      }
    } catch (error) {
      console.error('Prediction error:', error);
    }

    // Clean up tensors
    currentTensor.dispose();
    modifiedTensor.dispose();

    // Calculate changes and confidence intervals
    const revenueChange = predictedRevenue - currentRevenue;
    const transactionChange = predictedTransactions - currentTransactions;
    const satisfactionChange = predictedSatisfaction - currentSatisfaction;
    const costChange = predictedCosts - currentCosts;

    // Calculate ROI
    const investment = this.calculateInvestment(modifiedFeatures, currentFeatures);
    const roi = investment > 0 ? ((revenueChange - costChange) / investment) * 100 : 0;
    const paybackPeriod = investment > 0 ? investment / Math.max(1, (revenueChange - costChange) / 12) : 0;

    return {
      revenue: {
        current: currentRevenue,
        predicted: predictedRevenue,
        change: revenueChange,
        changePercent: currentRevenue > 0 ? (revenueChange / currentRevenue) * 100 : 0,
        confidence: this.calculateConfidence('revenue', modifiedFeatures)
      },
      transactions: {
        current: currentTransactions,
        predicted: predictedTransactions,
        change: transactionChange,
        changePercent: currentTransactions > 0 ? (transactionChange / currentTransactions) * 100 : 0,
        confidence: this.calculateConfidence('transactions', modifiedFeatures)
      },
      customerSatisfaction: {
        current: currentSatisfaction,
        predicted: predictedSatisfaction,
        change: satisfactionChange,
        changePercent: currentSatisfaction > 0 ? (satisfactionChange / currentSatisfaction) * 100 : 0,
        confidence: this.calculateConfidence('satisfaction', modifiedFeatures)
      },
      operationalCosts: {
        current: currentCosts,
        predicted: predictedCosts,
        change: costChange,
        changePercent: currentCosts > 0 ? (costChange / currentCosts) * 100 : 0,
        confidence: this.calculateConfidence('costs', modifiedFeatures)
      },
      roi: {
        predicted: roi,
        paybackPeriod: paybackPeriod,
        confidence: this.calculateConfidence('roi', modifiedFeatures)
      }
    };
  }

  private calculateInvestment(modifiedFeatures: number[], currentFeatures: number[]): number {
    const posIncrease = (modifiedFeatures[0] - currentFeatures[0]) * 100;
    const hoursIncrease = (modifiedFeatures[1] - currentFeatures[1]) * 24;
    
    let investment = 0;
    investment += posIncrease * 2000; // $2000 per POS installation
    investment += hoursIncrease * 100 * posIncrease; // Extended hours cost
    
    return investment;
  }

  private calculateConfidence(metric: string, features: number[]): number {
    // Simple confidence calculation based on feature stability
    const featureVariability = standardDeviation(features);
    const baseConfidence = 0.85;
    const confidence = Math.max(0.6, baseConfidence - (featureVariability * 0.5));
    
    return Math.round(confidence * 100) / 100;
  }

  private calculateTimeHorizons(predictions: any, input: ScenarioInput): any {
    const impactFactor = this.getScenarioImpactFactor(input.scenarioType);
    
    return {
      shortTerm: {
        revenue: predictions.revenue.predicted * 0.3,
        transactions: predictions.transactions.predicted * 0.4,
        customerCount: predictions.transactions.predicted * 0.8,
        profitability: (predictions.revenue.predicted - predictions.operationalCosts.predicted) * 0.2
      },
      mediumTerm: {
        revenue: predictions.revenue.predicted * 0.8,
        transactions: predictions.transactions.predicted * 0.9,
        customerCount: predictions.transactions.predicted * 1.1,
        profitability: (predictions.revenue.predicted - predictions.operationalCosts.predicted) * 0.7
      },
      longTerm: {
        revenue: predictions.revenue.predicted * impactFactor,
        transactions: predictions.transactions.predicted * impactFactor,
        customerCount: predictions.transactions.predicted * (impactFactor + 0.2),
        profitability: (predictions.revenue.predicted - predictions.operationalCosts.predicted) * impactFactor
      }
    };
  }

  private getScenarioImpactFactor(scenarioType: string): number {
    switch (scenarioType) {
      case 'add_pos': return 1.2;
      case 'increase_hours': return 1.15;
      case 'increase_users': return 1.3;
      case 'add_branch': return 1.5;
      case 'optimize_location': return 1.1;
      default: return 1.0;
    }
  }

  private assessRisks(input: ScenarioInput, regionData: RegionData, predictions: any): any {
    const risks: string[] = [];
    const mitigation: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Competition risk
    if (regionData.demographics.competitionLevel > 7) {
      risks.push('سطح رقابت بالا در منطقه');
      mitigation.push('تمرکز بر خدمات متمایز و کیفیت بالا');
      level = 'high';
    }

    // Infrastructure risk
    if (regionData.infrastructure.internetQuality < 6) {
      risks.push('کیفیت اینترنت نامناسب');
      mitigation.push('سرمایه‌گذاری در زیرساخت شبکه');
      level = level === 'high' ? 'high' : 'medium';
    }

    // Investment risk
    const investmentRisk = predictions.roi.predicted < 15;
    if (investmentRisk) {
      risks.push('بازدهی سرمایه‌گذاری پایین');
      mitigation.push('بازنگری در استراتژی اجرا و کاهش هزینه‌ها');
      level = level === 'high' ? 'high' : 'medium';
    }

    // Market saturation risk
    if (input.scenarioType === 'add_pos' && regionData.currentMetrics.posCount > 50) {
      risks.push('احتمال اشباع بازار');
      mitigation.push('گسترش به مناطق جدید یا خدمات تکمیلی');
      level = 'medium';
    }

    return { level, factors: risks, mitigation };
  }

  private generateRecommendations(input: ScenarioInput, predictions: any, risks: any): string[] {
    const recommendations: string[] = [];

    if (predictions.roi.predicted > 20) {
      recommendations.push('🚀 سناریو بسیار سودآور - پیشنهاد اجرای سریع');
    } else if (predictions.roi.predicted > 10) {
      recommendations.push('💡 سناریو مناسب - اجرای تدریجی توصیه می‌شود');
    } else {
      recommendations.push('⚠️ سناریو پرریسک - نیاز به بازنگری در پارامترها');
    }

    if (predictions.customerSatisfaction.change > 0.1) {
      recommendations.push('😊 افزایش رضایت مشتریان قابل توجه');
    }

    if (risks.level === 'high') {
      recommendations.push('🔍 ضروری: مطالعه دقیق‌تر بازار قبل از اجرا');
    }

    if (input.scenarioType === 'add_pos') {
      recommendations.push('📍 بررسی موقعیت بهینه نقاط فروش جدید');
    }

    return recommendations;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public dispose(): void {
    if (this.revenueModel) {
      this.revenueModel.dispose();
    }
    if (this.transactionModel) {
      this.transactionModel.dispose();
    }
    if (this.satisfactionModel) {
      this.satisfactionModel.dispose();
    }
    if (this.costModel) {
      this.costModel.dispose();
    }
  }
}