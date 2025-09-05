// Main entry point for Travel Agent Simulator
export { TravelAgentManager } from './TravelAgentManager';
export { LineChartAgent } from './LineChartAgent';
export { BarChartAgent } from './BarChartAgent';
export { PieChartAgent } from './PieChartAgent';
export { ScatterChartAgent } from './ScatterChartAgent';
export { MultiTypeChartAgent } from './MultiTypeChartAgent';
export { BaseTravelAgent } from './BaseTravelAgent';
export { generateDemoData, saveDemoData } from './demoGenerator';

export type {
  TravelAgentRequest,
  TravelConstraints,
  TravelChartSpec,
  AgentResponse,
  TravelDataSample
} from './types';

export { CHART_SUBTYPES, TRAVEL_DATA_CATEGORIES } from './types';

// Demo configuration loader
import demoConfig from './demo.json';
import type { TravelAgentRequest } from './types';

export interface DemoRequest {
  name: string;
  request: TravelAgentRequest;
}

export interface DemoConfig {
  demoRequests: DemoRequest[];
}

/**
 * Load demo configuration from JSON file
 */
export function loadDemoConfig(): DemoConfig {
  return demoConfig as DemoConfig;
}

/**
 * Get specific demo request by name
 */
export function getDemoRequest(name: string): DemoRequest | undefined {
  const config = loadDemoConfig();
  return config.demoRequests.find(req => req.name === name);
}

/**
 * Get all demo requests for a specific chart type
 */
export function getDemoRequestsByChartType(chartType: string): DemoRequest[] {
  const config = loadDemoConfig();
  return config.demoRequests.filter(req => 
    req.request.constraints?.chartType === chartType
  );
}

/**
 * Quick Start Usage Example:
 * 
 * ```typescript
 * import { TravelAgentManager } from './travel_agent_simulator';
 * 
 * const agentManager = new TravelAgentManager();
 * 
 * const response = await agentManager.generateTravelChart({
 *   userQuery: "Show me cost trends over time for Tokyo",
 *   constraints: {
 *     dataCategory: 'cost',
 *     destinations: ['Tokyo'],
 *     timeRange: { start: '2024-01', end: '2024-12' }
 *   }
 * });
 * 
 * if (response.success && response.chartSpec) {
 *   // Use the chart spec with SpecCreator
 *   const vegaSpec = SpecCreator.create(response.chartSpec);
 *   // Render with your visualization library
 * }
 * ```
 */