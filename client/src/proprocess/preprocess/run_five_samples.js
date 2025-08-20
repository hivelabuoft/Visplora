#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { SQLQueryGenerator } = require('./layer2.js');

// Change to the correct directory
process.chdir(__dirname);

async function runFivePropositions() {
  try {
    const generator = new SQLQueryGenerator();
    
    console.log('🔄 Running 5 Sample Propositions from Different Datasets...');
    console.log('============================================================\n');
    
    // Read and select one proposition from each dataset
    const inputDir = path.join(__dirname, 'output', 'by_dataset');
    const outputDir = path.join(__dirname, 'output2');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const selectedPropositions = [];
    
    // 1. Crime-rates
    const crimeData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'crime-rates', 'temporal_trends.json'), 'utf8'
    ));
    if (crimeData.propositions && crimeData.propositions.length > 0) {
      selectedPropositions.push({
        dataset: 'crime-rates',
        proposition: crimeData.propositions[0]
      });
    }
    
    // 2. House-prices
    const houseData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'house-prices', 'temporal_trends.json'), 'utf8'
    ));
    if (houseData.propositions && houseData.propositions.length > 0) {
      selectedPropositions.push({
        dataset: 'house-prices',
        proposition: houseData.propositions[0]
      });
    }
    
    // 3. Population
    const popData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'population', 'temporal_trends.json'), 'utf8'
    ));
    if (popData.propositions && popData.propositions.length > 0) {
      selectedPropositions.push({
        dataset: 'population',
        proposition: popData.propositions[0]
      });
    }
    
    // 4. Vehicles
    const vehicleData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'vehicles', 'categorical_analysis.json'), 'utf8'
    ));
    if (vehicleData.propositions && vehicleData.propositions.length > 0) {
      selectedPropositions.push({
        dataset: 'vehicles',
        proposition: vehicleData.propositions[0]
      });
    }
    
    // 5. Private-rent
    const rentData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'private-rent', 'temporal_trends.json'), 'utf8'
    ));
    if (rentData.propositions && rentData.propositions.length > 0) {
      selectedPropositions.push({
        dataset: 'private-rent',
        proposition: rentData.propositions[0]
      });
    }
    
    console.log(`Selected ${selectedPropositions.length} propositions to process:\n`);
    
    const results = [];
    
    // Process each selected proposition
    for (let i = 0; i < selectedPropositions.length; i++) {
      const { dataset, proposition } = selectedPropositions[i];
      
      console.log(`${i + 1}. Processing ${dataset}: ${proposition.proposition_id}`);
      console.log(`   Chart Type: ${proposition.chart_type}`);
      console.log(`   Time Period: ${proposition.time_period}`);
      
      try {
        const result = await generator.processSingleProposition(proposition);
        results.push({
          source_dataset: dataset,
          ...result
        });
        
        console.log(`   ✅ Generated SQL successfully`);
        console.log(`   Example Structure: ${JSON.stringify(result.example[0])}`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          source_dataset: dataset,
          proposition_id: proposition.proposition_id,
          error: error.message,
          sql_query: null
        });
      }
      
      console.log();
      
      // Small delay between API calls
      if (i < selectedPropositions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Save results
    const outputData = {
      processed_at: new Date().toISOString(),
      total_propositions: results.length,
      successful: results.filter(r => r.sql_query !== null).length,
      failed: results.filter(r => r.sql_query === null).length,
      sample_propositions: results
    };
    
    const outputFile = path.join(outputDir, 'five_sample_propositions.json');
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    
    console.log('============================================================');
    console.log('✅ Processing completed successfully!');
    console.log(`📊 Total processed: ${results.length}`);
    console.log(`✅ Successful: ${outputData.successful}`);
    console.log(`❌ Failed: ${outputData.failed}`);
    console.log(`📁 Output saved to: ${outputFile}`);
    
    // Also save individual files for easy viewing
    results.forEach((result, index) => {
      const individualFile = path.join(outputDir, `${result.source_dataset}_sample.json`);
      fs.writeFileSync(individualFile, JSON.stringify(result, null, 2));
    });
    
    console.log(`📁 Individual files saved to: ${outputDir}/`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute
runFivePropositions();
