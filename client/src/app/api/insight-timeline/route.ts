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
    reflect: string[];
  };
}

export interface InsightTimelineResponse {
  groups: TimelineGroup[];
}

export async function POST(request: NextRequest) {
  try {
    const { currentTimeline, treeStructure, recentlyUpdatedSentence, pageId, changeMetadata } = await request.json();
    
    console.log('📝 Change metadata received:', changeMetadata);

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

    const prompt = `You are an assistant helping a user track how their narrative insights evolve while exploring data.

The user is building a personal, exploratory story while browsing dashboards about life in London (e.g., safety, income, housing, education). They write one sentence at a time. After each sentence, your job is to evaluate if the *current sentence* introduces any shift compared to the *previous one*.

Your output supports a visual insight timeline. Each sentence becomes a node in this timeline.

############################
Your task:
For the given current sentence and the previous one (if available), return a JSON object with:

1. The original \`node_id\` and \`sentence_id\` EXACTLY as provided.
2. A \`changed_from_previous\` object describing what changed, if anything, across time, geography, topic, measure, or logic.
3. A \`hover\` block for this insight: a short title, and 1–3 reflection prompts (if any).

If no previous sentence is provided, set \`changed_from_previous\` to \`null\`.

Use the dataset catalog provided to anchor your metadata (\`dataset\`, \`geo\`, \`time\`, \`measure\`, \`unit\`). If unsure, use \`"unknown"\`.

############################
You will be given a JSON object containing:
1) current_path_nodes: the active branch path (ordered) up to the node being considered. 
   Each node has: { node_id, sentence_id, sentence_content }.
2) immediate_child_relation: either null, or an object describing the direct child of the last path node 
   that may need reclassification due to recent changes. 
   Format: { node_id, sentence_id, sentence_content, parent_id }.
   Why it exists: when a parent is edited, reparented, or removed, its child may drift relative to the new context and must be re-evaluated.
3) change_metadata: describes the user's latest operation in the editor.

############################
Allowed drift types:
1. **Elaboration**  
   Adds detail to the prior insight without changing topic, time, location, or measure.  
   Use when the current sentence continues the same narrative logically and thematically.

2. **Context Shift**  
   Keeps the same topic but changes **where** (geo) or **when** (time) the insight applies.  
   Examples: Camden → London, or 2021 → 2023.

3. **Reframing**  
   Keeps the same topic and location but changes how the data is viewed — such as switching the **measure** (e.g., average → median), the **unit** (counts → percentages), or the **subgroup** (e.g., all vehicles → SUVs).  
   This reframes the insight without changing its subject.

4. **Topic Change**  
   Switches the subject or domain entirely, or introduces logical contradiction.  
   Examples: From housing to crime, or from "prices down" → "affordability up."  
   Often marks a new narrative branch or break in reasoning.

Allowed severity:
- \`none\`, \`minor\`, \`moderate\`, \`critical\`

### If there is no previous sentence:
Set \`changed_from_previous: null\`

############################
INPUT DATA:
${JSON.stringify(llmInput, null, 2)}

############################
OUTPUT JSON FORMAT:
Return an array of all the necessary node's drifts:
[
  {
    "node_id": <number>,                      // must match input
    "sentence_id": <string>,                  // must match input
    "sentence_content": <string>,             // must match input
    "changed_from_previous": {
      "drift_types": [ ... ],                 // from allowed list
      "severity": "<severity-level>",         // from allowed list
      "dimensions": {
        "<what changed>": "<from → to>"       // explain the change
      }
    } | null,
    "hover": {
      "title": "<concise insight title>",
      "reflect": [
        "<prompts to help the user verify their logic>",
        "<prompts to help the user verify their logic>"
      ]
    }
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system", 
          content: "You are an expert narrative insight tracker. You analyze how data exploration insights evolve and drift over time. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 0.9
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🤖 Raw OpenAI response:', content);

    // Parse the LLM response
    let llmDriftResponses: LLMDriftResponse[];
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      llmDriftResponses = JSON.parse(cleanContent);
      
      if (!Array.isArray(llmDriftResponses)) {
        throw new Error('Expected array of drift responses');
      }
      
    } catch (parseError) {
      
      // Fallback response
      llmDriftResponses = currentPathNodes.map(node => ({
        node_id: node.node_id,
        sentence_id: node.sentence_id,
        sentence_content: node.sentence_content,
        changed_from_previous: null,
        hover: {
          title: 'Analysis Update',
          reflect: ['Consider the data context', 'Verify the analytical logic']
        }
      }));
    }

    // Map LLM responses back to TimelineGroup format
    const updatedTimeline: TimelineGroup[] = currentTimeline.map((group: TimelineGroup) => {
      // Find matching drift response by node_id and sentence_id
      const driftResponse = llmDriftResponses.find(
        response => response.node_id === group.node_id && response.sentence_id === group.sentence_id
      );

      if (driftResponse) {
        // Update the group with new drift information
        return {
          ...group,
          changed_from_previous: driftResponse.changed_from_previous,
          hover: {
            ...group.hover,
            title: driftResponse.hover.title,
            reflect: driftResponse.hover.reflect
          }
        };
      }

      // No matching drift response found, return original group
      return group;
    });

    // Add new groups for any drift responses that don't match existing timeline groups
    const newGroups: TimelineGroup[] = llmDriftResponses
      .filter(response => !currentTimeline.some(
        (group: TimelineGroup) => group.node_id === response.node_id && group.sentence_id === response.sentence_id
      ))
      .map(response => {
        // Find the corresponding tree node to get hierarchy info
        const treeNode = treeStructure.nodes.find((n: SentenceNode) => n.id === response.sentence_id);
        
        
        return {
          node_id: response.node_id,
          sentence_id: response.sentence_id,
          sentence_content: response.sentence_content,
          parent_id: treeNode?.parent || '',
          child_ids: treeNode?.children || [], // Don't truncate - keep all children
          changed_from_previous: response.changed_from_previous,
          hover: {
            title: response.hover.title,
            source: {
              dataset: 'London Data',
              geo: 'London',
              time: 'Current Period',
              measure: 'Various Metrics',
              unit: 'mixed'
            },
            reflect: response.hover.reflect
          }
        };
      });

    const finalTimeline = [...updatedTimeline, ...newGroups];

    
    return NextResponse.json({ groups: finalTimeline });

  } catch (error) {
    
    // Return empty timeline as fallback
    return NextResponse.json({ groups: [] });
  }
}
