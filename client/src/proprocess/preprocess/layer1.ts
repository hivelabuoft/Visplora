import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Chart type mapping from suggested_visualization to our internal chart types
const CHART_TYPE_MAPPING: Record<string, string[]> = {
  // Line charts
  'line_chart': ['lineChart_simple_2D', 'lineChart_simple_3D'],
  
  // Bar charts
  'bar_chart': ['barChart_simple_2D', 'barChart_with_mean_2D', 'barChart_with_threshold_2D'],
  'grouped_bar': ['groupedBarChart_simple_2D', 'groupedBarChart_with_mean_2D'],
  'stacked_bar': ['stackedBarChart_simple_2D', 'stackedBarChart_with_mean_2D'],
  
  // Pie/Donut charts
  'pie_chart': ['donutChart_simple_2D', 'donutChart_simple_3D'],
  
  // Maps and heatmaps
  'choropleth_map': ['barChart_simple_2D'], // Maps converted to bar charts for now
  'heat_map': ['histogramHeatmap_simple_2D'],
  'heatmap': ['histogramHeatmap_simple_2D'],
  
  // Distribution charts
  'histogram': ['histogram_simple_2D', 'histogram_simple_3D'],
  'box_plot': ['histogram_simple_2D'], // Box plots as histograms for now
  
  // Correlation charts
  'scatter_plot': ['scatterPlot_simple_2D', 'scatterPlot_simple_3D'],
  
  // Special charts
  'pareto_chart': ['barChart_with_threshold_2D'], // Pareto as bar with threshold
  'density_plot': ['histogram_simple_2D'],
  
  // Multi-line
  'multi_line': ['multiLineChart_simple_2D', 'multiLineChart_simple_3D'],
  
  // Area charts
  'area_chart': ['areaChart_simple_2D', 'areaChart_simple_3D'],
  
  // Bubble charts
  'bubble_chart': ['bubbleChart_simple_2D', 'bubbleChart_simple_3D']
};

// TAPAS question templates
const TAPAS_TEMPLATES = {
  ranking: [
    "Which {entity} has the highest {metric}?",
    "Which {entity} has the lowest {metric}?",
    "What is the average {metric} per {entity}?"
  ],
  proportion: [
    "What percentage of the total {metric} is in {specific_entity}?",
    "Which {entity} accounts for the largest share of {metric}?",
    "How much of the {metric} is concentrated in the top 3 {entity}s?"
  ],
  temporal: [
    "How did {metric} change from {start_period} to {end_period}?",
    "In which period was {metric} highest?",
    "What was the trend of {metric} over time?"
  ],
  comparison: [
    "How does {entity1} compare to {entity2} in terms of {metric}?",
    "Which {entity} performs better than the average?",
    "What is the difference between the highest and lowest {metric}?"
  ],
  distribution: [
    "What is the distribution pattern of {metric}?",
    "Are there any outliers in {metric} values?",
    "What is the range of {metric} values?"
  ]
};

interface PropositionData {
  id: string;
  proposition: string;
  variables_needed: string[];
  time_period: string;
  geographic_level: string;
  suggested_visualization: string;
  complexity_level: string;
}

interface ProcessedProposition {
  proposition_id: string;
  dataset: string;
  category: string;
  original_proposition: string;
  reworded_proposition: string;
  chart_type: string;
  chart_title: string;
  chart_description: string;
  reasoning: string;
  tapas_questions: string[];
  variables_needed: string[];
  time_period: string;
  geographic_level: string;
  complexity_level: string;
}

