// Bar Chart Agent - Specialized for bar chart generation
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelDataSample, CHART_SUBTYPES } from './types';
import { TRAVEL_DESTINATIONS, REGIONS } from '../../app/travel/travelDataUtils';

export class BarChartAgent extends BaseTravelAgent {
  constructor() {
    super('bar', [...CHART_SUBTYPES.bar]);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'destination_costs',
        description: 'Travel costs comparison across different destinations',
        fields: {
          category: 'destination (nominal)',
          value: 'avgCost (quantitative)'
        },
        sampleData: [
          { destination: 'Tokyo', avgCost: 185 },
          { destination: 'Paris', avgCost: 165 },
          { destination: 'Bangkok', avgCost: 75 },
          { destination: 'New York', avgCost: 220 }
        ],
        useCases: ['cost comparison', 'destination ranking', 'budget planning']
      },
      {
        type: 'visitor_growth',
        description: 'Annual visitor growth rates by destination',
        fields: {
          category: 'city (nominal)',
          value: 'visitors (quantitative)',
          growth: 'growthRate (quantitative)'
        },
        sampleData: [
          { city: 'Dubai', visitors: 14200000, growthRate: 15.2 },
          { city: 'Singapore', visitors: 11900000, growthRate: 9.8 },
          { city: 'Tokyo', visitors: 15200000, growthRate: 12.5 },
          { city: 'Barcelona', visitors: 10800000, growthRate: 7.9 }
        ],
        useCases: ['tourism growth', 'performance ranking', 'market analysis']
      },
      {
        type: 'safety_comparison',
        description: 'Safety risk comparison showing crime vs political risk by region',
        fields: {
          category: 'region (nominal)',
          crimeIndex: 'crime risk (quantitative)',
          politicalRisk: 'political risk (quantitative)'
        },
        sampleData: [
          { region: 'Western Europe', crimeIndex: 32, politicalRisk: 18 },
          { region: 'Southeast Asia', crimeIndex: 45, politicalRisk: 35 },
          { region: 'North America', crimeIndex: 38, politicalRisk: 15 },
          { region: 'Middle East', crimeIndex: 28, politicalRisk: 42 }
        ],
        useCases: ['risk assessment', 'safety comparison', 'regional analysis']
      },
      {
        type: 'environmental_quality',
        description: 'Environmental quality scores across cities',
        fields: {
          category: 'city (nominal)',
          value: 'environmentScore (quantitative)'
        },
        sampleData: [
          { city: 'Singapore', environmentScore: 85 },
          { city: 'Sydney', environmentScore: 82 },
          { city: 'Tokyo', environmentScore: 78 },
          { city: 'Bangkok', environmentScore: 65 }
        ],
        useCases: ['environmental ranking', 'sustainability assessment', 'livability comparison']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(request) + `

SPECIALIZED INSTRUCTIONS FOR BAR CHARTS:

1. SUBTYPE SELECTION GUIDE:
   - horizontalBarSpec: Standard horizontal bars (MOST COMMON for rankings/comparisons)
   - divergingBarSpec: For showing positive/negative or two opposing metrics
   - barChartWithMean: When showing average line across bars (use styling.meanValue)
   - barChartWithThreshold: When showing target/threshold line (use styling.thresholdValue)

2. FIELD REQUIREMENTS:
   - category: Must be nominal (destination, city, region, country)
   - value: Must be quantitative (cost, visitors, score, rating)
   - For diverging: positiveValue and negativeValue (or use field_positive, field_negative)

3. STYLING MUST INCLUDE:
   - colors: Array of colors (single color for standard, two colors for diverging)
   - axes.xAxis: { format: "appropriate format", grid: true, gridDash: [2,2] }
   - axes.yAxis: { labelFontSize: 10, title: null }

4. FOR DIVERGING BARS:
   - Transform data to include positive/negative fields
   - Use two contrasting colors: ['#ef4444', '#f59e0b'] 
   - Set positiveLabel and negativeLabel in fields

5. FOR MEAN/THRESHOLD LINES:
   - meanValue: number (calculate average from data)
   - meanColor: "#16a34a"
   - meanStrokeWidth: 2
   - meanStrokeDash: [5,5]
   - meanLabel: "Average: {value}"

6. EXAMPLE TRAVEL SCENARIOS:
   - "compare costs across cities" → horizontalBarSpec
   - "crime vs political risk" → divergingBarSpec
   - "visitor numbers with average" → barChartWithMean
   - "safety scores vs target" → barChartWithThreshold
   - "environmental rankings" → horizontalBarSpec

GENERATE realistic travel data with proper destination names and meaningful values.`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid bar chart specification',
          suggestedAlternatives: [
            'Try requesting a destination comparison',
            'Ask for ranking or categorical analysis',
            'Consider specifying cost, safety, or visitor data'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated ${chartSpec.subtype} showing ${chartSpec.description}. This bar chart compares ${chartSpec.data.length} categories with ${chartSpec.subtype.includes('diverging') ? 'dual metric' : 'single metric'} visualization.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Bar chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes categorical comparisons',
          'Check if you need ranking analysis',
          'Consider using line charts for time-based data'
        ]
      };
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    const selectedDestinations = destinations.length > 0 ? destinations : 
      TRAVEL_DESTINATIONS.slice(0, dataPoints).map(d => d.city);

    const data: any[] = [];

    selectedDestinations.forEach(dest => {
      let value = 0;
      let additionalFields = {};

      switch (category) {
        case 'cost':
          value = Math.round(50 + Math.random() * 150);
          additionalFields = { avgCost: value };
          break;
        case 'safety':
          const crimeRisk = Math.round(15 + Math.random() * 40);
          const politicalRisk = Math.round(10 + Math.random() * 45);
          value = Math.round(100 - (crimeRisk + politicalRisk) / 2);
          additionalFields = { 
            safetyScore: value,
            crimeIndex: crimeRisk,
            politicalRisk: politicalRisk,
            crimeIndex_positive: crimeRisk,
            crimeIndex_negative: politicalRisk
          };
          break;
        case 'visitor-flow':
          value = Math.round(1000000 + Math.random() * 10000000);
          additionalFields = { visitors: value, growthRate: Math.round(Math.random() * 20) };
          break;
        case 'environmental':
          value = Math.round(40 + Math.random() * 50);
          additionalFields = { environmentScore: value };
          break;
        default:
          value = Math.round(50 + Math.random() * 50);
      }

      data.push({
        destination: dest,
        city: dest,
        value,
        ...additionalFields
      });
    });

    return data;
  }
}