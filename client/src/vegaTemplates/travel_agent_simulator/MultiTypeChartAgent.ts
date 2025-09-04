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

CRITICAL: ALL multiType subtypes use the SAME data format with shared Y axis and "monthName" as x field.

1. SUBTYPE SELECTION GUIDE:
   - barChartWithLineSpec: Bars (left Y) + Line (right Y) - different scales (MOST COMMON)
   - multiType_same_y_diff_type: Bars + Line on same Y scale - same units
   - multiTypeWithMean: Bars + Line + Mean line overlay (SAME FORMAT as above)
   - multiTypeWithThreshold: Bars + Line + Threshold line overlay (SAME FORMAT as above)

1.1. CRITICAL DATA FIELD REQUIREMENTS - FOLLOW WORKING PATTERN:
   
   ALL SUBTYPES MUST USE DOMAIN-SPECIFIC FIELD NAMES LIKE THE WORKING VERSION:
   
   WORKING PATTERN EXAMPLE (travel2/page.tsx):
   Data: {
     monthName: "Jan", 
     cityArrivals: 145000,      // Descriptive bar field name
     globalAverage: 120000,     // Descriptive line field name
     season: "Low"              // Color category field
   }
   
   Config: {
     "fields": {
       "x": "monthName",
       "y": "cityArrivals",     // Maps to descriptive bar field
       "series": "globalAverage", // Maps to descriptive line field  
       "color": "season"
     }
   }

   REQUIREMENTS FOR ALL SUBTYPES:
   - Create DESCRIPTIVE field names based on your data context
   - For visitor data: use "cityArrivals", "regionalAverage", "globalTrend", etc.
   - For financial data: use "quarterlyRevenue", "growthRate", "targetBenchmark", etc.  
   - For safety data: use "safetyScore", "improvementIndex", "averageBenchmark", etc.
   - Map these descriptive names in the config fields section
   - NEVER use generic "yBar"/"yLine" - always use meaningful names

2. CRITICAL DIMENSION REQUIREMENTS - DO NOT DEVIATE:
   - barChartWithLineSpec: {"width": 350, "height": 180} (EXACT VALUES)
   - multiTypeWithMean: {"width": 350, "height": 180} (EXACT VALUES)
   - multiTypeWithThreshold: {"width": 350, "height": 180} (EXACT VALUES)  
   - multiType_same_y_diff_type: {"width": 390, "height": 180} (EXACT VALUES)

3. FIELD REQUIREMENTS BY SUBTYPE - ALL USE DESCRIPTIVE NAMES:

   For ALL subtypes (following working pattern):
   - x: Must be ordinal (month, quarter, year, category, cityName)
   - y: Bar values field with DESCRIPTIVE name (e.g., 'cityArrivals', 'quarterlyRevenue', 'safetyScore')
   - series: Line values field with DESCRIPTIVE name (e.g., 'globalAverage', 'growthRate', 'improvementIndex')
   - color: Must be nominal for bar colors (season, tier, severity, performance)

   EXAMPLES OF GOOD DESCRIPTIVE FIELD NAMES:
   - Visitor data: cityArrivals + regionalAverage, localVisitors + globalTrend
   - Financial data: quarterlyRevenue + growthRate, monthlyCosts + satisfactionScore
   - Safety data: safetyScore + improvementIndex, incidentCount + averageBenchmark
   - Environmental: airQualityIndex + satisfactionRating, pollutionLevel + targetGoal

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

6. AXES CONFIGURATION - USE DESCRIPTIVE FIELD NAMES:
   
   For ALL subtypes (following working pattern):
   - styling.axes.yAxis: {title: "Descriptive Metric Name", format: "appropriate_format"}
   - styling.axes.xAxis: {title: "X Axis Label"}
   
   NEVER use generic titles - always describe what the metric represents:
   - "Monthly Visitor Arrivals" instead of "Value"
   - "Quarterly Tourism Revenue" instead of "Bar Values"
   - "Safety Assessment Score" instead of "yBar"

7. WHAT YOU CAN MODIFY:
   - Chart title (make descriptive, no chart type prefix)
   - Data values and field names
   - Axis titles to match your data
   - Colors within the specified array

8. SPECIAL REQUIREMENTS FOR THRESHOLD CHARTS (multiTypeWithThreshold):
   - MUST include threshold styling in config:
   "styling": {
     "thresholdValue": [numeric_value],      // The threshold line value
     "thresholdColor": "#ef4444",           // Red threshold line
     "thresholdLabel": "[descriptive_label]", // e.g., "Safety Target", "Revenue Goal"
     "showThresholdLabel": true
   }

