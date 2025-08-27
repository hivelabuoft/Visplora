/**
 * LLM Interface for Proposition Generation
 * 
 * This module contains the actual LLM integration for generating propositions.
 */

class LLMPropositionService {
    constructor(config = {}) {
        this.model = config.model || 'gpt-4o';
        this.temperature = config.temperature || 0.3;
        this.maxTokens = config.max_tokens || 4000;
        this.timeout = config.timeout_ms || 30000;
    }

    /**
     * Generate propositions for a single dataset using LLM
     * @param {string} datasetName - Name of the dataset
     * @param {string} category - Category of propositions to generate (not used in new structure)
     * @param {number} count - Number of propositions to generate (not used in new structure)
     * @param {Object} datasetMetadata - Metadata about the dataset structure
     * @returns {Promise<Array>} Array of generated propositions
     */
    async generateDatasetPropositions(datasetName, category, count, datasetMetadata = {}) {
        console.log(`🤖 [LLM] Generating propositions for ${datasetName} using ${this.model}`);
        
        try {
            // Build the comprehensive prompt
            const prompt = this.buildDatasetPropositionPrompt(datasetName, datasetMetadata);
            
            // Call the actual LLM
            const response = await this.callLLM(prompt);
            const parsedResponse = this.parsePropositionResponse(response);
            
            // If LLM call succeeded, return the parsed propositions
            if (!response.fallback && parsedResponse.propositions) {
                console.log(`✅ [LLM] Generated ${Object.values(parsedResponse.propositions).flat().length} propositions for ${datasetName}`);
                return Object.values(parsedResponse.propositions).flat();
            }
            
            // Fallback to mock if needed
            console.log('🔄 [LLM] Using mock fallback for', datasetName);
            return this.generateMockPropositionsFromPrompt(datasetName, datasetMetadata);
            
        } catch (error) {
            console.error(`❌ LLM generation failed for ${datasetName}:`, error.message);
            return this.generateMockPropositionsFromPrompt(datasetName, datasetMetadata);
        }
    }

    /**
     * Generate cross-dataset propositions using LLM
     * @param {string} category - Category of cross-dataset propositions
     * @param {Array} datasets - Array of dataset names involved
     * @param {number} count - Number of propositions to generate
     * @param {Object} allDatasetsMetadata - Metadata about all datasets
     * @returns {Promise<Array>} Array of generated cross-dataset propositions
     */
    async generateCrossDatasetPropositions(category, datasets, count, allDatasetsMetadata = {}) {
        console.log(`🤖 [LLM] Generating cross-dataset propositions for ${category} using ${this.model}`);
        
        try {
            // Build cross-dataset prompt
            const prompt = this.buildCrossDatasetPropositionPrompt(allDatasetsMetadata, {
                total_propositions: count,
                categories: { [category]: count }
            });
            
            // Call the actual LLM
            const response = await this.callLLM(prompt);
            const parsedResponse = this.parsePropositionResponse(response);
            
            // If LLM call succeeded, return the parsed propositions
            if (!response.fallback && parsedResponse.cross_dataset_propositions) {
                const propositions = Object.values(parsedResponse.cross_dataset_propositions).flat();
                console.log(`✅ [LLM] Generated ${propositions.length} cross-dataset propositions for ${category}`);
                return propositions;
            }
            
            // Fallback to mock if needed
            console.log('🔄 [LLM] Using mock fallback for cross-dataset', category);
            return this.generateMockCrossDatasetPropositions(category, datasets, count);
            
        } catch (error) {
            console.error(`❌ Cross-dataset LLM generation failed for ${category}:`, error.message);
            return this.generateMockCrossDatasetPropositions(category, datasets, count);
        }
    }

