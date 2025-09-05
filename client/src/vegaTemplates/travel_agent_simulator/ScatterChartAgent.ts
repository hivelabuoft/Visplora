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

1. CHART TYPE: scatter, SUBTYPE: bubblePlotScatterSpec (ONLY AVAILABLE OPTION)

2. REQUIRED OUTPUT FORMAT - RETURN EXACTLY THIS STRUCTURE:
{
  "type": "scatter",
  "subtype": "bubblePlotScatterSpec",
  "title": "Your Chart Title",
  "description": "Brief description of the chart",
  "data": [
    // Your generated data array here
  ],
  "config": {
    "dimensions": { "width": 360, "height": 200 },
    "fields": {
      "x": "your_x_field_name",
      "y": "your_y_field_name", 
      "size": "your_size_field_name",
      "color": "your_color_field_name"
    },
    "styling": {
      "colors": ["redyellowgreen", "reverse"], // <you may change this>
      "background": "transparent",
      "sizeDomain": [40, 100], // <you may change this range>
      "axes": {
        "xAxis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 8,
          "titleFontSize": 10,
          "grid": true,
          "gridColor": "#888",
          "gridDash": [4, 10],
          "ticks": true,
          "domain": true,
          "title": "Your X Axis Title", // <you may change this>
          "scale": { "domain": [0, 100], "nice": true } // <you may change domain>
        },
        "yAxis": {
          "labelColor": "#888",
          "titleColor": "#888",
          "labelFontSize": 8,
          "titleFontSize": 10,
          "grid": false,
          "gridColor": "#888",
          "gridDash": [4, 50],
          "ticks": true,
          "domain": true,
          "title": "Your Y Axis Title", // <you may change this>
          "scale": { "domain": [0, 100], "nice": true } // <you may change domain>
        }
      }
    },
    "legend": {
      "showSize": true,
      "sizeTitle": "Your Size Legend Title", // <you may change this>
      "showColor": true,
      "colorTitle": "Your Color Legend Title", // <you may change this>
      "titleColor": "#888",
      "labelColor": "#888",
      "titleFontSize": 9,
      "labelFontSize": 8,
      "orient": "right",
      "colorOrient": "top",
      "offset": 15,
      "colorOffset": 0
    },
    "sizeLegend": {
      "sizeTitle": "Your Size Legend Title", // <you may change this>
      "titleColor": "#888",
      "labelColor": "#888",
      "titleFontSize": 9,
      "labelFontSize": 8,
      "orient": "right",
      "values": [40, 60, 80, 100], // <you may change these values>
      "offset": 15
    },
    "colorLegend": {
      "colorTitle": "Your Color Legend Title", // <you may change this>
      "titleColor": "#888",
      "labelColor": "#888",
      "titleFontSize": 9,
      "labelFontSize": 8,
      "colorOrient": "top",
      "colorOffset": 0
    },
    "tooltip": {
      "fields": [
        { "field": "city", "type": "nominal", "title": "City" },
        { "field": "your_x_field", "type": "quantitative", "title": "Your X Title", "format": ".0f" },
        { "field": "your_y_field", "type": "quantitative", "title": "Your Y Title", "format": ".0f" },
        { "field": "your_size_field", "type": "quantitative", "title": "Your Size Title", "format": ".0f" },
        { "field": "your_color_field", "type": "quantitative", "title": "Your Color Title", "format": ".0f" }
      ]
    },
    "interactions": {
      "hover": true,
      "select": true
    }
  }
}

3. CRITICAL: DIMENSIONS ARE FIXED - DO NOT CHANGE:
- dimensions MUST be exactly { "width": 360, "height": 200 }
- Do NOT modify width or height values under any circumstances

4. FIELD REQUIREMENTS:
- x: Must be quantitative (cost, rating, score, percentage)
- y: Must be quantitative (score, visitors, quality, satisfaction) 
- size: Must be quantitative (visitors, reviewCount, spend, population)
- color: Can be quantitative (index, aqi, score) or nominal (region, category)

4. DATA CATEGORIES FOR REALISTIC SCENARIOS:
- "cost": avgCost(x), safetyScore(y), visitors(size), region(color)
- "environmental": greenSpacePct(x), waterQuality(y), overallScore(size), aqi(color)
- "reviews": avgRating(x), visitors(y), reviewCount(size), costIndex(color)
- "accessibility": visaFreeAccess(x), satisfactionScore(y), touristSpend(size), developmentIndex(color)

5. STYLING GUIDELINES:
- For quantitative color: use color schemes like ["redyellowgreen", "reverse"]
- For nominal color: use distinct color arrays like ["#8B5CF6", "#3B82F6", "#06B6D4"]
- sizeDomain should match your actual data range
- Axis domains should reflect realistic data ranges with nice: true

CRITICAL REMINDER: dimensions MUST be exactly { "width": 360, "height": 200 } - DO NOT CHANGE!

RETURN ONLY THE JSON OBJECT. NO OTHER TEXT OR EXPLANATION.`;

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