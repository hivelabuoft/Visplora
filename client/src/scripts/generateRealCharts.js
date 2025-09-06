#!/usr/bin/env node

/**
 * Real Chart Generation Script using Travel Agent System
 * 
 * This script uses the exact same demoGenerator approach but with custom input data.
 * It calls the real TravelAgentManager which routes to specialized agents like:
 * - DivergingBarAgent
 * - HorizontalBarAgent  
 * - PieChartAgent
 * - ScatterChartAgent
 * - etc.
 * 
 * Each agent makes real OpenAI API calls to generate contextual data and charts.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

// We need to use dynamic imports for ES modules since this is CommonJS
async function initializeRealAgents() {
  try {
    // Import the real travel agent system
    const { TravelAgentManager } = await import('../vegaTemplates/travel_agent_simulator/TravelAgentManager.js');
    const { SpecCreator } = await import('../vegaTemplates/SpecCreator.js');
    const { createWorldTravelMapVegaSpec } = await import('../vegaTemplates/map/worldInteractiveMapSpec.js');
    const { CLICKABLE_COUNTRIES } = await import('../app/travel/travelVegaSpecs.js');
    
    return {
      TravelAgentManager,
      SpecCreator,
      createWorldTravelMapVegaSpec,
      CLICKABLE_COUNTRIES
    };
  } catch (error) {
    console.error('❌ Failed to import real travel agent system:', error);
    console.log('🔧 Using fallback implementation...');
    return null;
  }
}

/**
 * Real Chart Generation Engine using the actual travel agent system
 */
class RealChartGenerationEngine {
  constructor() {
    this.agentManager = null;
    this.SpecCreator = null;
    this.createWorldTravelMapVegaSpec = null;
    this.CLICKABLE_COUNTRIES = null;
  }

