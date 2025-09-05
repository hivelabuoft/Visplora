// Horizontal Bar Variation Agent - Second-layer agent for generating filter-specific data variations
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelChartSpec } from './types';

// Specific interfaces for horizontal bar variations
export interface HorizontalBarVariationRequest {
  baseChartSpec: TravelChartSpec;
  filterConfig: {
    filterType: string;
    options: Array<{ value: string; label: string; displayName: string }>;
  };
}

export interface HorizontalBarVariationResponse {
  success: boolean;
  dataVariations: Record<string, any[]>;
  error?: string;
}

export class HorizontalBarVariationAgent extends BaseTravelAgent {
  constructor() {
    super('horizontalBarVariation', []);
  }

  initializeSampleData(): void {
    // No sample data needed for variation agent
    this.sampleDatasets = [];
  }

  async generateDataVariations(request: HorizontalBarVariationRequest): Promise<HorizontalBarVariationResponse> {
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
        error: `Horizontal bar variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildVariationPrompt(baseChartSpec: TravelChartSpec, filterType: string, options: Array<{ value: string; label: string; displayName: string }>): string {
    return `Generate data variations for a horizontal bar chart with different filter values.

BASE CHART SPECIFICATION:
${JSON.stringify(baseChartSpec, null, 2)}

FILTER CONFIGURATION:
- Filter Type: ${filterType}
- Available Options: ${JSON.stringify(options)}

REQUIREMENTS:
1. Generate realistic data variations for each filter option
2. Each variation should have the same data structure as the base chart
3. Values should reflect the characteristics of each filter option
4. Maintain logical relationships and realistic ranges
5. Keep the same number of data points as the original

${this.getFilterSpecificInstructions(filterType, options)}

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "dataVariations": {
    "${options[0]?.value}": [/* array of data objects with same structure as base chart */],
    "${options[1]?.value}": [/* array of data objects with same structure as base chart */],
    // ... for each filter option
  }
}

Generate realistic travel data that reflects the characteristics of each filter value.
RESPOND WITH ONLY THE JSON OBJECT, NO EXPLANATIONS.`;
  }

  private getFilterSpecificInstructions(filterType: string, options: Array<{ value: string; label: string; displayName: string }>): string {
    const optionValues = options.map(opt => opt.value).join(', ');
    
    switch (filterType) {
      case 'region':
        return `REGION-SPECIFIC INSTRUCTIONS:
- Generate data reflecting each region's characteristics: ${optionValues}
- Consider economic development, cultural factors, and tourism infrastructure
- Adjust values based on regional travel patterns and market conditions
- Account for currency differences, cost of living, and local preferences`;
      
      case 'year':
        return `YEAR-SPECIFIC INSTRUCTIONS:
- Generate data reflecting temporal changes: ${optionValues}
- Consider historical events, economic conditions, and technology evolution
- Adjust values based on inflation, market development, and travel trends
- Account for infrastructure improvements and industry changes over time`;
      
      case 'budgetLevel':
        return `BUDGET-SPECIFIC INSTRUCTIONS:
- Generate data reflecting spending patterns: ${optionValues}
- Adjust destinations, services, and experiences based on budget constraints
- Consider different market segments and their preferences
- Account for value propositions and service levels for each budget tier`;
      
      case 'tripType':
        return `TRIP-TYPE-SPECIFIC INSTRUCTIONS:
- Generate data reflecting travel purpose: ${optionValues}
- Adjust durations, destinations, and activities based on trip type
- Consider different traveler needs and expectations
- Account for seasonal patterns and booking behaviors for each trip type`;
      
      case 'season':
        return `SEASON-SPECIFIC INSTRUCTIONS:
- Generate data reflecting seasonal variations: ${optionValues}
- Adjust for weather patterns, demand fluctuations, and pricing
- Consider seasonal activities and destination popularity
- Account for peak/off-peak dynamics and capacity constraints`;
      
      default:
        return `GENERAL INSTRUCTIONS:
- Generate data variations for: ${optionValues}
- Ensure each variation logically reflects its filter value
- Maintain realistic relationships between data fields
- Keep values within reasonable ranges for travel/tourism context`;
    }
  }

  // Standard generateChart method (not used but required by interface)
  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    return {
      success: false,
      error: 'HorizontalBarVariationAgent only supports generateDataVariations method',
      suggestedAlternatives: ['Use generateDataVariations method instead']
    };
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 5): any[] {
    // Not used in variation agent
    return [];
  }
}