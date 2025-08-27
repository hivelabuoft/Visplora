#!/usr/bin/env node

/**
 * Test runner for the Proposition Generator
 * 
 * This script demonstrates how to use the PropositionGenerator
 * and tests the configuration-driven approach.
 */

const PropositionGenerator = require('./proposition_generator');
const path = require('path');

async function runTest() {
    console.log('🚀 Testing Proposition Generator\n');
    
    try {
        // Initialize the generator with the london_config.json file
        const generator = new PropositionGenerator(); // Uses default path to london_config.json
        
        // Run the full proposition generation process
        await generator.run();
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function runSingleDatasetTest() {
    console.log('🧪 Testing Single Dataset Generation\n');
    
    try {
        const generator = new PropositionGenerator();
        await generator.initialize();
        
        // Test single dataset generation
        const testBreakdown = {
            temporal_trends: 3,
            geographic_patterns: 2,
            statistical_patterns: 1
        };
        
        const testMetadata = {
            complexity_score: 8,
            complexity_factors: {
                row_count: 705509,
                temporal_granularity: "monthly",
                geographic_levels: "borough_and_lsoa"
            },
            justification: "High complexity test dataset"
        };
        
        const result = await generator.generatePropositions('crime-rates', 6, testBreakdown, testMetadata);
        
        console.log('\n📊 Single Dataset Test Results:');
        console.log(`Dataset: ${result.dataset}`);
        console.log(`Total propositions: ${result.total_count}`);
        console.log(`Categories: ${Object.keys(result.categories).length}`);
        
        // Show sample propositions
        for (const [category, data] of Object.entries(result.categories)) {
            console.log(`\n  ${category} (${data.count} propositions):`);
            data.propositions.slice(0, 2).forEach(prop => {
                console.log(`    • ${prop.text}`);
            });
        }
        
    } catch (error) {
        console.error('Single dataset test failed:', error.message);
    }
}

async function runCrossDatasetTest() {
    console.log('\n🔗 Testing Cross-Dataset Generation\n');
    
    try {
        const generator = new PropositionGenerator();
        await generator.initialize();
        
        // Test cross-dataset generation
        const crossConfig = {
            total_propositions: 4,
            categories: {
                economic_correlations: 2,
                demographic_patterns: 2
            },
            temporal_overlap_opportunities: {
                "2022_2023_overlap": ["crime-rates", "population"],
                "economic_datasets": ["income", "house-prices"]
            }
        };
        
        const result = await generator.generateCrossDatasetPropositions(crossConfig);
        
        console.log('🔗 Cross-Dataset Test Results:');
        console.log(`Total propositions: ${result.total_count}`);
        console.log(`Categories: ${Object.keys(result.categories).length}`);
        
        // Show sample propositions
        for (const [category, data] of Object.entries(result.categories)) {
            console.log(`\n  ${category} (${data.count} propositions):`);
            console.log(`    Datasets: ${data.datasets ? data.datasets.join(', ') : 'Various'}`);
            data.propositions.slice(0, 1).forEach(prop => {
                console.log(`    • ${prop.text}`);
            });
        }
        
    } catch (error) {
        console.error('Cross-dataset test failed:', error.message);
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'full':
        runTest();
        break;
    case 'single':
        runSingleDatasetTest();
        break;
    case 'cross':
        runCrossDatasetTest();
        break;
    case 'test':
        (async () => {
            await runSingleDatasetTest();
            await runCrossDatasetTest();
        })();
        break;
    default:
        console.log(`
Usage: node test_runner.js [command]

Commands:
  full    Run the complete proposition generation process
  single  Test single dataset proposition generation
  cross   Test cross-dataset proposition generation  
  test    Run both single and cross-dataset tests
  
Examples:
  node test_runner.js full
  node test_runner.js test
        `);
}