class PropositionPreprocessor {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Select appropriate chart type based on proposition characteristics
   */
  private selectChartType(proposition: PropositionData): string {
    const suggestedViz = proposition.suggested_visualization.toLowerCase();
    
    // Get possible chart types for this visualization
    const possibleCharts = CHART_TYPE_MAPPING[suggestedViz] || ['barChart_simple_2D'];
    
    // Logic to select specific chart variation based on proposition content
    const propositionText = proposition.proposition.toLowerCase();
    
    // If it mentions average, mean, or comparison to benchmark
    if (propositionText.includes('average') || propositionText.includes('mean') || 
        propositionText.includes('compared to') || propositionText.includes('above') ||
        propositionText.includes('below')) {
      // Look for chart types with mean
      const meanCharts = possibleCharts.filter((chart: string) => chart.includes('with_mean'));
      if (meanCharts.length > 0) return meanCharts[0];
    }
    
    // If it mentions threshold, exceeds, safe rate, etc.
    if (propositionText.includes('threshold') || propositionText.includes('exceed') ||
        propositionText.includes('safe') || propositionText.includes('limit')) {
      const thresholdCharts = possibleCharts.filter((chart: string) => chart.includes('with_threshold'));
      if (thresholdCharts.length > 0) return thresholdCharts[0];
    }
    
    // If it mentions multiple categories/dimensions
    if (proposition.variables_needed.length > 3 && 
        (propositionText.includes('by') || propositionText.includes('across'))) {
      const threeDCharts = possibleCharts.filter((chart: string) => chart.includes('3D'));
      if (threeDCharts.length > 0) return threeDCharts[0];
    }
    
    // Default to first option
    return possibleCharts[0];
  }

  /**
   * Generate TAPAS validation questions
   */
  private generateTapasQuestions(proposition: PropositionData, chartType: string): string[] {
    const propositionText = proposition.proposition.toLowerCase();
    const questions: string[] = [];
    
    // Extract entities and metrics from variables
    const variables = proposition.variables_needed;
    const entityVar = variables.find(v => 
      v.includes('borough') || v.includes('area') || v.includes('authority') || v.includes('name')
    ) || 'area';
    
    const metricVar = variables.find(v => 
      v.includes('count') || v.includes('value') || v.includes('income') || 
      v.includes('rate') || v.includes('population')
    ) || 'value';
    
    // Clean up variable names for questions
    const entity = entityVar.replace(/_/g, ' ').replace('name', '').trim() || 'borough';
    const metric = metricVar.replace(/_/g, ' ').trim();
    
    // Generate questions based on chart type and proposition content
    if (chartType.includes('bar') || chartType.includes('ranking')) {
      questions.push(`Which ${entity} has the highest ${metric}?`);
      questions.push(`Which ${entity} has the lowest ${metric}?`);
      
      if (chartType.includes('with_mean')) {
        questions.push(`What is the average ${metric} per ${entity}?`);
        questions.push(`Which ${entity}s are above the average ${metric}?`);
      }
    }
    
    if (chartType.includes('donut') || chartType.includes('pie') || 
        propositionText.includes('percentage') || propositionText.includes('accounts for')) {
      questions.push(`What percentage of the total ${metric} is in each ${entity}?`);
      questions.push(`Which ${entity} accounts for the largest share of ${metric}?`);
    }
    
    if (chartType.includes('line') || proposition.time_period !== 'Not applicable') {
      questions.push(`How did ${metric} change over time?`);
      if (proposition.time_period.includes('-')) {
        const [start, end] = proposition.time_period.split('-');
        questions.push(`What was the ${metric} trend from ${start} to ${end}?`);
      }
    }
    
    if (chartType.includes('scatter') || chartType.includes('bubble')) {
      questions.push(`What is the correlation between the variables?`);
      questions.push(`Are there any outliers in the data?`);
    }
    
    // Generic questions for any chart
    questions.push(`What is the overall pattern shown in the data?`);
    
    return questions.slice(0, 4); // Return max 4 questions
  }

