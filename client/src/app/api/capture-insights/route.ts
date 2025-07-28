import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Capture insights API called');
    
    // Parse and log request body
    let requestBody = null;
    try {
      const bodyText = await request.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
        console.log('📝 Received input data:', requestBody);
        
        // Validate the expected structure
        if (!requestBody.interaction_log || !Array.isArray(requestBody.interaction_log)) {
          throw new Error('Missing or invalid interaction_log array');
        }
        
        console.log('📊 Interaction log length:', requestBody.interaction_log.length);
        console.log('💬 Narrative context length:', requestBody.narrative_context?.length || 0);
        console.log('✏️ Current sentence:', requestBody.current_sentence || 'none');
        
      } else {
        throw new Error('Request body is empty');
      }
    } catch (bodyError) {
      console.error('⚠️ Could not parse request body:', bodyError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body', 
          message: bodyError instanceof Error ? bodyError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
    
    console.log('🤖 Calling OpenAI with input data...');
    
    // Create the focused prompt for generating narrative sentences
    const systemPrompt = `You are an assistant helping a user write a data-supported personal narrative. The user is exploring a dashboard to decide which borough in London to move to, based on factors like safety, income, housing, education, and quality of life.

They have just interacted with a specific view on the dashboard and clicked "Capture Insight." Your task is to write one concise, readable narrative sentence based on the data they were exploring.

**Your role**: write one concise, data-backed narrative sentence that would be a *natural follow-up* to the user's current sentence, using ONLY the evidence contained in the interaction log.

**Avoid:** Jargon, vague summaries, or speculative statements. Use the actual numbers and trends from the data. The sentence should sound human and fit into a longer narrative paragraph.

############################
INPUT JSON
############################
{
  "narrative_context": <string>,          // a full narration of the user's current writing of exploration
  "current_sentence": <string>,           // the sentence they just wrote or are editing
  "interaction_log": [                    // EXACTLY the last 5 dashboard events
    /* ARRAY IS IN CHRONOLOGICAL ORDER:
       index 0 = oldest, index 4 = most recent (most important) */
    {
      "elementId": <string>,              // unique view id
      "elementName": <string>,            // human-readable name
      "elementType": <"chart"|"map" ...>, // what kind of view
      "action": <string>,                 // e.g. "filter_change", "interactive_hover"
      "dashboardConfig": {                // static metadata about the view
        "title": <string>,
        "view_type": <string>,
        "variable_map": { ... }
      },
      "chartData": { ... } or [ ... ]     // numbers or categorical values revealed
    },
    ...
    /* 5 objects total */
  ]
}

**Important reading rules**
1. The **4th and 5th objects (indexes 3 and 4)** represent the user's freshest focus; prefer those for your sentence.
2. Focus on whichever interaction(s) provide a clear, interesting, NUMERIC or CATEGORICAL takeaway.  
   • If multiple views are relevant, you may combine two, but keep the sentence short.  
   • Ignore hovers that do not reveal new numbers.
3. Do not invent numbers. Quote or paraphrase only what is present.
4. Write in **plain language** (journalistic tone, not code).
5. The sentence should help the user decide where to live (safety, income, diversity, housing, etc.).
6. If NO clear insight is possible, return \`"narrative_suggestion": null\`.

############################
YOUR SINGLE-LINE JSON OUTPUT
############################
Return a JSON object:

{
  "narrative_suggestion": "<one well-formed English sentence or null>",
  "source_elementId": "<elementId you relied on most>",
  "source_view_title": "<dashboardConfig.title>",
  "explanation": <explanation on why this is a reasonable followup, what insight would it provide in 10-20 words>
}

*No additional keys, no markdown.*`;

    const userPrompt = JSON.stringify({
      narrative_context: requestBody.narrative_context || 'No narrative context provided',
      current_sentence: requestBody.current_sentence || 'No current sentence - use the last sentence from the current narration',
      interaction_log: requestBody.interaction_log
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: userPrompt
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
      top_p: 1.0
    });

    const insights = response.choices[0]?.message?.content || 'No insights generated';
    console.log('✅ OpenAI insights captured successfully:', insights);
    
    return NextResponse.json({ 
      success: true, 
      insights: insights,
      data: {
        model: response.model,
        usage: response.usage,
        interaction_count: requestBody.interaction_log.length,
        narrative_length: requestBody.narrative_context?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Error calling OpenAI:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to capture insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
