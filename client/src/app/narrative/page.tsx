'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Handle sentence end detection for narrative layer
  const handleSentenceEnd = async (sentence: string, confidence: number) => {
    // console.log(`🧠 Sentence completed for analysis: "${sentence}" (Confidence: ${confidence})`);
    
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
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('❌ Error analyzing sentence:', error);
    }
  };

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
              onGenerateVisualization={(sentence: string, validation: any) => {
                // When NarrativeLayer wants to generate visualization, 
                // Add info node to canvas
                if (reactFlowCanvasRef.current) {
                  reactFlowCanvasRef.current.addInfoNode({
                    title: 'Analysis Result',
                    content: `Sentence: "${sentence}"\n\nSupported: ${validation.inquiry_supported ? 'Yes' : 'No'}\n\nExplanation: ${validation.explanation || 'No explanation provided'}`
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
              <EmptyTimeline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


