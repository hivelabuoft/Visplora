// Horizontal Bar with Threshold Variation Agent - Second-layer agent for generating filter-specific data variations
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelChartSpec } from './types';

// Specific interfaces for bar with threshold variations
export interface BarWithThresholdVariationRequest {
  baseChartSpec: TravelChartSpec;
  filterConfig: {
    filterType: string;
    options: Array<{ value: string; label: string; displayName: string }>;
  };
}

export interface BarWithThresholdVariationResponse {
  success: boolean;
  dataVariations: Record<string, any[]>;
  error?: string;
}

export class BarWithThresholdVariationAgent extends BaseTravelAgent {
  constructor() {
    super('barWithThresholdVariation', []);
  }

  initializeSampleData(): void {
    // No sample data needed for variation agent
    this.sampleDatasets = [];
  }

  async generateDataVariations(request: BarWithThresholdVariationRequest): Promise<BarWithThresholdVariationResponse> {
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
        error: `Bar with threshold variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildVariationPrompt(baseChartSpec: TravelChartSpec, filterType: string, options: Array<{ value: string; label: string; displayName: string }>): string {
    return `Generate data variations for a horizontal bar chart WITH THRESHOLD LINE with different filter values.

BASE CHART SPECIFICATION:
${JSON.stringify(baseChartSpec, null, 2)}

FILTER CONFIGURATION:
- Filter Type: ${filterType}
- Available Options: ${JSON.stringify(options)}

REQUIREMENTS:
1. Generate realistic data variations for each filter option
2. Each variation should have the same data structure as the base chart
3. IMPORTANT: Include threshold values for each data point (this is a bar chart with threshold line)
4. Values should reflect the characteristics of each filter option
5. Maintain logical relationships and realistic ranges
6. Keep the same number of data points as the original
7. Adjust threshold values appropriately for each filter context (targets/goals may vary)

${this.getFilterSpecificInstructions(filterType, options)}

RESPONSE FORMAT:
Return a JSON object with this exact structure:
{
  "dataVariations": {
    "${options[0]?.value}": [/* array of data objects with same structure as base chart, including threshold fields */],
    "${options[1]?.value}": [/* array of data objects with same structure as base chart, including threshold fields */],
    // ... for each filter option
  }
}

CRITICAL: Ensure each data object includes the threshold field that the original chart uses for the threshold line.
Generate realistic travel data that reflects the characteristics of each filter value.
RESPOND WITH ONLY THE JSON OBJECT, NO EXPLANATIONS.`;
  }

  private getFilterSpecificInstructions(filterType: string, options: Array<{ value: string; label: string; displayName: string }>): string {
    const optionValues = options.map(opt => opt.value).join(', ');
    
    switch (filterType) {
      case 'region':
        return `REGION-SPECIFIC INSTRUCTIONS:
- Generate data reflecting each region's characteristics: ${optionValues}
- Adjust threshold values based on regional targets and standards
- Consider different development goals and regulatory requirements per region
- Account for regional capacity constraints and infrastructure limitations
- Ensure threshold lines reflect realistic regional targets/goals`;
      
      case 'year':
        return `YEAR-SPECIFIC INSTRUCTIONS:
- Generate data reflecting temporal changes: ${optionValues}
- Adjust threshold values to show evolving targets and standards over time
- Consider how industry goals and regulations change historically
- Account for technological capabilities and market maturity affecting targets
- Ensure threshold lines reflect period-appropriate goals/standards`;
      
      case 'budgetLevel':
        return `BUDGET-SPECIFIC INSTRUCTIONS:
- Generate data reflecting spending patterns: ${optionValues}
- Adjust threshold values based on different quality/service standards
- Consider how targets vary across market segments and price points
- Account for value expectations and minimum standards per budget tier
- Ensure threshold lines reflect appropriate segment targets`;
      
      case 'tripType':
        return `TRIP-TYPE-SPECIFIC INSTRUCTIONS:
- Generate data reflecting travel purpose: ${optionValues}
- Adjust threshold values based on different requirements per trip type
- Consider varying standards for business vs leisure vs adventure travel
- Account for industry-specific benchmarks and compliance requirements
- Ensure threshold lines reflect purpose-specific standards/goals`;
      
      case 'season':
        return `SEASON-SPECIFIC INSTRUCTIONS:
- Generate data reflecting seasonal variations: ${optionValues}
- Adjust threshold values to show seasonal targets and capacity limits
- Consider how goals change with demand patterns and operational constraints
- Account for seasonal resource availability and service standards
- Ensure threshold lines reflect season-appropriate targets/limits`;
      
      default:
        return `GENERAL INSTRUCTIONS:
- Generate data variations for: ${optionValues}
- Ensure threshold values logically reflect each filter context
- Maintain realistic relationships between actual values and thresholds
- Keep both individual and threshold values within reasonable travel/tourism ranges`;
    }
  }

  // Standard generateChart method (not used but required by interface)
  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    return {
      success: false,
      error: 'BarWithThresholdVariationAgent only supports generateDataVariations method',
      suggestedAlternatives: ['Use generateDataVariations method instead']
    };
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 5): any[] {
    // Not used in variation agent
    return [];
  }
}