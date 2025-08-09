'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DatasetExplorer from '../components/DatasetExplorer';
import NarrativeLayer, { NarrativeLayerRef } from '../components/NarrativeLayer';
import FileSummaryCanvas from '../components/FileSummaryCanvas';
import { EmptyCanvas, EmptyTimeline, AnalyzingState } from '../components/EmptyStates';
import ReactFlowCanvas, { ReactFlowCanvasRef } from '../components/ReactFlowCanvas';
import LondonDashboard from '../london/page'; //this should be a different input after you have the right component for dashboard
import { generateMultipleFileSummaries, FileSummary } from '../../utils/londonDataLoader';
import { interactionLogger } from '../../lib/interactionLogger';
import { captureAndLogInteractions, getCapturedInteractionCount } from '../utils/dashboardConfig';
import { captureInsights, NarrativeSuggestion } from '../LLMs/suggestion_from_interaction';
import { getVisualizationRecommendation, VisualizationRecommendation, isDashboardRecommendation } from '../LLMs/visualizationRecommendation';
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
  const narrativeLayerRef = useRef<NarrativeLayerRef>(null);
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
  }, []);

  // Insight timeline state - initially empty
  const [insightTimeline, setInsightTimeline] = useState<{
    groups: Array<{
      group_id: number;
      sentence_indices: number[];
      parent_id: string;
      child_ids: string[];
      hover: {
        title: string;
        source: {
          dataset: string | string[];
          geo: string | string[];
          time: string | string[];
          measure: string | string[];
          unit: string;
        };
        changed_from_previous: {
          drift_types: string[];
          severity: string;
          dimensions: Record<string, string>;
        } | null;
        reflect: string[];
      };
    }>
  }>({ groups: [] });

  // Define simplified sentence node structure for linear narratives with branching
  interface SentenceNode {
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
            console.log('🔧 Loaded user from localStorage:', user);
            
            // Ensure userId is set - fallback to username or create one
            if (!user.userId) {
              user.userId = user.username || `user_${user.participantId || Date.now()}`;
              console.log('🔧 Set fallback userId:', user.userId);
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
          console.log('🔧 Using demo user:', demoUser);
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
      console.log('🔧 Initializing interaction logger with user session:', userSession);
      
      // Ensure we have all required fields
      const userId = userSession.userId || userSession.username || `user_${userSession.participantId}`;
      const participantId = userSession.participantId;
      const sessionId = userSession.sessionId || `session_${userSession.participantId}_${Date.now()}`;
      
      console.log('🔧 User context for logger:', { userId, participantId, sessionId });
      
      interactionLogger.initialize({
        userId,
        participantId,
        sessionId
      }, isStudyMode);
    }
  }, [userSession, isStudyMode]);

  // Track info node status from ReactFlow canvas
  useEffect(() => {
    const checkInfoNodes = () => {
      if (reactFlowCanvasRef.current) {
        const hasActive = reactFlowCanvasRef.current.hasActiveInfoNode();
        setHasActiveInfoNodes(hasActive);
      }
    };

    // Check immediately
    checkInfoNodes();

    // Set up an interval to check periodically
    const interval = setInterval(checkInfoNodes, 500);

    return () => clearInterval(interval);
  }, [showDashboard]); // Re-run when dashboard visibility changes

  // Handle analysis request
  const handleAnalysisRequest = async (prompt: string) => {
    console.log('🚀 Starting analysis for prompt:', prompt);
    
    setCurrentPrompt(prompt);
    setIsAnalyzing(true);
    
    // Log the generate dashboard interaction manually
    try {
      console.log('📊 Logging dashboard generation with:', {
        prompt,
        userContext: interactionLogger.userContext,
        isStudyMode: interactionLogger.isStudyMode
      });
      
      await interactionLogger.logDashboardGeneration(prompt);
      console.log('✅ Dashboard generation logged successfully');
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
    if (!narrativeLayerRef.current) {
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
        console.log(`✅ Updated content for editable node ${nodeId}: "${newContent}"`);
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

  // Handle sentence end detection for narrative layer - now with tree structure
  const handleSentenceEnd = async (sentence: string, confidence: number) => {
    // Handle branch creation messages
    if (sentence.startsWith('BRANCH_CREATED:')) {
      const originalSentence = sentence.replace('BRANCH_CREATED:', '');
      
      // Find the parent sentence node and mark it as having branches
      setSentenceNodes(prev => {
        const newMap = new Map(prev);
        for (const [id, node] of newMap.entries()) {
          if (node.content === originalSentence) {
            const updatedNode = {
              ...node,
              metadata: {
                ...node.metadata,
                hasBranches: true,
                branchCreatedTime: typeof window !== 'undefined' ? Date.now() : 0
              }
            };
            newMap.set(id, updatedNode);
            break;
          }
        }
        return newMap;
      });
      return;
    }
    
    // console.log(`🧠 Sentence completed for analysis: "${sentence}" (Confidence: ${confidence})`);
    
    // Get the current completed sentences directly from DOM (in correct order)
    const currentCompletedSentences = getCompletedSentencesFromDOM();
    // console.log('📝 Completed sentences array (in DOM order):', currentCompletedSentences);
    
    // Update or create sentence nodes based on DOM structure with simplified linear chaining
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      const newActivePath: string[] = [];
      let previousNodeId: string | null = null;
      
      currentCompletedSentences.forEach((sentenceData, index) => {
        // Look for existing node with this content
        let existingNode: SentenceNode | undefined;
        for (const [id, node] of newMap.entries()) {
          if (node.content === sentenceData.content) {
            existingNode = node;
            break;
          }
        }
        
        if (existingNode) {
          // Update existing node
          const updatedNode = {
            ...existingNode,
            isCompleted: true,
            revisedTime: typeof window !== 'undefined' ? Date.now() : 0,
            metadata: { ...existingNode.metadata, confidence }
          };
          newMap.set(existingNode.id, updatedNode);
          newActivePath.push(existingNode.id);
          
          // Link to previous sentence if this is part of linear flow
          if (previousNodeId && !existingNode.parent) {
            const prevNode = newMap.get(previousNodeId);
            if (prevNode && !prevNode.children.includes(existingNode.id)) {
              // Add this node as child of previous node
              const updatedPrevNode = {
                ...prevNode,
                children: [...prevNode.children, existingNode.id]
              };
              newMap.set(previousNodeId, updatedPrevNode);
              
              // Set parent relationship
              updatedNode.parent = previousNodeId;
              newMap.set(existingNode.id, updatedNode);
            }
          }
          
          previousNodeId = existingNode.id;
        } else {
          // Create new node with linear parent relationship
          const newNode = createSentenceNode(
            sentenceData.content, 
            previousNodeId // Set parent as the previous sentence
          );
          newNode.isCompleted = true;
          newNode.metadata = { confidence };
          
          newMap.set(newNode.id, newNode);
          newActivePath.push(newNode.id);
          
          // Link to previous sentence
          if (previousNodeId) {
            const prevNode = newMap.get(previousNodeId);
            if (prevNode) {
              const updatedPrevNode = {
                ...prevNode,
                children: [...prevNode.children, newNode.id],
                // Set as active child: if parent has no active child, or only one child, this becomes active
                activeChild: prevNode.children.length === 0 ? newNode.id : prevNode.activeChild
              };
              newMap.set(previousNodeId, updatedPrevNode);
            }
          }
          
          previousNodeId = newNode.id;
        }
      });
      
      // Update active path
      setActivePath(newActivePath);
      
      // Debug: Log the tree structure to understand activeChild relationships
      console.log('🌳 Tree structure after sentence processing:');
      for (const [id, node] of newMap.entries()) {
        if (node.children.length > 1) {
          console.log(`🌿 BRANCH DETECTED: "${node.content}" has ${node.children.length} children (activeChild: ${node.activeChild ? newMap.get(node.activeChild)?.content : 'none'}):`);
          node.children.forEach(childId => {
            const child = newMap.get(childId);
            const isActive = childId === node.activeChild ? ' ⭐' : '';
            console.log(`  └── "${child?.content}"${isActive}`);
          });
        } else if (node.children.length === 1) {
          const child = newMap.get(node.children[0]);
          const isActive = node.children[0] === node.activeChild ? ' ⭐' : '';
          console.log(`📝 "${node.content}" → "${child?.content}"${isActive}`);
        } else {
          console.log(`🔚 "${node.content}" (end node)`);
        }
      }
      
      // console.log('📝 Updated sentence nodes:', newMap.size, 'nodes');
      // console.log('🛤️ New active path:', newActivePath);
      // console.log('📊 Current sentences:', currentCompletedSentences);
      
      // Check completion status with the updated map (not the old state)
      setTimeout(() => {
        const allCompleted = checkAllSentencesCompleted();
        // console.log('🔍 Checking completion status:', {
        //   allCompleted,
        //   triggeredBy: sentence,
        //   confidence,
        //   treeNodesCount: newMap.size,
        //   domSentencesCount: currentCompletedSentences.length
        // });
        
        if (allCompleted) {
          const finalSentences = getCompletedSentencesFromDOM();
          //call the LLM here

          // console.log('🎉 All sentences in narrative are completed!');
          console.log('📊 Final completed sentences array (in correct order):', finalSentences);
          
          // Create the export data with the updated map (not the old state)
          const exportData = {
            nodes: Array.from(newMap.entries()).map(([nodeId, node]) => ({ nodeId, ...node })),
            activePath: newActivePath,
            stats: {
              totalNodes: newMap.size,
              completedNodes: Array.from(newMap.values()).filter(n => n.isCompleted).length,
              branchedNodes: Array.from(newMap.values()).filter(n => n.children.length > 1).length,
              rootNodes: Array.from(newMap.values()).filter(n => !n.parent).length,
              averageEditCount: Array.from(newMap.values()).reduce((sum, n) => sum + n.editCount, 0) / newMap.size || 0,
              activePath: newActivePath.length
            },
            exportedAt: typeof window !== 'undefined' ? Date.now() : 0
          };
          
          console.log('🌳 Complete Sentence Tree Structure:', exportData);
          
          // Also log the computed completedSentences array for compatibility
          console.log('📝 Computed completed sentences (legacy format):', 
            finalSentences.map(s => s.content)
          );
        } else {
        }
      }, 150); // Slightly longer delay to ensure DOM is fully updated
      
      return newMap;
    });
    
    // Here you can add your LLM API call or other analysis logic
    try {
      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 1000));
      // console.log(`✅ Analysis complete for: "${sentence}"`);
      
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
          timestamp: typeof window !== 'undefined' ? Date.now() : 0
        }
      });
    } catch (error) {
      console.error('❌ Error analyzing sentence:', error);
    }
  };

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
        console.warn(`⚠️ Node with content "${sentenceContent}" found but not in active path. This might cause content update issues.`);
        return nodeId;
      }
    }
    
    console.error(`❌ No node found with content: "${sentenceContent}"`);
    return null;
  };

  // Helper function to get branches for a specific sentence (simplified)
  const getBranchesForSentence = useCallback((sentenceContent: string): Array<{
    id: string;
    content: string;
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
      type: 'branch' | 'original_continuation';
    }> = [];
    
    targetNode.children.forEach(childId => {
      const childNode = sentenceNodes.get(childId);
      if (childNode) {
        // Determine if this is the original continuation or a branch
        // The first child is likely the original continuation if it was created in sequence
        const isOriginalContinuation = targetNode.children[0] === childId && 
          !childNode.content.includes('Alternative continuation from:');
        
        branches.push({
          id: childId,
          content: childNode.content,
          type: isOriginalContinuation ? 'original_continuation' : 'branch'
        });
      }
    });
    
    return branches;
  }, [sentenceNodes]);
  
  // Helper function to switch to a specific branch
  const handleSwitchToBranch = useCallback((branchId: string) => {
    const branchNode = sentenceNodes.get(branchId);
    if (!branchNode) {
      console.error('❌ Cannot switch to branch: node not found');
      return;
    }
    
    // Find the path from root to this branch
    const newPath = findSentencePath(branchId);
    setActivePath(newPath);
    
    console.log(`🔄 Switching to branch ${branchId}, updating main editor`);
    
    // Update active child relationships along the path
    setSentenceNodes(prev => {
      const newMap = new Map(prev);
      
      // Update activeChild for each parent in the path
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
          console.log(`🎯 Set activeChild for "${currentNode.content}" to "${newMap.get(nextNodeId)?.content}"`);
        }
      }
      
      return newMap;
    });
    
    // Reconstruct the narrative from the new active path
    setTimeout(() => {
      const narrativeText = newPath
        .map(nodeId => {
          const node = sentenceNodes.get(nodeId);
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
      if (narrativeLayerRef.current) {
        console.log(`📝 Updating main editor with branch narrative: "${narrativeText}"`);
        narrativeLayerRef.current.updateContent(narrativeText);
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
    console.log(`📝 Attempting to update branch content for ${branchId}: "${newContent}"`);
    
    // STRICT PROTECTION: Only allow content updates for nodes explicitly in edit mode
    if (!editableNodes.has(branchId)) {
      console.warn(`🚫 BLOCKED: Cannot update content for node ${branchId} - not in edit mode. Content updates are only allowed when user explicitly enters edit mode.`);
      return;
    }
    
    // Prevent content updates during branch creation
    if (isCreatingBranch) {
      console.warn(`⚠️ Ignoring content update during branch creation for ${branchId}`);
      return;
    }
    
    // Prevent immediate content updates to recently created nodes
    if (recentlyCreatedNodes.has(branchId)) {
      console.warn(`⚠️ Ignoring content update to recently created node ${branchId}. Content should be set during creation.`);
      return;
    }
    
    // First, validate that this branch actually exists and should be updated
    const branchNode = sentenceNodes.get(branchId);
    if (!branchNode) {
      console.error(`❌ Cannot update branch: node ${branchId} not found`);
      return;
    }
    
    // Check if the content is actually different
    if (branchNode.content === newContent) {
      console.log(`📝 Content unchanged for ${branchId}, skipping update`);
      return;
    }
    
    console.log(`📝 AUTHORIZED content change for ${branchId}: "${branchNode.content}" → "${newContent}"`);
    
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
        console.log(`✅ Updated content for editable node ${branchId}: "${newContent}"`);
        
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
            if (narrativeLayerRef.current) {
              console.log(`📝 Updating main editor with updated narrative: "${narrativeText}"`);
              narrativeLayerRef.current.updateContent(narrativeText);
            }
          }, 100);
        } else {
          console.log(`📝 Updated node ${branchId} is not in active path, main editor unchanged`);
        }
      } else {
        console.error(`❌ Cannot update branch: node ${branchId} not found in map`);
      }
      
      return newMap;
    });
  }, [sentenceNodes, activePath, isCreatingBranch, recentlyCreatedNodes, editableNodes]);
  
  // Functions to manage edit mode for nodes
  const enterEditMode = useCallback((nodeId: string) => {
    console.log(`📝 Entering edit mode for node ${nodeId}`);
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
        
        if (narrativeLayerRef.current) {
          console.log(`📝 Updating main editor with new branch narrative: "${narrativeText}"`);
          narrativeLayerRef.current.updateContent(narrativeText);
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
    
    console.warn(`🚫 BLOCKED: Content change detected but ignored. Old: "${oldContent.substring(0, 50)}..." New: "${newContent.substring(0, 50)}..."`);
    console.warn(`🚫 Content updates to existing sentences are not allowed. Only new sentence creation and explicit edit mode are permitted.`);
    
    // COMPLETELY DISABLED - we never want to update existing sentence content automatically
    // If content needs to be updated, it must be done through explicit edit mode (double-click)
    
    return; // Early return - no content updates allowed
    
    // OLD CODE BELOW - KEPT FOR REFERENCE BUT NEVER EXECUTED
    // console.log(`📝 Content changed from: "${oldContent.substring(0, 50)}..." to: "${newContent.substring(0, 50)}..."`);
    
    // Find all sentences in old content and new content
    // const oldSentences = oldContent.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim());
    // const newSentences = newContent.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim());
    
    // Update sentence nodes for changed content
    // setSentenceNodes(prev => {
    //   const newMap = new Map(prev);
    //   
    //   // Find nodes that need content updates
    //   for (let i = 0; i < Math.max(oldSentences.length, newSentences.length); i++) {
    //     const oldSentence = oldSentences[i];
    //     const newSentence = newSentences[i];
    //     
    //     if (oldSentence && newSentence && oldSentence !== newSentence) {
    //       // Find the node with old content and update it
    //       for (const [nodeId, node] of newMap.entries()) {
    //         if (node.content === oldSentence) {
    //           newMap.set(nodeId, { ...node, content: newSentence });
    //           console.log(`🔄 Updated node ${nodeId} content from "${oldSentence}" to "${newSentence}"`);
    //           break;
    //         }
    //       }
    //     }
    //   }
    //   
    //   return newMap;
    // });
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
        editableNodes,
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
  const handleSentenceSelect = (sentence: string, index: number) => {
    // console.log(`📝 Sentence selected: "${sentence}" (Index: ${index})`);
    
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
        timestamp: Date.now()
      }
    });
  };

  // Handle stopping analysis
  const handleStopAnalysis = () => {
    setIsAnalyzing(false);
  };

  // Handle suggestion state changes
  const handleSuggestionReceived = (suggestion: NarrativeSuggestion) => {
    setHasPendingSuggestion(true);
  };

  // Handle suggestion accepted/denied
  const handleSuggestionResolved = () => {
    setHasPendingSuggestion(false);
  };

  // Use effect to check and update suggestion state periodically when needed
  useEffect(() => {
    if (narrativeLayerRef.current) {
      const hasActiveSuggestion = narrativeLayerRef.current.hasPendingSuggestion();
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
            <NarrativeLayer 
              ref={narrativeLayerRef}
              prompt={currentPrompt}
              onSentenceEnd={handleSentenceEnd}
              onSentenceSelect={handleSentenceSelect}
              onSuggestionReceived={handleSuggestionReceived}
              onSuggestionResolved={handleSuggestionResolved}
              disableInteractions={hasActiveInfoNodes}
              onContentChange={handleContentChange}
              getBranchesForSentence={getBranchesForSentence}
              onSwitchToBranch={handleSwitchToBranch}
              onCreateBranch={handleCreateBranch}
              onUpdateBranchContent={handleUpdateBranchContent}
              onGenerateVisualization={async (sentence: string, validation: any) => {
                // When NarrativeLayer wants to generate visualization, 
                // Add info node to canvas
                if (reactFlowCanvasRef.current) {
                  let content = `Sentence: "${sentence}"\n\nSupported: ${validation.inquiry_supported ? 'Yes' : 'No'}\n\nExplanation: ${validation.explanation || 'No explanation provided'}`;
                  
                  // If supported, get detailed visualization recommendations
                  if (validation.inquiry_supported) {
                    try {
                      // Show loading state and clear existing nodes
                      reactFlowCanvasRef.current.showLoadingState('Generating AI-powered visualization recommendations...');
                      
                      console.log('🎯 Getting detailed visualization recommendations...');
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
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions;
                      
                      // Prevent clicks if capturing, has pending suggestion, or no interactions made yet
                      if (isDisabled) return;
                      
                      setIsCapturingInsights(true);
                      narrativeLayerRef.current?.showLoadingSuggestion();
                      
                      try {
                        // Capture interactions and get the last 5
                        const capturedInteractions = captureAndLogInteractions();
                        
                        // Also clear the local dashboard interactions state
                        setDashboardInteractions([]);
                        console.log('🧹 Local dashboard interactions cleared');
                        
                        // Get narrative content and current sentence from the narrative layer
                        const narrativeContext = narrativeLayerRef.current?.getFullText() || '';
                        const currentSentence = narrativeLayerRef.current?.getCurrentSentence() || '';
                        
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
                          // Show the suggestion in the narrative layer
                          narrativeLayerRef.current?.showSuggestion(suggestion);
                        } else {
                          // console.log('ℹ️ No suggestion generated from current interactions');
                          narrativeLayerRef.current?.hideLoadingSuggestion();
                        }
                      } catch (error) {
                        // console.error('❌ Failed to capture insights:', error);
                        narrativeLayerRef.current?.hideLoadingSuggestion();
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
              {insightTimeline.groups.length > 0 ? (
                <div className="h-full p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Insight Timeline</h3>
                  <div className="space-y-2">
                    {insightTimeline.groups.map((group, index) => (
                      <div 
                        key={group.group_id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500">
                            Group {group.group_id} • Sentences: {group.sentence_indices.join(', ')}
                          </span>
                          {group.hover.changed_from_previous && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              group.hover.changed_from_previous.severity === 'critical' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {group.hover.changed_from_previous.severity}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-800 mb-1">
                          {group.hover.title}
                        </h4>
                        <div className="text-xs text-gray-600">
                          <div className="mb-1">
                            <strong>Source:</strong> {
                              Array.isArray(group.hover.source.dataset) 
                                ? group.hover.source.dataset.join(', ')
                                : group.hover.source.dataset
                            }
                          </div>
                          {group.hover.changed_from_previous && (
                            <div className="text-xs text-red-600">
                              <strong>Changes:</strong> {group.hover.changed_from_previous.drift_types.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyTimeline />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


