// Types for travel agent simulator

export interface TravelAgentRequest {
  userQuery: string;
  constraints?: TravelConstraints;
}

export interface TravelConstraints {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'multiType' | 'map';
  subtype?: string;
  nodeSize?: 'small' | 'medium' | 'large' | 'xlarge';
  dataCategory?: 'cost' | 'safety' | 'visitor-flow' | 'reviews' | 'environmental' | 'cultural' | 'demographics' | 'recovery-analysis' | 'seasonal-tourism' | 'wildlife' | 'economics' | 'sustainability' | 'geographic';
  timeRange?: { start: string; end: string };
  destinations?: string[];
  selectedCountries?: string[];
  maxDataPoints?: number;
  visualization?: 'comparison' | 'trends' | 'distribution' | 'relationship';
}

export interface TravelChartSpec {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'multiType' | 'map';
  subtype: string;
  data: any[];
  config: {
    dimensions: { width: number; height: number };
    fields: Record<string, string>;
    styling: Record<string, any>;
    legend?: Record<string, any>;
    tooltip?: Record<string, any>;
    interactions?: Record<string, any>;
  };
  title: string;
  description: string;
  insights?: string[];
  metadata?: {
    generatedBy: string;
    timestamp: string;
    userQuery: string;
    constraints?: TravelConstraints;
  };
}

export interface AgentResponse {
  success: boolean;
  chartSpec?: TravelChartSpec;
  explanation?: string;
  error?: string;
  suggestedAlternatives?: string[];
}

export interface TravelDataSample {
  type: string;
  description: string;
  fields: Record<string, string>;
  sampleData: any[];
  useCases: string[];
}

// Available chart subtypes by type
export const CHART_SUBTYPES = {
  line: ['multiLineLabelSpec', 'lineChartWithMean', 'lineChartWithThreshold'],
  bar: ['divergingBarSpec', 'horizontalBarSpec', 'barChartWithMean', 'barChartWithThreshold'],
  pie: ['interactivePieSpec'],
  scatter: ['bubblePlotScatterSpec'],
  multiType: ['barChartWithLineSpec', 'multiTypeWithMean', 'multiTypeWithThreshold', 'multiType_same_y_diff_type'],
  map: ['worldInteractiveMap']
} as const;

export const TRAVEL_DATA_CATEGORIES = {
  cost: 'Travel costs including hotels, meals, transport',
  safety: 'Safety metrics, crime rates, risk assessments',
  'visitor-flow': 'Tourist arrivals, seasonal patterns, occupancy rates',
  reviews: 'Ratings, review distributions, sentiment scores',
  environmental: 'Air quality, green spaces, water quality',
  cultural: 'Diversity metrics, cultural events, language support',
  geographic: 'World map visualizations, country selections, regional data'
} as const;