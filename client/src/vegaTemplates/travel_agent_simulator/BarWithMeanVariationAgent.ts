// Horizontal Bar with Mean Variation Agent - Second-layer agent for generating filter-specific data variations
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelChartSpec } from './types';

// Specific interfaces for bar with mean variations
export interface BarWithMeanVariationRequest {
  baseChartSpec: TravelChartSpec;
  filterConfig: {
    filterType: string;
    options: Array<{ value: string; label: string; displayName: string }>;
  };
}

export interface BarWithMeanVariationResponse {
  success: boolean;
  dataVariations: Record<string, any[]>;
  error?: string;
}

export class BarWithMeanVariationAgent extends BaseTravelAgent {
  constructor() {
    super('barWithMeanVariation', []);
  }

  initializeSampleData(): void {
    // No sample data needed for variation agent
    this.sampleDatasets = [];
  }

  async generateDataVariations(request: BarWithMeanVariationRequest): Promise<BarWithMeanVariationResponse> {
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
        error: `Bar with mean variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildVariationPrompt(baseChartSpec: TravelChartSpec, filterType: string, options: Array<{ value: string; label: string; displayName: string }>): string {
    return `Generate data variations for a horizontal bar chart WITH MEAN LINE with different filter values.

BASE CHART SPECIFICATION:
${JSON.stringify(baseChartSpec, null, 2)}

FILTER CONFIGURATION:
- Filter Type: ${filterType}
- Available Options: ${JSON.stringify(options)}

REQUIREMENTS:
1. Generate realistic data variations for each filter option
2. Each variation should have the same data structure as the base chart
3. IMPORTANT: Include mean/average values for each data point (this is a bar chart with mean line)
4. Values should reflect the characteristics of each filter option
5. Maintain logical relationships and realistic ranges
6. Keep the same number of data points as the original
7. Recalculate mean values appropriately for each filter context

${this.getFilterSpecificInstructions(filterType, options)}

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "dataVariations": {
    "${options[0]?.value}": [/* array of data objects with same structure as base chart, including mean fields */],
    "${options[1]?.value}": [/* array of data objects with same structure as base chart, including mean fields */],
    // ... for each filter option
  }
}

CRITICAL: Ensure each data object includes the mean/average field that the original chart uses for the mean line.
Generate realistic travel data that reflects the characteristics of each filter value.
RESPOND WITH ONLY THE JSON OBJECT, NO EXPLANATIONS.`;
  }

  private getFilterSpecificInstructions(filterType: string, options: Array<{ value: string; label: string; displayName: string }>): string {
    const optionValues = options.map(opt => opt.value).join(', ');
    
    switch (filterType) {
      case 'region':
        return `REGION-SPECIFIC INSTRUCTIONS:
- Generate data reflecting each region's characteristics: ${optionValues}
- Adjust mean values based on regional benchmarks and standards
- Consider economic development levels affecting both individual values and averages
- Account for regional tourism infrastructure and market maturity
- Ensure mean lines reflect realistic regional baselines`;
      
      case 'year':
        return `YEAR-SPECIFIC INSTRUCTIONS:
- Generate data reflecting temporal changes: ${optionValues}
- Adjust mean values to show historical progression and trends
- Consider how global averages change over time due to market evolution
- Account for technological improvements and industry standardization
- Ensure mean lines reflect period-appropriate benchmarks`;
      
      case 'budgetLevel':
        return `BUDGET-SPECIFIC INSTRUCTIONS:
- Generate data reflecting spending patterns: ${optionValues}
- Adjust mean values to represent different market segment averages
- Consider how benchmarks vary across budget tiers
- Account for value expectations and service standards per budget level
- Ensure mean lines reflect appropriate segment baselines`;
      
      case 'tripType':
        return `TRIP-TYPE-SPECIFIC INSTRUCTIONS:
- Generate data reflecting travel purpose: ${optionValues}
- Adjust mean values based on typical patterns for each trip type
- Consider how averages differ between business, leisure, adventure travel
- Account for industry standards and expectations per trip category
- Ensure mean lines reflect purpose-specific benchmarks`;
      
      case 'season':
        return `SEASON-SPECIFIC INSTRUCTIONS:
- Generate data reflecting seasonal variations: ${optionValues}
- Adjust mean values to show seasonal industry averages
- Consider how benchmarks fluctuate with demand cycles
- Account for seasonal capacity and pricing standards
- Ensure mean lines reflect season-appropriate baselines`;
      
      default:
        return `GENERAL INSTRUCTIONS:
- Generate data variations for: ${optionValues}
- Ensure mean values logically reflect each filter context
- Maintain realistic relationships between individual values and averages
- Keep both individual and mean values within reasonable travel/tourism ranges`;
    }
  }

  // Standard generateChart method (not used but required by interface)
  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    return {
      success: false,
      error: 'BarWithMeanVariationAgent only supports generateDataVariations method',
      suggestedAlternatives: ['Use generateDataVariations method instead']
    };
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 5): any[] {
    // Not used in variation agent
    return [];
  }
}