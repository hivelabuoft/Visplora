'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DatasetExplorer from '../components/DatasetExplorer';
import PagedNarrativeSystem, { PagedNarrativeSystemRef } from '../components/PagedNarrativeSystem';
import FileSummaryCanvas from '../components/FileSummaryCanvas';
import { EmptyCanvas, EmptyTimeline, AnalyzingState, TimelineVisualization } from '../components/EmptyStates';
import ReactFlowCanvas, { ReactFlowCanvasRef } from '../components/ReactFlowCanvas';
import LondonDashboard from '../london/page'; //this should be a different input after you have the right component for dashboard
import { generateMultipleFileSummaries, FileSummary } from '../../utils/londonDataLoader';
import { interactionLogger } from '../../lib/interactionLogger';
import { captureAndLogInteractions, getCapturedInteractionCount } from '../utils/dashboardConfig';
import { captureInsights, NarrativeSuggestion } from '../LLMs/suggestion_from_interaction';
import { getVisualizationRecommendation, VisualizationRecommendation, isDashboardRecommendation } from '../LLMs/visualizationRecommendation';
import { generateInsightTimeline, TimelineGroup, ChangeMetadata } from '../LLMs/insightTimeline';
import '../../styles/dataExplorer.css';
import '../../styles/narrativeLayer.css';
import '../../styles/dataExplorer.css';
import '../../styles/narrativeLayer.css';

interface UserSession {
  userId: string;
  participantId: string;
  firstName: string;
  lastName: string;
  username: string;
  sessionId?: string;
}

interface DatasetFile {
  id: string;
  name: string;
  path: string;
  description: string;
  category?: string;
}

