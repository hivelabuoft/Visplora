const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai').default;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../../../.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Test with just one chart type
async function testNarrativeGeneration() {
    const prompt = `
Create 5 narrative propositions for comboBarLine charts using London data.

REQUIREMENTS:
- Write as CONCRETE FACTUAL STATEMENTS like news headlines
- Examples: "Westminster shows highest crime rates in London", "Camden income dropped 20% from 2019-2023"
- Avoid analytical language like "analyze", "examine", "explore" 
- Make them specific to London boroughs and data patterns
- Sound like definitive findings, not research questions

CHART TYPE: comboBarLine (bars for counts/quantities, line for rates/percentages)

OUTPUT FORMAT:
[
  {
    "proposition_id": "crime-rates_comboBarLine_001",
    "dataset": "crime-rates", 
    "category": "chart_specific_analysis",
    "reworded_proposition": "Westminster crime incidents surge to highest levels while per-capita rates remain moderate compared to smaller boroughs",
    "chart_type": "comboBarLine_simple_2D",
    "chart_title": "Westminster Crime Volume vs Rate Analysis", 
    "chart_description": "Bar chart shows absolute crime counts, line shows rate per 1000 residents",
    "reasoning": "Combo chart reveals the distinction between high absolute numbers and population-adjusted rates",
    "tapas_questions": [
      "Which borough has the most total crimes?",
      "How do Westminster's per-capita rates compare?",
      "What explains the volume vs rate difference?"
    ],
    "3d_dimension": null,
    "variables_needed": ["borough_name", "crime_count", "population"],
    "time_period": "2022-2023",
    "geographic_level": "Borough",
    "complexity_level": "Intermediate"
  }
]

Return only the JSON array with 5 propositions.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a data storytelling expert. Create compelling narrative propositions that sound like factual news headlines about London borough data. Always return clean JSON arrays."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        });

        const responseContent = completion.choices[0].message.content;
        const cleanedContent = responseContent.replace(/```json\n?|\n?```/g, '').trim();
        const propositions = JSON.parse(cleanedContent);

        console.log('✅ Generated narrative propositions:');
        propositions.forEach((prop, i) => {
            console.log(`${i + 1}. "${prop.reworded_proposition}" (${prop.chart_type})`);
        });

        // Save test output
        const outputPath = path.join(__dirname, 'output', 'narrative_test.json');
        await fs.writeFile(outputPath, JSON.stringify({ propositions }, null, 2));
        console.log(`\n📄 Saved to: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testNarrativeGeneration();