    /**
     * Build comprehensive prompt for single dataset propositions
     * @private
     */
    buildDatasetPropositionPrompt(datasetName, datasetMetadata) {
        const datasetInfo = this.buildDatasetInfo(datasetName, datasetMetadata);
        const propositionConfig = datasetMetadata;

        const prompt = `You are an expert data analyst generating analytical propositions for a London dataset.

DATASET INFORMATION:
Name: ${datasetName}
Description: ${datasetInfo.description}
Temporal Coverage: ${datasetInfo.time_range || 'Not specified'}
Geographic Scope: ${datasetInfo.geographic_scope || 'London boroughs'}
Key Dimensions: ${datasetInfo.key_dimensions.join(', ')}
Row Count: ${propositionConfig.complexity_factors?.row_count || 'Not specified'}

DATASET SCHEMA:
Main Columns: ${JSON.stringify(datasetInfo.main_columns || {}, null, 2)}
Sample Values: ${JSON.stringify(datasetInfo.sample_values || {}, null, 2)}

PROPOSITION GENERATION REQUIREMENTS:
Total Propositions: ${propositionConfig.total_propositions || 20}
Category Breakdown: ${JSON.stringify(propositionConfig.proposition_breakdown || {}, null, 2)}

TEMPORAL GUIDELINES:
- Always specify time periods when relevant (e.g., "in 2022-2023", "from 1995-2023")
- Use appropriate tense based on data coverage:
  * Recent data (2020+): Present tense "Crime rates show..."
  * Historical data (pre-2020): Past tense "Restaurant employment grew..."
  * Long series: Evolution language "Population has increased from 1801 to 2021"
- If temporal coverage is limited, acknowledge constraints explicitly

PROPOSITION QUALITY STANDARDS:
1. SPECIFIC: Include exact metrics, areas, time periods, categories
2. TESTABLE: Must be verifiable with the available data columns
3. ACTIONABLE: Should suggest clear visualization possibilities
4. REALISTIC: Use actual column names and sample values provided
5. VARIED: Cover different analytical angles within each category

CATEGORY-SPECIFIC INSTRUCTIONS:

${this.generateCategoryInstructions(propositionConfig.proposition_breakdown || {})}

OUTPUT FORMAT:
Return a JSON object with propositions organized by category:

{
  "dataset_name": "${datasetName}",
  "total_generated": ${propositionConfig.total_propositions || 20},
  "propositions": {
    ${Object.keys(propositionConfig.proposition_breakdown || {}).map(category => `
    "${category}": [
      {
        "id": "unique_id",
        "proposition": "Specific analytical statement with exact metrics and timeframes",
        "variables_needed": ["column1", "column2", "column3"],
        "time_period": "2022-2023" or "Not applicable",
        "geographic_level": "Borough" or "LSOA" or "London-wide", 
        "suggested_visualization": "line_chart" or "choropleth_map" or "bar_chart" etc,
        "complexity_level": "Basic" or "Intermediate" or "Advanced"
      }
    ]`).join(',')}
  }
}

EXAMPLES FOR REFERENCE:
Good proposition: "Violent crime rates increased by 12% from Q1 2022 to Q1 2023 in Westminster and Camden boroughs"
- ✅ Specific metric (12% increase)
- ✅ Exact time periods (Q1 2022 to Q1 2023)  
- ✅ Specific locations (Westminster, Camden)
- ✅ Testable with available data

Bad proposition: "Crime varies across London"
- ❌ Too vague, no specific metrics
- ❌ No time period specified
- ❌ No testable hypothesis

CRITICAL REMINDERS:
- Use only the column names and values provided in the dataset schema
- Each proposition must be different and cover unique analytical angles
- Include temporal specifications appropriate to the data coverage
- Ensure geographic specificity matches available data granularity
- Generate exactly the number requested for each category

Begin generation now:`;

        return prompt;
    }

