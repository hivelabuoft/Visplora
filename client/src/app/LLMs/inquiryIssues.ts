import { isDemoMode, logDemoModeStatus } from '../utils/demoMode';

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

export interface InquiryIssuesResponse {
  issues: IssueIdentification[];
  metadata: {
    pageId?: string;
    activePathLength: number;
    totalNodes: number;
    sentenceCount: number;
    issueCount: number;
    timestamp: string;
    model: string;
  };
}

export async function generateInquiryIssues(
  treeStructure: TreeStructure | null,
  pageId: string
): Promise<InquiryIssuesResponse> {
  
  // Development mode: return placeholder issues without calling LLM
  if (isDemoMode()) {
    logDemoModeStatus('InquiryIssues');
    console.log('🔧 DEV MODE: Generating placeholder inquiry issues for page:', pageId);
    
    if (!treeStructure || treeStructure.nodes.length === 0) {
      console.log('📝 No tree structure available, returning empty issues');
      return { 
        issues: [],
        metadata: {
          pageId,
          activePathLength: 0,
          totalNodes: 0,
          sentenceCount: 0,
          issueCount: 0,
          timestamp: new Date().toISOString(),
          model: 'dev-mode-placeholder'
        }
      };
    }
    
    // Generate placeholder issues from active path
    const activePathSentences = treeStructure.activePath
      .map(nodeId => treeStructure.nodes.find(n => n.id === nodeId))
      .filter(Boolean) as SentenceNode[];

    // Create a simple placeholder issue if we have sentences
    const placeholderIssues: IssueIdentification[] = activePathSentences.length > 0 ? [
      {
        qid: 'iss_dev_placeholder',
        title: 'What patterns emerge from this exploratory analysis?',
        status: 'open',
        sentenceRefs: activePathSentences.slice(-2).map(s => s.id) // Last 2 sentences
      }
    ] : [];
    
    return {
      issues: placeholderIssues,
      metadata: {
        pageId,
        activePathLength: treeStructure.activePath.length,
        totalNodes: treeStructure.nodes.length,
        sentenceCount: activePathSentences.length,
        issueCount: placeholderIssues.length,
        timestamp: new Date().toISOString(),
        model: 'dev-mode-placeholder'
      }
    };
  }
  
  // Production mode: call LLM API
  try {
    console.log('🔮 Generating inquiry issues for page:', pageId);

    const response = await fetch('/api/inquiry-issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        treeStructure,
        pageId
      }),
    });

    if (!response.ok) {
      console.error('❌ HTTP error:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const inquiryIssues: InquiryIssuesResponse = await response.json();
    console.log('✅ Received inquiry issues from API:', inquiryIssues);
    
    return inquiryIssues;

  } catch (error) {
    console.error('❌ Error generating inquiry issues:', error);
    
    // Return fallback response
    return {
      issues: [{
        qid: 'iss_fallback_analysis',
        title: 'What insights can be derived from the current analysis?',
        status: 'open',
        sentenceRefs: treeStructure?.activePath.slice(-1) || []
      }],
      metadata: {
        pageId,
        activePathLength: treeStructure?.activePath.length || 0,
        totalNodes: treeStructure?.nodes.length || 0,
        sentenceCount: treeStructure?.activePath.length || 0,
        issueCount: 1,
        timestamp: new Date().toISOString(),
        model: 'fallback-error-handler'
      }
    };
  }
}
