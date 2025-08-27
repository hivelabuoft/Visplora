const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai').default;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Test with smaller numbers first
const TEST_CHART_TYPES = {
    'comboBarLine': {
        variations: ['comboBarLine_simple_2D', 'comboBarLine_simple_3D', 'comboBarLine_with_mean_2D', 'comboBarLine_with_threshold_2D'],
        description: 'Combination of bar and line charts for showing dual metrics',
        min_propositions: 10, // Reduced for testing
        min_3d: 2,
        min_with_stats: 4
    },
    'multiLineChart': {
        variations: ['multiLineChart_simple_2D', 'multiLineChart_simple_3D', 'multiLineChart_with_mean_2D', 'multiLineChart_with_threshold_2D'],
        description: 'Multiple line series for comparing trends across categories',
        min_propositions: 10,
        min_3d: 2,
        min_with_stats: 4
    }
};

// Load London metadata
async function loadLondonMetadata() {
    const metadataPath = path.join(__dirname, '../../..', 'public', 'data', 'london_metadata.json');
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
}

// Create proposition generation prompt
function createPropositionPrompt(chartType, chartConfig, datasets) {
    const totalPropositions = chartConfig.min_propositions;
    const min3D = chartConfig.min_3d;
    const minWithStats = chartConfig.min_with_stats;
    
    return `
You are an expert data visualization analyst tasked with creating compelling data propositions for London borough datasets.

TASK: Generate exactly ${totalPropositions} unique propositions for ${chartType} charts using the provided London datasets.

CHART TYPE: ${chartType}
DESCRIPTION: ${chartConfig.description}
VARIATIONS: ${chartConfig.variations.join(', ')}

REQUIREMENTS:
- Generate exactly ${totalPropositions} unique propositions
- At least ${min3D} must use 3D variations (chart_type ending in '_3D')
- At least ${minWithStats} must use statistical overlays ('_with_mean_2D', '_with_threshold_2D')
- Each proposition should focus on ONE dataset only (single-dataset analysis)
- Propositions should be realistic and meaningful for London borough data analysis
- Use appropriate variables from the actual dataset schemas provided

AVAILABLE DATASETS (Top 6):
${datasets.categories.slice(0, 6).map(category => `
Dataset: ${category.name}
Description: ${category.description}
Sample Columns: ${category.files[0]?.file_summary?.column_names?.slice(0, 6).join(', ') || 'N/A'}
`).join('\n')}

OUTPUT FORMAT: Return a JSON array with exactly ${totalPropositions} propositions. Each proposition must follow this exact structure:

{
  "proposition_id": "{dataset}_{category}_{chart_type}_{sequential_number}",
  "dataset": "{dataset_name}",
  "category": "chart_specific_analysis",
  "proposition": "Clear, specific statement about the data pattern or insight",
  "chart_type": "One of: ${chartConfig.variations.join(', ')}",
  "chart_title": "Descriptive title for the visualization",
  "chart_description": "Brief description of what the chart shows",
  "reasoning": "Why this chart type is appropriate for this data pattern",
  "tapas_questions": [
    "Question 1 about the data pattern",
    "Question 2 about comparisons", 
    "Question 3 about insights"
  ],
  "3d_dimension": "null OR dimension name if using 3D chart",
  "variables_needed": ["array", "of", "relevant", "column", "names"],
  "time_period": "Applicable time range or 'Not applicable'",
  "geographic_level": "London-wide, Borough, or LSOA",
  "complexity_level": "Basic, Intermediate, or Advanced"
}

CHART-SPECIFIC GUIDELINES:
${chartType === 'comboBarLine' ? '- Use bar for counts/quantities and line for rates/percentages or trends\n- Show dual metrics that complement each other (e.g., absolute counts + percentages)\n- Ideal for showing volume vs rate comparisons' : ''}
${chartType === 'multiLineChart' ? '- Multiple lines should compare different categories, boroughs, or time series\n- Show trends across multiple groups simultaneously\n- Ideal for comparing performance across different areas or categories over time' : ''}

EXAMPLE PROPOSITION (for reference):
{
  "proposition_id": "crime-rates_chart_analysis_comboBarLine_001",
  "dataset": "crime-rates",
  "category": "chart_specific_analysis", 
  "proposition": "Crime incident counts show peaks in summer months while crime rates per capita remain relatively stable across seasons.",
  "chart_type": "comboBarLine_simple_2D",
  "chart_title": "Seasonal Crime Patterns: Volume vs Rate",
  "chart_description": "Bar chart shows absolute crime counts by month, line chart shows crime rate per 1000 residents",
  "reasoning": "Combo chart effectively separates absolute volume from population-adjusted rates, revealing different seasonal patterns",
  "tapas_questions": [
    "Which months have the highest absolute crime counts?",
    "How does the crime rate per capita vary across seasons?", 
    "What's the relationship between total crimes and crime rate?"
  ],
  "3d_dimension": null,
  "variables_needed": ["crime_category", "count", "month", "borough_name"],
  "time_period": "2022-2023",
  "geographic_level": "London-wide",
  "complexity_level": "Intermediate"
}

Ensure variety in:
- Different datasets (crime-rates, ethnicity, income, population, vehicles, house-prices)
- Geographic levels (London-wide, Borough, LSOA)
- Complexity levels (Basic, Intermediate, Advanced)  
- Time periods where applicable
- Chart variations as specified

Return ONLY the JSON array, no additional text or formatting.`;
}

