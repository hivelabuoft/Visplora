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

// New interfaces for the LLM input/output format
export interface PathNode {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
}

export interface ImmediateChildRelation {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
  parent_id: string;
}

export interface LLMChangeMetadata {
  operation_type: 'add_next' | 'add_branch' | 'edit_sentence' | 'delete_sentence' | 'delete_branch';
  sentence_id: string;
  previous_content?: string;
  current_content?: string;
  parent: {
    node_id: number;
    sentence_id: string;
    sentence_content: string;
  };
  children?: Array<{
    node_id: number;
    sentence_id: string;
    sentence_content: string;
  }>;
}

export interface LLMInput {
  current_path_nodes: PathNode[];
  immediate_child_relation: ImmediateChildRelation | null;
  change_metadata: LLMChangeMetadata;
}

export interface LLMDriftResponse {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
  changed_from_previous: {
    drift_types: string[];
    severity: string;
    dimensions: Record<string, string>;
  } | null;
  hover: {
    title: string;
    reflect: string[];
  };
}

export interface ChildNodeInfo {
  node_id: string;
  sentence_id: string;
  sentence_content: string;
}

export interface ParentNodeInfo {
  node_id: string;
  sentence_id: string;
  sentence_content: string;
}

export interface ChangeMetadata {
  operation_type: 'add_next' | 'add_branch' | 'edit_sentence' | 'delete_sentence' | 'delete_branch';
  sentence_id: string;
  previous_content?: string; // For edits and deletions
  current_content?: string; // For edits and additions
  parent_info?: ParentNodeInfo; // Parent node information for all operations
  child_nodes?: ChildNodeInfo[]; // For deletions to track all affected children
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
    reflect: Array<{
      prompt: string;
      reason: string;
      related_sentence: {
        node_id: number;
        sentence_content: string;
      } | null;
    }>;
  };
}

// New interfaces for the two-step process
export interface FirstStepResponse {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
  changed_from_previous: {
    drift_types: string[];
    severity: string;
    dimensions: Record<string, string>;
  } | null;
  related_source: {
    related_categories: string[];
    related_columns: string[];
  };
  related_sentence: {
    node_id: number;
    reason: string;
  } | null;
}

export interface SecondStepResponse {
  node_id: number;
  sentence_id: string;
  sentence_content: string;
  reflect: Array<{
    prompt: string;
    reason: string;
    related_sentence: {
      node_id: number;
      sentence_content: string;
    } | null;
  }>;
}

export interface InsightTimelineResponse {
  groups: TimelineGroup[];
}

