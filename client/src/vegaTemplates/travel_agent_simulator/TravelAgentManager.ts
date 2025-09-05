// Travel Agent Manager - Coordinates all 8 specialized agents
import { LineChartAgent } from './LineChartAgent';
import { HorizontalBarAgent } from './HorizontalBarAgent';
import { DivergingBarAgent } from './DivergingBarAgent';
import { HorizontalBarWithThresholdAgent } from './HorizontalBarWithThresholdAgent';
import { HorizontalBarWithMeanAgent } from './HorizontalBarWithMeanAgent';
import { PieChartAgent } from './PieChartAgent';
import { ScatterChartAgent } from './ScatterChartAgent';
import { MultiTypeChartAgent } from './MultiTypeChartAgent';
import { TravelAgentRequest, AgentResponse, TravelConstraints, TravelDataSample } from './types';
import { BaseTravelAgent } from './BaseTravelAgent';

export class TravelAgentManager {
  private agents: Map<string, BaseTravelAgent>;

  constructor() {
    this.agents = new Map<string, BaseTravelAgent>([
      ['line', new LineChartAgent()],
      ['horizontalBar', new HorizontalBarAgent()],
      ['divergingBar', new DivergingBarAgent()],
      ['barChartWithThreshold', new HorizontalBarWithThresholdAgent()],
      ['barChartWithMean', new HorizontalBarWithMeanAgent()],
      ['pie', new PieChartAgent()],
      ['scatter', new ScatterChartAgent()],
      ['multiType', new MultiTypeChartAgent()]
    ]);
  }

  /**
   * Main entry point for travel chart generation
   */
  async generateTravelChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      // Determine the best chart type based on user query and constraints
      const chartType = this.determineChartType(request);
      
      // Get the appropriate agent
      const agent = this.agents.get(chartType);
      if (!agent) {
        return {
          success: false,
          error: `No agent available for chart type: ${chartType}`,
          suggestedAlternatives: ['line', 'horizontalBar', 'divergingBar', 'barChartWithThreshold', 'barChartWithMean', 'pie', 'scatter', 'multiType']
        };
      }

      // Generate the chart using the specialized agent
      const response = await agent.generateChart(request);
      
      // Add manager metadata
      if (response.success && response.chartSpec) {
        response.chartSpec.metadata = {
          generatedBy: `${chartType}Agent`,
          timestamp: new Date().toISOString(),
          userQuery: request.userQuery,
          constraints: request.constraints
        };
      }

