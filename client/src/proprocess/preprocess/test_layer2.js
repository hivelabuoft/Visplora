const { SQLQueryGenerator } = require('./layer2.js');

async function testLayer2() {
  console.log('🧪 Testing Layer 2 SQL Generation (Different Chart Types)...');
  
  try {
    const generator = new SQLQueryGenerator();
    
    // Test different chart types
    const testPropositions = [
      {
        "proposition_id": "test_001",
        "dataset": "crime-rates",
        "chart_type": "lineChart_simple_2D",
        "variables_needed": ["crime_category", "date", "count"],
        "time_period": "2022-2023"
      },
      {
        "proposition_id": "test_002", 
        "dataset": "country-of-births",
        "chart_type": "donutChart_simple_3D",
        "variables_needed": ["country_of_birth", "population_count"],
        "time_period": "2018"
      },
      {
        "proposition_id": "test_003",
        "dataset": "crime-rates",
        "chart_type": "groupedBarChart_simple_2D", 
        "variables_needed": ["borough_name", "crime_category", "count"],
        "time_period": "2022"
      },
      {
        "proposition_id": "test_004",
        "dataset": "crime-rates",
        "chart_type": "barChart_with_mean_2D",
        "variables_needed": ["borough_name", "count"],
        "time_period": "2022"
      }
    ];
    
    for (const testProp of testPropositions) {
      console.log(`\n📊 Testing: ${testProp.chart_type}`);
      console.log('='.repeat(50));
      
      const result = await generator.processSingleProposition(testProp);
      console.log(JSON.stringify(result, null, 2));
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLayer2();