    /**
     * Build cross-dataset proposition prompt
     * @private
     */
    buildCrossDatasetPropositionPrompt(allDatasetsMetadata, crossConfig) {
        const datasets = Object.entries(allDatasetsMetadata).reduce((acc, [name, config]) => {
            acc[name] = {
                description: config.justification || `London ${name} dataset`,
                time_range: this.extractTimeRange(config.complexity_factors),
                main_columns: this.buildMockColumns(name),
                geographic_scope: config.complexity_factors?.geographic_levels || 'London boroughs'
            };
            return acc;
        }, {});

        const prompt = `You are an expert data analyst generating cross-dataset analytical propositions for London data.

AVAILABLE DATASETS:
${Object.entries(datasets).map(([name, info]) => `
${name}:
- Description: ${info.description}
- Time Range: ${info.time_range || 'Not specified'}
- Key Columns: ${Object.keys(info.main_columns || {}).slice(0, 5).join(', ')}
- Geographic Level: ${info.geographic_scope}`).join('\n')}

TEMPORAL OVERLAP ANALYSIS:
${JSON.stringify(crossConfig.temporal_overlap_opportunities || {
    "2022_2023_overlap": ["crime-rates", "schools-colleges", "libraries", "gyms"],
    "2019_2023_overlap": ["vehicles", "house-prices", "income", "private-rent"],
    "historical_context": ["population", "house-prices", "income"]
}, null, 2)}

CROSS-DATASET PROPOSITION REQUIREMENTS:
Total Propositions: ${crossConfig.total_propositions}
Categories: ${JSON.stringify(crossConfig.categories, null, 2)}

CROSS-DATASET RELATIONSHIP TYPES:

1. DIRECT TEMPORAL OVERLAP (same time periods):
Generate propositions that combine datasets with overlapping years
Example: "Areas with high crime rates in 2022-2023 have fewer boutique gyms per capita in 2024"

2. TEMPORAL LAG RELATIONSHIPS (cause-effect with time delay):
Earlier data predicts or explains later patterns
Example: "Boroughs with income growth 2015-2020 show 40% more gym facilities by 2024"

3. HISTORICAL CONTEXT RELATIONSHIPS:
Long-term patterns inform current state
Example: "Areas with fastest population growth 1990-2021 have highest restaurant density in 2015-2017"

4. PROXY RELATIONSHIPS:
One dataset serves as indicator for concepts in another
Example: "House price appreciation 1995-2023 correlates with school performance ratings 2021-2023"

OUTPUT FORMAT:
{
  "cross_dataset_propositions": {
    ${Object.keys(crossConfig.categories || {}).map(category => `
    "${category}": [
      {
        "proposition": "Specific cross-dataset analytical statement",
        "datasets_required": ["dataset1", "dataset2"],
        "variables_needed": {
          "dataset1": ["column_a", "column_b"],
          "dataset2": ["column_x", "column_y"]
        },
        "time_periods": {
          "dataset1": "2020-2023",
          "dataset2": "2024"
        },
        "relationship_type": "correlation" or "lag" or "proxy" or "causal",
        "suggested_visualization": "scatter_plot" or "dual_axis_chart" etc,
        "temporal_assumption": "Explanation of temporal relationship"
      }
    ]`).join(',')}
  }
}

QUALITY REQUIREMENTS:
- Each proposition must require data from AT LEAST 2 different datasets
- Specify exact variables needed from each dataset
- Include realistic temporal assumptions
- Suggest appropriate visualizations for cross-dataset analysis
- Ensure propositions are testable with available data

Generate exactly ${crossConfig.total_propositions} propositions across the specified categories.`;

        return prompt;
    }

    /**
     * Category-specific instruction generator
     * @private
     */
    generateCategoryInstructions(breakdown) {
        const instructions = {
            "temporal_trends": `
TEMPORAL TRENDS (${breakdown.temporal_trends || 0} propositions):
Focus on time-based patterns:
- Year-over-year or period-over-period changes with specific percentages
- Seasonal variations and cyclical patterns
- Peak/trough identification with exact timing
- Long-term evolutionary trends
Example: "House prices increased 15% annually from 2020-2023 in inner London boroughs"`,

            "geographic_patterns": `
GEOGRAPHIC PATTERNS (${breakdown.geographic_patterns || 0} propositions):
Focus on spatial analysis:
- Borough-level comparisons with specific rankings or ratios
- Inner vs Outer London distinctions
- Clustering and hotspot identification
- North/South/East/West regional patterns
- LSOA-level granular patterns (if available)
Example: "Camden and Westminster account for 35% of all theft incidents despite 8% of London's area"`,

            "categorical_analysis": `
CATEGORICAL ANALYSIS (${breakdown.categorical_analysis || 0} propositions):
Focus on category distributions and comparisons:
- Most/least common categories with exact percentages
- Category concentration patterns by geography
- Proportional analysis between different categories
- Rare vs common category identification
Example: "Budget gyms represent 60% of fitness facilities in low-income boroughs vs 20% in high-income areas"`,

            "cross_dimensional": `
CROSS-DIMENSIONAL ANALYSIS (${breakdown.cross_dimensional || 0} propositions):
Focus on interactions between multiple dimensions:
- Time × Geography: Seasonal geographic patterns
- Category × Geography: Different categories by location
- Time × Category: Category evolution over time
- Complex three-way interactions
Example: "Burglary incidents peak 40% higher in suburban boroughs during December holiday periods"`,

            "statistical_patterns": `
STATISTICAL PATTERNS (${breakdown.statistical_patterns || 0} propositions):
Focus on statistical relationships and distributions:
- Correlation patterns between variables
- Outlier identification with specific metrics
- Distribution characteristics (normal, skewed, bimodal)
- Variance analysis across dimensions
- Concentration ratios and inequality measures
Example: "Vehicle ownership follows power law distribution with top 10% of boroughs accounting for 45% of all vehicles"`
        };

        return Object.keys(breakdown)
            .map(category => instructions[category] || `\n${category.toUpperCase()}: Generate ${breakdown[category]} propositions for this category.`)
            .join('\n');
    }

