'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MdChevronLeft, MdChevronRight, MdAdd, MdDelete } from 'react-icons/md';
import NarrativeLayer, { NarrativeLayerRef } from './NarrativeLayer';
import { NarrativeSuggestion } from '../LLMs/suggestion_from_interaction';

// Individual page interface - each page has its own tree structure
interface NarrativePage {
  id: string;
  rootSentenceNodeId: string | null; // Root node of this page's tree structure
  sentenceNodes: Map<string, SentenceNode>; // This page's sentence tree
  activePath: string[]; // Current active path through this page's tree
  hasContent: boolean; // Whether user has typed something in this page
  createdAt: number;
  lastModified: number;
  title?: string; // Optional page title
}

// Sentence node structure (same as before, but per-page)
interface SentenceNode {
  pageId: string; // page this node belongs to
  id: string;
  content: string;
  parent: string | null;
  children: string[];
  activeChild: string | null;
  createdTime: number;
  revisedTime: number;
  editCount: number;
  isCompleted: boolean;
  metadata?: {
    confidence?: number;
    analysisResult?: any;
    [key: string]: any;
  };
}

interface PagedNarrativeSystemProps {
  prompt: string;
  onSentenceSelect?: (sentence: string, index: number, pageId: string) => void;
  onSentenceEnd?: (sentence: string, confidence: number, pageId: string) => void;
  onSuggestionReceived?: (suggestion: NarrativeSuggestion, pageId: string) => void;
  onSuggestionResolved?: (pageId: string) => void;
  onGenerateVisualization?: (sentence: string, validation: any, pageId: string) => void;
  disableInteractions?: boolean;
  onContentChange?: (oldContent: string, newContent: string, pageId: string) => void;
  onSentenceEdit?: (oldContent: string, newContent: string, nodeId: string, pageId: string) => void; // NEW: Callback for save button edits
  onPageChange?: (fromPageId: string, toPageId: string) => void;
  onBranchSwitch?: (branchId: string, pageId: string) => void; // Called when user switches between branches
  onBranchDelete?: (branchId: string, pageId: string) => void; // Called when user deletes a branch
  onSentenceDelete?: (sentenceId: string, pageId: string) => void; // Called when user deletes a sentence
  onPageReset?: (pageId: string) => void; // Called when user resets a page
  maxPages?: number; // Maximum number of pages allowed
}

export interface PagedNarrativeSystemRef {
  getCurrentPageId: () => string;
  getPageContent: (pageId: string) => string;
  getAllPagesContent: () => { pageId: string; content: string; title?: string }[];
  getCurrentPageTree: () => { nodes: SentenceNode[]; activePath: string[] };
  getPageTree: (pageId: string) => { nodes: SentenceNode[]; activePath: string[] } | null;
  getAllPageTrees: () => {[pageId: string]: { nodes: Array<any>; activePath: string[] }};
  getPageTreeFromDict: (pageId: string) => { nodes: Array<any>; activePath: string[] } | null;
  createNewPage: () => string;
  switchToPage: (pageId: string) => void;
  deletePage: (pageId: string) => boolean;
  clearPageContent: (pageId?: string) => boolean;
  showSuggestion: (suggestion: NarrativeSuggestion, pageId?: string) => void;
  hasPendingSuggestion: () => boolean;
  updateSentenceContent: (pageId: string, oldContent: string, newContent: string) => boolean;
  switchActivePath: (pageId: string, targetNodeId: string, newActivePath: string[]) => boolean;
  highlightSentence: (sentenceContent: string) => boolean; // NEW: Highlight sentence in narrative layer
  highlightSentencesByIds: (sentenceIds: string[]) => boolean; // NEW: Highlight multiple sentences by their IDs
  // NEW: Initialize with tree structure from example data
  initializeWithExampleTree: (explorationPath: Array<{
    sentence_id: number;
    sentence_content: string;
    children: number[];
    parent: number | null;
  }>) => void;
  // Debug helpers
  debugCreateTestBranches?: () => void;
  debugGetCurrentTreeState?: () => any;
  debugTestGetBranches?: (sentenceContent?: string) => any;
  debugCreateBranch?: (fromSentenceContent: string, branchContent: string) => string | null;
  debugGetTreeDict?: () => any;
}

