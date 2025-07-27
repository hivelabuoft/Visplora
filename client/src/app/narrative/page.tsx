'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NarrativeCanva from '../components/NarrativeCanva';
import DatasetExplorer from '../components/DatasetExplorer';
import NarrativeLayer from '../components/NarrativeLayer';
import FileSummaryCanvas from '../components/FileSummaryCanvas';
import { EmptyCanvas, EmptyTimeline, AnalyzingState } from '../components/EmptyStates';
import ReactFlowCanvas from '../components/ReactFlowCanvas';
import LondonDashboard from '../london/page'; //this should be a different input after you have the right component for dashboard
import { generateMultipleFileSummaries, FileSummary } from '../../utils/londonDataLoader';
import { interactionLogger } from '../../lib/interactionLogger';
import { captureAndLogInteractions } from '../utils/dashboardConfig';
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
      {isStudyMode && (        <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 text-sm">
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
              prompt={currentPrompt}
              onSentenceEnd={handleSentenceEnd}
              onSentenceSelect={handleSentenceSelect}
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
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              <button
                onClick={() => captureAndLogInteractions()}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 border"
                style={{ 
                  backgroundColor: '#c5cea180', 
                  color: '#5a6635',
                  borderColor: '#c5cea1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c5cea1b3';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#c5cea180';
                }}
                title="Capture current view"
              >
                Capture
              </button>
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
                title="View inquiries and questions"
              >
                Inquiries
              </button>
            </div>
            
            {showDashboard && shouldShowLondonDashboard ? (
              <ReactFlowCanvas 
                key="london-flow-canvas"
                showDashboard={true}
                dashboardConfig={{
                  name: 'London Housing Dashboard',
                  width: 1500,
                  height: 1200,
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


