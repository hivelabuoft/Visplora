// Pie Chart Variation Agent - Second layer agent for generating data variations
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse } from './types';

export interface PieChartVariationRequest {
  baseChartSpec: any;
  filterConfig: {
    filterType: string;
    filterKey: string;
    options: Array<{ label: string; value: string; displayName: string }>;
  };
}

export interface PieChartVariationResponse {
  success: boolean;
  dataVariations: Record<string, any[]>;
  error?: string;
}

export class PieChartVariationAgent extends BaseTravelAgent {
  constructor() {
    super('pieVariation', []);
  }

  initializeSampleData(): void {
    // No sample data needed for variation agent
    this.sampleDatasets = [];
  }

  async generateDataVariations(request: PieChartVariationRequest): Promise<PieChartVariationResponse> {
    try {
      const { baseChartSpec, filterConfig } = request;
      const { filterType, options } = filterConfig;

      const prompt = this.buildVariationPrompt(baseChartSpec, filterType, options);
      const llmResponse = await this.callLLM(prompt);
      
      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(llmResponse);
      } catch (parseError) {
        return {
          success: false,
          dataVariations: {},
          error: `Failed to parse LLM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        };
      }

      // Validate the response structure
      if (!parsedResponse.dataVariations || typeof parsedResponse.dataVariations !== 'object') {
        return {
          success: false,
          dataVariations: {},
          error: 'Invalid response structure: missing dataVariations object'
        };
      }

      return {
        success: true,
        dataVariations: parsedResponse.dataVariations
      };

    } catch (error) {
      return {
        success: false,
        dataVariations: {},
        error: `Pie chart variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildVariationPrompt(baseChartSpec: any, filterType: string, options: Array<{ label: string; value: string; displayName: string }>): string {
    const baseData = baseChartSpec.data;
    const chartTitle = baseChartSpec.title;
    const chartDescription = baseChartSpec.description;

    return `
You are a specialized data variation generator for pie charts. Your task is to create realistic data variations based on different filter values while maintaining the same categories and structure.

BASE CHART INFORMATION:
- Title: ${chartTitle}
- Description: ${chartDescription}
- Filter Type: ${filterType}
- Base Data: ${JSON.stringify(baseData, null, 2)}

FILTER OPTIONS TO GENERATE VARIATIONS FOR:
${options.map(opt => `- ${opt.value}: ${opt.displayName}`).join('\n')}

INSTRUCTIONS FOR GENERATING VARIATIONS:

1. MAINTAIN STRUCTURE: All variations must have the same category fields as the base data
2. REALISTIC CHANGES: Adjust values based on the filter type context
3. PERCENTAGE CONSISTENCY: Ensure all percentages add up to 100% for each variation
4. LOGICAL PATTERNS: Values should change in realistic ways based on the filter

FILTER TYPE GUIDELINES:

${this.getFilterTypeGuidelines(filterType)}

REQUIRED OUTPUT FORMAT - RETURN EXACTLY THIS JSON STRUCTURE:
{
  "dataVariations": {
    ${options.map(opt => `"${opt.value}": [
      // Array of data objects with same structure as base data
      // Adjust values realistically for ${opt.displayName}
    ]`).join(',\n    ')}
  }
}

EXAMPLE VARIATION PATTERNS:
- Budget vs Luxury: Budget has higher food/transport %, Luxury has higher accommodation/activities %
- Regions: Different spending patterns based on regional economics and travel styles
- Years: Gradual shifts in travel preferences and cost inflation
- Seasons: Different activity types and cost distributions

GENERATE realistic variations that tell a coherent story about how ${filterType} affects the pie chart distribution.

RETURN ONLY THE JSON OBJECT. NO OTHER TEXT OR EXPLANATION.
`;
  }

  private getFilterTypeGuidelines(filterType: string): string {
    switch (filterType) {
      case 'budget_level':
        return `
FOR BUDGET_LEVEL VARIATIONS:
- Budget: Higher percentages for basic necessities (accommodation at budget level, local food, public transport)
- Mid-range: Balanced distribution across categories
- Luxury: Higher percentages for premium services (luxury accommodation, fine dining, exclusive activities)
`;

      case 'region':
        return `
FOR REGION VARIATIONS:
- North America: Higher transport costs, moderate accommodation
- Europe: Higher cultural activities, moderate overall costs
- Asia: Lower accommodation costs, higher food variety
- South America: Lower overall costs, higher adventure activities
`;

      case 'year':
        return `
FOR YEAR VARIATIONS:
- 2023: Post-pandemic recovery patterns, cautious spending
- 2024: Normalized spending, increased activities
- 2025: Inflation effects, preference shifts toward experiences
`;

      case 'trip_type':
        return `
FOR TRIP_TYPE VARIATIONS:
- Business: Higher accommodation/transport, lower activities/food
- Leisure: Balanced distribution, higher entertainment
- Adventure: Higher activities/equipment, lower accommodation
`;

      case 'season':
        return `
FOR SEASON VARIATIONS:
- Spring/Summer: Higher outdoor activities, accommodation premium
- Fall/Winter: Higher indoor entertainment, lower transport costs
`;

      default:
        return `
FOR ${filterType.toUpperCase()} VARIATIONS:
- Adjust values based on logical patterns for this filter type
- Maintain realistic proportional relationships
- Ensure variations tell a coherent story
`;
    }
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    // This method is required by BaseTravelAgent but not used for variation agent
    throw new Error('PieChartVariationAgent should use generateDataVariations method instead');
  }

  protected generateContextAwareData(category: string, destinations: string[], dataPoints: number): any[] {
    // Not used for variation agent
    return [];
  }
}