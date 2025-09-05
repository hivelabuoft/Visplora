// Diverging Bar Chart Agent - For comparing two opposing metrics
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class DivergingBarAgent extends BaseTravelAgent {
  constructor() {
    super('bar', ['divergingBarSpec']);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'environmental_comparison',
        description: 'Environmental quality comparison with opposing metrics',
        fields: {
          category: 'city (nominal)',
          positiveField: 'airQuality (quantitative)',
          negativeField: 'greenSpace (quantitative)'
        },
        sampleData: [
          { city: 'Vancouver', airQuality: 78, greenSpace: 45 },
          { city: 'São Paulo', airQuality: 52, greenSpace: 28 }
        ],
        useCases: ['quality vs challenges', 'benefits vs risks', 'dual metric analysis']
      },
      {
        type: 'tourism_appeal_challenges',
        description: 'Tourism appeal versus accessibility challenges',
        fields: {
          category: 'destination (nominal)',
          positiveField: 'winterAppeal (quantitative)',
          negativeField: 'accessibilityChallenges (quantitative)'
        },
        sampleData: [
          { destination: 'Tromsø', winterAppeal: 85, accessibilityChallenges: 65 },
          { destination: 'Reykjavik', winterAppeal: 78, accessibilityChallenges: 45 }
        ],
        useCases: ['appeal vs challenges', 'positive vs negative factors', 'trade-off analysis']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const constraints = request.constraints || {};
      const { nodeSize, dataCategory, destinations, maxDataPoints } = constraints;
      
      // Determine dimensions based on nodeSize
      const dimensions = this.getDimensionsForNodeSize(nodeSize || 'xlarge');
      
      // Generate context-aware data for the prompt
      const sampleData = this.generateContextAwareData(
        dataCategory || 'environmental', 
        destinations, 
        maxDataPoints || 7
      );
      
      const prompt = this.buildPrompt(request) + `

REQUIRED DIMENSIONS: Use exactly { "width": ${dimensions.width}, "height": ${dimensions.height} } for ${nodeSize} node size.

Generate a diverging bar chart for: ${request.userQuery}

CRITICAL CONFIG FORMAT REQUIREMENTS:
- Generate SIMPLE field mappings, NOT Vega-Lite encoding objects
- Use the exact template format: fields: { "category": "field_name", "value": "field_name" }
- Do NOT generate full Vega-Lite encoding objects with type, sort, etc.

CORRECT CONFIG FORMAT (follow exactly):
{
  "type": "bar",
  "subtype": "divergingBarSpec",
  "data": [...],
  "config": {
    "dimensions": { "width": ${dimensions.width}, "height": ${dimensions.height} },
    "fields": {
      "category": "city",
      "value": "airQuality",
      "positiveLabel": "Air Quality Index",
      "negativeLabel": "Green Space Index"
    },
    "styling": {
      "colors": ["#4CB944", "#1CA9A6"],
      "background": "transparent"
    },
    "interactions": { "hover": true }
  }
}

TRAINING EXAMPLE (EXACT FORMAT TO FOLLOW):
Data format should match this working pattern:
[
  {
    "region": "North America",
    "crimeIndex": 40,
    "politicalRisk": 15,
    "overallSafety": 73,
    "crimeIndex_positive": 40,
    "crimeIndex_negative": 15
  },
  {
    "region": "Southern Europe", 
    "crimeIndex": 37,
    "politicalRisk": 20,
    "overallSafety": 75,
    "crimeIndex_positive": 37,
    "crimeIndex_negative": 20
  }
]

Field mapping should match:
fields: {
  category: 'region',
  value: 'crimeIndex', 
  positiveLabel: 'Crime Risk',
  negativeLabel: 'Political Risk'
}

CRITICAL FIELD NAME VALIDATION:
Data context: ${JSON.stringify(sampleData.slice(0, 3))}

MANDATORY: You MUST use the EXACT field names from the data context above. 
For category "${dataCategory}", the available fields are:
${Object.keys(sampleData[0] || {}).map(key => `- ${key}`).join('\n')}

VEGA-LITE TRANSFORM REQUIREMENTS:
1. In the "transform" section, use ONLY the field names that exist in the data
2. For 'environmental' category: Use "datum.airQuality_positive" and "datum.airQuality_negative" 
3. For 'seasonal-tourism' category: Use "datum.winterAppeal_positive" and "datum.winterAppeal_negative"
4. NEVER use "datum.positiveValue" or "datum.negativeValue" - these fields DO NOT EXIST
5. The fold transform must reference the fields created in the calculate transforms

EXAMPLE CORRECT TRANSFORM for environmental data:
"transform": [
  {
    "calculate": "datum.airQuality_positive",
    "as": "airQuality_positive_value"
  },
  {
    "calculate": "-datum.airQuality_negative",
    "as": "airQuality_negative_value"
  }
],
"fold": ["airQuality_positive_value", "airQuality_negative_value"]

FIELD VALIDATION CHECKLIST:
✅ All field names in transforms exist in the data
✅ Calculate transforms use actual data field names
✅ Fold references the "as" fields from calculate transforms
✅ Color scale domain matches the riskLabel values
✅ Tooltip fields reference actual data fields
✅ Format strings use valid Vega-Lite patterns only

FORMAT VALIDATION REQUIREMENTS:
- ONLY use valid Vega-Lite formats: '.0f', ',.0f', '.2s', '.1f', '.2f'
- NEVER use currency symbols in format strings (€,.0f, $,.0f are INVALID)
- For currency: use ',.0f' format and include currency in axis title
- For scores/indices: use '.0f' or '.1f' format
- Example: format: '.0f', title: 'Air Quality Index'

Node dimensions: ${JSON.stringify(dimensions)}

CRITICAL REQUIREMENTS:
1. DATA must include BOTH base fields (airQuality, greenSpace) AND transformed fields (airQuality_positive, airQuality_negative)
2. VEGA-LITE transforms must use field names that actually exist in the data
3. Use opposing metrics that make sense for diverging comparison
4. Include category field (region, city, destination) for grouping
5. Validate all field references before generating the spec

Generate the complete vegaSpec with proper diverging bar encoding.
SUBTYPE: divergingBarSpec
NODE SIZE: ${nodeSize}
DIMENSIONS: width: ${dimensions.width}, height: ${dimensions.height}

RESPOND with valid JSON chart specification following the exact divergingBarSpec pattern shown in the training example.`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid diverging bar chart specification',
          suggestedAlternatives: [
            'Try requesting comparison of two opposing factors',
            'Ask for benefits vs challenges analysis',
            'Consider positive vs negative metric comparison'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated divergingBarSpec with ${dimensions.width}x${dimensions.height} dimensions for ${nodeSize} node. Diverging bar chart comparing two opposing metrics for ${chartSpec.data.length} categories.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Diverging bar chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes two opposing metrics',
          'Check if you need positive vs negative comparison',
          'Consider using horizontal bar for single metrics'
        ]
      };
    }
  }

  private getDimensionsForNodeSize(nodeSize: string): { width: number; height: number } {
    switch (nodeSize) {
      case 'medium':
        return { width: 200, height: 100 };
      case 'xlarge':
        return { width: 450, height: 155 };
      default:
        return { width: 450, height: 155 }; // Default to xlarge
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    const selectedDestinations = destinations.length > 0 ? destinations : 
      TRAVEL_DESTINATIONS.slice(0, dataPoints).map(d => d.city);

    const data: any[] = [];

    selectedDestinations.forEach(dest => {
      let entry: any = { city: dest, destination: dest };

      switch (category) {
        case 'environmental':
          // Generate opposing metrics: Air quality vs Green space
          entry.airQuality = Math.round(40 + Math.random() * 50);
          entry.greenSpace = Math.round(15 + Math.random() * 40);
          entry.region = this.getRegionForDestination(dest);
          entry.overallScore = Math.round((entry.airQuality + entry.greenSpace) / 2);
          // Add transformed fields for diverging bar
          entry.airQuality_positive = entry.airQuality;
          entry.airQuality_negative = entry.greenSpace;
          break;
          
        case 'seasonal-tourism':
          // Generate opposing metrics: Winter appeal vs Accessibility challenges
          entry.winterAppeal = Math.round(60 + Math.random() * 30);
          entry.accessibilityChallenges = Math.round(20 + Math.random() * 50);
          entry.destination = dest;
          entry.overallScore = Math.round(entry.winterAppeal - (entry.accessibilityChallenges * 0.5));
          // Add transformed fields for diverging bar
          entry.winterAppeal_positive = entry.winterAppeal;
          entry.winterAppeal_negative = entry.accessibilityChallenges;
          break;
          
        default:
          // Generic opposing metrics
          entry.positiveMetric = Math.round(40 + Math.random() * 50);
          entry.negativeMetric = Math.round(20 + Math.random() * 60);
          entry.region = this.getRegionForDestination(dest);
          entry.overallScore = Math.round(entry.positiveMetric - (entry.negativeMetric * 0.4));
          // Add transformed fields for diverging bar
          entry.positiveMetric_positive = entry.positiveMetric;
          entry.positiveMetric_negative = entry.negativeMetric;
      }

      data.push(entry);
    });

    return data;
  }

  private getRegionForDestination(destination: string): string {
    // Map destinations to regions for context
    const regionMap: { [key: string]: string } = {
      'Vancouver': 'North America',
      'Portland': 'North America',
      'Mexico City': 'North America',
      'São Paulo': 'South America',
      'Buenos Aires': 'South America',
      'Bogotá': 'South America',
      'Quito': 'South America',
      'Tromsø': 'Northern Europe',
      'Reykjavik': 'Northern Europe',
      'Fairbanks': 'North America',
      'Yellowknife': 'North America',
      'Rovaniemi': 'Northern Europe',
      'Murmansk': 'Northern Europe'
    };
    
    return regionMap[destination] || 'Unknown Region';
  }
}