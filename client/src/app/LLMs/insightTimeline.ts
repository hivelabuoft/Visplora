// Development flag - set to true to skip LLM calls and return placeholder data
const DEV_MODE = true;

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
    reflect: string[];
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

export async function generateInsightTimeline(
  currentTimeline: TimelineGroup[],
  treeStructure: TreeStructure | null,
  recentlyUpdatedSentence: string,
  pageId: string
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
          reflect: ['The author begins writing their narrative. No specific data exploration patterns, analytical focus areas, key findings, trends, or methodological approaches are implied in this sentence.']
        }
      };
    });
    
    return {
      groups: timelineGroups
    } as InsightTimelineResponse;
  }
  
  // Production mode: call LLM API
  try {
    console.log('🔮 Generating insight timeline for page:', pageId);

    const response = await fetch('/api/insight-timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentTimeline,
        treeStructure,
        recentlyUpdatedSentence,
        pageId
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
          reflect: ['Basic insight generated due to API error']
        }
      }]
    } as InsightTimelineResponse;
  }
}
