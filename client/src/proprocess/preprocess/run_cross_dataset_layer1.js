const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Read the all_generated_propositions.json file
async function loadPropositions() {
    const propositionsPath = path.join(__dirname, '../../..', 'public', 'data', 'narrative_propositions', 'all_generated_propositions.json');
    const data = await fs.readFile(propositionsPath, 'utf8');
    return JSON.parse(data);
}

// Create a temporary JSON file for a single proposition
async function createTempPropositionFile(proposition, category, index) {
    const tempData = {
        type: "cross_dataset",
        category: category,
        proposition_id: `cross_dataset_${category}_${index + 1}`,
        ...proposition
    };
    
    const tempFilePath = path.join(__dirname, `temp_${category}_${index + 1}.json`);
    await fs.writeFile(tempFilePath, JSON.stringify(tempData, null, 2));
    return tempFilePath;
}

// Run layer1_cross_dataset.js for a single proposition
async function runLayer1ForProposition(tempFilePath, outputDir, category, index) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['layer1_cross_dataset.js', tempFilePath, outputDir], {
            cwd: __dirname,
            stdio: 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            console.log(`✓ Processed ${category} proposition ${index + 1} (exit code: ${code})`);
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                console.error(`Error processing ${category} proposition ${index + 1}:`, stderr);
                resolve({ stdout, stderr, error: true }); // Continue processing other propositions
            }
        });
        
        child.on('error', (error) => {
            console.error(`Failed to start process for ${category} proposition ${index + 1}:`, error);
            resolve({ error: true });
        });
    });
}

// Clean up temporary files
async function cleanup(tempFiles) {
    for (const tempFile of tempFiles) {
        try {
            await fs.unlink(tempFile);
        } catch (error) {
            console.warn(`Warning: Could not delete temp file ${tempFile}:`, error.message);
        }
    }
}

// Process all propositions in a category
async function processCategoryPropositions(category, propositions) {
    console.log(`\n🚀 Processing ${category} category (${propositions.length} propositions)...`);
    
    // Create output directory for this category
    const outputDir = path.join(__dirname, 'output', 'cross_dataset', category);
    await fs.mkdir(outputDir, { recursive: true });
    
    const tempFiles = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process each proposition
    for (let i = 0; i < propositions.length; i++) {
        const proposition = propositions[i];
        
        try {
            // Create temporary file for this proposition
            const tempFilePath = await createTempPropositionFile(proposition, category, i);
            tempFiles.push(tempFilePath);
            
            // Run layer1.js for this proposition
            const result = await runLayer1ForProposition(tempFilePath, outputDir, category, i);
            
            if (result.error) {
                errorCount++;
            } else {
                successCount++;
            }
            
            // Add a small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Error processing ${category} proposition ${i + 1}:`, error);
            errorCount++;
        }
    }
    
    // Clean up temporary files
    await cleanup(tempFiles);
    
    console.log(`✅ Completed ${category}: ${successCount} success, ${errorCount} errors`);
    return { category, successCount, errorCount, total: propositions.length };
}

// Main function
async function main() {
    try {
        console.log('🔄 Loading cross_dataset propositions...');
        const allPropositions = await loadPropositions();
        const crossDataset = allPropositions.cross_dataset;
        
        if (!crossDataset || !crossDataset.propositions_by_category) {
            throw new Error('No cross_dataset propositions found in the data');
        }
        
        const categories = crossDataset.propositions_by_category;
        const categoryNames = Object.keys(categories);
        
        console.log(`Found ${categoryNames.length} categories:`, categoryNames);
        
        const results = [];
        
        // Process each category
        for (const categoryName of categoryNames) {
            const categoryData = categories[categoryName];
            const propositions = categoryData.propositions || [];
            
            if (propositions.length === 0) {
                console.log(`⚠️  Skipping ${categoryName} - no propositions found`);
                continue;
            }
            
            const result = await processCategoryPropositions(categoryName, propositions);
            results.push(result);
        }
        
        // Summary
        console.log('\n📊 PROCESSING SUMMARY:');
        console.log('========================');
        let totalSuccess = 0;
        let totalErrors = 0;
        let totalProcessed = 0;
        
        for (const result of results) {
            console.log(`${result.category}: ${result.successCount}/${result.total} successful`);
            totalSuccess += result.successCount;
            totalErrors += result.errorCount;
            totalProcessed += result.total;
        }
        
        console.log('========================');
        console.log(`TOTAL: ${totalSuccess}/${totalProcessed} successful, ${totalErrors} errors`);
        
        // Save summary
        const summary = {
            processing_date: new Date().toISOString(),
            total_categories: results.length,
            total_propositions: totalProcessed,
            successful_propositions: totalSuccess,
            failed_propositions: totalErrors,
            results: results
        };
        
        const summaryPath = path.join(__dirname, 'output', 'cross_dataset', 'processing_summary.json');
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`\n📝 Summary saved to: ${summaryPath}`);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
main();