  /**
   * Create LLM prompt for proposition rewriting and metadata generation
   */
  private createLLMPrompt(proposition: PropositionData, dataset: string, category: string, chartType: string): string {
    return `You are a data visualization expert tasked with rewriting narrative propositions for better user understanding.

TASK: Rewrite the given proposition to be more interpretive and insight-focused, removing hard-coded statistics while maintaining the core message.

INPUT DATA:
- Dataset: ${dataset}
- Category: ${category}
- Original Proposition: "${proposition.proposition}"
- Chart Type: ${chartType}
- Variables: ${proposition.variables_needed.join(', ')}
- Time Period: ${proposition.time_period}
- Geographic Level: ${proposition.geographic_level}

REQUIREMENTS:
1. REWORD the proposition to avoid specific percentages/numbers
2. Make it more interpretive and insight-focused
3. Keep the core geographical/categorical comparison
4. Generate a suitable chart title (max 60 characters)
5. Generate a chart description (max 120 characters)
6. Provide reasoning for why this chart type fits

EXAMPLES:
Original: "Westminster accounts for 25% of all theft-from-the-person incidents in London."
Reworded: "Westminster stands out as the borough with the highest concentration of theft-from-the-person incidents in London."

Original: "The number of births from European countries increased by 8% from 2017 to 2018."
Reworded: "European countries showed a notable increase in birth numbers between 2017 and 2018."

OUTPUT FORMAT (JSON):
{
  "reworded_proposition": "Your reworded proposition here",
  "chart_title": "Concise chart title",
  "chart_description": "Brief description of what the chart shows",
  "reasoning": "Why this chart type is appropriate for this data"
}

Respond with only the JSON object, no additional text.`;
  }

  /**
   * Process a single proposition using LLM
   */
  async processProposition(
    proposition: PropositionData, 
    dataset: string, 
    category: string
  ): Promise<ProcessedProposition> {
    
    // Select appropriate chart type
    const chartType = this.selectChartType(proposition);
    
    // Generate TAPAS questions
    const tapasQuestions = this.generateTapasQuestions(proposition, chartType);
    
    try {
      // Create LLM prompt
      const prompt = this.createLLMPrompt(proposition, dataset, category, chartType);
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });
      
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      // Parse JSON response
      const llmResult = JSON.parse(content);
      
