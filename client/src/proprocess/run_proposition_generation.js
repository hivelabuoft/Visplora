const fs = require('fs').promises;
const path = require('path');
const LLMPropositionService = require('./llm_service');

// Load environment variables from .env.local
require('dotenv').config({ path: '../../.env.local' });

/**
 * Enhanced Proposition Generator for London Datasets
 * 
 * This script generates comprehensive data-driven propositions using GPT-4o
 * and saves all results to public/data/generated_propositions
 */

class EnhancedPropositionGenerator {
    constructor() {
        this.configPath = '../../public/data/london_config.json';
        this.outputDir = '../../public/data/generated_propositions';
        this.config = null;
        this.llmService = null;
    }

    async initialize() {
        console.log('🔧 Initializing Enhanced Proposition Generator...');
        
        // Check if OpenAI API key is available
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
            console.warn('   The system will use mock responses instead of actual LLM calls');
        } else {
            console.log('✅ OpenAI API key found');
        }

        // Load config
        const configData = await fs.readFile(this.configPath, 'utf8');
        const fullConfig = JSON.parse(configData);
        this.config = fullConfig.proposition_generation_config;
        
        if (!this.config) {
            throw new Error('proposition_generation_config not found in london_config.json');
        }

        // Initialize LLM service
        this.llmService = new LLMPropositionService(this.config.llm_settings || {});

        // Ensure output directory exists
        try {
            await fs.access(this.outputDir);
        } catch {
            await fs.mkdir(this.outputDir, { recursive: true });
        }