8.1. SPECIAL REQUIREMENTS FOR MEAN CHARTS (multiTypeWithMean):
   - MUST include mean styling in config:
   "styling": {
     "meanValue": [numeric_value],           // The mean line value
     "meanColor": "#ff6b6b",                // Pink mean line
     "meanLabel": "Monthly Average",         // Descriptive label
     "showMeanLabel": true
   }

9. WHAT YOU MUST NOT MODIFY:
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

10. CRITICAL AXIS FORMAT REQUIREMENTS:
   - NEVER use "comma" as format - use ".2s" or ",.0f" instead
   - NEVER use "percent" as format - use ".1%" instead
   - NEVER use "number" as format - use ".0f" instead
   - For currency: use "$,.0f" not "comma"
   - For percentages: use ".1%" not "percent"  
   - For large numbers: use ".2s" not "number"

CRITICAL RULES:
1. multiTypeWithMean,multiTypeWithThreshold, multiType_same_y_diff_type MUST use the SAME data format with shared Y axis
2. multiTypeWithMean,multiTypeWithThreshold, multiType_same_y_diff_type MUST should NOT include "y": "independent"
3. Bar and line values must use SAME UNITS (both visitor counts, both revenue amounts, both scores)
4. Always use "monthName" for x field (not "quarter" or "year" unless specifically requested)
5. NEVER use "thresholdField" or "meanField" - these don't exist in templates
6. Use descriptive field names and map them properly in config fields

