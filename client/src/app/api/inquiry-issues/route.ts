import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SentenceNode {
  id: string;
  content: string;
  parent: string | null;
  children: string[];
  activeChild: string | null;
  createdTime: number;
  revisedTime: number;
  editCount: number;
  isCompleted: boolean;
}

export interface TreeStructure {
  nodes: SentenceNode[];
  activePath: string[];
}

export interface IssueIdentification {
  qid: string;
  title: string;
  status: 'open' | 'resolved' | 'stalled';
  sentenceRefs: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Inquiry Issues API: Processing request');
    
    const body = await request.json();
    const { treeStructure, pageId } = body;

    // Validate input
    if (!treeStructure || !treeStructure.nodes || !Array.isArray(treeStructure.nodes)) {
      console.error('❌ Invalid input: treeStructure with nodes array is required');
      return NextResponse.json(
        { error: 'treeStructure with nodes array is required' },
        { status: 400 }
      );
    }

    if (!treeStructure.activePath || !Array.isArray(treeStructure.activePath)) {
      console.error('❌ Invalid input: treeStructure.activePath is required');
      return NextResponse.json(
        { error: 'treeStructure.activePath is required' },
        { status: 400 }
      );
    }

    if (!pageId) {
      console.error('❌ Invalid input: pageId is required');
      return NextResponse.json(
        { error: 'pageId is required' },
        { status: 400 }
      );
    }

    // Extract only the active path sentences from the tree structure
    const activePathSentences = treeStructure.activePath
      .map((sentenceId: string) => {
        const node = treeStructure.nodes.find((n: SentenceNode) => n.id === sentenceId);
        return node ? {
          sentence_id: node.id,
          content: node.content
        } : null;
      })
      .filter((sentence: any) => sentence !== null);

    if (activePathSentences.length === 0) {
      console.log('📝 No active path sentences found, returning empty issues array');
      return NextResponse.json({ issues: [] });
    }

    console.log(`📊 Processing ${activePathSentences.length} active path sentences for issue identification on page: ${pageId}`);

    // Create the system prompt for issue identification
    const systemPrompt = `You are an assistant that analyzes the user's narrative path during exploratory analysis and identifies which sentences raise meaningful questions (issues) worth tracking.

These issues may be:
- Explicit questions (e.g. "Did X happen in 2022?")
- Implicit inquiries (e.g. "I should check whether..." or "It seems like...")
- Investigative goals that signal something unresolved or still unfolding

Each issue should:
- Be framed as a **question** (\`title\`)
- Be assigned a **status**:
   - \`"open"\` if the question is raised but unanswered
   - \`"resolved"\` if the narrative includes clear follow-up or confirmation
   - \`"stalled"\` if the question was raised earlier but left unresolved and later abandoned or deferred (not in the final sentences)
- Be grounded in one or more **sentenceRefs** (e.g., \`["s3"]\`)

Your job is to identify 1–N issues based on this narrative. Not every sentence creates an issue. Group sentences together if they form one coherent question.

Return a JSON array of identified issues:
[
  {
    "qid": "<unique string ID, prefixed with iss_>",
    "title": "<question title>",
    "status": "open" | "resolved" | "stalled",
    "sentenceRefs": ["<sentence_id>", ...] //SENTENCE IDs must be exactly as provided in the input
  }
]

If no issues are identified, return an empty array: \`[]\``;

    const userPrompt = `INPUT USER NARRATIVE:
${JSON.stringify(activePathSentences, null, 2)}

Each sentence item contains:
- sentence_id
- content

Analyze this narrative and identify meaningful questions/issues that emerge from the exploratory analysis process.`;

    // Call OpenAI API with specific parameters for consistency
    console.log('🤖 Calling OpenAI API for issue identification');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,         // low for consistency
      top_p: 1.0,
      max_tokens: 1500,         // scale depending on sentence count
      frequency_penalty: 0,
      presence_penalty: 0,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      console.error('❌ Empty response from OpenAI');
      return NextResponse.json(
        { error: 'Empty response from AI service' },
        { status: 500 }
      );
    }

    console.log('🎯 Raw AI response:', responseContent);

    // Parse the JSON response
    let issues: IssueIdentification[];
    try {
      // Clean the response in case there are markdown code blocks
      const cleanedResponse = responseContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      issues = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!Array.isArray(issues)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each issue
      for (const issue of issues) {
        if (!issue.qid || !issue.title || !issue.status || !Array.isArray(issue.sentenceRefs)) {
          throw new Error(`Invalid issue structure: ${JSON.stringify(issue)}`);
        }
        
        if (!['open', 'resolved', 'stalled'].includes(issue.status)) {
          throw new Error(`Invalid status: ${issue.status}`);
        }
        
        if (!issue.qid.startsWith('iss_')) {
          console.warn(`⚠️ Issue ID doesn't start with 'iss_': ${issue.qid}`);
        }
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw response:', responseContent);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response', 
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          rawResponse: responseContent 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully identified ${issues.length} issues`);
    console.log('🔍 Issues summary:', issues.map(i => ({ qid: i.qid, title: i.title, status: i.status })));

    // Return the identified issues
    return NextResponse.json({ 
      issues,
      metadata: {
        pageId,
        sentenceCount: activePathSentences.length,
        issueCount: issues.length,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o'
      }
    });

  } catch (error) {
    console.error('❌ Inquiry Issues API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
