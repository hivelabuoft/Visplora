// Horizontal Bar Chart Agent - Basic horizontal bars for rankings and comparisons
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class HorizontalBarAgent extends BaseTravelAgent {
  constructor() {
    super('bar', ['horizontalBarSpec']);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'population_rankings',
        description: 'City population rankings for demographic comparisons',
        fields: {
          category: 'city (nominal)',
          value: 'population (quantitative)'
        },
        sampleData: [
          { city: 'Tokyo', population: 38000000 },
          { city: 'Delhi', population: 32000000 },
          { city: 'Shanghai', population: 28000000 }
        ],
        useCases: ['population rankings', 'demographic comparisons', 'city size analysis']
      },
      {
        type: 'recovery_rates',
        description: 'Tourism recovery rates compared to baseline',
        fields: {
          category: 'destination (nominal)',
          value: 'recoveryRate (quantitative)'
        },
        sampleData: [
          { destination: 'Bangkok', recoveryRate: 85 },
          { destination: 'Singapore', recoveryRate: 92 },
          { destination: 'Manila', recoveryRate: 78 }
        ],
        useCases: ['recovery analysis', 'performance comparison', 'progress tracking']
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
- Use the exact template format from working examples
- fields: { "category": "field_name", "value": "field_name" } - SIMPLE strings only
- Do NOT generate full Vega-Lite encoding objects with type, sort, etc.

CORRECT CONFIG FORMAT (follow exactly):
{
  "type": "bar",
  "subtype": "horizontalBarSpec", 
  "data": [...],
  "config": {
    "dimensions": { "width": ${dimensions.width}, "height": ${dimensions.height} },
    "fields": {
      "category": "",        // SIMPLE field name only
      "value": ""      // SIMPLE field name only  
    },
    "styling": {
      "colors": ["#2299dd"],
      "background": "transparent",
      "axes": {
        "xAxis": {
          "labelColor": "#888",
          "titleColor": "#888", 
          "labelFontSize": 8,
          "grid": true,
          "gridColor": "#888",
          "gridDash": [2, 2],
          "title": "Population",  // Example title - adjust as needed
          "format": ",.0f"
        },
        "yAxis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 10,
          "title": null
        }
      }
    },
    "legend": { "show": false },
    "interactions": { "hover": true }
  }
}

FIELD MAPPING EXAMPLES:
- For city population: "category": "city", "value": "population"
- For destination recovery: "category": "destination", "value": "recoveryRate"
- For park wildlife: "category": "park", "value": "wildlifeDensity"

FORMAT VALIDATION:
- ONLY use valid formats: '.0f', ',.0f', '.2s', '.1f', '.2f'
- NEVER use currency symbols in format strings
- For currency: use ',.0f' format and include currency in axis title`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid horizontal bar chart specification',
          suggestedAlternatives: [
            'Try requesting a simple ranking comparison',
            'Ask for single metric analysis',
            'Consider population or performance data'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated horizontalBarSpec with ${dimensions.width}x${dimensions.height} dimensions for ${nodeSize} node. Simple horizontal bar chart comparing ${chartSpec.data.length} categories.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Horizontal bar chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes categorical comparisons',
          'Check if you need simple ranking analysis',
          'Consider using other chart types for complex data'
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
        case 'demographics':
          // Generate realistic population numbers (in actual population, not millions)
          const basePop = Math.random() * 30000000 + 5000000; // 5M to 35M range
          entry.population = Math.round(basePop);
          break;
          
        case 'recovery-analysis':
          entry.recoveryRate = Math.round(70 + Math.random() * 30); // 70-100%
          entry.baseline2019 = 100;
          break;
          
        default:
          entry.value = Math.round(50 + Math.random() * 50);
      }

      data.push(entry);
    });

    return data;
  }
}