GENERATE realistic travel data following the EXACT working pattern with descriptive field names for your chosen subtype.`;

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
    // Enhanced intelligent parsing of the request
        // Parse the category to understand what kind of data to generate
    const queryAnalysis = this.analyzeQuery(category, destinations, dataPoints);
    const { timeframe, dataContext, regionalContext, xValues, xField } = queryAnalysis;
    
    const data: any[] = [];

    xValues.forEach((xVal, idx) => {
      const generatedData = this.generateDataForContext(
        dataContext, 
        xVal, 
        idx, 
        xValues.length, 
        regionalContext
      );
      
      data.push({
        monthName: xVal,  // Always use "monthName" for consistency with working pattern
        ...generatedData
      });
    });

    return data;
  }

  private analyzeQuery(category: string, destinations: string[], dataPoints: number): {
    timeframe: string;
    dataContext: string;
    regionalContext: any;
    xValues: string[];
    xField: string;
  } {
    const categoryLower = category.toLowerCase();
    
    // 1. Detect geographical scope and get appropriate cities
    const regionalContext = this.detectRegionalContext(categoryLower, destinations);
    
    // 2. Detect timeframe preference
    const timeframe = this.detectTimeframe(categoryLower);
    
    // 3. Infer data context (what metrics to compare)
    const dataContext = this.inferDataContext(categoryLower);
    
    // 4. Generate appropriate X-axis values
    const { xValues, xField } = this.generateXAxisValues(timeframe, regionalContext, dataPoints);
    
    return { timeframe, dataContext, regionalContext, xValues, xField };
  }

  private detectRegionalContext(categoryLower: string, providedDestinations: string[]): any {
    // If specific destinations are provided, use them
    if (providedDestinations.length > 0) {
      return {
        type: 'custom',
        cities: providedDestinations,
        region: 'mixed'
      };
    }

    // Regional keyword detection
    const regions = {
      'east asia': ['Tokyo', 'Seoul', 'Beijing', 'Shanghai', 'Hong Kong', 'Taipei'],
      'southeast asia': ['Bangkok', 'Singapore', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Ho Chi Minh City'],
      'europe': ['Paris', 'London', 'Rome', 'Barcelona', 'Amsterdam', 'Berlin'],
      'western europe': ['Paris', 'London', 'Amsterdam', 'Brussels', 'Madrid', 'Vienna'],
      'southern europe': ['Rome', 'Barcelona', 'Athens', 'Lisbon', 'Naples', 'Valencia'],
      'northern europe': ['Stockholm', 'Copenhagen', 'Helsinki', 'Oslo', 'Reykjavik', 'Edinburgh'],
      'north america': ['New York', 'Los Angeles', 'Toronto', 'Chicago', 'Vancouver', 'San Francisco'],
      'middle east': ['Dubai', 'Istanbul', 'Tel Aviv', 'Doha', 'Kuwait City', 'Riyadh'],
      'africa': ['Cairo', 'Cape Town', 'Marrakech', 'Lagos', 'Nairobi', 'Casablanca'],
      'oceania': ['Sydney', 'Melbourne', 'Auckland', 'Brisbane', 'Perth', 'Wellington'],
      'south america': ['São Paulo', 'Buenos Aires', 'Rio de Janeiro', 'Lima', 'Santiago', 'Bogotá']
    };

    // Check for regional keywords
    for (const [regionName, cities] of Object.entries(regions)) {
      if (categoryLower.includes(regionName)) {
        return {
          type: 'regional',
          cities: cities,
          region: regionName,
          characteristics: this.getRegionalCharacteristics(regionName)
        };
      }
    }

    // Check for country-specific requests
    const countries = {
      'japan': ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima'],
      'china': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen'],
      'france': ['Paris', 'Lyon', 'Marseille', 'Nice'],
      'germany': ['Berlin', 'Munich', 'Hamburg', 'Cologne'],
      'usa': ['New York', 'Los Angeles', 'Chicago', 'Miami'],
      'uk': ['London', 'Edinburgh', 'Manchester', 'Liverpool']
    };

    for (const [country, cities] of Object.entries(countries)) {
      if (categoryLower.includes(country)) {
        return {
          type: 'country',
          cities: cities,
          region: country,
          characteristics: this.getRegionalCharacteristics(country)
        };
      }
    }

    // Default to global mix
    return {
      type: 'global',
      cities: ['Tokyo', 'London', 'New York', 'Paris', 'Sydney', 'Dubai'],
      region: 'global',
      characteristics: { costRange: [100, 300], safetyRange: [65, 90] }
    };
  }

  private getRegionalCharacteristics(region: string): any {
    const characteristics = {
      'east asia': {
        costRange: [80, 250],
        safetyRange: [75, 95],
        visitorRange: [50000, 300000],
        culturalFocus: true,
        technologyAdvanced: true
      },
      'southeast asia': {
        costRange: [40, 150],
        safetyRange: [60, 85],
        visitorRange: [80000, 400000],
        tropicalClimate: true,
        budgetFriendly: true
      },
      'europe': {
        costRange: [120, 400],
        safetyRange: [70, 95],
        visitorRange: [100000, 500000],
        historicalRich: true,
        highQuality: true
      },
      'north america': {
        costRange: [150, 500],
        safetyRange: [65, 90],
        visitorRange: [200000, 800000],
        businessOriented: true,
        expensive: true
      }
    };

    return (characteristics as any)[region] || {
      costRange: [100, 300],
      safetyRange: [65, 90],
      visitorRange: [100000, 400000]
    };
  }

  private detectTimeframe(categoryLower: string): string {
    if (categoryLower.includes('month') || categoryLower.includes('seasonal') || categoryLower.includes('week')) {
      return 'monthly';
    }
    if (categoryLower.includes('quarter') || categoryLower.includes('financial') || categoryLower.includes('revenue')) {
      return 'quarterly';
    }
    if (categoryLower.includes('year') || categoryLower.includes('annual') || categoryLower.includes('trend')) {
      return 'yearly';
    }
    if (categoryLower.includes('city') || categoryLower.includes('destination') || 
        categoryLower.includes('region') || categoryLower.includes('compare') || 
        categoryLower.includes('vs') || categoryLower.includes('versus')) {
      return 'categorical';
    }
    
    // Smart default: if asking about specific places, use categorical; otherwise monthly
    return categoryLower.includes('across') || categoryLower.includes('between') ? 'categorical' : 'monthly';
  }

  private generateXAxisValues(timeframe: string, regionalContext: any, dataPoints: number): { xValues: string[], xField: string } {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarters = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];
    const years = ['2020', '2021', '2022', '2023', '2024'];

    switch (timeframe) {
      case 'monthly':
        return {
          xValues: months.slice(0, Math.min(dataPoints, 12)),
          xField: 'month'
        };
      case 'quarterly':
        return {
          xValues: quarters.slice(0, Math.min(dataPoints, 4)),
          xField: 'quarter'
        };
      case 'yearly':
        return {
          xValues: years.slice(0, Math.min(dataPoints, 5)),
          xField: 'year'
        };
      case 'categorical':
        return {
          xValues: regionalContext.cities.slice(0, Math.min(dataPoints, regionalContext.cities.length)),
          xField: 'city'
        };
      default:
        return {
          xValues: months.slice(0, Math.min(dataPoints, 8)),
          xField: 'month'
        };
    }
  }

  private generateDataForContext(
    context: string, 
    xVal: string, 
    idx: number, 
    totalPoints: number, 
    regionalContext: any
  ): any {
    let barValue = 0;
    let lineValue = 0;
    let colorCategory = '';
    const seasonalMultiplier = Math.sin((idx / totalPoints) * 2 * Math.PI) * 0.3 + 1;
    const characteristics = regionalContext.characteristics || {};
    
    // Use regional characteristics to influence data generation
    const costMultiplier = characteristics.expensive ? 1.5 : characteristics.budgetFriendly ? 0.6 : 1.0;
    const safetyBonus = characteristics.technologyAdvanced ? 10 : characteristics.historicalRich ? 5 : 0;
    const visitorBase = characteristics.visitorRange?.[0] || 100000;
    const visitorRange = characteristics.visitorRange?.[1] - visitorBase || 200000;

    switch (context) {
      case 'visitor-flow':
        barValue = Math.round((visitorBase + Math.random() * visitorRange + idx * (visitorRange/10)) * seasonalMultiplier);
        lineValue = Math.round(60 + Math.random() * 35 + Math.sin(idx) * 10 + (characteristics.highQuality ? 5 : 0));
        colorCategory = idx < totalPoints * 0.3 ? 'Low' : idx < totalPoints * 0.7 ? 'Shoulder' : 'High';
        return {
          cityArrivals: barValue, regionalAverage: lineValue, season: colorCategory
        };

      case 'financial':
        const baseCost = characteristics.costRange?.[0] || 150;
        const costRange = characteristics.costRange?.[1] - baseCost || 200;
        barValue = Math.round((baseCost + Math.random() * costRange + idx * (costRange/8)) * costMultiplier * seasonalMultiplier);
        lineValue = Math.round(3 + Math.random() * 12 + idx * 1.5 + (characteristics.businessOriented ? 2 : 0));
        colorCategory = lineValue > 10 ? 'Strong' : lineValue > 6 ? 'Moderate' : 'Weak';
        return {
          quarterlyRevenue: barValue, growthRate: lineValue, performance: colorCategory
        };

      case 'safety':
        const safetyBase = characteristics.safetyRange?.[0] || 60;
        const safetyRange = characteristics.safetyRange?.[1] - safetyBase || 30;
        barValue = Math.round(Math.max(5, 50 - idx * 4 + Math.random() * 15));
        lineValue = Math.round(safetyBase + Math.random() * safetyRange + safetyBonus);
        colorCategory = lineValue > 85 ? 'Excellent' : lineValue > 70 ? 'Good' : 'Average';
        return {
          safetyScore: barValue, improvementIndex: lineValue, level: colorCategory
        };

      case 'environmental':
        barValue = Math.round(30 + Math.random() * 120 + Math.sin(idx) * 20 + (characteristics.technologyAdvanced ? -20 : 0));
        lineValue = Math.round(6.5 + Math.random() * 2.5 + Math.cos(idx) * 0.8 + (characteristics.highQuality ? 0.5 : 0));
        colorCategory = barValue < 50 ? 'Good' : barValue < 100 ? 'Moderate' : 'Poor';
        return {
          airQualityIndex: barValue, satisfactionRating: lineValue, condition: colorCategory
        };

      case 'accommodation':
        barValue = Math.round((25000 + Math.random() * 45000 + idx * 3000) * seasonalMultiplier * (characteristics.expensive ? 1.3 : 1.0));
        lineValue = Math.round(65 + Math.random() * 30 + Math.sin(idx) * 8 + (characteristics.highQuality ? 10 : 0));
        colorCategory = lineValue > 85 ? 'Peak' : lineValue > 70 ? 'High' : 'Normal';
        return {
          hotelBookings: barValue, occupancyRate: lineValue, demand: colorCategory
        };

      case 'transportation':
        barValue = Math.round((150000 + Math.random() * 200000 + idx * 15000) * seasonalMultiplier);
        lineValue = Math.round(7.2 + Math.random() * 1.6 + Math.sin(idx) * 0.4 + (characteristics.technologyAdvanced ? 0.8 : 0));
        colorCategory = lineValue > 8.5 ? 'Excellent' : lineValue > 7.5 ? 'Good' : 'Average';
        return {
          passengerVolume: barValue, satisfactionScore: lineValue, serviceLevel: colorCategory
        };

      case 'cultural':
        barValue = Math.round((8000 + Math.random() * 25000 + idx * 2000) * seasonalMultiplier * (characteristics.culturalFocus ? 1.4 : 1.0));
        lineValue = Math.round(4.0 + Math.random() * 1.5 + Math.sin(idx) * 0.3 + (characteristics.historicalRich ? 0.3 : 0));
        colorCategory = barValue > 25000 ? 'Popular' : barValue > 15000 ? 'Moderate' : 'Quiet';
        return {
          culturalVisitors: barValue, averageRating: lineValue, popularity: colorCategory
        };

      case 'health':
        barValue = Math.round(45 + Math.random() * 50 + idx * 2 + (characteristics.technologyAdvanced ? 15 : 0));
        lineValue = Math.round(6.5 + Math.random() * 2.5 + idx * 0.3 + (characteristics.highQuality ? 1.0 : 0));
        colorCategory = barValue > 80 ? 'High' : barValue > 60 ? 'Medium' : 'Low';
        return {
          vaccinationRate: barValue, confidenceIndex: lineValue, readiness: colorCategory
        };

      case 'culinary':
        barValue = Math.round((1200 + Math.random() * 3800 + idx * 300) * seasonalMultiplier * costMultiplier);
        lineValue = Math.round(4.1 + Math.random() * 0.8 + Math.sin(idx) * 0.2 + (characteristics.culturalFocus ? 0.4 : 0));
        colorCategory = lineValue > 4.6 ? 'Excellent' : lineValue > 4.3 ? 'Good' : 'Average';
        return {
          restaurantCount: barValue, averageRating: lineValue, quality: colorCategory
        };

      default: // general - make it more contextual
        const baseValue = characteristics.expensive ? 200 : characteristics.budgetFriendly ? 80 : 100;
        barValue = Math.round(baseValue + Math.random() * baseValue + idx * (baseValue/10));
        lineValue = Math.round(50 + Math.random() * 40 + Math.sin(idx) * 15 + safetyBonus);
        colorCategory = regionalContext.region || 'Standard';
        return {
          primaryMetric: barValue, secondaryMetric: lineValue, category: colorCategory
        };
    }
  }

  private inferDataContext(categoryLower: string): string {
    // Visitor and flow patterns
    if (categoryLower.includes('visitor') || categoryLower.includes('arrival') || categoryLower.includes('tourist') || categoryLower.includes('flow')) {
      return 'visitor-flow';
    }
    
    // Financial and economic
    if (categoryLower.includes('cost') || categoryLower.includes('price') || categoryLower.includes('revenue') || categoryLower.includes('financial') || categoryLower.includes('economic')) {
      return 'financial';
    }
    
    // Safety and security
    if (categoryLower.includes('safety') || categoryLower.includes('security') || categoryLower.includes('crime') || categoryLower.includes('incident')) {
      return 'safety';
    }
    
    // Environmental and weather
    if (categoryLower.includes('environment') || categoryLower.includes('weather') || categoryLower.includes('climate') || categoryLower.includes('air quality') || categoryLower.includes('temperature')) {
      return 'environmental';
    }
    
    // Accommodation
    if (categoryLower.includes('hotel') || categoryLower.includes('accommodation') || categoryLower.includes('booking') || categoryLower.includes('occupancy')) {
      return 'accommodation';
    }
    
    // Transportation
    if (categoryLower.includes('transport') || categoryLower.includes('flight') || categoryLower.includes('train') || categoryLower.includes('travel') || categoryLower.includes('mobility')) {
      return 'transportation';
    }
    
    // Cultural and events
    if (categoryLower.includes('culture') || categoryLower.includes('event') || categoryLower.includes('festival') || categoryLower.includes('museum') || categoryLower.includes('attraction')) {
      return 'cultural';
    }
    
    // Health and pandemic
    if (categoryLower.includes('health') || categoryLower.includes('pandemic') || categoryLower.includes('vaccination') || categoryLower.includes('medical')) {
      return 'health';
    }
    
    // Food and dining
    if (categoryLower.includes('food') || categoryLower.includes('restaurant') || categoryLower.includes('dining') || categoryLower.includes('culinary')) {
      return 'culinary';
    }
    
    // Default fallback
    return 'general';
  }
}