    /**
     * Helper method to build dataset info from metadata
     * @private
     */
    buildDatasetInfo(datasetName, metadata) {
        const timeRangeMap = {
            'crime-rates': '2022-2023',
            'ethnicity': '2021 Census',
            'population': '1801-2021',
            'income': '1999-2023',
            'house-prices': '1995-2023',
            'schools-colleges': '2021-2023',
            'vehicles': '2019-2023',
            'restaurants': '2001-2017',
            'private-rent': '2011-2023',
            'gyms': '2024',
            'libraries': '2022-2023'
        };

        return {
            description: metadata.justification || `London ${datasetName} dataset`,
            time_range: timeRangeMap[datasetName] || this.extractTimeRange(metadata.complexity_factors),
            geographic_scope: metadata.complexity_factors?.geographic_levels?.replace(/_/g, ' ') || 'London boroughs',
            key_dimensions: this.extractKeyDimensions(metadata),
            main_columns: this.buildMockColumns(datasetName),
            sample_values: this.buildMockSampleValues(datasetName)
        };
    }

    /**
     * Extract time range from complexity factors
     * @private
     */
    extractTimeRange(complexityFactors) {
        if (!complexityFactors) return 'Not specified';
        return complexityFactors.time_span || 'Not specified';
    }

    /**
     * Extract key dimensions from metadata
     * @private
     */
    extractKeyDimensions(metadata) {
        const factors = metadata.complexity_factors || {};
        const dimensions = [];
        
        if (factors.temporal_granularity) dimensions.push('Temporal');
        if (factors.geographic_levels) dimensions.push('Geographic');
        if (factors.categorical_richness && factors.categorical_richness !== 'few_categories') {
            dimensions.push('Categorical');
        }
        
        return dimensions.length > 0 ? dimensions : ['Geographic', 'Temporal'];
    }

    /**
     * Build mock columns based on dataset name
     * @private
     */
    buildMockColumns(datasetName) {
        const columnMap = {
            'crime-rates': {
                'area_name': 'LSOA area name',
                'borough_name': 'London borough',
                'crime_category': 'Type of crime',
                'date': 'Month-year of incident',
                'count': 'Number of incidents'
            },
            'ethnicity': {
                'LSOA_code': 'Lower Super Output Area code',
                'local_authority_name': 'Borough name',
                'White_British': 'Count of White British residents',
                'Asian_Indian': 'Count of Asian Indian residents',
                'Black_African': 'Count of Black African residents'
            },
            'income': {
                'Area': 'Borough name',
                'Mean_income': 'Mean income in pounds',
                'Median_income': 'Median income in pounds',
                'Year': 'Tax year'
            }
        };
        
        return columnMap[datasetName] || {
            'area': 'Geographic area',
            'value': 'Measured value',
            'category': 'Data category',
            'date': 'Time period'
        };
    }

    /**
     * Build mock sample values
     * @private
     */
    buildMockSampleValues(datasetName) {
        const sampleMap = {
            'crime-rates': {
                'borough_name': ['Westminster', 'Camden', 'Tower Hamlets'],
                'crime_category': ['theft-from-the-person', 'burglary', 'violent-crime'],
                'date': ['2022-01', '2022-02', '2023-01']
            },
            'income': {
                'Area': ['Kensington and Chelsea', 'Westminster', 'Camden'],
                'Mean_income': [85000, 65000, 45000]
            }
        };
        
        return sampleMap[datasetName] || {};
    }

    /**
     * Generate mock propositions based on the new prompt structure
     * @private
     */
    generateMockPropositionsFromPrompt(datasetName, metadata) {
        const breakdown = metadata.proposition_breakdown || {};
        const allPropositions = [];
        
        Object.entries(breakdown).forEach(([category, count]) => {
            for (let i = 1; i <= count; i++) {
                allPropositions.push({
                    id: `${datasetName}_${category}_${i}`,
                    proposition: `[MOCK] ${category} analysis ${i} for ${datasetName} with specific metrics and timeframes`,
                    variables_needed: this.getMockVariables(datasetName),
                    time_period: this.getMockTimePeriod(datasetName),
                    geographic_level: metadata.complexity_factors?.geographic_levels || 'Borough',
                    suggested_visualization: this.suggestVisualization(category),
                    complexity_level: this.getComplexityLevel(metadata.complexity_score),
                    generated_by: 'mock_llm_prompt'
                });
            }
        });
        
        return allPropositions;
    }

