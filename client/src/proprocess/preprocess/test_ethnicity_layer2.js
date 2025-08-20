const { SQLQueryGenerator } = require('./layer2.js');

async function testEthnicityLayer2() {
  console.log('🧪 Testing Layer 2 SQL Generation for Ethnicity Dataset...');
  console.log('========================================================\n');
  
  try {
    const generator = new SQLQueryGenerator();
    
    // Load ethnicity propositions from different categories
    const fs = require('fs');
    const path = require('path');
    
    const inputDir = path.join(__dirname, 'output', 'by_dataset', 'ethnicity');
    
    // Read categorical analysis file
    const catData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'categorical_analysis.json'), 'utf8'
    ));
    
    // Read geographic patterns file
    const geoData = JSON.parse(fs.readFileSync(
      path.join(inputDir, 'geographic_patterns.json'), 'utf8'
    ));
    
    // Select different types of propositions to test
    const testPropositions = [];
    
    // 1. Categorical analysis - donut chart
    if (catData.propositions && catData.propositions.length > 0) {
      testPropositions.push({
        category: 'categorical_analysis',
        proposition: catData.propositions[0] // First categorical proposition
      });
    }
    
    // 2. Geographic patterns - bar chart 
    if (geoData.propositions && geoData.propositions.length > 1) {
      testPropositions.push({
        category: 'geographic_patterns', 
        proposition: geoData.propositions[1] // Second geographic proposition
      });
    }
    
    // 3. Another categorical with different chart type
    const barChartProp = catData.propositions.find(p => p.chart_type.includes('barChart'));
    if (barChartProp) {
      testPropositions.push({
        category: 'categorical_analysis',
        proposition: barChartProp
      });
    }
    
    console.log(`Selected ${testPropositions.length} ethnicity propositions to test:\n`);
    
    const results = [];
    
    // Process each selected proposition
    for (let i = 0; i < testPropositions.length; i++) {
      const { category, proposition } = testPropositions[i];
      
      console.log(`${i + 1}. Processing ${category}: ${proposition.proposition_id}`);
      console.log(`   Original: ${proposition.original_proposition}`);
      console.log(`   Chart Type: ${proposition.chart_type}`);
      console.log(`   Time Period: ${proposition.time_period}`);
      console.log(`   Variables: ${JSON.stringify(proposition.variables_needed)}`);
      
      try {
        const result = await generator.processSingleProposition(proposition);
        results.push({
          category: category,
          ...result
        });
        
        console.log(`   ✅ Generated SQL successfully`);
        console.log(`   Example: ${JSON.stringify(result.example[0])}`);
        console.log(`   SQL: ${result.sql_query.substring(0, 100)}...`);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          category: category,
          proposition_id: proposition.proposition_id,
          error: error.message,
          sql_query: null
        });
      }
      
      console.log('');
      
      // Small delay between API calls
      if (i < testPropositions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Save results
    const outputData = {
      dataset: 'ethnicity',
      processed_at: new Date().toISOString(),
      total_propositions: results.length,
      successful: results.filter(r => r.sql_query !== null).length,
      failed: results.filter(r => r.sql_query === null).length,
      ethnicity_test_results: results
    };
    
    const outputDir = path.join(__dirname, 'output2');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'ethnicity_layer2_test.json');
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    
    console.log('========================================================');
    console.log('✅ Ethnicity Layer 2 Test completed successfully!');
    console.log(`📊 Total processed: ${results.length}`);
    console.log(`✅ Successful: ${outputData.successful}`);
    console.log(`❌ Failed: ${outputData.failed}`);
    console.log(`📁 Output saved to: ${outputFile}`);
    
    // Print detailed results
    console.log('\n📋 Detailed Results:');
    console.log('===================');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.proposition_id}`);
      console.log(`   Chart: ${result.chart_type}`);
      if (result.sql_query) {
        console.log(`   Example: ${JSON.stringify(result.example[0], null, 2)}`);
        console.log(`   SQL: ${result.sql_query}`);
      } else {
        console.log(`   Error: ${result.error}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testEthnicityLayer2();
