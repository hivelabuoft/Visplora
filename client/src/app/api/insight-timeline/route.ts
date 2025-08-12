import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

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

export interface TimelineGroup {
  node_id: number;
  sentence_id: string; // Link to the specific sentence
  sentence_content: string;
  parent_id: string;
  child_ids: string[];
  changed_from_previous: {
    drift_types: string[];
    severity: string;
    dimensions: Record<string, string>;
  } | null;
  hover: {
    title: string;
    source: {
      dataset: string | string[];
      geo: string | string[];
      time: string | string[];
      measure: string | string[];
      unit: string;
    };
    reflect: string[];
  };
}

export interface InsightTimelineResponse {
  groups: TimelineGroup[];
}

export async function POST(request: NextRequest) {
  try {
    const { currentTimeline, treeStructure, recentlyUpdatedSentence, pageId } = await request.json();
    
    console.log('🔮 Generating insight timeline for page:', pageId);

    if (!treeStructure || !treeStructure.nodes || treeStructure.nodes.length === 0) {
      console.log('📝 No tree structure provided, returning empty timeline');
      return NextResponse.json({ groups: [] });
    }

    // Convert tree structure to narrative content for LLM
    const narrativeContent = treeStructure.nodes
      .filter((node: SentenceNode) => node.content && node.content.trim().length > 0)
      .map((node: SentenceNode) => node.content.trim())
      .join(' ');

    const prompt = `You are an intelligent insight timeline generator for narrative data analysis.

Your task is to analyze the current narrative content and generate an updated insight timeline that tracks the analytical journey and key insights as the user builds their data narrative.

**Context:**
- Page ID: ${pageId}
- Recently Updated Sentence: "${recentlyUpdatedSentence}"
- Narrative Tree Structure: ${treeStructure.nodes.length} nodes with branching
- Tree Active Path: ${treeStructure.activePath.join(' → ')}
- Full Narrative Content: ${narrativeContent}
- Current Timeline Groups: ${currentTimeline.length} existing groups

**Your Role:**
Generate an updated timeline that:
1. Reflects the complete tree structure with all branches (not just active path)
2. Identifies key insights and data relationships across all narrative branches
3. Tracks changes from previous analysis states
4. Provides hover information for each timeline group
5. Supports branching visualization for nodes with multiple children
4. Provides hover information for each timeline group

**Guidelines:**
- Create one timeline node per sentence node in the tree structure
- Each node represents the insight provenance for that specific sentence
- Each node should have a clear title and source information
- Preserve the exact tree structure relationships (parent-child mapping)
- Use incremental node IDs (1, 2, 3, etc.)
- Link each node to the original sentence_id from the tree
- Support branching: nodes can have multiple children
- Limit child_ids to most recent 4 children if more exist

**Current Timeline State:**
${JSON.stringify(currentTimeline, null, 2)}

**Tree Structure Details:**
Nodes: ${treeStructure.nodes.length}
Active Path: ${treeStructure.activePath.join(' → ')}

Tree Nodes:
${treeStructure.nodes.map((node: SentenceNode, index: number) => 
  `${index + 1}. ${node.id}: "${node.content}" (parent: ${node.parent || 'none'}, children: ${node.children.length})`
).join('\n')}

Generate a JSON response with updated timeline nodes for the ENTIRE tree structure. Each sentence node should have its own timeline node with insights about:
- Data exploration patterns for that sentence
- Analytical focus areas revealed by that sentence  
- Key findings or trends expressed in that sentence
- Methodological approaches implied by that sentence
- Preserve exact tree structure: parent_id matches tree parent, child_ids match tree children (limit to 4 most recent)

Response format:
{
  "groups": [
    {
      "node_id": number,
      "sentence_id": "unique identifier for the sentence",
      "sentence_content": "the actual sentence text content",
      "parent_id": "parent node id or empty string for root",
      "child_ids": ["array of child node ids"],
      "changed_from_previous": {
        "drift_types": ["array of change types like content_shift, focus_change"],
        "severity": "low|medium|high",
        "dimensions": {"key": "value pairs describing the change"}
      } || null,
      "hover": {
        "title": "Clear, descriptive title for this sentence's insight",
        "source": {
          "dataset": "relevant dataset name(s)",
          "geo": "geographic scope",
          "time": "temporal scope", 
          "measure": "key metrics or variables",
          "unit": "measurement unit"
        },
        "reflect": ["array of key insights or observations for this sentence"]
      }
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system", 
          content: "You are an expert data analysis timeline generator. You create structured insights that track the evolution of analytical narratives. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 0.9
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', content);

    // Parse the JSON response
    let timelineResponse: InsightTimelineResponse;
    try {
      // Clean the content in case there are extra characters
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('🧹 Cleaned content for parsing:', cleanContent);
      
      timelineResponse = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed timeline response:', JSON.stringify(timelineResponse, null, 2));
      
      // Validate the parsed object has required fields
      if (!timelineResponse.groups || !Array.isArray(timelineResponse.groups)) {
        throw new Error('Invalid timeline structure: missing or invalid groups array');
      }
      
      // Basic validation of group structure
      for (const group of timelineResponse.groups) {
        if (!group.node_id || !group.hover || !group.hover.title) {
          throw new Error('Invalid group structure: missing required fields');
        }
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw content that failed to parse:', content);
      
      // Fallback response
      timelineResponse = {
        groups: [{
          node_id: (currentTimeline.length || 0) + 1,
          sentence_id: `fallback-sentence-${Date.now()}`,
          sentence_content: 'Fallback analysis generated',
          parent_id: '',
          child_ids: [],
          changed_from_previous: null,
          hover: {
            title: 'Narrative Analysis Update',
            source: {
              dataset: 'Current Dataset',
              geo: 'Analysis Region',
              time: 'Current Period',
              measure: 'Key Metrics',
              unit: 'count'
            },
            reflect: ['Analysis updated with recent narrative changes']
          }
        }]
      };
    }

    console.log('✅ Generated insight timeline with', timelineResponse.groups.length, 'groups');
    
    return NextResponse.json(timelineResponse);

  } catch (error) {
    console.error('❌ Error generating insight timeline:', error);
    
    // Return fallback timeline
    const fallbackResponse: InsightTimelineResponse = {
      groups: [{
        node_id: 1,
        sentence_id: `fallback-sentence-${Date.now()}`,
        sentence_content: 'Error fallback analysis generated',
        parent_id: '',
        child_ids: [],
        changed_from_previous: null,
        hover: {
          title: 'Basic Analysis',
          source: {
            dataset: 'Default Dataset',
            geo: 'All Regions',
            time: 'Current Period',
            measure: 'General Metrics',
            unit: 'count'
          },
          reflect: ['Basic insight generated due to API error']
        }
      }]
    };
    
    return NextResponse.json(fallbackResponse);
  }
}
