// Development flag - set to true to skip LLM calls and return placeholder data
const DEV_MODE = false;

export interface TimelineGroup {
  node_id: number;
  sentence_id: string; // Link to the specific sentence
  sentence_content: string; // The actual sentence text
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

export interface InsightTimelineResponse {
  groups: TimelineGroup[];
}

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

export interface ChangeMetadata {
  operation_type: 'add_next' | 'add_branch' | 'edit_sentence' | 'delete_sentence' | 'delete_branch' | 'switch_branch';
  sentence_id: string;
  previous_content?: string; // For edits and deletions
  current_content?: string; // For edits and additions
  parent_info?: {
    node_id: string;
    sentence_id: string;
    sentence_content: string;
  }; // Parent node information for all operations
  child_nodes?: Array<{
    node_id: string;
    sentence_id: string;
    sentence_content: string;
  }>; // For deletions to track all affected children
}

export interface DatasetRelevanceResponse {
  related_categories: string[];
  related_columns: string[];
}

export async function generateInsightTimeline(
  currentTimeline: TimelineGroup[],
  treeStructure: TreeStructure | null,
  recentlyUpdatedSentence: string,
  pageId: string,
  changeMetadata?: ChangeMetadata
): Promise<InsightTimelineResponse> {
  
  // Development mode: return placeholder timeline without calling LLM
  if (DEV_MODE) {
    console.log('🔧 DEV MODE: Generating placeholder timeline for page:', pageId);
    
    if (!treeStructure || treeStructure.nodes.length === 0) {
      console.log('📝 No tree structure available, returning empty timeline');
      return { groups: [] };
    }
    
    // Convert tree structure to timeline groups
    const timelineGroups: TimelineGroup[] = treeStructure.nodes.map((node, index) => {
      // Limit children to most recent 4
      const limitedChildIds = node.children.slice(-4);
      
      return {
        node_id: index + 1,
        sentence_id: node.id,
        sentence_content: node.content,
        parent_id: node.parent || '',
        child_ids: limitedChildIds,
        changed_from_previous: node.parent ? {
          drift_types: ['content_shift'],
          severity: 'low',
          dimensions: { focus: 'narrative_progression' }
        } : null,
        hover: {
          title: 'N/A',
          source: {
            dataset: 'N/A',
            geo: 'N/A',
            time: 'N/A',
            measure: 'N/A',
            unit: 'N/A'
          },
          reflect: [{
            prompt: 'The author begins writing their narrative. No specific data exploration patterns, analytical focus areas, key findings, trends, or methodological approaches are implied in this sentence.',
            reason: 'This is a development mode placeholder reflection.',
            related_sentence: null
          }]
        }
      };
    });
    
    return {
      groups: timelineGroups
    } as InsightTimelineResponse;
  }
  
  // Production mode: call LLM APIs
  try {
    console.log('🔮 Generating insight timeline for page:', pageId);

    // Step 1: Analyze dataset relevance for the current sentence
    let related_datasets: DatasetRelevanceResponse | null = null;
    
    if (recentlyUpdatedSentence && recentlyUpdatedSentence.trim().length > 0) {
      console.log('📊 Step 1: Analyzing dataset relevance for sentence:', recentlyUpdatedSentence);
      
      try {
        const datasetResponse = await fetch('/api/dataset-relevance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sentence: recentlyUpdatedSentence
          }),
        });

        if (datasetResponse.ok) {
          related_datasets = await datasetResponse.json();
          console.log('✅ Dataset relevance analysis result:', related_datasets);
        } else {
          console.warn('⚠️ Dataset relevance API call failed, proceeding without dataset context');
        }
      } catch (datasetError) {
        console.warn('⚠️ Error in dataset relevance analysis, proceeding without dataset context:', datasetError);
      }
    }

    // Step 2: Generate insight timeline with dataset context
    console.log('🎯 Step 2: Generating insight timeline with dataset context');
    
    const response = await fetch('/api/insight-timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentTimeline,
        treeStructure,
        recentlyUpdatedSentence,
        pageId,
        changeMetadata,
        related_datasets
      }),
    });

    if (!response.ok) {
      console.error('❌ HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const insightTimeline: InsightTimelineResponse = await response.json();
    console.log('✅ Received insight timeline from API:', insightTimeline);
    
    return insightTimeline;

  } catch (error) {
    console.error('❌ Error generating insight timeline:', error);
    
    // Return fallback timeline
    return {
      groups: [{
        node_id: 1,
        sentence_id: 'fallback-sentence-1',
        sentence_content: 'Fallback sentence content',
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
          reflect: [{
            prompt: 'Basic insight generated due to API error',
            reason: 'Fallback reflection due to system error.',
            related_sentence: null
          }]
        }
      }]
    };
  }
}
