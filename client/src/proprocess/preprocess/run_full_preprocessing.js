const { PropositionPreprocessor } = require('./layer1.js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

async function runFullPreprocessing() {
  try {
    console.log('🚀 Starting full proposition preprocessing...');
    console.log('=====================================\n');
    
    const processor = new PropositionPreprocessor();
    
    // Input and output paths
    const inputPath = path.join(__dirname, '../../../public/data/narrative_propositions/all_generated_propositions.json');
    const outputPath = path.join(__dirname, 'output/processed_propositions_complete.json');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`📁 Input file: ${inputPath}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📁 Master output file: ${outputPath}`);
    console.log(`📁 Organized outputs will be saved in: ${path.join(outputDir, 'by_dataset')}\n`);
    
    // Run processing with smaller batch size for better rate limiting
    const batchSize = 5;
    console.log(`⚙️  Processing with batch size: ${batchSize}\n`);
    
    const startTime = Date.now();
    
    await processor.processAllPropositions(inputPath, outputPath, batchSize);
    
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);
    
    console.log('\n=====================================');
    console.log('✅ Full preprocessing completed successfully!');
    console.log(`⏱️  Total processing time: ${processingTime} seconds`);
    console.log('\n📂 Output structure:');
    console.log('   📄 Master file: processed_propositions_complete.json');
    console.log('   📁 by_dataset/');
    console.log('      📁 crime-rates/');
    console.log('         📄 temporal_trends.json');
    console.log('         📄 geographic_patterns.json');
    console.log('         📄 categorical_analysis.json');
    console.log('         📄 cross_dimensional.json');
    console.log('         📄 statistical_patterns.json');
    console.log('         📄 crime-rates_complete.json');
    console.log('      📁 ethnicity/');
    console.log('         📄 geographic_patterns.json');
    console.log('         📄 categorical_analysis.json');
    console.log('         📄 cross_dimensional.json');
    console.log('         📄 statistical_patterns.json');
    console.log('         📄 ethnicity_complete.json');
    console.log('      📁 ... (and so on for all 12 datasets)');
    
  } catch (error) {
    console.error('❌ Full preprocessing failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runFullPreprocessing();
}

module.exports = { runFullPreprocessing };
