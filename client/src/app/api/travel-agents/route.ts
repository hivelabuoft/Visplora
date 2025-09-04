// API Route for Travel Agent Generation
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, chartType, subtypes, destinations, regions } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a specialized travel data visualization expert for ${chartType} charts. 
          Your role is to generate precise chart specifications using the SpecCreator system.
          
          CRITICAL RULES:
          1. NEVER change dimensions - always use the provided dimensions exactly
          2. ALWAYS use the exact field names from the generated data
          3. DO NOT modify chart type or core structure
          4. ONLY modify: colors, styling, titles, field mappings, data values
          5. Generate realistic travel data that makes sense for the context
          6. Return ONLY valid JSON - no explanatory text
          
          Available subtypes: ${subtypes.join(', ')}
          Travel destinations: ${destinations.slice(0, 20).map((d: any) => `${d.city}, ${d.country}`).join(', ')} (and more)
          Regions: ${regions.slice(0, 10).join(', ')} (and more)`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Travel agent API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        type: 'api_error'
      },
      { status: 500 }
    );
  }
}