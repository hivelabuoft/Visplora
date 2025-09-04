// Line Chart Agent - Specialized for line chart generation
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelDataSample, CHART_SUBTYPES } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class LineChartAgent extends BaseTravelAgent {
  constructor() {
    super('line', [...CHART_SUBTYPES.line]);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'cost_timeline',
        description: 'Monthly travel costs over time with multiple expense categories',
        fields: {
          x: 'date (temporal)',
          y: 'cost (quantitative)', 
          series: 'category (nominal)'
        },
        sampleData: [
          { date: '2024-01-01', cost: 180, category: 'Hotel Cost' },
          { date: '2024-01-01', cost: 45, category: 'Meal Cost' },
          { date: '2024-02-01', cost: 195, category: 'Hotel Cost' },
          { date: '2024-02-01', cost: 48, category: 'Meal Cost' }
        ],
        useCases: ['cost trends', 'expense tracking', 'budget comparison', 'seasonal analysis']
      },
      {
        type: 'visitor_arrivals',
        description: 'Tourist arrival trends by month showing seasonal patterns',
        fields: {
          x: 'month (temporal)',
          y: 'arrivals (quantitative)',
          series: 'destination (nominal)'
        },
        sampleData: [
          { month: 'Jan', arrivals: 125000, destination: 'Tokyo' },
          { month: 'Jan', arrivals: 98000, destination: 'Bangkok' },
          { month: 'Feb', arrivals: 135000, destination: 'Tokyo' },
          { month: 'Feb', arrivals: 102000, destination: 'Bangkok' }
        ],
        useCases: ['seasonal trends', 'destination comparison', 'tourism growth', 'capacity planning']
      },
      {
        type: 'safety_scores',
        description: 'Safety score evolution over time for travel destinations',
        fields: {
          x: 'year (temporal)',
          y: 'safetyScore (quantitative)',
          series: 'city (nominal)'
        },
        sampleData: [
          { year: '2020', safetyScore: 78, city: 'Singapore' },
          { year: '2020', safetyScore: 65, city: 'Bangkok' },
          { year: '2021', safetyScore: 82, city: 'Singapore' },
          { year: '2021', safetyScore: 68, city: 'Bangkok' }
        ],
        useCases: ['safety monitoring', 'risk assessment trends', 'comparative analysis']
      },
      {
        type: 'review_scores',
        description: 'Average review scores over time showing destination reputation',
        fields: {
          x: 'quarter (temporal)',
          y: 'avgRating (quantitative)',
          series: 'platform (nominal)'
        },
        sampleData: [
          { quarter: '2024-Q1', avgRating: 4.3, platform: 'Google Reviews' },
          { quarter: '2024-Q1', avgRating: 4.1, platform: 'TripAdvisor' },
          { quarter: '2024-Q2', avgRating: 4.4, platform: 'Google Reviews' },
          { quarter: '2024-Q2', avgRating: 4.2, platform: 'TripAdvisor' }
        ],
        useCases: ['reputation tracking', 'platform comparison', 'satisfaction trends']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(request) + `

SPECIALIZED INSTRUCTIONS FOR LINE CHARTS:

1. SUBTYPE SELECTION GUIDE:
   - multiLineLabelSpec: Standard multi-line chart with hover labels (MOST COMMON)
   - lineChartWithMean: When user wants to show average/mean line (use styling.meanValue, meanColor)
   - lineChartWithThreshold: When user wants threshold/target line (use styling.thresholdValue, thresholdColor)

2. FIELD REQUIREMENTS:
   - x: Must be temporal (date, month, year, quarter) or ordinal
   - y: Must be quantitative (cost, count, score, rating)
   - series: Must be nominal for grouping lines (category, destination, platform)

3. STYLING MUST INCLUDE:
   - colors: Array of 3-4 colors for different lines
   - axes.xAxis: { format: "%Y-%m", labelAngle: -45, grid: false }
   - axes.yAxis: { format: "appropriate format", grid: true, gridDash: [2,2] }

4. FOR MEAN/THRESHOLD LINES:
   - meanValue: number (calculated from data)
   - meanColor: "#ff0000" 
   - meanStrokeWidth: 2
   - meanStrokeDash: [5,5]
   - meanLabel: "Average: {value}"
   - showMeanLabel: true

5. EXAMPLE TRAVEL SCENARIOS:
   - "cost trends over time" → multiLineLabelSpec
   - "show average cost" → lineChartWithMean 
   - "highlight budget threshold" → lineChartWithThreshold
   - "visitor arrivals by month" → multiLineLabelSpec
   - "safety scores with target" → lineChartWithThreshold

GENERATE realistic travel data with proper temporal progression and meaningful values.`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid line chart specification',
          suggestedAlternatives: [
            'Try requesting a specific time series analysis',
            'Consider specifying cost, visitor, or safety data',
            'Ask for a simpler trend comparison'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated ${chartSpec.subtype} showing ${chartSpec.description}. This line chart displays trends over time with ${chartSpec.data.length} data points across multiple series.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Line chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes time-based data',
          'Check if you need trend analysis',
          'Consider using bar charts for categorical comparisons'
        ]
      };
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    const selectedDestinations = destinations.length > 0 ? destinations : 
      TRAVEL_DESTINATIONS.slice(0, 3).map(d => d.city);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const data: any[] = [];

    selectedDestinations.forEach(dest => {
      months.slice(0, dataPoints).forEach((month, idx) => {
        let value = 0;
        let field = '';
        
        switch (category) {
          case 'cost':
            value = 100 + Math.random() * 100 + idx * 5;
            field = 'cost';
            break;
          case 'visitor-flow':
            value = Math.round((50000 + Math.random() * 50000) * (1 + Math.sin(idx) * 0.3));
            field = 'arrivals';
            break;
          case 'safety':
            value = Math.round(60 + Math.random() * 30 + idx * 2);
            field = 'safetyScore';
            break;
          default:
            value = Math.round(50 + Math.random() * 50);
            field = 'value';
        }

        data.push({
          month,
          [field]: value,
          destination: dest,
          date: `2024-${String(idx + 1).padStart(2, '0')}-01`
        });
      });
    });

    return data;
  }
}