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
          { month: '2024-01', arrivals: 125000, destination: 'Tokyo' },
          { month: '2024-01', arrivals: 98000, destination: 'Bangkok' },
          { month: '2024-02', arrivals: 135000, destination: 'Tokyo' },
          { month: '2024-02', arrivals: 102000, destination: 'Bangkok' }
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
   - lineChartWithMean: When user wants to show average/mean line
   - lineChartWithThreshold: When user wants threshold/target line

2. REQUIRED OUTPUT FORMAT - RETURN EXACTLY THIS STRUCTURE:
{
  "type": "line",
  "subtype": "multiLineLabelSpec", // OR "lineChartWithMean" OR "lineChartWithThreshold"
  "title": "Your Chart Title",
  "description": "Brief description of the chart",
  "data": [
    // Your generated data array here
  ],
  "config": {
    "dimensions": { "width": 380, "height": 200 },
    "fields": { 
      "x": "your_x_field_name", 
      "y": "your_y_field_name", 
      "series": "your_series_field_name"
    },
    "styling": {
      "colors": ["#aea630ff", "#3b82f6", "#16a34a"] <you may change the colors>,
      "background": "transparent",
      "axes": {
        "xAxis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 8,
          "labelAngle": -45,
          "grid": false,
          "ticks": true,
          "domain": true,
          "title": null,
          "format": "%Y-%m"
        },
        "yAxis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 8,
          "gridColor": "#888",
          "gridDash": [2, 2],
          "grid": true,
          "ticks": true,
          "domain": true,
          "title": null,
          "format": "$,.0f"
        }
      }
    },
    "legend": {
      "title": null,
      "labelFontSize": 10,
      "symbolSize": 80,
      "orient": "right",
      "padding": 10,
      "offset": 0,
      "symbolType": "circle"
    },
    "interactions": {
      "labels": true
    }
  }
}

3. WHAT YOU CAN MODIFY:
   - title: Change to match your chart content
   - description: Brief explanation of what the chart shows
   - data: Generate realistic travel data with proper field names
   - config.fields: Update x, y, series to match your generated data field names
   - config.styling.colors: Choose appropriate colors for your data series
   - config.styling.axes.yAxis.format: Match the data type (e.g., "$,.0f" for costs, ",.0f" for counts)
   - config.styling.axes.xAxis.format: Match temporal format ("%Y-%m" for dates, null for ordinal)

4. WHAT YOU CANNOT MODIFY:
   - type: Must always be "line"
   - config.dimensions: Fixed at 380x200
   - config.styling.background: Must be "transparent"
   - config.styling.axes structure: Keep all axis properties exactly as shown
   - config.legend structure: Keep all legend properties exactly as shown
   - config.interactions: Keep exactly as shown

5. FOR MEAN SUBTYPE (lineChartWithMean), ADD TO styling:
{
  "meanValue": 50000,
  "meanColor": "#22c55e"", 
  "meanLabel": "Monthly Average",
  "showMeanLabel": true
}

6. FOR THRESHOLD SUBTYPE (lineChartWithThreshold), ADD TO styling:
{
  "thresholdValue": 85,
  "thresholdColor": "#ff6b6b",
  "thresholdLabel": "Target KPI", 
  "showThresholdLabel": true
}

7. DATA FIELD REQUIREMENTS:
   - x: Must be temporal (date, month, year, quarter) or ordinal
   - y: Must be quantitative (cost, count, score, rating, arrivals)
   - series: Must be nominal for grouping lines (category, destination, platform, city)

8. CRITICAL: TEMPORAL DATA FORMATS - ONLY USE THESE:
   - Dates: "2024-01-01", "2024-02-01", "2024-03-01" (YYYY-MM-DD format)
   - Year-Month: "2024-01", "2024-02", "2024-03" (YYYY-MM format)  
   - Years: 2024, 2025, 2026 (numeric years)
   - Quarters: "2024-Q1", "2024-Q2", "2024-Q3" (YYYY-QN format)
   
   NEVER USE: "Jan", "Feb", "Mar", "January", "February" or month names
   ALWAYS USE: Proper date formats that Vega can parse as temporal data
   
   ⚠️  WARNING: Using month names like "Jan" will cause "infinite extent" errors!
   ⚠️  ALL temporal data must be in ISO date format or numeric values!

9. X-AXIS FORMAT RULES:
   - If using dates (YYYY-MM-DD): set format: "%Y-%m" and type: "temporal"
   - If using year-month (YYYY-MM): set format: "%Y-%m" and type: "temporal"
   - If using years (2024): set format: "%Y" and type: "temporal"
   - If using quarters (2024-Q1): set format: null and type: "temporal"

10. EXAMPLE TRAVEL SCENARIOS:
   - "cost trends over time" → multiLineLabelSpec with x: "date" (use "2024-01-01" format), y: "cost", series: "category"
   - "visitor arrivals by destination" → multiLineLabelSpec with x: "month" (use "2024-01" format), y: "arrivals", series: "destination"
   - "safety scores with average" → lineChartWithMean with x: "year" (use 2024 format), meanValue calculated from data
   - "budget tracking with target" → lineChartWithThreshold with thresholdValue as budget limit

REMEMBER: All temporal data must be parseable by Vega. Use proper date formats, never month names!

GENERATE realistic travel data with proper temporal progression and meaningful values.
REMEMBER: Replace the field names in config.fields with the actual field names from your generated data.`;

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

    // Use proper temporal formats instead of month names
    const dates = Array.from({length: 12}, (_, i) => `2024-${String(i + 1).padStart(2, '0')}-01`);
    const data: any[] = [];

    selectedDestinations.forEach(dest => {
      dates.slice(0, dataPoints).forEach((date, idx) => {
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
          date,          // Use proper date format YYYY-MM-DD
          month: date.substring(0, 7), // Extract YYYY-MM format if needed
          [field]: value,
          destination: dest
        });
      });
    });

    return data;
  }
}