// API endpoint to generate charts using real travel agent system
import { NextRequest, NextResponse } from 'next/server';
import { TravelAgentManager } from '../../../vegaTemplates/travel_agent_simulator/TravelAgentManager';
import { SpecCreator } from '../../../vegaTemplates/SpecCreator';
import { createWorldTravelMapVegaSpec } from '../../../vegaTemplates/map/worldInteractiveMapSpec';
import { CLICKABLE_COUNTRIES } from '../../../app/travel/travelVegaSpecs';
import fs from 'fs';
import path from 'path';

// Helper function to convert TravelChartSpec to ChartSpec for SpecCreator
const convertToChartSpec = (travelSpec: any): any => {
  const styling = {
    ...travelSpec.config?.styling,
    colors: travelSpec.config?.styling?.colors || ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
  };

  return {
    ...travelSpec,
    config: {
      ...travelSpec.config,
      styling
    }
  };
};

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting chart generation with real travel agents...');
    
    const body = await request.json();
    const { inputFile } = body;

    if (!inputFile) {
      return NextResponse.json({
        success: false,
        error: 'No input file specified'
      }, { status: 400 });
    }

    // Initialize the real travel agent manager
    const agentManager = new TravelAgentManager();
    
    // Validate system
    const validation = agentManager.validateSystem();
    if (!validation.isValid) {
      throw new Error(`System validation failed: ${validation.errors.join(', ')}`);
    }

    // Load input data
    const inputPath = path.join(process.cwd(), inputFile);
    console.log(`📖 Reading input file: ${inputPath}`);
    
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const inputData = JSON.parse(rawData);

    // Handle both old array format and new object format
    let sentences: Record<string, any>;
    if (Array.isArray(inputData)) {
      // Convert array format to proper sentence_id structure
      sentences = {};
      inputData.forEach((item, index) => {
        if (item.sentence_id) {
          sentences[item.sentence_id] = item;
        } else {
          sentences[index + 1] = { sentence_id: index + 1, charts: item.charts || [item] };
        }
      });
    } else if (inputData.sentences) {
      sentences = inputData.sentences;
    } else {
      // Convert object keys to sentences format
      sentences = {};
      Object.keys(inputData).forEach(key => {
        sentences[key] = inputData[key];
      });
    }

    // Calculate total charts
    const totalCharts = Object.values(sentences).reduce((total: number, sentence: any) => {
      return total + (sentence.charts ? sentence.charts.length : 0);
    }, 0);

    console.log(`📊 Processing ${totalCharts} charts from ${Object.keys(sentences).length} sentence(s)`);

    const results: {
      sentences: Record<string, any>;
    } = {
      sentences: {}
    };

    // Track metadata for internal processing
    const processingMetadata = {
      totalRequests: totalCharts,
      successful: 0,
      failed: 0
    };

    const startTime = Date.now();
    let chartIndex = 0;

    // Process each sentence
    for (const [sentenceId, sentenceData] of Object.entries(sentences)) {
      console.log(`📝 Processing sentence: ${sentenceId}`);
      
      const processedSentence: any = {
        ...(sentenceData as any),
        charts: []
      };

      // Process each chart in the sentence
      const sentenceDataTyped = sentenceData as any;
      if (sentenceDataTyped.charts && Array.isArray(sentenceDataTyped.charts)) {
        for (let i = 0; i < sentenceDataTyped.charts.length; i++) {
          const chart = sentenceDataTyped.charts[i];
          chartIndex++;

          console.log(`  📊 [${chartIndex}/${totalCharts}] Processing chart...`);

          try {
            const chartStartTime = Date.now();

            // Extract the request (handle both formats)
            let chartRequest;
            if (chart.request) {
              chartRequest = chart.request;
            } else {
              // Convert old format to request format
              chartRequest = {
                userQuery: chart.query || `Generate a ${chart.chartType} chart for travel data analysis`,
                constraints: {
                  chartType: chart.chartType,
                  subtype: chart.subtype,
                  nodeSize: chart.nodeSize,
                  dataCategory: chart.dataCategory || 'tourism',
                  destinations: chart.destinations || ['Tokyo', 'Paris', 'London', 'New York'],
                  maxDataPoints: chart.maxDataPoints || 4,
                  hasFieldFilter: chart.hasFieldFilter || false,
                  filterConfig: chart.filterConfig || null,
                  selectedCountries: chart.selectedCountries || null
                }
              };
            }

            const chartType = chartRequest.constraints?.chartType;
            console.log(`    🤖 Calling ${chartType}Agent with query: "${chartRequest.userQuery}"`);

            let processedChart;

            // Check if this is a map chart - handle specially (same as demoGenerator.ts)
            if (chartRequest.constraints?.chartType === 'map') {
              console.log(`    🗺️  Generating map chart directly...`);
              
              const selectedCountries = chartRequest.constraints?.selectedCountries || [];
              const nodeSize = chartRequest.constraints?.nodeSize || 'xlarge';
              
              const dimensions = nodeSize === 'xlarge' ? { width: 800, height: 350 } : { width: 800, height: 350 };
              
              const vegaSpec = createWorldTravelMapVegaSpec({
                width: dimensions.width,
                height: dimensions.height,
                background: "#7ec2ddff",
                options: {
                  selectableCountries: CLICKABLE_COUNTRIES,
                  selectedCountries: selectedCountries
                }
              });

              const chartSpec = {
                subtitle: `Selected countries: {${selectedCountries.join(', ')}}`
              };
              
              const generationTime = Date.now() - chartStartTime;
              
              processedChart = {
                id: `chart-${chartIndex}`,
                name: chart.name || `Map Chart ${chartIndex}`,
                request: chartRequest,
                chartSpec: chartSpec,
                vegaSpec: vegaSpec,
                generationTime: generationTime,
                success: true,
                error: null
              };

              processingMetadata.successful++;
              console.log(`    ✅ Map generated successfully (${generationTime}ms)`);

            } else {
              // Generate chart using real AI agents (this is the key part!)
              console.log(`    🧠 Making real LLM call through ${chartType}Agent...`);
              
              const response = await agentManager.generateTravelChart(chartRequest);
              const generationTime = Date.now() - chartStartTime;
              
              if (response.success && response.chartSpec) {
                // Try to create Vega spec
                let vegaSpec = null;
                try {
                  const convertedSpec = convertToChartSpec(response.chartSpec);
                  vegaSpec = SpecCreator.create(convertedSpec);
                } catch (specError) {
                  console.log(`    ⚠️  Chart generated but SpecCreator failed: ${specError}`);
                }
                
                processedChart = {
                  id: `chart-${chartIndex}`,
                  name: chart.name || `${chartType} Chart ${chartIndex}`,
                  request: chartRequest,
                  chartSpec: response.chartSpec,
                  vegaSpec: vegaSpec,
                  generationTime: generationTime,
                  success: true,
                  error: null
                };
                
                processingMetadata.successful++;
                console.log(`    ✅ ${chartType}Agent generated successfully (${generationTime}ms)`);
              } else {
                throw new Error(response.error || 'Generation failed');
              }
            }

            processedSentence.charts.push(processedChart);

            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.log(`    ❌ Chart generation failed: ${error}`);
            
            const failedChart = {
              id: `chart-${chartIndex}`,
              name: chart.name || `Error Chart ${chartIndex}`,
              request: null,
              chartSpec: null,
              vegaSpec: null,
              generationTime: 0,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };

            processedSentence.charts.push(failedChart);
            processingMetadata.failed++;
          }
        }
      }

      results.sentences[sentenceId] = processedSentence;
    }

    const processingTimeMs = Date.now() - startTime;

    // Save output file
    const outputPath = inputPath.replace('.json', '_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);

    console.log('✅ Chart generation completed successfully!');
    console.log(`📈 Generated ${processingMetadata.successful}/${processingMetadata.totalRequests} charts`);
    console.log(`⏱️ Processing time: ${(processingTimeMs / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      message: 'Charts generated successfully',
      data: results,
      outputPath: outputPath,
      summary: {
        totalCharts: processingMetadata.totalRequests,
        successful: processingMetadata.successful,
        failed: processingMetadata.failed,
        processingTimeMs: processingTimeMs
      }
    });
    
  } catch (error) {
    console.error('Chart generation error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}