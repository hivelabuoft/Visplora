// Bar Chart Agent - Specialized for bar chart generation with 4 distinct subtypes
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
        type: 'horizontal_bar_basic',
        description: 'Simple horizontal bar chart for rankings and comparisons',
        fields: {
          category: 'destination (nominal)',
          value: 'measurement (quantitative)'
        },
        sampleData: [
          { destination: 'Tokyo', population: 38000000 },
          { destination: 'Delhi', population: 32000000 },
          { destination: 'Shanghai', population: 28000000 }
        ],
        useCases: ['city rankings', 'population comparisons', 'simple metrics']
      },
      {
        type: 'diverging_bar',
        description: 'Diverging bar chart for opposing metrics comparison',
        fields: {
          category: 'region (nominal)',
          positiveField: 'positive metric (quantitative)',
          negativeField: 'negative metric (quantitative)'
        },
        sampleData: [
          { region: 'Europe', airQuality: 78, greenSpace: 45 },
          { region: 'Asia', airQuality: 65, greenSpace: 30 },
          { region: 'Americas', airQuality: 72, greenSpace: 38 }
        ],
        useCases: ['quality vs challenges', 'benefits vs risks', 'comparative analysis']
      },
      {
        type: 'bar_with_threshold',
        description: 'Bar chart with threshold line for target comparisons',
        fields: {
          category: 'destination (nominal)',
          value: 'measurement (quantitative)',
          thresholdValue: 'target value (quantitative)'
        },
        sampleData: [
          { city: 'Lisbon', livingCost: 1800, budgetTarget: 2000 },
          { city: 'Berlin', livingCost: 2200, budgetTarget: 2000 },
          { city: 'Prague', livingCost: 1600, budgetTarget: 2000 }
        ],
        useCases: ['budget targets', 'performance goals', 'threshold analysis']
      },
      {
        type: 'bar_with_mean',
        description: 'Bar chart with mean average line for benchmark comparison',
        fields: {
          category: 'destination (nominal)',
          value: 'measurement (quantitative)',
          meanValue: 'calculated average (quantitative)'
        },
        sampleData: [
          { country: 'Maldives', tourismGDP: 45.2, globalAverage: 28.5 },
          { country: 'Seychelles', tourismGDP: 38.7, globalAverage: 28.5 },
          { country: 'Malta', tourismGDP: 31.4, globalAverage: 28.5 }
        ],
        useCases: ['average benchmarks', 'performance against mean', 'relative comparison']
      }
    ];
  }

  async generateChart(request: TravelAgentRequest): Promise<AgentResponse> {
    try {
      const constraints = request.constraints || {};
      const { subtype, nodeSize, dataCategory } = constraints;
      
      // Determine dimensions based on nodeSize
      const dimensions = this.getDimensionsForNodeSize(nodeSize || 'xlarge');
      
      const prompt = this.buildPrompt(request) + `

CRITICAL: You MUST follow this exact specification pattern based on the working createSafetyComparisonBarChartSpec example.

SUBTYPE: ${subtype}
NODE SIZE: ${nodeSize}
DIMENSIONS: width: ${dimensions.width}, height: ${dimensions.height}

EXACT TEMPLATE REQUIREMENTS:

1. DATA FORMAT (you can only change these field mappings):
   - For divergingBarSpec: {category: "cityName", positiveField: "airQualityScore", negativeField: "greenSpaceScore"}
   - For horizontalBarSpec: {category: "cityName", value: "populationMillion"}
   - For horizontalBarWithThresholdSpec: {category: "cityName", value: "livingCost", thresholdValue: 2000}
   - For horizontalBarWithMeanSpec: {category: "cityName", value: "tourismGDP", meanValue: 28.5}

2. FIELD MAPPING REQUIREMENTS:
   fields: {
     category: 'LLM_GENERATED_FIELD_NAME',        // Your choice of field name
     value: 'LLM_GENERATED_FIELD_NAME',          // Your choice of field name
     positiveLabel: 'LLM_GENERATED_LABEL',       // Only for divergingBarSpec
     negativeLabel: 'LLM_GENERATED_LABEL'        // Only for divergingBarSpec
   }

3. STYLING RESTRICTIONS (can only change these):
   - colors: Array of appropriate colors
   - title: Custom title based on data
   - format: Appropriate format string
   
4. CONFIG STRUCTURE (EXACT - do not modify except colors/title/format):
   config: {
     dimensions: { width: ${dimensions.width}, height: ${dimensions.height} },
     fields: { /* your field mappings */ },
     styling: {
       colors: ['#ef4444', '#f59e0b'], // Your colors
       background: 'transparent',
       axes: {
         xAxis: {
           labelColor: '#888',
           titleColor: '#888',
           labelFontSize: 8,
           grid: true,
           gridColor: '#888',
           gridDash: [2, 2],
           title: 'YOUR_TITLE', // Your title
           format: 'YOUR_FORMAT' // Your format
         }
       }
     },
     legend: {
       title: null,
       orient: 'top',
       titleColor: '#888',
       labelColor: '#888',
       titleFontSize: 11,
       labelFontSize: 10,
       symbolSize: 150,
       symbolType: 'square'
     },
     tooltip: {
       fields: [
         // Adapt these based on your actual data fields
         { field: 'region', type: 'nominal', title: 'Region' },
         { field: 'riskLabel', type: 'nominal', title: 'Risk Type' },
         { field: 'absolute_risk', type: 'quantitative', title: 'Risk Value', format: '.1f' },
         { field: 'overallSafety', type: 'quantitative', title: 'Overall Safety', format: '.0f' }
       ]
     },
     interactions: {
       hover: true,
       select: true
     }
   }

5. GENERATE DATA based on request destinations and context.

6. EXAMPLE for divergingBarSpec (North vs South American Environmental Quality):
   Generate data like:
   [
     { city: "Vancouver", airQualityScore: 78, greenSpaceScore: 45, region: "North America" },
     { city: "São Paulo", airQualityScore: 52, greenSpaceScore: 28, region: "South America" }
   ]

RESPOND with valid JSON chart specification following this exact pattern.`;

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
        explanation: `Generated ${chartSpec.subtype} with ${dimensions.width}x${dimensions.height} dimensions for ${nodeSize} node. Data includes ${chartSpec.data.length} entries with ${chartSpec.config.fields ? Object.keys(chartSpec.config.fields).length : 'multiple'} field mappings.`
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
        case 'demographics':
          entry.population = Math.round(5 + Math.random() * 35); // Million
          entry.populationMillion = entry.population;
          break;
          
        case 'recovery-analysis':
          entry.recoveryRate = Math.round(70 + Math.random() * 40); // %
          entry.baseline2019 = 100;
          break;
          
        case 'environmental':
          entry.airQualityScore = Math.round(40 + Math.random() * 50);
          entry.greenSpaceScore = Math.round(15 + Math.random() * 40);
          entry.region = dest.includes('Vancouver') || dest.includes('Portland') ? 'North America' : 'South America';
          break;
          
        case 'seasonal-tourism':
          entry.winterAppeal = Math.round(60 + Math.random() * 30);
          entry.accessibilityChallenges = Math.round(20 + Math.random() * 50);
          break;
          
        case 'cost':
          entry.livingCost = Math.round(1200 + Math.random() * 1500); // EUR
          entry.budgetTarget = 2000;
          break;
          
        case 'wildlife':
          entry.wildlifeDensity = Math.round(20 + Math.random() * 60); // per sq km
          entry.conservationTarget = 40;
          break;
          
        case 'economics':
          entry.tourismGDP = Math.round(15 + Math.random() * 40); // %
          entry.globalAverage = 28.5;
          break;
          
        case 'sustainability':
          entry.waterEfficiency = Math.round(60 + Math.random() * 35); // %
          entry.regionalMean = 75.2;
          break;
          
        default:
          entry.value = Math.round(50 + Math.random() * 50);
      }

      data.push(entry);
    });

    return data;
  }
}