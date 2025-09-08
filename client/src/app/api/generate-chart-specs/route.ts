import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { CHART_SPEC_SYSTEM_PROMPT, generateChartSpecPrompt } from '../../../utils/chartSpecPrompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExplorationPathNode {
  sentence_id: number;
  sentence_content: string;
  system_shows?: string;
  drift_type: string;
}

interface ChartSpec {
  name: string;
  request: {
    userQuery: string;
    constraints: {
      chartType: string;
      subtype?: string;
      nodeSize: string;
      dataCategory: string;
      destinations?: string[];
      selectedCountries?: string[];
      maxDataPoints: number;
      hasFieldFilter?: boolean;
      filterConfig?: {
        filterType: string;
        filterKey: string;
        filterLabel: string;
        defaultValue: string;
        options: Array<{
          label: string;
          value: string;
          displayName: string;
        }>;
      };
    };
  };
}

const CHART_TYPES_AND_SUBTYPES = {
  line: ['multiLineLabelSpec', 'lineChartWithMean', 'lineChartWithThreshold'],
  bar: ['horizontalBar', 'divergingBar', 'barChartWithThreshold', 'barChartWithMean'],
  multiType: ['barChartWithLineSpec', 'multiType_same_y_diff_type', 'multiTypeWithThreshold', 'multiTypeWithMean'],
  scatter: ['bubblePlotScatterSpec'],
  map: ['worldInteractiveMap'],
  pie: ['interactivePieSpec']
};

const DATA_CATEGORIES = [
  'cost', 'safety', 'visitor-flow', 'environmental', 'reviews', 'cultural',
  'demographics', 'recovery-analysis', 'economics', 'sustainability', 'wildlife',
  'revenue', 'accessibility', 'geographic', 'seasonal-tourism'
];

const FILTER_CONFIGS = {
  budget_level: {
    filterType: 'budget_level',
    filterKey: 'selectedBudgetLevel',
    filterLabel: 'Budget Level',
    defaultValue: 'Mid-range',
    options: [
      { label: 'Budget', value: 'Budget', displayName: 'Budget Travel' },
      { label: 'Mid-range', value: 'Mid-range', displayName: 'Mid-range Travel' },
      { label: 'Luxury', value: 'Luxury', displayName: 'Luxury Travel' }
    ]
  },
  region: {
    filterType: 'region',
    filterKey: 'selectedRegion',
    filterLabel: 'Region',
    defaultValue: 'Asia',
    options: [
      { label: 'North America', value: 'North America', displayName: 'North America' },
      { label: 'Europe', value: 'Europe', displayName: 'Europe' },
      { label: 'Asia', value: 'Asia', displayName: 'Asia' },
      { label: 'South America', value: 'South America', displayName: 'South America' }
    ]
  },
  season: {
    filterType: 'season',
    filterKey: 'selectedSeason',
    filterLabel: 'Season',
    defaultValue: 'Summer',
    options: [
      { label: 'Spring', value: 'Spring', displayName: 'Spring (Mar-May)' },
      { label: 'Summer', value: 'Summer', displayName: 'Summer (Jun-Aug)' },
      { label: 'Fall', value: 'Fall', displayName: 'Fall (Sep-Nov)' },
      { label: 'Winter', value: 'Winter', displayName: 'Winter (Dec-Feb)' }
    ]
  },
  trip_type: {
    filterType: 'trip_type',
    filterKey: 'selectedTripType',
    filterLabel: 'Trip Type',
    defaultValue: 'Leisure',
    options: [
      { label: 'Business', value: 'Business', displayName: 'Business Travel' },
      { label: 'Leisure', value: 'Leisure', displayName: 'Leisure Travel' },
      { label: 'Adventure', value: 'Adventure', displayName: 'Adventure Travel' },
      { label: 'Cultural', value: 'Cultural', displayName: 'Cultural Travel' }
    ]
  },
  year: {
    filterType: 'year',
    filterKey: 'selectedYear',
    filterLabel: 'Year',
    defaultValue: '2023',
    options: [
      { label: '2022', value: '2022', displayName: '2022' },
      { label: '2023', value: '2023', displayName: '2023' },
      { label: '2024', value: '2024', displayName: '2024' }
    ]
  }
};

const generateLLMPrompt = (sentenceContent: string, systemShows: string, driftType: string) => {
  return generateChartSpecPrompt(sentenceContent, systemShows, driftType);
};

// Function to analyze sentence content and determine if it needs dashboard (204 charts) or single chart
const shouldGenerateDashboard = (sentenceContent: string, systemShows: string): boolean => {
  const dashboardKeywords = [
    'dashboard', 'overview', 'summary', 'all destinations', 'complete view',
    'comprehensive', 'full analysis', 'total', 'entire dataset', 'all data',
    'overall', 'general', 'broad view', 'wide perspective'
  ];
  
  const content = (sentenceContent + ' ' + systemShows).toLowerCase();
  return dashboardKeywords.some(keyword => content.includes(keyword));
};

