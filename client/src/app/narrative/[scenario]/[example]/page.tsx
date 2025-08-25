'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DatasetExplorer from '../../../components/DatasetExplorer';
import PagedNarrativeSystem, { PagedNarrativeSystemRef } from '../../../components/PagedNarrativeSystem';
import FileSummaryCanvas from '../../../components/FileSummaryCanvas';
import { EmptyCanvas, EmptyTimeline, AnalyzingState, TimelineVisualization } from '../../../components/EmptyStates';
import ReactFlowCanvas, { ReactFlowCanvasRef } from '../../../components/ReactFlowCanvas';
import InquiryBoard, { InquiryBoardRef } from '../../../components/InquiryBoard';
import LondonDashboard from '../../../london/page';
import { generateMultipleFileSummaries, FileSummary } from '../../../../utils/londonDataLoader';
import { interactionLogger } from '../../../../lib/interactionLogger';
import { captureAndLogInteractions, getCapturedInteractionCount } from '../../../utils/dashboardConfig';
import { captureInsights, NarrativeSuggestion } from '../../../LLMs/suggestion_from_interaction';
import { getVisualizationRecommendation, VisualizationRecommendation, isDashboardRecommendation } from '../../../LLMs/visualizationRecommendation';
import { generateInsightTimeline, TimelineGroup, ChangeMetadata } from '../../../LLMs/insightTimeline';
import '../../../../styles/dataExplorer.css';
import '../../../../styles/narrativeLayer.css';

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

interface ExplorationPathNode {
  sentence_id: number;
  sentence_content: string;
  children: number[];
  parent: number | null;
  system_shows: string;
  drift_type: string;
}

interface DataStoryEntry {
  data_story_sentence: string;
  ref_id: number;
}

interface Inquiry {
  qid: string;
  title: string;
  status: string;
  sentenceRefs: string[];
  position_suggested_by: {
    text: string;
    confidence: string;
  };
  argument_suggested_by: {
    text: string;
    basis: string;
  };
  links: Array<{
    qid: string;
    type: string;
    explanation: string;
  }>;
}

interface ExampleData {
  exploration_path: ExplorationPathNode[];
  data_story: DataStoryEntry[];
  inquiries: Inquiry[];
}

