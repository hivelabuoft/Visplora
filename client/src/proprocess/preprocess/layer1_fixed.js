const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Chart type mapping from suggested_visualization to our internal chart types
const CHART_TYPE_MAPPING = {
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

  selectChartType(proposition) {
    const suggestedViz = proposition.suggested_visualization.toLowerCase();
    const possibleCharts = CHART_TYPE_MAPPING[suggestedViz] || ['barChart_simple_2D'];
    
    const propositionText = proposition.proposition.toLowerCase();
    
    // If it mentions average, mean, or comparison to benchmark
    if (propositionText.includes('average') || propositionText.includes('mean') || 
        propositionText.includes('compared to') || propositionText.includes('above') ||
        propositionText.includes('below')) {
      const meanCharts = possibleCharts.filter(chart => chart.includes('with_mean'));
      if (meanCharts.length > 0) return meanCharts[0];
    }
    
    // If it mentions threshold, exceeds, safe rate, etc.
    if (propositionText.includes('threshold') || propositionText.includes('exceed') ||
        propositionText.includes('safe') || propositionText.includes('limit')) {
      const thresholdCharts = possibleCharts.filter(chart => chart.includes('with_threshold'));
      if (thresholdCharts.length > 0) return thresholdCharts[0];
    }
    
    // Default to first option
    return possibleCharts[0];
  }

  generateTapasQuestions(proposition, chartType) {
    const questions = [];
    const variables = proposition.variables_needed;
    const entityVar = variables.find(v => 
      v.includes('borough') || v.includes('area') || v.includes('authority') || v.includes('name')
    ) || 'area';
    
    const metricVar = variables.find(v => 
      v.includes('count') || v.includes('value') || v.includes('income') || 
      v.includes('rate') || v.includes('population')
    ) || 'value';
    
    const entity = entityVar.replace(/_/g, ' ').replace('name', '').trim() || 'borough';
    const metric = metricVar.replace(/_/g, ' ').trim();
    
    questions.push(`Which ${entity} has the highest ${metric}?`);
    questions.push(`Which ${entity} has the lowest ${metric}?`);
    questions.push(`What is the overall pattern shown in the data?`);
    
    return questions.slice(0, 3);
  }

  async processProposition(proposition, dataset, category) {
    try {
      const prompt = `You are a data-aware assistant helping to match narrative propositions to appropriate chart templates and metadata for visualization.

## Your task:
Given a **narrative proposition** about data patterns (such as borough-level demographics or crime rates), do the following:

1. **Rewrite the proposition** to sound more interpretive and insight-driven.  
   - Avoid exact statistics or numeric values (e.g., "40% increase").  
   - Focus on patterns, comparisons, or trends.  
   - Example: 
     - ❌ "Westminster crime rates are 40% above London average"
     - ✅ "Westminster consistently shows crime rates significantly above the London average"

2. **Determine the most appropriate chart variation** from the following list of available types:
   - \`barChart_with_mean_threshold_2D\`
   - \`barChart_with_mean_2D\`
   - \`barChart_simple_2D\`
   - \`lineChart_simple_2D\`
   - \`donutChart_simple_2D\`
   - \`histogramHeatmap_simple_2D\`
   - \`histogram_simple_2D\`
   - \`scatterPlot_simple_2D\`
   - \`groupedBarChart_simple_2D\`
   - \`stackedBarChart_simple_2D\`

3. **Write a chart title and description** that would be used for rendering the chart on an interface.

4. **List 2–3 natural language questions** that could be asked using a table question-answering model like TAPAS to validate the insight or extract supporting statistics.

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
  "category": "${category}"
}
\`\`\`

### Expected Output Format (JSON only):
\`\`\`json
{
  "reworded_proposition": "Your reworded proposition here",
  "chart_type": "selected_chart_type_from_list_above",
  "chart_title": "Concise chart title (max 60 chars)",
  "chart_description": "Brief description of what the chart shows (max 120 chars)",
  "tapas_questions": [
    "Question 1 for TAPAS validation",
    "Question 2 for TAPAS validation",
    "Question 3 for TAPAS validation"
  ],
  "reasoning": "Brief explanation of why this chart type is appropriate"
}
\`\`\`

Respond with only the JSON object, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600
      });
      
      let content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      // Clean up the response - remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const llmResult = JSON.parse(content);
      
      return {
        proposition_id: `${dataset}_${category}_${proposition.id}`,
        dataset,
        category,
        original_proposition: proposition.proposition,
        reworded_proposition: llmResult.reworded_proposition,
        chart_type: llmResult.chart_type,
        chart_title: llmResult.chart_title,
        chart_description: llmResult.chart_description,
        reasoning: llmResult.reasoning,
        tapas_questions: llmResult.tapas_questions,
        variables_needed: proposition.variables_needed,
        time_period: proposition.time_period,
        geographic_level: proposition.geographic_level,
        complexity_level: proposition.complexity_level
      };
      
    } catch (error) {
      console.error(`Error processing proposition ${proposition.id}:`, error.message);
      
      // Fallback without LLM
      const chartType = this.selectChartType(proposition);
      return {
        proposition_id: `${dataset}_${category}_${proposition.id}`,
        dataset,
        category,
        original_proposition: proposition.proposition,
        reworded_proposition: proposition.proposition.replace(/\b\d+(\.\d+)?%/g, 'significantly'),
        chart_type: chartType,
        chart_title: `${dataset.replace(/-/g, ' ')} analysis`,
        chart_description: `Analysis of ${dataset} data`,
        reasoning: `${chartType} suitable for this analysis`,
        tapas_questions: this.generateTapasQuestions(proposition, chartType),
        variables_needed: proposition.variables_needed,
        time_period: proposition.time_period,
        geographic_level: proposition.geographic_level,
        complexity_level: proposition.complexity_level
      };
    }
  }
}

// Test with limited propositions
async function testLimitedProcessing() {
  try {
    console.log('Running limited preprocessing test...');
    
    const inputPath = path.join(process.cwd(), 'public/data/narrative_propositions/all_generated_propositions.json');
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    const preprocessor = new PropositionPreprocessor();
    const processedPropositions = [];
    
    let count = 0;
    const maxPropositions = 10;
    
    // Process first 10 propositions from crime-rates dataset
    const crimeData = data.datasets['crime-rates'];
    for (const [categoryName, propositions] of Object.entries(crimeData.categories)) {
      for (const prop of propositions) {
        if (count >= maxPropositions) break;
        
        console.log(`Processing ${count + 1}/${maxPropositions}: ${prop.id}`);
        const result = await preprocessor.processProposition(prop, 'crime-rates', categoryName);
        processedPropositions.push(result);
        count++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (count >= maxPropositions) break;
    }
    
    // Save results
    const output = {
      processed_at: new Date().toISOString(),
      total_processed: processedPropositions.length,
      test_run: true,
      propositions: processedPropositions
    };
    
    const outputPath = path.join(process.cwd(), 'public/data/narrative_propositions/test_processed_propositions.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Test completed! Processed ${processedPropositions.length} propositions`);
    console.log(`Output saved to: ${outputPath}`);
    
    // Show a sample result
    console.log('\n--- Sample Result ---');
    const sample = processedPropositions[0];
    console.log('Original:', sample.original_proposition);
    console.log('Reworded:', sample.reworded_proposition);
    console.log('Chart Type:', sample.chart_type);
    console.log('Title:', sample.chart_title);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLimitedProcessing();
