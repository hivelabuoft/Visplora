const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai').default;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Dataset schema mapping for cross-dataset analysis
const DATASET_SCHEMAS = {
    'crime-rates': {
        table: 'crime_data',
        columns: {
            'borough_name': 'borough',
            'crime_category': 'crime_type', 
            'count': 'count',
            'date': 'date'
        },
        time_column: 'date'
    },
    'income': {
        table: 'income_data',
        columns: {
            'Area': 'area',
            'Mean_income': 'mean_income',
            'Median_income': 'median_income',
            'Year': 'year'
        },
        time_column: 'year'
    },
    'house-prices': {
        table: 'house_price_data',
        columns: {
            'area': 'area',
            'value': 'price',
            'date': 'date'
        },
        time_column: 'date'
    },
    'population': {
        table: 'population_data',
        columns: {
            'area': 'area',
            'value': 'population',
            'category': 'category',
            'date': 'date'
        },
        time_column: 'date'
    },
    'vehicles': {
        table: 'vehicle_data',
        columns: {
            'area': 'area',
            'value': 'vehicle_count',
            'category': 'vehicle_type',
            'date': 'date'
        },
        time_column: 'date'
    },
    'private-rent': {
        table: 'rent_data',
        columns: {
            'area': 'area',
            'value': 'rent_price',
            'date': 'date'
        },
        time_column: 'date'
    },
    'ethnicity': {
        table: 'ethnicity_data',
        columns: {
            'LSOA_code': 'lsoa_code',
            'White_British': 'white_british_pct',
            'Black_African': 'black_african_pct',
            'Asian_Indian': 'asian_indian_pct'
        },
        time_column: 'census_year'
    },
    'schools-colleges': {
        table: 'school_data',
        columns: {
            'area': 'area',
            'value': 'performance_score',
            'category': 'school_type',
            'date': 'date'
        },
        time_column: 'date'
    },
    'libraries': {
        table: 'library_data',
        columns: {
            'area': 'area',
            'value': 'library_count',
            'date': 'date'
        },
        time_column: 'date'
    },
    'gyms': {
        table: 'gym_data',
        columns: {
            'area': 'area',
            'value': 'gym_count',
            'category': 'gym_type',
            'date': 'date'
        },
        time_column: 'date'
    },
    'restaurants': {
        table: 'restaurant_data',
        columns: {
            'area': 'area',
            'value': 'restaurant_count',
            'category': 'cuisine_type',
            'date': 'date'
        },
        time_column: 'date'
    }
};

// Generate time filter for different period formats
function generateTimeFilter(dataset, timePeriod, timeColumn) {
    if (!timePeriod || timePeriod === 'census_snapshot') {
        if (dataset === 'ethnicity') {
            return `${timeColumn} = 2021`; // Latest census
        }
        return '';
    }

    // Handle different time period formats
    if (timePeriod.includes('-')) {
        const parts = timePeriod.split('-');
        if (parts.length === 2) {
            // Range like "2022-2023" or "1995-present"
            const start = parts[0];
            const end = parts[1] === 'present' ? new Date().getFullYear() : parts[1];
            return `${timeColumn} BETWEEN ${start} AND ${end}`;
        }
    }
    
    // Single year
    if (/^\d{4}$/.test(timePeriod)) {
        return `${timeColumn} = ${timePeriod}`;
    }
    
    return '';
}

// Generate chart-specific data structure for cross-dataset
function generateCrossDatasetStructure(datasets, relationshipType, suggestedVisualization) {
    const structures = {
        'scatter_plot': {
            type: 'scatter',
            data: [
                {
                    x: `${datasets[0]}_value`,
                    y: `${datasets[1]}_value`,
                    borough: 'area_name',
                    dataset1: datasets[0],
                    dataset2: datasets[1]
                }
            ]
        },
        'line_chart': {
            type: 'line',
            data: [
                {
                    time: 'time_period',
                    value1: `${datasets[0]}_value`,
                    value2: `${datasets[1]}_value`,
                    area: 'area_name'
                }
            ]
        },
        'bar_chart': {
            type: 'bar',
            data: [
                {
                    category: 'area_name',
                    value1: `${datasets[0]}_value`,
                    value2: `${datasets[1]}_value`,
                    comparison_type: relationshipType
                }
            ]
        },
        'dual_axis_chart': {
            type: 'dual_axis',
            data: [
                {
                    area: 'area_name',
                    primary_value: `${datasets[0]}_value`,
                    secondary_value: `${datasets[1]}_value`,
                    time: 'time_period'
                }
            ]
        },
        'heatmap': {
            type: 'heatmap',
            data: [
                {
                    x_axis: 'area_name',
                    y_axis: 'metric_type',
                    value: 'normalized_value',
                    dataset1: datasets[0],
                    dataset2: datasets[1]
                }
            ]
        }
    };

    return structures[suggestedVisualization] || structures['scatter_plot'];
}

