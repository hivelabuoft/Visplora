const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

// Chart type mapping from suggested_visualization to our internal chart types
const CHART_TYPE_MAPPING = {
  'bar chart': ['barChart_simple_2D', 'barChart_simple_3D', 'barChart_with_mean_2D', 'barChart_with_mean_3D', 'groupedBarChart_simple_2D', 'groupedBarChart_simple_3D'],
  'bar_chart': ['barChart_simple_2D', 'barChart_simple_3D', 'barChart_with_mean_2D', 'barChart_with_mean_3D', 'groupedBarChart_simple_2D', 'groupedBarChart_simple_3D'],
  'line chart': ['lineChart_simple_2D', 'lineChart_simple_3D', 'multiLineChart_simple_2D'],
  'line_chart': ['lineChart_simple_2D', 'lineChart_simple_3D', 'multiLineChart_simple_2D'],
  'pie chart': ['donutChart_simple_2D', 'donutChart_simple_3D'],
  'pie_chart': ['donutChart_simple_2D', 'donutChart_simple_3D'],
  'scatter plot': ['scatterPlot_simple_2D', 'scatterPlot_simple_3D', 'bubbleChart_simple_2D', 'bubbleChart_simple_3D'],
  'scatter_plot': ['scatterPlot_simple_2D', 'scatterPlot_simple_3D', 'bubbleChart_simple_2D', 'bubbleChart_simple_3D'],
  'histogram': ['histogram_simple_2D', 'histogram_simple_3D', 'histogramHeatmap_simple_2D'],
  'heat map': ['histogramHeatmap_simple_2D'],
  'heatmap': ['histogramHeatmap_simple_2D'],
  'heat_map': ['histogramHeatmap_simple_2D'],
  'choropleth_map': ['barChart_simple_2D', 'barChart_simple_3D'],
  'box plot': ['histogram_simple_2D'],
  'box_plot': ['histogram_simple_2D'],
  'pareto chart': ['barChart_simple_2D', 'barChart_with_threshold_2D'],
  'pareto_chart': ['barChart_simple_2D', 'barChart_with_threshold_2D']
};

