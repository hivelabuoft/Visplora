const OpenAI = require('openai').default;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Test the preprocessing with just a few propositions
async function testPreprocessing() {
  try {
    console.log('Testing OpenAI connection and basic processing...');
    
    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in .env.local');
    }
    console.log('✓ API key found');
    
    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });
    console.log('✓ OpenAI client initialized');
    
    // Load input file
    const inputPath = path.join(process.cwd(), 'public/data/narrative_propositions/all_generated_propositions.json');
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log('✓ Input file loaded');
    console.log(`Found ${data.summary.individual_dataset_propositions} total propositions`);
    
    // Test with one proposition from crime-rates dataset
    const crimeData = data.datasets['crime-rates'];
    const geoPattern = crimeData.categories.geographic_patterns[0];
    
    console.log('\n--- Testing with sample proposition ---');
    console.log('Original:', geoPattern.proposition);
    console.log('Variables:', geoPattern.variables_needed);
    console.log('Suggested viz:', geoPattern.suggested_visualization);
    
    // Test chart type selection
    const CHART_TYPE_MAPPING = {
      'pie_chart': ['donutChart_simple_2D', 'donutChart_simple_3D'],
      'bar_chart': ['barChart_simple_2D', 'barChart_with_mean_2D'],
    };
    
    const suggestedViz = geoPattern.suggested_visualization.toLowerCase();
    const possibleCharts = CHART_TYPE_MAPPING[suggestedViz] || ['barChart_simple_2D'];
    const selectedChart = possibleCharts[0];
    
    console.log('Selected chart type:', selectedChart);
    
    // Test LLM call
    const prompt = `You are a data visualization expert. Rewrite this proposition to be more interpretive:

Original: "${geoPattern.proposition}"

Remove specific percentages and make it more insight-focused. Respond with only JSON:
{
  "reworded_proposition": "Your rewritten version",
  "chart_title": "Short title",
  "chart_description": "Brief description",
  "reasoning": "Why this chart works"
}`;

    console.log('\n--- Testing LLM call ---');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    });
    
    let content = response.choices[0].message.content.trim();
    
    // Clean up the response - remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const result = JSON.parse(content);
    console.log('✓ LLM call successful');
    console.log('Reworded:', result.reworded_proposition);
    console.log('Title:', result.chart_title);
    console.log('Description:', result.chart_description);
    
    console.log('\n✅ All tests passed! The preprocessing script should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

testPreprocessing();