      return response;

    } catch (error) {
      return {
        success: false,
        error: `Travel agent manager error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Try simplifying your request',
          'Specify a chart type preference',
          'Check your data requirements'
        ]
      };
    }
  }

  /**
   * Determine the best chart type based on user request
   */
  private determineChartType(request: TravelAgentRequest): string {
    const query = request.userQuery.toLowerCase();
    const constraints = request.constraints;

    // Explicit chart type constraint takes priority
    if (constraints?.chartType) {
      return constraints.chartType;
    }

    // For bar charts, check subtype to route to specialized agent
    if (constraints?.subtype) {
      // If subtype is specified, return it directly for bar chart variants
      if (['horizontalBar', 'divergingBar', 'barChartWithThreshold', 'barChartWithMean'].includes(constraints.subtype)) {
        return constraints.subtype;
      }
    }

    // Analyze query for chart type indicators
    
    // Multi-type indicators (dual metrics, combined analysis)
    if (this.hasMultiTypeIndicators(query)) {
      return 'multiType';
    }

    // Line chart indicators (trends, over time, timeline)
    if (this.hasLineChartIndicators(query)) {
      return 'line';
    }

    // Pie chart indicators (distribution, breakdown, composition)
    if (this.hasPieChartIndicators(query)) {
      return 'pie';
    }

    // Scatter chart indicators (relationship, correlation, vs)
    if (this.hasScatterChartIndicators(query)) {
      return 'scatter';
    }

    // Bar chart indicators - determine specific subtype
    if (this.hasBarChartIndicators(query)) {
      return this.determineBarChartSubtype(query, constraints);
    }

    // Default fallback based on data category
    const dataCategory = constraints?.dataCategory;
    if (dataCategory === 'cost' && query.includes('time')) return 'line';
    if (dataCategory === 'reviews' && query.includes('distribution')) return 'pie';
    if (dataCategory === 'safety' && query.includes('compare')) return 'horizontalBar';
    if (dataCategory === 'environmental' && query.includes('relationship')) return 'scatter';

    // Ultimate fallback - horizontal bar chart is most versatile
    return 'horizontalBar';
  }

  /**
   * Determine specific bar chart subtype based on query content
   */
  private determineBarChartSubtype(query: string, constraints?: TravelConstraints): string {
    // Threshold indicators
    const thresholdIndicators = [
      'threshold', 'target', 'goal', 'budget', 'limit', 'minimum', 'maximum',
      'above', 'below', 'meets', 'exceeds', 'within budget', 'conservation target'
    ];
    
    // Mean/average indicators
    const meanIndicators = [
      'average', 'mean', 'benchmark', 'typical', 'standard', 'baseline',
      'compared to average', 'vs average', 'above average', 'below average'
    ];
    
    // Diverging/opposing indicators
    const divergingIndicators = [
      'vs', 'versus', 'compared', 'opposing', 'contrast', 'positive and negative',
      'pros and cons', 'benefits and challenges', 'appeal vs', 'quality vs'
    ];

    if (thresholdIndicators.some(indicator => query.includes(indicator))) {
      return 'barChartWithThreshold';
    }
    
    if (meanIndicators.some(indicator => query.includes(indicator))) {
      return 'barChartWithMean';
    }
    
    if (divergingIndicators.some(indicator => query.includes(indicator))) {
      return 'divergingBarSpec';
    }

    // Default to basic horizontal bar
    return 'horizontalBarSpec';
  }

  private hasMultiTypeIndicators(query: string): boolean {
    const indicators = [
      'with occupancy', 'visitors with', 'arrivals and', 'cost and satisfaction',
      'dual metric', 'combined', 'bars with line', 'monthly with', 
      'seasonal patterns', 'capacity vs demand', 'growth with'
    ];
    return indicators.some(indicator => query.includes(indicator));
  }

  private hasLineChartIndicators(query: string): boolean {
    const indicators = [
      'over time', 'timeline', 'trend', 'monthly', 'yearly', 'seasonal',
      'time series', 'evolution', 'progression', 'historical',
      'cost trends', 'safety scores over', 'visitor arrivals by month'
    ];
    return indicators.some(indicator => query.includes(indicator));
  }

  private hasPieChartIndicators(query: string): boolean {
    const indicators = [
      'distribution', 'breakdown', 'composition', 'percentage of',
      'proportion', 'share of', 'split by', 'categories',
      'review ratings', 'expense breakdown', 'safety levels'
    ];
    return indicators.some(indicator => query.includes(indicator));
  }

  private hasScatterChartIndicators(query: string): boolean {
    const indicators = [
      'relationship', 'correlation', 'vs ', ' vs.', 'compared to',
      'against', 'relationship between', 'scatter',
      'cost vs safety', 'environmental quality', 'bubble plot'
    ];
    return indicators.some(indicator => query.includes(indicator));
  }

  private hasBarChartIndicators(query: string): boolean {
    const indicators = [
      'compare', 'comparison', 'ranking', 'by destination', 'by city',
      'by region', 'highest', 'lowest', 'top', 'bottom',
      'across destinations', 'destination comparison', 'city ranking'
    ];
    return indicators.some(indicator => query.includes(indicator));
  }

  /**
   * Get available chart types
   */
  getAvailableChartTypes(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent information for a specific chart type
   */
  getAgentInfo(chartType: string): any {
    const agent = this.agents.get(chartType);
    if (!agent) return null;

    return {
      chartType: agent.chartType,
      availableSubtypes: agent.availableSubtypes,
      sampleDatasets: agent.sampleDatasets.map((ds: TravelDataSample) => ({
        type: ds.type,
        description: ds.description,
        useCases: ds.useCases
      }))
    };
  }

  /**
   * Helper method to suggest chart types based on query analysis
   */
  suggestChartTypes(query: string): string[] {
    const suggestions: string[] = [];
    
    if (this.hasLineChartIndicators(query)) suggestions.push('line');
    if (this.hasBarChartIndicators(query)) suggestions.push('bar');
    if (this.hasPieChartIndicators(query)) suggestions.push('pie');
    if (this.hasScatterChartIndicators(query)) suggestions.push('scatter');
    if (this.hasMultiTypeIndicators(query)) suggestions.push('multiType');
    
    // Always include at least one suggestion
    if (suggestions.length === 0) {
      suggestions.push('bar'); // Most versatile fallback
    }
    
    return suggestions;
  }

  /**
   * Validate that the system is properly initialized
   */
  validateSystem(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check all agents are initialized
    const expectedAgents = ['line', 'horizontalBar', 'divergingBar', 'barChartWithThreshold', 'barChartWithMean', 'pie', 'scatter', 'multiType'];
    for (const agentType of expectedAgents) {
      if (!this.agents.has(agentType)) {
        errors.push(`Missing agent for chart type: ${agentType}`);
      }
    }

    // Check OpenAI API key availability
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      errors.push('OPENAI_API_KEY environment variable not set or empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}