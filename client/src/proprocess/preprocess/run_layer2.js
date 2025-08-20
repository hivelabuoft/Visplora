#!/usr/bin/env node
const path = require('path');
const { SQLQueryGenerator } = require('./layer2.js');

// Change to the correct directory
process.chdir(__dirname);

// Import and execute main function
(async () => {
  try {
    const generator = new SQLQueryGenerator();
    
    // Paths
    const inputDir = path.join(__dirname, 'output', 'by_dataset');
    const outputDir = path.join(__dirname, 'output_layer2', 'sql_queries', 'by_dataset');
    
    console.log(`📂 Input directory: ${inputDir}`);
    console.log(`📂 Output directory: ${outputDir}`);
    
    await generator.processAllLayer1Output(inputDir, outputDir, 3); // batch size of 3
    
  } catch (error) {
    console.error('❌ Layer 2 processing failed:', error.message);
    process.exit(1);
  }
})();