// Generate propositions for a specific chart type
async function generatePropositionsForChartType(chartType, chartConfig, datasets) {
    console.log(`🎯 Generating ${chartConfig.min_propositions} propositions for ${chartType}...`);
    
    try {
        const prompt = createPropositionPrompt(chartType, chartConfig, datasets);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system", 
                    content: "You are a data visualization expert specializing in London borough analytics. Generate realistic propositions that demonstrate effective use of specific chart types. Always return valid JSON arrays only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 3000,
            temperature: 0.7
        });

        const responseContent = completion.choices[0].message.content;
        
        // Try to parse the JSON response
        let propositions;
        try {
            // Clean up the response to ensure it's valid JSON
            const cleanedContent = responseContent.replace(/```json\n?|\n?```/g, '').trim();
            propositions = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error(`JSON parsing error for ${chartType}:`, parseError.message);
            console.log('Response preview:', responseContent.substring(0, 300) + '...');
            throw new Error(`Failed to parse JSON response for ${chartType}`);
        }

        if (!Array.isArray(propositions)) {
            throw new Error(`Response is not an array for ${chartType}`);
        }

        console.log(`✅ Generated ${propositions.length} propositions for ${chartType}`);
        
        // Validate proposition structure
        const requiredFields = ['proposition_id', 'dataset', 'chart_type', 'proposition', 'chart_title'];
        const validPropositions = propositions.filter(prop => {
            return requiredFields.every(field => prop[field]);
        });

        if (validPropositions.length !== propositions.length) {
            console.warn(`⚠️  Filtered out ${propositions.length - validPropositions.length} invalid propositions for ${chartType}`);
        }

        return {
            chart_type: chartType,
            total_generated: validPropositions.length,
            propositions: validPropositions,
            generation_timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`❌ Error generating propositions for ${chartType}:`, error.message);
        return {
            chart_type: chartType,
            total_generated: 0,
            propositions: [],
            error: error.message,
            generation_timestamp: new Date().toISOString()
        };
    }
}

// Main execution function
async function main() {
    try {
        console.log('🔄 Loading London metadata...');
        const datasets = await loadLondonMetadata();
        console.log(`Found ${datasets.categories.length} dataset categories`);

        const results = [];
        const chartTypes = Object.keys(TEST_CHART_TYPES);
        
        console.log(`\n🚀 Testing proposition generation for ${chartTypes.length} chart types...`);
        
        for (const chartType of chartTypes) {
            const chartConfig = TEST_CHART_TYPES[chartType];
            
            console.log(`\n📊 Processing ${chartType} (target: ${chartConfig.min_propositions} propositions)`);
            
            // Generate propositions
            const propositionData = await generatePropositionsForChartType(chartType, chartConfig, datasets);
            
            // Save to file
            const outputDir = path.join(__dirname, 'output', 'test_underused_charts');
            await fs.mkdir(outputDir, { recursive: true });
            
            const fileName = `${chartType}_test_propositions.json`;
            const filePath = path.join(outputDir, fileName);
            
            await fs.writeFile(filePath, JSON.stringify(propositionData, null, 2));
            console.log(`📄 Saved ${chartType} propositions to: ${filePath}`);
            
            results.push(propositionData);
            
            // Short delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Generate summary
        console.log('\n📊 TEST GENERATION SUMMARY:');
        console.log('========================');
        let totalGenerated = 0;

        for (const result of results) {
            const status = result.error ? `❌ ERROR` : `✅ ${result.total_generated} propositions`;
            console.log(`${result.chart_type}: ${status}`);
            
            if (!result.error) {
                totalGenerated += result.total_generated;
                
                // Show sample proposition
                if (result.propositions.length > 0) {
                    const sample = result.propositions[0];
                    console.log(`  Sample: "${sample.proposition}" (${sample.chart_type})`);
                }
            }
        }

        console.log('========================');
        console.log(`TOTAL: ${totalGenerated} test propositions generated`);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}
