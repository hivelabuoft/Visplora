// Multi-Type Chart Agent - Specialized for combined chart generation
import { BaseTravelAgent } from './BaseTravelAgent';
import { TravelAgentRequest, AgentResponse, TravelDataSample, CHART_SUBTYPES } from './types';
import { TRAVEL_DESTINATIONS } from '../../app/travel/travelDataUtils';

export class MultiTypeChartAgent extends BaseTravelAgent {
  constructor() {
    super('multiType', [...CHART_SUBTYPES.multiType]);
  }

  initializeSampleData(): void {
    this.sampleDatasets = [
      {
        type: 'visitor_flow_seasonal',
        description: 'Monthly visitor arrivals (bars) with occupancy rates (line) showing seasonal patterns',
        fields: {
          x: 'monthName (ordinal)',
          y: 'arrivals (quantitative)', // Bar values
          series: 'occupancyRate (quantitative)', // Line values
          color: 'season (nominal)'
        },
        sampleData: [
          { monthName: 'Jan', arrivals: 125000, occupancyRate: 68, season: 'Low' },
          { monthName: 'Feb', arrivals: 135000, occupancyRate: 72, season: 'Low' },
          { monthName: 'Mar', arrivals: 155000, occupancyRate: 78, season: 'Shoulder' },
          { monthName: 'Jun', arrivals: 210000, occupancyRate: 92, season: 'High' }
        ],
        useCases: ['seasonal analysis', 'dual metric visualization', 'capacity vs demand', 'tourism patterns']
      },
      {
        type: 'cost_vs_satisfaction',
        description: 'Monthly costs (bars) with satisfaction ratings (line) correlation analysis',
        fields: {
          x: 'month (ordinal)',
          y: 'avgCost (quantitative)', // Bar values
          series: 'satisfactionScore (quantitative)', // Line values
          color: 'costTier (nominal)'
        },
        sampleData: [
          { month: 'Jan', avgCost: 150, satisfactionScore: 4.2, costTier: 'Low' },
          { month: 'Feb', avgCost: 165, satisfactionScore: 4.3, costTier: 'Medium' },
          { month: 'Mar', avgCost: 180, satisfactionScore: 4.1, costTier: 'Medium' },
          { month: 'Jun', avgCost: 220, satisfactionScore: 3.9, costTier: 'High' }
        ],
        useCases: ['cost-satisfaction relationship', 'pricing strategy', 'value analysis', 'seasonal pricing']
      },
      {
        type: 'safety_improvement',
        description: 'Safety incidents (bars) with improvement index (line) over time',
        fields: {
          x: 'year (ordinal)',
          y: 'incidents (quantitative)', // Bar values
          series: 'improvementIndex (quantitative)', // Line values  
          color: 'severity (nominal)'
        },
        sampleData: [
          { year: '2020', incidents: 45, improvementIndex: 65, severity: 'High' },
          { year: '2021', incidents: 38, improvementIndex: 72, severity: 'Medium' },
          { year: '2022', incidents: 32, improvementIndex: 78, severity: 'Medium' },
          { year: '2023', incidents: 28, improvementIndex: 84, severity: 'Low' }
        ],
        useCases: ['safety monitoring', 'trend analysis', 'improvement tracking', 'policy effectiveness']
      },
      {
        type: 'revenue_growth',
        description: 'Tourism revenue (bars) with growth percentage (line) showing market performance',
        fields: {
          x: 'quarter (ordinal)',
          y: 'revenue (quantitative)', // Bar values
          series: 'growthRate (quantitative)', // Line values
          color: 'performance (nominal)'
        },
        sampleData: [
          { quarter: '2024-Q1', revenue: 2800000, growthRate: 8.5, performance: 'Strong' },
          { quarter: '2024-Q2', revenue: 3200000, growthRate: 12.3, performance: 'Strong' },
          { quarter: '2024-Q3', revenue: 3500000, growthRate: 9.8, performance: 'Strong' },
          { quarter: '2024-Q4', revenue: 3100000, growthRate: 6.2, performance: 'Moderate' }
        ],
        useCases: ['financial analysis', 'growth tracking', 'market performance', 'revenue forecasting']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const prompt = this.buildPrompt(request) + `

SPECIALIZED INSTRUCTIONS FOR MULTI-TYPE CHARTS:

1. SUBTYPE SELECTION GUIDE:
   - barChartWithLineSpec: Bars (left Y) + Line (right Y) - different scales (MOST COMMON)
   - multiType_same_y_diff_type: Bars + Line on same Y scale - same units
   - multiTypeWithMean: Bars + Line + Mean line overlay
   - multiTypeWithThreshold: Bars + Line + Threshold line overlay

2. CRITICAL DIMENSION REQUIREMENTS - DO NOT DEVIATE:
   - barChartWithLineSpec: {"width": 350, "height": 180} (EXACT VALUES)
   - multiTypeWithMean: {"width": 350, "height": 180} (EXACT VALUES)
   - multiTypeWithThreshold: {"width": 350, "height": 180} (EXACT VALUES)  
   - multiType_same_y_diff_type: {"width": 390, "height": 180} (EXACT VALUES)

3. FIELD REQUIREMENTS:
   - x: Must be ordinal (month, quarter, year, category)
   - y: Bar values field (e.g., 'arrivals', 'cost', 'revenue')
   - series: Line values field (e.g., 'occupancyRate', 'satisfactionScore', 'growthRate')
   - color: Must be nominal for bar colors (season, tier, severity, performance)

4. STYLING REQUIREMENTS - COPY EXACT VALUES FROM TEMPLATE:
   - colors: ['#94a3b8', '#3b82f6', '#dc2626'] (EXACT array)
   - lineColor: '#ef4444' (EXACT value)  
   - lineWidth: 3 (EXACT value)
   - cornerRadius: 2 (EXACT value)
   - background: 'transparent' (EXACT value)

5. LEGEND REQUIREMENTS - DO NOT MODIFY:
   - orient: 'right' (EXACT value)
   - titleColor: '#888' (EXACT value)
   - labelColor: '#888' (EXACT value)
   - titleFontSize: 11 (EXACT value)
   - labelFontSize: 10 (EXACT value)
   - symbolSize: 200 (EXACT value)

6. AXES CONFIGURATION - COPY EXACT TEMPLATE STRUCTURE:
   For barChartWithLineSpec/multiTypeWithMean/multiTypeWithThreshold:
   - styling.yAxisLeft: {title: "Bar Metric Name", format: "appropriate_format"}
   - styling.yAxisRight: {title: "Line Metric Name", format: "appropriate_format"}
   - styling.xAxis: {title: "X Axis Label"}
   
   For multiType_same_y_diff_type:
   - styling.axes.yAxis: {title: "Shared Metric Name", format: "appropriate_format"}
   - styling.axes.xAxis: {title: "X Axis Label"}

7. WHAT YOU CAN MODIFY:
   - Chart title (make descriptive, no chart type prefix)
   - Data values and field names
   - Axis titles to match your data
   - Colors within the specified array

8. WHAT YOU MUST NOT MODIFY:
   - Dimensions (use exact values above)
   - lineWidth, cornerRadius, background
   - Legend orient, colors, font sizes
   - Any styling properties not explicitly mentioned as modifiable

9. EXAMPLE TRAVEL SCENARIOS - CHOOSE APPROPRIATE SUBTYPE:
   - "monthly visitors with occupancy" → barChartWithLineSpec (different units: visitors vs %)
   - "cost trends with satisfaction" → barChartWithLineSpec (different units: cost vs rating)
   - "arrivals vs global average" → multiType_same_y_diff_type (same units: both visitor counts)
   - "city vs region comparison" → multiType_same_y_diff_type (same units: both counts)
   - "revenue with growth target" → multiTypeWithThreshold (revenue with target line)
   - "incidents with average line" → multiTypeWithMean (incidents with computed mean)

GENERATE realistic travel data following the EXACT template structure for your chosen subtype.`;

      const llmResponse = await this.callLLM(prompt);
      const chartSpec = this.validateResponse(llmResponse);

      if (!chartSpec) {
        return {
          success: false,
          error: 'Failed to generate valid multi-type chart specification',
          suggestedAlternatives: [
            'Try requesting a dual-metric analysis',
            'Ask for trends with secondary indicators',
            'Consider combining visitor data with performance metrics'
          ]
        };
      }

      return {
        success: true,
        chartSpec,
        explanation: `Generated ${chartSpec.subtype} showing ${chartSpec.description}. This combination chart displays ${chartSpec.data.length} data points with ${chartSpec.subtype.includes('same_y') ? 'unified scale' : 'dual Y-axis'} presentation.`
      };

    } catch (error) {
      return {
        success: false,
        error: `Multi-type chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedAlternatives: [
          'Verify your request includes dual metrics',
          'Check if you need combined trend analysis',
          'Consider using separate line and bar charts'
        ]
      };
    }
  }

  protected generateContextAwareData(category: string, destinations: string[] = [], dataPoints: number = 8): any[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const quarters = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];
    const years = ['2020', '2021', '2022', '2023'];
    
    const data: any[] = [];
    let xValues = months.slice(0, dataPoints);
    let xField = 'month';

    // Determine X-axis values based on category
    if (category === 'revenue' || category === 'financial') {
      xValues = quarters.slice(0, Math.min(dataPoints, 4));
      xField = 'quarter';
    } else if (category === 'safety' || category === 'long-term') {
      xValues = years.slice(0, Math.min(dataPoints, 4));
      xField = 'year';
    }

    xValues.forEach((xVal, idx) => {
      let barValue = 0;
      let lineValue = 0;
      let colorCategory = '';
      let additionalFields = {};

      switch (category) {
        case 'visitor-flow':
          barValue = Math.round(100000 + Math.random() * 150000 + idx * 10000);
          lineValue = Math.round(60 + Math.random() * 35 + Math.sin(idx) * 10);
          colorCategory = idx < 2 ? 'Low' : idx < 6 ? 'Shoulder' : 'High';
          additionalFields = {
            monthName: xVal,
            arrivals: barValue,
            occupancyRate: lineValue,
            season: colorCategory
          };
          break;

        case 'cost':
          barValue = Math.round(120 + Math.random() * 100 + idx * 8);
          lineValue = Math.round((3.8 + Math.random() * 0.8 + Math.sin(idx) * 0.2) * 10) / 10;
          colorCategory = barValue < 150 ? 'Low' : barValue < 200 ? 'Medium' : 'High';
          additionalFields = {
            avgCost: barValue,
            satisfactionScore: lineValue,
            costTier: colorCategory
          };
          break;

        case 'safety':
          barValue = Math.round(50 - idx * 5 + Math.random() * 10);
          lineValue = Math.round(60 + idx * 5 + Math.random() * 8);
          colorCategory = barValue > 40 ? 'High' : barValue > 25 ? 'Medium' : 'Low';
          additionalFields = {
            incidents: Math.max(5, barValue),
            improvementIndex: Math.min(95, lineValue),
            severity: colorCategory
          };
          break;

        case 'revenue':
          barValue = Math.round(2500000 + Math.random() * 1000000 + idx * 200000);
          lineValue = Math.round(5 + Math.random() * 10 + idx * 2);
          colorCategory = lineValue > 10 ? 'Strong' : lineValue > 6 ? 'Moderate' : 'Weak';
          additionalFields = {
            revenue: barValue,
            growthRate: lineValue,
            performance: colorCategory
          };
          break;

        default:
          barValue = Math.round(50 + Math.random() * 100 + idx * 10);
          lineValue = Math.round(20 + Math.random() * 60 + Math.sin(idx) * 15);
          colorCategory = 'Default';
          additionalFields = {
            yBar: barValue,
            yLine: lineValue,
            category: colorCategory
          };
      }

      data.push({
        [xField]: xVal,
        x: xVal,
        ...additionalFields
      });
    });

    return data;
  }
}