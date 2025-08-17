import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DatasetRelevanceResponse {
  related_categories: string[];
  related_columns: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { sentence } = await request.json();
    
    console.log('📝 Analyzing sentence for dataset relevance:', sentence);

    if (!sentence || sentence.trim().length === 0) {
      console.log('❌ Empty sentence provided');
      return NextResponse.json({ related_categories: [], related_columns: [] });
    }

    // Load london_columns.json metadata
    const metadataPath = path.join(process.cwd(), 'public', 'data', 'london_columns.json');
    let metadata;
    
    try {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      console.error('❌ Error loading metadata:', error);
      return NextResponse.json({ related_categories: [], related_columns: [] });
    }

    const prompt = `You are an assistant that analyzes sentences to identify relevant data categories and column names from the London dataset catalog.

Given a sentence about London data exploration, identify which data categories and specific column names are most relevant. If the sentence is too vague or doesn't clearly relate to any specific data, return empty arrays.

**Dataset Metadata:**
${JSON.stringify(metadata, null, 2)}

**Analysis Task:**
1. Identify which category names from the metadata are relevant to the sentence
2. Identify which specific column names from those categories are relevant
3. If the sentence is vague or doesn't clearly relate to specific data, return empty arrays

**Sentence to analyze:**
"${sentence}"

**Response Format:**
Return a JSON object with:
{
  "related_categories": ["category-name-1", "category-name-2"],
  "related_columns": ["column_name_1", "column_name_2", "column_name_3"]
}

**Examples:**
- "Crime rates in Westminster are concerning" → {"related_categories": ["crime-rates"], "related_columns": ["area_name", "borough_name", "crime_category", "crime_category_name"]}
- "Housing prices vary significantly" → {"related_categories": ["house-prices"], "related_columns": ["Area", "Value", "Measure"]}
- "I want to explore data" → {"related_categories": [], "related_columns": []} (too vague)

Respond with JSON only.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4o-mini as requested
      messages: [
        {
          role: "system",
          content: "You are an expert data analyst who identifies relevant datasets based on sentence content. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', content);

    // Parse the response
    let relevanceResponse: DatasetRelevanceResponse;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      relevanceResponse = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (!Array.isArray(relevanceResponse.related_categories) || !Array.isArray(relevanceResponse.related_columns)) {
        throw new Error('Invalid response structure');
      }
      
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI response:', parseError);
      // Fallback to empty arrays if parsing fails
      relevanceResponse = {
        related_categories: [],
        related_columns: []
      };
    }

    console.log('✅ Dataset relevance analysis result:', relevanceResponse);
    return NextResponse.json(relevanceResponse);

  } catch (error) {
    console.error('❌ Error in dataset-relevance API:', error);
    return NextResponse.json({ 
      related_categories: [], 
      related_columns: [] 
    });
  }
}
