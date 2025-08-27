const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai').default;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Underused chart types to generate propositions for
const UNDERUSED_CHART_TYPES = {
    'comboBarLine': {
        variations: ['comboBarLine_simple_2D', 'comboBarLine_simple_3D', 'comboBarLine_with_mean_2D', 'comboBarLine_with_threshold_2D'],
        description: 'Combination of bar and line charts for showing dual metrics',
        min_propositions: 50,
        min_3d: 5,
        min_with_stats: 10
    },
    'multiLineChart': {
        variations: ['multiLineChart_simple_2D', 'multiLineChart_simple_3D', 'multiLineChart_with_mean_2D', 'multiLineChart_with_threshold_2D'],
        description: 'Multiple line series for comparing trends across categories',
        min_propositions: 30,
        min_3d: 5,
    },
    'lineChart': {
        variations: ['lineChart_simple_2D', 'lineChart_simple_3D', 'lineChart_with_mean_2D', 'lineChart_with_threshold_2D'],
        description: 'Single line charts for showing trends over time',
        min_propositions: 25,
        min_3d: 5,
    },
    'divergentBar': {
        variations: ['divergentBarChart_simple_2D', 'divergentBarChart_simple_3D', 'divergentBarChart_with_mean_2D', 'divergentBarChart_with_threshold_2D'],
        description: 'Divergent bars showing positive and negative values from a center point',
        min_propositions: 25,
        min_3d: 5,
        min_with_stats: 10
    },
    'groupedBar': {
        variations: ['groupedBarChart_simple_2D', 'groupedBarChart_simple_3D', 'groupedBarChart_with_mean_2D', 'groupedBarChart_with_threshold_2D'],
        description: 'Grouped bars for comparing multiple series side by side',
        min_propositions: 25,
        min_3d: 5,
    },
    'scatterPlot': {
        variations: ['scatterPlot_simple_2D', 'scatterPlot_simple_3D', 'scatterPlot_with_mean_2D', 'scatterPlot_with_threshold_2D'],
        description: 'Scatter plots for showing correlations and relationships',
        min_propositions: 35,
        min_3d: 5,
    },
    'areaChart': {
        variations: ['areaChart_simple_2D', 'areaChart_simple_3D', 'areaChart_stacked_2D', 'areaChart_with_mean_2D', 'areaChart_with_threshold_2D'],
        description: 'Area charts for showing quantities over time with filled areas',
        min_propositions: 25,
        min_3d: 5,
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

TASK: Generate ${totalPropositions} unique propositions for ${chartType} charts using the provided London datasets.

CHART TYPE: ${chartType}
DESCRIPTION: ${chartConfig.description}
VARIATIONS: ${chartConfig.variations.join(', ')}

REQUIREMENTS:
- Generate exactly ${totalPropositions} unique propositions
- At least ${min3D} must use 3D variations (chart_type ending in '_3D')
- At least ${minWithStats} must use statistical overlays ('_with_mean_2D', '_with_threshold_2D')
- Each proposition should focus on ONE dataset only (single-dataset analysis)
- Propositions should be NARRATIVE statements that tell a story about the data
- Use appropriate variables from the actual dataset schemas provided

NARRATIVE PROPOSITION GUIDELINES:
- Write propositions as CONCRETE, FACTUAL STATEMENTS like news headlines:
  * "Westminster shows highest crime rates in London"
  * "Tower Hamlets income levels dropped 15% between 2019 and 2023"  
  * "Camden burglary incidents doubled during summer months"
  * "Asian populations concentrate heavily in Newham and Tower Hamlets"
  * "Vehicle ownership surged in outer London boroughs after 2020"
- Avoid analytical language like "analyze", "examine", "explore", "investigate"
- Make them specific to London boroughs, time periods, or demographic groups
- Focus on concrete findings that the chart type can effectively demonstrate
- Sound like factual observations rather than research questions

3D DIMENSION GUIDELINES:
- For 3D charts, use dimensions like "year", "month", "crime_category", "ethnic_group", or other categorical variables with 3-8 distinct values
- Avoid using continuous variables or high-cardinality categories as 3D dimensions
- Recommended 3D dimensions: year, month, crime_category, vehicle_type, broad_group (ethnicity), school_type
- The 3D dimension should add meaningful depth to the visualization, not just visual complexity

AVAILABLE DATASETS:
${datasets.categories.map(category => `
Dataset: ${category.name}
Description: ${category.description}
Available Files: ${category.files.map(f => f.name).join(', ')}
Sample Columns: ${category.files[0]?.file_summary?.column_names?.slice(0, 8).join(', ') || 'N/A'}
`).join('\n')}

OUTPUT FORMAT: Return a JSON array with exactly ${totalPropositions} propositions. Each proposition must follow this exact structure:

{
  "proposition_id": "{dataset}_{category}_{chart_type}_{sequential_number}",
  "dataset": "{dataset_name}",
  "category": "chart_specific_analysis",
  "reworded_proposition": "Concrete narrative statement like 'Westminster shows highest crime rates in London' or 'Camden income levels dropped 20% from 2019-2023'",
  "chart_type": "One of: ${chartConfig.variations.join(', ')}",
  "chart_title": "Descriptive title for the visualization",
  "chart_description": "Brief description of what the chart shows",
  "reasoning": "Why this chart type is appropriate for this data pattern",
  "tapas_questions": [
    "Question 1 about the data pattern",
    "Question 2 about comparisons",
    "Question 3 about insights"
  ],
  "3d_dimension": "null OR categorical dimension like 'year', 'month', 'crime_category', 'ethnic_group' (for 3D charts only)",
  "variables_needed": ["array", "of", "relevant", "column", "names"],
  "time_period": "Applicable time range or 'Not applicable'",
  "geographic_level": "London-wide, Borough, or LSOA",
  "complexity_level": "Basic, Intermediate, or Advanced"
}

CHART-SPECIFIC GUIDELINES:
${chartType === 'comboBarLine' ? `- Use bar for counts/quantities and line for rates/percentages or trends
- Create narratives like "Camden shows highest crime counts while maintaining lower crime rates per capita"
- Perfect for stories comparing absolute vs relative metrics
- Example narrative: "Westminster crime incidents peak in summer months while crime rates remain stable year-round"` : ''}
${chartType === 'multiLineChart' ? `- Multiple lines should compare different categories, boroughs, or time series
- Create narratives about diverging trends or comparative patterns
- Perfect for stories like "Crime rates in wealthy boroughs declined faster than in deprived areas over the past decade"
- Example narrative: "Vehicle ownership trends vary dramatically between inner and outer London boroughs"` : ''}
${chartType === 'lineChart' ? `- Focus on temporal trends and time-based patterns
- Create narratives about changes over time
- Perfect for stories like "House prices in Hackney doubled between 2010 and 2023"
- Example narrative: "Population growth in Tower Hamlets accelerated significantly after 2015"` : ''}
${chartType === 'divergentBar' ? `- Show positive/negative deviations from average, growth/decline, or above/below threshold comparisons
- Create narratives about polarization or deviation patterns
- Perfect for stories like "Income inequality widened dramatically with some boroughs gaining while others declined"
- Example narrative: "Crime rates rose above London average in eastern boroughs while falling below in western areas"` : ''}
${chartType === 'groupedBar' ? `- Compare multiple metrics or categories side by side within groups
- Create narratives about comparative performance across categories
- Perfect for stories like "Asian populations concentrated in specific boroughs while remaining sparse in others"
- Example narrative: "Educational attainment varies significantly between ethnic groups across London boroughs"` : ''}
${chartType === 'scatterPlot' ? `- Show relationships, correlations, or distributions between two variables
- Create narratives about correlations or unexpected patterns
- Perfect for stories like "Higher income boroughs consistently show lower crime rates"
- Example narrative: "Vehicle ownership correlates strongly with house prices across all London boroughs"` : ''}
${chartType === 'areaChart' ? `- Emphasize cumulative values, proportions, or filled trend areas over time
- Create narratives about accumulation or composition changes
- Perfect for stories like "Restaurant industry employment grew steadily in tourist-heavy boroughs"
- Example narrative: "Population composition shifted dramatically with ethnic diversity increasing across all boroughs"` : ''}

VARIATION DISTRIBUTION:
- Simple 2D: ${Math.floor(totalPropositions * 0.4)} propositions
- Simple 3D: ${min3D} propositions  
- With Mean: ${Math.floor(minWithStats * 0.6)} propositions
- With Threshold: ${Math.floor(minWithStats * 0.4)} propositions

EXAMPLE NARRATIVE PROPOSITIONS (for reference):
{
  "proposition_id": "crime-rates_chart_analysis_comboBarLine_001",
  "dataset": "crime-rates",
  "category": "chart_specific_analysis", 
  "reworded_proposition": "Westminster crime incidents peak dramatically in summer while rates per capita remain stable across all seasons",
  "chart_type": "comboBarLine_simple_2D",
  "chart_title": "Westminster Crime Volume vs Rate Comparison",
  "chart_description": "Bar chart shows absolute crime counts, line chart shows crime rate per 1000 residents",
  "reasoning": "Combo chart effectively separates absolute volume from population-adjusted rates, revealing Westminster's unique crime profile",
  "tapas_questions": [
    "Which borough has the highest absolute crime counts?",
    "How does Westminster's crime rate per capita compare to its absolute numbers?", 
    "What boroughs show the biggest difference between volume and rate?"
  ],
  "3d_dimension": null,
  "variables_needed": ["crime_category", "count", "borough_name"],
  "time_period": "2022-2023",
  "geographic_level": "Borough",
  "complexity_level": "Intermediate"
}

FOR 3D EXAMPLES:
{
  "reworded_proposition": "Crime patterns shift dramatically across seasons with violent crime peaking in summer months while theft remains consistent year-round",
  "chart_type": "multiLineChart_simple_3D",
  "3d_dimension": "month",
  // 3D depth shows monthly progression while multiple lines compare crime categories
}

Ensure variety in:
- Complexity levels (Basic, Intermediate, Advanced)
- Different datasets represented
- Time periods where applicable
- Meaningful narrative statements that fit the chart type perfectly

Return only the JSON array, no additional text.`;
}

// Generate propositions for a specific chart type
async function generatePropositionsForChartType(chartType, chartConfig, datasets) {
    console.log(`🎯 Generating propositions for ${chartType}...`);
    
    try {
        const prompt = createPropositionPrompt(chartType, chartConfig, datasets);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system", 
                    content: "You are a data visualization expert specializing in London borough analytics. Create compelling NARRATIVE propositions that tell specific stories about data patterns. Propositions should read like news headlines or factual statements (e.g., 'Westminster shows highest crime rates', 'Tower Hamlets income declined significantly'). Always return valid JSON arrays only, no additional formatting."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 16000,
            temperature: 0.6
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
            console.log('Response content:', responseContent.substring(0, 500));
            throw new Error(`Failed to parse JSON response for ${chartType}`);
        }

        if (!Array.isArray(propositions)) {
            throw new Error(`Response is not an array for ${chartType}`);
        }

        console.log(`✅ Generated ${propositions.length} propositions for ${chartType}`);
        
        // Validate proposition structure
        const validPropositions = propositions.filter(prop => {
            return prop.proposition_id && prop.dataset && prop.chart_type && prop.reworded_proposition;
        });

        if (validPropositions.length !== propositions.length) {
            console.warn(`⚠️  Filtered ${propositions.length - validPropositions.length} invalid propositions for ${chartType}`);
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

// Save propositions to file
async function savePropositions(chartType, propositionData) {
    const outputDir = path.join(__dirname, 'output', 'underused_charts');
    await fs.mkdir(outputDir, { recursive: true });
    
    const fileName = `${chartType}_propositions.json`;
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(propositionData, null, 2));
    console.log(`📄 Saved ${chartType} propositions to: ${filePath}`);
    
    return filePath;
}

// Main execution function
async function main() {
    try {
        console.log('🔄 Loading London metadata...');
        const datasets = await loadLondonMetadata();
        console.log(`Found ${datasets.categories.length} dataset categories`);

        // Parse command line arguments
        const args = process.argv.slice(2);
        const targetChartType = args[0];
        
        const allChartTypes = Object.keys(UNDERUSED_CHART_TYPES);
        
        if (targetChartType) {
            // Single chart type mode
            if (!UNDERUSED_CHART_TYPES[targetChartType]) {
                console.error(`❌ Unknown chart type: ${targetChartType}`);
                console.log(`Available chart types: ${allChartTypes.join(', ')}`);
                process.exit(1);
            }
            
            console.log(`\n🎯 Processing single chart type: ${targetChartType}`);
            
            const chartConfig = UNDERUSED_CHART_TYPES[targetChartType];
            console.log(`� Processing ${targetChartType} (target: ${chartConfig.min_propositions} propositions)`);
            
            // Check if already exists
            const outputDir = path.join(__dirname, 'output', 'underused_charts');
            const fileName = `${targetChartType}_propositions.json`;
            const filePath = path.join(outputDir, fileName);
            
            try {
                const existingContent = await fs.readFile(filePath, 'utf8');
                const existingData = JSON.parse(existingContent);
                
                if (existingData.total_generated > 0) {
                    console.log(`⚠️  ${targetChartType} already has ${existingData.total_generated} propositions`);
                    console.log(`Use --force flag to regenerate, or delete the file to start fresh`);
                    
                    if (!args.includes('--force')) {
                        console.log(`Skipping ${targetChartType}. Use: node generate_underused_chart_propositions.js ${targetChartType} --force`);
                        return;
                    } else {
                        console.log(`🔄 Force regenerating ${targetChartType}...`);
                    }
                }
            } catch (error) {
                // File doesn't exist or can't be read, proceed normally
                console.log(`📝 Creating new propositions for ${targetChartType}`);
            }
            
            // Generate propositions for single chart type
            const propositionData = await generatePropositionsForChartType(targetChartType, chartConfig, datasets);
            
            // Save to file
            await savePropositions(targetChartType, propositionData);
            
            console.log('\n✅ SINGLE CHART TYPE COMPLETED:');
            console.log('=================================');
            const status = propositionData.error ? `❌ ERROR: ${propositionData.error}` : `✅ ${propositionData.total_generated} propositions`;
            console.log(`${propositionData.chart_type}: ${status}`);
            
        } else {
            // Multi chart type mode (original behavior)
            console.log(`\n�🚀 Generating propositions for ${allChartTypes.length} chart types...`);
            console.log(`Available chart types: ${allChartTypes.join(', ')}`);
            console.log(`\n💡 TIP: Run single chart types with: node generate_underused_chart_propositions.js <chart_type>`);
            console.log(`💡 Example: node generate_underused_chart_propositions.js multiLineChart\n`);
            
            const results = [];
            
            for (const chartType of allChartTypes) {
                const chartConfig = UNDERUSED_CHART_TYPES[chartType];
                
                console.log(`\n📊 Processing ${chartType} (target: ${chartConfig.min_propositions} propositions)`);
                
                // Generate propositions
                const propositionData = await generatePropositionsForChartType(chartType, chartConfig, datasets);
                
                // Save to file
                await savePropositions(chartType, propositionData);
                
                results.push(propositionData);
                
                // Add delay between requests to avoid rate limits
                console.log('⏱️  Waiting 2 seconds before next chart type...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Generate summary
            console.log('\n📊 GENERATION SUMMARY:');
            console.log('========================');
            let totalGenerated = 0;
            let totalErrors = 0;

            for (const result of results) {
                const status = result.error ? `❌ ERROR: ${result.error}` : `✅ ${result.total_generated} propositions`;
                console.log(`${result.chart_type}: ${status}`);
                
                if (!result.error) {
                    totalGenerated += result.total_generated;
                } else {
                    totalErrors++;
                }
            }

            console.log('========================');
            console.log(`TOTAL: ${totalGenerated} propositions generated across ${results.length - totalErrors} chart types`);
            console.log(`ERRORS: ${totalErrors} chart types failed`);

            // Save summary
            const summary = {
                generation_date: new Date().toISOString(),
                total_chart_types: allChartTypes.length,
                successful_chart_types: results.length - totalErrors,
                failed_chart_types: totalErrors,
                total_propositions_generated: totalGenerated,
                results: results,
                chart_type_requirements: UNDERUSED_CHART_TYPES
            };

            const summaryPath = path.join(__dirname, 'output', 'underused_charts', 'generation_summary.json');
            await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
            console.log(`\n📝 Generation summary saved to: ${summaryPath}`);
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}