export default function NarrativePage() {
  const router = useRouter();
  const narrativeSystemRef = useRef<PagedNarrativeSystemRef>(null);
  const reactFlowCanvasRef = useRef<ReactFlowCanvasRef>(null);
  
  // Add client-side only state to prevent hydration mismatches
  const [isClient, setIsClient] = useState(false);
  
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNarrativeLayer, setShowNarrativeLayer] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [shouldShowLondonDashboard, setShouldShowLondonDashboard] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<DatasetFile[]>([]);
  const [fileSummaries, setFileSummaries] = useState<FileSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string>('');
  const [isCapturingInsights, setIsCapturingInsights] = useState(false);
  const [hasPendingSuggestion, setHasPendingSuggestion] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [hasActiveInfoNodes, setHasActiveInfoNodes] = useState(false);

  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
    
    // Add debug helpers to window for testing
    if (typeof window !== 'undefined') {
      (window as any).narrativeDebug = {
        getCurrentTree: () => {
          if (narrativeSystemRef.current) {
            return narrativeSystemRef.current.debugGetCurrentTreeState?.();
          }
          return null;
        },
        createTestBranches: () => {
          if (narrativeSystemRef.current) {
            return narrativeSystemRef.current.debugCreateTestBranches?.();
          }
        },
        getCurrentPageId: () => {
          if (narrativeSystemRef.current) {
            return narrativeSystemRef.current.getCurrentPageId();
          }
        },
        getPageContent: (pageId?: string) => {
          if (narrativeSystemRef.current) {
            const id = pageId || narrativeSystemRef.current.getCurrentPageId();
            return narrativeSystemRef.current.getPageContent(id);
          }
        }
      };
    
    }
  }, []);

  // Define timeline group structure
  interface TimelineGroup {
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

  // Insight timeline state - per page tracking
  const [insightTimelinesByPage, setInsightTimelinesByPage] = useState<Record<string, { groups: TimelineGroup[] }>>({});
  
  // Track timeline loading state for each page
  const [timelineLoadingByPage, setTimelineLoadingByPage] = useState<Record<string, boolean>>({});
  
  // Track the most recently updated sentence for LLM calls
  const [recentlyUpdatedSentence, setRecentlyUpdatedSentence] = useState<{
    pageId: string;
    sentence: string;
    timestamp: number;
  } | null>(null);

  // Define simplified sentence node structure for linear narratives with branching
  interface SentenceNode {
    pageId: string; // page this node belongs to
    id: string; // unique identifier
    content: string; // the actual sentence text
    parent: string | null; // parent sentence id (previous sentence in linear flow)
    children: string[]; // array of child sentence ids (next sentences - usually 1, multiple when branching)
    activeChild: string | null; // currently active child node id (null if no child, or if multiple children with no active selection)
    createdTime: number; // system timestamp when first created
    revisedTime: number; // system timestamp when last modified
    editCount: number; // number of times this sentence has been edited
    isCompleted: boolean; // whether this sentence is marked as completed
    metadata?: {
      confidence?: number;
      analysisResult?: any;
      [key: string]: any;
    };
  }

  // OLD SENTENCE TREE MANAGEMENT - Now handled by PagedNarrativeSystem
  // Keeping for reference but commenting out to avoid conflicts
  
  /*
  // Track completed sentences with full branching structure
  const [sentenceNodes, setSentenceNodes] = useState<Map<string, SentenceNode>>(new Map());
  
  // Track the current "active path" through the sentence tree
  const [activePath, setActivePath] = useState<string[]>([]);
  
  // Legacy compatibility - computed from sentenceNodes
  const completedSentences = React.useMemo(() => {
    const sentences = activePath
      .map(id => sentenceNodes.get(id))
      .filter(node => node && node.isCompleted)
      .map(node => node!.content);
    
    
    return sentences;
  }, [sentenceNodes, activePath]);
  */

  /*
  // OLD: Automatically rebuild main editor content from activeChild path
  useEffect(() => {
    // Get the current active path following activeChild relationships (inline implementation)
    const getCurrentActivePath = (): string[] => {
      const path: string[] = [];
      
      // Find the root node (no parent)
      const rootNodes = Array.from(sentenceNodes.values()).filter(n => !n.parent);
      if (rootNodes.length === 0) return path;
      
      // Start from the first root node
      let currentNodeId: string | null = rootNodes[0].id;
      
      while (currentNodeId) {
        path.push(currentNodeId);
        const currentNode = sentenceNodes.get(currentNodeId);
        
        // Follow the activeChild path
        if (currentNode && currentNode.activeChild) {
          currentNodeId = currentNode.activeChild;
        } else {
          // No active child, end the path
          currentNodeId = null;
        }
      }
      
      return path;
    };
    
    const currentActivePath = getCurrentActivePath();
    
    // Only update if the path has changed or if we have content
    if (currentActivePath.length > 0) {
      console.log('🔄 Auto-updating editor content from activeChild path:', currentActivePath);
      
      const narrativeText = currentActivePath
        .map(nodeId => {
          const node = sentenceNodes.get(nodeId);
          let content = node ? node.content.trim() : '';
          if (content && !/[.!?]$/.test(content)) {
            content += '.';
          }
          return content;
        })
        .filter(content => content.length > 0)
        .join(' ');
      
      console.log('📝 Auto-rebuilt narrative:', narrativeText);
      
      // Update the main editor content if it has changed
      if (narrativeSystemRef.current && narrativeText) {
        // Only update if content is different to avoid infinite loops
        const currentEditorText = narrativeSystemRef.current.getPageContent(narrativeSystemRef.current.getCurrentPageId());
        if (currentEditorText.trim() !== narrativeText.trim()) {
          console.log('✏️ Updating main editor with activeChild path content');
          // For now, we'll need to implement updateContent in PagedNarrativeSystem
          // narrativeSystemRef.current.updateContent(narrativeText);
        }
      }
      
      // Sync the activePath state with the current active path
      if (JSON.stringify(activePath) !== JSON.stringify(currentActivePath)) {
        console.log('🛤️ Syncing activePath state');
        setActivePath(currentActivePath);
      }
    }
  }, [sentenceNodes, activePath]);
  */

  // Local interaction tracking
  const [dashboardInteractions, setDashboardInteractions] = useState<Array<{
    id: number;
    elementId: string;
    elementName: string;
    elementType: string;
    action: string;
    timestamp: number;
    userId: string;
    sessionId: string;
    metadata?: any;
  }>>([]);

  // Function to log dashboard interactions locally
  const logDashboardInteraction = (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
    const interaction = {
      id: dashboardInteractions.length + 1,
      elementId,
      elementName,
      elementType,
      action,
      timestamp: Date.now(),
      userId: userSession?.userId || 'unknown',
      sessionId: userSession?.sessionId || 'unknown',
      metadata
    };
    
    setDashboardInteractions(prev => [...prev, interaction]);
    
    // Update interaction count to enable the capture button
    setInteractionCount(prev => prev + 1);
  };
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const studyMode = process.env.NEXT_PUBLIC_STUDY_MODE === 'true';
        setIsStudyMode(studyMode);

        // Check if we should show London Dashboard based on environment variable
        const defaultDashboard = process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD;
        setShouldShowLondonDashboard(defaultDashboard === '1');

        if (studyMode) {
          const userStr = localStorage.getItem('narrativeUser');
          const token = localStorage.getItem('narrativeToken');
          
          if (userStr && token) {
            const user = JSON.parse(userStr);
            // console.log('🔧 Loaded user from localStorage:', user);
            
            // Ensure userId is set - fallback to username or create one
            if (!user.userId) {
              user.userId = user.username || `user_${user.participantId || Date.now()}`;
            }
            
            setUserSession(user);
          } else {
            router.push('/narrative-login');
            return;
          }
        } else {
          // Demo mode
          const demoUser = {
            userId: 'demo_user',
            participantId: 'DEMO',
            firstName: 'Demo',
            lastName: 'User',
            username: 'demo_user'
          };
          setUserSession(demoUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isStudyMode) {
          router.push('/narrative-login');
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Initialize interaction logger when userSession is available
  useEffect(() => {
    if (userSession) {
      
      // Ensure we have all required fields
      const userId = userSession.userId || userSession.username || `user_${userSession.participantId}`;
      const participantId = userSession.participantId;
      const sessionId = userSession.sessionId || `session_${userSession.participantId}_${Date.now()}`;
      
      
      interactionLogger.initialize({
        userId,
        participantId,
        sessionId
      }, isStudyMode);
    }
  }, [userSession, isStudyMode]);

  // Track info node status from ReactFlow canvas - optimized
  useEffect(() => {
    const checkInfoNodes = () => {
      if (reactFlowCanvasRef.current) {
        const hasActive = reactFlowCanvasRef.current.hasActiveInfoNode();
        setHasActiveInfoNodes(hasActive);
      }
    };

    // Check immediately and when dependencies change only
    checkInfoNodes();
  }, [showDashboard]); // Re-run when dashboard visibility changes

  // Handle analysis request
  const handleAnalysisRequest = async (prompt: string) => {
    
    setCurrentPrompt(prompt);
    setIsAnalyzing(true);
    
    // Log the generate dashboard interaction manually
    try {
      await interactionLogger.logDashboardGeneration(prompt);
    } catch (error) {
      console.error('❌ Failed to log dashboard generation:', error);
    }
    
    // Simulate analysis time (4 seconds)
    const analysisTime = 4000;
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowNarrativeLayer(true);
      
      // Show dashboard based on environment setting
      if (shouldShowLondonDashboard) {
        setShowDashboard(true);
      }
    }, analysisTime);
  };

  // Function to check if all sentences in the narrative are completed
  const checkAllSentencesCompleted = () => {
    if (!narrativeSystemRef.current) {
      return false;
    }
    
    // Get the DOM elements from the narrative editor
    const editorElement = document.querySelector('.narrative-editor-content');
    if (!editorElement) {
      return false;
    }
    
    // Get all paragraphs in the editor
    const paragraphs = editorElement.querySelectorAll('.tiptap-paragraph');
    
    if (paragraphs.length === 0) {
      return false;
    }
    
    let hasAnyContent = false;
    
    for (const paragraph of paragraphs) {
      // Get all completed sentence spans in this paragraph
      const completedSpans = paragraph.querySelectorAll('.completed-sentence[data-completed-sentence="true"]');
      
      // Get all text content in the paragraph
      const paragraphText = paragraph.textContent || '';
      
      
      // Skip empty paragraphs
      if (paragraphText.trim().length === 0) continue;
      
      hasAnyContent = true;
      
      // Get text content from all completed sentence spans
      let completedText = '';
      completedSpans.forEach(span => {
        completedText += span.textContent || '';
      });
      
      // Get text content that's NOT in completed sentence spans
      // We'll do this by cloning the paragraph and removing all completed sentence spans
      const paragraphClone = paragraph.cloneNode(true) as HTMLElement;
      const spansToRemove = paragraphClone.querySelectorAll('.completed-sentence[data-completed-sentence="true"]');
      spansToRemove.forEach(span => span.remove());
      
      const remainingText = paragraphClone.textContent || '';
      
      // Check if remaining text contains only punctuation and whitespace
      const nonPunctuationRemaining = remainingText.replace(/[.!?…\s]/g, '').trim();
      
      // If there's non-punctuation text outside completed sentences, not all sentences are completed
      if (nonPunctuationRemaining.length > 0) {
        return false;
      }
      
      // Also check if there are any completed sentences at all in this paragraph
      if (completedSpans.length === 0 && paragraphText.trim().length > 0) {
        return false;
      }
    }
    
    // Return true only if we found content and all text (except punctuation) is in completed sentences
    return hasAnyContent;
  };

  /*
  // OLD SENTENCE TREE HELPER FUNCTIONS - Now handled by PagedNarrativeSystem
  // Commenting out to avoid conflicts

  // Helper functions for managing sentence tree structure
  const generateSentenceId = () => {
    // Use a more stable ID generation that won't cause hydration mismatches
    if (typeof window !== 'undefined') {
      // Client-side: use timestamp + random
      return `sentence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
      // Server-side: use a predictable pattern to avoid hydration mismatch
      return `sentence_ssr_${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  const createSentenceNode = (
    content: string, 
    parent: string | null = null
  ): SentenceNode => {
    const now = typeof window !== 'undefined' ? Date.now() : 0; // Avoid Date.now() during SSR
    return {
      id: generateSentenceId(),
      content: content.trim(),
      parent,
      children: [],
      activeChild: null,
      createdTime: now,
      revisedTime: now,
      editCount: 0,
      isCompleted: false,
      metadata: {}
    };
  };

  const updateSentenceContent = (nodeId: string, newContent: string) => {
    // STRICT PROTECTION: Only allow content updates for nodes explicitly in edit mode
    if (!editableNodes.has(nodeId)) {
      console.warn(`🚫 BLOCKED: Cannot update content for node ${nodeId} - not in edit mode.`);
      return;
    }
    
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      const node = newMap.get(nodeId);
      if (node) {
        const updatedNode = {
          ...node,
          content: newContent.trim(),
          revisedTime: typeof window !== 'undefined' ? Date.now() : 0,
          editCount: node.editCount + 1
        };
        newMap.set(nodeId, updatedNode);
        console.log(`✅ Updated content for editable node ${nodeId}: "${newContent}"`); // Keep this for debugging
      }
      return newMap;
    });
  };

  const markSentenceCompleted = (nodeId: string, completed: boolean = true, metadata: any = {}) => {
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      const node = newMap.get(nodeId);
      if (node) {
        const updatedNode = {
          ...node,
          isCompleted: completed,
          revisedTime: typeof window !== 'undefined' ? Date.now() : 0,
          metadata: { ...node.metadata, ...metadata }
        };
        newMap.set(nodeId, updatedNode);
      }
      return newMap;
    });
  };

  const addSentenceRelationship = (parentId: string, childId: string) => {
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      const parent = newMap.get(parentId);
      const child = newMap.get(childId);
      
      if (parent && child) {
        // Update parent's children (add the new child)
        const updatedParent = {
          ...parent,
          children: [...parent.children, childId],
          // Set as active child: if parent has no active child, or only one child, this becomes active
          activeChild: parent.children.length === 0 ? childId : parent.activeChild
        };
        
        // Update child's parent
        const updatedChild = {
          ...child,
          parent: parentId
        };
        
        newMap.set(parentId, updatedParent);
        newMap.set(childId, updatedChild);
      }
      return newMap;
    });
  };

  // Helper function to get the active path from a specific node map
  const getActivePathFromCleanedMap = (nodeMap: Map<string, SentenceNode>): string[] => {
    const path: string[] = [];
    
    // Find the root node (no parent)
    const rootNodes = Array.from(nodeMap.values()).filter(n => !n.parent);
    if (rootNodes.length === 0) return path;
    
    // Start from the first root node
    let currentNodeId: string | null = rootNodes[0].id;
    
    while (currentNodeId) {
      path.push(currentNodeId);
      const currentNode = nodeMap.get(currentNodeId);
      
      // Follow the activeChild path
      if (currentNode && currentNode.activeChild) {
        currentNodeId = currentNode.activeChild;
      } else {
        // No active child, end the path
        currentNodeId = null;
      }
    }
    
    return path;
  };

  // Safety check function to remove duplicate sentence nodes with identical content
  const removeDuplicateSentenceNodes = (nodeMap: Map<string, SentenceNode>): Map<string, SentenceNode> => {
    const cleanedMap = new Map(nodeMap);
    const contentToNodes = new Map<string, string[]>(); // content -> array of node IDs
    const nodesToRemove = new Set<string>();
    
    // Group nodes by content
    for (const [nodeId, node] of cleanedMap.entries()) {
      const content = node.content.trim();
      if (!contentToNodes.has(content)) {
        contentToNodes.set(content, []);
      }
      contentToNodes.get(content)!.push(nodeId);
    }
    
    // Process each group of nodes with identical content
    for (const [content, nodeIds] of contentToNodes.entries()) {
      if (nodeIds.length > 1) {
        console.log(`🔍 Found ${nodeIds.length} nodes with identical content: "${content}"`);
        
        // Analyze each duplicate node to decide which to keep
        const nodeAnalysis = nodeIds.map(nodeId => {
          const node = cleanedMap.get(nodeId)!;
          const hasChildren = node.children.length > 0;
          const isActiveChild = Array.from(cleanedMap.values()).some(n => n.activeChild === nodeId);
          const isReferencedAsParent = Array.from(cleanedMap.values()).some(n => n.parent === nodeId);
          
          return {
            nodeId,
            node,
            hasChildren,
            isActiveChild,
            isReferencedAsParent,
            priority: (hasChildren ? 2 : 0) + (isActiveChild ? 4 : 0) + (isReferencedAsParent ? 1 : 0)
          };
        });
        
        // Sort by priority (higher priority nodes are more important to keep)
        nodeAnalysis.sort((a, b) => b.priority - a.priority);
        
        console.log(`📊 Node analysis for "${content}":`, nodeAnalysis.map(a => 
          `${a.nodeId}: priority=${a.priority} (children=${a.hasChildren}, activeChild=${a.isActiveChild}, referenced=${a.isReferencedAsParent})`
        ));
        
        // Keep the highest priority node, mark others for removal
        const nodeToKeep = nodeAnalysis[0];
        const nodesToRemoveFromGroup = nodeAnalysis.slice(1);
        
        console.log(`✅ Keeping node ${nodeToKeep.nodeId} with priority ${nodeToKeep.priority}`);
        
        nodesToRemoveFromGroup.forEach(analysis => {
          console.log(`❌ Marking node ${analysis.nodeId} for removal (priority ${analysis.priority})`);
          nodesToRemove.add(analysis.nodeId);
          
          // If the node being removed is someone's activeChild, update to point to the kept node
          for (const [parentId, parentNode] of cleanedMap.entries()) {
            if (parentNode.activeChild === analysis.nodeId) {
              const updatedParent = {
                ...parentNode,
                activeChild: nodeToKeep.nodeId,
                children: parentNode.children.map(childId => 
                  childId === analysis.nodeId ? nodeToKeep.nodeId : childId
                ).filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
              };
              cleanedMap.set(parentId, updatedParent);
              console.log(`🔄 Updated parent "${parentNode.content}" activeChild from ${analysis.nodeId} to ${nodeToKeep.nodeId}`);
            }
            
            // Update children arrays to point to the kept node
            if (parentNode.children.includes(analysis.nodeId)) {
              const updatedParent = {
                ...parentNode,
                children: parentNode.children.map(childId => 
                  childId === analysis.nodeId ? nodeToKeep.nodeId : childId
                ).filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
              };
              cleanedMap.set(parentId, updatedParent);
              console.log(`🔄 Updated parent "${parentNode.content}" children array to reference kept node`);
            }
          }
          
          // If the node being removed has children, transfer them to the kept node
          if (analysis.node.children.length > 0) {
            const keptNode = cleanedMap.get(nodeToKeep.nodeId)!;
            const mergedChildren = [...keptNode.children, ...analysis.node.children]
              .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
            
            const updatedKeptNode = {
              ...keptNode,
              children: mergedChildren,
              // If the kept node doesn't have an activeChild but the removed node does, inherit it
              activeChild: keptNode.activeChild || analysis.node.activeChild
            };
            cleanedMap.set(nodeToKeep.nodeId, updatedKeptNode);
            console.log(`🔄 Transferred ${analysis.node.children.length} children from removed node to kept node`);
            
            // Update parent references of transferred children
            analysis.node.children.forEach(childId => {
              const child = cleanedMap.get(childId);
              if (child) {
                const updatedChild = {
                  ...child,
                  parent: nodeToKeep.nodeId
                };
                cleanedMap.set(childId, updatedChild);
              }
            });
          }
        });
      }
    }
    
    // Remove marked nodes
    nodesToRemove.forEach(nodeId => {
      console.log(`🗑️ Removing duplicate node: ${nodeId}`);
      cleanedMap.delete(nodeId);
    });
    
    if (nodesToRemove.size > 0) {
      console.log(`🧹 Removed ${nodesToRemove.size} duplicate nodes from tree structure`);
    } else {
      console.log(`✅ No duplicate nodes found - tree structure is clean`);
    }
    
    return cleanedMap;
  };

  // Function to get completed sentences from DOM (simplified)
  const getCompletedSentencesFromDOM = (): { content: string; index: number }[] => {
    const editorElement = document.querySelector('.narrative-editor-content');
    if (!editorElement) return [];
    
    const completedSpans = editorElement.querySelectorAll('.completed-sentence[data-completed-sentence="true"]');
    const sentences: { content: string; index: number }[] = [];
    
    completedSpans.forEach((span, index) => {
      const text = span.textContent?.trim();
      if (text) {
        sentences.push({ 
          content: text, 
          index: index 
        });
      }
    });
    
    return sentences;
  };

  // Handle sentence end detection for narrative layer - now delegated to PagedNarrativeSystem
  // REMOVED: Duplicate unprotected handleSentenceEnd function
  // The protected version is defined later with branch operation protection

  // Utility functions for sentence tree analysis
  const getSentenceTreeStats = () => {
    const nodes = Array.from(sentenceNodes.values());
    const completedNodes = nodes.filter(n => n.isCompleted);
    const branchedNodes = nodes.filter(n => n.children.length > 1);
    const rootNodes = nodes.filter(n => !n.parent);
    const nodesWithActiveChild = nodes.filter(n => n.activeChild !== null);
    
    return {
      totalNodes: nodes.length,
      completedNodes: completedNodes.length,
      branchedNodes: branchedNodes.length,
      rootNodes: rootNodes.length,
      nodesWithActiveChild: nodesWithActiveChild.length,
      averageEditCount: nodes.reduce((sum, n) => sum + n.editCount, 0) / nodes.length || 0,
      activePath: activePath.length
    };
  };

  const exportSentenceTree = () => {
    const exportData = {
      nodes: Array.from(sentenceNodes.entries()).map(([nodeId, node]) => ({ nodeId, ...node })),
      activePath,
      stats: getSentenceTreeStats(),
      exportedAt: typeof window !== 'undefined' ? Date.now() : 0
    };
    
    console.log('🌳 Sentence Tree Export:', JSON.stringify(exportData, null, 2));
    return exportData;
  };

  const findSentencePath = (targetId: string): string[] => {
    const path: string[] = [];
    let currentId: string | null = targetId;
    
    while (currentId) {
      path.unshift(currentId);
      const node = sentenceNodes.get(currentId);
      currentId = node?.parent || null;
    }
    
    return path;
  };

  const getSentenceChildren = (nodeId: string, deep: boolean = false): SentenceNode[] => {
    const node = sentenceNodes.get(nodeId);
    if (!node) return [];
    
    let children = node.children.map(id => sentenceNodes.get(id)).filter(Boolean) as SentenceNode[];
    
    if (deep) {
      for (const child of [...children]) {
        children.push(...getSentenceChildren(child.id, true));
      }
    }
    
    return children;
  };

  // Helper function to get the full content path following activeChild from a specific node
  const getFullPathContentFromNode = (startNodeId: string): string => {
    const contentParts: string[] = [];
    let currentNodeId: string | null = startNodeId;
    
    while (currentNodeId) {
      const currentNode = sentenceNodes.get(currentNodeId);
      if (currentNode) {
        contentParts.push(currentNode.content);
        // Follow the activeChild path
        currentNodeId = currentNode.activeChild;
      } else {
        break;
      }
    }
    
    return contentParts.join(' ');
  };

  // Helper function to get the active path following activeChild relationships
  const getActivePathFromRoot = (): string[] => {
    const path: string[] = [];
    
    // Find the root node (no parent)
    const rootNodes = Array.from(sentenceNodes.values()).filter(n => !n.parent);
    if (rootNodes.length === 0) return path;
    
    // Start from the first root node
    let currentNodeId: string | null = rootNodes[0].id;
    
    while (currentNodeId) {
      path.push(currentNodeId);
      const currentNode = sentenceNodes.get(currentNodeId);
      
      // Follow the activeChild path
      if (currentNode && currentNode.activeChild) {
        currentNodeId = currentNode.activeChild;
      } else {
        // No active child, end the path
        currentNodeId = null;
      }
    }
    
    return path;
  };

  // Helper function to find node ID by content
  const findNodeIdByContent = useCallback((content: string): string | null => {
    console.log(`🔍 Searching for node with content: "${content}"`);
    console.log(`🔍 Current sentence nodes:`, Array.from(sentenceNodes.entries()).map(([id, node]) => ({
      id: id,
      content: node.content,
      isMatch: node.content === content
    })));
    
    for (const [nodeId, node] of sentenceNodes.entries()) {
      if (node.content === content) {
        console.log(`✅ Found matching node: ${nodeId} with content: "${node.content}"`);
        return nodeId;
      }
    }
    console.error(`❌ No node found with exact content: "${content}"`);
    return null;
  }, [sentenceNodes]);

  // Helper function to validate tree structure consistency
  const validateTreeStructure = (): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    const nodes = Array.from(sentenceNodes.values());
    
    for (const node of nodes) {
      // Check if activeChild exists in children array
      if (node.activeChild && !node.children.includes(node.activeChild)) {
        issues.push(`Node "${node.content}" has activeChild "${node.activeChild}" not in children array`);
      }
      
      // Check if activeChild is null when there are children
      if (node.children.length > 0 && !node.activeChild) {
        issues.push(`Node "${node.content}" has children but no activeChild`);
      }
      
      // Check for orphaned nodes
      if (node.parent) {
        const parentNode = sentenceNodes.get(node.parent);
        if (!parentNode) {
          issues.push(`Node "${node.content}" has invalid parent reference "${node.parent}"`);
        } else if (!parentNode.children.includes(node.id)) {
          issues.push(`Node "${node.content}" parent "${parentNode.content}" doesn't include it in children`);
        }
      }
    }
    
    return { isValid: issues.length === 0, issues };
  };

  // Helper function to find the correct branch ID that should be edited
  const getCurrentEditableBranchId = (sentenceContent: string): string | null => {
    // Find the node that has this content and is part of the current active path
    for (const nodeId of activePath) {
      const node = sentenceNodes.get(nodeId);
      if (node && node.content === sentenceContent) {
        return nodeId;
      }
    }
    
    // If not found in active path, look for any node with this content
    for (const [nodeId, node] of sentenceNodes.entries()) {
      if (node.content === sentenceContent) {
        // console.warn(`⚠️ Node with content "${sentenceContent}" found but not in active path. This might cause content update issues.`);
        return nodeId;
      }
    }
    
    console.error(`❌ No node found with content: "${sentenceContent}"`);
    return null;
  };

  // Helper function to get branches for a specific sentence (using activeChild system)
  const getBranchesForSentence = useCallback((sentenceContent: string): Array<{
    id: string;
    content: string;
    fullPathContent: string; // Full content following this branch
    type: 'branch' | 'original_continuation';
  }> => {
    // Find the sentence node by content
    let targetSentenceId: string | null = null;
    for (const [id, node] of sentenceNodes.entries()) {
      if (node.content === sentenceContent) {
        targetSentenceId = id;
        break;
      }
    }
    
    if (!targetSentenceId) {
      console.log(`🔍 No sentence node found for: "${sentenceContent}"`);
      return [];
    }
    
    const targetNode = sentenceNodes.get(targetSentenceId);
    if (!targetNode || targetNode.children.length === 0) {
      console.log(`🔍 No branches found for sentence: "${sentenceContent}"`);
      return [];
    }
    
    // Get all children (branches/continuations)
    const branches: Array<{
      id: string;
      content: string;
      fullPathContent: string;
      type: 'branch' | 'original_continuation';
    }> = [];
    
    // The activeChild is the current "active path" - all others are alternatives
    const activeChildId = targetNode.activeChild;
    
    targetNode.children.forEach(childId => {
      const childNode = sentenceNodes.get(childId);
      if (childNode) {
        // Use activeChild to determine which is the active path vs alternatives
        const isActivePath = childId === activeChildId;
        
        // Get the full content path following this branch
        const fullPathContent = getFullPathContentFromNode(childId);
        
        branches.push({
          id: childId,
          content: childNode.content,
          fullPathContent: fullPathContent,
          type: isActivePath ? 'original_continuation' : 'branch'
        });
      }
    });
    
    // Sort so active path comes first, then alternatives
    branches.sort((a, b) => {
      if (a.type === 'original_continuation' && b.type === 'branch') return -1;
      if (a.type === 'branch' && b.type === 'original_continuation') return 1;
      return 0;
    });
    
    // console.log(`🌿 Found ${branches.length} branches for "${sentenceContent}":`, 
    //   branches.map(b => `${b.type === 'original_continuation' ? 'Active' : 'Alt'}: "${b.content}" (Full: "${b.fullPathContent}")`));
    
    return branches;
  }, [sentenceNodes, getFullPathContentFromNode]);
  
  // Helper function to insert a new node between existing nodes
  const insertNodeAfter = useCallback((afterSentenceContent: string, newSentenceContent: string) => {
    console.log(`🔗 Inserting new node "${newSentenceContent}" after "${afterSentenceContent}"`);
    
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      // Find the node after which to insert (by content)
      let afterNode: SentenceNode | null = null;
      let afterNodeId: string | null = null;
      
      for (const [id, node] of newMap.entries()) {
        if (node.content === afterSentenceContent) {
          afterNode = node;
          afterNodeId = id;
          break;
        }
      }
      
      if (!afterNode || !afterNodeId) {
        console.error(`❌ Cannot find node with content: "${afterSentenceContent}"`);
        return prev;
      }
      
      // Create the new node
      const newNodeId = `sentence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNode: SentenceNode = {
        id: newNodeId,
        content: newSentenceContent,
        parent: afterNodeId, // The new node's parent is the "after" node
        children: [...afterNode.children], // The new node inherits all children from the "after" node
        activeChild: afterNode.activeChild, // The new node inherits the active child from the "after" node
        createdTime: Date.now(),
        revisedTime: Date.now(),
        editCount: 0,
        isCompleted: true,
        metadata: {}
      };
      
      // Add the new node to the map
      newMap.set(newNodeId, newNode);
      
      // Update the "after" node to point to the new node as its only child
      const updatedAfterNode = {
        ...afterNode,
        children: [newNodeId], // The "after" node now only has the new node as a child
        activeChild: newNodeId, // The new node becomes the active child
        revisedTime: Date.now()
      };
      newMap.set(afterNodeId, updatedAfterNode);
      
      // Update all former children of the "after" node to point to the new node as their parent
      for (const childId of afterNode.children) {
        const childNode = newMap.get(childId);
        if (childNode) {
          const updatedChildNode = {
            ...childNode,
            parent: newNodeId, // Former children now have the new node as their parent
            revisedTime: Date.now()
          };
          newMap.set(childId, updatedChildNode);
        }
      }
      
      console.log(`✅ Inserted new node "${newSentenceContent}" between "${afterSentenceContent}" and its children`);
      console.log(`🔗 Tree structure: ${afterSentenceContent} -> ${newSentenceContent} -> [${afterNode.children.map(id => {
        const child = newMap.get(id);
        return child ? child.content : id;
      }).join(', ')}]`);
      
      return newMap;
    });
  }, []);

  // Helper function to delete a sentence and reconnect the tree structure
  const deleteSentenceFromTree = useCallback((sentenceIdOrContent: string) => {
    console.log(`🗑️ Starting sentence deletion for: "${sentenceIdOrContent}"`);
    
    // First, find the node to check if it has children
    let nodeToDelete: SentenceNode | null = null;
    if (sentenceNodes.has(sentenceIdOrContent)) {
      nodeToDelete = sentenceNodes.get(sentenceIdOrContent)!;
    } else {
      // Search by content
      for (const [id, node] of sentenceNodes.entries()) {
        if (node.content === sentenceIdOrContent) {
          nodeToDelete = node;
          break;
        }
      }
    }
    
    const hasChildren = nodeToDelete?.children && nodeToDelete.children.length > 0;
    console.log(`🔥 DEBUG: Node "${nodeToDelete?.content}" has children:`, hasChildren);
    
    if (hasChildren) {
      console.log('🔮 Sentence has children - allowing LLM calls for structural change');
      // Don't start protection for nodes with children
    } else {
      console.log('🍃 Sentence is leaf node - preventing LLM calls');
      // Start sentence deletion protection to prevent LLM calls (only for leaf nodes)
      startBranchOperation('sentence_delete');
    }
    
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      // Find the node to delete (by ID or content)
      let nodeToDelete: SentenceNode | null = null;
      let nodeIdToDelete: string | null = null;
      
      // First try to find by ID
      if (newMap.has(sentenceIdOrContent)) {
        nodeToDelete = newMap.get(sentenceIdOrContent)!;
        nodeIdToDelete = sentenceIdOrContent;
      } else {
        // If not found by ID, search by content
        for (const [id, node] of newMap.entries()) {
          if (node.content === sentenceIdOrContent) {
            nodeToDelete = node;
            nodeIdToDelete = id;
            break;
          }
        }
      }
      
      if (!nodeToDelete || !nodeIdToDelete) {
        return prev;
      }
      
      
      const parentId = nodeToDelete.parent;
      const childrenIds = [...nodeToDelete.children];
      
      // Step 1: Update parent node (if exists)
      if (parentId) {
        const parentNode = newMap.get(parentId);
        if (parentNode) {
          console.log(`👨‍👦 Updating parent "${parentNode.content}"`);
          
          // Remove the deleted node from parent's children
          const updatedParentChildren = parentNode.children.filter(childId => childId !== nodeIdToDelete);
          
          // Add the deleted node's children to the parent's children
          updatedParentChildren.push(...childrenIds);
          
          // Determine new activeChild for parent
          let newActiveChild: string | null = null;
          
          if (childrenIds.length > 0) {
            // If the deleted node was the activeChild, set first child as new activeChild
            if (parentNode.activeChild === nodeIdToDelete) {
              newActiveChild = childrenIds[0];
              
            } else {
              // Keep the existing activeChild if it wasn't the deleted node
              newActiveChild = parentNode.activeChild;
            }
          } else {
            // No children to inherit, clear activeChild if it was the deleted node
            newActiveChild = parentNode.activeChild === nodeIdToDelete ? null : parentNode.activeChild;
          }
          
          const updatedParent = {
            ...parentNode,
            children: updatedParentChildren,
            activeChild: newActiveChild,
            revisedTime: typeof window !== 'undefined' ? Date.now() : 0
          };
          
          newMap.set(parentId, updatedParent);
          
        }
      } else {

      }
      
      // Step 2: Update children nodes to point to new parent
      for (const childId of childrenIds) {
        const childNode = newMap.get(childId);
        if (childNode) {
          const updatedChild = {
            ...childNode,
            parent: parentId, // Children inherit the deleted node's parent (could be null for root)
            revisedTime: typeof window !== 'undefined' ? Date.now() : 0
          };
          newMap.set(childId, updatedChild);
        }
      }
      
      // Step 3: Clean up any references to the deleted node in other nodes
      for (const [id, node] of newMap.entries()) {
        if (id === nodeIdToDelete) continue; // Skip the node we're deleting
        
        let needsUpdate = false;
        let updatedNode = { ...node };
        
        // Remove from children array if present
        if (node.children.includes(nodeIdToDelete)) {
          updatedNode.children = node.children.filter(childId => childId !== nodeIdToDelete);
          needsUpdate = true;
        }
        
        // Clear activeChild if it points to deleted node
        if (node.activeChild === nodeIdToDelete) {
          updatedNode.activeChild = updatedNode.children.length > 0 ? updatedNode.children[0] : null;
          needsUpdate = true;
          console.log(`🧹 Cleared activeChild reference in "${node.content}"`);
        }
        
        if (needsUpdate) {
          updatedNode.revisedTime = typeof window !== 'undefined' ? Date.now() : 0;
          newMap.set(id, updatedNode);
        }
      }
      
      // Step 4: Remove the deleted node from the map
      newMap.delete(nodeIdToDelete);
      console.log(`🗑️ Removed node "${nodeToDelete.content}" from tree`);
      
      // Step 5: Update active path if it included the deleted node
      const currentActivePath = getActivePathFromRoot();
      if (currentActivePath.includes(nodeIdToDelete)) {
      }
      
      return newMap;
    });
    
    // The active path will be automatically recalculated by the useEffect that watches sentenceNodes
    console.log(`🔄 Tree structure updated after deletion`);
    
    // Only end branch operation if we started it (for leaf nodes)
    if (!hasChildren) {
      // End sentence deletion protection after a short delay (only for leaf nodes)
      endBranchOperation('sentence_delete', 1500);
    }
  }, [sentenceNodes, getActivePathFromRoot, startBranchOperation, endBranchOperation]);

  // Helper function to delete an entire branch and all its descendants
  const deleteBranchFromTree = useCallback((branchId: string) => {
    console.log(`🌿🗑️ Starting branch deletion for: "${branchId}"`);
    
    // Start branch deletion protection to prevent LLM calls
    startBranchOperation('tree_branch_delete');
    
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      // Find the branch node to delete
      const branchToDelete = newMap.get(branchId);
      if (!branchToDelete) {
        console.error(`❌ Branch not found: ${branchId}`);
        return prev;
      }
      
      // Helper function to collect all descendants recursively
      const collectDescendants = (nodeId: string): string[] => {
        const node = newMap.get(nodeId);
        if (!node) return [];
        
        let descendants: string[] = [nodeId];
        for (const childId of node.children) {
          descendants.push(...collectDescendants(childId));
        }
        return descendants;
      };
      
      // Collect all nodes to delete (branch + all descendants)
      const nodesToDelete = collectDescendants(branchId);
      console.log(`🗑️ Deleting ${nodesToDelete.length} nodes:`, nodesToDelete.map(id => {
        const node = newMap.get(id);
        return `${id}: "${node?.content}"`;
      }));
      
      // Step 1: Update parent node to remove this branch
      const parentId = branchToDelete.parent;
      if (parentId) {
        const parentNode = newMap.get(parentId);
        if (parentNode) {
          console.log(`👨‍👦 Updating parent "${parentNode.content}"`);
          
          // Remove the branch from parent's children
          const updatedParentChildren = parentNode.children.filter(childId => childId !== branchId);
          
          // Determine new activeChild for parent
          let newActiveChild: string | null = null;
          if (parentNode.activeChild === branchId) {
            // If the deleted branch was active, switch to first remaining child
            newActiveChild = updatedParentChildren.length > 0 ? updatedParentChildren[0] : null;
          } else {
            // Keep the existing activeChild if it wasn't the deleted branch
            newActiveChild = parentNode.activeChild;
          }
          
          const updatedParent = {
            ...parentNode,
            children: updatedParentChildren,
            activeChild: newActiveChild,
            revisedTime: typeof window !== 'undefined' ? Date.now() : 0
          };
          
          newMap.set(parentId, updatedParent);
        }
      }
      
      // Step 2: Clean up any references to deleted nodes in remaining nodes
      for (const [id, node] of newMap.entries()) {
        if (nodesToDelete.includes(id)) continue; // Skip nodes we're deleting
        
        let needsUpdate = false;
        let updatedNode = { ...node };
        
        // Remove deleted nodes from children array
        const originalChildrenLength = node.children.length;
        updatedNode.children = node.children.filter(childId => !nodesToDelete.includes(childId));
        if (updatedNode.children.length !== originalChildrenLength) {
          needsUpdate = true;
        }
        
        // Clear activeChild if it points to a deleted node
        if (node.activeChild && nodesToDelete.includes(node.activeChild)) {
          updatedNode.activeChild = updatedNode.children.length > 0 ? updatedNode.children[0] : null;
          needsUpdate = true;
          console.log(`🧹 Cleared activeChild reference in "${node.content}"`);
        }
        
        if (needsUpdate) {
          updatedNode.revisedTime = typeof window !== 'undefined' ? Date.now() : 0;
          newMap.set(id, updatedNode);
        }
      }
      
      // Step 3: Remove all nodes in the branch from the map
      for (const nodeId of nodesToDelete) {
        const deletedNode = newMap.get(nodeId);
        if (deletedNode) {
          console.log(`🗑️ Removed branch node "${deletedNode.content}" from tree`);
          newMap.delete(nodeId);
        }
      }
      
      console.log(`🌿🔄 Branch deletion completed. Deleted ${nodesToDelete.length} nodes.`);
      return newMap;
    });
    
    console.log(`🔄 Tree structure updated after branch deletion`);
    
    // End branch deletion protection after a short delay
    endBranchOperation('tree_branch_delete', 1500);
  }, [sentenceNodes, startBranchOperation, endBranchOperation]);

  // Helper function to switch to a specific branch
  const handleSwitchToBranch = useCallback((branchId: string) => {
    const branchNode = sentenceNodes.get(branchId);
    if (!branchNode) {
      // console.error('❌ Cannot switch to branch: node not found');
      return;
    }
    
    // console.log(`🎯 SWITCHING TO BRANCH: ${branchId}`);
    // console.log(`📊 Branch content: "${branchNode.content}"`);
    
    // Find the path from root to this branch
    const pathToBranch = findSentencePath(branchId);
    
    // Continue the path by following activeChild relationships from the branch node
    const fullPath = [...pathToBranch];
    let currentNodeId = branchId;
    
    while (currentNodeId) {
      const currentNode = sentenceNodes.get(currentNodeId);
      if (currentNode && currentNode.activeChild) {
        // Only add if not already in path (avoid infinite loops)
        if (!fullPath.includes(currentNode.activeChild)) {
          fullPath.push(currentNode.activeChild);
          currentNodeId = currentNode.activeChild;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    console.log(`🛤️ New active path:`, fullPath.map(id => {
      const node = sentenceNodes.get(id);
      return `${id}: "${node?.content}"`;
    }));
    
    setActivePath(fullPath);
    
    console.log(`🔄 Switching to branch ${branchId}, updating main editor`);
    
    // Update active child relationships along the path
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      // Update activeChild for each parent in the path
      for (let i = 0; i < fullPath.length - 1; i++) {
        const currentNodeId = fullPath[i];
        const nextNodeId = fullPath[i + 1];
        const currentNode = newMap.get(currentNodeId);
        
        if (currentNode && currentNode.children.includes(nextNodeId)) {
          const updatedNode = {
            ...currentNode,
            activeChild: nextNodeId
          };
          newMap.set(currentNodeId, updatedNode);
          console.log(`🎯 Set activeChild for "${currentNode.content}" to "${newMap.get(nextNodeId)?.content}"`);
        }
      }
      
      return newMap;
    });
    
    // Reconstruct the narrative from the new active path
    setTimeout(() => {
      console.log(`🔧 Reconstructing narrative from path:`, fullPath);
      
      const narrativeText = fullPath
        .map(nodeId => {
          const node = sentenceNodes.get(nodeId);
          let content = node ? node.content.trim() : '';
          console.log(`📝 Processing node ${nodeId}: "${content}"`);
          // Ensure each sentence ends with proper punctuation
          if (content && !/[.!?]$/.test(content)) {
            content += '.';
          }
          return content;
        })
        .filter(content => content.length > 0)
        .join(' ');
      
      console.log(`📋 Final narrative text: "${narrativeText}"`);
      
      // Update the main editor content
      if (narrativeSystemRef.current) {
        console.log(`📝 Updating main editor with branch narrative: "${narrativeText}"`);
        // narrativeSystemRef.current.updateContent(narrativeText);
      } else {
        console.warn('⚠️ narrativeSystemRef.current is null, cannot update editor content');
      }
    }, 100);
    
  }, [sentenceNodes, findSentencePath]);
  
  // Helper function to update branch content
  // Track recently created nodes to prevent immediate content updates
  const [recentlyCreatedNodes, setRecentlyCreatedNodes] = useState<Set<string>>(new Set());
  // Track if we're currently creating a branch to prevent unwanted content updates
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  // Track nodes that are currently in edit mode (user double-clicked)
  const [editableNodes, setEditableNodes] = useState<Set<string>>(new Set());

  const handleUpdateBranchContent = useCallback((branchId: string, newContent: string) => {
    // console.log(`📝 🎯 ATTEMPTING TO UPDATE BRANCH CONTENT:`);
    // console.log(`📝 Branch ID: ${branchId}`);
    // console.log(`📝 New Content: "${newContent}"`);
    // console.log(`📝 EditableNodes state:`, Array.from(editableNodes));
    // console.log(`📝 IsCreatingBranch:`, isCreatingBranch);
    // console.log(`📝 RecentlyCreatedNodes:`, Array.from(recentlyCreatedNodes));
    
    // STRICT PROTECTION: Only allow content updates for nodes explicitly in edit mode
    if (!editableNodes.has(branchId)) {
      // console.warn(`🚫 BLOCKED: Cannot update content for node ${branchId} - not in edit mode. Content updates are only allowed when user explicitly enters edit mode.`);
      // console.warn(`🚫 Available editable nodes:`, Array.from(editableNodes));
      return;
    }
    
    // Prevent content updates during branch creation
    if (isCreatingBranch) {
      console.warn(`⚠️ Ignoring content update during branch creation for ${branchId}`);
      return;
    }
    
    // Prevent immediate content updates to recently created nodes
    if (recentlyCreatedNodes.has(branchId)) {
      // console.warn(`⚠️ Ignoring content update to recently created node ${branchId}. Content should be set during creation.`);
      return;
    }
    
    // First, validate that this branch actually exists and should be updated
    const branchNode = sentenceNodes.get(branchId);
    if (!branchNode) {
      console.error(`❌ Cannot update branch: node ${branchId} not found`);
      console.error(`❌ Available nodes:`, Array.from(sentenceNodes.keys()));
      return;
    }
    
    // Check if the content is actually different
    if (branchNode.content === newContent) {
      console.log(`📝 Content unchanged for ${branchId}, skipping update`);
      return;
    }
    
    // console.log(`📝 ✅ AUTHORIZED CONTENT UPDATE:`);
    // console.log(`📝 Node ${branchId}: "${branchNode.content}" → "${newContent}"`);
    
    // Update the sentence node content
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      const existingNode = newMap.get(branchId);
      
      if (existingNode) {
        const updatedNode = {
          ...existingNode,
          content: newContent,
          revisedTime: typeof window !== 'undefined' ? Date.now() : 0,
          editCount: existingNode.editCount + 1
        };
        newMap.set(branchId, updatedNode);
        console.log(`✅ ✅ SUCCESSFULLY UPDATED NODE ${branchId}: "${newContent}"`);
        console.log(`✅ Edit count incremented to: ${updatedNode.editCount}`);
        
        // If this node is part of the current active path, update the main editor
        if (activePath.includes(branchId)) {
          console.log(`🔄 Updated node is in active path, refreshing main editor`);
          
          // Reconstruct the narrative from the current active path with updated content
          setTimeout(() => {
            const narrativeText = activePath
              .map(nodeId => {
                const node = newMap.get(nodeId);
                let content = node ? node.content.trim() : '';
                // Ensure each sentence ends with proper punctuation
                if (content && !/[.!?]$/.test(content)) {
                  content += '.';
                }
                return content;
              })
              .filter(content => content.length > 0)
              .join(' ');
            
            // Update the main editor content
            if (narrativeSystemRef.current) {
              console.log(`📝 Updating main editor with updated narrative: "${narrativeText}"`);
              // narrativeSystemRef.current.updateContent(narrativeText);
            }
          }, 100);
        } else {
          console.log(`📝 Updated node ${branchId} is not in active path, main editor unchanged`);
          console.log(`📝 Active path:`, activePath);
        }
      } else {
        console.error(`❌ Cannot update branch: node ${branchId} not found in map`);
      }
      
      return newMap;
    });
  }, [sentenceNodes, activePath, isCreatingBranch, recentlyCreatedNodes.size, editableNodes.size]);
  
  // Functions to manage edit mode for nodes
  const enterEditMode = useCallback((nodeId: string) => {
    setEditableNodes(prev => new Set([...prev, nodeId]));
  }, []);

  const exitEditMode = useCallback((nodeId: string) => {
    console.log(`📝 Exiting edit mode for node ${nodeId}`);
    setEditableNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
  }, []);

  const exitAllEditMode = useCallback(() => {
    console.log(`📝 Exiting edit mode for all nodes`);
    setEditableNodes(new Set());
  }, []);

  // Handlers for NarrativeLayer edit mode integration
  const handleEnterEditMode = useCallback((content: string) => {
    console.log(`📝 NarrativeLayer requesting edit mode for content: "${content}"`);
    
    // Find the node with this content in the active path
    let nodeId: string | null = null;
    for (const pathNodeId of activePath) {
      const node = sentenceNodes.get(pathNodeId);
      if (node && node.content === content) {
        nodeId = pathNodeId;
        break;
      }
    }
    
    if (nodeId) {
      console.log(`📝 Found node ${nodeId} for edit mode`);
      enterEditMode(nodeId);
    } else {
      console.warn(`⚠️ Could not find node for content: "${content}"`);
    }
  }, [activePath, sentenceNodes, enterEditMode]);

  const handleExitEditMode = useCallback((content: string) => {
    console.log(`📝 NarrativeLayer exiting edit mode for content: "${content}"`);
    
    // Find the node with this content in the active path
    let nodeId: string | null = null;
    for (const pathNodeId of activePath) {
      const node = sentenceNodes.get(pathNodeId);
      if (node && node.content === content) {
        nodeId = pathNodeId;
        break;
      }
    }
    
    if (nodeId) {
      console.log(`📝 Exiting edit mode for node ${nodeId}`);
      exitEditMode(nodeId);
    } else {
      console.warn(`⚠️ Could not find node for content: "${content}"`);
    }
  }, [activePath, sentenceNodes, exitEditMode]);

  // Helper function to create a new branch
  const handleCreateBranch = useCallback((fromSentenceContent: string, branchContent: string) => {
    console.log(`🌿 Creating branch from: "${fromSentenceContent}" with content: "${branchContent}"`);
    
    // Set flag to prevent content updates during branch creation
    setIsCreatingBranch(true);
    
    // Find the parent sentence node
    let parentNodeId: string | null = null;
    for (const [id, node] of sentenceNodes.entries()) {
      if (node.content === fromSentenceContent) {
        parentNodeId = id;
        break;
      }
    }
    
    if (!parentNodeId) {
      console.error('❌ Cannot create branch: parent sentence not found');
      setIsCreatingBranch(false);
      return;
    }
    
    // Create new branch node with meaningful default content
    const defaultContent = branchContent || `Alternative continuation from: "${fromSentenceContent.substring(0, 30)}..."`;
    const branchNode = createSentenceNode(defaultContent, parentNodeId);
    
    console.log(`🌿 Creating new branch node with ID: ${branchNode.id} and content: "${defaultContent}"`);
    
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      // Add the new branch node
      newMap.set(branchNode.id, { ...branchNode, isCompleted: true });
      console.log(`✅ Added new branch node ${branchNode.id} to tree`);
      
      // Track this as a recently created node
      setRecentlyCreatedNodes(prev => new Set([...prev, branchNode.id]));
      
      // Clear the recently created flag after a short delay
      setTimeout(() => {
        setRecentlyCreatedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(branchNode.id);
          return newSet;
        });
      }, 500);
      
      // Update parent to include this branch as a child
      const parentNode = newMap.get(parentNodeId!);
      if (parentNode) {
        const oldActiveChild = parentNode.activeChild;
        const updatedParent = {
          ...parentNode,
          children: [...parentNode.children, branchNode.id],
          // Always set the new branch as the active child when creating a branch
          activeChild: branchNode.id
        };
        newMap.set(parentNodeId!, updatedParent);
        console.log(`🎯 Updated parent "${parentNode.content}" activeChild from ${oldActiveChild} to ${branchNode.id} (new branch)`);
      }
      
      // Find the path to the new branch using the updated map
      const findPathInMap = (targetId: string, nodeMap: Map<string, SentenceNode>): string[] => {
        const path: string[] = [];
        let currentId: string | null = targetId;
        
        while (currentId) {
          path.unshift(currentId);
          const node = nodeMap.get(currentId);
          currentId = node?.parent || null;
        }
        
        return path;
      };
      
      const newPath = findPathInMap(branchNode.id, newMap);
      
      // Update activeChild for each parent in the new path to ensure consistency
      for (let i = 0; i < newPath.length - 1; i++) {
        const currentNodeId = newPath[i];
        const nextNodeId = newPath[i + 1];
        const currentNode = newMap.get(currentNodeId);
        
        if (currentNode && currentNode.children.includes(nextNodeId)) {
          const updatedNode = {
            ...currentNode,
            activeChild: nextNodeId
          };
          newMap.set(currentNodeId, updatedNode);
          console.log(`🎯 Set activeChild for "${currentNode.content}" to "${newMap.get(nextNodeId)?.content}" in new branch path`);
        }
      }
      
      // Update active path and main editor content
      setTimeout(() => {
        setActivePath(newPath);
        
        // Update main editor content with the new path
        const narrativeText = newPath
          .map(nodeId => {
            const node = newMap.get(nodeId);
            let content = node ? node.content.trim() : '';
            // Ensure each sentence ends with proper punctuation
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        if (narrativeSystemRef.current) {
          console.log(`📝 Updating main editor with new branch narrative: "${narrativeText}"`);
          // narrativeSystemRef.current.updateContent(narrativeText);
        }
        
        // Clear the flag after branch creation is complete
        setIsCreatingBranch(false);
      }, 100);
      
      return newMap;
    });
    
    console.log(`✅ Created branch "${branchContent}" from sentence "${fromSentenceContent}"`);
  }, [sentenceNodes, createSentenceNode]);

  // Handle content changes in the editor - DISABLED to prevent unwanted updates
  const handleContentChange = useCallback((oldContent: string, newContent: string) => {
    if (oldContent === newContent) return;
    
    console.log(`🔄 MAIN COMPONENT Content synchronization: "${oldContent}" → "${newContent}"`);
    
    // CRITICAL FIX: Update sentence node content to keep tree structure in sync
    // When user types in the editor, we need to update the corresponding tree node
    
    // Find the sentence node that contains the old content and update it
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      console.log(`🔍 MAIN COMPONENT: Searching through ${newMap.size} nodes for content match`);
      
      // Find the node with matching content (clean both for comparison)
      const cleanOldContent = oldContent.trim().replace(/[.!?]+$/, '');
      const cleanNewContent = newContent.trim();
      
      console.log(`🔍 MAIN COMPONENT: Looking for clean content: "${cleanOldContent}"`);
      
      // Log all current node contents for debugging
      for (const [nodeId, node] of newMap) {
        const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
        console.log(`🔍 MAIN COMPONENT: Node ${nodeId}: "${cleanNodeContent}" vs "${cleanOldContent}"`);
      }
      
      let updatedNode = null;
      for (const [nodeId, node] of newMap) {
        const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
        if (cleanNodeContent === cleanOldContent) {
          console.log(`🎯 MAIN COMPONENT: Found matching node ${nodeId}: "${node.content}" → "${cleanNewContent}"`);
          updatedNode = { ...node, content: cleanNewContent };
          newMap.set(nodeId, updatedNode);
          break;
        }
      }
      
      if (updatedNode) {
        console.log(`✅ MAIN COMPONENT: Tree structure synchronized for node ${updatedNode.id}`);
      } else {
        console.log(`⚠️  MAIN COMPONENT: No matching node found for content: "${cleanOldContent}"`);
      }
      
      return newMap;
    });
    
    // CRITICAL: Also update PagedNarrativeSystem's internal tree structure
    if (narrativeSystemRef.current) {
      const currentPageId = narrativeSystemRef.current.getCurrentPageId();
      console.log(`🔄 MAIN COMPONENT: Calling PagedNarrativeSystem.updateSentenceContent for page ${currentPageId}`);
      const success = narrativeSystemRef.current.updateSentenceContent(currentPageId, oldContent, newContent);
      if (success) {
        console.log(`✅ MAIN COMPONENT: PagedNarrativeSystem tree structure synchronized`);
      } else {
        console.log(`⚠️  MAIN COMPONENT: Failed to update PagedNarrativeSystem tree structure`);
      }
    }
    
    // NOTE: NO LLM timeline updates here - this is just for tree synchronization during typing
    // LLM updates only happen via save button through updateSentenceNodeContent → onContentChange with special flag
    
    // Log the tree synchronization for debugging
    console.log(`🔍 MAIN COMPONENT: Tree content synchronization complete (no LLM call for typing)`);
  }, []);
    
    // Log the tree synchronization for debugging
    console.log(`� Tree content synchronization complete`);
  }, []);


  // Add to useEffect for testing (remove in production)
  useEffect(() => {
    // Only run on client side after hydration
    if (!isClient) return;
    
    // Uncomment to test branching structure:
    // addTestBranchingData();
    
    // Add global console commands for testing
    if (typeof window !== 'undefined') {
      (window as any).sentenceTreeDebug = {
        exportTree: exportSentenceTree,
        getStats: getSentenceTreeStats,
        createBranch: handleCreateBranch,
        switchToBranch: handleSwitchToBranch,
        findPath: findSentencePath,
        getChildren: getSentenceChildren,
        getActivePathFromRoot,
        validateTree: validateTreeStructure,
        getCurrentEditableBranchId,
        enterEditMode,
        exitEditMode,
        exitAllEditMode,
        removeDuplicates: () => {
          console.log('🧹 Running manual duplicate removal...');
          const currentMap = sentenceNodes;
          const cleanedMap = removeDuplicateSentenceNodes(currentMap);
          if (cleanedMap.size !== currentMap.size) {
            setSentenceNodes(cleanedMap);
            const newActivePath = getActivePathFromCleanedMap(cleanedMap);
            setActivePath(newActivePath);
            console.log('✅ Duplicates removed and state updated');
          } else {
            console.log('✅ No duplicates found');
          }
          return cleanedMap;
        },
        editableNodes: Array.from(editableNodes), // Convert Set to Array for serialization
        nodes: sentenceNodes,
        activePath,
        completedSentences, // Add this for easy access
        forceCompletion: () => {
          // Helper function to test completion logging
        }
      };
      
      
    }
  }, [isClient, sentenceNodes, activePath, completedSentences]);

  // Handle sentence selection for narrative layer
  const handleSentenceSelect = (sentence: string, index: number, pageId: string) => {
    console.log(`📝 Sentence selected on page ${pageId}: "${sentence}" (Index: ${index})`);
    
    // Log the sentence selection interaction
    interactionLogger.logInteraction({
      eventType: 'click',
      action: 'sentence_selection',
      target: {
        type: 'ui_element',
        name: 'narrative_layer'
      },
      metadata: {
        sentence,
        index,
        pageId,
        timestamp: Date.now()
      }
    });
  };

  // Handle stopping analysis
  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
  };

  // Handle suggestion state changes
  const handleSuggestionReceived = (suggestion: NarrativeSuggestion, pageId: string) => {
    console.log(`📥 Suggestion received for page ${pageId}:`, suggestion);
    setHasPendingSuggestion(true);
  };

  // Handle suggestion accepted/denied
  const handleSuggestionResolved = (pageId: string) => {
    console.log(`✅ Suggestion resolved for page ${pageId}`);
    setHasPendingSuggestion(false);
  };

  // Use effect to check and update suggestion state periodically when needed
  useEffect(() => {
    if (narrativeSystemRef.current) {
      const hasActiveSuggestion = narrativeSystemRef.current.hasPendingSuggestion();
      if (hasActiveSuggestion !== hasPendingSuggestion) {
        setHasPendingSuggestion(hasActiveSuggestion);
      }
    }
  });

  // Use effect to track interaction count changes
  useEffect(() => {
    const updateInteractionCount = () => {
      const currentCount = getCapturedInteractionCount();
      setInteractionCount(currentCount);
    };

    // Update immediately
    updateInteractionCount();

    // Reset count to 0 after 2 seconds of page load
    const resetTimer = setTimeout(() => {
      setInteractionCount(0);
      // Also clear any existing captured interactions to ensure clean state
      // This ensures the global interaction array is also reset
      const existingCount = getCapturedInteractionCount();
      if (existingCount > 0) {
        // Clear the global interactions by calling captureAndLogInteractions
        // which returns and clears the current interactions
        captureAndLogInteractions();
      }
    }, 2000);

    // Set up an interval to check for changes (since we can't directly observe the global array)
    const interval = setInterval(updateInteractionCount, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(resetTimer);
    };
  }, []);

  // Add insight timeline debug helpers and track page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Add insight timeline debug helpers
      (window as any).insightTimelineDebug = {
        getTimelinesForAllPages: () => insightTimelinesByPage,
        getTimelineForPage: (pageId: string) => getCurrentTimelineForPage(pageId),
        getActiveNarratives: (pageId: string) => getActiveNodesNarratives(pageId),
        generateSentenceIds: (pageId: string) => {
          const narratives = getActiveNodesNarratives(pageId);
          return generateSentenceIds(pageId, narratives);
        },
        updateTimelineForPage: (pageId: string) => requestTimelineUpdate(pageId, undefined, 'debugHelper'),
        getRecentlyUpdatedSentence: () => recentlyUpdatedSentence
      };
      
      console.log('🔮 Insight Timeline debug helpers available:');
      console.log('  - window.insightTimelineDebug.getTimelinesForAllPages()');
      console.log('  - window.insightTimelineDebug.getTimelineForPage(pageId)');
      console.log('  - window.insightTimelineDebug.getActiveNarratives(pageId)');
      console.log('  - window.insightTimelineDebug.generateSentenceIds(pageId)');
      console.log('  - window.insightTimelineDebug.updateTimelineForPage(pageId)');
      console.log('  - window.insightTimelineDebug.getRecentlyUpdatedSentence()');
      
      // Set up DOM event listeners to track branch-related clicks
      const handleBranchClick = (event: Event) => {
        const target = event.target as HTMLElement;
        
        // Track branch option clicks (switching)
        if (target?.classList.contains('dropdown-item') && target?.classList.contains('branch-option')) {
          console.log('🎯 Branch switch UI click detected, starting protection');
          startBranchOperation('ui_branch_switch');
          
          // Store click time on the element for additional protection
          (target as any).__lastClickTime = Date.now();
          
          // End protection after delay
          endBranchOperation('ui_branch_switch', 3000);
        }
        
        // Track branch delete button clicks
        if (target?.textContent?.includes('Delete') || 
            target?.classList.contains('delete-branch') ||
            target?.closest('.delete-branch-btn') ||
            target?.innerHTML?.includes('🗑️')) {
          console.log('🗑️ Branch delete UI click detected, starting protection');
          startBranchOperation('ui_branch_delete');
          
          // End protection after delay
          endBranchOperation('ui_branch_delete', 3000);
        }
      };
      
      // Add click listener to document to catch branch clicks
      document.addEventListener('click', handleBranchClick, true);
      
      // Cleanup function
      const cleanup = () => {
        document.removeEventListener('click', handleBranchClick, true);
      };
      
      return cleanup;
    }
    
  }, [showNarrativeLayer]); // Only trigger when narrative layer visibility changes

  // Initialize timeline for the current page when narrative layer is first shown
  useEffect(() => {
    if (showNarrativeLayer) {
      const currentPageId = narrativeSystemRef.current?.getCurrentPageId();
      if (currentPageId) {
        console.log('📄 Narrative layer shown, initializing timeline for current page:', currentPageId);
        
        // If this page doesn't have a timeline yet, create an initial one from tree structure
        if (!insightTimelinesByPage[currentPageId] || insightTimelinesByPage[currentPageId].groups.length === 0) {
          console.log('🆕 Creating initial timeline for current page:', currentPageId);
          const treeStructure = getTreeStructureForPage(currentPageId);
          
          if (treeStructure && treeStructure.nodes.length > 0) {
            // Build timeline from existing tree structure (if page has content)
            const combinedTimeline = buildCombinedTimeline(treeStructure, []);
            setInsightTimelinesByPage(prevTimelines => ({
              ...prevTimelines,
              [currentPageId]: { groups: combinedTimeline }
            }));
          } else {
            // New page with no content - initialize with empty timeline
            console.log('🆕 Current page has no content, initializing with empty timeline');
            setInsightTimelinesByPage(prevTimelines => ({
              ...prevTimelines,
              [currentPageId]: { groups: [] }
            }));
          }
        }
      }
    }
  }, [showNarrativeLayer]); // Only trigger when narrative layer is shown

  // Monitor tree structure changes to detect when new nodes are added without explicit button clicks
  const [previousNodeCount, setPreviousNodeCount] = useState<number>(0);
  
  useEffect(() => {
    const currentNodeCount = sentenceNodes.size;
    
    // If the node count increased and we're not in the middle of handling operations
    if (currentNodeCount > previousNodeCount && currentNodeCount > 0) {
      const currentPageId = narrativeSystemRef.current?.getCurrentPageId();
      
      if (currentPageId) {
        // Use centralized branch operation check
        if (isBranchOperationActive()) {
          console.log('🚫 Tree change detected but blocked: Branch operation active');
          setPreviousNodeCount(currentNodeCount);
          return;
        }
        
        console.log('🌳 Tree structure changed: node count increased from', previousNodeCount, 'to', currentNodeCount);
        
        // Get the new node that was added
        const newNodeEntries = Array.from(sentenceNodes.entries());
        const newNode = newNodeEntries[currentNodeCount - 1];
        const treeStructure = getTreeStructureForPage(currentPageId);
        
        if (newNode && treeStructure) {
          const [newNodeId, newNodeData] = newNode;
          const nodeIndex = treeStructure.nodes.findIndex(n => n.id === newNodeId);
          
          // This represents an "add_next" operation when a new node appears
          const changeMetadata: ChangeMetadata = {
            operation_type: 'add_next',
            sentence_id: newNodeId,
            current_content: newNodeData.content,
            parent_info: {
              node_id: (nodeIndex + 1).toString(), // Use 1-based indexing
              sentence_id: newNodeId,
              sentence_content: newNodeData.content
            }
          };
          
          // Additional protection check before calling timeline update
          if (isBranchOperationActive()) {
            console.log('🚫 Tree monitoring blocked: Branch operation active for new node:', newNodeId);
          } else {
            // Update timeline with the detected change (use central gatekeeper)
            requestTimelineUpdate(currentPageId, changeMetadata, 'treeMonitoring');
          }
        }
      }
    }
    
    setPreviousNodeCount(currentNodeCount);
  }, [sentenceNodes, previousNodeCount, isBranchOperationActive]);

  // Handle file selection from DatasetExplorer
  const handleFileSelection = async (files: DatasetFile[]) => {
    setSelectedFiles(files);
    setSummaryError('');
    
    if (files.length === 0) {
      setFileSummaries([]);
      return;
    }

    setSummaryLoading(true);
    try {
      // Convert DatasetFile to LondonDataFile format for the utility
      const londonDataFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        category: file.category || 'uncategorized',
        description: file.description,
        size: 0,
        columns: [],
        sampleData: [],
        totalRecords: 0,
        isLoaded: false
      }));

      const summaries = await generateMultipleFileSummaries(londonDataFiles);
      setFileSummaries(summaries);
    } catch (error) {
      console.error('Error generating file summaries:', error);
      setSummaryError(error instanceof Error ? error.message : 'Failed to analyze selected files');
      setFileSummaries([]);
    } finally {
      setSummaryLoading(false);
    }
  };

  // END OF OLD SENTENCE TREE MANAGEMENT CODE - Commented out
  */

  // NEW: Handler specifically for save button edits (should trigger edit_sentence)
  const handleSentenceEdit = useCallback((oldContent: string, newContent: string, nodeId: string, pageId: string) => {
    console.log(`💾 SAVE BUTTON: handleSentenceEdit called: "${oldContent}" → "${newContent}" (node: ${nodeId})`);
    
    // IMPORTANT: Set recently updated sentence to block any follow-up sentence detections
    setRecentlyUpdatedSentence({
      pageId: pageId,
      sentence: newContent,
      timestamp: Date.now()
    });
    
    // Get tree structure to build proper metadata
    const treeStructure = getTreeStructureForPage(pageId);
    
    if (treeStructure && treeStructure.nodes.length > 0) {
      // Find the node that was edited
      let editedNode = null;
      for (const node of treeStructure.nodes) {
        if (node.id === nodeId) {
          editedNode = node;
          break;
        }
      }
      
      if (editedNode) {
        console.log(`💾 SAVE BUTTON: Creating edit_sentence timeline update for node ${editedNode.id}`);
        const changeMetadata = {
          operation_type: 'edit_sentence' as const,
          sentence_id: editedNode.id,
          current_content: newContent,
          previous_content: oldContent,
          parent_info: {
            node_id: (treeStructure.nodes.findIndex(n => n.id === editedNode.id) + 1).toString(),
            sentence_id: editedNode.id,
            sentence_content: newContent
          }
        };
        
        // Use central gatekeeper for timeline update
        console.log(`💾 SAVE BUTTON: Triggering requestTimelineUpdate with edit_sentence`);
        requestTimelineUpdate(pageId, changeMetadata, 'save-button-edit');
      } else {
        console.warn(`💾 SAVE BUTTON: Could not find edited node ${nodeId} in tree structure`);
      }
    } else {
      console.warn(`💾 SAVE BUTTON: No tree structure found for page ${pageId}`);
    }
  }, []);

  // Essential handlers that are still needed for the PagedNarrativeSystem
  const handleSentenceEnd = async (sentence: string, confidence: number, pageId: string) => {
    console.log(`🧠 Sentence completed on page ${pageId}: "${sentence}" (Confidence: ${confidence})`);
    
    // PROTECTION: Check if we're in the middle of branch operations
    if (isBranchOperationActive()) {
      console.log('🚫 handleSentenceEnd blocked: Branch operation active for sentence:', sentence);
      console.log('🔥 DEBUG: Protection active, sentence completion ignored');
      return;
    }

    // PROTECTION: Block sentence completion for content that was just edited via save button
    // This prevents save button → edit_sentence from being followed by sentence detection → add_next
    if (recentlyUpdatedSentence && 
        (sentence.includes(recentlyUpdatedSentence.sentence) || 
         recentlyUpdatedSentence.sentence.includes(sentence) ||
         sentence.trim() === recentlyUpdatedSentence.sentence.trim())) {
      const timeSinceEdit = Date.now() - recentlyUpdatedSentence.timestamp;
      if (timeSinceEdit < 3000) { // Block for 3 seconds after save button edit
        console.log(`🚫 handleSentenceEnd blocked: Recently saved content "${sentence}" (${timeSinceEdit}ms ago)`);
        console.log('🔥 DEBUG: Preventing duplicate add_next after save button edit_sentence');
        return;
      }
    }

    console.log('🔥 DEBUG: No branch operation active, proceeding with sentence completion');    // REMOVED: Don't set recentlyUpdatedSentence here - that should only happen via save button
    // setRecentlyUpdatedSentence is ONLY for save button edits to prevent duplicate LLM calls
    // Normal sentence completion should proceed through to LLM
    
    // The PagedNarrativeSystem handles the tree structure internally
    // Here we can focus on the analysis and logging
    
    try {
      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Analysis complete for: "${sentence}" on page ${pageId}`);
      
      // Double-check protection before proceeding (in case branch operation started during delay)
      if (isBranchOperationActive()) {
        console.log('🚫 handleSentenceEnd blocked after delay: Branch operation active for sentence:', sentence);
        console.log('🔥 DEBUG: Protection activated during analysis delay, aborting LLM call');
        return;
      }
      console.log('🔥 DEBUG: Second protection check passed, proceeding to LLM call');
      // Get the actual tree structure to find the current active node
      const treeStructure = getTreeStructureForPage(pageId);
      let changeMetadata = null;
      
      console.log('🔥 DEBUG: Tree structure when processing sentence completion:', treeStructure?.nodes.length, 'nodes');
      console.log('🔥 DEBUG: Tree nodes:', treeStructure?.nodes.map(n => `${n.id}:${n.content}`));
      console.log('🔥 DEBUG: Sentence being processed:', sentence);
      
      if (treeStructure && treeStructure.activePath.length > 0) {
        // Get the current active node (last node in active path)
        const currentActiveNodeId = treeStructure.activePath[treeStructure.activePath.length - 1];
        const currentActiveNode = treeStructure.nodes.find(n => n.id === currentActiveNodeId);
        const currentNodeIndex = treeStructure.nodes.findIndex(n => n.id === currentActiveNodeId);
        
        console.log('🔥 DEBUG: Current active node ID:', currentActiveNodeId);
        console.log('🔥 DEBUG: Current active node content:', currentActiveNode?.content);
        console.log('🔥 DEBUG: Active path:', treeStructure.activePath);
        
        if (currentActiveNode) {
          changeMetadata = {
            operation_type: 'add_next' as const,
            sentence_id: currentActiveNode.id,
            current_content: sentence,
            parent_info: {
              node_id: (currentNodeIndex + 1).toString(), // Use 1-based indexing consistent with LLM
              sentence_id: currentActiveNode.id,
              sentence_content: currentActiveNode.content
            }
          };
        } else {
          // Fallback if no active node found
          changeMetadata = {
            operation_type: 'add_next' as const,
            sentence_id: Date.now().toString(),
            current_content: sentence,
            parent_info: {
              node_id: '1',
              sentence_id: 'root',
              sentence_content: sentence
            }
          };
        }
      } else {
        // No tree structure yet, this might be the first node
        changeMetadata = {
          operation_type: 'add_next' as const,
          sentence_id: 'root-' + Date.now(),
          current_content: sentence,
          parent_info: {
            node_id: '1',
            sentence_id: 'root',
            sentence_content: sentence
          }
        };
      }
      
      // Update insight timeline for this page with change metadata (use central gatekeeper)
      requestTimelineUpdate(pageId, changeMetadata, 'handleSentenceEnd');
      
      // Log the sentence completion interaction
      await interactionLogger.logInteraction({
        eventType: 'view_change',
        action: 'sentence_completion',
        target: {
          type: 'ui_element',
          name: 'narrative_layer'
        },
        metadata: {
          sentence,
          confidence,
          pageId,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('❌ Error analyzing sentence:', error);
    }
  };

  // Handle sentence selection for narrative layer
  const handleSentenceSelect = (sentence: string, index: number, pageId: string) => {
    console.log(`📝 Sentence selected on page ${pageId}: "${sentence}" (Index: ${index})`);
    
    // Log the sentence selection interaction
    interactionLogger.logInteraction({
      eventType: 'click',
      action: 'sentence_selection',
      target: {
        type: 'ui_element',
        name: 'narrative_layer'
      },
      metadata: {
        sentence,
        index,
        pageId,
        timestamp: Date.now()
      }
    });
  };

  // Handle suggestion state changes
  const handleSuggestionReceived = (suggestion: NarrativeSuggestion, pageId: string) => {
    setHasPendingSuggestion(true);
  };

  // Handle suggestion accepted/denied
  const handleSuggestionResolved = (pageId: string) => {
    setHasPendingSuggestion(false);
  };

  // Wrapper for PagedNarrativeSystem onContentChange - ONLY for tree synchronization, NO LLM calls
  const handleContentChangeWrapper = (oldContent: string, newContent: string, pageId: string) => {
    console.log(`🔄 WRAPPER: handleContentChangeWrapper called: "${oldContent}" → "${newContent}" (page: ${pageId})`);
    console.log(`🔄 WRAPPER: This should ONLY synchronize tree structure, NO LLM calls`);
    
    // TODO: Call tree synchronization function - for now, just log
    console.log(`🔄 WRAPPER: Tree synchronization would happen here (temporarily disabled)`);
  };

  // Helper function to get active nodes narratives for a page
  const getActiveNodesNarratives = (pageId: string): string[] => {
    if (narrativeSystemRef.current) {
      const pageContent = narrativeSystemRef.current.getPageContent(pageId);
      if (pageContent) {
        // Split content into sentences and filter out empty ones
        return pageContent
          .split(/[.!?]+/)
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 0);
      }
    }
    return [];
  };

  // Helper function to generate sentence IDs for each sentence in the narrative
  const generateSentenceIds = (pageId: string, narratives: string[]): string[] => {
    return narratives.map((_, index) => `${pageId}-sentence-${index + 1}`);
  };

  // Helper function to get current insight timeline for a page
  const getCurrentTimelineForPage = (pageId: string): TimelineGroup[] => {
    const timeline = insightTimelinesByPage[pageId]?.groups || [];
    console.log(`📊 getCurrentTimelineForPage(${pageId}):`, timeline.length, 'nodes');
    console.log(`📊 Timeline node IDs:`, timeline.map(n => `${n.node_id}:${n.sentence_id}`));
    return timeline;
  };

  // Function to get tree structure for timeline generation
  const getTreeStructureForPage = (pageId: string) => {
    if (narrativeSystemRef.current) {
      const tree = narrativeSystemRef.current.getPageTree(pageId);
      if (tree) {
        console.log(`🌳 getTreeStructureForPage(${pageId}):`, tree.nodes.length, 'nodes');
        console.log(`🌳 Tree node IDs:`, tree.nodes.map(n => `${n.id}:${n.content.substring(0, 20)}...`));
        console.log(`🌳 Active path:`, tree.activePath);
      }
      return tree;
    }
    return null;
  };

  // State to prevent timeline triggers during branch operations
  const [isHandlingBranchSwitch, setIsHandlingBranchSwitch] = useState<boolean>(false);
  const [branchOperationInProgress, setBranchOperationInProgress] = useState<boolean>(false);
  const [lastBranchOperationTime, setLastBranchOperationTime] = useState<number>(0);
  
  // State to prevent LLM calls during page switches
  const [pageSwitchInProgress, setPageSwitchInProgress] = useState<boolean>(false);
  
  // Global branch operation tracker with additional protection
  const [globalBranchOperationState, setGlobalBranchOperationState] = useState<{
    isActive: boolean;
    operationType: string | null;
    startTime: number;
  }>({
    isActive: false,
    operationType: null,
    startTime: 0
  });

  // Function to update insight timeline for a specific page
  
  // Centralized branch operation management
  const startBranchOperation = useCallback((operationType: string) => {
    console.log(`🚫 Starting branch operation: ${operationType}`);
    console.log(`🔥 DEBUG: startBranchOperation called with`, operationType);
    console.log(`🔥 DEBUG: Current state before operation:`, {
      isHandlingBranchSwitch,
      branchOperationInProgress,
      globalBranchOperationState
    });
    
    setIsHandlingBranchSwitch(true);
    setBranchOperationInProgress(true);
    setLastBranchOperationTime(Date.now());
    setGlobalBranchOperationState({
      isActive: true,
      operationType,
      startTime: Date.now()
    });
    
    console.log(`🔥 DEBUG: State should now be updated`);
  }, []);
  
  const endBranchOperation = useCallback((operationType: string, delay: number = 1500) => {
    setTimeout(() => {
      console.log(`✅ Ending branch operation: ${operationType}`);
      setIsHandlingBranchSwitch(false);
      setBranchOperationInProgress(false);
      setGlobalBranchOperationState({
        isActive: false,
        operationType: null,
        startTime: 0
      });
    }, delay);
  }, []);
  
  // Enhanced function to check if any branch operation is active
  const isBranchOperationActive = useCallback((): boolean => {
    const now = Date.now();
    
    // Check state flags
    if (isHandlingBranchSwitch || branchOperationInProgress || globalBranchOperationState.isActive) {
      return true;
    }
    
    // Check time-based protection
    if (now - lastBranchOperationTime < 3000) { // 3 second protection window
      return true;
    }
    
    // Check global operation state time
    if (globalBranchOperationState.startTime > 0 && now - globalBranchOperationState.startTime < 3000) {
      return true;
    }
    
    return false;
  }, [isHandlingBranchSwitch, branchOperationInProgress, globalBranchOperationState, lastBranchOperationTime]);

  // CENTRAL GATEKEEPER FUNCTION - ALL TIMELINE UPDATES MUST GO THROUGH HERE
  const requestTimelineUpdate = useCallback((pageId: string, changeMetadata?: any, source: string = 'unknown') => {
    console.log(`🔍 Timeline update requested from: ${source}`, changeMetadata?.operation_type || 'no-op');
    
    // COMPREHENSIVE PROTECTION CHECK
    if (isBranchOperationActive()) {
      console.log(`🚫 Timeline update BLOCKED from ${source}: Branch operation active`);
      return false;
    }
    
    // Allow the update
    console.log(`✅ Timeline update ALLOWED from ${source}`);
    updateInsightTimelineForPage(pageId, changeMetadata);
    return true;
  }, [isBranchOperationActive]);

  const handleBranchSwitch = (branchId: string, pageId: string) => {
    console.log('Branch switch detected:', branchId, 'on page:', pageId);
    
    // Use centralized branch operation management
    startBranchOperation('branch_switch');
    
    // Add click tracking to branch elements for additional protection
    if (typeof window !== 'undefined') {
      const branchElements = document.querySelectorAll('.dropdown-item.branch-option');
      branchElements.forEach(element => {
        (element as any).__lastClickTime = Date.now();
      });
    }
    
    // For branch switching, we need to rebuild the timeline with the updated tree structure
    // while preserving existing LLM insights
    const treeStructure = getTreeStructureForPage(pageId);
    const currentTimeline = getCurrentTimelineForPage(pageId);
    
    if (treeStructure && treeStructure.nodes.length > 0) {
      // Use the combined timeline builder to merge tree structure with existing LLM insights
      const combinedTimeline = buildCombinedTimeline(treeStructure, currentTimeline);
      
      // Update the timeline state directly for branch switches
      setInsightTimelinesByPage(prev => ({
        ...prev,
        [pageId]: {
          groups: combinedTimeline
        }
      }));
      
    }
    
    // End the branch operation
    endBranchOperation('branch_switch');
  };

  const handleBranchDelete = (branchId: string, pageId: string) => {
    console.log('🗑️ Branch delete detected:', branchId, 'on page:', pageId);
    
    // Use centralized branch operation management
    startBranchOperation('branch_delete');
    
    // Add a small delay to ensure the tree structure is updated after deletion
    setTimeout(() => {
      console.log('🗑️ Processing branch deletion after tree update...');
      
      // For branch deletion, we need to rebuild the timeline with the updated tree structure
      // This should NOT trigger LLM calls since it's a deletion operation
      const treeStructure = getTreeStructureForPage(pageId);
      const currentTimeline = getCurrentTimelineForPage(pageId);
      
      console.log('🗑️ Tree structure after deletion:', treeStructure?.nodes.length, 'nodes');
      
      if (treeStructure && treeStructure.nodes.length > 0) {
        // Use the combined timeline builder to merge updated tree structure with existing LLM insights
        const combinedTimeline = buildCombinedTimeline(treeStructure, currentTimeline);
        
        console.log('🗑️ Built combined timeline after deletion:', combinedTimeline.length, 'nodes');
        
        // Update the timeline state directly for branch deletions
        setInsightTimelinesByPage(prev => ({
          ...prev,
          [pageId]: {
            groups: combinedTimeline
          }
        }));
        
        console.log('🗑️ Updated timeline after branch deletion, nodes remaining:', combinedTimeline.length);
      } else {
        // If no nodes remain, clear the timeline
        setInsightTimelinesByPage(prev => ({
          ...prev,
          [pageId]: {
            groups: []
          }
        }));
        console.log('🗑️ Cleared timeline - no nodes remaining after branch deletion');
      }
      
      // End the branch operation
      endBranchOperation('branch_delete', 1000);
    }, 100); // Small delay to ensure tree is updated
  };

  const handleSentenceDelete = (sentenceId: string, pageId: string) => {
    console.log('🗑️ Sentence delete detected:', sentenceId, 'on page:', pageId);
    console.log('🔥 DEBUG: handleSentenceDelete called for sentence:', sentenceId);
    
    // Check if the sentence has children - if it does, we should allow LLM calls
    const treeStructureBefore = getTreeStructureForPage(pageId);
    const nodeToDelete = treeStructureBefore?.nodes.find(n => n.id === sentenceId);
    const hasChildren = nodeToDelete?.children && nodeToDelete.children.length > 0;
    
    console.log('🔥 DEBUG: Node to delete:', nodeToDelete?.content, 'has children:', hasChildren);
    
    if (hasChildren) {
      console.log('🔮 Sentence has children - allowing LLM calls for structural change');
      // Don't start branch operation protection - allow normal LLM processing
      return;
    }
    
    console.log('🍃 Sentence is leaf node - blocking LLM calls');
    // Start sentence deletion protection to prevent LLM calls (only for leaf nodes)
    startBranchOperation('ui_sentence_delete');
    
    // Add a small delay to ensure the deletion is processed and timeline updated
    setTimeout(() => {
      console.log('🗑️ Processing leaf node deletion for timeline update...');
      console.log('🔥 DEBUG: About to get tree structure after deletion');
      
      // Get updated tree structure after deletion
      const treeStructure = getTreeStructureForPage(pageId);
      const currentTimeline = getCurrentTimelineForPage(pageId);
      
      console.log('🗑️ Tree structure after sentence deletion:', treeStructure?.nodes.length, 'nodes');
      console.log('🔥 DEBUG: Tree nodes after deletion:', treeStructure?.nodes.map(n => `${n.id}:${n.content}`));
      console.log('🔥 DEBUG: Current timeline before rebuild:', currentTimeline.length, 'groups');
      
      if (treeStructure && treeStructure.nodes.length > 0) {
        // Use the combined timeline builder to merge updated tree structure with existing LLM insights
        const combinedTimeline = buildCombinedTimeline(treeStructure, currentTimeline);
        
        console.log('🗑️ Built combined timeline after sentence deletion:', combinedTimeline.length, 'nodes');
        console.log('🔥 DEBUG: Combined timeline nodes:', combinedTimeline.map(n => `${n.node_id}:${n.sentence_id}`));
        
        // Update the timeline state directly for sentence deletions
        setInsightTimelinesByPage(prev => ({
          ...prev,
          [pageId]: {
            groups: combinedTimeline
          }
        }));
        
        console.log('🗑️ Updated timeline after sentence deletion, nodes remaining:', combinedTimeline.length);
        console.log('🔥 DEBUG: Timeline state should now be updated, ReactFlow should recalculate');
      } else {
        // If no nodes remain, clear the timeline
        setInsightTimelinesByPage(prev => ({
          ...prev,
          [pageId]: {
            groups: []
          }
        }));
        console.log('🗑️ Cleared timeline - no nodes remaining after sentence deletion');
      }
      
      // End sentence deletion protection
      endBranchOperation('ui_sentence_delete', 1000);
      console.log('🔥 DEBUG: Leaf node deletion processing complete');
    }, 200); // Small delay to ensure deletion is complete
  };

  // Handle page reset - clear timeline for the page
  const handlePageReset = (pageId: string) => {
    console.log('🧹 Page reset detected for page:', pageId);
    
    // Clear the timeline for this page
    setInsightTimelinesByPage(prev => ({
      ...prev,
      [pageId]: {
        groups: []
      }
    }));
    
    console.log('✅ Timeline cleared for reset page:', pageId);
  };

  // Helper function to build combined timeline from tree structure + LLM insights
  const buildCombinedTimeline = (treeStructure: any, llmTimelineGroups: TimelineGroup[]): TimelineGroup[] => {
    // Handle null/empty tree structure
    if (!treeStructure || !treeStructure.nodes || treeStructure.nodes.length === 0) {
      console.log('🔍 TIMELINE BUILDING: Tree structure is empty, returning empty timeline');
      return [];
    }

    // Create a map of LLM insights by sentence_id for quick lookup
    const llmInsightsMap = new Map<string, TimelineGroup>();
    llmTimelineGroups.forEach(group => {
      llmInsightsMap.set(group.sentence_id, group);
    });

    // Build complete timeline from all tree nodes
    console.log(`🔍 TIMELINE BUILDING: Tree structure has ${treeStructure.nodes.length} nodes:`);
    treeStructure.nodes.forEach((node: any, index: number) => {
      console.log(`🔍 TIMELINE NODE ${index + 1}: ID=${node.id}, content="${node.content}"`);
    });
    
    const combinedTimeline: TimelineGroup[] = treeStructure.nodes.map((node: any, index: number) => {
      const llmInsight = llmInsightsMap.get(node.id);
      
      return {
        node_id: index + 1,
        sentence_id: node.id,
        sentence_content: node.content,
        parent_id: node.parent || '',
        child_ids: node.children || [],
        // Include LLM drift analysis if available, otherwise null
        changed_from_previous: llmInsight?.changed_from_previous || null,
        hover: llmInsight ? llmInsight.hover : {
          title: node.content,
          source: {
            dataset: 'Current Session',
            geo: 'User Input', 
            time: 'Current',
            measure: 'Narrative Flow',
            unit: 'sentences'
          },
          reflect: [`Node ${index + 1}: ${node.content}`]
        }
      };
    });

    console.log('🔗 Built combined timeline:', combinedTimeline.length, 'total nodes,', 
                Array.from(llmInsightsMap.keys()).length, 'with LLM insights');
    
    return combinedTimeline;
  };

  const updateInsightTimelineForPage = async (pageId: string, changeMetadata?: any, skipBranchSwitches: boolean = false) => {
    try {
      // Skip LLM calls during page switches
      if (pageSwitchInProgress) {
        console.log(`🚫 Timeline update BLOCKED: Page switch in progress`);
        return;
      }
      
      const currentTimeline = getCurrentTimelineForPage(pageId);
      const treeStructure = getTreeStructureForPage(pageId);
      
      console.log(`🔍 TIMELINE UPDATE: Got tree structure for page ${pageId}`);
      if (treeStructure && treeStructure.nodes) {
        console.log(`🔍 TIMELINE UPDATE: Tree has ${treeStructure.nodes.length} nodes:`);
        treeStructure.nodes.forEach((node: any, index: number) => {
          console.log(`🔍 TIMELINE UPDATE NODE ${index + 1}: ID=${node.id}, content="${node.content}"`);
        });
      } else {
        console.log(`🔍 TIMELINE UPDATE: Tree structure is null or has no nodes`);
      }
      
      const recentSentence = recentlyUpdatedSentence?.sentence || '';

      if (!treeStructure || treeStructure.nodes.length === 0) {
        return;
      }

      // Skip LLM call for branch switching operations (only activePath changes, no content changes)
      if (skipBranchSwitches && changeMetadata?.operation_type === 'switch_branch') {
        console.log('⏭️ Skipping LLM call for branch switching operation');
        
        // For branch switches, rebuild timeline with current tree structure + existing LLM insights
        const combinedTimeline = buildCombinedTimeline(treeStructure, currentTimeline);
        setInsightTimelinesByPage(prev => ({
          ...prev,
          [pageId]: { groups: combinedTimeline }
        }));
        return;
      }

      // Set loading state
      setTimelineLoadingByPage(prev => ({ ...prev, [pageId]: true }));

      console.log('🔮 Calling LLM with changeMetadata:', changeMetadata);
      
      const llmTimelineResponse = await generateInsightTimeline(
        currentTimeline,
        treeStructure,
        recentSentence,
        pageId,
        changeMetadata
      );

      // Combine LLM response with complete tree structure
      const combinedTimeline = buildCombinedTimeline(treeStructure, llmTimelineResponse.groups);
      
      // Update the timeline state
      setInsightTimelinesByPage(prev => ({
        ...prev,
        [pageId]: { groups: combinedTimeline }
      }));

      console.log('✅ Updated insight timeline for page:', pageId);
    } catch (error) {
      console.error('❌ Error updating insight timeline for page:', pageId, error);
    } finally {
      // Clear loading state
      setTimelineLoadingByPage(prev => ({ ...prev, [pageId]: false }));
    }
  };

  // Simple debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced version to prevent rapid successive calls with comprehensive branch operation constraints
  const debouncedUpdateTimeline = useCallback(
    debounce((pageId: string, changeMetadata?: any, source: string = 'debounced') => {
      // Use the central gatekeeper
      requestTimelineUpdate(pageId, changeMetadata, source);
    }, 1500), // Increased debounce to 1.5 seconds
    [requestTimelineUpdate]
  );

  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
  };

  const handleFileSelection = async (files: DatasetFile[]) => {
    setSelectedFiles(files);
    setSummaryError('');
    
    if (files.length === 0) {
      setFileSummaries([]);
      return;
    }

    setSummaryLoading(true);
    try {
      const londonDataFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        path: file.path,
        category: file.category || 'uncategorized',
        description: file.description,
        size: 0,
        columns: [],
        sampleData: [],
        totalRecords: 0,
        isLoaded: false
      }));

      const summaries = await generateMultipleFileSummaries(londonDataFiles);
      setFileSummaries(summaries);
    } catch (error) {
      console.error('Error generating file summaries:', error);
      setSummaryError(error instanceof Error ? error.message : 'Failed to analyze selected files');
      setFileSummaries([]);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading narrative visualization...</p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Study Header - only show if in study mode */}
      {isStudyMode && (
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 text-sm">
          <div className="flex justify-between items-center">
            <span>
              📊 User Study Session • Participant: {userSession.participantId} • Welcome, {userSession.firstName} {userSession.lastName}
            </span>
            <button
              className="px-3 py-1 bg-cyan-800 hover:bg-cyan-900 rounded text-xs transition-colors"
              onClick={async () => {
                // Log the session end interaction manually
                await interactionLogger.logButtonClick('end_session_button', 'End Session');
                
                localStorage.removeItem('narrativeUser');
                localStorage.removeItem('narrativeToken');
                router.push('/narrative-login');
              }}
            >
              End Session
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-screen" style={{ height: isStudyMode ? 'calc(100vh - 40px)' : '100vh' }}>
        {/* Left Section - 40% (Data Explorer or Narrative Layer) */}
        <div className="w-2/5">
          {showNarrativeLayer ? (
            <PagedNarrativeSystem 
              ref={narrativeSystemRef}
              prompt={currentPrompt}
              onSentenceEnd={handleSentenceEnd}
              onSentenceSelect={handleSentenceSelect}
              onSuggestionReceived={handleSuggestionReceived}
              onSuggestionResolved={handleSuggestionResolved}
              disableInteractions={hasActiveInfoNodes}
              onContentChange={handleContentChangeWrapper}
              onSentenceEdit={handleSentenceEdit}
              onBranchSwitch={handleBranchSwitch}
              onBranchDelete={handleBranchDelete}
              onSentenceDelete={handleSentenceDelete}
              onPageChange={(fromPageId, toPageId) => {
                console.log(`📄 Page changed from ${fromPageId} to ${toPageId}`);
                
                // Set page switch flag to prevent LLM calls during this operation
                setPageSwitchInProgress(true);
                
                // Immediately initialize empty timeline for new page to avoid showing previous page's timeline
                if (!insightTimelinesByPage[toPageId]) {
                  console.log(`🆕 Page ${toPageId} is new - immediately initializing with empty timeline`);
                  setInsightTimelinesByPage(prev => ({
                    ...prev,
                    [toPageId]: { groups: [] }
                  }));
                }
                
                // Then check if we need to build timeline from existing tree structure
                const treeStructure = getTreeStructureForPage(toPageId);
                
                if (treeStructure && treeStructure.nodes.length > 0) {
                  // Page has content - build timeline from existing tree structure (no LLM calls)
                  console.log(`📊 Page ${toPageId} has ${treeStructure.nodes.length} nodes, building timeline from cached data`);
                  const combinedTimeline = buildCombinedTimeline(treeStructure, []);
                  setInsightTimelinesByPage(prev => ({
                    ...prev,
                    [toPageId]: { groups: combinedTimeline }
                  }));
                } else {
                  // Page is empty - ensure timeline stays empty
                  console.log(`🆕 Page ${toPageId} is empty, ensuring timeline is empty`);
                  setInsightTimelinesByPage(prev => ({
                    ...prev,
                    [toPageId]: { groups: [] }
                  }));
                }
                
                // Clear page switch flag after a brief delay
                setTimeout(() => {
                  setPageSwitchInProgress(false);
                  console.log(`📄 Page switch to ${toPageId} complete`);
                }, 500);
              }}
              onPageReset={handlePageReset}
              onGenerateVisualization={async (sentence: string, validation: any, pageId: string) => {
                // When NarrativeLayer wants to generate visualization, 
                // Add info node to canvas
                if (reactFlowCanvasRef.current) {
                  let content = `Sentence: "${sentence}"\n\nSupported: ${validation.inquiry_supported ? 'Yes' : 'No'}\n\nExplanation: ${validation.explanation || 'No explanation provided'}`;
                  
                  // If supported, get detailed visualization recommendations
                  if (validation.inquiry_supported) {
                    try {
                      // Show loading state and clear existing nodes
                      reactFlowCanvasRef.current.showLoadingState('Generating AI-powered visualization recommendations...');
                      
                      const recommendation = await getVisualizationRecommendation(
                        sentence,
                        'London demographic, transport, housing, and crime data',
                        ['London Demographics', 'Transport Data', 'Housing Statistics', 'Crime Reports']
                      );
                      
                      // Hide loading state
                      reactFlowCanvasRef.current.hideLoadingState();
                      
                      // Format the enhanced content based on response type
                      if (isDashboardRecommendation(recommendation)) {
                        // Dashboard format
                        content += `\n\n📊 DASHBOARD: ${recommendation.dashboardTitle}\n`;
                        content += `📋 NARRATIVE: ${recommendation.overallNarrative}\n\n`;
                        
                        content += `💡 KEY INSIGHTS:\n`;
                        recommendation.insightPanels.forEach((insight, index) => {
                          content += `   • ${insight}\n`;
                        });
                        content += `\n`;
                        
                        content += `📈 DASHBOARD VIEWS (${recommendation.views.length}):\n\n`;
                        recommendation.views.forEach((view, index) => {
                          content += `${index + 1}. ${view.viewType.toUpperCase()}\n`;
                          content += `   Description: ${view.description}\n`;
                          content += `   Data: ${view.dataColumns.join(', ')}\n`;
                          content += `   Analysis: ${view.aggregations.join(', ')}\n`;
                          content += `   Interactions: ${view.interactions.join(', ')}\n`;
                          content += `   Purpose: ${view.purpose}\n\n`;
                        });
                        
                        content += `💾 DATASETS NEEDED:\n${recommendation.datasetRecommendations.join(', ')}`;
                        
                      } else {
                        // Charts-only format
                        content += `\n\n📊 VISUALIZATION STRATEGY:\n${recommendation.overallStrategy}\n\n`;
                        content += `📈 RECOMMENDED VIEWS (${recommendation.totalViews}):\n\n`;
                        
                        recommendation.views.forEach((view, index) => {
                          content += `${index + 1}. ${view.viewType.toUpperCase()}\n`;
                          content += `   Description: ${view.description}\n`;
                          content += `   Data: ${view.dataColumns.join(', ')}\n`;
                          content += `   Analysis: ${view.aggregations.join(', ')}\n`;
                          content += `   Interactions: ${view.interactions.join(', ')}\n`;
                          content += `   Purpose: ${view.purpose}\n\n`;
                        });
                        
                        content += `💾 DATASETS NEEDED:\n${recommendation.datasetRecommendations.join(', ')}`;
                      }
                      
                    } catch (error) {
                      console.error('❌ Failed to get visualization recommendations:', error);
                      // Hide loading state even on error
                      reactFlowCanvasRef.current.hideLoadingState();
                      content += '\n\n⚠️ Unable to generate detailed recommendations at this time.';
                    }
                  }
                  
                  reactFlowCanvasRef.current.addInfoNode({
                    title: validation.inquiry_supported ? 'Visualization Plan' : 'Analysis Result',
                    content: content
                  });
                }
              }}
            />
          ) : (
            <DatasetExplorer 
              onAnalysisRequest={handleAnalysisRequest}
              onFileSelection={handleFileSelection}
              isAnalyzing={isAnalyzing || summaryLoading}
            />
          )}
        </div>

        {/* Right Section - 60% */}
        <div className="right-sec w-3/5 flex flex-col">
          {/* View Canvas - 75% */}
          <div className="view-canvas h-3/4 bg-white relative overflow-hidden">
            {/* Canvas Action Buttons - Only show when dashboard is visible */}
            {showDashboard && (
              <div className="absolute top-4 right-4 z-50 flex gap-2">
                <div className="relative group">
                  <button
                    onClick={async () => {
                      // Check conditions for disabling the capture button
                      const hasInteractions = interactionCount > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes;
                      
                      // Prevent clicks if capturing, has pending suggestion, or no interactions made yet
                      if (isDisabled) return;
                      
                      setIsCapturingInsights(true);
                      // narrativeSystemRef.current?.showLoadingSuggestion();
                      
                      try {
                        // Capture interactions and get the last 5
                        const capturedInteractions = captureAndLogInteractions();
                        
                        // Also clear the local dashboard interactions state
                        setDashboardInteractions([]);
                        console.log('🧹 Local dashboard interactions cleared');
                        
                        // Get narrative content from the current page
                        const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                        const narrativeContext = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                        const currentSentence = ''; // We'll need to implement getCurrentSentence for paged system
                        
                        // console.log('📝 Captured narrative context:', narrativeContext);
                        // console.log('📍 Current sentence at cursor:', currentSentence);
                        
                        // Call OpenAI to capture insights with the interaction data
                        // console.log('🤖 Calling OpenAI to capture insights...');
                        const suggestion = await captureInsights(
                          capturedInteractions,
                          narrativeContext, // Use actual narrative content
                          currentSentence // Use current sentence where cursor is positioned
                        );
                        
                        if (suggestion && suggestion.narrative_suggestion) {
                          // console.log('✅ OpenAI suggestion received:', suggestion);
                          // Show the suggestion in the narrative system
                          const currentPageId = narrativeSystemRef.current?.getCurrentPageId();
                          if (currentPageId) {
                            narrativeSystemRef.current?.showSuggestion(suggestion, currentPageId);
                          }
                        } else {
                          // console.log('ℹ️ No suggestion generated from current interactions');
                          // narrativeSystemRef.current?.hideLoadingSuggestion();
                        }
                      } catch (error) {
                        // console.error('❌ Failed to capture insights:', error);
                        // narrativeSystemRef.current?.hideLoadingSuggestion();
                      } finally {
                        setIsCapturingInsights(false);
                      }
                    }}
                    disabled={(() => {
                      const hasInteractions = interactionCount > 0;
                      return isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes;
                    })()}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 border ${
                      (() => {
                        const hasInteractions = interactionCount > 0;
                        const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes;
                        return isDisabled ? 'opacity-60 cursor-not-allowed' : '';
                      })()
                    }`}
                    style={(() => {
                      const hasInteractions = interactionCount > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes;
                      return {
                        backgroundColor: isDisabled ? '#e5e7eb' : '#c5cea180', 
                        color: isDisabled ? '#6b7280' : '#5a6635',
                        borderColor: isDisabled ? '#d1d5db' : '#c5cea1'
                      };
                    })()}
                    onMouseEnter={(e) => {
                      const hasInteractions = interactionCount > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes;
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = '#c5cea1b3';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const hasInteractions = interactionCount > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes;
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = '#c5cea180';
                      }
                    }}
                  >
                    {isCapturingInsights ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Capturing...
                      </>
                    ) : (
                      'Capture'
                    )}
                  </button>
                  {/* Custom tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-60">
                    {(() => {
                      const hasInteractions = interactionCount > 0;
                      if (!hasInteractions) {
                        return 'Interact with the dashboard first to capture insights';
                      } else if (hasActiveInfoNodes) {
                        return 'Close info nodes before capturing insights';
                      } else if (hasPendingSuggestion) {
                        return 'Accept or deny the current suggestion first';
                      } else if (isCapturingInsights) {
                        return 'Generating insight...';
                      } else {
                        return 'Capture insight for recent interactions';
                      }
                    })()}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => console.log('Inquiries button clicked')}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 border"
                    style={{ 
                      backgroundColor: '#f5bc7880', 
                      color: '#8b5a2b',
                      borderColor: '#f5bc78'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5bc78b3';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5bc7880';
                    }}
                  >
                    Inquiries
                  </button>
                  {/* Custom tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-60">
                    View questions about this view
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>
              </div>
            )}
            
            {showDashboard && shouldShowLondonDashboard ? (
              <ReactFlowCanvas 
                ref={reactFlowCanvasRef}
                key="london-flow-canvas"
                showDashboard={true}
                dashboardConfig={{
                  name: 'London Housing Dashboard',
                  width: 1500,
                  height: 1000,
                  minWidth: 800,
                  minHeight: 600,
                  maxWidth: 1500,
                  maxHeight: 1200,
                }}
              >
                <LondonDashboard onInteraction={logDashboardInteraction} />
              </ReactFlowCanvas>
            ) : isAnalyzing ? (
              <div className="relative w-full h-full">
                <EmptyCanvas />
                {isAnalyzing && (
                  <AnalyzingState 
                    prompt={currentPrompt}
                    onStop={handleStopAnalysis}
                  />
                )}
              </div>
            ) : selectedFiles.length > 0 ? (
              <FileSummaryCanvas 
                summaries={fileSummaries}
                isLoading={summaryLoading}
                error={summaryError}
              />
            ) : (
              <EmptyCanvas />
            )}
          </div>

          {/* Timeline Div - 25% */}
          <div className="timeline-div h-1/4 bg-gray-100 border-t border-gray-200 p-4">
            <div className="h-full bg-white rounded-lg shadow-sm">
              {(() => {
                const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                const currentTimeline = insightTimelinesByPage[currentPageId]?.groups || [];
                const currentPageTree = narrativeSystemRef.current?.getCurrentPageTree();
                const currentActivePath = currentPageTree?.activePath || []; // Get the current active path from the narrative system
                const isTimelineLoading = timelineLoadingByPage[currentPageId] || false;
                
                // Handle path switching from timeline clicks
                const handlePathSwitch = (nodeId: string, newActivePath: string[]) => {
                  console.log(`🔄 Timeline path switch requested for node ${nodeId} on page ${currentPageId}`);
                  console.log(`🛤️ New path:`, newActivePath);
                  
                  if (narrativeSystemRef.current) {
                    const success = narrativeSystemRef.current.switchActivePath(currentPageId, nodeId, newActivePath);
                    if (success) {
                      console.log(`✅ Successfully switched active path`);
                      
                      // Call branch switch callback to handle timeline updates
                      if (handleBranchSwitch) {
                        handleBranchSwitch(nodeId, currentPageId);
                      }
                    } else {
                      console.error(`❌ Failed to switch active path`);
                    }
                  } else {
                    console.error(`❌ narrativeSystemRef.current is null`);
                  }
                };
                
                return currentTimeline.length > 0 || isTimelineLoading ? (
                  <TimelineVisualization 
                    nodes={currentTimeline}
                    pageId={currentPageId}
                    activePath={currentActivePath}
                    isLoading={isTimelineLoading}
                    onPathSwitch={handlePathSwitch}
                  />
                ) : (
                  <EmptyTimeline />
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  /*
  // OLD: Development helper - now handled by PagedNarrativeSystem
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).deleteSentenceFromTree = deleteSentenceFromTree;
      (window as any).deleteBranchFromTree = deleteBranchFromTree;
      (window as any).insertNodeAfter = insertNodeAfter;
      (window as any).exportSentenceTree = exportSentenceTree;
      (window as any).sentenceNodes = sentenceNodes;
      console.log('🧪 Development helpers available:');
      console.log('  - window.deleteSentenceFromTree(sentenceContentOrId)');
      console.log('  - window.deleteBranchFromTree(branchId)');
      console.log('  - window.insertNodeAfter(afterSentenceContent, newSentenceContent)');
      console.log('  - window.exportSentenceTree()');
      console.log('  - window.sentenceNodes (current tree state)');
    }
  }, [deleteSentenceFromTree, deleteBranchFromTree, insertNodeAfter, exportSentenceTree, sentenceNodes]);
  */
}