        console.log('✅ Initialization complete');
        console.log(`📊 Datasets to process: ${Object.keys(this.config.datasets).length}`);
        console.log(`🔗 Cross-dataset propositions: ${this.config.cross_dataset_propositions.total_propositions}`);
        console.log(`📁 Output directory: ${this.outputDir}`);
    }

    async generateAllPropositions() {
        console.log('\n🚀 Starting comprehensive proposition generation...\n');

        const allResults = {
            generated_at: new Date().toISOString(),
            llm_model: this.config.llm_settings?.model || 'gpt-4o',
            total_datasets: Object.keys(this.config.datasets).length,
            datasets: {},
            cross_dataset: null,
            summary: {
                individual_dataset_propositions: 0,
                cross_dataset_propositions: 0,
                grand_total: 0,
                processing_time_seconds: 0
            }
        };

        const startTime = Date.now();
        let totalIndividualProps = 0;
        let processedDatasets = 0;

        // Process individual datasets
        console.log('📊 PROCESSING INDIVIDUAL DATASETS');
        console.log('='.repeat(40));

        for (const [datasetName, datasetConfig] of Object.entries(this.config.datasets)) {
            console.log(`\n[${++processedDatasets}/${Object.keys(this.config.datasets).length}] Processing: ${datasetName}`);
            console.log(`   Target propositions: ${datasetConfig.total_propositions}`);
            console.log(`   Complexity score: ${datasetConfig.complexity_score}/10`);

            const metadata = {
                ...datasetConfig,
                total_propositions: datasetConfig.total_propositions,
                proposition_breakdown: datasetConfig.proposition_breakdown
            };

            try {
                // Generate propositions for this dataset
                const datasetResult = await this.processDataset(datasetName, metadata);
                allResults.datasets[datasetName] = datasetResult;
                totalIndividualProps += datasetConfig.total_propositions;

                console.log(`   ✅ Generated ${datasetConfig.total_propositions} propositions`);
            } catch (error) {
                console.error(`   ❌ Failed to process ${datasetName}:`, error.message);
                // Continue with other datasets
            }

            // Brief pause between datasets
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Process cross-dataset propositions
        console.log('\n🔗 PROCESSING CROSS-DATASET PROPOSITIONS');
        console.log('='.repeat(40));

        try {
            const crossDatasetResult = await this.processCrossDatasetPropositions(
                this.config.cross_dataset_propositions
            );
            allResults.cross_dataset = crossDatasetResult;
            console.log(`   ✅ Generated ${this.config.cross_dataset_propositions.total_propositions} cross-dataset propositions`);
        } catch (error) {
            console.error('   ❌ Failed to process cross-dataset propositions:', error.message);
        }

        // Finalize results
        const endTime = Date.now();
        const processingTime = Math.round((endTime - startTime) / 1000);

        allResults.summary.individual_dataset_propositions = totalIndividualProps;
        allResults.summary.cross_dataset_propositions = this.config.cross_dataset_propositions.total_propositions;
        allResults.summary.grand_total = totalIndividualProps + this.config.cross_dataset_propositions.total_propositions;
        allResults.summary.processing_time_seconds = processingTime;

        // Save comprehensive results file
        const allPropositionsFile = path.join(this.outputDir, 'all_generated_propositions.json');
        await fs.writeFile(
            allPropositionsFile, 
            JSON.stringify(allResults, null, 2), 
            'utf8'
        );

        // Save summary file for quick access
        const summaryFile = path.join(this.outputDir, 'generation_summary.json');
        await fs.writeFile(
            summaryFile,
            JSON.stringify({
                generated_at: allResults.generated_at,
                summary: allResults.summary,
                dataset_list: Object.keys(allResults.datasets)
            }, null, 2),
            'utf8'
        );

        // Final summary
        console.log('\n📈 GENERATION COMPLETE');
        console.log('='.repeat(30));
        console.log(`📊 Individual dataset propositions: ${allResults.summary.individual_dataset_propositions}`);
        console.log(`🔗 Cross-dataset propositions: ${allResults.summary.cross_dataset_propositions}`);
        console.log(`🎯 Total propositions generated: ${allResults.summary.grand_total}`);
        console.log(`⏱️  Processing time: ${processingTime} seconds`);
        console.log(`📁 Output directory: ${this.outputDir}`);
        console.log(`📄 Comprehensive file: ${allPropositionsFile}`);
        console.log(`📋 Summary file: ${summaryFile}`);
        console.log('\n✅ All proposition generation completed successfully!');

        return allResults;
    }

    async processDataset(datasetName, metadata) {
        const result = {
            dataset_name: datasetName,
            complexity_score: metadata.complexity_score,
            total_propositions: metadata.total_propositions,
            proposition_breakdown: metadata.proposition_breakdown,
            generated_at: new Date().toISOString(),
            categories: {}
        };

        // Generate propositions using LLM service
        const allPropositions = await this.llmService.generateDatasetPropositions(
            datasetName,
            'mixed', // Category parameter (not used in new implementation)
            metadata.total_propositions,
            metadata
        );

        // Organize propositions by category
        const categorizedPropositions = {};
        let propositionIndex = 0;

        for (const [category, count] of Object.entries(metadata.proposition_breakdown)) {
            categorizedPropositions[category] = allPropositions.slice(
                propositionIndex, 
                propositionIndex + count
            );
            propositionIndex += count;
        }

        result.categories = categorizedPropositions;

        // Save individual dataset file
        const datasetFile = path.join(this.outputDir, `${datasetName}_propositions.json`);
        await fs.writeFile(datasetFile, JSON.stringify(result, null, 2), 'utf8');

        return result;
    }

    async processCrossDatasetPropositions(crossConfig) {
        const result = {
            type: 'cross_dataset',
            total_propositions: crossConfig.total_propositions,
            categories: crossConfig.categories,
            temporal_overlap_opportunities: crossConfig.temporal_overlap_opportunities,
            generated_at: new Date().toISOString(),
            propositions_by_category: {}
        };

        // Generate cross-dataset propositions for each category
        for (const [category, count] of Object.entries(crossConfig.categories)) {
            console.log(`   🔍 Processing cross-dataset category: ${category} (${count} propositions)`);

            const relevantDatasets = this.getRelevantDatasetsForCategory(category, crossConfig);
            
            const categoryPropositions = await this.llmService.generateCrossDatasetPropositions(
                category,
                relevantDatasets,
                count,
                this.config.datasets
            );

            result.propositions_by_category[category] = {
                count: count,
                relevant_datasets: relevantDatasets,
                propositions: categoryPropositions
            };
        }

        // Save cross-dataset file
        const crossDatasetFile = path.join(this.outputDir, 'cross_dataset_propositions.json');
        await fs.writeFile(crossDatasetFile, JSON.stringify(result, null, 2), 'utf8');

        return result;
    }

    getRelevantDatasetsForCategory(category, crossConfig) {
        const overlapOpportunities = crossConfig.temporal_overlap_opportunities;
        
        switch (category) {
            case 'economic_correlations':
                return ['income', 'house-prices', 'private-rent', 'restaurants'];
            case 'demographic_patterns':
                return ['ethnicity', 'country-of-births', 'population'];
            case 'infrastructure_relationships':
                return ['schools-colleges', 'libraries', 'gyms', 'vehicles'];
            case 'temporal_lag_analysis':
                return overlapOpportunities['2019_2023_overlap'] || ['income', 'house-prices'];
            case 'gentrification_indicators':
                return ['income', 'house-prices', 'ethnicity', 'restaurants'];
            default:
                return overlapOpportunities['2022_2023_overlap'] || ['crime-rates', 'population'];
        }
    }

    async run() {
        try {
            await this.initialize();
            const results = await this.generateAllPropositions();
            
            console.log('\n🎉 SUCCESS! All propositions have been generated and saved.');
            console.log(`📊 Check the results in: ${this.outputDir}`);
            
            return results;
        } catch (error) {
            console.error('\n💥 GENERATION FAILED:', error.message);
            console.error(error.stack);
            throw error;
        }
    }
}

// Run the enhanced generator
if (require.main === module) {
    const generator = new EnhancedPropositionGenerator();
    generator.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = EnhancedPropositionGenerator;
