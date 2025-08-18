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

// First layer issue (input to this API)
export interface IssueIdentification {
  qid: string;
  title: string;
  status: 'open' | 'resolved' | 'stalled';
  sentenceRefs: string[];
}

// Second layer enrichment (output from this API)
export interface IssueEnrichment {
  qid: string;
  position_suggested_by?: {
    text: string;
    confidence: 'low' | 'medium' | 'high';
  } | null;
  argument_suggested_by?: {
    text: string;
    basis: 'data' | 'mechanism' | 'pattern' | 'comparison' | 'other';
  } | null;
  links: Array<{
    qid: string;
    type: 'suggested_by' | 'generalized_from' | 'specialized_from' | 'replaces';
    explanation: string;
  }>;
}

// Final complete issue for InquiryBoard
export interface EnrichedInquiryIssue {
  qid: string;
  title: string;
  status: 'open' | 'resolved' | 'stalled';
  position_suggested_by?: {
    text: string;
    confidence: 'low' | 'medium' | 'high';
  };
  argument_suggested_by?: {
    text: string;
    basis: 'data' | 'mechanism' | 'pattern' | 'comparison' | 'other';
  };
  links: Array<{
    qid: string;
    type: 'suggested_by' | 'generalized_from' | 'specialized_from' | 'replaces';
    explanation: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Inquiry Enrichment API: Processing request');
    
    const body = await request.json();
    const { issues, treeStructure, pageId } = body;

    // Validate input
    if (!issues || !Array.isArray(issues)) {
      console.error('❌ Invalid input: issues array is required');
      return NextResponse.json(
        { error: 'issues array is required' },
        { status: 400 }
      );
    }

    if (!treeStructure || !treeStructure.nodes || !Array.isArray(treeStructure.nodes)) {
      console.error('❌ Invalid input: treeStructure with nodes array is required');
      return NextResponse.json(
        { error: 'treeStructure with nodes array is required' },
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

    if (issues.length === 0) {
      console.log('📝 No issues to enrich, returning empty array');
      return NextResponse.json({ enrichedIssues: [] });
    }

    console.log(`📊 Enriching ${issues.length} issues for page: ${pageId}`);

    // Extract active path sentences for context
    const activePathSentences = treeStructure.activePath
      .map((sentenceId: string) => {
        const node = treeStructure.nodes.find((n: SentenceNode) => n.id === sentenceId);
        return node ? {
          sentence_id: node.id,
          content: node.content
        } : null;
      })
      .filter((sentence: any) => sentence !== null);

    // Create the system prompt for enrichment
    const systemPrompt = `You are a reasoning assistant enriching a user's inquiry graph for exploratory data analysis. The graph contains only ISSUE nodes (questions). For each issue, add (a) an optional position (likely answer), (b) an optional argument (justification), and (c) ISSUE→ISSUE links. Use ONLY what is present or clearly implied in the user's sentences. Do not speculate.

DEFINITIONS (IBIS-aligned, concise)
- position_suggested_by (optional): The likely or tentative ANSWER to the issue found in the user's text. Include:
  • text: short paraphrase or quote of the answer
  • confidence: "high" (asserted/verified), "medium" (tentative), "low" (weak hint)
- argument_suggested_by (optional): The JUSTIFICATION supporting that position. Include:
  • text: brief summary (data reference, mechanism, pattern, or comparison)
  • basis: one of "data" | "mechanism" | "pattern" | "comparison" | "other"
- links (ISSUE→ISSUE only; use sparingly and only if justified):
  • suggested_by: Target issue was prompted as a follow-up/side question by this issue.
  • generalized_from: Current issue is a broader abstraction of a more specific earlier issue.
  • specialized_from: Current issue is a narrower/drilled-down version of a broader earlier issue.
  • replaces: Current issue supersedes or rephrases an earlier issue (clearer scope/time/geo).

Return a JSON array where each item enriches one issue by qid. Do NOT repeat title/status/sentenceRefs. Use null for missing fields.

[
  {
    "qid": "<issue qid>",
    "position_suggested_by": {
      "text": "<answer from user text>",
      "confidence": "low" | "medium" | "high"
    } | null,
    "argument_suggested_by": {
      "text": "<justification from user text>",
      "basis": "data" | "mechanism" | "pattern" | "comparison" | "other"
    } | null,
    "links": [
      {
        "qid": "<target issue qid>",
        "type": "suggested_by" | "generalized_from" | "specialized_from" | "replaces",
        "explanation": "<brief, text-grounded reason>"
      }
    ]
  }
]`;

    const userPrompt = `USER NARRATIVE SENTENCES:
${JSON.stringify(activePathSentences, null, 2)}

EXTRACTED ISSUES (from Layer 1):
${JSON.stringify(issues, null, 2)}

Each issue has: qid, title, sentenceRefs, status

Enrich each issue with positions, arguments, and links based on what is present or clearly implied in the user's sentences. Do not speculate beyond what is textually grounded.`;

    // Call OpenAI API for enrichment
    console.log('🤖 Calling OpenAI API for issue enrichment');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.2,         // low for consistency
      top_p: 0.9,
      max_tokens: 2000,         // increased for enrichment details
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

    console.log('🎯 Raw AI enrichment response:', responseContent);

    // Parse the JSON response
    let enrichments: IssueEnrichment[];
    try {
      // Clean the response in case there are markdown code blocks
      const cleanedResponse = responseContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      enrichments = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!Array.isArray(enrichments)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each enrichment
      for (const enrichment of enrichments) {
        if (!enrichment.qid) {
          throw new Error(`Missing qid in enrichment: ${JSON.stringify(enrichment)}`);
        }
        
        if (!Array.isArray(enrichment.links)) {
          throw new Error(`Links must be an array for qid ${enrichment.qid}`);
        }
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI enrichment response:', parseError);
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

    // Merge original issues with enrichments to create final format
    const enrichedIssues: EnrichedInquiryIssue[] = issues.map((originalIssue: IssueIdentification) => {
      const enrichment = enrichments.find(e => e.qid === originalIssue.qid);
      
      return {
        qid: originalIssue.qid,
        title: originalIssue.title,
        status: originalIssue.status,
        position_suggested_by: enrichment?.position_suggested_by || undefined,
        argument_suggested_by: enrichment?.argument_suggested_by || undefined,
        links: enrichment?.links || []
      };
    });

    console.log(`✅ Successfully enriched ${enrichedIssues.length} issues`);
    console.log('🔍 Enrichment summary:', enrichedIssues.map(i => ({ 
      qid: i.qid, 
      hasPosition: !!i.position_suggested_by,
      hasArgument: !!i.argument_suggested_by,
      linkCount: i.links.length
    })));

    // Return the enriched issues
    return NextResponse.json({ 
      enrichedIssues,
      metadata: {
        pageId,
        originalIssueCount: issues.length,
        enrichedIssueCount: enrichedIssues.length,
        totalLinks: enrichedIssues.reduce((sum, issue) => sum + issue.links.length, 0),
        timestamp: new Date().toISOString(),
        model: 'gpt-4o'
      }
    });

  } catch (error) {
    console.error('❌ Inquiry Enrichment API Error:', error);
    
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
