const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

// Test with a proposition that should get a 3D chart recommendation
async function test3DProposition() {
  try {
    console.log('Testing proposition for 3D chart recommendation...');
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Create a test proposition that should recommend a 3D chart
    const testProposition = {
      id: 'test_3d',
      proposition: "Crime rates vary significantly by borough and crime type, with Westminster showing high theft rates while Camden has more drug offences.",
      variables_needed: ['borough_name', 'crime_type', 'incident_count', 'rate_per_1000'],
      time_period: '2022-2023',
      geographic_level: 'borough',
      complexity_level: 'high'
    };

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
   - barChart_simple_2D, barChart_simple_3D, barChart_with_mean_2D, barChart_with_mean_3D
   - groupedBarChart_simple_2D, groupedBarChart_simple_3D
   - lineChart_simple_2D, lineChart_simple_3D, multiLineChart_simple_2D
   - donutChart_simple_2D, donutChart_simple_3D
   - scatterPlot_simple_2D, scatterPlot_simple_3D, bubbleChart_simple_2D, bubbleChart_simple_3D
   - histogram_simple_2D, histogram_simple_3D

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
  "id": "${testProposition.id}",
  "proposition": "${testProposition.proposition}",
  "variables_needed": ${JSON.stringify(testProposition.variables_needed)},
  "time_period": "${testProposition.time_period}",
  "geographic_level": "${testProposition.geographic_level}",
  "dataset": "crime-rates",
  "category": "geographic_patterns",
  "suggested_chart": "barChart_simple_2D"
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
  "3d_dimension": "If chart_type ends with _3D, specify the third dimension (e.g., 'crime_type', 'time_subdivision', 'geographic_subdivision'). If 2D chart, set to null"
}

Respond with only the JSON object, no additional text.`;

    console.log('\n--- Calling LLM with 3D-focused prompt ---');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 700
    });

    const content = response.choices[0]?.message?.content?.trim();
    console.log('Raw response:');
    console.log(content);

    // Clean up the response
    let cleanContent = content;
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanContent);

    console.log('\n--- Parsed Result ---');
    console.log('Reworded:', result.reworded_proposition);
    console.log('Chart Type:', result.chart_type);
    console.log('3D Dimension:', result['3d_dimension']);
    console.log('Title:', result.chart_title);
    console.log('Description:', result.chart_description);
    console.log('TAPAS Questions:', result.tapas_questions);
    console.log('Reasoning:', result.reasoning);

    if (result.chart_type.includes('_3D') && result['3d_dimension']) {
      console.log('\n✅ 3D chart with dimension successfully recommended!');
    } else if (result.chart_type.includes('_3D') && !result['3d_dimension']) {
      console.log('\n⚠️  3D chart recommended but no dimension specified!');
    } else {
      console.log('\n✅ 2D chart recommended (appropriate for this data)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test3DProposition();