const PagedNarrativeSystem = forwardRef<PagedNarrativeSystemRef, PagedNarrativeSystemProps>(({
  prompt,
  onSentenceSelect,
  onSentenceEnd,
  onSuggestionReceived,
  onSuggestionResolved,
  onGenerateVisualization,
  disableInteractions = false,
  onContentChange,
  onSentenceEdit,
  onPageChange,
  onBranchSwitch,
  onBranchDelete,
  onSentenceDelete,
  onPageReset,
  maxPages = 10
}, ref) => {
  // Core state
  const [pages, setPages] = useState<Map<string, NarrativePage>>(new Map());
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [pageOrder, setPageOrder] = useState<string[]>([]);
  
  // Tree tracking state - maps pageId to its tree structure
  const [pageTreeDict, setPageTreeDict] = useState<{[pageId: string]: {
    nodes: Array<{
      pageId: string;
      id: string;
      content: string;
      parent: string | null;
      children: string[];
      activeChild: string | null;
      isCompleted: boolean;
    }>;
    activePath: string[];
  }}>({});
  
  // UI state
  const [canCreateNewPage, setCanCreateNewPage] = useState(false);
  
  // Edit state - track which sentence is currently being edited
  const [currentEditSentenceId, setCurrentEditSentenceId] = useState<string | null>(null);
  
  // Refs for current page's narrative layer
  const currentNarrativeRef = useRef<NarrativeLayerRef>(null);
  
  // 🛡️ Add ref to track recent branch creation to prevent duplicates
  const recentBranchCreationRef = useRef<Map<string, number>>(new Map());
  
  // Generate unique page ID
  const generatePageId = useCallback(() => {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Generate unique sentence ID (same as before but per-page)
  const generateSentenceId = useCallback(() => {
    return `sentence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new page
  const createNewPage = useCallback(() => {
    if (pages.size >= maxPages) {
      console.warn(`Maximum number of pages (${maxPages}) reached`);
      return '';
    }

    const pageId = generatePageId();
    const newPage: NarrativePage = {
      id: pageId,
      rootSentenceNodeId: null,
      sentenceNodes: new Map(),
      activePath: [],
      hasContent: false,
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    setPages(prev => new Map(prev.set(pageId, newPage)));
    setPageOrder(prev => [...prev, pageId]);
    
    // Initialize empty tree for the new page
    setPageTreeDict(prev => ({
      ...prev,
      [pageId]: {
        nodes: [],
        activePath: []
      }
    }));
    
    
    return pageId;
  }, [pages.size, maxPages, generatePageId]);

  // Initialize with first page
  useEffect(() => {
    if (pages.size === 0) {
      const firstPageId = createNewPage();
      setCurrentPageId(firstPageId);
    }
  }, [pages.size, createNewPage]);

  // Sync narrative editor content when currentPageId changes or when page content is updated
  useEffect(() => {
    if (currentPageId && pages.has(currentPageId) && currentNarrativeRef.current) {
      const currentPage = pages.get(currentPageId);
      if (currentPage && currentPage.hasContent) {
        const narrativeText = currentPage.activePath
          .map(nodeId => {
            const node = currentPage.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        console.log(`🔄 useEffect: Syncing narrative content (${narrativeText.length} chars)`);
        
        // Small delay to ensure ref is ready
        setTimeout(() => {
          if (currentNarrativeRef.current && narrativeText.trim()) {
            currentNarrativeRef.current.updateContent(narrativeText);
            console.log(`✅ useEffect: NarrativeLayer content synced`);
          }
        }, 50);
      }
    }
  }, [currentPageId, pages]); // Include pages in dependency array to catch tree updates

  // Get current page
  const getCurrentPage = useCallback(() => {
    return pages.get(currentPageId);
  }, [pages, currentPageId]);

  // Switch to a different page
  const switchToPage = useCallback((pageId: string) => {
    if (!pages.has(pageId)) {
      console.error(`Page ${pageId} not found`);
      return;
    }

    const oldPageId = currentPageId;
    const targetPage = pages.get(pageId);
    
    setCurrentPageId(pageId);
    
    // Log all pages with their tree nodes and current narrative when switching
    const allPagesData = pageOrder.map(pId => {
      const page = pages.get(pId);
      if (!page) return { pageId: pId, nodes: [], narrative: '', activePath: [] };
      
      // Get all nodes for this page
      const nodes = Array.from(page.sentenceNodes.entries()).map(([id, node]) => ({
        id: node.id,
        content: node.content,
        parent: node.parent,
        children: node.children,
        activeChild: node.activeChild,
        isCompleted: node.isCompleted
      }));
      
      // Get current narrative (connected active nodes)
      const narrative = page.activePath
        .map(nodeId => {
          const node = page.sentenceNodes.get(nodeId);
          return node ? node.content.trim() : '';
        })
        .filter(content => content.length > 0)
        .join(' ');
      
      return {
        pageId: pId,
        nodes,
        narrative,
        activePath: page.activePath,
        isCurrentPage: pId === pageId
      };
    });
    
    
    // Note: Content update is handled by the useEffect that depends on currentPageId
    // No need to update content here to avoid race conditions
    
    if (onPageChange) {
      onPageChange(oldPageId, pageId);
    }
    
  }, [pages, currentPageId, onPageChange, pageOrder]);

  // Delete a page
  const deletePage = useCallback((pageId: string) => {
    if (pages.size <= 1) {
      console.warn('Cannot delete the last remaining page');
      return false;
    }

    if (!pages.has(pageId)) {
      console.error(`Page ${pageId} not found`);
      return false;
    }

    // If deleting current page, switch to previous or next page
    if (pageId === currentPageId) {
      const currentIndex = pageOrder.indexOf(pageId);
      const nextPageId = pageOrder[currentIndex + 1] || pageOrder[currentIndex - 1];
      if (nextPageId) {
        switchToPage(nextPageId);
      }
    }

    setPages(prev => {
      const newPages = new Map(prev);
      newPages.delete(pageId);
      return newPages;
    });
    
    setPageOrder(prev => prev.filter(id => id !== pageId));
    
    // Remove from tree dictionary
    setPageTreeDict(prev => {
      const newDict = { ...prev };
      delete newDict[pageId];
      return newDict;
    });
    
    return true;
  }, [pages, currentPageId, pageOrder, switchToPage]);

  // Handle page deletion with confirmation
  const handleDeleteCurrentPage = useCallback(() => {
    const currentPageIndex = pageOrder.indexOf(currentPageId);
    
    // Can't delete the first page
    if (currentPageIndex === 0) {
      alert('Cannot delete the first page.');
      return;
    }

    // Show confirmation warning
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this page?\n\nThis action cannot be undone and will permanently remove:\n• All content on this page\n• The entire sentence tree structure\n• All branches and connections\n\nPage ${currentPageIndex + 1} will be deleted forever.`
    );

    if (confirmDelete) {
      const success = deletePage(currentPageId);
      if (!success) {
        alert('Failed to delete page. Please try again.');
      }
    }
  }, [pageOrder, currentPageId, deletePage]);

  // Update page content status
  const updatePageContentStatus = useCallback((pageId: string, hasContent: boolean) => {
    setPages(prev => {
      const newPages = new Map(prev);
      const page = newPages.get(pageId);
      if (page) {
        const updatedPage = {
          ...page,
          hasContent,
          lastModified: Date.now()
        };
        newPages.set(pageId, updatedPage);
      }
      return newPages;
    });
  }, []);

  // Helper function to update the tree dictionary
  const updateTreeDict = useCallback((pageId: string, page: NarrativePage) => {
    const treeData = {
      nodes: Array.from(page.sentenceNodes.entries()).map(([id, node]) => ({
        pageId: node.pageId,
        id: node.id,
        content: node.content,
        parent: node.parent,
        children: node.children,
        activeChild: node.activeChild,
        isCompleted: node.isCompleted
      })),
      activePath: page.activePath
    };
    
    setPageTreeDict(prev => ({
      ...prev,
      [pageId]: treeData
    }));
    
  }, []);

  // Check if new page can be created
  useEffect(() => {
    const currentPage = getCurrentPage();
    const hasCurrentPageContent = currentPage?.hasContent || false;
    const hasEmptyPage = Array.from(pages.values()).some(page => !page.hasContent);
    
    setCanCreateNewPage(hasCurrentPageContent && !hasEmptyPage && pages.size < maxPages);
  }, [pages, getCurrentPage, maxPages]);

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    const currentIndex = pageOrder.indexOf(currentPageId);
    if (currentIndex > 0) {
      switchToPage(pageOrder[currentIndex - 1]);
    }
  }, [pageOrder, currentPageId, switchToPage]);

  const goToNextPage = useCallback(() => {
    const currentIndex = pageOrder.indexOf(currentPageId);
    if (currentIndex < pageOrder.length - 1) {
      switchToPage(pageOrder[currentIndex + 1]);
    }
  }, [pageOrder, currentPageId, switchToPage]);

  const createAndSwitchToNewPage = useCallback(() => {
    if (canCreateNewPage) {
      const newPageId = createNewPage();
      if (newPageId) {
        switchToPage(newPageId);
        // Note: Content clearing is handled by the useEffect that depends on currentPageId
        // No need to manually clear content here to avoid race conditions
      }
    }
  }, [canCreateNewPage, createNewPage, switchToPage]);

  // Sentence tree management for current page
  const createSentenceNode = useCallback((
    content: string, 
    parent: string | null = null,
    pageId: string = currentPageId
  ): SentenceNode => {
    return {
      pageId,
      id: generateSentenceId(),
      content: content.trim(),
      parent,
      children: [],
      activeChild: null,
      createdTime: Date.now(),
      revisedTime: Date.now(),
      editCount: 0,
      isCompleted: false,
      metadata: {}
    };
  }, [generateSentenceId, currentPageId]);

  // Update sentence tree for a specific page
  const updatePageSentenceTree = useCallback((
    pageId: string,
    updater: (nodes: Map<string, SentenceNode>) => Map<string, SentenceNode> | {
      sentenceNodes: Map<string, SentenceNode>;
      activePath: string[];
      isRootNode: boolean;
    }
  ) => {
    setPages(prev => {
      const newPages = new Map(prev);
      const page = newPages.get(pageId);
      if (page) {
        const result = updater(page.sentenceNodes);
        
        let updatedPage;
        if (result instanceof Map) {
          // Old format - just update sentenceNodes
          updatedPage = {
            ...page,
            sentenceNodes: result,
            lastModified: Date.now()
          };
        } else {
          // New format - update both sentenceNodes and activePath
          updatedPage = {
            ...page,
            sentenceNodes: result.sentenceNodes,
            activePath: result.activePath,
            lastModified: Date.now()
          };
          
          // Update rootSentenceNodeId if this is a root node
          if (result.isRootNode && result.activePath.length > 0) {
            updatedPage.rootSentenceNodeId = result.activePath[0];
          }
        }
        
        newPages.set(pageId, updatedPage);
        
        // Update the tree dictionary
        updateTreeDict(pageId, updatedPage);
      }
      return newPages;
    });
  }, [updateTreeDict]);

  // Event handlers that include page context
  const handleSentenceEnd = useCallback(async (sentence: string, confidence: number) => {
    
    // Update page content status
    updatePageContentStatus(currentPageId, true);
    
    // ADD SENTENCE TO TREE STRUCTURE
    const currentPage = getCurrentPage();
    if (currentPage) {
      // Check if this sentence already exists in the tree (with flexible matching for punctuation)
      let sentenceExists = false;
      const cleanNewSentence = sentence.trim().replace(/[.!?]+$/, ''); // Remove trailing punctuation
      
      for (const [id, node] of currentPage.sentenceNodes.entries()) {
        const cleanExistingContent = node.content.trim().replace(/[.!?]+$/, ''); // Remove trailing punctuation
        if (cleanExistingContent === cleanNewSentence) {
          sentenceExists = true;
          // console.log(`📝 Sentence already exists in tree with flexible matching: "${node.content}" matches "${sentence}"`);
          break;
        }
      }
      
      if (!sentenceExists) {
        // ADDITIONAL CHECK: Don't create a new node if this is from editing an existing node
        let isFromRecentEdit = false;
        
        // Simple check: if we have a currentEditSentenceId, this sentence is from editing
        if (currentEditSentenceId) {
          isFromRecentEdit = true;
        }
        
        if (!isFromRecentEdit) {
        
          // Create a new sentence node
          const newSentenceNode = createSentenceNode(sentence, null, currentPageId);
          newSentenceNode.isCompleted = true;
          newSentenceNode.metadata = { confidence };
        
        updatePageSentenceTree(currentPageId, (sentenceNodes) => {
          const newMap = new Map(sentenceNodes);
          
          // If this is the first node, set it as root
          if (newMap.size === 0) {
            newMap.set(newSentenceNode.id, newSentenceNode);
            
            // Return both the updated map and signal to update activePath
            return { 
              sentenceNodes: newMap, 
              activePath: [newSentenceNode.id],
              isRootNode: true
            };
            
          } else {
            // Find the last node in the current active path
            const activePathLength = currentPage.activePath.length;
            if (activePathLength > 0) {
              const lastActiveNodeId = currentPage.activePath[activePathLength - 1];
              const lastActiveNode = newMap.get(lastActiveNodeId);
              
              if (lastActiveNode) {
                
                // Set the new node's parent
                newSentenceNode.parent = lastActiveNodeId;
                
                // Update the last active node to have this as a child and active child
                const updatedLastNode = {
                  ...lastActiveNode,
                  children: [...lastActiveNode.children, newSentenceNode.id],
                  activeChild: newSentenceNode.id,
                  revisedTime: Date.now()
                };
                newMap.set(lastActiveNodeId, updatedLastNode);
                
                // Add the new node
                newMap.set(newSentenceNode.id, newSentenceNode);

                // Return updated map and new activePath
                return {
                  sentenceNodes: newMap,
                  activePath: [...currentPage.activePath, newSentenceNode.id],
                  isRootNode: false
                };
              }
            }
          }
          
          return { sentenceNodes: newMap, activePath: currentPage.activePath, isRootNode: false };
        });
        
        } else {
        }
      } else {
      }
    }
    
    if (onSentenceEnd) {
      onSentenceEnd(sentence, confidence, currentPageId);
    }
  }, [currentPageId, updatePageContentStatus, onSentenceEnd, getCurrentPage, createSentenceNode, updatePageSentenceTree, currentEditSentenceId]);

  const handleSentenceSelect = useCallback((sentence: string, index: number) => {
    if (onSentenceSelect) {
      onSentenceSelect(sentence, index, currentPageId);
    }
  }, [currentPageId, onSentenceSelect]);

  const handleContentChange = useCallback((oldContent: string, newContent: string) => {
    // Update page content status based on whether there's any content
    const hasContent = newContent.trim().length > 0;
    updatePageContentStatus(currentPageId, hasContent);
    
    if (onContentChange) {
      onContentChange(oldContent, newContent, currentPageId);
    }
  }, [currentPageId, updatePageContentStatus, onContentChange]);

  const handleSuggestionReceived = useCallback((suggestion: NarrativeSuggestion) => {
    if (onSuggestionReceived) {
      onSuggestionReceived(suggestion, currentPageId);
    }
  }, [currentPageId, onSuggestionReceived]);

  const handleSuggestionResolved = useCallback(() => {
    if (onSuggestionResolved) {
      onSuggestionResolved(currentPageId);
    }
  }, [currentPageId, onSuggestionResolved]);

  const handleGenerateVisualization = useCallback(async (sentence: string, validation: any) => {
    if (onGenerateVisualization) {
      onGenerateVisualization(sentence, validation, currentPageId);
    }
  }, [currentPageId, onGenerateVisualization]);

  // Tree management functions for current page
  const getBranchesForSentence = useCallback((sentenceContent: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) {
      return [];
    }

    

    // console.log(`🔍 Available nodes:`, Array.from(currentPage.sentenceNodes.entries()).map(([id, node]) => `${id}: "${node.content}"`));

    // Find the sentence node by content (with flexible matching for punctuation)
    let targetSentenceId: string | null = null;
    const cleanSentenceContent = sentenceContent.trim().replace(/[.!?]+$/, ''); // Remove trailing punctuation
    
    for (const [id, node] of currentPage.sentenceNodes.entries()) {
      const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, ''); // Remove trailing punctuation
    //   console.log(`🔍 Comparing "${cleanNodeContent}" with "${cleanSentenceContent}"`);
      if (cleanNodeContent === cleanSentenceContent) {
        targetSentenceId = id;
        break;
      }
    }
    
    if (!targetSentenceId) {
    //   console.log(`🔍 No sentence node found for: "${sentenceContent}"`);
    //   console.log(`🔍 Available sentence contents:`, Array.from(currentPage.sentenceNodes.values()).map(node => `"${node.content.trim()}"`));
      return [];
    }
    
    const targetNode = currentPage.sentenceNodes.get(targetSentenceId);
    if (!targetNode) {
    //   console.log(`🔍 Target node not found in map`);
      return [];
    }


    // Show branches if there are children (even if only one child - show as "active continuation")
    if (targetNode.children.length === 0) {
      return [];
    }
    
    
    // Build branches array - include all children
    const branches: Array<{
      id: string;
      content: string;
      fullPathContent: string;
      type: 'branch' | 'original_continuation';
    }> = [];
    
    const activeChildId = targetNode.activeChild;
    
    targetNode.children.forEach(childId => {
      const childNode = currentPage.sentenceNodes.get(childId);
      if (childNode) {
        const isActivePath = childId === activeChildId;
        
        // Get full path content following this branch
        const fullPathContent = getFullPathContentFromNode(childId, currentPage.sentenceNodes);
        
        // console.log(`🌿 Child ${childId}: "${childNode.content}" (active: ${isActivePath}, fullPath: "${fullPathContent}")`);
        
        branches.push({
          id: childId,
          content: childNode.content,
          fullPathContent,
          type: isActivePath ? 'original_continuation' : 'branch'
        });
      } else {
        console.error(`❌ Child node ${childId} not found in sentenceNodes map!`);
      }
    });
    
    // Sort so active path comes first, then alternatives
    branches.sort((a, b) => {
      if (a.type === 'original_continuation' && b.type === 'branch') return -1;
      if (a.type === 'branch' && b.type === 'original_continuation') return 1;
      return 0;
    });
    
    // console.log(`🌿 Returning ${branches.length} branches:`, branches.map(b => `${b.type}: "${b.content}" (full: "${b.fullPathContent}")`));
    
    return branches;
  }, [getCurrentPage]);

  const getFullPathContentFromNode = useCallback((
    startNodeId: string, 
    sentenceNodes: Map<string, SentenceNode>
  ): string => {
    const contentParts: string[] = [];
    let currentNodeId: string | null = startNodeId;
    
    while (currentNodeId) {
      const currentNode = sentenceNodes.get(currentNodeId);
      if (currentNode) {
        contentParts.push(currentNode.content);
        currentNodeId = currentNode.activeChild;
      } else {
        break;
      }
    }
    
    return contentParts.join(' ');
  }, []);

  // Helper function to create a branch from a specific parent sentence
  const createBranchFromSentence = useCallback((
    parentSentenceContent: string, 
    newBranchContent: string
  ): string | null => {
    const currentPage = getCurrentPage();
    if (!currentPage) {
      console.error('❌ No current page found');
      return null;
    }

    // console.log(`🌿 Creating branch from "${parentSentenceContent}" with content "${newBranchContent}"`);

    // Find the parent sentence node
    let parentNodeId: string | null = null;
    const cleanParentContent = parentSentenceContent.trim().replace(/[.!?]+$/, '');
    
    for (const [id, node] of currentPage.sentenceNodes.entries()) {
      const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
      if (cleanNodeContent === cleanParentContent) {
        parentNodeId = id;
        break;
      }
    }
    
    if (!parentNodeId) {
      console.error(`❌ Parent sentence not found: "${parentSentenceContent}"`);
      return null;
    }

    const parentNode = currentPage.sentenceNodes.get(parentNodeId);
    if (!parentNode) {
      console.error(`❌ Parent node not found in map`);
      return null;
    }


    // Create the new branch node
    const newBranchNode = createSentenceNode(newBranchContent, parentNodeId, currentPageId);
    newBranchNode.isCompleted = true;

    let newBranchId = newBranchNode.id;

    // Update the tree structure
    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      
      // Add the new branch node
      newMap.set(newBranchNode.id, newBranchNode);
      
      // Update the parent node
      const currentParentNode = newMap.get(parentNodeId!);
      if (currentParentNode) {
        // Add new branch to children and make it the active child
        const updatedParent = {
          ...currentParentNode,
          children: [...currentParentNode.children, newBranchNode.id],
          activeChild: newBranchNode.id, // New branch becomes active
          revisedTime: Date.now()
        };
        newMap.set(parentNodeId!, updatedParent);


        // Log what happened to existing children (they become alternatives)
        const previousActiveChild = currentParentNode.activeChild;
        if (previousActiveChild && previousActiveChild !== newBranchNode.id) {
          // console.log(`📝 Previous active child ${previousActiveChild} is now an alternative`);
        }
      }
      
      
      
      return newMap;
    });

    // Update the page's active path to include the new branch
    // Use a longer delay to ensure the tree update has completed
    setTimeout(() => {
    //   console.log(`🔍 Attempting to update active path for new branch ${newBranchNode.id}...`);
      
      setPages(prev => {
        const currentPageState = prev.get(currentPageId);
        if (!currentPageState) {
          console.error(`❌ Current page ${currentPageId} not found in state!`);
          return prev;
        }
        
        
        // Verify the new branch node exists in the tree
        const newBranchInTree = currentPageState.sentenceNodes.get(newBranchNode.id);
        if (!newBranchInTree) {
          
          // This indicates a state management issue - the tree update didn't persist
          // Let's try to manually add the node again
        //   console.log(`🔧 Attempting to manually restore the missing branch node...`);
          const newMap = new Map(currentPageState.sentenceNodes);
          
          // Re-add the branch node
          newMap.set(newBranchNode.id, newBranchNode);
          
          // Re-update the parent node
          const parentNode = newMap.get(newBranchNode.parent!);
          if (parentNode && !parentNode.children.includes(newBranchNode.id)) {
            const updatedParent = {
              ...parentNode,
              children: [...parentNode.children, newBranchNode.id],
              activeChild: newBranchNode.id,
              revisedTime: Date.now()
            };
            newMap.set(newBranchNode.parent!, updatedParent);
            // console.log(`🔧 Manually restored parent node with new branch`);
          }
          
          // Update the page with the restored tree
          const newPages = new Map(prev);
          const restoredPage = {
            ...currentPageState,
            sentenceNodes: newMap,
            lastModified: Date.now()
          };
          newPages.set(currentPageId, restoredPage);
          
        //   console.log(`🔧 Restored tree now has ${newMap.size} nodes`);
          return newPages;
        }
        
        
        // Build new active path up to and including the new branch
        const findPathToNode = (targetId: string): string[] => {
          const path: string[] = [];
          let currentId: string | null = targetId;
          
          
          while (currentId) {
            path.unshift(currentId);
            const node = currentPageState.sentenceNodes.get(currentId);
            // console.log(`🛤️ Current node: ${currentId}, content: "${node?.content || 'NOT_FOUND'}", parent: ${node?.parent || 'null'}`);
            currentId = node?.parent || null;
          }
          
        //   console.log(`🛤️ Final path: [${path.join(' -> ')}]`);
          return path;
        };

        const newActivePath = findPathToNode(newBranchNode.id);
        
        // Update the page with the new active path
        const newPages = new Map(prev);
        const updatedPage = {
          ...currentPageState,
          activePath: newActivePath,
          lastModified: Date.now()
        };
        newPages.set(currentPageId, updatedPage);

        // Update tree dictionary
        updateTreeDict(currentPageId, updatedPage);


        // Update the main editor content to show the new branch path
        const narrativeText = newActivePath
          .map(nodeId => {
            const node = currentPageState.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        
        // Schedule editor update after state update
        setTimeout(() => {
          if (currentNarrativeRef.current) {
            // console.log(`📝 Calling updateContent on narrative editor...`);
            currentNarrativeRef.current.updateContent(narrativeText);
            // console.log(`📝 updateContent called successfully`);
          } else {
            // console.error(`❌ currentNarrativeRef.current is null! Cannot update content.`);
          }
        }, 50);

        
        return newPages;
      });
    }, 200);

    return newBranchId;
  }, [getCurrentPage, createSentenceNode, currentPageId, updatePageSentenceTree, pages]);

  // Additional tree management functions
  const onSwitchToBranch = useCallback((branchId: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const branchNode = currentPage.sentenceNodes.get(branchId);
    if (!branchNode) return;

    // Find path to this branch
    const findSentencePath = (targetId: string): string[] => {
      const path: string[] = [];
      let currentId: string | null = targetId;
      
      while (currentId) {
        path.unshift(currentId);
        const node = currentPage.sentenceNodes.get(currentId);
        currentId = node?.parent || null;
      }
      
      return path;
    };

    const pathToBranch = findSentencePath(branchId);
    
    // Continue the path by following activeChild relationships from the branch node
    const fullPath = [...pathToBranch];
    let currentNodeId = branchId;
    
    while (currentNodeId) {
      const currentNode = currentPage.sentenceNodes.get(currentNodeId);
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
    
    // Update active child relationships along the path
    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      
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
        }
      }
      
      return newMap;
    });

    // Update page's active path
    setPages(prev => {
      const newPages = new Map(prev);
      const page = newPages.get(currentPageId);
      if (page) {
        const updatedPage = {
          ...page,
          activePath: fullPath,
          lastModified: Date.now()
        };
        newPages.set(currentPageId, updatedPage);
        
        // Update tree dictionary
        updateTreeDict(currentPageId, updatedPage);
      }
      return newPages;
    });

    // Update narrative content
    setTimeout(() => {
      const narrativeText = fullPath
        .map(nodeId => {
          const node = currentPage.sentenceNodes.get(nodeId);
          let content = node ? node.content.trim() : '';
          if (content && !/[.!?]$/.test(content)) {
            content += '.';
          }
          return content;
        })
        .filter(content => content.length > 0)
        .join(' ');
      
      if (currentNarrativeRef.current) {
        currentNarrativeRef.current.updateContent(narrativeText);
      }
    }, 100);

    // Notify parent about branch switch
    if (onBranchSwitch) {
      onBranchSwitch(branchId, currentPageId);
    }
  }, [getCurrentPage, updatePageSentenceTree, currentPageId, onBranchSwitch]);

  const onCreateBranch = useCallback((fromSentenceContent: string, branchContent: string) => {
    
    // 🛡️ GUARD: Prevent duplicate branch creation with debouncing
    const branchKey = `${fromSentenceContent}||${branchContent}`;
    const now = Date.now();
    const lastCreationTime = recentBranchCreationRef.current.get(branchKey);
    
    if (lastCreationTime && (now - lastCreationTime) < 1000) { // 1 second debounce
      console.warn(`🛡️ Duplicate branch creation attempt blocked. Last creation was ${now - lastCreationTime}ms ago.`);
      return;
    }
    
    // Record this creation attempt
    recentBranchCreationRef.current.set(branchKey, now);
    
    // Clean up old entries (older than 5 seconds)
    for (const [key, time] of recentBranchCreationRef.current.entries()) {
      if (now - time > 5000) {
        recentBranchCreationRef.current.delete(key);
      }
    }
    
    const currentPage = getCurrentPage();
    if (!currentPage) {
      console.error('❌ No current page found for branch creation');
      return;
    }
    
    // Check if a branch with this exact content already exists for this parent
    let parentNodeId: string | null = null;
    const cleanParentContent = fromSentenceContent.trim().replace(/[.!?]+$/, '');
    
    for (const [id, node] of currentPage.sentenceNodes.entries()) {
      const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
      if (cleanNodeContent === cleanParentContent) {
        parentNodeId = id;
        break;
      }
    }
    
    if (parentNodeId) {
      const parentNode = currentPage.sentenceNodes.get(parentNodeId);
      if (parentNode) {
        // Check if any child already has this exact content
        for (const childId of parentNode.children) {
          const childNode = currentPage.sentenceNodes.get(childId);
          if (childNode && childNode.content.trim() === branchContent.trim()) {
            console.warn(`🛡️ Branch with content "${branchContent}" already exists as child ${childId}. Skipping duplicate creation.`);
            return;
          }
        }
      }
    }
    
    // Use the new helper function
    const newBranchId = createBranchFromSentence(fromSentenceContent, branchContent);
    
    if (newBranchId) {
    } else {
      console.error(`❌ Failed to create branch from "${fromSentenceContent}"`);
    }
  }, [createBranchFromSentence, getCurrentPage]);

  const onUpdateBranchContent = useCallback((branchId: string, newContent: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const branchNode = currentPage.sentenceNodes.get(branchId);
    if (!branchNode || branchNode.content === newContent) return;

    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      const existingNode = newMap.get(branchId);
      
      if (existingNode) {
        const updatedNode = {
          ...existingNode,
          content: newContent,
          revisedTime: Date.now(),
          editCount: existingNode.editCount + 1
        };
        newMap.set(branchId, updatedNode);
      }
      
      return newMap;
    });

    // If this node is part of the current active path, update the main editor
    const updatedPage = getCurrentPage();
    if (updatedPage && updatedPage.activePath.includes(branchId)) {
      setTimeout(() => {
        const narrativeText = updatedPage.activePath
          .map(nodeId => {
            const node = updatedPage.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        if (currentNarrativeRef.current) {
          currentNarrativeRef.current.updateContent(narrativeText);
        }
      }, 100);
    }
  }, [getCurrentPage, updatePageSentenceTree, currentPageId]);

  const findNodeIdByContent = useCallback((content: string): string | null => {
    const currentPage = getCurrentPage();
    if (!currentPage) {
      return null;
    }

    
    // Clean the input content for comparison (remove trailing punctuation)
    const cleanInputContent = content.trim().replace(/[.!?]+$/, '');

    for (const [nodeId, node] of currentPage.sentenceNodes.entries()) {
      const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
      // console.log(`🔍 findNodeIdByContent: Comparing "${cleanNodeContent}" with "${cleanInputContent}"`);

      if (cleanNodeContent === cleanInputContent) {
        // console.log(`✅ findNodeIdByContent: Found match! Node ID: ${nodeId}`);
        return nodeId;
      }
    }

    // console.log(`❌ findNodeIdByContent: No match found for "${content}"`);
    // console.log(`❌ Available contents:`, Array.from(currentPage.sentenceNodes.values()).map(node => `"${node.content}"`));
    return null;
  }, [getCurrentPage]);

  const onDeleteSentence = useCallback((sentenceId: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) {
      console.error('❌ onDeleteSentence: No current page found');
      return;
    }

    // Notify parent about sentence deletion (for LLM protection)
    console.log('🔥 DEBUG: About to notify parent of sentence deletion:', sentenceId, 'on page:', currentPageId);
    onSentenceDelete?.(sentenceId, currentPageId);
    console.log('🔥 DEBUG: Parent notified of sentence deletion');

    // Find the node to delete using ID only (no content fallback)
    const nodeToDelete = currentPage.sentenceNodes.get(sentenceId);
    if (!nodeToDelete) {
      console.error('❌ onDeleteSentence: Node not found with ID:', sentenceId);
      return;
    }


    // Update the tree structure
    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      const nodeToDelete = newMap.get(sentenceId)!;
      
      const parentId = nodeToDelete.parent;
      const childrenIds = [...nodeToDelete.children];
      const deletedNodeActiveChild = nodeToDelete.activeChild;
      

      // Update parent node
      if (parentId) {
        const parentNode = newMap.get(parentId);
        if (parentNode) {
          // Remove the deleted node from parent's children
          const updatedParentChildren = parentNode.children.filter(childId => childId !== sentenceId);
          
          // Add all children of deleted node to parent's children
          updatedParentChildren.push(...childrenIds);
          
          // Determine new active child for parent
          let newActiveChild: string | null = null;
          if (parentNode.activeChild === sentenceId) {
            // Parent was pointing to the deleted node, reassign to deleted node's activeChild
            newActiveChild = deletedNodeActiveChild;
          } else {
            // Parent was pointing to something else, keep it unchanged
            newActiveChild = parentNode.activeChild;
          }
          
          
          const updatedParent = {
            ...parentNode,
            children: updatedParentChildren,
            activeChild: newActiveChild,
            revisedTime: Date.now()
          };
          
          newMap.set(parentId, updatedParent);
        }
      }
      
      // Update all children to point to the deleted node's parent
      for (const childId of childrenIds) {
        const childNode = newMap.get(childId);
        if (childNode) {
          const updatedChild = {
            ...childNode,
            parent: parentId,
            revisedTime: Date.now()
          };
          newMap.set(childId, updatedChild);
        }
      }
      
      // Remove the deleted node
      newMap.delete(sentenceId);
      
      return newMap;
    });

    // Rebuild active path and refresh UI (same pattern as insertion)
    setTimeout(() => {
      
      setPages(prev => {
        const currentPageState = prev.get(currentPageId);
        if (!currentPageState) {
          console.error(`❌ Current page ${currentPageId} not found in state!`);
          return prev;
        }
        
        // Build new active path from root by following activeChild chain
        const buildActivePathFromRoot = (): string[] => {
          // Find the root node (node with no parent)
          let rootNodeId: string | null = null;
          for (const [id, node] of currentPageState.sentenceNodes.entries()) {
            if (!node.parent) {
              rootNodeId = id;
              break;
            }
          }
          
          if (!rootNodeId) {
            return [];
          }
          
          // Follow the activeChild chain from root to the deepest active child
          const path: string[] = [];
          let currentId: string | null = rootNodeId;
          
          while (currentId) {
            path.push(currentId);
            const node = currentPageState.sentenceNodes.get(currentId);
            currentId = node?.activeChild || null;
          }
          
          return path;
        };

        const newActivePath = buildActivePathFromRoot();
        
        // Update the page with the new active path
        const newPages = new Map(prev);
        const updatedPage = {
          ...currentPageState,
          activePath: newActivePath,
          lastModified: Date.now()
        };
        newPages.set(currentPageId, updatedPage);

        // Update tree dictionary
        updateTreeDict(currentPageId, updatedPage);

        // Update the main editor content after deletion
        const narrativeText = newActivePath
          .map((nodeId: string) => {
            const node = currentPageState.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter((content: string) => content.length > 0)
          .join(' ');
        
        
        // Schedule editor update after state update
        setTimeout(() => {
          if (currentNarrativeRef.current) {
            currentNarrativeRef.current.updateContent(narrativeText);
          }
        }, 50);

        return newPages;
      });
    }, 200);
    
  }, [getCurrentPage, updatePageSentenceTree, currentPageId, updateTreeDict, onSentenceDelete]);

  const onDeleteBranch = useCallback((branchId: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    // Implementation similar to original deleteBranchFromTree
    // but operating on current page's tree
    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      
      const branchToDelete = newMap.get(branchId);
      if (!branchToDelete) return newMap;

      // Collect all descendants recursively
      const collectDescendants = (nodeId: string): string[] => {
        const node = newMap.get(nodeId);
        if (!node) return [];
        
        let descendants: string[] = [nodeId];
        for (const childId of node.children) {
          descendants.push(...collectDescendants(childId));
        }
        return descendants;
      };
      
      const nodesToDelete = collectDescendants(branchId);
      
      // Update parent node
      const parentId = branchToDelete.parent;
      if (parentId) {
        const parentNode = newMap.get(parentId);
        if (parentNode) {
          const updatedParentChildren = parentNode.children.filter(childId => childId !== branchId);
          
          let newActiveChild = null;
          if (parentNode.activeChild === branchId) {
            newActiveChild = updatedParentChildren.length > 0 ? updatedParentChildren[0] : null;
          } else {
            newActiveChild = parentNode.activeChild;
          }
          
          const updatedParent = {
            ...parentNode,
            children: updatedParentChildren,
            activeChild: newActiveChild,
            revisedTime: Date.now()
          };
          
          newMap.set(parentId, updatedParent);
        }
      }
      
      // Remove all nodes in the branch
      for (const nodeId of nodesToDelete) {
        newMap.delete(nodeId);
      }
      
      return newMap;
    });
    
    // Notify parent component about branch deletion
    onBranchDelete?.(branchId, currentPageId);
  }, [getCurrentPage, updatePageSentenceTree, currentPageId, onBranchDelete]);

  const onInsertNodeAfter = useCallback((afterSentenceContentOrId: string, newSentenceContent: string, useId: boolean = false) => {
    
    const currentPage = getCurrentPage();
    if (!currentPage) {
      return;
    }
    

    // Find the node after which to insert
    let afterNode: SentenceNode | null = null;
    let afterNodeId: string | null = null;
    
    if (useId) {
      // Use ID-based lookup
      if (currentPage.sentenceNodes.has(afterSentenceContentOrId)) {
        afterNode = currentPage.sentenceNodes.get(afterSentenceContentOrId)!;
        afterNodeId = afterSentenceContentOrId;
      } else {
        return;
      }
    } else {
      // Use content-based lookup (original behavior)
      for (const [id, node] of currentPage.sentenceNodes.entries()) {
        if (node.content === afterSentenceContentOrId) {
          afterNode = node;
          afterNodeId = id;
          break;
        }
      }
    }
    
    if (!afterNode || !afterNodeId) {
      console.error('❌ onInsertNodeAfter: Could not find node:', {
        searchTerm: afterSentenceContentOrId,
        searchMethod: useId ? 'ID' : 'content'
      });
      return;
    }
    
    
    // Create the new node
    const newNode = createSentenceNode(newSentenceContent, afterNodeId, currentPageId);
    newNode.isCompleted = true;
    
    
    // Update the tree structure using the same pattern as createBranchFromSentence
    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      
      // Insert between afterNode and its children
      const newNodeWithInheritedChildren = {
        ...newNode,
        children: [...afterNode.children],
        activeChild: afterNode.activeChild
      };
      
      newMap.set(newNode.id, newNodeWithInheritedChildren);
      
      // Update the "after" node
      const updatedAfterNode = {
        ...afterNode,
        children: [newNode.id],
        activeChild: newNode.id,
        revisedTime: Date.now()
      };
      newMap.set(afterNodeId, updatedAfterNode);
      
      // Update children to point to new node as parent
      for (const childId of afterNode.children) {
        const childNode = newMap.get(childId);
        if (childNode) {
          const updatedChildNode = {
            ...childNode,
            parent: newNode.id,
            revisedTime: Date.now()
          };
          newMap.set(childId, updatedChildNode);
        }
      }
      
      return newMap;
    });

    // CRITICAL: Follow the same pattern as createBranchFromSentence
    // Update the page's active path and refresh the narrative content
    setTimeout(() => {
      
      setPages(prev => {
        const currentPageState = prev.get(currentPageId);
        if (!currentPageState) {
          console.error(`❌ Current page ${currentPageId} not found in state!`);
          return prev;
        }
        
        // Verify the new node exists in the tree
        const newNodeInTree = currentPageState.sentenceNodes.get(newNode.id);
        if (!newNodeInTree) {
          console.error(`❌ New node ${newNode.id} not found in tree! State management issue detected.`);
          return prev;
        }
        
        // Build new active path - find the path to the new node
        const findPathToNode = (targetId: string): string[] => {
          const path: string[] = [];
          let currentId: string | null = targetId;
          
          while (currentId) {
            path.unshift(currentId);
            const node = currentPageState.sentenceNodes.get(currentId);
            currentId = node?.parent || null;
          }
          
          return path;
        };

        // Build active path from root by following activeChild chain
        const buildActivePathFromRoot = (): string[] => {
          // Find the root node (node with no parent)
          let rootNodeId: string | null = null;
          for (const [id, node] of currentPageState.sentenceNodes.entries()) {
            if (!node.parent) {
              rootNodeId = id;
              break;
            }
          }
          
          if (!rootNodeId) {
            return [];
          }
          
          // Follow the activeChild chain from root to the deepest active child
          const path: string[] = [];
          let currentId: string | null = rootNodeId;
          
          while (currentId) {
            path.push(currentId);
            const node = currentPageState.sentenceNodes.get(currentId);
            currentId = node?.activeChild || null;
          }
          
          return path;
        };
        
        const newActivePath = buildActivePathFromRoot();
        
        // Update the page with the new active path
        const newPages = new Map(prev);
        const updatedPage = {
          ...currentPageState,
          activePath: newActivePath,
          lastModified: Date.now()
        };
        newPages.set(currentPageId, updatedPage);

        // Update tree dictionary
        updateTreeDict(currentPageId, updatedPage);

        // Update the main editor content to show the new narrative with inserted sentence
        const narrativeText = newActivePath
          .map((nodeId: string) => {
            const node = currentPageState.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter((content: string) => content.length > 0)
          .join(' ');
        
        
        // Schedule editor update after state update
        setTimeout(() => {
          if (currentNarrativeRef.current) {
            currentNarrativeRef.current.updateContent(narrativeText);
          } else {
          }
        }, 50);

        return newPages;
      });
    }, 200);
    
  }, [getCurrentPage, createSentenceNode, currentPageId, updatePageSentenceTree, updateTreeDict]);

  const onEnterEditMode = useCallback((sentenceContent: string) => {
    // Find the node ID for this sentence content and store it
    const nodeId = findNodeIdByContent(sentenceContent);
    if (nodeId) {
      setCurrentEditSentenceId(nodeId);
    } else {
      setCurrentEditSentenceId(null);
    }
  }, [currentPageId, findNodeIdByContent]);

  const updateSentenceNodeContent = useCallback((nodeId: string, newContent: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) {
      return false;
    }

    const nodeToUpdate = currentPage.sentenceNodes.get(nodeId);
    if (!nodeToUpdate) {
      return false;
    }

    const oldContent = nodeToUpdate.content;
    console.log(`🔄 updateSentenceNodeContent: "${oldContent}" → "${newContent}"`);

    updatePageSentenceTree(currentPageId, (sentenceNodes) => {
      const newMap = new Map(sentenceNodes);
      const existingNode = newMap.get(nodeId);
      
      if (existingNode) {
        const updatedNode = {
          ...existingNode,
          content: newContent.trim(),
          revisedTime: Date.now(),
          editCount: existingNode.editCount + 1
        };
        newMap.set(nodeId, updatedNode);
        
      }
      
      return newMap;
    });

    // CRITICAL: Notify parent component about content change for tree synchronization
    if (onContentChange && oldContent !== newContent) {
      console.log(`🔄 updateSentenceNodeContent: Calling onContentChange for tree sync`);
      onContentChange(oldContent, newContent, currentPageId);
    }

    // CRITICAL: For save button operations, trigger edit_sentence timeline update
    // This is separate from regular typing which should not trigger LLM calls
    if (onSentenceEdit && oldContent !== newContent) {
      console.log(`💾 SAVE BUTTON: Triggering onSentenceEdit for edit_sentence timeline update`);
      onSentenceEdit(oldContent, newContent, nodeId, currentPageId);
    }

    // If this node is part of the current active path, update the main editor
    const updatedPage = getCurrentPage();
    if (updatedPage && updatedPage.activePath.includes(nodeId)) {
      setTimeout(() => {
        const narrativeText = updatedPage.activePath
          .map(nodeId => {
            const node = updatedPage.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        if (currentNarrativeRef.current) {
          currentNarrativeRef.current.updateContent(narrativeText);
        }
      }, 100);
    }

    return true;
  }, [getCurrentPage, updatePageSentenceTree, currentPageId, onContentChange, onSentenceEdit]);

  const onExitEditMode = useCallback((sentenceContent: string) => {
    // Clear the stored edit sentence ID when exiting edit mode
    
    // Add a delay before clearing to ensure sentence detection system processes first
    setTimeout(() => {
      setCurrentEditSentenceId(null);
    }, 1000); // 1 second delay to ensure sentence detection completes
  }, [currentPageId, currentEditSentenceId]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getCurrentPageId: () => currentPageId,
    
    getPageContent: (pageId: string) => {
      const page = pages.get(pageId);
      if (!page) return '';
      
      // Reconstruct content from active path
      const content = page.activePath
        .map(nodeId => {
          const node = page.sentenceNodes.get(nodeId);
          return node ? node.content.trim() : '';
        })
        .filter(content => content.length > 0)
        .join(' ');
      
      return content;
    },
    
    getAllPagesContent: () => {
      return pageOrder.map(pageId => {
        const page = pages.get(pageId);
        if (!page) return { pageId, content: '' };
        
        const content = page.activePath
          .map(nodeId => {
            const node = page.sentenceNodes.get(nodeId);
            return node ? node.content.trim() : '';
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        return {
          pageId,
          content,
          title: page.title
        };
      });
    },
    
  getCurrentPageTree: () => {
      const currentPage = getCurrentPage();
      if (!currentPage) return { nodes: [], activePath: [] };
      
      return {
        nodes: Array.from(currentPage.sentenceNodes.values()),
        activePath: currentPage.activePath
      };
    },
    
    getPageTree: (pageId: string) => {
      const page = pages.get(pageId);
      if (!page) return null;
      
      return {
        nodes: Array.from(page.sentenceNodes.values()),
        activePath: page.activePath
      };
    },
    
    // Get the tree dictionary for all pages
    getAllPageTrees: () => pageTreeDict,
    
    // Get tree for specific page from dictionary
    getPageTreeFromDict: (pageId: string) => pageTreeDict[pageId] || null,
    
    createNewPage,
    switchToPage,
    deletePage,
    
    clearPageContent: (pageId?: string) => {
      const targetPageId = pageId || currentPageId;
      console.log(`🧹 Clearing content for page: ${targetPageId}`);
      
      const page = pages.get(targetPageId);
      if (!page) {
        console.log(`⚠️ Page ${targetPageId} not found`);
        return false;
      }
      
      // Clear all page content by resetting the sentence tree and active path
      setPages(prev => {
        const newPages = new Map(prev);
        const clearedPage: NarrativePage = {
          ...page,
          sentenceNodes: new Map(),
          activePath: [],
          hasContent: false,
          lastModified: Date.now()
        };
        newPages.set(targetPageId, clearedPage);
        
        // Update tree dictionary
        updateTreeDict(targetPageId, clearedPage);
        
        return newPages;
      });
      
      // Clear the narrative editor content if it's the current page
      if (targetPageId === currentPageId && currentNarrativeRef.current) {
        currentNarrativeRef.current.updateContent('');
      }
      
      console.log(`✅ Cleared content for page: ${targetPageId}`);
      return true;
    },
    
    showSuggestion: (suggestion: NarrativeSuggestion, pageId?: string) => {
      const targetPageId = pageId || currentPageId;
      if (targetPageId === currentPageId && currentNarrativeRef.current) {
        currentNarrativeRef.current.showSuggestion(suggestion);
      }
    },
    
    hasPendingSuggestion: () => {
      return currentNarrativeRef.current?.hasPendingSuggestion() || false;
    },
    
    // DEBUG HELPERS
    debugCreateTestBranches: () => {
      const currentPage = getCurrentPage();
      if (!currentPage || currentPage.sentenceNodes.size === 0) {
        return;
      }
      
      // Find the first sentence
      const firstNodeId = currentPage.activePath[0];
      if (!firstNodeId) {
        return;
      }
      
      const firstNode = currentPage.sentenceNodes.get(firstNodeId);
      if (!firstNode) {
        return;
      }
      
      
      // Create two test branches
      const branch1 = createSentenceNode('Alternative branch 1 content.', firstNodeId, currentPageId);
      const branch2 = createSentenceNode('Alternative branch 2 content.', firstNodeId, currentPageId);
      
      branch1.isCompleted = true;
      branch2.isCompleted = true;
      
      updatePageSentenceTree(currentPageId, (sentenceNodes) => {
        const newMap = new Map(sentenceNodes);
        
        // Add the new branches
        newMap.set(branch1.id, branch1);
        newMap.set(branch2.id, branch2);
        
        // Update the first node to have these as children
        const updatedFirstNode = {
          ...firstNode,
          children: [branch1.id, branch2.id],
          activeChild: branch1.id // Keep first branch as active
        };
        newMap.set(firstNodeId, updatedFirstNode);
        
        return newMap;
      });
    },
    
    debugGetCurrentTreeState: () => {
      const currentPage = getCurrentPage();
      if (!currentPage) {
        return null;
      }

      
      const treeState = {
        pageId: currentPageId,
        nodeCount: currentPage.sentenceNodes.size,
        activePath: currentPage.activePath,
        nodes: Array.from(currentPage.sentenceNodes.entries()).map(([id, node]) => ({
          pageId: node.pageId,
          id,
          content: node.content,
          parent: node.parent,
          children: node.children,
          activeChild: node.activeChild,
          isCompleted: node.isCompleted,
          createdTime: new Date(node.createdTime).toISOString(),
          editCount: node.editCount
        }))
      };
      
      console.table(treeState.nodes);
      return treeState;
    },
    
    // 🐛 DEBUG: Add a helper to manually test getBranchesForSentence
    debugTestGetBranches: (sentenceContent?: string) => {
      const currentPage = getCurrentPage();
      if (!currentPage) {
        return;
      }
      
      // If no sentence content provided, use the first sentence
      let testSentence = sentenceContent;
      if (!testSentence && currentPage.sentenceNodes.size > 0) {
        const firstNode = Array.from(currentPage.sentenceNodes.values())[0];
        testSentence = firstNode.content;
      }
      
      if (!testSentence) {
        return;
      }
      
      const branches = getBranchesForSentence(testSentence);
      return branches;
    },

    // 🐛 DEBUG: Add a helper to manually test branch creation
    debugCreateBranch: (fromSentenceContent: string, branchContent: string) => {
      return createBranchFromSentence(fromSentenceContent, branchContent);
    },
    
    // 🐛 DEBUG: Inspect the tree dictionary
    debugGetTreeDict: () => {
      return pageTreeDict;
    },

    // Update sentence content in the tree structure
    updateSentenceContent: (pageId: string, oldContent: string, newContent: string) => {
      console.log(`🔄 PagedNarrativeSystem.updateSentenceContent CALLED: "${oldContent}" → "${newContent}"`);
      
      const page = pages.get(pageId);
      if (!page) {
        console.log(`⚠️  PagedNarrativeSystem: Page ${pageId} not found`);
        return false;
      }
      
      console.log(`🔍 PagedNarrativeSystem: Page found with ${page.sentenceNodes.size} nodes`);
      
      // Find the node with matching old content (clean both for comparison)
      const cleanOldContent = oldContent.trim().replace(/[.!?]+$/, '');
      let foundNodeId = null;
      let foundNode = null;
      
      console.log(`🔍 PagedNarrativeSystem: Looking for clean content: "${cleanOldContent}"`);
      
      // Log all current node contents for debugging
      for (const [nodeId, node] of page.sentenceNodes.entries()) {
        const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
        console.log(`🔍 PagedNarrativeSystem: Node ${nodeId}: "${cleanNodeContent}" vs "${cleanOldContent}"`);
      }
      
      for (const [nodeId, node] of page.sentenceNodes.entries()) {
        const cleanNodeContent = node.content.trim().replace(/[.!?]+$/, '');
        if (cleanNodeContent === cleanOldContent) {
          foundNodeId = nodeId;
          foundNode = node;
          console.log(`🎯 PagedNarrativeSystem: Found matching node ${nodeId} in PagedNarrativeSystem`);
          break;
        }
      }
      
      if (!foundNodeId || !foundNode) {
        console.log(`⚠️  PagedNarrativeSystem: No matching node found for content: "${cleanOldContent}"`);
        return false;
      }
      
      // Update the node content using updatePageSentenceTree
      console.log(`🔄 PagedNarrativeSystem: Calling updatePageSentenceTree for node ${foundNodeId}`);
      updatePageSentenceTree(pageId, (sentenceNodes) => {
        const newMap = new Map(sentenceNodes);
        const updatedNode = { ...foundNode, content: newContent.trim() };
        newMap.set(foundNodeId, updatedNode);
        console.log(`✅ PagedNarrativeSystem: Updated node ${foundNodeId} in PagedNarrativeSystem tree from "${foundNode.content}" to "${updatedNode.content}"`);
        return newMap;
      });
      
      console.log(`✅ PagedNarrativeSystem: updateSentenceContent completed successfully`);
      return true;
    },
    
    // Switch active path to a specific node
    switchActivePath: (pageId: string, targetNodeId: string, newActivePath: string[]) => {
      console.log(`🔄 Switching active path on page ${pageId} to node ${targetNodeId}`);
      console.log(`🛤️ New active path:`, newActivePath);
      
      const page = pages.get(pageId);
      if (!page) {
        console.log(`⚠️ Page ${pageId} not found`);
        return false;
      }
      
      // Update the page's active path
      setPages(prev => {
        const newPages = new Map(prev);
        const updatedPage: NarrativePage = {
          ...page,
          activePath: newActivePath,
          lastModified: Date.now()
        };
        newPages.set(pageId, updatedPage);
        
        // Update tree dictionary
        updateTreeDict(pageId, updatedPage);
        
        return newPages;
      });
      
      // Update activeChild relationships to reflect the new path
      updatePageSentenceTree(pageId, (sentenceNodes) => {
        const newMap = new Map(sentenceNodes);
        
        // Update activeChild for each parent in the new path
        for (let i = 0; i < newActivePath.length - 1; i++) {
          const currentNodeId = newActivePath[i];
          const nextNodeId = newActivePath[i + 1];
          const currentNode = newMap.get(currentNodeId);
          
          if (currentNode && currentNode.children.includes(nextNodeId)) {
            const updatedNode = {
              ...currentNode,
              activeChild: nextNodeId
            };
            newMap.set(currentNodeId, updatedNode);
            console.log(`🎯 Set activeChild for "${currentNode.content.substring(0, 30)}..." to next node in path`);
          }
        }
        
        return newMap;
      });
      
      // Update the narrative editor content if it's the current page
      if (pageId === currentPageId && currentNarrativeRef.current) {
        const narrativeText = newActivePath
          .map(nodeId => {
            const node = page.sentenceNodes.get(nodeId);
            let content = node ? node.content.trim() : '';
            // Ensure each sentence ends with proper punctuation
            if (content && !/[.!?]$/.test(content)) {
              content += '.';
            }
            return content;
          })
          .filter(content => content.length > 0)
          .join(' ');
        
        console.log(`📝 Updating narrative editor with new path content: "${narrativeText}"`);
        currentNarrativeRef.current.updateContent(narrativeText);
      }
      
      console.log(`✅ Active path switched successfully`);
      return true;
    },

    // Initialize with example tree data
    initializeWithExampleTree: (explorationPath: Array<{
      sentence_id: number;
      sentence_content: string;
      children: number[];
      parent: number | null;
    }>) => {
      console.log(`🌳 Initializing with example tree data (${explorationPath.length} nodes)`);
      
      if (!explorationPath.length) {
        console.log(`⚠️ Empty exploration path provided`);
        return;
      }

      // Build the tree structure
      const nodeIdMap = new Map<number, string>(); // Maps sentence_id to internal node id
      const sentenceNodes = new Map<string, SentenceNode>();
      
      // First pass: Create all nodes and map IDs
      explorationPath.forEach(pathNode => {
        const internalNodeId = `node-${pathNode.sentence_id}-${Date.now()}`;
        nodeIdMap.set(pathNode.sentence_id, internalNodeId);
        
        const sentenceNode: SentenceNode = {
          id: internalNodeId,
          content: pathNode.sentence_content.trim(),
          parent: null, // Will be set in second pass
          children: [],
          activeChild: null,
          isCompleted: true,
          createdTime: Date.now(),
          pageId: currentPageId,
          editCount: 0,
          revisedTime: 0
        };
        
        sentenceNodes.set(internalNodeId, sentenceNode);
      });

      // Second pass: Set up parent-child relationships
      explorationPath.forEach(pathNode => {
        const nodeId = nodeIdMap.get(pathNode.sentence_id);
        if (!nodeId) return;
        
        const node = sentenceNodes.get(nodeId);
        if (!node) return;

        // Set parent
        if (pathNode.parent !== null) {
          const parentId = nodeIdMap.get(pathNode.parent);
          if (parentId) {
            node.parent = parentId;
            
            // Add this node as a child to parent
            const parentNode = sentenceNodes.get(parentId);
            if (parentNode) {
              parentNode.children.push(nodeId);
            }
          }
        }
      });

      // Third pass: Set activeChild relationships based on primary path
      // The primary path is typically the first child of each parent, 
      // or we can trace through the linear sequence
      explorationPath.forEach(pathNode => {
        const nodeId = nodeIdMap.get(pathNode.sentence_id);
        if (!nodeId) return;
        
        const node = sentenceNodes.get(nodeId);
        if (!node || node.children.length === 0) return;

        // Set the first child as active (can be adjusted based on logic)
        if (pathNode.children.length > 0) {
          const firstChildSentenceId = pathNode.children[0];
          const firstChildNodeId = nodeIdMap.get(firstChildSentenceId);
          if (firstChildNodeId) {
            node.activeChild = firstChildNodeId;
          }
        }
      });

      // Find the root node (node with no parent)
      let rootNodeId: string | null = null;
      for (const node of sentenceNodes.values()) {
        if (node.parent === null) {
          rootNodeId = node.id;
          break;
        }
      }

      // Build the active path by following activeChild links from root
      const activePath: string[] = [];
      if (rootNodeId) {
        let currentId: string | null = rootNodeId;
        while (currentId) {
          activePath.push(currentId);
          const currentNode = sentenceNodes.get(currentId);
          currentId = currentNode?.activeChild || null;
        }
      }

      console.log(`🌳 Built tree with ${sentenceNodes.size} nodes, root: ${rootNodeId}, active path length: ${activePath.length}`);
      
      // Update the current page with the new tree structure
      const currentPage = getCurrentPage();
      if (currentPage) {
        setPages(prev => {
          const newPages = new Map(prev);
          const updatedPage: NarrativePage = {
            ...currentPage,
            sentenceNodes,
            activePath,
            rootSentenceNodeId: rootNodeId,
            hasContent: true,
            lastModified: Date.now()
          };
          newPages.set(currentPageId, updatedPage);
          
          // Update tree dictionary
          updateTreeDict(currentPageId, updatedPage);
          
          // Mark the page as having content
          setPages(prevPages => {
            const newPages = new Map(prevPages);
            const pageToUpdate = newPages.get(currentPageId);
            if (pageToUpdate) {
              const finalPage = {
                ...pageToUpdate,
                hasContent: true,
                lastModified: Date.now()
              };
              newPages.set(currentPageId, finalPage);
            }
            return newPages;
          });
          
          return newPages;
        });

        // Update the narrative editor content and ensure it's properly loaded
        setTimeout(() => {
          if (currentNarrativeRef.current) {
            const narrativeText = activePath
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
            
            console.log(`📝 Setting initial narrative content: "${narrativeText.substring(0, 100)}..."`);
            console.log(`📝 Full narrative text length: ${narrativeText.length} characters`);
            
            // Update the content in the NarrativeLayer
            currentNarrativeRef.current.updateContent(narrativeText);
            
            // Also trigger a content change to ensure page status is updated
            updatePageContentStatus(currentPageId, true);
            
            console.log(`✅ NarrativeLayer updated with example content`);
          } else {
            console.warn(`⚠️ currentNarrativeRef.current is null - cannot update content`);
          }
        }, 150); // Slightly longer delay to ensure all state updates have propagated
      }
      
      console.log(`✅ Example tree initialization complete`);
    },

    highlightSentence: (sentenceContent: string) => {
      if (!currentNarrativeRef.current) {
        console.warn('❌ Cannot highlight sentence: NarrativeLayer ref not available');
        return false;
      }
      
      return currentNarrativeRef.current.highlightSentence(sentenceContent);
    },
    
    highlightSentencesByIds: (sentenceIds: string[]) => {
      if (!currentNarrativeRef.current) {
        console.warn('❌ Cannot highlight sentences: NarrativeLayer ref not available');
        return false;
      }
      
      if (!sentenceIds || sentenceIds.length === 0) {
        console.warn('❌ Cannot highlight sentences: No sentence IDs provided');
        return false;
      }
      
      console.log(`🎯 PagedNarrativeSystem: Highlighting ${sentenceIds.length} sentences by IDs:`, sentenceIds);
      
      // Get current page to access tree nodes
      const currentPage = getCurrentPage();
      if (!currentPage || !currentPage.sentenceNodes) {
        console.warn('❌ Cannot highlight sentences: No tree structure available');
        return false;
      }
      
      // Debug: Show available sentence node IDs
      const availableNodeIds = Array.from(currentPage.sentenceNodes.keys());
      console.log('🔍 Available sentence node IDs in current page:', availableNodeIds);
      console.log('🔍 Looking for sentence IDs:', sentenceIds);
      
      let highlightedCount = 0;
      
      // Map each sentence ID to its content and highlight
      sentenceIds.forEach((sentenceId) => {
        // Try direct lookup first
        let node = currentPage.sentenceNodes.get(sentenceId);
        
        // If not found, try to find by extracting number from complex node IDs
        if (!node) {
          // Look for a node ID that contains the simple ID pattern
          for (const [nodeId, nodeData] of currentPage.sentenceNodes.entries()) {
            // Extract number from complex ID like "node-6-1756090087664" → "6"
            const match = nodeId.match(/^node-(\d+)-\d+$/);
            if (match && match[1] === sentenceId) {
              node = nodeData;
              console.log(`🔍 Mapped simple ID "${sentenceId}" to complex ID "${nodeId}"`);
              break;
            }
          }
        }
        
        if (node && node.content) {
          const success = currentNarrativeRef.current!.highlightSentence(node.content);
          if (success) {
            highlightedCount++;
            console.log(`✅ Highlighted sentence ${sentenceId}:`, node.content.substring(0, 50) + '...');
          } else {
            console.warn(`⚠️ Failed to highlight sentence ${sentenceId}:`, node.content);
          }
        } else {
          console.warn(`⚠️ Sentence ID ${sentenceId} not found in sentence nodes`);
        }
      });
      
      console.log(`🎨 PagedNarrativeSystem: Successfully highlighted ${highlightedCount} out of ${sentenceIds.length} sentences`);
      return highlightedCount > 0;
    }
  }), [
    currentPageId, pages, pageOrder, getCurrentPage, createNewPage, 
    switchToPage, deletePage, createSentenceNode, updatePageSentenceTree,
    getBranchesForSentence, createBranchFromSentence, pageTreeDict
  ]);

  // Handle page reset (clear content, tree, and timeline)
  const handleResetPage = useCallback(() => {
    const targetPageId = currentPageId;
    console.log(`🧹 Resetting page content for: ${targetPageId}`);
    
    const page = pages.get(targetPageId);
    if (!page) {
      console.log(`⚠️ Page ${targetPageId} not found`);
      return;
    }
    
    // Clear all page content by resetting the sentence tree and active path
    setPages(prev => {
      const newPages = new Map(prev);
      const clearedPage: NarrativePage = {
        ...page,
        sentenceNodes: new Map(),
        activePath: [],
        hasContent: false,
        lastModified: Date.now()
      };
      newPages.set(targetPageId, clearedPage);
      
      // Update tree dictionary
      updateTreeDict(targetPageId, clearedPage);
      
      return newPages;
    });
    
    // Clear the narrative editor content
    if (currentNarrativeRef.current) {
      currentNarrativeRef.current.updateContent('');
    }
    
    // Notify parent component to clear timeline
    if (onPageReset) {
      onPageReset(targetPageId);
    }
    
    console.log(`✅ Reset page content for: ${targetPageId}`);
  }, [currentPageId, pages, updateTreeDict, onPageReset]);

  // Don't render until we have at least one page
  if (pages.size === 0 || !currentPageId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Initializing narrative system...</div>
      </div>
    );
  }

  const currentPageIndex = pageOrder.indexOf(currentPageId);
  const currentPage = getCurrentPage();

  return (
    <div className="h-full flex flex-col">
      {/* Main narrative editor - takes most of the space */}
      <div className="flex-1 overflow-hidden">
        <NarrativeLayer 
          ref={currentNarrativeRef}
          prompt={prompt}
          onSentenceEnd={handleSentenceEnd}
          onSentenceSelect={handleSentenceSelect}
          onSuggestionReceived={handleSuggestionReceived}
          onSuggestionResolved={handleSuggestionResolved}
          onGenerateVisualization={handleGenerateVisualization}
          disableInteractions={disableInteractions}
          onContentChange={handleContentChange}
          getBranchesForSentence={getBranchesForSentence}
          onSwitchToBranch={onSwitchToBranch}
          onCreateBranch={onCreateBranch}
          onUpdateBranchContent={onUpdateBranchContent}
          onEnterEditMode={onEnterEditMode}
          onExitEditMode={onExitEditMode}
          findNodeIdByContent={findNodeIdByContent}
          onDeleteSentence={onDeleteSentence}
          onDeleteBranch={onDeleteBranch}
          onInsertNodeAfter={onInsertNodeAfter}
          updateSentenceNodeContent={updateSentenceNodeContent}
          currentEditSentenceId={currentEditSentenceId}
          onResetPage={handleResetPage}
        />
      </div>

      {/* Footer with navigation and page controls */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className={`p-2 rounded-md ${
                currentPageIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="Previous page"
            >
              <MdChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={goToNextPage}
              disabled={currentPageIndex === pageOrder.length - 1}
              className={`p-2 rounded-md ${
                currentPageIndex === pageOrder.length - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="Next page"
            >
              <MdChevronRight className="h-5 w-5" />
            </button>
            
            {/* Add new page button */}
            <button
              onClick={createAndSwitchToNewPage}
              disabled={!canCreateNewPage}
              className={`p-2 rounded-md ${
                !canCreateNewPage
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
              title={
                !canCreateNewPage
                  ? pages.size >= maxPages
                    ? `Maximum ${maxPages} pages reached`
                    : 'Add content to current page first'
                  : 'Add new page'
              }
            >
              <MdAdd className="h-5 w-5" />
            </button>
            
            {/* Delete page button - only show for non-first pages */}
            {currentPageIndex > 0 && (
              <button
                onClick={handleDeleteCurrentPage}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-60 hover:opacity-100 transition-opacity"
                title="Delete this page (cannot be undone)"
              >
                <MdDelete className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right side - Page indicator */}
          <div className="text-sm text-gray-500">
            Page {currentPageIndex + 1} of {pageOrder.length}
          </div>
        </div>
      </div>
    </div>
  );
});

PagedNarrativeSystem.displayName = 'PagedNarrativeSystem';

export default PagedNarrativeSystem;