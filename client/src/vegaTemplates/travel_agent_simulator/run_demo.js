#!/usr/bin/env node

// Demo Runner - Generates all charts locally and saves to demo_output.json
const { TravelAgentManager } = require('./dist/TravelAgentManager.js');
const { loadDemoConfig } = require('./dist/index.js');
const { SpecCreator } = require('../SpecCreator.tsx');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '../../.env.local' });

async function runDemo() {
  console.log('🚀 Starting Travel Agent Demo Runner...');
  console.log('📋 Loading demo configuration...');
  
  try {
    // Initialize the agent manager
    const agentManager = new TravelAgentManager();
    
    // Validate system
    console.log('🔍 Validating system...');
    const validation = agentManager.validateSystem();
    
    if (!validation.isValid) {
      console.error('❌ System validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    
    console.log('✅ System validation passed');
    
    // Load demo configuration
    const demoConfig = loadDemoConfig();
    console.log(`📊 Loaded ${demoConfig.demoRequests.length} demo scenarios`);
    
    const results = {
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
    console.log('\n🎨 Starting chart generation...\n');
    
    for (let i = 0; i < demoConfig.demoRequests.length; i++) {
      const demoReq = demoConfig.demoRequests[i];
      const chartId = `chart-${i}`;
      
      console.log(`[${i + 1}/${demoConfig.demoRequests.length}] 🚀 Generating: ${demoReq.name}`);
      
      try {
        // Generate chart using AI
        const startTime = Date.now();
        const response = await agentManager.generateTravelChart(demoReq.request);
        const generationTime = Date.now() - startTime;
        
        if (response.success && response.chartSpec) {
          // Try to create Vega spec
          let vegaSpec = null;
          try {
            vegaSpec = SpecCreator.create(response.chartSpec);
            console.log(`  ✅ Generated successfully (${generationTime}ms)`);
          } catch (specError) {
            console.log(`  ⚠️  Chart generated but SpecCreator failed: ${specError.message}`);
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
        } else {
          throw new Error(response.error || 'Generation failed');
        }
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        
        results.charts.push({
          id: chartId,
          name: demoReq.name,
          request: demoReq.request,
          chartSpec: null,
          vegaSpec: null,
          generationTime: 0,
          success: false,
          error: error.message
        });
        
        results.metadata.failed++;
      }
      
      // Add delay between requests
      if (i < demoConfig.demoRequests.length - 1) {
        console.log('  ⏳ Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Run auto-detection tests
    console.log('\n🎯 Running auto-detection tests...');
    for (const query of demoConfig.autoDetectionTests) {
      const suggestions = agentManager.suggestChartTypes(query);
      results.autoDetectionTests.push({
        query,
        suggestions
      });
      console.log(`  "${query}" → [${suggestions.join(', ')}]`);
    }
    
    // Save results to file
    const outputPath = path.join(__dirname, 'demo_output.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    // Summary
    console.log('\n📊 Demo Generation Complete!');
    console.log(`✅ Successful: ${results.metadata.successful}`);
    console.log(`❌ Failed: ${results.metadata.failed}`);
    console.log(`📁 Output saved to: ${outputPath}`);
    
    if (results.metadata.successful > 0) {
      console.log('\n🎉 Demo data ready! You can now use this with the static dashboard.');
    }
    
  } catch (error) {
    console.error('💥 Demo runner crashed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});