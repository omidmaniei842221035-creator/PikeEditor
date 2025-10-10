// Network API endpoints for Spider Web Visualization
import { Express } from "express";
import { DatabaseStorage } from "./storage";

export function setupNetworkRoutes(app: Express, storage: DatabaseStorage) {
  // Generate spider web network from business data
  app.get("/api/network/spider-web", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const bankingUnits = await storage.getAllBankingUnits();
      
      // Generate network nodes and edges
      const nodes: any[] = [];
      const edges: any[] = [];
      
      // Add banking unit nodes
      bankingUnits.forEach(unit => {
        nodes.push({
          id: `banking_unit_${unit.id}`,
          nodeType: 'banking_unit',
          entityId: unit.id,
          label: unit.name,
          value: 0,
          group: 'banking_units',
          color: unit.unitType === 'branch' ? '#3b82f6' : unit.unitType === 'counter' ? '#10b981' : '#f59e0b',
          size: 20,
          properties: {
            unitType: unit.unitType,
            code: unit.code,
            address: unit.address
          }
        });
      });
      
      // Add business type nodes (aggregated)
      const businessTypes = [...new Set(customers.map(c => c.businessType))];
      businessTypes.forEach(businessType => {
        const businessCustomers = customers.filter(c => c.businessType === businessType);
        const totalRevenue = businessCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        
        nodes.push({
          id: `business_type_${businessType}`,
          nodeType: 'business_type',
          entityId: businessType,
          label: businessType,
          value: totalRevenue,
          group: 'business_types',
          color: getBusinessTypeColor(businessType),
          size: Math.max(10, Math.min(50, businessCustomers.length * 2)),
          properties: {
            customerCount: businessCustomers.length,
            avgRevenue: businessCustomers.length > 0 ? totalRevenue / businessCustomers.length : 0
          }
        });
      });
      
      // Add territory nodes if applicable
      try {
        const territories = await storage.getAllTerritories();
        territories.forEach(territory => {
          nodes.push({
            id: `territory_${territory.id}`,
            nodeType: 'territory',
            entityId: territory.id,
            label: territory.name,
            value: 0,
            group: 'territories',
            color: territory.color || '#8b5cf6',
            size: 15,
            properties: {
              businessFocus: territory.businessFocus,
              autoNamed: territory.autoNamed
            }
          });
        });
      } catch (e) {
        console.log("No territories found");
      }
      
      // Create edges between banking units and business types
      bankingUnits.forEach(unit => {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        const unitBusinessTypes = [...new Set(unitCustomers.map(c => c.businessType))];
        
        unitBusinessTypes.forEach(businessType => {
          const typeCustomers = unitCustomers.filter(c => c.businessType === businessType);
          const totalRevenue = typeCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
          
          if (typeCustomers.length > 0) {
            edges.push({
              id: `edge_${unit.id}_${businessType}`,
              sourceNodeId: `banking_unit_${unit.id}`,
              targetNodeId: `business_type_${businessType}`,
              edgeType: 'banking_connection',
              weight: typeCustomers.length / Math.max(unitCustomers.length, 1),
              value: totalRevenue,
              color: '#64748b',
              width: Math.max(1, Math.min(8, typeCustomers.length / 2)),
              properties: {
                customerCount: typeCustomers.length,
                revenue: totalRevenue
              }
            });
          }
        });
      });
      
      res.json({
        nodes,
        edges,
        metadata: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          businessTypeCount: businessTypes.length,
          bankingUnitCount: bankingUnits.length,
          territoryCount: 0
        }
      });
      
    } catch (error) {
      console.error("Network generation error:", error);
      res.status(500).json({ error: "Failed to generate network data" });
    }
  });
  
  // Get network statistics
  app.get("/api/network/statistics", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      const bankingUnits = await storage.getAllBankingUnits();
      const businessTypes = [...new Set(customers.map(c => c.businessType))];
      
      // Calculate network metrics
      const totalConnections = bankingUnits.reduce((sum, unit) => {
        const unitCustomers = customers.filter(c => c.bankingUnitId === unit.id);
        const unitBusinessTypes = [...new Set(unitCustomers.map(c => c.businessType))];
        return sum + unitBusinessTypes.length;
      }, 0);
      
      const avgConnections = bankingUnits.length > 0 ? totalConnections / bankingUnits.length : 0;
      
      // Revenue flow analysis
      const totalRevenue = customers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
      const businessTypeRevenue = businessTypes.map(type => {
        const typeCustomers = customers.filter(c => c.businessType === type);
        const revenue = typeCustomers.reduce((sum, c) => sum + (c.monthlyProfit || 0), 0);
        return {
          businessType: type,
          revenue,
          percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
          customerCount: typeCustomers.length
        };
      }).sort((a, b) => b.revenue - a.revenue);
      
      res.json({
        nodeCount: businessTypes.length + bankingUnits.length,
        edgeCount: totalConnections,
        avgConnections,
        totalRevenue,
        businessTypeDistribution: businessTypeRevenue,
        networkDensity: businessTypes.length > 1 ? (totalConnections / (businessTypes.length * (businessTypes.length - 1))) : 0
      });
      
    } catch (error) {
      console.error("Network statistics error:", error);
      res.status(500).json({ error: "Failed to calculate network statistics" });
    }
  });
}

// Helper function for business type colors
function getBusinessTypeColor(businessType: string): string {
  const colorMap: Record<string, string> = {
    'supermarket': '#ef4444',
    'restaurant': '#f97316',
    'pharmacy': '#84cc16',
    'cafe': '#06b6d4',
    'bakery': '#8b5cf6',
    'clothing': '#ec4899',
    'electronics': '#3b82f6',
    'bookstore': '#64748b',
    'jewelry': '#f59e0b',
    'auto': '#10b981'
  };
  return colorMap[businessType] || '#6b7280';
}