// Chart type mapping from suggested_visualization to our internal chart types
const DETAILED_CHART_VARIATIONS = {
  
  // Bar Chart Family (26 variations)
  "barChart_simple_2D": { required_fields: 5, data_structure: "category-value" },
  "barChart_simple_3D": { required_fields: 6, data_structure: "category-value-dimension" },
  "barChart_with_mean_2D": { required_fields: 6, data_structure: "category-value + mean_line" },
  "barChart_with_mean_3D": { required_fields: 7, data_structure: "category-value-dimension + mean_per_dimension" },
  "barChart_with_threshold_2D": { required_fields: 7, data_structure: "category-value + threshold_line" },
  "barChart_with_threshold_3D": { required_fields: 8, data_structure: "category-value-dimension + threshold_per_dimension" },
  "barChart_with_mean_threshold_2D": { required_fields: 8, data_structure: "category-value + mean_line + threshold_line" },
  "barChart_with_mean_threshold_3D": { required_fields: 9, data_structure: "category-value-dimension + mean_per_dimension + threshold_per_dimension" },
  
  "groupedBarChart_simple_2D": { required_fields: 6, data_structure: "category-value-series" },
  "groupedBarChart_simple_3D": { required_fields: 7, data_structure: "category-value-series-dimension" },
  "groupedBarChart_with_mean_2D": { required_fields: 7, data_structure: "category-value-series + mean_per_series" },
  "groupedBarChart_with_mean_3D": { required_fields: 8, data_structure: "category-value-series-dimension + mean_per_series_per_dimension" },
  "groupedBarChart_with_threshold_2D": { required_fields: 8, data_structure: "category-value-series + threshold_line" },
  "groupedBarChart_with_threshold_3D": { required_fields: 9, data_structure: "category-value-series-dimension + threshold_per_dimension" },
  "groupedBarChart_with_mean_threshold_2D": { required_fields: 9, data_structure: "category-value-series + mean_per_series + threshold_line" },
  "groupedBarChart_with_mean_threshold_3D": { required_fields: 10, data_structure: "category-value-series-dimension + mean_per_series_per_dimension + threshold_per_dimension" },
  
  "stackedBarChart_simple_2D": { required_fields: 6, data_structure: "category-value-stack" },
  "stackedBarChart_simple_3D": { required_fields: 7, data_structure: "category-value-stack-dimension" },
  "stackedBarChart_with_mean_2D": { required_fields: 7, data_structure: "category-value-stack + mean_of_totals" },
  "stackedBarChart_with_mean_3D": { required_fields: 8, data_structure: "category-value-stack-dimension + mean_of_totals_per_dimension" },
  "stackedBarChart_with_threshold_2D": { required_fields: 8, data_structure: "category-value-stack + threshold_of_totals" },
  "stackedBarChart_with_threshold_3D": { required_fields: 9, data_structure: "category-value-stack-dimension + threshold_of_totals_per_dimension" },
  "stackedBarChart_with_mean_threshold_2D": { required_fields: 9, data_structure: "category-value-stack + mean_of_totals + threshold_of_totals" },
  "stackedBarChart_with_mean_threshold_3D": { required_fields: 10, data_structure: "category-value-stack-dimension + mean_of_totals_per_dimension + threshold_of_totals_per_dimension" },
  
  "divergentBar_simple_2D": { required_fields: 6, data_structure: "category-value (positive/negative)" },
  "divergentBar_simple_3D": { required_fields: 7, data_structure: "category-value-dimension (positive/negative)" },
  
  // Line Chart Family (6 variations)
  "lineChart_simple_2D": { required_fields: 5, data_structure: "time-value" },
  "lineChart_simple_3D": { required_fields: 6, data_structure: "time-value-dimension" },
  
  "multiLineChart_simple_2D": { required_fields: 6, data_structure: "time-value-series" },
  "multiLineChart_simple_3D": { required_fields: 7, data_structure: "time-value-series-dimension" },
  
  "areaChart_simple_2D": { required_fields: 5, data_structure: "time-value (filled)" },
  "areaChart_simple_3D": { required_fields: 6, data_structure: "time-value-dimension (filled)" },
  
  // Combo Charts (2 variations)
  "comboBarLineChart_simple_2D": { required_fields: 7, data_structure: "category-barValue-lineValue" },
  "comboBarLineChart_simple_3D": { required_fields: 8, data_structure: "category-barValue-lineValue-dimension" },
  
  // Proportion Charts (2 variations)
  "donutChart_simple_2D": { required_fields: 5, data_structure: "category-value-percentage" },
  "donutChart_simple_3D": { required_fields: 6, data_structure: "category-value-percentage-dimension" },
  
  // Correlation Charts (4 variations)
  "scatterPlot_simple_2D": { required_fields: 6, data_structure: "category-x_value-y_value" },
  "scatterPlot_simple_3D": { required_fields: 7, data_structure: "category-x_value-y_value-dimension" },
  
  "bubbleChart_simple_2D": { required_fields: 7, data_structure: "category-x_value-y_value-size_value" },
  "bubbleChart_simple_3D": { required_fields: 8, data_structure: "category-x_value-y_value-size_value-dimension" },
  
  // Distribution Charts (3 variations)
  "histogram_simple_2D": { required_fields: 5, data_structure: "bin-count" },
  "histogram_simple_3D": { required_fields: 6, data_structure: "bin-count-dimension" },
  
  "histogramHeatmap_simple_2D": { required_fields: 6, data_structure: "x_bin-y_bin-count" }
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
  ],
  mean_threshold: [
    "What is the average {metric} across all {entity}s?",
    "Which {entity}s are above the average {metric}?",
    "Which {entity}s are below the threshold for {metric}?",
    "How many {entity}s exceed the mean {metric}?"
  ],
  correlation: [
    "Is there a correlation between {metric1} and {metric2}?",
    "Which {entity} shows the strongest relationship between {metric1} and {metric2}?",
    "What is the pattern when comparing {metric1} versus {metric2}?"
  ]
};

class PropositionPreprocessor {
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
  selectChartType(proposition) {
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
      const meanCharts = possibleCharts.filter(chart => chart.includes('with_mean'));
      if (meanCharts.length > 0) return meanCharts[0];
    }
    