// Create cross-dataset analysis prompt
function createCrossDatasetPrompt(proposition) {
    const { 
        proposition: statement,
        datasets_required,
        variables_needed,
        time_periods,
        relationship_type,
        suggested_visualization 
    } = proposition;

    let datasetQueries = [];
    
    // Generate query components for each dataset
    for (const dataset of datasets_required) {
        const schema = DATASET_SCHEMAS[dataset];
        if (!schema) {
            throw new Error(`Unknown dataset: ${dataset}`);
        }

        const variables = variables_needed[dataset] || [];
        const timePeriod = time_periods[dataset];
        
        // Map variables to actual column names
        const mappedColumns = variables.map(variable => {
            const mappedColumn = schema.columns[variable];
            if (mappedColumn) {
                return `${mappedColumn} AS ${variable}`;
            }
            return variable; // Use original if no mapping found
        });

        // Add area/location column if not already included
        if (!mappedColumns.some(col => col.includes('area') || col.includes('borough'))) {
            if (schema.columns['area']) {
                mappedColumns.push(`${schema.columns['area']} AS area`);
            } else if (schema.columns['borough_name']) {
                mappedColumns.push(`${schema.columns['borough_name']} AS area`);
            } else if (schema.columns['LSOA_code']) {
                mappedColumns.push(`${schema.columns['LSOA_code']} AS area`);
            }
        }

        const selectClause = mappedColumns.join(', ');
        const timeFilter = generateTimeFilter(dataset, timePeriod, schema.time_column);
        
        let whereClause = '';
        if (timeFilter) {
            whereClause = `WHERE ${timeFilter}`;
        }

        const query = `SELECT ${selectClause} FROM ${schema.table} ${whereClause}`;
        
        datasetQueries.push({
            dataset,
            query,
            time_period: timePeriod,
            variables: variables
        });
    }

    const expectedStructure = generateCrossDatasetStructure(
        datasets_required, 
        relationship_type, 
        suggested_visualization
    );

    return `
You are analyzing cross-dataset relationships in London borough data. 

PROPOSITION: "${statement}"

ANALYSIS REQUIREMENTS:
- Relationship Type: ${relationship_type}
- Visualization: ${suggested_visualization}
- Datasets Required: ${datasets_required.join(', ')}

DATASET QUERIES:
${datasetQueries.map(dq => `
${dq.dataset.toUpperCase()} (${dq.time_period}):
${dq.query}
Variables: ${dq.variables.join(', ')}
`).join('\n')}

CROSS-DATASET ANALYSIS TASKS:
1. Join/correlate data across datasets by area/borough
2. Handle temporal alignment based on relationship type
3. Calculate correlation/comparison metrics
4. Identify significant patterns or outliers
5. Provide statistical validation

EXPECTED OUTPUT STRUCTURE:
${JSON.stringify(expectedStructure, null, 2)}

Please provide:
1. Cross-dataset analysis methodology
2. Key findings and correlations
3. Statistical significance measures
4. Data quality considerations
5. Visualization recommendations
6. Limitations and assumptions

Format your response as a comprehensive analysis with clear methodology and actionable insights.`;
}

async function analyzeCrossDatasetProposition(proposition) {
    try {
        const prompt = createCrossDatasetPrompt(proposition);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an expert data analyst specializing in cross-dataset urban analytics and statistical correlation analysis."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.3
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing cross-dataset proposition:', error);
        throw error;
    }
}

async function processProposition(propositionFile, outputDir) {
    try {
        // Read proposition data
        const data = await fs.readFile(propositionFile, 'utf8');
        const propositionData = JSON.parse(data);
        
        console.log(`Processing: ${propositionData.proposition || 'Unknown proposition'}`);
        
        // Validate required datasets
        const datasetsRequired = propositionData.datasets_required || [];
        if (datasetsRequired.length < 2) {
            throw new Error('Cross-dataset analysis requires at least 2 datasets');
        }

        // Check if all required datasets have schema mappings
        for (const dataset of datasetsRequired) {
            if (!DATASET_SCHEMAS[dataset]) {
                console.warn(`Warning: No schema mapping for dataset '${dataset}'`);
            }
        }

        // Analyze the cross-dataset proposition
        console.log('Generating cross-dataset analysis...');
        const analysis = await analyzeCrossDatasetProposition(propositionData);
        
        // Create output structure
        const output = {
            input: propositionData,
            analysis: analysis,
            datasets_involved: datasetsRequired,
            relationship_type: propositionData.relationship_type,
            temporal_alignment: propositionData.time_periods,
            processing_timestamp: new Date().toISOString(),
            status: 'completed'
        };

        // Create output file
        const fileName = `${propositionData.proposition_id || 'cross_dataset_analysis'}.json`;
        const outputPath = path.join(outputDir, fileName);
        
        await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
        
        console.log(`✓ Analysis saved to: ${outputPath}`);
        return { success: true, outputPath, datasets: datasetsRequired.length };
        
    } catch (error) {
        console.error('Error processing cross-dataset proposition:', error);
        
        // Save error output
        const errorOutput = {
            error: error.message,
            input_file: propositionFile,
            processing_timestamp: new Date().toISOString(),
            status: 'failed'
        };
        
        const errorFileName = `error_${Date.now()}.json`;
        const errorPath = path.join(outputDir, errorFileName);
        
        try {
            await fs.writeFile(errorPath, JSON.stringify(errorOutput, null, 2));
        } catch (writeError) {
            console.error('Could not save error output:', writeError);
        }
        
        return { success: false, error: error.message };
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node layer1_cross_dataset.js <proposition_file> <output_directory>');
        process.exit(1);
    }

    const propositionFile = args[0];
    const outputDir = args[1];

    try {
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        // Process the proposition
        const result = await processProposition(propositionFile, outputDir);
        
        if (result.success) {
            console.log(`🎉 Successfully processed cross-dataset analysis with ${result.datasets} datasets`);
        } else {
            console.error(`❌ Failed to process: ${result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { processProposition, analyzeCrossDatasetProposition };
