// Demo Generator - Runs locally to generate demo_output.json
import { TravelAgentManager } from './TravelAgentManager';
import { loadDemoConfig } from './index';
import { SpecCreator } from '../SpecCreator';
import fs from 'fs';
import path from 'path';

interface DemoOutput {
  metadata: {
    generatedAt: string;
    totalRequests: number;
    successful: number;
    failed: number;
    agentTypes: string[];
  };
  charts: Array<{
    id: string;
    name: string;
    request: any;
    chartSpec: any;
    vegaSpec: any;
    generationTime: number;
    success: boolean;
    error: string | null;
  }>;
  autoDetectionTests: Array<{
    query: string;
    suggestions: string[];
  }>;
  systemInfo: {
    availableAgents: Array<{
      type: string;
      info: any;
    }>;
  };
}

// Helper function to convert TravelChartSpec to ChartSpec for SpecCreator
const convertToChartSpec = (travelSpec: any): any => {
  // Ensure styling has required colors property
  const styling = {
    ...travelSpec.config.styling,
    colors: travelSpec.config.styling.colors || ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
  };

  return {
    ...travelSpec,
    config: {
      ...travelSpec.config,
      styling
    }
  };
};

export async function generateDemoData(): Promise<DemoOutput> {
  console.log('🚀 Generating demo data locally...');
  
  // Initialize the agent manager
  const agentManager = new TravelAgentManager();
  
  // Validate system
  const validation = agentManager.validateSystem();
  if (!validation.isValid) {
    throw new Error(`System validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Load demo configuration
  const demoConfig = loadDemoConfig();
  
  const results: DemoOutput = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRequests: demoConfig.demoRequests.length,
      successful: 0,
      failed: 0,
      agentTypes: agentManager.getAvailableChartTypes()
    },
    charts: [],
    autoDetectionTests: [],
    systemInfo: {
      availableAgents: agentManager.getAvailableChartTypes().map(type => ({
        type,
        info: agentManager.getAgentInfo(type)
      }))
    }
  };
  
  // Generate charts sequentially
  for (let i = 0; i < demoConfig.demoRequests.length; i++) {
    const demoReq = demoConfig.demoRequests[i];
    const chartId = `chart-${i}`;
    
    console.log(`[${i + 1}/${demoConfig.demoRequests.length}] Generating: ${demoReq.name}`);
    
    try {
      // Generate chart using AI
      const startTime = Date.now();
      const response = await agentManager.generateTravelChart(demoReq.request);
      const generationTime = Date.now() - startTime;
      
      if (response.success && response.chartSpec) {
        // Try to create Vega spec
        let vegaSpec = null;
        try {
          const convertedSpec = convertToChartSpec(response.chartSpec);
          vegaSpec = SpecCreator.create(convertedSpec);
        } catch (specError) {
          console.log(`  ⚠️  Chart generated but SpecCreator failed: ${specError}`);
        }
        
        results.charts.push({
          id: chartId,
          name: demoReq.name,
          request: demoReq.request,
          chartSpec: response.chartSpec,
          vegaSpec: vegaSpec,
          generationTime: generationTime,
          success: true,
          error: null
        });
        
        results.metadata.successful++;
        console.log(`  ✅ Generated successfully (${generationTime}ms)`);
      } else {
        throw new Error(response.error || 'Generation failed');
      }
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error}`);
      
      results.charts.push({
        id: chartId,
        name: demoReq.name,
        request: demoReq.request,
        chartSpec: null,
        vegaSpec: null,
        generationTime: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      results.metadata.failed++;
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Run auto-detection tests
  for (const query of demoConfig.autoDetectionTests) {
    const suggestions = agentManager.suggestChartTypes(query);
    results.autoDetectionTests.push({
      query,
      suggestions
    });
  }
  
  return results;
}

// Save demo data to file
export async function saveDemoData(data: DemoOutput): Promise<string> {
  // Use absolute path to ensure it works in both dev and build
  const outputPath = path.join(process.cwd(), 'src', 'vegaTemplates', 'travel_agent_simulator', 'demo_output.json');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`📁 Demo data saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error saving demo data:', error);
    
    // Try alternative path in public directory for serving
    const publicPath = path.join(process.cwd(), 'public', 'demo_output.json');
    try {
      fs.writeFileSync(publicPath, JSON.stringify(data, null, 2));
      console.log(`📁 Demo data saved to public directory: ${publicPath}`);
      return publicPath;
    } catch (publicError) {
      throw new Error(`Failed to save demo data: ${error} | Public save also failed: ${publicError}`);
    }
  }
}