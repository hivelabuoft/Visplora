const { PropositionPreprocessor } = require('./layer1.js');

// Test fallback processing including 3D dimension inference
async function testFallbackProcessing() {
  try {
    console.log('Testing fallback processing with 3D dimension inference...');
    
    const processor = new PropositionPreprocessor();
    
    // Create a test proposition that will force fallback (simulating API failure)
    const testProposition = {
      id: 'fallback_test',
      proposition: "Income inequality is particularly pronounced in certain London boroughs, with some areas showing median income levels 40% above the London average.",
      variables_needed: ['borough_name', 'median_income', 'income_bracket', 'population_count'],
      time_period: '2023',
      geographic_level: 'borough',
      complexity_level: 'medium',
      suggested_visualization: 'bar chart'
    };

    // Test the 3D dimension inference method directly
    console.log('\n--- Testing 3D Dimension Inference ---');
    const incomeDimension = processor.inferFallback3DDimension('income-levels', 'demographic_patterns');
    const crimeDimension = processor.inferFallback3DDimension('crime-rates', 'geographic_patterns');
    const housingDimension = processor.inferFallback3DDimension('housing-tenure', 'demographic_patterns');
    
    console.log('Income dataset -> 3D dimension:', incomeDimension);
    console.log('Crime dataset -> 3D dimension:', crimeDimension);
    console.log('Housing dataset -> 3D dimension:', housingDimension);

    // Test enhanced TAPAS question generation
    console.log('\n--- Testing Enhanced TAPAS Questions ---');
    
    // Test with mean line chart
    const meanQuestions = processor.generateTapasQuestions(testProposition, 'barChart_with_mean_2D');
    console.log('Mean line chart questions:', meanQuestions);
    
    // Test with threshold chart
    const thresholdQuestions = processor.generateTapasQuestions(testProposition, 'barChart_with_threshold_3D');
    console.log('Threshold 3D chart questions:', thresholdQuestions);
    
    // Test with scatter plot
    const scatterQuestions = processor.generateTapasQuestions(testProposition, 'scatterPlot_simple_2D');
    console.log('Scatter plot questions:', scatterQuestions);

    console.log('\n✅ Fallback processing tests completed successfully!');

  } catch (error) {
    console.error('❌ Fallback test failed:', error.message);
  }
}

testFallbackProcessing();
