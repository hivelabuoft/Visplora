// Horizontal Bar with Mean Agent - Bars with mean average line for benchmark comparison
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class HorizontalBarWithMeanAgent extends BaseTravelAgent {
  constructor() {
    super('bar', ['barChartWithMean']);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'tourism_gdp_benchmark',
        description: 'Tourism GDP percentage with global average benchmark',
        fields: {
          category: 'country (nominal)',
          value: 'tourismGDP (quantitative)',
          meanValue: 'globalAverage (quantitative)'
        },
        sampleData: [
          { country: 'Maldives', tourismGDP: 45.2, globalAverage: 28.5 },
          { country: 'Seychelles', tourismGDP: 38.7, globalAverage: 28.5 },
          { country: 'Malta', tourismGDP: 31.4, globalAverage: 28.5 }
        ],
        useCases: ['average benchmarks', 'performance against mean', 'relative comparison']
      },
      {
        type: 'water_efficiency_benchmark',
        description: 'Water consumption efficiency with regional mean comparison',
        fields: {
          category: 'city (nominal)',
          value: 'waterEfficiency (quantitative)',
          meanValue: 'regionalMean (quantitative)'
        },
        sampleData: [
          { city: 'Las Vegas', waterEfficiency: 68, regionalMean: 75.2 },
          { city: 'Dubai', waterEfficiency: 82, regionalMean: 75.2 }
        ],
        useCases: ['efficiency benchmarks', 'regional comparisons', 'mean analysis']
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
  "subtype": "barChartWithMean",
  "data": [...],
  "config": {
    "dimensions": { "width": ${dimensions.width}, "height": ${dimensions.height} },
    "fields": {
      "category": "country",
      "value": "tourismGDP",
      "meanValue": "globalAverage"
    },
    "styling": {
      "colors": ["#3b82f6"],
      "background": "transparent",
      "meanColor": "#16a34a",
      "meanLabel": "Global Average",
      "showMeanLabel": true
    },
    "interactions": { "hover": true }
  }
}
  background: '#f8fafc'
}

FORMAT VALIDATION REQUIREMENTS:
- ONLY use valid Vega-Lite formats: '.0f', ',.0f', '.2s', '.1f', '.2f'
- NEVER use currency symbols in format strings (€,.0f, $,.0f are INVALID)
- For currency: use ',.0f' format and include currency in axis title
- Example: format: ',.0f', title: 'GDP (USD billions)'
- For percentages: use '.1f' format with title: 'Tourism Dependence (%)'

MEAN LINE REQUIREMENTS:
- Mean line must have valid mark type: 'rule'
- Include proper stroke, strokeWidth, and strokeDash properties
- Calculate mean from actual data values
- Ensure mean value is within data range
- MUST include meanColor, meanLabel, showMeanLabel in styling config

DATA GENERATION for destinations: ${JSON.stringify(constraints.destinations || [])}
Category: ${dataCategory}
Dimensions: width: ${dimensions.width}, height: ${dimensions.height}`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid horizontal bar with mean chart specification',
          suggestedAlternatives: [
            'Try requesting data that can be compared to an average',
            'Ask for benchmark or relative performance analysis',
            'Consider percentage or efficiency-based comparisons'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated horizontalBarWithMeanSpec with ${dimensions.width}x${dimensions.height} dimensions for ${nodeSize} node. Bar chart with mean line comparing ${chartSpec.data.length} categories against average.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Horizontal bar with mean chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes data suitable for average comparison',
          'Check if you need benchmark analysis',
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
      let entry: any = { city: dest, destination: dest, country: dest };

      switch (category) {
        case 'economics':
          entry.tourismGDP = Math.round((15 + Math.random() * 40) * 10) / 10; // %
          entry.globalAverage = 28.5;
          break;
          
        case 'sustainability':
          entry.waterEfficiency = Math.round((60 + Math.random() * 35) * 10) / 10; // %
          entry.regionalMean = 75.2;
          break;
          
        default:
          entry.value = Math.round((50 + Math.random() * 50) * 10) / 10;
          entry.average = 62.5;
      }

      data.push(entry);
    });

    return data;
  }
}