// Horizontal Bar with Threshold Agent - Bars with threshold line for target comparisons
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class HorizontalBarWithThresholdAgent extends BaseTravelAgent {
  constructor() {
    super('bar', ['barChartWithThreshold']);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'budget_threshold',
        description: 'Living costs with budget threshold comparison',
        fields: {
          category: 'city (nominal)',
          value: 'livingCost (quantitative)',
          thresholdValue: 'budgetTarget (quantitative)'
        },
        sampleData: [
          { city: 'Lisbon', livingCost: 1800, budgetTarget: 2000 },
          { city: 'Berlin', livingCost: 2200, budgetTarget: 2000 },
          { city: 'Prague', livingCost: 1600, budgetTarget: 2000 }
        ],
        useCases: ['budget targets', 'cost thresholds', 'performance goals']
      },
      {
        type: 'conservation_target',
        description: 'Wildlife density with conservation target threshold',
        fields: {
          category: 'park (nominal)',
          value: 'wildlifeDensity (quantitative)',
          thresholdValue: 'conservationTarget (quantitative)'
        },
        sampleData: [
          { park: 'Serengeti', wildlifeDensity: 45, conservationTarget: 40 },
          { park: 'Kruger', wildlifeDensity: 38, conservationTarget: 40 }
        ],
        useCases: ['conservation goals', 'wildlife targets', 'threshold analysis']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const constraints = request.constraints || {};
      const { nodeSize, dataCategory } = constraints;
      
      // Determine dimensions based on nodeSize
      const dimensions = this.getDimensionsForNodeSize(nodeSize || 'xlarge');
      
      const prompt = this.buildPrompt(request) + `

REQUIRED DIMENSIONS: Use exactly { "width": ${dimensions.width}, "height": ${dimensions.height} } for ${nodeSize} node size.

CRITICAL CONFIG FORMAT REQUIREMENTS:
- Generate SIMPLE field mappings, NOT Vega-Lite encoding objects
- Use the exact template format: fields: { "category": "field_name", "value": "field_name" }

CORRECT CONFIG FORMAT (follow exactly):
{
  "type": "bar",
  "subtype": "barChartWithThreshold",
  "data": [...],
  "config": {
    "dimensions": { "width": ${dimensions.width}, "height": ${dimensions.height} },
    "fields": {
      "category": "city",
      "value": "livingCost", 
      "thresholdValue": "budgetTarget"
    },
    "styling": {
      "colors": ["#45B2E6"],
      "background": "transparent",
      "thresholdColor": "#22c55e",
      "thresholdLabel": "Budget Target",
      "showThresholdLabel": true
    },
    "interactions": { "hover": true }
  }
}
  thresholdStrokeDash: [6, 3],            // Dashed line pattern
  background: '#F8FAFC'
}

FORMAT VALIDATION REQUIREMENTS:
- ONLY use valid Vega-Lite formats: '.0f', ',.0f', '.2s', '.1f', '.2f'
- NEVER use currency symbols in format strings (€,.0f, $,.0f are INVALID)
- For currency: use ',.0f' format and include currency in axis title
- Example: format: ',.0f', title: 'Monthly Cost (EUR)'
- For percentages: use '.0f' format with title: 'Rate (%)'

THRESHOLD LINE REQUIREMENTS:
- Threshold line must have valid mark type: 'rule'
- Include proper stroke, strokeWidth, and strokeDash properties
- Ensure threshold value matches data scale range
- MUST include thresholdColor, thresholdLabel, showThresholdLabel in styling config`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid horizontal bar with threshold chart specification',
          suggestedAlternatives: [
            'Try requesting data with a specific target or threshold',
            'Ask for budget or performance goal analysis',
            'Consider cost or threshold-based comparisons'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated horizontalBarWithThresholdSpec with ${dimensions.width}x${dimensions.height} dimensions for ${nodeSize} node. Bar chart with threshold line comparing ${chartSpec.data.length} categories against target.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Horizontal bar with threshold chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes threshold or target values',
          'Check if you need goal-based analysis',
          'Consider using simple horizontal bar for basic comparisons'
        ]
      };
    }
  }

  private getDimensionsForNodeSize(nodeSize: string): { width: number; height: number } {
    switch (nodeSize) {
      case 'medium':
        return { width: 200, height: 100 };
      case 'xlarge':
        return { width: 450, height: 200 };
      default:
        return { width: 450, height: 200 }; // Default to xlarge
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    const selectedDestinations = destinations.length > 0 ? destinations : 
      TRAVEL_DESTINATIONS.slice(0, dataPoints).map(d => d.city);

    const data: any[] = [];

    selectedDestinations.forEach(dest => {
      let entry: any = { city: dest, destination: dest };

      switch (category) {
        case 'cost':
          entry.livingCost = Math.round(1200 + Math.random() * 1500); // EUR
          entry.budgetTarget = 2000;
          entry.aboveThreshold = entry.livingCost >= 2000;
          break;
          
        case 'wildlife':
          entry.wildlifeDensity = Math.round(20 + Math.random() * 60); // per sq km
          entry.conservationTarget = 40;
          entry.aboveThreshold = entry.wildlifeDensity >= 40;
          break;
          
        default:
          entry.value = Math.round(50 + Math.random() * 100);
          entry.threshold = 75;
          entry.aboveThreshold = entry.value >= 75;
      }

      data.push(entry);
    });

    return data;
  }
}