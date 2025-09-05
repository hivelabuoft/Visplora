// Pie Chart Agent - Specialized for pie chart generation
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelDataSample, CHART_SUBTYPES } from './types';

export class PieChartAgent extends BaseTravelAgent {
  constructor() {
    super('pie', [...CHART_SUBTYPES.pie]);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'review_distribution',
        description: 'Distribution of review ratings showing customer satisfaction',
        fields: {
          category: 'rating (nominal)',
          value: 'count (quantitative)'
        },
        sampleData: [
          { rating: '5 Stars', count: 12500, percentage: 45.2 },
          { rating: '4 Stars', count: 8700, percentage: 31.4 },
          { rating: '3 Stars', count: 4200, percentage: 15.2 },
          { rating: '2 Stars', count: 1800, percentage: 6.5 },
          { rating: '1 Star', count: 450, percentage: 1.7 }
        ],
        useCases: ['satisfaction analysis', 'rating breakdown', 'quality assessment']
      },
      {
        type: 'expense_breakdown',
        description: 'Travel expense distribution by category',
        fields: {
          category: 'expenseType (nominal)',
          value: 'amount (quantitative)'
        },
        sampleData: [
          { expenseType: 'Accommodation', amount: 1200, percentage: 48.0 },
          { expenseType: 'Food & Dining', amount: 600, percentage: 24.0 },
          { expenseType: 'Transportation', amount: 400, percentage: 16.0 },
          { expenseType: 'Activities', amount: 200, percentage: 8.0 },
          { expenseType: 'Shopping', amount: 100, percentage: 4.0 }
        ],
        useCases: ['budget allocation', 'expense analysis', 'cost optimization']
      },
      {
        type: 'safety_breakdown',
        description: 'Safety level distribution in destination areas',
        fields: {
          category: 'safetyLevel (nominal)',
          value: 'areas (quantitative)'
        },
        sampleData: [
          { safetyLevel: 'Very Safe', areas: 45, percentage: 45.0 },
          { safetyLevel: 'Safe', areas: 32, percentage: 32.0 },
          { safetyLevel: 'Moderate', areas: 15, percentage: 15.0 },
          { safetyLevel: 'Caution', areas: 6, percentage: 6.0 },
          { safetyLevel: 'High Risk', areas: 2, percentage: 2.0 }
        ],
        useCases: ['risk assessment', 'area safety overview', 'travel planning']
      },
      {
        type: 'visitor_origin',
        description: 'Tourist origin distribution by region',
        fields: {
          category: 'region (nominal)',
          value: 'visitors (quantitative)'
        },
        sampleData: [
          { region: 'Asia Pacific', visitors: 450000, percentage: 35.0 },
          { region: 'Europe', visitors: 380000, percentage: 29.5 },
          { region: 'North America', visitors: 260000, percentage: 20.2 },
          { region: 'Middle East', visitors: 130000, percentage: 10.1 },
          { region: 'Others', visitors: 67000, percentage: 5.2 }
        ],
        useCases: ['market analysis', 'tourist demographics', 'regional patterns']
      },
      {
        type: 'cultural_diversity',
        description: 'Cultural diversity metrics breakdown',
        fields: {
          category: 'metric (nominal)',
          value: 'score (quantitative)'
        },
        sampleData: [
          { metric: 'Cuisine Variety', score: 85, percentage: 22.4 },
          { metric: 'Language Support', score: 78, percentage: 20.5 },
          { metric: 'Cultural Events', score: 72, percentage: 18.9 },
          { metric: 'LGBTQ+ Friendly', score: 92, percentage: 24.2 },
          { metric: 'Religious Diversity', score: 53, percentage: 14.0 }
        ],
        useCases: ['diversity assessment', 'cultural analysis', 'inclusivity metrics']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(request) + `

SPECIALIZED INSTRUCTIONS FOR PIE CHARTS:

1. SUBTYPE SELECTION:
   - interactivePieSpec: Interactive donut/pie chart with hover effects (ONLY AVAILABLE OPTION)

2. REQUIRED OUTPUT FORMAT - RETURN EXACTLY THIS STRUCTURE:
{
  "type": "pie",
  "subtype": "interactivePieSpec",
  "title": "Your Chart Title",
  "description": "Brief description of the chart",
  "data": [
    // Your generated data array here
  ],
  "config": {
    "dimensions": { "width": 150, "height": 150 },
    "fields": {
      "category": "your_category_field_name",
      "value": "your_value_field_name"
    },
    "styling": {
      "colors": ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B"],
      "background": "transparent"
    },
    "legend": {
      "title": "Your Legend Title",
      "orient": "right",
      "titleColor": "#888",
      "labelColor": "#888",
      "titleFontSize": 11,
      "labelFontSize": 10,
      "symbolSize": 200,
      "offset": 30,
      "padding": 0,
      "symbolType": "circle"
    },
    "interactions": {
      "hover": true
    }
  }
}

3. WHAT YOU CAN MODIFY:
   - title: Change to match your chart content
   - description: Brief explanation of what the chart shows
   - data: Generate realistic travel data with proper field names
   - config.fields.category: Update to match your generated data category field name
   - config.fields.value: Update to match your generated data value field name
   - config.styling.colors: Choose appropriate colors for your data categories (4-6 colors)
   - config.legend.title: Update to describe what the legend represents

4. WHAT YOU CANNOT MODIFY:
   - type: Must always be "pie"
   - subtype: Must always be "interactivePieSpec"
   - config.dimensions: Fixed at 120x120
   - config.styling.background: Must be "transparent"
   - config.legend structure: Keep all legend properties exactly as shown (orient, titleColor, labelColor, etc.)
   - config.interactions: Keep exactly as shown

5. FIELD REQUIREMENTS:
   - category: Must be nominal (rating, type, level, region, category, metric)
   - value: Must be quantitative (count, amount, score, visitors, areas)

6. DATA REQUIREMENTS:
   - 4-6 categories for optimal visual balance
   - Include percentage field for reference (calculated from values)
   - Ensure values sum to meaningful total
   - Each data item should have both category and value fields

7. COLOR SELECTION GUIDE:
   - Use 4-6 distinct, accessible colors
   - Default palette: ["#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#F59E0B"]
   - For ratings: Use green-to-red gradient
   - For categories: Use diverse, contrasting colors

8. EXAMPLE TRAVEL SCENARIOS:
   - "review rating breakdown" → fields: {category: "rating", value: "count"}
   - "expense distribution" → fields: {category: "expenseType", value: "amount"}
   - "safety level distribution" → fields: {category: "safetyLevel", value: "areas"}
   - "visitor origin analysis" → fields: {category: "region", value: "visitors"}
   - "cultural diversity metrics" → fields: {category: "metric", value: "score"}

9. PERCENTAGE CALCULATION:
   Calculate percentage = (value / total) * 100 for each category

REMEMBER: Update the field names in config.fields to match the actual field names from your generated data.
GENERATE realistic travel data with 4-6 meaningful categories and proper percentages.`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid pie chart specification',
          suggestedAlternatives: [
            'Try requesting a distribution analysis',
            'Ask for breakdown or composition data',
            'Consider categorical proportions like ratings or expenses'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated ${chartSpec.subtype} showing ${chartSpec.description}. This pie chart displays the distribution across ${chartSpec.data.length} categories with interactive hover effects.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Pie chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes categorical distributions',
          'Check if you need proportion or breakdown analysis',
          'Consider using bar charts for detailed comparisons'
        ]
      };
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 5): any[] {
    const data: any[] = [];
    
    switch (category) {
      case 'reviews':
        const reviewCategories = ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
        const reviewCounts = [12500, 8700, 4200, 1800, 450];
        const total = reviewCounts.reduce((a, b) => a + b, 0);
        
        reviewCategories.forEach((rating, idx) => {
          data.push({
            rating,
            count: reviewCounts[idx],
            percentage: Math.round((reviewCounts[idx] / total) * 1000) / 10
          });
        });
        break;

      case 'cost':
        const expenseTypes = ['Accommodation', 'Food & Dining', 'Transportation', 'Activities', 'Shopping'];
        const expenseAmounts = [1200, 600, 400, 200, 100];
        const expenseTotal = expenseAmounts.reduce((a, b) => a + b, 0);
        
        expenseTypes.forEach((type, idx) => {
          data.push({
            expenseType: type,
            amount: expenseAmounts[idx],
            percentage: Math.round((expenseAmounts[idx] / expenseTotal) * 1000) / 10
          });
        });
        break;

      case 'safety':
        const safetyLevels = ['Very Safe', 'Safe', 'Moderate', 'Caution', 'High Risk'];
        const areaCounts = [45, 32, 15, 6, 2];
        const safetyTotal = areaCounts.reduce((a, b) => a + b, 0);
        
        safetyLevels.forEach((level, idx) => {
          data.push({
            safetyLevel: level,
            areas: areaCounts[idx],
            percentage: Math.round((areaCounts[idx] / safetyTotal) * 1000) / 10
          });
        });
        break;

      case 'cultural':
        const metrics = ['Cuisine Variety', 'Language Support', 'Cultural Events', 'LGBTQ+ Friendly', 'Religious Diversity'];
        const scores = [85, 78, 72, 92, 53];
        const scoresTotal = scores.reduce((a, b) => a + b, 0);
        
        metrics.forEach((metric, idx) => {
          data.push({
            metric,
            score: scores[idx],
            percentage: Math.round((scores[idx] / scoresTotal) * 1000) / 10
          });
        });
        break;

      default:
        // Generic categorical data
        const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
        const values = [40, 30, 15, 10, 5];
        const genericTotal = values.reduce((a, b) => a + b, 0);
        
        categories.forEach((cat, idx) => {
          data.push({
            category: cat,
            value: values[idx],
            percentage: Math.round((values[idx] / genericTotal) * 1000) / 10
          });
        });
    }

    return data.slice(0, dataPoints);
  }
}