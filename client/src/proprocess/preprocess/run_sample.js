const { PropositionPreprocessor } = require('./layer1.js');
const path = require('path');

// Process a limited set of propositions for demonstration
async function runLimitedPreprocessing() {
  try {
    console.log('Running limited preprocessing (20 propositions per dataset)...');
    
    const inputPath = path.join(process.cwd(), 'public/data/narrative_propositions/all_generated_propositions.json');
    const outputPath = path.join(process.cwd(), 'public/data/narrative_propositions/sample_processed_propositions.json');
    
    const preprocessor = new PropositionPreprocessor();
    const data = preprocessor.loadPropositions(inputPath);
    const processedPropositions = [];
    
    let totalProcessed = 0;
    const maxPerDataset = 20;
    
    console.log(`Processing up to ${maxPerDataset} propositions per dataset...`);
    
    // Process limited propositions from each dataset
    for (const [datasetName, datasetInfo] of Object.entries(data.datasets)) {
      console.log(`\nProcessing dataset: ${datasetName}`);
      let datasetCount = 0;
      
      // Process each category within the dataset
      for (const [categoryName, propositions] of Object.entries(datasetInfo.categories)) {
        console.log(`  Processing category: ${categoryName}`);
        
        for (const prop of propositions) {
          if (datasetCount >= maxPerDataset) break;
          
          console.log(`    Processing ${datasetCount + 1}/${maxPerDataset}: ${prop.id}`);
          
          try {
            const result = await preprocessor.processProposition(prop, datasetName, categoryName);
            processedPropositions.push(result);
            totalProcessed++;
            datasetCount++;
            
            // Small delay between requests to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 800));
            
          } catch (error) {
            console.error(`    Error processing ${prop.id}:`, error.message);
          }
        }
        
        if (datasetCount >= maxPerDataset) break;
      }
    }
    
    // Save processed results
    const output = {
      processed_at: new Date().toISOString(),
      total_processed: processedPropositions.length,
      sample_run: true,
      max_per_dataset: maxPerDataset,
      processing_summary: {
        by_dataset: summarizeByDataset(processedPropositions),
        by_chart_type: summarizeByChartType(processedPropositions),
        by_complexity: summarizeByComplexity(processedPropositions)
      },
      propositions: processedPropositions
    };
    
    require('fs').writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Sample preprocessing completed!`);
    console.log(`Processed ${processedPropositions.length} propositions`);
    console.log(`Output saved to: ${outputPath}`);
    
    // Show summary statistics
    console.log('\n--- Processing Summary ---');
    console.log('By Dataset:', output.processing_summary.by_dataset);
    console.log('By Chart Type:', Object.keys(output.processing_summary.by_chart_type).slice(0, 5));
    
  } catch (error) {
    console.error('Sample preprocessing failed:', error);
  }
}

function summarizeByDataset(propositions) {
  const summary = {};
  propositions.forEach(prop => {
    summary[prop.dataset] = (summary[prop.dataset] || 0) + 1;
  });
  return summary;
}

function summarizeByChartType(propositions) {
  const summary = {};
  propositions.forEach(prop => {
    summary[prop.chart_type] = (summary[prop.chart_type] || 0) + 1;
  });
  return summary;
}

function summarizeByComplexity(propositions) {
  const summary = {};
  propositions.forEach(prop => {
    summary[prop.complexity_level] = (summary[prop.complexity_level] || 0) + 1;
  });
  return summary;
}

runLimitedPreprocessing();