export async function POST(request: NextRequest) {
  try {
    const { currentTimeline, treeStructure, recentlyUpdatedSentence, pageId, changeMetadata, related_datasets } = await request.json();
    
    console.log('📝 Change metadata received:', changeMetadata);
    console.log('📊 Related datasets received:', related_datasets);

    // Early exit if no changeMetadata is provided (to avoid triggering on typing)
    if (!changeMetadata) {
      console.log('❌ No change metadata provided, skipping LLM call to prevent unnecessary triggers');
      return NextResponse.json({ groups: currentTimeline || [] });
    }

    if (!treeStructure || !treeStructure.nodes || treeStructure.nodes.length === 0) {
      console.log('📝 No tree structure provided, returning empty timeline');
      return NextResponse.json({ groups: [] });
    }

    // Helper function to convert tree node to timeline format
    const convertTreeNodeToTimelineNode = (treeNode: SentenceNode, nodeIndex: number): PathNode => ({
      node_id: nodeIndex + 1, // Use 1-based indexing
      sentence_id: treeNode.id,
      sentence_content: treeNode.content
    });

    // Build current path nodes from active path
    const currentPathNodes: PathNode[] = treeStructure.activePath
      .map((nodeId: string) => {
        const treeNode = treeStructure.nodes.find((n: SentenceNode) => n.id === nodeId);
        if (!treeNode) return null;
        const nodeIndex = treeStructure.nodes.findIndex((n: SentenceNode) => n.id === nodeId);
        return convertTreeNodeToTimelineNode(treeNode, nodeIndex);
      })
      .filter(Boolean) as PathNode[];

    console.log('🔗 Current path nodes built:', currentPathNodes.map(node => ({
      node_id: node.node_id,
      sentence_id: node.sentence_id,
      content: node.sentence_content // Show full content for better debugging
    })));

    // Find immediate child relation if applicable
    let immediateChildRelation: ImmediateChildRelation | null = null;
    if (currentPathNodes.length > 0) {
      const lastPathNode = currentPathNodes[currentPathNodes.length - 1];
      const lastTreeNode = treeStructure.nodes.find((n: SentenceNode) => n.id === lastPathNode.sentence_id);
      
      if (lastTreeNode && lastTreeNode.children.length > 0) {
        // Find the active child or first child
        const activeChildId = lastTreeNode.activeChild || lastTreeNode.children[0];
        const childTreeNode = treeStructure.nodes.find((n: SentenceNode) => n.id === activeChildId);
        
        if (childTreeNode) {
          const childNodeIndex = treeStructure.nodes.findIndex((n: SentenceNode) => n.id === activeChildId);
          immediateChildRelation = {
            node_id: childNodeIndex + 1,
            sentence_id: childTreeNode.id,
            sentence_content: childTreeNode.content,
            parent_id: lastPathNode.sentence_id
          };
        }
      }
    }

    // Convert changeMetadata to LLM format
    let llmChangeMetadata: LLMChangeMetadata | null = null;
    if (changeMetadata && changeMetadata.parent_info) {
      llmChangeMetadata = {
        operation_type: changeMetadata.operation_type,
        sentence_id: changeMetadata.sentence_id,
        previous_content: changeMetadata.previous_content,
        current_content: changeMetadata.current_content,
        parent: {
          node_id: parseInt(changeMetadata.parent_info.node_id),
          sentence_id: changeMetadata.parent_info.sentence_id,
          sentence_content: changeMetadata.parent_info.sentence_content
        },
        children: changeMetadata.child_nodes?.map((child: ChildNodeInfo) => ({
          node_id: parseInt(child.node_id),
          sentence_id: child.sentence_id,
          sentence_content: child.sentence_content
        }))
      };
    }

    // Prepare LLM input
    const llmInput: LLMInput = {
      current_path_nodes: currentPathNodes,
      immediate_child_relation: immediateChildRelation,
      change_metadata: llmChangeMetadata!
    };

    // STEP 1: Analyze drift and find related sentences
    const firstPrompt = `You are an assistant helping a user track how their narrative insights evolve while exploring data.

The user is building a personal, exploratory story while browsing dashboards about life in London (e.g., safety, income, housing, education). They write one sentence at a time. After each sentence, your job is to evaluate if the *current sentence* introduces any shift compared to the *previous one* AND identify any previously written sentences in their active path that are related to the current sentence.

############################
RELEVANT DATASETS:
The following datasets have been identified as potentially relevant to the current sentence:
${related_datasets ? `
Categories: ${related_datasets.related_categories?.join(', ') || 'None identified'}
Columns: ${related_datasets.related_columns?.join(', ') || 'None identified'}
` : 'No specific datasets identified for this sentence.'}

############################
Your task:
For the given current sentence and the previous one (if available), return a JSON object with:

1. The original \`node_id\` and \`sentence_id\` EXACTLY as provided.
2. A \`changed_from_previous\` object describing what changed, if anything, across time, geography, topic, measure, or logic.
3. A \`related_source\` object containing the relevant categories and columns from the dataset.
4. A \`related_sentence\` object identifying the most relevant previous sentence in the active path, if any exists.

If no previous sentence is provided, set \`changed_from_previous\` to \`null\`.
If no related sentence is found in the active path, set \`related_sentence\` to \`null\`.

############################
Allowed drift types:
1. **Elaboration** - Adds detail to the prior insight without changing topic, time, location, or measure.
2. **Context Shift** - Keeps the same topic but changes **where** (geo) or **when** (time) the insight applies.
3. **Reframing** - Keeps the same topic and location but changes how the data is viewed.
4. **Topic Change** - Switches the subject or domain entirely, or introduces logical contradiction.

Allowed severity: \`none\`, \`minor\`, \`moderate\`, \`critical\`

############################
INPUT DATA:
${JSON.stringify(llmInput, null, 2)}

############################
OUTPUT JSON FORMAT:
[
  {
    "node_id": <number>,
    "sentence_id": "<string>",
    "sentence_content": "<string>",
    "changed_from_previous": {
      "drift_types": [ ... ],
      "severity": "<severity-level>",
      "dimensions": {
        "<what changed>": "<from → to>"
      }
    } | null,
    "related_source": {
      "related_categories": ["category1", "category2"],
      "related_columns": ["column1", "column2"]
    },
    "related_sentence": {
      "node_id": <number>,
      "reason": "<reason why they are related>"
    } | null
  }
]`;

    const firstResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are an expert narrative insight tracker. You analyze how data exploration insights evolve and drift over time, and identify relationships between sentences. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: firstPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 0.9
    });

    const firstContent = firstResponse.choices[0]?.message?.content?.trim();
    if (!firstContent) {
      throw new Error('No content received from first OpenAI call');
    }

    console.log('🤖 First step raw OpenAI response:', firstContent);

    // Parse the first LLM response
    let firstStepResponses: FirstStepResponse[];
    try {
      const cleanFirstContent = firstContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      firstStepResponses = JSON.parse(cleanFirstContent);
      
      if (!Array.isArray(firstStepResponses)) {
        throw new Error('Expected array of first step responses');
      }
    } catch (parseError) {
      console.error('❌ Error parsing first step response:', parseError);
      // Fallback response
      firstStepResponses = currentPathNodes.map(node => ({
        node_id: node.node_id,
        sentence_id: node.sentence_id,
        sentence_content: node.sentence_content,
        changed_from_previous: null,
        related_source: {
          related_categories: related_datasets?.related_categories || [],
          related_columns: related_datasets?.related_columns || []
        },
        related_sentence: null
      }));
    }

    // STEP 2: Generate reflection prompts
    const reflectionPromises = firstStepResponses.map(async (firstStepData) => {
      // Find related sentences content for context
      const relatedSentencesContext = firstStepData.related_sentence ? 
        currentPathNodes.filter(node => node.node_id === firstStepData.related_sentence!.node_id)
          .map(node => ({
            node_id: node.node_id,
            sentence_id: node.sentence_id,
            sentence_content: node.sentence_content,
            reason_for_relevance: firstStepData.related_sentence!.reason
          })) : [];

      const secondPrompt = `You are an assistant helping a user reflect on their reasoning as they explore data and build a personal narrative.

The user writes one sentence at a time while browsing dashboards about life in London (e.g., safety, income, housing, education). Your task is to help the user think critically about their most recent insight by suggesting detailed reflection prompts — especially when the new insight may be contradictory, oversimplified, or incomplete.

Your reflection should help the user:
- Reconsider implicit assumptions
- Explore alternative explanations
- Think about branching to resolve contradictions
- Keep the number of reflections manageable (0-3 per insight)
- Each reflection question should be specific and actionable (7-15 words max)

You must keep the reflection grounded within the scope of the provided datasets.

############################
RELEVANT DATA SOURCES:
The following dataset categories have been identified as relevant to the current insight. Stay within these domains when suggesting reflection prompts:

${JSON.stringify(firstStepData.related_source, null, 2)}

Only use reasoning related to these domains. Do not speculate outside them.

############################
CONTEXTUAL INSIGHTS:
Here are potentially related or contradictory insights previously written by the user. You may use them to explain reasoning tension or provide contrast.

${JSON.stringify(relatedSentencesContext, null, 2)}

Each item includes:
- node_id
- sentence_id  
- sentence_content
- reason_for_relevance (e.g., "same topic", "opposite claim", "same borough", "time mismatch")

You may reference these insights in your reflection, but only if they meaningfully relate to the current sentence.

############################
INPUT:
{
  "node_id": ${firstStepData.node_id},
  "sentence_id": "${firstStepData.sentence_id}",
  "sentence_content": "${firstStepData.sentence_content}"
}

############################
OUTPUT FORMAT:
Return a single JSON object in this format:
{
  "node_id": ${firstStepData.node_id},
  "sentence_id": "${firstStepData.sentence_id}",
  "sentence_content": "${firstStepData.sentence_content}",
  "reflect": [
    {
      "prompt": "<detailed reflection question>",
      "reason": "<why this prompt is relevant>",
      "related_sentence": {
        "node_id": <number>,
        "sentence_content": "<string>"
      } | null
    }
  ]
}

If you cannot find anything to reflect on, return "reflect": []`;

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: secondPrompt
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const secondContent = secondResponse.choices[0]?.message?.content?.trim();
      if (!secondContent) {
        throw new Error('No content received from second OpenAI call');
      }

      console.log('🤖 Second step raw OpenAI response:', secondContent);

      // Parse the second LLM response
      try {
        const cleanSecondContent = secondContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const secondStepData: SecondStepResponse = JSON.parse(cleanSecondContent);
        return secondStepData;
      } catch (parseError) {
        console.error('❌ Error parsing second step response:', parseError);
        // Fallback response
        return {
          node_id: firstStepData.node_id,
          sentence_id: firstStepData.sentence_id,
          sentence_content: firstStepData.sentence_content,
          reflect: []
        };
      }
    });

    const secondStepResponses = await Promise.all(reflectionPromises);

    // Combine results from both steps
    const combinedResponses = firstStepResponses.map((firstStep, index) => {
      const secondStep = secondStepResponses[index];
      return {
        firstStep,
        secondStep
      };
    });

    // Map combined responses back to TimelineGroup format
    const updatedTimeline: TimelineGroup[] = currentTimeline.map((group: TimelineGroup) => {
      // Find matching combined response by node_id and sentence_id
      const combinedResponse = combinedResponses.find(
        response => response.firstStep.node_id === group.node_id && response.firstStep.sentence_id === group.sentence_id
      );

      if (combinedResponse) {
        // Update the group with new information from both steps
        return {
          ...group,
          changed_from_previous: combinedResponse.firstStep.changed_from_previous,
          hover: {
            ...group.hover,
            title: `Insight Analysis`, // Simple title since reflection is now separate
            reflect: combinedResponse.secondStep.reflect
          }
        };
      }

      // No matching response found, return original group
      return group;
    });

    // Add new groups for any responses that don't match existing timeline groups
    const newGroups: TimelineGroup[] = combinedResponses
      .filter(response => !currentTimeline.some(
        (group: TimelineGroup) => group.node_id === response.firstStep.node_id && group.sentence_id === response.firstStep.sentence_id
      ))
      .map(response => {
        // Find the corresponding tree node to get hierarchy info
        const treeNode = treeStructure.nodes.find((n: SentenceNode) => n.id === response.firstStep.sentence_id);
        
        return {
          node_id: response.firstStep.node_id,
          sentence_id: response.firstStep.sentence_id,
          sentence_content: response.firstStep.sentence_content,
          parent_id: treeNode?.parent || '',
          child_ids: treeNode?.children || [],
          changed_from_previous: response.firstStep.changed_from_previous,
          hover: {
            title: 'Insight Analysis',
            source: {
              dataset: response.firstStep.related_source.related_categories,
              geo: 'London',
              time: 'Current Period', 
              measure: response.firstStep.related_source.related_columns,
              unit: 'mixed'
            },
            reflect: response.secondStep.reflect
          }
        };
      });

    const finalTimeline = [...updatedTimeline, ...newGroups];

    console.log('✅ Final timeline generated with', finalTimeline.length, 'groups');
    return NextResponse.json({ groups: finalTimeline });

  } catch (error) {
    console.error('❌ Error in insight-timeline API:', error);
    // Return empty timeline as fallback
    return NextResponse.json({ groups: [] });
  }
}