      return {
        proposition_id: `${dataset}_${category}_${proposition.id}`,
        dataset,
        category,
        original_proposition: proposition.proposition,
        reworded_proposition: llmResult.reworded_proposition,
        chart_type: chartType,
        chart_title: llmResult.chart_title,
        chart_description: llmResult.chart_description,
        reasoning: llmResult.reasoning,
        tapas_questions: tapasQuestions,
        variables_needed: proposition.variables_needed,
        time_period: proposition.time_period,
        geographic_level: proposition.geographic_level,
        complexity_level: proposition.complexity_level
      };
      
    } catch (error) {
      console.error(`Error processing proposition ${proposition.id}:`, error);
      
      // Fallback processing without LLM
      return {
        proposition_id: `${dataset}_${category}_${proposition.id}`,
        dataset,
        category,
        original_proposition: proposition.proposition,
        reworded_proposition: this.fallbackReword(proposition.proposition),
        chart_type: chartType,
        chart_title: this.generateFallbackTitle(proposition, dataset),
        chart_description: this.generateFallbackDescription(proposition, chartType),
        reasoning: `${chartType.replace(/_/g, ' ')} is suitable for showing ${proposition.geographic_level} level ${category} patterns.`,
        tapas_questions: tapasQuestions,
        variables_needed: proposition.variables_needed,
        time_period: proposition.time_period,
        geographic_level: proposition.geographic_level,
        complexity_level: proposition.complexity_level
      };
    }
  }

  /**
   * Simple fallback rewriting without LLM
   */
  private fallbackReword(originalProposition: string): string {
    return originalProposition
      .replace(/\b\d+(\.\d+)?%/g, 'significantly')
      .replace(/\b(increased|decreased) by \d+(\.\d+)?%/g, (match) => 
        match.includes('increased') ? 'showed notable growth' : 'showed notable decline')
      .replace(/accounts for \d+(\.\d+)?%/g, 'represents a significant portion')
      .replace(/comprises? \d+(\.\d+)?%/g, 'makes up a substantial share');
  }

  /**
   * Generate fallback chart title
   */
  private generateFallbackTitle(proposition: PropositionData, dataset: string): string {
    const datasetFormatted = dataset.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const level = proposition.geographic_level === 'Borough' ? 'by Borough' : '';
    return `${datasetFormatted} ${level}`.substring(0, 60);
  }

  /**
   * Generate fallback chart description
   */
  private generateFallbackDescription(proposition: PropositionData, chartType: string): string {
    const chartTypeFormatted = chartType.replace(/_/g, ' ');
    const level = proposition.geographic_level.toLowerCase();
    return `${chartTypeFormatted} showing patterns across ${level} level data`.substring(0, 120);
  }

  /**
   * Load propositions from JSON file
   */
  private loadPropositions(filePath: string): any {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  }

  /**
   * Process all propositions from the input file
   */
  async processAllPropositions(inputPath: string, outputPath: string, batchSize: number = 10): Promise<void> {
    console.log('Loading propositions from:', inputPath);
    
    const data = this.loadPropositions(inputPath);
    const processedPropositions: ProcessedProposition[] = [];
    
    let totalProcessed = 0;
    const totalCount = data.summary.individual_dataset_propositions;
    
    console.log(`Starting to process ${totalCount} propositions...`);
    
    // Process each dataset
    for (const [datasetName, datasetInfo] of Object.entries(data.datasets) as [string, any][]) {
      console.log(`\nProcessing dataset: ${datasetName}`);
      
      // Process each category within the dataset
      for (const [categoryName, propositions] of Object.entries(datasetInfo.categories) as [string, PropositionData[]][]) {
        console.log(`  Processing category: ${categoryName} (${propositions.length} propositions)`);
        
        // Process propositions in batches to avoid rate limiting
        for (let i = 0; i < propositions.length; i += batchSize) {
          const batch = propositions.slice(i, i + batchSize);
          const batchPromises = batch.map(prop => 
            this.processProposition(prop, datasetName, categoryName)
          );
          
          try {
            const batchResults = await Promise.all(batchPromises);
            processedPropositions.push(...batchResults);
            totalProcessed += batchResults.length;
            
            console.log(`    Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(propositions.length/batchSize)} (${totalProcessed}/${totalCount} total)`);
            
            // Add delay between batches to respect rate limits
            if (i + batchSize < propositions.length) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
            
          } catch (error) {
            console.error(`Error processing batch starting at index ${i}:`, error);
            // Continue with next batch
          }
        }
      }
    }
    
    // Save processed results
    const output = {
      processed_at: new Date().toISOString(),
      total_processed: processedPropositions.length,
      processing_summary: {
        by_dataset: this.summarizeByDataset(processedPropositions),
        by_chart_type: this.summarizeByChartType(processedPropositions),
        by_complexity: this.summarizeByComplexity(processedPropositions)
      },
      propositions: processedPropositions
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\nProcessing complete! Saved ${processedPropositions.length} processed propositions to: ${outputPath}`);
  }

  /**
   * Generate summary statistics
   */
  private summarizeByDataset(propositions: ProcessedProposition[]): Record<string, number> {
    const summary: Record<string, number> = {};
    propositions.forEach(prop => {
      summary[prop.dataset] = (summary[prop.dataset] || 0) + 1;
    });
    return summary;
  }

  private summarizeByChartType(propositions: ProcessedProposition[]): Record<string, number> {
    const summary: Record<string, number> = {};
    propositions.forEach(prop => {
      summary[prop.chart_type] = (summary[prop.chart_type] || 0) + 1;
    });
    return summary;
  }

  private summarizeByComplexity(propositions: ProcessedProposition[]): Record<string, number> {
    const summary: Record<string, number> = {};
    propositions.forEach(prop => {
      summary[prop.complexity_level] = (summary[prop.complexity_level] || 0) + 1;
    });
    return summary;
  }
}

// Main execution function
async function main() {
  try {
    // Load environment variables
    dotenv.config({ path: '.env.local' });
    
    const inputPath = path.join(process.cwd(), 'public/data/narrative_propositions/all_generated_propositions.json');
    const outputPath = path.join(process.cwd(), 'public/data/narrative_propositions/processed_propositions.json');
    
    const preprocessor = new PropositionPreprocessor();
    
    // Process all propositions
    await preprocessor.processAllPropositions(inputPath, outputPath, 5); // Batch size of 5 to manage API rate limits
    
    console.log('Preprocessing completed successfully!');
    
  } catch (error) {
    console.error('Error during preprocessing:', error);
    process.exit(1);
  }
}

// Export for use in other modules
export { PropositionPreprocessor };
export type { ProcessedProposition };

// Check if running directly
if (typeof require !== 'undefined' && require.main === module) {
  main();
}
