import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { exploration_path } = await request.json();

    if (!exploration_path || !Array.isArray(exploration_path)) {
      return NextResponse.json(
        { error: 'Invalid exploration_path provided' },
        { status: 400 }
      );
    }

    const prompt = `You are a professional data journalist. Input: an exploration_path in JSON (with sentence_id, sentence_content, drift_type, etc.).

Task: Write a data_story array in JSON. Each element should contain:
- "data_story_sentence": a concise, professional, and data-driven sentence that could appear in a published article. 
- "ref_id": the sentence_id in the exploration_path that this story point is derived from.

Guidelines:
- Summarize evidence-driven insights, not process steps.
- Keep the tone professional, objective, and journalistic — focus on what the data shows.
- Uses professional, data-driven language suitable for publication.
- Each story sentence must tie to at least one sentence_id from the exploration_path.
- It is acceptable to condense multiple related exploration sentences into one coherent data_story sentence, but every ref_id must exist in the path.
- Avoid self-referential language like "I looked at" or "I matched." Use phrases like "The data shows," "Analysis reveals," "Destinations such as X and Y emerge," etc.
- Ensure the data_story covers the main branches and converges at conclusions.
- Output strictly as a JSON array of objects with "data_story_sentence" and "ref_id".

Exploration Path:
${JSON.stringify(exploration_path, null, 2)}

Output: A JSON array with 8–15 items, spanning the entire exploration path.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional data journalist. Generate concise, professional data story sentences based on exploration paths. Always respond with valid JSON array format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content?.trim();
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let dataStory;
    try {
      // Remove any markdown code block syntax if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      dataStory = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate the structure
    if (!Array.isArray(dataStory)) {
      throw new Error('Response is not an array');
    }

    // Validate each item has required fields
    const isValid = dataStory.every(item => 
      typeof item === 'object' && 
      typeof item.data_story_sentence === 'string' && 
      typeof item.ref_id === 'number'
    );

    if (!isValid) {
      throw new Error('Invalid data_story format');
    }

    // Validate that all ref_ids exist in the exploration path
    const explorationIds = new Set(exploration_path.map(item => item.sentence_id));
    const invalidRefIds = dataStory.filter(item => !explorationIds.has(item.ref_id));
    
    if (invalidRefIds.length > 0) {
      console.warn('Warning: Some ref_ids do not exist in exploration path:', invalidRefIds);
      // Filter out invalid ref_ids rather than failing
      dataStory = dataStory.filter(item => explorationIds.has(item.ref_id));
    }

    console.log(`✅ Generated data_story with ${dataStory.length} items`);

    return NextResponse.json({
      success: true,
      data_story: dataStory,
      metadata: {
        generated_at: new Date().toISOString(),
        exploration_path_length: exploration_path.length,
        data_story_length: dataStory.length
      }
    });

  } catch (error) {
    console.error('Error generating data story:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate data story',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}