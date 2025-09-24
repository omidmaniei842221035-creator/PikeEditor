import express from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { 
  insertDashboardSchema,
  insertDataSourceSchema,
  insertOrganizationSchema,
  insertAlertRuleSchema,
  insertMlModelSchema,
  insertReportSchema
} from '@shared/schema';

export const grafanaRouter = express.Router();

// Mock data for development
const mockDataSources = [
  { id: '1', name: 'Prometheus', type: 'prometheus', url: 'http://prometheus:9090', isDefault: true },
  { id: '2', name: 'PostgreSQL', type: 'postgresql', url: 'postgresql://localhost:5432/pos_db', isDefault: false },
  { id: '3', name: 'ClickHouse', type: 'clickhouse', url: 'http://clickhouse:8123', isDefault: false },
  { id: '4', name: 'Loki', type: 'loki', url: 'http://loki:3100', isDefault: false }
];

const mockOrganizations = [
  { id: '1', name: 'بانک ملی ایران', slug: 'bmi', settings: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'بانک صادرات', slug: 'export-bank', settings: {}, createdAt: new Date(), updatedAt: new Date() }
];

// ======================
// ORGANIZATIONS
// ======================

grafanaRouter.get('/organizations', async (req, res) => {
  try {
    res.json(mockOrganizations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

grafanaRouter.post('/organizations', async (req, res) => {
  try {
    const orgData = insertOrganizationSchema.parse(req.body);
    const newOrg = {
      id: String(Date.now()),
      name: orgData.name,
      slug: orgData.slug,
      settings: orgData.settings || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockOrganizations.push(newOrg as any);
    res.status(201).json(newOrg);
  } catch (error) {
    res.status(400).json({ error: 'Invalid organization data' });
  }
});

// ======================
// DATA SOURCES
// ======================

grafanaRouter.get('/datasources', async (req, res) => {
  try {
    res.json(mockDataSources);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

grafanaRouter.post('/datasources', async (req, res) => {
  try {
    const dsData = insertDataSourceSchema.parse(req.body);
    const newDs = {
      id: String(Date.now()),
      name: dsData.name,
      type: dsData.type,
      url: dsData.url || '',
      isDefault: dsData.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockDataSources.push(newDs as any);
    res.status(201).json(newDs);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data source data' });
  }
});

grafanaRouter.get('/datasources/:id', async (req, res) => {
  try {
    const ds = mockDataSources.find(d => d.id === req.params.id);
    if (!ds) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    res.json(ds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data source' });
  }
});

grafanaRouter.put('/datasources/:id', async (req, res) => {
  try {
    const index = mockDataSources.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    const dsData = insertDataSourceSchema.partial().parse(req.body);
    mockDataSources[index] = { 
      ...mockDataSources[index], 
      name: dsData.name || mockDataSources[index].name,
      type: dsData.type || mockDataSources[index].type,
      url: dsData.url || mockDataSources[index].url,
      isDefault: dsData.isDefault !== undefined ? dsData.isDefault : mockDataSources[index].isDefault
    };
    
    res.json(mockDataSources[index]);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data source data' });
  }
});

grafanaRouter.delete('/datasources/:id', async (req, res) => {
  try {
    const index = mockDataSources.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Data source not found' });
    }
    
    mockDataSources.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete data source' });
  }
});

// ======================
// DASHBOARDS
// ======================

let mockDashboards: any[] = [
  {
    id: '1',
    uid: 'banking-overview',
    title: 'نمای کلی بانکی',
    tags: ['banking', 'overview'],
    panels: [],
    timeRange: { from: 'now-24h', to: 'now' },
    variables: [],
    version: 1,
    isStarred: false,
    organizationId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2', 
    uid: 'pos-monitoring',
    title: 'مانیتورینگ POS',
    tags: ['pos', 'monitoring'],
    panels: [],
    timeRange: { from: 'now-1h', to: 'now' },
    variables: [],
    version: 1,
    isStarred: true,
    organizationId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

grafanaRouter.get('/dashboards', async (req, res) => {
  try {
    const { search, starred } = req.query;
    
    let filtered = mockDashboards;
    
    if (search) {
      const searchStr = String(search).toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(searchStr) ||
        d.tags.some((tag: string) => tag.toLowerCase().includes(searchStr))
      );
    }
    
    if (starred === 'true') {
      filtered = filtered.filter(d => d.isStarred);
    }
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

grafanaRouter.get('/dashboards/:uid', async (req, res) => {
  try {
    const dashboard = mockDashboards.find(d => d.uid === req.params.uid);
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

grafanaRouter.post('/dashboards', async (req, res) => {
  try {
    const dashboardData = insertDashboardSchema.parse(req.body);
    const newDashboard = {
      id: String(Date.now()),
      ...dashboardData,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockDashboards.push(newDashboard);
    res.status(201).json(newDashboard);
  } catch (error) {
    res.status(400).json({ error: 'Invalid dashboard data' });
  }
});

grafanaRouter.put('/dashboards/:id', async (req, res) => {
  try {
    const index = mockDashboards.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    const dashboardData = insertDashboardSchema.partial().parse(req.body);
    mockDashboards[index] = {
      ...mockDashboards[index],
      ...dashboardData,
      version: mockDashboards[index].version + 1,
      updatedAt: new Date()
    };
    
    res.json(mockDashboards[index]);
  } catch (error) {
    res.status(400).json({ error: 'Invalid dashboard data' });
  }
});

grafanaRouter.delete('/dashboards/:id', async (req, res) => {
  try {
    const index = mockDashboards.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    mockDashboards.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

grafanaRouter.post('/dashboards/:id/star', async (req, res) => {
  try {
    const { isStarred } = req.body;
    const index = mockDashboards.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    mockDashboards[index].isStarred = isStarred;
    res.json(mockDashboards[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// ======================
// QUERY API (Unified query interface)
// ======================

grafanaRouter.post('/query', async (req, res) => {
  try {
    const { queries, timeRange } = req.body;
    
    // Mock query execution for different data sources
    const results = queries.map((query: any) => {
      const datasourceType = query.datasource?.toLowerCase() || 'prometheus';
      
      switch (datasourceType) {
        case 'prometheus':
          return {
            refId: query.refId,
            series: [{
              name: query.expr || 'metric',
              points: generateMockTimeSeries(timeRange)
            }]
          };
          
        case 'postgresql':
          return {
            refId: query.refId,
            table: {
              columns: [
                { text: 'time', type: 'time' },
                { text: 'value', type: 'number' },
                { text: 'branch', type: 'string' }
              ],
              rows: generateMockTableData(20)
            }
          };
          
        case 'loki':
          return {
            refId: query.refId,
            logs: generateMockLogs(50)
          };
          
        default:
          return {
            refId: query.refId,
            series: [{
              name: 'Mock Data',
              points: generateMockTimeSeries(timeRange)
            }]
          };
      }
    });
    
    res.json({ results });
  } catch (error) {
    res.status(400).json({ error: 'Query execution failed' });
  }
});

// ======================
// ML MODELS & PREDICTIONS
// ======================

const mockMlModels = [
  {
    id: '1',
    name: 'Anomaly Detection Model',
    type: 'anomaly_detection',
    endpoint: '/ml/anomaly/predict',
    version: '1.0.0',
    metadata: { accuracy: 0.962, features: ['transaction_amount', 'time_of_day', 'location'] },
    isActive: true,
    organizationId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Transaction Forecasting',
    type: 'forecasting', 
    endpoint: '/ml/forecast/predict',
    version: '1.2.1',
    metadata: { rmse: 12.4, horizon: '7d' },
    isActive: true,
    organizationId: '1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

grafanaRouter.get('/ml/models', async (req, res) => {
  try {
    res.json(mockMlModels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ML models' });
  }
});

grafanaRouter.post('/ml/predict', async (req, res) => {
  try {
    const { modelId, inputData } = req.body;
    const model = mockMlModels.find(m => m.id === modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'ML model not found' });
    }
    
    // Mock prediction based on model type
    let prediction;
    let explanation = {};
    
    switch (model.type) {
      case 'anomaly_detection':
        prediction = {
          isAnomaly: Math.random() > 0.8,
          anomalyScore: Math.random(),
          confidence: 0.85 + Math.random() * 0.15
        };
        explanation = {
          shapValues: {
            transaction_amount: Math.random() * 0.4 - 0.2,
            time_of_day: Math.random() * 0.3 - 0.15,
            location: Math.random() * 0.2 - 0.1
          }
        };
        break;
        
      case 'forecasting':
        const baseValue = inputData.historical_avg || 100;
        prediction = {
          forecast: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
            value: baseValue + Math.random() * 40 - 20,
            confidence_lower: baseValue - 15,
            confidence_upper: baseValue + 15
          }))
        };
        break;
        
      default:
        prediction = { result: 'unknown_model_type' };
    }
    
    const result = {
      modelId,
      prediction,
      confidence: 0.85 + Math.random() * 0.15,
      explanation,
      timestamp: new Date()
    };
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'ML prediction failed' });
  }
});

// ======================
// HELPER FUNCTIONS
// ======================

function generateMockTimeSeries(timeRange: any) {
  const points = [];
  const now = Date.now();
  const from = timeRange?.from === 'now-1h' ? now - 60 * 60 * 1000 : now - 24 * 60 * 60 * 1000;
  const step = (now - from) / 50;
  
  for (let i = 0; i < 50; i++) {
    points.push([
      Math.random() * 100 + 50 + Math.sin(i / 10) * 20,
      from + i * step
    ]);
  }
  
  return points;
}

function generateMockTableData(count: number) {
  const branches = ['شعبه مرکزی', 'شعبه ولیعصر', 'شعبه آزادی', 'شعبه فردوسی'];
  const rows = [];
  
  for (let i = 0; i < count; i++) {
    rows.push([
      new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      Math.floor(Math.random() * 200) + 10,
      branches[Math.floor(Math.random() * branches.length)]
    ]);
  }
  
  return rows;
}

function generateMockLogs(count: number) {
  const levels = ['info', 'warn', 'error', 'debug'];
  const messages = [
    'Transaction processed successfully',
    'Connection timeout to payment gateway',
    'User authentication failed',
    'Cache miss for customer data',
    'Database connection established'
  ];
  
  const logs = [];
  
  for (let i = 0; i < count; i++) {
    logs.push({
      timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      labels: {
        service: Math.random() > 0.5 ? 'pos-service' : 'auth-service',
        instance: `instance-${Math.floor(Math.random() * 3) + 1}`
      }
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}