  async initialize() {
    console.log('🔧 Initializing real travel agent system...');
    
    const modules = await initializeRealAgents();
    if (!modules) {
      throw new Error('Failed to initialize real travel agent system');
    }

    this.agentManager = new modules.TravelAgentManager();
    this.SpecCreator = modules.SpecCreator;
    this.createWorldTravelMapVegaSpec = modules.createWorldTravelMapVegaSpec;
    this.CLICKABLE_COUNTRIES = modules.CLICKABLE_COUNTRIES;

    // Validate the system (checks OpenAI API key, etc.)
    const validation = this.agentManager.validateSystem();
    if (!validation.isValid) {
      throw new Error(`System validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('✅ Real travel agent system initialized successfully');
    console.log(`📋 Available agents: ${this.agentManager.getAvailableChartTypes().join(', ')}`);
  }

  async processInputFile(inputFilePath, outputFilePath) {
    try {
      console.log('🚀 Starting real chart generation with travel agents...');
      console.log(`📂 Input: ${inputFilePath}`);
      console.log(`📂 Output: ${outputFilePath}`);
      
      await this.initialize();
      
      // Load input data
      const inputData = this.loadInputData(inputFilePath);
      console.log(`📊 Loaded ${this.getTotalCharts(inputData)} charts from ${Object.keys(inputData.sentences || inputData).length} sentence(s)`);
      
      // Process using the same approach as demoGenerator.ts
      const results = await this.processAllChartsWithRealAgents(inputData);
      
      // Save results
      this.saveResults(results, outputFilePath);
      
      console.log('✅ Real chart generation completed successfully!');
      console.log(`📈 Generated ${results.charts.length} charts total`);
      console.log(`✅ Success: ${results.metadata.successful}, ❌ Failed: ${results.metadata.failed}`);
      
    } catch (error) {
      console.error('❌ Chart generation failed:', error.message);
      throw error;
    }
  }

  loadInputData(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      console.log(`📖 Reading input file: ${absolutePath}`);
      
      const rawData = fs.readFileSync(absolutePath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Handle both old array format and new object format
      if (Array.isArray(data)) {
        return { sentences: data };
      } else if (data.sentences) {
        return data;
      } else {
        // Convert object keys to sentences format
        const sentences = {};
        Object.keys(data).forEach(key => {
          sentences[key] = data[key];
        });
        return { sentences };
      }
    } catch (error) {
      throw new Error(`Failed to load input file: ${error.message}`);
    }
  }

  getTotalCharts(inputData) {
    const sentences = inputData.sentences || inputData;
    return Object.values(sentences).reduce((total, sentence) => {
      return total + (sentence.charts ? sentence.charts.length : 0);
    }, 0);
  }

  async processAllChartsWithRealAgents(inputData) {
    const sentences = inputData.sentences || inputData;
    const startTime = Date.now();
    
    const results = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRequests: this.getTotalCharts(inputData),
        successful: 0,
        failed: 0,
        agentTypes: this.agentManager.getAvailableChartTypes(),
        processingTimeMs: 0
      },
      sentences: {},
      charts: [],
      systemInfo: {
        availableAgents: this.agentManager.getAvailableChartTypes().map(type => ({
          type,
          info: this.agentManager.getAgentInfo(type)
        }))
      }
    };
    
    let chartIndex = 0;
    
    // Process each sentence
    for (const [sentenceId, sentenceData] of Object.entries(sentences)) {
      console.log(`\n📝 Processing sentence: ${sentenceId}`);
      
      const processedSentence = {
        ...sentenceData,
        charts: []
      };
      
      // Process each chart in the sentence
      if (sentenceData.charts && Array.isArray(sentenceData.charts)) {
        for (let i = 0; i < sentenceData.charts.length; i++) {
          const chart = sentenceData.charts[i];
          chartIndex++;
          
          const chartType = this.extractChartType(chart);
          console.log(`  📊 [${chartIndex}/${results.metadata.totalRequests}] Calling ${chartType}Agent...`);
          
          const processedChart = await this.processChartWithRealAgent(chart, chartIndex);
          
          processedSentence.charts.push(processedChart);
          results.charts.push(processedChart);
          
          if (processedChart.success) {
            results.metadata.successful++;
            console.log(`    ✅ ${chartType}Agent generated successfully (${processedChart.generationTime}ms)`);
          } else {
            results.metadata.failed++;
            console.log(`    ❌ ${chartType}Agent failed: ${processedChart.error}`);
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      results.sentences[sentenceId] = processedSentence;
    }
    
    results.metadata.processingTimeMs = Date.now() - startTime;
    return results;
  }

  extractChartType(chart) {
    if (chart.request && chart.request.constraints) {
      return chart.request.constraints.chartType;
    }
    return chart.chartType || 'unknown';
  }

  async processChartWithRealAgent(chart, chartIndex) {
    const startTime = Date.now();
    const chartId = `chart-${chartIndex}`;
    
    try {
      // Extract the request (handle both formats)
      let request;
      if (chart.request) {
        request = chart.request;
      } else {
        // Convert old format to request format
        request = {
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

      const chartType = request.constraints?.chartType;
      console.log(`    🤖 Calling ${chartType}Agent with query: "${request.userQuery}"`);

      // THIS IS THE KEY PART: Use the same logic as demoGenerator.ts
      
      // Check if this is a map chart - handle specially (same as demoGenerator.ts)
      if (request.constraints?.chartType === 'map') {
        console.log(`    🗺️  Generating map chart directly...`);
        
        const selectedCountries = request.constraints?.selectedCountries || [];
        const nodeSize = request.constraints?.nodeSize || 'xlarge';
        
        // Use the real map generation function
        const vegaSpec = this.createWorldTravelMapVegaSpec({
          width: nodeSize === 'xlarge' ? 800 : 400,
          height: nodeSize === 'xlarge' ? 350 : 200,
          background: "#7ec2ddff",
          options: {
            selectableCountries: this.CLICKABLE_COUNTRIES,
            selectedCountries: selectedCountries
          }
        });

        const chartSpec = {
          subtitle: `Selected countries: {${selectedCountries.join(', ')}}`
        };
        
        const generationTime = Date.now() - startTime;
        
        return {
          id: chartId,
          name: chart.name || `Map Chart ${chartIndex}`,
          request: request,
          chartSpec: chartSpec,
          vegaSpec: vegaSpec,
          generationTime: generationTime,
          success: true,
          error: null
        };

      } else {
        // THIS IS THE REAL PART: Call the actual TravelAgentManager like demoGenerator.ts does
        console.log(`    🧠 Making real LLM call through ${chartType}Agent...`);
        
        const response = await this.agentManager.generateTravelChart(request);
        const generationTime = Date.now() - startTime;
        
        if (response.success && response.chartSpec) {
          // Try to create Vega spec using real SpecCreator (same as demoGenerator.ts)
          let vegaSpec = null;
          try {
            const convertedSpec = this.convertToChartSpec(response.chartSpec);
            vegaSpec = this.SpecCreator.create(convertedSpec);
          } catch (specError) {
            console.log(`    ⚠️  Chart generated but SpecCreator failed: ${specError}`);
          }
          
          return {
            id: chartId,
            name: chart.name || `${chartType} Chart ${chartIndex}`,
            request: request,
            chartSpec: response.chartSpec,
            vegaSpec: vegaSpec,
            generationTime: generationTime,
            success: true,
            error: null
          };

        } else {
          throw new Error(response.error || 'Generation failed');
        }
      }
      
    } catch (error) {
      const generationTime = Date.now() - startTime;
      
      return {
        id: chartId,
        name: chart.name || `Error Chart ${chartIndex}`,
        request: null,
        chartSpec: null,
        vegaSpec: null,
        generationTime: generationTime,
        success: false,
        error: error.message
      };
    }
  }

  // Helper function to convert TravelChartSpec to ChartSpec for SpecCreator (same as demoGenerator.ts)
  convertToChartSpec(travelSpec) {
    // Ensure styling has required colors property
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
  }

  saveResults(results, outputFilePath) {
    try {
      const absolutePath = path.resolve(outputFilePath);
      console.log(`💾 Saving results to: ${absolutePath}`);
      
      fs.writeFileSync(absolutePath, JSON.stringify(results, null, 2));
      
      const stats = fs.statSync(absolutePath);
      console.log(`📁 Output file created: ${(stats.size / 1024).toFixed(2)} KB`);
      
    } catch (error) {
      throw new Error(`Failed to save results: ${error.message}`);
    }
  }
}

/**
 * CLI Interface
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('Usage: node generateRealCharts.js <input-file> <output-file>');
    console.log('');
    console.log('This script uses the REAL travel agent system with actual LLM calls:');
    console.log('- DivergingBarAgent for diverging bar charts');
    console.log('- HorizontalBarAgent for horizontal bar charts'); 
    console.log('- PieChartAgent for pie charts');
    console.log('- ScatterChartAgent for scatter plots');
    console.log('- LineChartAgent for line charts');
    console.log('- MultiTypeChartAgent for multi-type charts');
    console.log('');
    console.log('Examples:');
    console.log('  node src/scripts/generateRealCharts.js test.json test_output_real.json');
    console.log('  node src/scripts/generateRealCharts.js example4_data.json example4_output_real.json');
    process.exit(1);
  }
  
  const [inputFile, outputFile] = args;
  
  console.log('🌟 Real Travel Agent Chart Generation System');
  console.log('===========================================');
  console.log('🎯 Using actual OpenAI API calls through specialized agents');
  
  const engine = new RealChartGenerationEngine();
  
  engine.processInputFile(inputFile, outputFile)
    .then(() => {
      console.log('\n🎉 All done! Charts generated using REAL travel agents with LLM calls.');
      console.log('🔍 Each chart was processed by its specialized agent:');
      console.log('   - Bar charts → HorizontalBarAgent, DivergingBarAgent, etc.');
      console.log('   - Pie charts → PieChartAgent'); 
      console.log('   - Scatter plots → ScatterChartAgent');
      console.log('   - Line charts → LineChartAgent');
      console.log('   - Multi-type → MultiTypeChartAgent');
    })
    .catch((error) => {
      console.error('\n💥 Real generation failed:', error.message);
      process.exit(1);
    });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { RealChartGenerationEngine };