    /**
     * Get mock variables for dataset
     * @private
     */
    getMockVariables(datasetName) {
        const variableMap = {
            'crime-rates': ['borough_name', 'crime_category', 'date', 'count'],
            'income': ['Area', 'Mean_income', 'Year'],
            'population': ['area_name', 'population', 'year']
        };
        
        return variableMap[datasetName] || ['area', 'value', 'category'];
    }

    /**
     * Get mock time period
     * @private
     */
    getMockTimePeriod(datasetName) {
        const timePeriodMap = {
            'crime-rates': '2022-2023',
            'income': '2020-2023',
            'population': '2011-2021',
            'gyms': '2024'
        };
        
        return timePeriodMap[datasetName] || 'Not applicable';
    }

    /**
     * Get complexity level based on score
     * @private
     */
    getComplexityLevel(score) {
        if (score >= 7) return 'Advanced';
        if (score >= 5) return 'Intermediate';
        return 'Basic';
    }

    /**
     * Suggest visualization type based on category
     * @private
     */
    suggestVisualization(category) {
        const suggestions = {
            temporal_trends: 'line_chart',
            geographic_patterns: 'choropleth_map',
            categorical_analysis: 'stacked_bar_chart',
            cross_dimensional: 'heatmap',
            statistical_patterns: 'histogram',
            default: 'bar_chart'
        };
        
        return suggestions[category] || suggestions.default;
    }

    /**
     * Suggest visualization for cross-dataset analysis
     * @private
     */
    suggestCrossDatasetVisualization(datasetCount) {
        if (datasetCount <= 2) return 'scatter_plot';
        if (datasetCount <= 3) return 'bubble_chart';
        return 'parallel_coordinates';
    }

    /**
     * Mock implementation for cross-dataset propositions (updated)
     * @private
     */
    generateMockCrossDatasetPropositions(category, datasets, count) {
        const propositions = [];
        
        for (let i = 0; i < count; i++) {
            propositions.push({
                id: `cross_${category}_${i + 1}`,
                proposition: `Cross-dataset analysis reveals ${category} relationships between ${datasets.slice(0, 2).join(' and ')} with specific metrics and timeframes`,
                datasets_required: datasets.slice(0, 2),
                variables_needed: this.getMockCrossDatasetVariables(datasets),
                time_periods: this.getMockCrossDatasetTimePeriods(datasets),
                relationship_type: ['correlation', 'lag', 'proxy', 'causal'][i % 4],
                suggested_visualization: this.suggestCrossDatasetVisualization(datasets.length),
                temporal_assumption: `Assumes ${datasets[0]} data influences ${datasets[1]} patterns`,
                generated_by: 'mock_llm_cross'
            });
        }
        
        return propositions;
    }

    /**
     * Get mock variables for cross-dataset analysis
     * @private
     */
    getMockCrossDatasetVariables(datasets) {
        const variablesByDataset = {};
        datasets.slice(0, 2).forEach(dataset => {
            variablesByDataset[dataset] = this.getMockVariables(dataset);
        });
        return variablesByDataset;
    }

    /**
     * Get mock time periods for cross-dataset analysis
     * @private
     */
    getMockCrossDatasetTimePeriods(datasets) {
        const timePeriodsByDataset = {};
        datasets.slice(0, 2).forEach(dataset => {
            timePeriodsByDataset[dataset] = this.getMockTimePeriod(dataset);
        });
        return timePeriodsByDataset;
    }

    /**
     * Actual OpenAI API call for proposition generation
     * @private
     */
    async callLLM(prompt, options = {}) {
        try {
            console.log(`🤖 [LLM] Calling ${this.model} with prompt length: ${prompt.length} characters`);
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert data analyst specializing in London urban data analysis. Always return valid JSON responses.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: options.max_tokens || this.maxTokens,
                    temperature: options.temperature || this.temperature,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            console.log(`✅ [LLM] Successfully generated response (${data.usage?.total_tokens || 'unknown'} tokens)`);
            
            return {
                content: data.choices[0].message.content,
                usage: data.usage
            };
            
        } catch (error) {
            console.error(`❌ [LLM] API call failed:`, error.message);
            
            // Fallback to mock response if API fails
            console.log('🔄 [LLM] Falling back to mock response');
            return {
                content: '{"mock": "response", "error": "API call failed"}',
                usage: { tokens: prompt.length / 4 },
                fallback: true
            };
        }
    }

    /**
     * Parse LLM response into structured propositions
     * @private
     */
    parsePropositionResponse(response) {
        try {
            return JSON.parse(response.content);
        } catch (error) {
            console.error('Failed to parse LLM response:', error.message);
            return { error: 'Failed to parse response', raw_response: response.content };
        }
    }
}

module.exports = LLMPropositionService;
