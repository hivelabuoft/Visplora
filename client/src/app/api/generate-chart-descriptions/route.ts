import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChartRequest {
  name: string;
  userQuery: string;
  constraints: {
    chartType: string;
    subtype?: string;
    dataCategory?: string;
    destinations?: string[];
    selectedCountries?: string[];
    [key: string]: any;
  };
}

interface DescriptionRequest {
  charts: ChartRequest[];
  sentence_content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { charts, sentence_content }: DescriptionRequest = await request.json();

    if (!charts || !Array.isArray(charts)) {
      return NextResponse.json(
        { error: 'Charts array is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create prompt for LLM to generate natural descriptions
    const systemPrompt = `You are a data visualization expert. Your task is to generate clear, natural language descriptions for travel data visualizations.

Given a chart specification, you should:
1. Create a concise, descriptive explanation of what the chart shows
2. Focus on the insights and patterns the chart reveals
3. Use natural, accessible language (avoid technical jargon)
4. Keep descriptions to 1-2 sentences
5. Make it relevant to travel planning and decision-making

Chart types you'll encounter:
- line: Shows trends over time
- bar: Compares values across categories
- scatter: Shows relationships between two variables
- pie: Shows composition/distribution
- multiType: Combines multiple chart types
- map: Shows geographic patterns

Data categories:
- visitor-flow: Tourist arrivals and travel patterns
- safety: Safety scores and security metrics
- cost: Travel costs and budget analysis
- reviews: User reviews and ratings
- cultural: Cultural diversity and attractions
- environmental: Environmental quality indicators`;

    const userPrompt = `Context: "${sentence_content}"

Generate natural language descriptions for these ${charts.length} travel data visualizations:

${charts.map((chart, index) => `
${index + 1}. Chart: "${chart.name}"
   Type: ${chart.constraints.chartType}
   Query: ${chart.userQuery}
   Category: ${chart.constraints.dataCategory || 'general'}
   Destinations: ${chart.constraints.destinations?.slice(0, 3).join(', ') || chart.constraints.selectedCountries?.slice(0, 3).join(', ') || 'various'}
`).join('')}

Return ONLY a JSON array with ${charts.length} descriptions in the exact same order, like:
["Description for chart 1", "Description for chart 2", ...]

Each description should be 1-2 sentences explaining what insights the chart provides for travel planning.`;

    console.log('🤖 Sending request to OpenAI for chart descriptions...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let descriptions: string[];
    try {
      descriptions = JSON.parse(response);
      
      if (!Array.isArray(descriptions)) {
        throw new Error('Response is not an array');
      }
      
      if (descriptions.length !== charts.length) {
        throw new Error(`Expected ${charts.length} descriptions, got ${descriptions.length}`);
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', response);
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }

    console.log('✅ Successfully generated descriptions for', descriptions.length, 'charts');

    return NextResponse.json({
      success: true,
      descriptions,
      metadata: {
        chartCount: charts.length,
        model: 'gpt-4',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating chart descriptions:', error);
    
    // Return structured error response
    return NextResponse.json(
      { 
        error: 'Failed to generate chart descriptions',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}