    // If it mentions threshold, exceeds, safe rate, etc.
    if (propositionText.includes('threshold') || propositionText.includes('exceed') ||
        propositionText.includes('safe') || propositionText.includes('limit')) {
      const thresholdCharts = possibleCharts.filter(chart => chart.includes('with_threshold'));
      if (thresholdCharts.length > 0) return thresholdCharts[0];
    }
    
    // If it mentions multiple categories/dimensions
    if (proposition.variables_needed.length > 3 && 
        (propositionText.includes('by') || propositionText.includes('across'))) {
      const threeDCharts = possibleCharts.filter(chart => chart.includes('3D'));
      if (threeDCharts.length > 0) return threeDCharts[0];
    }
    
    // Default to first option
    return possibleCharts[0];
  }

  /**
   * Generate TAPAS validation questions
   */
  generateTapasQuestions(proposition, chartType) {
    const propositionText = proposition.proposition.toLowerCase();
    const questions = [];
    
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
    
    // Enhanced Logic - Mean line/threshold detection
    if (chartType.includes('with_mean') || chartType.includes('mean')) {
      questions.push(`What is the average ${metric} across all ${entity}s?`);
      questions.push(`Which ${entity}s are above the average ${metric}?`);
    }
    
    if (chartType.includes('with_threshold') || chartType.includes('threshold')) {
      questions.push(`Which ${entity}s are above the threshold for ${metric}?`);
      questions.push(`How many ${entity}s exceed the benchmark ${metric}?`);
    }
    
    // Generate questions based on chart type and proposition content
    if (chartType.includes('bar') || chartType.includes('ranking')) {
      questions.push(`Which ${entity} has the highest ${metric}?`);
      questions.push(`Which ${entity} has the lowest ${metric}?`);
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
    
    // Enhanced Logic - Correlation questions for scatter/bubble charts
    if (chartType.includes('scatter') || chartType.includes('bubble')) {
      const additionalMetrics = variables.filter(v => 
        (v.includes('count') || v.includes('value') || v.includes('rate')) && v !== metricVar
      );
      
      if (additionalMetrics.length > 0) {
        const secondMetric = additionalMetrics[0].replace(/_/g, ' ');
        questions.push(`Is there a correlation between ${metric} and ${secondMetric}?`);
        questions.push(`Which ${entity} shows the strongest relationship between ${metric} and ${secondMetric}?`);
      } else {
        questions.push(`What is the correlation pattern in the data?`);
        questions.push(`Are there any outliers in the ${metric} values?`);
      }
    }
    
    // Enhanced Logic - 3D dimension questions
    if (chartType.includes('_3D')) {
      questions.push(`How does the pattern vary across the additional dimension?`);
      questions.push(`Which dimension shows the most significant variation in ${metric}?`);
    }
    
    // Generic questions for any chart (if we don't have enough specific ones)
    if (questions.length < 3) {
      questions.push(`What is the overall pattern shown in the ${metric} data?`);
    }
    
    return questions.slice(0, 4); // Return max 4 questions
  }

  /**
   * Infer 3D dimension for fallback processing
   */
  inferFallback3DDimension(dataset, category) {
    const datasetLower = dataset.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Dataset-specific dimension inference
    if (datasetLower.includes('crime') || datasetLower.includes('offence')) {
      return 'crime_type';
    }
    
    if (datasetLower.includes('housing') || datasetLower.includes('tenure')) {
      return 'housing_type';
    }
    
    if (datasetLower.includes('employment') || datasetLower.includes('job')) {
      return 'employment_sector';
    }
    
    if (datasetLower.includes('income') || datasetLower.includes('earning')) {
      return 'income_bracket';
    }
    
    if (datasetLower.includes('population') || datasetLower.includes('demographic')) {
      return 'age_group';
    }
    
    if (datasetLower.includes('education') || datasetLower.includes('school')) {
      return 'education_level';
    }
    
    if (datasetLower.includes('health') || datasetLower.includes('mortality')) {
      return 'age_group';
    }
    
    if (datasetLower.includes('transport') || datasetLower.includes('travel')) {
      return 'transport_mode';
    }
    
    // Category-specific dimension inference  
    if (categoryLower.includes('temporal') || categoryLower.includes('time')) {
      return 'time_subdivision';
    }
    
    if (categoryLower.includes('geographic') || categoryLower.includes('spatial')) {
      return 'geographic_subdivision';
    }
    
    // Default dimension
    return 'demographic_breakdown';
  }

  /**
   * Create LLM prompt for proposition rewriting and metadata generation
   */
  createLLMPrompt(proposition, dataset, category, chartType) {
    // Get available chart types for context
    const DETAILED_CHART_VARIATIONS = {
  
  // Bar Chart Family (26 variations)
  "barChart_simple_2D": { required_fields: 5, data_structure: "category-value" },
  "barChart_simple_3D": { required_fields: 6, data_structure: "category-value-dimension" },
  "barChart_with_mean_2D": { required_fields: 6, data_structure: "category-value + mean_line" },
  "barChart_with_mean_3D": { required_fields: 7, data_structure: "category-value-dimension + mean_per_dimension" },
  "barChart_with_threshold_2D": { required_fields: 7, data_structure: "category-value + threshold_line" },
  "barChart_with_threshold_3D": { required_fields: 8, data_structure: "category-value-dimension + threshold_per_dimension" },
  "barChart_with_mean_threshold_2D": { required_fields: 8, data_structure: "category-value + mean_line + threshold_line" },
  "barChart_with_mean_threshold_3D": { required_fields: 9, data_structure: "category-value-dimension + mean_per_dimension + threshold_per_dimension" },
  
  "groupedBarChart_simple_2D": { required_fields: 6, data_structure: "category-value-series" },
  "groupedBarChart_simple_3D": { required_fields: 7, data_structure: "category-value-series-dimension" },
  "groupedBarChart_with_mean_2D": { required_fields: 7, data_structure: "category-value-series + mean_per_series" },
  "groupedBarChart_with_mean_3D": { required_fields: 8, data_structure: "category-value-series-dimension + mean_per_series_per_dimension" },
  "groupedBarChart_with_threshold_2D": { required_fields: 8, data_structure: "category-value-series + threshold_line" },
  "groupedBarChart_with_threshold_3D": { required_fields: 9, data_structure: "category-value-series-dimension + threshold_per_dimension" },
  "groupedBarChart_with_mean_threshold_2D": { required_fields: 9, data_structure: "category-value-series + mean_per_series + threshold_line" },
  "groupedBarChart_with_mean_threshold_3D": { required_fields: 10, data_structure: "category-value-series-dimension + mean_per_series_per_dimension + threshold_per_dimension" },
  
  "stackedBarChart_simple_2D": { required_fields: 6, data_structure: "category-value-stack" },
  "stackedBarChart_simple_3D": { required_fields: 7, data_structure: "category-value-stack-dimension" },
  "stackedBarChart_with_mean_2D": { required_fields: 7, data_structure: "category-value-stack + mean_of_totals" },
  "stackedBarChart_with_mean_3D": { required_fields: 8, data_structure: "category-value-stack-dimension + mean_of_totals_per_dimension" },
  "stackedBarChart_with_threshold_2D": { required_fields: 8, data_structure: "category-value-stack + threshold_of_totals" },
  "stackedBarChart_with_threshold_3D": { required_fields: 9, data_structure: "category-value-stack-dimension + threshold_of_totals_per_dimension" },
  "stackedBarChart_with_mean_threshold_2D": { required_fields: 9, data_structure: "category-value-stack + mean_of_totals + threshold_of_totals" },
  "stackedBarChart_with_mean_threshold_3D": { required_fields: 10, data_structure: "category-value-stack-dimension + mean_of_totals_per_dimension + threshold_of_totals_per_dimension" },
  
  "divergentBar_simple_2D": { required_fields: 6, data_structure: "category-value (positive/negative)" },
  "divergentBar_simple_3D": { required_fields: 7, data_structure: "category-value-dimension (positive/negative)" },
  
  // Line Chart Family (6 variations)
  "lineChart_simple_2D": { required_fields: 5, data_structure: "time-value" },
  "lineChart_simple_3D": { required_fields: 6, data_structure: "time-value-dimension" },
  
  "multiLineChart_simple_2D": { required_fields: 6, data_structure: "time-value-series" },
  "multiLineChart_simple_3D": { required_fields: 7, data_structure: "time-value-series-dimension" },
  
  "areaChart_simple_2D": { required_fields: 5, data_structure: "time-value (filled)" },
  "areaChart_simple_3D": { required_fields: 6, data_structure: "time-value-dimension (filled)" },
  
  // Combo Charts (2 variations)
  "comboBarLineChart_simple_2D": { required_fields: 7, data_structure: "category-barValue-lineValue" },
  "comboBarLineChart_simple_3D": { required_fields: 8, data_structure: "category-barValue-lineValue-dimension" },
  
  // Proportion Charts (2 variations)
  "donutChart_simple_2D": { required_fields: 5, data_structure: "category-value-percentage" },
  "donutChart_simple_3D": { required_fields: 6, data_structure: "category-value-percentage-dimension" },
  
  // Correlation Charts (4 variations)
  "scatterPlot_simple_2D": { required_fields: 6, data_structure: "category-x_value-y_value" },
  "scatterPlot_simple_3D": { required_fields: 7, data_structure: "category-x_value-y_value-dimension" },
  
  "bubbleChart_simple_2D": { required_fields: 7, data_structure: "category-x_value-y_value-size_value" },
  "bubbleChart_simple_3D": { required_fields: 8, data_structure: "category-x_value-y_value-size_value-dimension" },
  
  // Distribution Charts (3 variations)
  "histogram_simple_2D": { required_fields: 5, data_structure: "bin-count" },
  "histogram_simple_3D": { required_fields: 6, data_structure: "bin-count-dimension" },
  
  "histogramHeatmap_simple_2D": { required_fields: 6, data_structure: "x_bin-y_bin-count" }
};

    return `You are a data-aware assistant helping to match narrative propositions to appropriate chart templates and metadata for visualization.

## Your task:
Given a **narrative proposition** about data patterns (such as borough-level demographics or crime rates), do the following:

1. **Rewrite the proposition** to sound more interpretive and insight-driven.  
   - Avoid exact statistics or numeric values (e.g., "40% increase").  
   - Focus on patterns, comparisons, or trends.  
   - Example: 
     - ❌ "Westminster crime rates are 40% above London average"
     - ✅ "Westminster consistently shows crime rates significantly above the London average"

2. **Determine the most appropriate chart variation** from the following available types:
   ${DETAILED_CHART_VARIATIONS}

3. **Write a chart title and description** that would be used for rendering the chart on an interface.

4. **List 2–3 natural language questions** that could be asked using a table question-answering model like TAPAS to validate the insight or extract supporting statistics. Use these question patterns and apply contextual logic:
   
   **Basic Patterns:**
   - Ranking: "Which {entity} has the highest/lowest {metric}?"
   - Proportion: "What percentage of {metric} is in {entity}?"
   - Temporal: "How did {metric} change from {period1} to {period2}?"
   - Comparison: "How does {entity1} compare to {entity2} in terms of {metric}?"
   
   **Enhanced Logic (apply when relevant):**
   - **If chart includes mean line/average**: Ask "What is the average {metric} across all {entity}s?" or "Which {entity}s are above the average {metric}?"
   - **If chart includes threshold/benchmark**: Ask "Which {entity}s are above the threshold for {metric}?" or "How many {entity}s exceed the benchmark {metric}?"
   - **If scatterplot/bubble chart**: Ask "Is there a correlation between {metric1} and {metric2}?" or "Which {entity} shows the strongest relationship?"
   - **If multiple dimensions**: Ask about the additional dimension relationships

5. **For 3D charts**: If recommending a 3D chart variation (ending in _3D), infer what the third dimension should be based on the available data fields and context. Common 3D dimensions include:
   - Geographic subdivision (borough → ward level)
   - Demographic breakdown (by age group, ethnicity, income bracket)  
   - Temporal subdivision (yearly → monthly/quarterly)
   - Category subdivision (crime type, housing type, business sector)

5. Provide a brief **reasoning** for your chart choice.

---

### Input Data:
\`\`\`json
{
  "id": "${proposition.id}",
  "proposition": "${proposition.proposition}",
  "variables_needed": ${JSON.stringify(proposition.variables_needed)},
  "time_period": "${proposition.time_period}",
  "geographic_level": "${proposition.geographic_level}",
  "dataset": "${dataset}",
  "category": "${category}",
  "suggested_chart": "${chartType}"
}
\`\`\`

### Required Output Format (JSON only):
{
  "reworded_proposition": "Your interpretive rewrite here",
  "chart_type": "Selected chart type from the available list",
  "chart_title": "Concise title (max 60 chars)",
  "chart_description": "Brief description (max 120 chars)",
  "tapas_questions": ["Question 1", "Question 2", "Question 3"],
  "reasoning": "Why this chart type is most appropriate",
  "3d_dimension": "If chart_type ends with _3D, specify the third dimension (e.g., 'age_group', 'time_subdivision', 'geographic_subdivision'). If 2D chart, set to null"
}

Respond with only the JSON object, no additional text.`;
  }

  /**
   * Process a single proposition using LLM
   */
  async processProposition(proposition, dataset, category) {
    
    // Select appropriate chart type as a suggestion
    const suggestedChartType = this.selectChartType(proposition);
    
    try {
      // Create LLM prompt
      const prompt = this.createLLMPrompt(proposition, dataset, category, suggestedChartType);
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 700
      });
      
      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content;
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Parse JSON response
      const llmResult = JSON.parse(cleanContent);
      
      return {
        proposition_id: `${dataset}_${category}_${proposition.id}`,
        dataset,
        category,
        original_proposition: proposition.proposition,
        reworded_proposition: llmResult.reworded_proposition,
        chart_type: llmResult.chart_type || suggestedChartType, // Use LLM choice or fallback to suggestion
        chart_title: llmResult.chart_title,
        chart_description: llmResult.chart_description,
        reasoning: llmResult.reasoning,
        tapas_questions: llmResult.tapas_questions || this.generateTapasQuestions(proposition, llmResult.chart_type || suggestedChartType),
        "3d_dimension": llmResult["3d_dimension"] || null,
        variables_needed: proposition.variables_needed,
        time_period: proposition.time_period,
        geographic_level: proposition.geographic_level,
        complexity_level: proposition.complexity_level
      };
      
    } catch (error) {
      console.error(`Error processing proposition ${proposition.id}:`, error);
      
      // Fallback processing without LLM
      const fallbackTapasQuestions = this.generateTapasQuestions(proposition, suggestedChartType);
      
      return {
        proposition_id: `${dataset}_${category}_${proposition.id}`,
        dataset,
        category,
        original_proposition: proposition.proposition,
        reworded_proposition: this.fallbackReword(proposition.proposition),
        chart_type: suggestedChartType,
        chart_title: this.generateFallbackTitle(proposition, dataset),
        chart_description: this.generateFallbackDescription(proposition, suggestedChartType),
        reasoning: `${suggestedChartType.replace(/_/g, ' ')} is suitable for showing ${proposition.geographic_level} level ${category} patterns.`,
        tapas_questions: fallbackTapasQuestions,
        "3d_dimension": suggestedChartType.endsWith('_3D') ? this.inferFallback3DDimension(dataset, category) : null,
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
  fallbackReword(originalProposition) {
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
  generateFallbackTitle(proposition, dataset) {
    const datasetFormatted = dataset.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const level = proposition.geographic_level === 'Borough' ? 'by Borough' : '';
    return `${datasetFormatted} ${level}`.substring(0, 60);
  }

  /**
   * Generate fallback chart description
   */
  generateFallbackDescription(proposition, chartType) {
    const chartTypeFormatted = chartType.replace(/_/g, ' ');
    const level = proposition.geographic_level.toLowerCase();
    return `${chartTypeFormatted} showing patterns across ${level} level data`.substring(0, 120);
  }

  /**
   * Load propositions from JSON file
   */
  loadPropositions(filePath) {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  }

  /**
   * Process all propositions from the input file
   */
  async processAllPropositions(inputPath, outputPath, batchSize = 10) {
    console.log('Loading propositions from:', inputPath);
    
    const data = this.loadPropositions(inputPath);
    const processedPropositions = [];
    
    // Create organized structure for output
    const organizedOutput = {};
    
    let totalProcessed = 0;
    const totalCount = data.summary.individual_dataset_propositions;
    
    console.log(`Starting to process ${totalCount} propositions...`);
    
    // Process each dataset
    for (const [datasetName, datasetInfo] of Object.entries(data.datasets)) {
      console.log(`\nProcessing dataset: ${datasetName}`);
      
      // Initialize dataset structure
      organizedOutput[datasetName] = {};
      
      // Process each category within the dataset
      for (const [categoryName, propositions] of Object.entries(datasetInfo.categories)) {
        console.log(`  Processing category: ${categoryName} (${propositions.length} propositions)`);
        
        const categoryResults = [];
        
        // Process propositions in batches to avoid rate limiting
        for (let i = 0; i < propositions.length; i += batchSize) {
          const batch = propositions.slice(i, i + batchSize);
          const batchPromises = batch.map(prop => 
            this.processProposition(prop, datasetName, categoryName)
          );
          
          try {
            const batchResults = await Promise.all(batchPromises);
            processedPropositions.push(...batchResults);
            categoryResults.push(...batchResults);
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
        
        // Store category results
        organizedOutput[datasetName][categoryName] = {
          category: categoryName,
          dataset: datasetName,
          processed_at: new Date().toISOString(),
          total_propositions: categoryResults.length,
          propositions: categoryResults
        };
        
        // Save individual category file
        const categoryOutputDir = path.join(path.dirname(outputPath), 'by_dataset', datasetName);
        if (!fs.existsSync(categoryOutputDir)) {
          fs.mkdirSync(categoryOutputDir, { recursive: true });
        }
        
        const categoryFilePath = path.join(categoryOutputDir, `${categoryName}.json`);
        fs.writeFileSync(categoryFilePath, JSON.stringify(organizedOutput[datasetName][categoryName], null, 2));
        console.log(`    Saved ${categoryName} results to: ${categoryFilePath}`);
      }
      
      // Save complete dataset file
      const datasetOutput = {
        dataset: datasetName,
        processed_at: new Date().toISOString(),
        total_propositions: Object.values(organizedOutput[datasetName]).reduce((sum, cat) => sum + cat.total_propositions, 0),
        categories: organizedOutput[datasetName]
      };
      
      const datasetOutputDir = path.join(path.dirname(outputPath), 'by_dataset');
      if (!fs.existsSync(datasetOutputDir)) {
        fs.mkdirSync(datasetOutputDir, { recursive: true });
      }
      
      const datasetFilePath = path.join(datasetOutputDir, `${datasetName}_complete.json`);
      fs.writeFileSync(datasetFilePath, JSON.stringify(datasetOutput, null, 2));
      console.log(`  Saved complete ${datasetName} dataset to: ${datasetFilePath}`);
    }
    
    // Save master combined file
    const masterOutput = {
      processed_at: new Date().toISOString(),
      total_processed: processedPropositions.length,
      processing_summary: {
        by_dataset: this.summarizeByDataset(processedPropositions),
        by_chart_type: this.summarizeByChartType(processedPropositions),
        by_complexity: this.summarizeByComplexity(processedPropositions)
      },
      organized_structure: organizedOutput,
      all_propositions: processedPropositions
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(masterOutput, null, 2));
    console.log(`\nProcessing complete! Saved ${processedPropositions.length} processed propositions to: ${outputPath}`);
    console.log(`Organized outputs saved in: ${path.join(path.dirname(outputPath), 'by_dataset')}`);
  }

  /**
   * Generate summary statistics
   */
  summarizeByDataset(propositions) {
    const summary = {};
    propositions.forEach(prop => {
      summary[prop.dataset] = (summary[prop.dataset] || 0) + 1;
    });
    return summary;
  }

  summarizeByChartType(propositions) {
    const summary = {};
    propositions.forEach(prop => {
      summary[prop.chart_type] = (summary[prop.chart_type] || 0) + 1;
    });
    return summary;
  }

  summarizeByComplexity(propositions) {
    const summary = {};
    propositions.forEach(prop => {
      summary[prop.complexity_level] = (summary[prop.complexity_level] || 0) + 1;
    });
    return summary;
  }
}

// Main execution function
async function main() {
  try {
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

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { PropositionPreprocessor };
