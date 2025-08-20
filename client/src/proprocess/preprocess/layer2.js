const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

class SQLQueryGenerator {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    
    // Load chart templates from input.json
    this.chartTemplates = this.loadChartTemplates();
  }

  /**
   * Load chart templates from input.json
   */
  loadChartTemplates() {
    try {
      const templatesPath = path.join(__dirname, '../../chartTemplates/input.json');
      const rawData = fs.readFileSync(templatesPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading chart templates:', error);
      return null;
    }
  }

  /**
   * Get chart template configuration for a specific chart type
   */
  getChartConfig(chartType) {
    if (!this.chartTemplates) return null;
    
    // Map our chart type naming to template naming
    const chartTypeMapping = {
      'barChart_simple_2D': 'barChart',
      'barChart_simple_3D': 'barChart',
      'barChart_with_mean_2D': 'barChart',
      'barChart_with_mean_3D': 'barChart',
      'barChart_with_threshold_2D': 'barChart',
      'barChart_with_threshold_3D': 'barChart',
      'barChart_with_mean_threshold_2D': 'barChart',
      'barChart_with_mean_threshold_3D': 'barChart',
      'groupedBarChart_simple_2D': 'groupedBarChart',
      'groupedBarChart_simple_3D': 'groupedBarChart',
      'stackedBarChart_simple_2D': 'stackedBarChart',
      'stackedBarChart_simple_3D': 'stackedBarChart',
      'divergentBar_simple_2D': 'divergentBar',
      'divergentBar_simple_3D': 'divergentBar',
      'lineChart_simple_2D': 'lineChart',
      'lineChart_simple_3D': 'lineChart',
      'multiLineChart_simple_2D': 'multiLineChart',
      'multiLineChart_simple_3D': 'multiLineChart',
      'areaChart_simple_2D': 'areaChart',
      'areaChart_simple_3D': 'areaChart',
      'comboBarLineChart_simple_2D': 'comboBarLineChart',
      'comboBarLineChart_simple_3D': 'comboBarLineChart',
      'donutChart_simple_2D': 'donutChart',
      'donutChart_simple_3D': 'donutChart',
      'scatterPlot_simple_2D': 'scatterPlot',
      'scatterPlot_simple_3D': 'scatterPlot',
      'bubbleChart_simple_2D': 'bubbleChart',
      'bubbleChart_simple_3D': 'bubbleChart',
      'histogram_simple_2D': 'histogram',
      'histogram_simple_3D': 'histogram',
      'histogramHeatmap_simple_2D': 'histogramHeatmap'
    };
    
    const templateName = chartTypeMapping[chartType];
    if (!templateName || !this.chartTemplates.chartTemplates[templateName]) {
      return null;
    }
    
    const template = this.chartTemplates.chartTemplates[templateName];
    const is3D = chartType.includes('_3D');
    
    return {
      template,
      mode: is3D ? '3D' : '2D',
      chartType: templateName,
      variation: this.getChartVariation(chartType)
    };
  }

  /**
   * Determine chart variation from chart type
   */
  getChartVariation(chartType) {
    if (chartType.includes('with_mean_threshold')) return 'with_mean_threshold';
    if (chartType.includes('with_mean')) return 'with_mean';
    if (chartType.includes('with_threshold')) return 'with_threshold';
    if (chartType.includes('grouped')) return 'grouped';
    if (chartType.includes('stacked')) return 'stacked';
    if (chartType.includes('divergent')) return 'divergent';
    return 'simple';
  }

  /**
   * Create LLM prompt for SQL generation
   */
  createSQLPrompt(proposition, chartConfig) {
    const { template, mode, chartType, variation } = chartConfig;
    const is3D = mode === '3D';
    
    return `You are a SQL query generator that creates executable database queries for data visualization.

## Your Task:
Generate a SQL query to retrieve data for: ${chartType} (${mode} mode, ${variation} variation)

## Proposition Details:
- Dataset: ${proposition.dataset}
- Time Period: ${proposition.time_period}
- Variables Needed: ${JSON.stringify(proposition.variables_needed)}

## Database Schema (choose appropriate table):
- crime-rates → crime_data (columns: borough_name, crime_category, date, count)
- ethnicity → ethnicity_data (columns: borough_name, area_name, ethnic_group, population_count, percentage)
- population → population_data (columns: borough_name, area_name, date, age_group, population_count)
- income → income_data (columns: borough_name, area_name, date, income_level, median_income, average_income)
- house-prices → house_price_data (columns: borough_name, area_name, date, property_type, average_price, median_price)
- country-of-births → birth_country_data (columns: borough_name, area_name, country_of_birth, population_count, percentage)
- schools-colleges → education_data (columns: borough_name, institution_type, institution_name, student_count, rating)
- vehicles → vehicle_data (columns: borough_name, area_name, date, vehicle_type, registration_count)
- restaurants → restaurant_data (columns: borough_name, area_name, cuisine_type, restaurant_count, rating)
- private-rent → rent_data (columns: borough_name, area_name, date, property_type, average_rent, median_rent)
- gyms → gym_data (columns: borough_name, area_name, gym_name, membership_count, facility_type)
- libraries → library_data (columns: borough_name, area_name, library_name, visitor_count, book_count)

## Required Output Format:
Based on chart type "${chartType}" (${variation} variation, ${mode} mode), the SQL must return columns that match this structure:

${this.getExpectedColumns(chartType, variation, is3D)}

## Requirements:
1. Use appropriate table for dataset "${proposition.dataset}"
2. Apply time filtering for "${proposition.time_period}" (use proper date format)
3. Include proper GROUP BY, ORDER BY clauses
4. Column names must match the expected output format exactly
5. Query must be executable and return meaningful data
6. ${is3D ? 'Include dimension column for 3D chart switching capability' : 'Simple 2D structure without dimension switching'}

Return ONLY the SQL query, no explanations or markdown formatting.`;
  }

  /**
   * Get expected column structure for each chart type
   */
  getExpectedColumns(chartType, variation = 'simple', is3D = false) {
    const baseDimension = is3D ? '\n- dimension (text) - for 3D chart switching' : '';
    
    switch (chartType) {
      case 'donutChart':
        return `- category (text)\n- value (number)\n- percentage (number)${baseDimension}`;
      
      case 'barChart':
        let barColumns = `- category (text)\n- value (number)${baseDimension}`;
        if (variation.includes('mean')) {
          barColumns += '\n- mean_value (number) - calculated mean for overlay';
        }
        if (variation.includes('threshold')) {
          barColumns += '\n- threshold_value (number) - threshold line value';
          barColumns += '\n- above_threshold (boolean) - whether value exceeds threshold';
        }
        return barColumns;
      
      case 'groupedBarChart':
        return `- category (text)\n- series (text) - group identifier\n- value (number)${baseDimension}`;
      
      case 'stackedBarChart':
        return `- category (text)\n- stack_segment (text) - stack component identifier\n- value (number)${baseDimension}`;
      
      case 'lineChart':
        return `- time (text/date)\n- value (number)${baseDimension}`;
      
      case 'areaChart':
        return `- time (text/date)\n- value (number)${baseDimension}`;
      
      case 'multiLineChart':
        return `- time (text/date)\n- series (text) - line identifier\n- value (number)${baseDimension}`;
      
      case 'scatterPlot':
        return `- category (text)\n- x_value (number)\n- y_value (number)${baseDimension}`;
      
      case 'bubbleChart':
        return `- category (text)\n- x_value (number)\n- y_value (number)\n- size (number)${baseDimension}`;
      
      case 'histogram':
        return `- bin (text) - histogram bin range\n- frequency (number)${baseDimension}`;
      
      case 'comboBarLineChart':
        return `- category (text)\n- bar_value (number)\n- line_value (number)${baseDimension}`;
      
      case 'divergentBar':
        return `- category (text)\n- positive_value (number)\n- negative_value (number)${baseDimension}`;
      
      case 'histogramHeatmap':
        return '- x_bin (text)\n- y_bin (text)\n- count (number)';
      
      default:
        return `- category (text)\n- value (number)${baseDimension}`;
    }
  }

  /**
   * Generate example data structure based on chart type and SQL query
   */
  generateExampleStructure(chartConfig, proposition) {
    const { template, mode, chartType, variation } = chartConfig;
    const is3D = mode === '3D';
    
    // Create example based on chart type and mode
    switch (chartType) {
      case 'donutChart':
        if (is3D) {
          return [
            { "category": "", "value": 0, "percentage": 0.0, "dimension": "" },
            { "category": "", "value": 0, "percentage": 0.0, "dimension": "" }
          ];
        } else {
          return [
            { "category": "", "value": 0, "percentage": 0.0 },
            { "category": "", "value": 0, "percentage": 0.0 }
          ];
        }
      
      case 'barChart':
        if (variation === 'with_mean' || variation === 'with_threshold' || variation === 'with_mean_threshold') {
          const baseStructure = is3D 
            ? [{ "category": "", "value": 0, "dimension": "" }, { "category": "", "value": 0, "dimension": "" }]
            : [{ "category": "", "value": 0 }, { "category": "", "value": 0 }];
          
          if (variation.includes('mean')) {
            baseStructure.push({ "mean_value": 0 });
          }
          if (variation.includes('threshold')) {
            baseStructure.push({ "threshold_value": 0, "above_threshold": true });
          }
          return baseStructure;
        } else {
          return is3D 
            ? [{ "category": "", "value": 0, "dimension": "" }, { "category": "", "value": 0, "dimension": "" }]
            : [{ "category": "", "value": 0 }, { "category": "", "value": 0 }];
        }
      
      case 'groupedBarChart':
        return is3D 
          ? [{ "category": "", "series": "", "value": 0, "dimension": "" }, { "category": "", "series": "", "value": 0, "dimension": "" }]
          : [{ "category": "", "series": "", "value": 0 }, { "category": "", "series": "", "value": 0 }];
      
      case 'stackedBarChart':
        return is3D 
          ? [{ "category": "", "stack_segment": "", "value": 0, "dimension": "" }, { "category": "", "stack_segment": "", "value": 0, "dimension": "" }]
          : [{ "category": "", "stack_segment": "", "value": 0 }, { "category": "", "stack_segment": "", "value": 0 }];
      
      case 'lineChart':
        return is3D 
          ? [{ "time": "", "value": 0, "dimension": "" }, { "time": "", "value": 0, "dimension": "" }]
          : [{ "time": "", "value": 0 }, { "time": "", "value": 0 }];
      
      case 'areaChart':
        return is3D 
          ? [{ "time": "", "value": 0, "dimension": "" }, { "time": "", "value": 0, "dimension": "" }]
          : [{ "time": "", "value": 0 }, { "time": "", "value": 0 }];
      
      case 'multiLineChart':
        return is3D 
          ? [{ "time": "", "series": "", "value": 0, "dimension": "" }, { "time": "", "series": "", "value": 0, "dimension": "" }]
          : [{ "time": "", "series": "", "value": 0 }, { "time": "", "series": "", "value": 0 }];
      
      case 'scatterPlot':
        return is3D 
          ? [{ "category": "", "x_value": 0, "y_value": 0, "dimension": "" }, { "category": "", "x_value": 0, "y_value": 0, "dimension": "" }]
          : [{ "category": "", "x_value": 0, "y_value": 0 }, { "category": "", "x_value": 0, "y_value": 0 }];
      
      case 'bubbleChart':
        return is3D 
          ? [{ "category": "", "x_value": 0, "y_value": 0, "size": 0, "dimension": "" }, { "category": "", "x_value": 0, "y_value": 0, "size": 0, "dimension": "" }]
          : [{ "category": "", "x_value": 0, "y_value": 0, "size": 0 }, { "category": "", "x_value": 0, "y_value": 0, "size": 0 }];
      
      case 'histogram':
        return is3D 
          ? [{ "bin": "", "frequency": 0, "dimension": "" }, { "bin": "", "frequency": 0, "dimension": "" }]
          : [{ "bin": "", "frequency": 0 }, { "bin": "", "frequency": 0 }];
      
      case 'comboBarLineChart':
        return is3D 
          ? [{ "category": "", "bar_value": 0, "line_value": 0, "dimension": "" }, { "category": "", "bar_value": 0, "line_value": 0, "dimension": "" }]
          : [{ "category": "", "bar_value": 0, "line_value": 0 }, { "category": "", "bar_value": 0, "line_value": 0 }];
      
      case 'divergentBar':
        return is3D 
          ? [{ "category": "", "positive_value": 0, "negative_value": 0, "dimension": "" }, { "category": "", "positive_value": 0, "negative_value": 0, "dimension": "" }]
          : [{ "category": "", "positive_value": 0, "negative_value": 0 }, { "category": "", "positive_value": 0, "negative_value": 0 }];
      
      case 'histogramHeatmap':
        // Heatmaps are typically only 2D
        return [
          { "x_bin": "", "y_bin": "", "count": 0 },
          { "x_bin": "", "y_bin": "", "count": 0 }
        ];
      
      default:
        return is3D 
          ? [{ "category": "", "value": 0, "dimension": "" }, { "category": "", "value": 0, "dimension": "" }]
          : [{ "category": "", "value": 0 }, { "category": "", "value": 0 }];
    }
  }

  /**
   * Clean SQL query - remove markdown formatting and extra whitespace
   */
  cleanSqlQuery(sqlQuery) {
    if (!sqlQuery) return null;
    
    // Remove SQL markdown code blocks
    let cleaned = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '');
    
    // Remove extra whitespace and normalize
    cleaned = cleaned.trim().replace(/\s+/g, ' ');
    
    return cleaned;
  }

  /**
   * Process a single proposition to generate SQL query
   */
  async processSingleProposition(proposition) {
    try {
      // Get chart configuration
      const chartConfig = this.getChartConfig(proposition.chart_type);
      if (!chartConfig) {
        console.warn(`Unknown chart type: ${proposition.chart_type}`);
        return {
          proposition_id: proposition.proposition_id,
          error: `Unsupported chart type: ${proposition.chart_type}`,
          sql_query: null
        };
      }

      // Create LLM prompt
      const prompt = this.createSQLPrompt(proposition, chartConfig);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 800
      });

      const rawSqlQuery = response.choices[0]?.message?.content?.trim();
      if (!rawSqlQuery) {
        throw new Error('Empty response from OpenAI');
      }

      // Clean the SQL query
      const cleanedSqlQuery = this.cleanSqlQuery(rawSqlQuery);

      // Generate example structure
      const exampleStructure = this.generateExampleStructure(chartConfig, proposition);

      return {
        proposition_id: proposition.proposition_id,
        dataset: proposition.dataset,
        time_period: proposition.time_period,
        variables_needed: proposition.variables_needed,
        chart_type: proposition.chart_type,
        example: exampleStructure,
        sql_query: cleanedSqlQuery
      };

    } catch (error) {
      console.error(`Error processing proposition ${proposition.proposition_id}:`, error);
      return {
        proposition_id: proposition.proposition_id,
        error: error.message,
        sql_query: null
      };
    }
  }

  /**
   * Process all proposition files from layer1 output
   */
  async processAllLayer1Output(inputDir, outputDir, batchSize = 3) {
    console.log('🔄 Starting Layer 2: SQL Query Generation...');
    console.log('=====================================\n');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const allResults = [];
    let totalProcessed = 0;

    // Process each dataset directory
    const datasetDirs = fs.readdirSync(inputDir).filter(item => {
      const itemPath = path.join(inputDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    for (const datasetName of datasetDirs) {
      console.log(`\nProcessing dataset: ${datasetName}`);
      const datasetDir = path.join(inputDir, datasetName);
      const datasetResults = {};

      // Process each category file in the dataset
      const categoryFiles = fs.readdirSync(datasetDir).filter(file => 
        file.endsWith('.json') && !file.endsWith('_complete.json')
      );

      for (const categoryFile of categoryFiles) {
        const categoryName = categoryFile.replace('.json', '');
        console.log(`  Processing category: ${categoryName}`);

        const categoryPath = path.join(datasetDir, categoryFile);
        const categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));

        const categoryResults = [];

        if (categoryData.propositions && categoryData.propositions.length > 0) {
          // Process propositions in batches
          for (let i = 0; i < categoryData.propositions.length; i += batchSize) {
            const batch = categoryData.propositions.slice(i, i + batchSize);
            const batchPromises = batch.map(prop => this.processSingleProposition(prop));

            try {
              const batchResults = await Promise.all(batchPromises);
              categoryResults.push(...batchResults);
              allResults.push(...batchResults);
              totalProcessed += batchResults.length;

              console.log(`    Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(categoryData.propositions.length/batchSize)} (${totalProcessed} total)`);

              // Add delay between batches to respect rate limits
              if (i + batchSize < categoryData.propositions.length) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
              }

            } catch (error) {
              console.error(`Error processing batch starting at index ${i}:`, error);
            }
          }
        }

        // Save category results with SQL queries
        const categoryOutput = {
          category: categoryName,
          dataset: datasetName,
          processed_at: new Date().toISOString(),
          total_queries: categoryResults.length,
          sql_queries: categoryResults
        };

        datasetResults[categoryName] = categoryOutput;

        // Save individual category file
        const categoryOutputPath = path.join(outputDir, datasetName);
        if (!fs.existsSync(categoryOutputPath)) {
          fs.mkdirSync(categoryOutputPath, { recursive: true });
        }

        const categoryFilePath = path.join(categoryOutputPath, `${categoryName}_sql.json`);
        fs.writeFileSync(categoryFilePath, JSON.stringify(categoryOutput, null, 2));
        console.log(`    Saved SQL queries to: ${categoryFilePath}`);
      }

      // Save complete dataset SQL file
      const datasetOutput = {
        dataset: datasetName,
        processed_at: new Date().toISOString(),
        total_queries: Object.values(datasetResults).reduce((sum, cat) => sum + cat.total_queries, 0),
        categories: datasetResults
      };

      const datasetFilePath = path.join(outputDir, `${datasetName}_sql_complete.json`);
      fs.writeFileSync(datasetFilePath, JSON.stringify(datasetOutput, null, 2));
      console.log(`  Saved complete ${datasetName} SQL queries to: ${datasetFilePath}`);
    }

    // Save master SQL file
    const masterOutput = {
      processed_at: new Date().toISOString(),
      total_sql_queries: allResults.length,
      successful_queries: allResults.filter(r => r.sql_query !== null).length,
      failed_queries: allResults.filter(r => r.sql_query === null).length,
      queries_by_dataset: this.summarizeByDataset(allResults),
      queries_by_chart_type: this.summarizeByChartType(allResults),
      all_sql_queries: allResults
    };

    const masterFilePath = path.join(outputDir, 'all_sql_queries_complete.json');
    fs.writeFileSync(masterFilePath, JSON.stringify(masterOutput, null, 2));

    console.log('\n=====================================');
    console.log('✅ Layer 2 SQL Generation completed successfully!');
    console.log(`📊 Total SQL queries generated: ${allResults.length}`);
    console.log(`✅ Successful: ${allResults.filter(r => r.sql_query !== null).length}`);
    console.log(`❌ Failed: ${allResults.filter(r => r.sql_query === null).length}`);
    console.log(`📁 Master SQL file: ${masterFilePath}`);
  }

  /**
   * Generate summary statistics
   */
  summarizeByDataset(results) {
    const summary = {};
    results.forEach(result => {
      if (!summary[result.dataset]) {
        summary[result.dataset] = { total: 0, successful: 0, failed: 0 };
      }
      summary[result.dataset].total++;
      if (result.sql_query) {
        summary[result.dataset].successful++;
      } else {
        summary[result.dataset].failed++;
      }
    });
    return summary;
  }

  summarizeByChartType(results) {
    const summary = {};
    results.forEach(result => {
      if (!summary[result.chart_type]) {
        summary[result.chart_type] = { total: 0, successful: 0, failed: 0 };
      }
      summary[result.chart_type].total++;
      if (result.sql_query) {
        summary[result.chart_type].successful++;
      } else {
        summary[result.chart_type].failed++;
      }
    });
    return summary;
  }
}

// Export class and main function
module.exports = { SQLQueryGenerator };

// Main execution function
async function main() {
  try {
    const generator = new SQLQueryGenerator();
    
    // Paths
    const inputDir = path.join(__dirname, 'output', 'by_dataset');
    const outputDir = path.join(__dirname, 'output_layer2', 'sql_queries', 'by_dataset');
    
    console.log(`📂 Input directory: ${inputDir}`);
    console.log(`📂 Output directory: ${outputDir}`);
    
    // Check if input directory exists
    if (!fs.existsSync(inputDir)) {
      console.error(`❌ Input directory not found: ${inputDir}`);
      console.error('Please run layer1.js first to generate proposition data.');
      process.exit(1);
    }
    
    await generator.processAllLayer1Output(inputDir, outputDir);
    
  } catch (error) {
    console.error('❌ Layer 2 processing failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}
