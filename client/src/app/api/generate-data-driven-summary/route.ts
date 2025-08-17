import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DataDrivenSummaryResponse {
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const { activePathSentences, currentNode } = await request.json();
    
    console.log('📊 Generating data-driven summary for:', {
      pathLength: activePathSentences?.length || 0,
      currentNode: currentNode ? currentNode.substring(0, 50) + '...' : 'none'
    });

    // Validate required inputs
    if (!Array.isArray(activePathSentences)) {
      console.log('❌ Invalid activePathSentences provided');
      return NextResponse.json({ summary: "No interpretable insights have been written yet." });
    }

    // If no meaningful content, return default message
    if (activePathSentences.length === 0 && (!currentNode || currentNode.trim().length === 0)) {
      console.log('📝 No content to summarize');
      return NextResponse.json({ summary: "No interpretable insights have been written yet." });
    }

    // Combine all sentences for analysis
    const allSentences = [...activePathSentences];
    if (currentNode && currentNode.trim().length > 0) {
      allSentences.push(currentNode);
    }

    const sentencesText = allSentences.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');

    const prompt = `You are a data reasoning assistant that summarizes the current state of an exploratory analysis.

The user is writing one sentence at a time to explore datasets about life in London (e.g., crime, housing, income, education). You are given the ordered list of insight sentences that lead to a selected node in their reasoning.

Your task is to generate a **concise, data-driven summary** of what has been observed or inferred — focusing on the analytical content, not the user's phrasing.

############################
REQUIREMENTS:

- Do **not** mention "the user" or refer to the writing process.
- Group related ideas thematically — not in writing order.
- Emphasize **metrics**, **geographic locations**, **values**, **time references**, and **category groupings**.
- Keep tone objective and analytical, as if summarizing the content of a dashboard or report.
- Format the output using semantic inline \`<span>\` tags as follows:

### SPAN TAG FORMAT:
Wrap key variables using:

- \`<span data-type="geo">...</span>\` for boroughs or places (e.g., Camden, London)
- \`<span data-type="metric">...</span>\` for metrics and measures (e.g., crime rate, school density, vehicle ownership)
- \`<span data-type="value">...</span>\` for numeric values (e.g., £32,000, 25%)
- \`<span data-type="time">...</span>\` for time references (e.g., 2022, last year)
- \`<span data-type="group">...</span>\` for demographic or categorical subgroups (e.g., youth, private schools)

Only highlight **relevant** and **interpretable** variables. Do not over-tag.

Keep the summary to **1–3 sentences**.

If no interpretable insight has yet been written, return:
\`\`\`json
{ "summary": "No interpretable insights have been written yet." }
\`\`\`

############################
RESPONSE FORMAT:
Return a JSON object with:
{
  "summary": "Your concise data-driven summary with inline semantic <span> tags here."
}

Respond with JSON only.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: prompt
        },
        // Few-shot example 1
        {
          role: "user",
          content: `1. Vehicle ownership is rising in outer boroughs.
2. Redbridge has seen the highest growth.
3. This may be due to limited public transport access.
4. Income levels in Redbridge are also below average.`
        },
        {
          role: "assistant",
          content: `{
  "summary": "An increase in <span data-type=\\"metric\\">vehicle ownership</span> has been noted in <span data-type=\\"geo\\">outer boroughs</span>, with <span data-type=\\"geo\\">Redbridge</span> showing the most significant growth. The trend may be influenced by <span data-type=\\"metric\\">public transport access</span> and relatively low <span data-type=\\"metric\\">income levels</span> in the area."
}`
        },
        // Few-shot example 2
        {
          role: "user",
          content: `1. Crime decreased overall in 2022.
2. Camden showed a 12% drop compared to 2021.
3. School enrollment remained stable during this period.
4. Some boroughs with high school density still had elevated crime rates.
5. This may point to other underlying factors.`
        },
        {
          role: "assistant",
          content: `{
  "summary": "<span data-type=\\"metric\\">Crime rates</span> declined in <span data-type=\\"time\\">2022</span>, including a <span data-type=\\"value\\">12%</span> drop in <span data-type=\\"geo\\">Camden</span> compared to <span data-type=\\"time\\">2021</span>. However, some boroughs with high <span data-type=\\"metric\\">school density</span> still experienced elevated crime, suggesting additional <span data-type=\\"group\\">underlying factors</span> may be at play."
}`
        },
        // Actual user data
        {
          role: "user",
          content: sentencesText
        }
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', content);

    // Parse the response
    let summaryResponse: DataDrivenSummaryResponse;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      summaryResponse = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (typeof summaryResponse.summary !== 'string') {
        throw new Error('Invalid response structure - summary must be a string');
      }
      
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI response:', parseError);
      // Fallback to default message if parsing fails
      summaryResponse = {
        summary: "No interpretable insights have been written yet."
      };
    }

    console.log('✅ Data-driven summary generated:', summaryResponse);
    return NextResponse.json(summaryResponse);

  } catch (error) {
    console.error('❌ Error in generate-data-driven-summary API:', error);
    return NextResponse.json({ 
      summary: "No interpretable insights have been written yet." 
    });
  }
}
