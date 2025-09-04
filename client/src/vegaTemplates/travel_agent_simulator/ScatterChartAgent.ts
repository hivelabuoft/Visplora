// Scatter Chart Agent - Specialized for scatter chart generation
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelDataSample, CHART_SUBTYPES } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class ScatterChartAgent extends BaseTravelAgent {
  constructor() {
    super('scatter', [...CHART_SUBTYPES.scatter]);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'cost_vs_safety',
        description: 'Relationship between travel costs and safety scores across destinations',
        fields: {
          x: 'avgCost (quantitative)',
          y: 'safetyScore (quantitative)',
          size: 'visitors (quantitative)',
          color: 'region (nominal)'
        },
        sampleData: [
          { avgCost: 185, safetyScore: 85, visitors: 15000000, region: 'East Asia', city: 'Tokyo' },
          { avgCost: 75, safetyScore: 68, visitors: 12000000, region: 'Southeast Asia', city: 'Bangkok' },
          { avgCost: 220, safetyScore: 72, visitors: 13000000, region: 'North America', city: 'New York' },
          { avgCost: 165, safetyScore: 78, visitors: 18000000, region: 'Western Europe', city: 'Paris' }
        ],
        useCases: ['cost-safety analysis', 'destination positioning', 'value assessment', 'risk-reward mapping']
      },
      {
        type: 'environmental_quality',
        description: 'Environmental quality metrics showing air quality vs green space coverage',
        fields: {
          x: 'greenSpacePct (quantitative)',
          y: 'waterQuality (quantitative)', 
          size: 'overallScore (quantitative)',
          color: 'aqi (quantitative)'
        },
        sampleData: [
          { greenSpacePct: 47, waterQuality: 95, overallScore: 85, aqi: 15, city: 'Singapore' },
          { greenSpacePct: 24, waterQuality: 89, overallScore: 78, aqi: 22, city: 'Tokyo' },
          { greenSpacePct: 22, waterQuality: 76, overallScore: 65, aqi: 42, city: 'Bangkok' },
          { greenSpacePct: 35, waterQuality: 84, overallScore: 74, aqi: 26, city: 'Barcelona' }
        ],
        useCases: ['environmental assessment', 'livability analysis', 'sustainability comparison', 'quality correlation']
      },
      {
        type: 'reviews_vs_popularity',
        description: 'Relationship between review ratings and visitor popularity',
        fields: {
          x: 'avgRating (quantitative)',
          y: 'visitors (quantitative)',
          size: 'reviewCount (quantitative)',
          color: 'costIndex (quantitative)'
        },
        sampleData: [
          { avgRating: 4.6, visitors: 15000000, reviewCount: 45000, costIndex: 85, city: 'Tokyo' },
          { avgRating: 4.3, visitors: 18000000, reviewCount: 52000, costIndex: 92, city: 'Paris' },
          { avgRating: 4.4, visitors: 12000000, reviewCount: 38000, costIndex: 45, city: 'Bangkok' },
          { avgRating: 4.2, visitors: 13000000, reviewCount: 48000, costIndex: 115, city: 'New York' }
        ],
        useCases: ['reputation analysis', 'popularity correlation', 'review quality assessment', 'market positioning']
      },
      {
        type: 'accessibility_vs_satisfaction',
        description: 'Visa accessibility compared to tourist satisfaction scores',
        fields: {
          x: 'visaFreeAccess (quantitative)',
          y: 'satisfactionScore (quantitative)',
          size: 'touristSpend (quantitative)',
          color: 'developmentIndex (quantitative)'
        },
        sampleData: [
          { visaFreeAccess: 85, satisfactionScore: 4.6, touristSpend: 2500, developmentIndex: 0.92, city: 'Singapore' },
          { visaFreeAccess: 67, satisfactionScore: 4.3, touristSpend: 3200, developmentIndex: 0.88, city: 'Tokyo' },
          { visaFreeAccess: 45, satisfactionScore: 4.1, touristSpend: 1800, developmentIndex: 0.76, city: 'Bangkok' },
          { visaFreeAccess: 72, satisfactionScore: 4.4, touristSpend: 2800, developmentIndex: 0.89, city: 'Sydney' }
        ],
        useCases: ['accessibility analysis', 'satisfaction correlation', 'policy impact assessment', 'tourism efficiency']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(request) + `

SPECIALIZED INSTRUCTIONS FOR SCATTER CHARTS:

1. SUBTYPE SELECTION:
   - bubblePlotScatterSpec: Bubble plot scatter with size and color encoding (ONLY AVAILABLE OPTION)

2. FIELD REQUIREMENTS:
   - x: Must be quantitative (cost, rating, score, percentage)
   - y: Must be quantitative (score, visitors, quality, satisfaction)
   - size: Must be quantitative (visitors, reviewCount, spend, population)
   - color: Can be quantitative (index, aqi, score) or nominal (region, category)

3. STYLING MUST INCLUDE:
   - colors: For quantitative color → ['redyellowgreen', 'reverse'] or color scheme name
   - colors: For nominal color → Array of distinct colors
   - sizeDomain: [min, max] range for size encoding (e.g., [40, 100])
   - axes.xAxis: Proper scale configuration with domain and nice: true
   - axes.yAxis: Proper scale configuration with domain and nice: true

4. LEGEND CONFIGURATION:
   - showSize: true
   - sizeTitle: "Descriptive title for size"
   - showColor: true  
   - colorTitle: "Descriptive title for color"
   - orient: 'right'
   - colorOrient: 'top' (for color legend)

5. TOOLTIP CONFIGURATION:
   - fields: Array of field definitions with proper titles and formats
   - Include all 4 encoded fields (x, y, size, color) plus city/identifier

6. AXIS SCALING:
   - Always include scale domains with nice: true
   - Use meaningful ranges based on data
   - Format appropriately (percentages, currency, decimals)

7. EXAMPLE TRAVEL SCENARIOS:
   - "cost vs safety relationship" → cost(x), safety(y), visitors(size), region(color)
   - "environmental quality analysis" → greenSpace(x), waterQuality(y), overall(size), aqi(color)
   - "popularity vs satisfaction" → rating(x), visitors(y), reviews(size), cost(color)
   - "accessibility impact" → visaAccess(x), satisfaction(y), spend(size), development(color)

8. SIZE RANGE:
   - Use sizeRange: [200, 800] for bubble sizes
   - Ensure sizeDomain reflects actual data range

GENERATE realistic travel data showing meaningful relationships between variables.`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid scatter chart specification',
          suggestedAlternatives: [
            'Try requesting a relationship analysis',
            'Ask for correlation between two metrics',
            'Consider cost vs quality or safety vs popularity comparisons'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated ${chartSpec.subtype} showing ${chartSpec.description}. This scatter plot reveals relationships between multiple variables across ${chartSpec.data.length} destinations with size and color encoding.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Scatter chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes relationship analysis',
          'Check if you need correlation or comparison data',
          'Consider using bar charts for simple comparisons'
        ]
      };
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    const selectedDestinations = destinations.length > 0 ? destinations : 
      TRAVEL_DESTINATIONS.slice(0, dataPoints).map(d => d.city);

    const data: any[] = [];

    selectedDestinations.forEach(city => {
      const destination = TRAVEL_DESTINATIONS.find(d => d.city === city);
      let dataPoint: any = { city };

      switch (category) {
        case 'cost':
          dataPoint = {
            ...dataPoint,
            avgCost: Math.round(50 + Math.random() * 150),
            safetyScore: Math.round(60 + Math.random() * 35),
            visitors: Math.round(5000000 + Math.random() * 15000000),
            region: destination?.region || 'Unknown'
          };
          break;

        case 'environmental':
          dataPoint = {
            ...dataPoint,
            greenSpacePct: Math.round(15 + Math.random() * 45),
            waterQuality: Math.round(70 + Math.random() * 25),
            overallScore: Math.round(40 + Math.random() * 50),
            aqi: Math.round(12 + Math.random() * 40)
          };
          break;

        case 'reviews':
          dataPoint = {
            ...dataPoint,
            avgRating: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
            visitors: Math.round(3000000 + Math.random() * 20000000),
            reviewCount: Math.round(15000 + Math.random() * 50000),
            costIndex: Math.round(40 + Math.random() * 80)
          };
          break;

        case 'accessibility':
          dataPoint = {
            ...dataPoint,
            visaFreeAccess: Math.round(30 + Math.random() * 60),
            satisfactionScore: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
            touristSpend: Math.round(1200 + Math.random() * 2500),
            developmentIndex: Math.round((0.65 + Math.random() * 0.30) * 100) / 100
          };
          break;

        default:
          dataPoint = {
            ...dataPoint,
            x: Math.round(Math.random() * 100),
            y: Math.round(Math.random() * 100),
            size: Math.round(50 + Math.random() * 50),
            color: Math.round(Math.random() * 100)
          };
      }

      data.push(dataPoint);
    });

    return data;
  }
}