export default function DynamicNarrativePage() {
  const router = useRouter();
  const params = useParams();
  const scenario = params?.scenario as string;
  const example = params?.example as string;
  
  const narrativeSystemRef = useRef<PagedNarrativeSystemRef>(null);
  const reactFlowCanvasRef = useRef<ReactFlowCanvasRef>(null);
  const inquiryBoardRef = useRef<InquiryBoardRef>(null);
  
  // Add client-side only state to prevent hydration mismatches
  const [isClient, setIsClient] = useState(false);
  const [exampleData, setExampleData] = useState<ExampleData | null>(null);
  const [isLoadingExample, setIsLoadingExample] = useState(true);
  const [loadingError, setLoadingError] = useState<string>('');
  
  // Separate state for the three main attributes
  const [explorationPath, setExplorationPath] = useState<ExplorationPathNode[]>([]);
  const [dataStory, setDataStory] = useState<DataStoryEntry[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showInquiryBoard, setShowInquiryBoard] = useState(false);
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

  // Load example data based on URL parameters
  useEffect(() => {
    const loadExampleData = async () => {
      if (!scenario || !example) return;
      
      setIsLoadingExample(true);
      setLoadingError('');
      
      try {
        const response = await fetch(`/examples/scenario${scenario}/example${example}.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to load example: ${response.status} ${response.statusText}`);
        }
        
        const data: ExampleData = await response.json();
        setExampleData(data);
        
        // Set the three main attributes in separate state variables
        setExplorationPath(data.exploration_path || []);
        setDataStory(data.data_story || []);
        setInquiries(data.inquiries || []);
        
        console.log(`📄 Loaded example data for scenario ${scenario}, example ${example}:`, {
          exploration_path: data.exploration_path?.length || 0,
          data_story: data.data_story?.length || 0,
          inquiries: data.inquiries?.length || 0
        });
        
        // Set up narrative with initial content if available
        if (data.exploration_path && data.exploration_path.length > 0) {
          const initialContent = data.exploration_path
            .map(node => node.sentence_content)
            .join(' ');
          
          setCurrentPrompt(`Loaded from scenario ${scenario}, example ${example}: ${initialContent.substring(0, 200)}...`);
          
          // Show narrative layer by default when loading an example
          setShowNarrativeLayer(true);
          setShowDashboard(true);
        }
        
      } catch (error) {
        console.error('❌ Failed to load example data:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to load example data');
      } finally {
        setIsLoadingExample(false);
      }
    };
    
    loadExampleData();
  }, [scenario, example]);

  // Initialize narrative system with example data
  useEffect(() => {
    if (explorationPath.length > 0 && narrativeSystemRef.current && isClient && showNarrativeLayer) {
      console.log('🔧 Initializing narrative system with exploration path data:', explorationPath.length, 'nodes');
      
      // Small delay to ensure the narrative layer is fully rendered
      setTimeout(() => {
        if (narrativeSystemRef.current) {
          // Initialize the tree structure with the exploration path
          narrativeSystemRef.current.initializeWithExampleTree(explorationPath);
          
          console.log('✅ Narrative system initialized with example tree structure');
          
          // Verify the tree was created correctly
          setTimeout(() => {
            if (narrativeSystemRef.current) {
              const treeState = narrativeSystemRef.current.debugGetCurrentTreeState?.();
              console.log('🌳 Final tree state after initialization:', treeState);
              
              const pageContent = narrativeSystemRef.current.getPageContent(narrativeSystemRef.current.getCurrentPageId());
              console.log('📄 Page content after initialization:', pageContent.substring(0, 200) + '...');
            }
          }, 500);
        }
      }, 200);
    }
  }, [explorationPath, isClient, showNarrativeLayer]); // Added showNarrativeLayer to dependencies

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
        },
        getExampleData: () => exampleData,
        getScenarioExample: () => ({ scenario, example }),
        // NEW: Access to the three main attributes
        getExplorationPath: () => explorationPath,
        getDataStory: () => dataStory,
        getInquiries: () => inquiries,
        // Helper to reinitialize tree
        reinitializeTree: () => {
          if (narrativeSystemRef.current && explorationPath.length > 0) {
            narrativeSystemRef.current.initializeWithExampleTree(explorationPath);
          }
        },
        // Helper to force refresh narrative content
        forceRefreshNarrative: () => {
          if (narrativeSystemRef.current) {
            const currentPageId = narrativeSystemRef.current.getCurrentPageId();
            const content = narrativeSystemRef.current.getPageContent(currentPageId);
            console.log('🔄 Current page content:', content);
            return content;
          }
        },
        // Helper to check if narrative layer has content
        checkNarrativeContent: () => {
          if (narrativeSystemRef.current) {
            const tree = narrativeSystemRef.current.debugGetCurrentTreeState?.();
            const content = narrativeSystemRef.current.getPageContent(narrativeSystemRef.current.getCurrentPageId());
            return {
              treeNodeCount: tree?.nodeCount || 0,
              contentLength: content.length,
              content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
              showNarrativeLayer: showNarrativeLayer
            };
          }
        },
        // Helper to check timeline data
        checkTimelineData: () => {
          const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
          const timeline = insightTimelinesByPage[currentPageId];
          return {
            currentPageId,
            hasTimeline: !!timeline,
            timelineNodeCount: timeline?.groups.length || 0,
            timelineNodes: timeline?.groups.map(g => ({
              sentence_id: g.sentence_id,
              drift_type: g.changed_from_previous?.drift_types[0],
              content: g.sentence_content.substring(0, 50) + '...'
            })) || []
          };
        },
        // Helper to manually trigger timeline update
        updateTimeline: () => {
          if (explorationPath.length > 0 && narrativeSystemRef.current) {
            const currentPageId = narrativeSystemRef.current.getCurrentPageId();
            const timelineGroups = convertExplorationPathToTimeline(explorationPath);
            setInsightTimelinesByPage(prev => ({
              ...prev,
              [currentPageId]: { groups: timelineGroups }
            }));
            console.log('🔄 Timeline manually updated with', timelineGroups.length, 'nodes');
            return timelineGroups.length;
          }
          return 0;
        }
      };
    }
  }, [explorationPath, dataStory, inquiries, scenario, example, showNarrativeLayer]);

  // Define timeline group structure and state management
  interface TimelineGroup {
    node_id: number;
    sentence_id: string;
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
      dataDrivenSummary?: string; // Optional summary for the timeline
    };
  }

  // Function to convert exploration path to timeline groups
  const convertExplorationPathToTimeline = useCallback((pathNodes: ExplorationPathNode[]): TimelineGroup[] => {
    if (!pathNodes || pathNodes.length === 0) {
      return [];
    }

    return pathNodes.map((node, index) => {
      // Convert parent from number to string, handle null case
      const parentId = node.parent !== null ? node.parent.toString() : '';
      
      // Convert children from number[] to string[]
      const childIds = node.children.map(childId => childId.toString());

      // Create the timeline group
      const timelineGroup: TimelineGroup = {
        node_id: node.sentence_id,
        sentence_id: node.sentence_id.toString(),
        sentence_content: node.sentence_content,
        parent_id: parentId,
        child_ids: childIds,
        changed_from_previous: {
          drift_types: [node.drift_type], // Convert single drift_type to array
          severity: 'medium', // Default value
          dimensions: {} // Empty for now
        },
        hover: {
          title: node.sentence_content,
          source: {
            dataset: 'London Housing Data',
            geo: 'London Boroughs',
            time: '2023-2024',
            measure: ['Rent', 'Income', 'Crime Rate', 'Amenities'],
            unit: 'Various'
          },
          reflect: [
            {
              prompt: `What insights led to: "${node.sentence_content}"?`,
              reason: `This ${node.drift_type} builds upon the previous analysis.`,
              related_sentence: index > 0 ? {
                node_id: pathNodes[index - 1].sentence_id,
                sentence_content: pathNodes[index - 1].sentence_content
              } : null
            }
          ],
          dataDrivenSummary: undefined // Will be populated by API call
        }
      };

      return timelineGroup;
    });
  }, []);

  const [insightTimelinesByPage, setInsightTimelinesByPage] = useState<Record<string, { groups: TimelineGroup[] }>>({});
  const [timelineLoadingByPage, setTimelineLoadingByPage] = useState<Record<string, boolean>>({});
  const [recentlyUpdatedSentence, setRecentlyUpdatedSentence] = useState<{
    pageId: string;
    sentence: string;
    timestamp: number;
  } | null>(null);

  // Update timeline when exploration path changes
  useEffect(() => {
    if (explorationPath.length > 0 && narrativeSystemRef.current && isClient && showNarrativeLayer) {
      // Add a small delay to ensure narrative system is fully initialized
      const timeoutId = setTimeout(() => {
        if (narrativeSystemRef.current) {
          const currentPageId = narrativeSystemRef.current.getCurrentPageId();
          console.log('🔄 Converting exploration path to timeline data:', explorationPath.length, 'nodes');
          console.log('📍 Current page ID for timeline:', currentPageId);
          
          const timelineGroups = convertExplorationPathToTimeline(explorationPath);
          console.log('📊 Generated timeline groups:', timelineGroups.map(g => ({
            sentence_id: g.sentence_id,
            drift_type: g.changed_from_previous?.drift_types[0],
            parent_id: g.parent_id,
            child_ids: g.child_ids
          })));
          
          setInsightTimelinesByPage(prev => ({
            ...prev,
            [currentPageId]: { groups: timelineGroups }
          }));
          
          console.log('✅ Timeline populated for page:', currentPageId, 'with', timelineGroups.length, 'groups');
        }
      }, 300); // Small delay to ensure narrative system is ready
      
      return () => clearTimeout(timeoutId);
    }
  }, [explorationPath, convertExplorationPathToTimeline, isClient, showNarrativeLayer]);

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
    setInteractionCount(prev => prev + 1);
  };
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const studyMode = process.env.NEXT_PUBLIC_STUDY_MODE === 'true';
        setIsStudyMode(studyMode);

        const defaultDashboard = process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD;
        setShouldShowLondonDashboard(defaultDashboard === '1');

        if (studyMode) {
          const userStr = localStorage.getItem('narrativeUser');
          const token = localStorage.getItem('narrativeToken');
          
          if (userStr && token) {
            const user = JSON.parse(userStr);
            
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

  // Track info node status from ReactFlow canvas
  useEffect(() => {
    const checkInfoNodes = () => {
      if (reactFlowCanvasRef.current) {
        const hasActive = reactFlowCanvasRef.current.hasActiveInfoNode();
        setHasActiveInfoNodes(hasActive);
      }
    };

    checkInfoNodes();
  }, [showDashboard]);

  // Handle analysis request
  const handleAnalysisRequest = async (prompt: string) => {
    setCurrentPrompt(prompt);
    setIsAnalyzing(true);
    
    try {
      await interactionLogger.logDashboardGeneration(prompt);
    } catch (error) {
      console.error('❌ Failed to log dashboard generation:', error);
    }
    
    const analysisTime = 4000;
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowNarrativeLayer(true);
      
      if (shouldShowLondonDashboard) {
        setShowDashboard(true);
      }
    }, analysisTime);
  };

  // Essential handlers for PagedNarrativeSystem
  const handleSentenceEnd = async (sentence: string, confidence: number, pageId: string) => {
    console.log(`🧠 Sentence completed on page ${pageId}: "${sentence}" (Confidence: ${confidence})`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Analysis complete for: "${sentence}" on page ${pageId}`);
      
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

  const handleSentenceSelect = (sentence: string, index: number, pageId: string) => {
    console.log(`📝 Sentence selected on page ${pageId}: "${sentence}" (Index: ${index})`);
    
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

  const handleSuggestionReceived = (suggestion: NarrativeSuggestion, pageId: string) => {
    setHasPendingSuggestion(true);
  };

  const handleSuggestionResolved = (pageId: string) => {
    setHasPendingSuggestion(false);
  };

  const handleContentChangeWrapper = (oldContent: string, newContent: string, pageId: string) => {
    console.log(`🔄 Content changed on page ${pageId}: "${oldContent}" → "${newContent}"`);
  };

  const handleSentenceEdit = useCallback((oldContent: string, newContent: string, nodeId: string, pageId: string) => {
    console.log(`💾 Sentence edited on page ${pageId}: "${oldContent}" → "${newContent}" (node: ${nodeId})`);
    
    setRecentlyUpdatedSentence({
      pageId: pageId,
      sentence: newContent,
      timestamp: Date.now()
    });
  }, []);

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

  // Handle showing inquiry board
  const handleShowInquiryBoard = () => {
    console.log('🔍 Switching to inquiry board view');
    setShowInquiryBoard(true);
    setShowDashboard(false);
  };

  // Handle returning from inquiry board
  const handleBackToViews = () => {
    console.log('← Returning to main views from inquiry board');
    setShowInquiryBoard(false);
    setShowDashboard(true);
  };

  // Use effect to track interaction count changes
  useEffect(() => {
    const updateInteractionCount = () => {
      const currentCount = getCapturedInteractionCount();
      setInteractionCount(currentCount);
    };

    updateInteractionCount();

    const resetTimer = setTimeout(() => {
      setInteractionCount(0);
      const existingCount = getCapturedInteractionCount();
      if (existingCount > 0) {
        captureAndLogInteractions();
      }
    }, 2000);

    const interval = setInterval(updateInteractionCount, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(resetTimer);
    };
  }, []);

  if (isLoading || isLoadingExample) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingExample 
              ? `Loading example scenario ${scenario}/${example}...` 
              : 'Loading narrative visualization...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Example</h1>
          <p className="text-gray-600 mb-4">{loadingError}</p>
          <p className="text-sm text-gray-500 mb-6">
            Requested: scenario {scenario}, example {example}
          </p>
          <button
            onClick={() => router.push('/narrative')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Return to Main Narrative
          </button>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with example info */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 text-sm">
        <div className="flex justify-between items-center">
          <span>
            📊 Example Scenario {scenario}.{example} • Go back to main page to start your own exploration
            {isStudyMode && (
              <> • Participant: {userSession.participantId} • {userSession.firstName} {userSession.lastName}</>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/narrative')}
              className="px-3 py-1 bg-cyan-800 hover:bg-cyan-900 rounded text-xs transition-colors"
            >
              Return to Main
            </button>
            {isStudyMode && (
              <button
                className="px-3 py-1 bg-cyan-800 hover:bg-cyan-900 rounded text-xs transition-colors"
                onClick={async () => {
                  await interactionLogger.logButtonClick('end_session_button', 'End Session');
                  localStorage.removeItem('narrativeUser');
                  localStorage.removeItem('narrativeToken');
                  router.push('/narrative-login');
                }}
              >
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex h-screen" style={{ height: 'calc(100vh - 40px)' }}>
        {/* Left Section - 40% */}
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
              onBranchSwitch={(branchId: string, pageId: string) => {
                console.log('Branch switch:', branchId, 'on page:', pageId);
              }}
              onBranchDelete={(branchId: string, pageId: string) => {
                console.log('Branch delete:', branchId, 'on page:', pageId);
              }}
              onSentenceDelete={(sentenceId: string, pageId: string) => {
                console.log('Sentence delete:', sentenceId, 'on page:', pageId);
              }}
              onPageChange={(fromPageId: string, toPageId: string) => {
                console.log(`📄 Page changed from ${fromPageId} to ${toPageId}`);
              }}
              onPageReset={(pageId: string) => {
                console.log('🧹 Page reset:', pageId);
              }}
              onGenerateVisualization={async (sentence: string, validation: any, pageId: string) => {
                if (reactFlowCanvasRef.current) {
                  let content = `Sentence: "${sentence}"\n\nSupported: ${validation.inquiry_supported ? 'Yes' : 'No'}\n\nExplanation: ${validation.explanation || 'No explanation provided'}`;
                  
                  if (validation.inquiry_supported) {
                    try {
                      reactFlowCanvasRef.current.showLoadingState('Generating AI-powered visualization recommendations...');
                      
                      const recommendation = await getVisualizationRecommendation(
                        sentence,
                        'London demographic, transport, housing, and crime data',
                        ['London Demographics', 'Transport Data', 'Housing Statistics', 'Crime Reports']
                      );
                      
                      reactFlowCanvasRef.current.hideLoadingState();
                      
                      if (isDashboardRecommendation(recommendation)) {
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
            {/* Canvas Action Buttons */}
            {showDashboard && (
              <div className="absolute top-4 right-4 z-50 flex gap-2">
                <div className="relative group">
                  <button
                    onClick={async () => {
                      const hasInteractions = interactionCount > 0;
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes || !hasNarrativeContent;
                      
                      if (isDisabled) return;
                      
                      setIsCapturingInsights(true);
                      
                      try {
                        const capturedInteractions = captureAndLogInteractions();
                        setDashboardInteractions([]);
                        
                        const narrativeContext = narrativeContent;
                        const currentSentence = '';
                        
                        const suggestion = await captureInsights(
                          capturedInteractions,
                          narrativeContext,
                          currentSentence
                        );
                        
                        if (suggestion && suggestion.narrative_suggestion) {
                          const currentPageId = narrativeSystemRef.current?.getCurrentPageId();
                          if (currentPageId) {
                            narrativeSystemRef.current?.showSuggestion(suggestion, currentPageId);
                          }
                        }
                      } catch (error) {
                        console.error('❌ Failed to capture insights:', error);
                      } finally {
                        setIsCapturingInsights(false);
                      }
                    }}
                    disabled={(() => {
                      const hasInteractions = interactionCount > 0;
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      return isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes || !hasNarrativeContent;
                    })()}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 border ${
                      (() => {
                        const hasInteractions = interactionCount > 0;
                        const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                        const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                        const hasNarrativeContent = narrativeContent.trim().length > 0;
                        const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes || !hasNarrativeContent;
                        return isDisabled ? 'opacity-60 cursor-not-allowed' : '';
                      })()
                    }`}
                    style={(() => {
                      const hasInteractions = interactionCount > 0;
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes || !hasNarrativeContent;
                      return {
                        backgroundColor: isDisabled ? '#e5e7eb' : '#c5cea180', 
                        color: isDisabled ? '#6b7280' : '#5a6635',
                        borderColor: isDisabled ? '#d1d5db' : '#c5cea1'
                      };
                    })()}
                    onMouseEnter={(e) => {
                      const hasInteractions = interactionCount > 0;
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes || !hasNarrativeContent;
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = '#c5cea1b3';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const hasInteractions = interactionCount > 0;
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = isCapturingInsights || hasPendingSuggestion || !hasInteractions || hasActiveInfoNodes || !hasNarrativeContent;
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
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      
                      if (!hasNarrativeContent) {
                        return 'Write some narrative content first';
                      } else if (!hasInteractions) {
                        return 'Interact with the dashboard first to capture insights';
                      } else if (hasActiveInfoNodes) {
                        return 'Close info nodes before capturing insights';
                      } else if (hasPendingSuggestion) {
                        return 'Resolve current suggestion first';
                      } else if (isCapturingInsights) {
                        return 'Processing...';
                      } else {
                        return 'Capture insight for recent interactions';
                      }
                    })()}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <button
                    onClick={() => {
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      if (!hasNarrativeContent) return;
                      
                      handleShowInquiryBoard();
                    }}
                    disabled={(() => {
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      return !hasNarrativeContent;
                    })()}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 border ${
                      (() => {
                        const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                        const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                        const hasNarrativeContent = narrativeContent.trim().length > 0;
                        const isDisabled = !hasNarrativeContent;
                        return isDisabled ? 'opacity-60 cursor-not-allowed' : '';
                      })()
                    }`}
                    style={(() => {
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = !hasNarrativeContent;
                      return {
                        backgroundColor: isDisabled ? '#e5e7eb' : '#f5bc7880', 
                        color: isDisabled ? '#6b7280' : '#8b5a2b',
                        borderColor: isDisabled ? '#d1d5db' : '#f5bc78'
                      };
                    })()} 
                    onMouseEnter={(e) => {
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = !hasNarrativeContent;
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = '#f5bc78b3';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                      const narrativeContent = narrativeSystemRef.current?.getPageContent(currentPageId) || '';
                      const hasNarrativeContent = narrativeContent.trim().length > 0;
                      const isDisabled = !hasNarrativeContent;
                      if (!isDisabled) {
                        e.currentTarget.style.backgroundColor = '#f5bc7880';
                      }
                    }}
                  >
                    Inquiries
                  </button>
                </div>
              </div>
            )}
            
            {showInquiryBoard ? (
              <InquiryBoard
                ref={inquiryBoardRef}
                onGoBack={handleBackToViews}
                pageId={narrativeSystemRef.current?.getCurrentPageId() || 'default-page'}
                scenario={scenario}
                example={example}
                treeStructure={(() => {
                  const currentPageId = narrativeSystemRef.current?.getCurrentPageId() || '';
                  const treeStructure = narrativeSystemRef.current?.getPageTree?.(currentPageId);
                  return treeStructure || { nodes: [], activePath: [] };
                })()}
                onHighlightSentences={(sentenceIds: string[]) => {
                  console.log('🎯 Example Page: Received request to highlight sentences:', sentenceIds);
                  if (narrativeSystemRef.current) {
                    const success = narrativeSystemRef.current.highlightSentencesByIds(sentenceIds);
                    if (success) {
                      console.log('✅ Example Page: Successfully highlighted sentences');
                    } else {
                      console.warn('⚠️ Example Page: Failed to highlight sentences');
                    }
                  } else {
                    console.warn('❌ Example Page: narrativeSystemRef not available');
                  }
                }}
              />
            ) : showDashboard && shouldShowLondonDashboard ? (
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
                const currentPageTree = narrativeSystemRef.current?.getCurrentPageTree?.();
                
                // Build active path from tree structure (convert internal node IDs to sentence IDs)
                let currentActivePath: string[] = [];
                if (currentPageTree?.activePath && currentPageTree.nodes) {
                  // Map internal node IDs to sentence IDs using the tree nodes
                  const nodeMap = new Map(currentPageTree.nodes.map(node => [node.id, node]));
                  currentActivePath = currentPageTree.activePath
                    .map(nodeId => {
                      const node = nodeMap.get(nodeId);
                      if (node) {
                        // Try to find matching timeline node by content
                        const matchingTimelineNode = currentTimeline.find(tNode => 
                          tNode.sentence_content.trim() === node.content.trim()
                        );
                        return matchingTimelineNode ? matchingTimelineNode.sentence_id : null;
                      }
                      return null;
                    })
                    .filter(id => id !== null) as string[];
                }
                
                const isTimelineLoading = timelineLoadingByPage[currentPageId] || false;
                
                console.log('🎯 Timeline render check:', {
                  currentPageId,
                  timelineLength: currentTimeline.length,
                  activePathLength: currentActivePath.length,
                  isLoading: isTimelineLoading,
                  activePath: currentActivePath
                });
                
                return currentTimeline.length > 0 ? (
                  <TimelineVisualization 
                    nodes={currentTimeline}
                    pageId={currentPageId}
                    activePath={currentActivePath}
                    isLoading={isTimelineLoading}
                    onNodeHighlight={(sentenceContent: string) => {
                      // Call the narrative system to highlight the sentence
                      if (narrativeSystemRef.current) {
                        const success = narrativeSystemRef.current.highlightSentence(sentenceContent);
                        if (success) {
                          console.log('✅ Timeline → Narrative: Successfully highlighted sentence');
                        } else {
                          console.log('❌ Timeline → Narrative: Failed to highlight sentence');
                        }
                      }
                    }}
                    onPathSwitch={(nodeId: string, newActivePath: string[]) => {
                      console.log(`🔄 Timeline path switch requested for node ${nodeId} on page ${currentPageId}`);
                      console.log(`🛤️ New active path from timeline:`, newActivePath);
                      
                      // Find the corresponding sentence content for the node
                      const targetTimelineNode = currentTimeline.find(node => node.sentence_id === nodeId);
                      if (targetTimelineNode && narrativeSystemRef.current) {
                        // Find the matching internal tree node by content
                        const tree = narrativeSystemRef.current.getCurrentPageTree();
                        if (tree?.nodes) {
                          const matchingTreeNode = tree.nodes.find(treeNode => 
                            treeNode.content.trim() === targetTimelineNode.sentence_content.trim()
                          );
                          
                          if (matchingTreeNode) {
                            console.log(`🎯 Found matching tree node: ${matchingTreeNode.id} for "${matchingTreeNode.content}"`);
                            
                            // Build the new active path in terms of internal tree node IDs
                            const internalNodePath: string[] = [];
                            for (const timelineNodeId of newActivePath) {
                              const timelineNode = currentTimeline.find(n => n.sentence_id === timelineNodeId);
                              if (timelineNode) {
                                const treeNode = tree.nodes.find(n => 
                                  n.content.trim() === timelineNode.sentence_content.trim()
                                );
                                if (treeNode) {
                                  internalNodePath.push(treeNode.id);
                                }
                              }
                            }
                            
                            console.log(`🔄 Converting timeline path to internal tree path:`, internalNodePath);
                            
                            // Call switchActivePath on the narrative system
                            if (internalNodePath.length > 0) {
                              narrativeSystemRef.current.switchActivePath(
                                currentPageId, 
                                matchingTreeNode.id, 
                                internalNodePath
                              );
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">
                        {explorationPath.length > 0 
                          ? "Timeline is being prepared from example data..." 
                          : "Timeline will appear as you interact with the narrative"
                        }
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}