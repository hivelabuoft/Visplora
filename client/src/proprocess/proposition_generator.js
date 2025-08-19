const fs = require('fs').promises;
const path = require('path');
const LLMPropositionService = require('./llm_service');

// Load environment variables from .env.local
require('dotenv').config({ path: '../../../.env.local' });

/**
 * Proposition Generator for London Datasets
 * 
 * This script generates data-driven propositions for each dataset and cross-dataset
 * combinations based on the configuration in proposition_config.json
 */

class PropositionGenerator {
    constructor(configPath = '../../../public/data/london_config.json') {
        this.configPath = configPath;
        this.config = null;
        this.outputDir = '../../../public/data/generated_propositions';
        this.llmService = null;
    }

    async initialize() {
        try {
            // Load the config
            const configData = await fs.readFile(this.configPath, 'utf8');
            const fullConfig = JSON.parse(configData);
            
            // Extract the proposition generation config
            this.config = fullConfig.proposition_generation_config;
            
            if (!this.config) {
                throw new Error('proposition_generation_config not found in london_config.json');
            }
            
            // Initialize LLM service
            this.llmService = new LLMPropositionService(this.config.llm_settings || {});
            
            // Ensure output directory exists
            if (this.config.output_settings?.export_path) {
                this.outputDir = this.config.output_settings.export_path;
            }
            
            try {
                await fs.access(this.outputDir);
            } catch {
                await fs.mkdir(this.outputDir, { recursive: true });
            }
            
            console.log('✅ Proposition generator initialized');
            console.log(`📊 Total datasets: ${Object.keys(this.config.datasets).length}`);
            console.log(`🔗 Cross-dataset propositions: ${this.config.cross_dataset_propositions.total_propositions}`);
            console.log(`📁 Output directory: ${this.outputDir}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize proposition generator:', error.message);
            throw error;
        }
    }

    /**
     * Generate propositions for a single dataset
     * @param {string} datasetName - Name of the dataset
     * @param {number} totalProps - Total number of propositions to generate
     * @param {Object} breakdown - Breakdown of propositions by category
     */
    async generatePropositions(datasetName, totalProps, breakdown, datasetMetadata = {}) {
        console.log(`\n📊 Generating ${totalProps} propositions for dataset: ${datasetName}`);
        console.log(`   Complexity Score: ${datasetMetadata.complexity_score || 'N/A'}`);
        
        const propositions = {
            dataset: datasetName,
            total_count: totalProps,
            complexity_score: datasetMetadata.complexity_score,
            complexity_factors: datasetMetadata.complexity_factors,
            categories: {},
            generated_at: new Date().toISOString(),
            metadata: {
                llm_model: this.config.llm_settings?.model || 'gpt-4',
                temperature: this.config.llm_settings?.temperature || 0.7,
                justification: datasetMetadata.justification
            }
        };

        // Generate propositions for each category
        for (const [category, count] of Object.entries(breakdown)) {
            console.log(`  🔍 Generating ${count} propositions for category: ${category}`);
            
            try {
                // Use LLM service to generate propositions
                const generatedProps = await this.llmService.generateDatasetPropositions(
                    datasetName, 
                    category, 
                    count,
                    datasetMetadata
                );
                
                propositions.categories[category] = {
                    count: count,
                    propositions: generatedProps
                };
            } catch (error) {
                console.warn(`  ⚠️  LLM generation failed for ${category}, using placeholder:`, error.message);
                // Fallback to placeholder
                propositions.categories[category] = {
                    count: count,
                    propositions: this.generatePlaceholderPropositions(datasetName, category, count)
                };
            }
        }

        // Save propositions to file
        const outputFile = path.join(this.outputDir, `${datasetName}_propositions.json`);
        await fs.writeFile(outputFile, JSON.stringify(propositions, null, 2), 'utf8');
        
        console.log(`  ✅ Saved ${totalProps} propositions to ${outputFile}`);
        return propositions;
    }

    /**
     * Generate cross-dataset propositions
     * @param {Object} crossDatasetConfig - Configuration for cross-dataset propositions
     */
    async generateCrossDatasetPropositions(crossDatasetConfig) {
        console.log(`\n🔗 Generating cross-dataset propositions`);
        console.log(`📈 Total propositions: ${crossDatasetConfig.total_propositions}`);
        
        const crossPropositions = {
            type: 'cross_dataset',
            total_count: crossDatasetConfig.total_propositions,
            categories: {},
            temporal_overlap_opportunities: crossDatasetConfig.temporal_overlap_opportunities,
            generated_at: new Date().toISOString(),
            metadata: {
                llm_model: this.config.llm_settings?.model || 'gpt-4',
                temperature: this.config.llm_settings?.temperature || 0.7
            }
        };

        // Generate propositions for each cross-dataset category
        for (const [category, count] of Object.entries(crossDatasetConfig.categories)) {
            console.log(`  🔍 Generating ${count} cross-dataset propositions for: ${category}`);
            
            // Get relevant datasets for this category from temporal overlap opportunities
            const relevantDatasets = this.getRelevantDatasetsForCategory(category, crossDatasetConfig);
            console.log(`    📋 Datasets involved: ${relevantDatasets.join(', ')}`);
            
            try {
                // Use LLM service to generate cross-dataset propositions
                const generatedProps = await this.llmService.generateCrossDatasetPropositions(
                    category,
                    relevantDatasets,
                    count,
                    this.config.datasets // Pass all dataset metadata
                );
                
                crossPropositions.categories[category] = {
                    count: count,
                    datasets: relevantDatasets,
                    propositions: generatedProps
                };
            } catch (error) {
                console.warn(`  ⚠️  LLM generation failed for ${category}, using placeholder:`, error.message);
                // Fallback to placeholder
                crossPropositions.categories[category] = {
                    count: count,
                    datasets: relevantDatasets,
                    propositions: this.generatePlaceholderCrossDatasetPropositions(category, { 
                        count, 
                        datasets: relevantDatasets 
                    })
                };
            }
        }

        // Save cross-dataset propositions to file
        const outputFile = path.join(this.outputDir, 'cross_dataset_propositions.json');
        await fs.writeFile(outputFile, JSON.stringify(crossPropositions, null, 2), 'utf8');
        
        console.log(`  ✅ Saved ${crossDatasetConfig.total_propositions} cross-dataset propositions to ${outputFile}`);
        return crossPropositions;
    }

    /**
     * Get relevant datasets for a cross-dataset category
     * @private
     */
    getRelevantDatasetsForCategory(category, crossDatasetConfig) {
        const overlapOpportunities = crossDatasetConfig.temporal_overlap_opportunities;
        
        switch (category) {
            case 'economic_correlations':
                return ['income', 'house-prices', 'private-rent', 'restaurants'];
            case 'demographic_patterns':
                return ['ethnicity', 'country-of-births', 'population'];
            case 'infrastructure_relationships':
                return ['schools-colleges', 'libraries', 'gyms', 'vehicles'];
            case 'temporal_lag_analysis':
                // Use datasets from lag relationships
                return overlapOpportunities['2019_2023_overlap'] || ['income', 'house-prices'];
            case 'gentrification_indicators':
                return ['income', 'house-prices', 'ethnicity', 'restaurants'];
            default:
                // Fallback to recent overlap datasets
                return overlapOpportunities['2022_2023_overlap'] || ['crime-rates', 'population'];
        }
    }

    /**
     * Generate placeholder propositions (to be replaced with LLM calls)
     * @param {string} datasetName - Name of the dataset
     * @param {string} category - Category of propositions
     * @param {number} count - Number of propositions to generate
     */
    generatePlaceholderPropositions(datasetName, category, count) {
        const propositions = [];
        for (let i = 1; i <= count; i++) {
            propositions.push({
                id: `${datasetName}_${category}_${i}`,
                text: `[LLM Generated] ${category} proposition ${i} for ${datasetName} dataset`,
                confidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7 and 1.0
                data_references: [`${datasetName}.csv`],
                generated_by: 'placeholder'
            });
        }
        return propositions;
    }

    /**
     * Generate placeholder cross-dataset propositions (to be replaced with LLM calls)
     * @param {string} category - Category of propositions
     * @param {Object} categoryConfig - Configuration for the category
     */
    generatePlaceholderCrossDatasetPropositions(category, categoryConfig) {
        const propositions = [];
        for (let i = 1; i <= categoryConfig.count; i++) {
            propositions.push({
                id: `cross_${category}_${i}`,
                text: `[LLM Generated] Cross-dataset ${category} proposition ${i} involving ${categoryConfig.datasets.join(', ')}`,
                confidence: Math.random() * 0.3 + 0.7, // Random confidence between 0.7 and 1.0
                data_references: categoryConfig.datasets.map(ds => `${ds}.csv`),
                datasets_involved: categoryConfig.datasets,
                generated_by: 'placeholder'
            });
        }
        return propositions;
    }

    /**
     * Main execution method
     */
    async run() {
        try {
            await this.initialize();
            
            console.log('\n🚀 Starting proposition generation...\n');
            
            // Track statistics
            let totalSingleDatasetPropositions = 0;
            let totalCrossDatasetPropositions = 0;
            
            // Generate propositions for each dataset
            console.log('📊 SINGLE DATASET PROPOSITIONS');
            console.log('================================');
            
            for (const [datasetName, datasetConfig] of Object.entries(this.config.datasets)) {
                const totalProps = datasetConfig.total_propositions;
                const breakdown = datasetConfig.proposition_breakdown;
                const metadata = {
                    complexity_score: datasetConfig.complexity_score,
                    complexity_factors: datasetConfig.complexity_factors,
                    justification: datasetConfig.justification
                };
                
                await this.generatePropositions(datasetName, totalProps, breakdown, metadata);
                totalSingleDatasetPropositions += totalProps;
                
                // Small delay to avoid overwhelming output
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Generate cross-dataset propositions
            console.log('\n🔗 CROSS-DATASET PROPOSITIONS');
            console.log('==============================');
            
            const crossDatasetConfig = this.config.cross_dataset_propositions;
            await this.generateCrossDatasetPropositions(crossDatasetConfig);
            totalCrossDatasetPropositions = crossDatasetConfig.total_propositions;

            // Summary
            console.log('\n📈 GENERATION SUMMARY');
            console.log('=====================');
            console.log(`📊 Single dataset propositions: ${totalSingleDatasetPropositions}`);
            console.log(`🔗 Cross-dataset propositions: ${totalCrossDatasetPropositions}`);
            console.log(`🎯 Total propositions: ${totalSingleDatasetPropositions + totalCrossDatasetPropositions}`);
            console.log(`� Expected total (from config): ${this.config.generation_summary?.grand_total || 'N/A'}`);
            console.log(`�📁 Output directory: ${this.outputDir}`);
            console.log(`📊 Dataset complexity distribution:`);
            if (this.config.generation_summary?.complexity_distribution) {
                Object.entries(this.config.generation_summary.complexity_distribution).forEach(([level, datasets]) => {
                    console.log(`   ${level}: ${Array.isArray(datasets) ? datasets.join(', ') : datasets}`);
                });
            }
            console.log('\n✅ Proposition generation completed successfully!');
            
        } catch (error) {
            console.error('\n❌ Proposition generation failed:', error.message);
            throw error;
        }
    }
}

// Export for use as module
module.exports = PropositionGenerator;

// Run directly if this file is executed
if (require.main === module) {
    const generator = new PropositionGenerator();
    generator.run().catch(console.error);
}