export async function POST(request: NextRequest) {
  try {
    const { inputFile } = await request.json();

    if (!inputFile) {
      return NextResponse.json({ error: 'Input file path is required' }, { status: 400 });
    }

    // Read the input file
    const fullPath = path.join(process.cwd(), inputFile);
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Input file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data.exploration_path || !Array.isArray(data.exploration_path)) {
      return NextResponse.json({ error: 'Invalid file format: exploration_path not found' }, { status: 400 });
    }

    const results: Record<string, { charts: ChartSpec[] }> = {};
    let totalGenerated = 0;
    let totalFailed = 0;

    console.log(`Processing ${data.exploration_path.length} sentences individually...`);

    // Process each sentence individually with separate LLM calls
    for (const node of data.exploration_path as ExplorationPathNode[]) {
      console.log(`Processing sentence ${node.sentence_id}: "${node.sentence_content}"`);
      
      try {
        // Analyze sentence content to determine if it should generate dashboard or single chart
        const isDashboard = shouldGenerateDashboard(node.sentence_content, node.system_shows || '');
        const chartsToGenerate = isDashboard ? 204 : 1;
        
        console.log(`Sentence ${node.sentence_id} identified as: ${isDashboard ? 'DASHBOARD' : 'SINGLE CHART'} (${chartsToGenerate} charts)`);
        
        const prompt = generateLLMPrompt(
          node.sentence_content, 
          node.system_shows || '', 
          node.drift_type
        );

        // Add specific instruction based on content analysis
        const enhancedPrompt = isDashboard 
          ? prompt + "\n\nIMPORTANT: This sentence indicates a dashboard view. Generate exactly 204 diverse chart specifications to cover comprehensive data analysis across all possible dimensions."
          : prompt + "\n\nIMPORTANT: This sentence indicates a specific chart need. Generate exactly 1 focused chart specification.";

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: CHART_SPEC_SYSTEM_PROMPT
            },
            {
              role: "user",
              content: enhancedPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: isDashboard ? 4000 : 1500
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response from OpenAI');
        }

        // Parse the JSON response
        const chartSpecs = JSON.parse(response);
        
        if (!chartSpecs.charts || !Array.isArray(chartSpecs.charts)) {
          throw new Error('Invalid response format from OpenAI');
        }

        // Validate and enhance chart specifications
        const validatedCharts = chartSpecs.charts.map((chart: any) => {
          // Add filter config if needed
          if (chart.request.constraints.hasFieldFilter && !chart.request.constraints.filterConfig) {
            const filterTypes = Object.keys(FILTER_CONFIGS) as (keyof typeof FILTER_CONFIGS)[];
            const randomFilterType = filterTypes[Math.floor(Math.random() * filterTypes.length)];
            chart.request.constraints.filterConfig = FILTER_CONFIGS[randomFilterType];
          }

          return chart;
        });

        results[node.sentence_id.toString()] = {
          charts: validatedCharts
        };

        totalGenerated += validatedCharts.length;
        console.log(`✅ Generated ${validatedCharts.length} charts for sentence ${node.sentence_id} (${isDashboard ? 'DASHBOARD' : 'SINGLE'})`);

      } catch (error) {
        console.error(`❌ Failed to generate charts for sentence ${node.sentence_id}:`, error);
        totalFailed++;
        
        // Add fallback chart
        results[node.sentence_id.toString()] = {
          charts: [
            {
              name: `Fallback Chart for Sentence ${node.sentence_id}`,
              request: {
                userQuery: `Analyze data related to: ${node.sentence_content}`,
                constraints: {
                  chartType: 'bar',
                  subtype: 'horizontalBar',
                  nodeSize: 'medium',
                  dataCategory: 'visitor-flow',
                  destinations: ['Tokyo', 'Paris', 'London'],
                  maxDataPoints: 5,
                  hasFieldFilter: true,
                  filterConfig: FILTER_CONFIGS.region
                }
              }
            }
          ]
        };
        totalGenerated += 1;
      }
    }

    // Create output filename
    const outputFile = inputFile.replace('.json', '_data.json');
    const outputPath = path.join(process.cwd(), outputFile);

    // Save the results
    const outputData = Object.keys(results).map(sentenceId => ({
      sentence_id: parseInt(sentenceId),
      charts: results[sentenceId].charts
    }));

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

    console.log(`✅ Completed processing: ${totalGenerated} total charts generated, ${totalFailed} sentences failed`);

    return NextResponse.json({
      success: true,
      data: {
        sentences: results,
        metadata: {
          totalSentences: data.exploration_path.length,
          totalCharts: totalGenerated,
          totalFailed: totalFailed,
          outputFile: outputFile,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Chart spec generation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}