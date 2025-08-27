const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

// Simple single proposition test
async function testSingleProposition() {
  try {
    console.log('Testing single proposition with new prompt...');
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Load input file and get one proposition
    const inputPath = path.join(process.cwd(), '../../../public/data/narrative_propositions/all_generated_propositions.json');
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    
    const crimeData = data.datasets['crime-rates'];
    const geoPattern = crimeData.categories.geographic_patterns[0]; // Westminster pie chart example
    
    console.log('Original proposition:', geoPattern.proposition);
    
    // Create the improved prompt
    const availableChartTypes = [
      'barChart_simple_2D', 'barChart_with_mean_2D', 'barChart_with_threshold_2D', 'barChart_with_mean_threshold_2D',
      'groupedBarChart_simple_2D', 'stackedBarChart_simple_2D', 'divergentBar_simple_2D',
      'lineChart_simple_2D', 'lineChart_simple_3D', 'multiLineChart_simple_2D', 'areaChart_simple_2D',
      'donutChart_simple_2D', 'scatterPlot_simple_2D', 'bubbleChart_simple_2D',
      'histogram_simple_2D', 'histogramHeatmap_simple_2D'
    ];

    const prompt = `You are a data-aware assistant helping to match narrative propositions to appropriate chart templates and metadata for visualization.

## Your task:
Given a **narrative proposition** about data patterns (such as borough-level demographics or crime rates), do the following:

1. **Rewrite the proposition** to sound more interpretive and insight-driven.  
   - Avoid exact statistics or numeric values (e.g., "40% increase").  
   - Focus on patterns, comparisons, or trends.  
   - Example: 
     - ❌ "Westminster crime rates are 40% above London average"
     - ✅ "Westminster consistently shows crime rates significantly above the London average"

2. **Determine the most appropriate chart variation** from the following available types:
   ${availableChartTypes.map(type => `   - \`${type}\``).join('\n')}

3. **Write a chart title and description** that would be used for rendering the chart on an interface.

4. **List 2–3 natural language questions** that could be asked using a table question-answering model like TAPAS to validate the insight or extract supporting statistics. Use these question patterns:
   - Ranking: "Which {entity} has the highest/lowest {metric}?"
   - Proportion: "What percentage of {metric} is in {entity}?"
   - Temporal: "How did {metric} change from {period1} to {period2}?"
   - Comparison: "How does {entity1} compare to {entity2} in terms of {metric}?"

5. Provide a brief **reasoning** for your chart choice.

---

### Input Data:
\`\`\`json
{
  "id": "${geoPattern.id}",
  "proposition": "${geoPattern.proposition}",
  "variables_needed": ${JSON.stringify(geoPattern.variables_needed)},
  "time_period": "${geoPattern.time_period}",
  "geographic_level": "${geoPattern.geographic_level}",
  "dataset": "crime-rates",
  "category": "geographic_patterns",
  "suggested_chart": "donutChart_simple_2D"
}
\`\`\`

### Required Output Format (JSON only):
{
  "reworded_proposition": "Your interpretive rewrite here",
  "chart_type": "Selected chart type from the available list",
  "chart_title": "Concise title (max 60 chars)",
  "chart_description": "Brief description (max 120 chars)",
  "tapas_questions": ["Question 1", "Question 2", "Question 3"],
  "reasoning": "Why this chart type is most appropriate"
}

Respond with only the JSON object, no additional text.`;

    console.log('\n--- Calling LLM with improved prompt ---');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 700
    });
    
    let content = response.choices[0]?.message?.content?.trim();
    
    console.log('Raw response:');
    console.log(content);
    
    // Clean up response
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const result = JSON.parse(content);
    
    console.log('\n--- Parsed Result ---');
    console.log('Reworded:', result.reworded_proposition);
    console.log('Chart Type:', result.chart_type);
    console.log('Title:', result.chart_title);
    console.log('Description:', result.chart_description);
    console.log('TAPAS Questions:', result.tapas_questions);
    console.log('Reasoning:', result.reasoning);
    
    console.log('\n✅ Single proposition test successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

testSingleProposition();
