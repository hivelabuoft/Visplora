'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DatasetExplorer from '../components/DatasetExplorer';
import CopilotChatPanel from '../components/CopilotChatPanel';
import CopilotCanvas from '../components/CopilotCanvas';
import FileSummaryCanvas from '../components/FileSummaryCanvas';
import { generateMultipleFileSummaries, FileSummary } from '../../utils/londonDataLoader';
import { interactionLogger } from '../../lib/interactionLogger';
import '../../styles/dataExplorer.css';
import { AnalyzingState, EmptyCanvas } from '../components/EmptyStates';

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

export default function CopilotPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<DatasetFile[]>([]);
  const [fileSummaries, setFileSummaries] = useState<FileSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string>('');
  const [analysisTimeoutId, setAnalysisTimeoutId] = useState<NodeJS.Timeout | null>(null);

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

  // Handle analysis request from chat panel
  const handleGenerateDashboard = async (prompt: string) => {
    console.log('🚀 Starting dashboard generation for prompt:', prompt);
    
    setCurrentPrompt(prompt);
    setIsAnalyzing(true);
    
    // Log the generate dashboard interaction
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
    
    // Simulate analysis time (3 seconds)
    const analysisTime = 3000;
    
    const timeoutId = setTimeout(() => {
      setIsAnalyzing(false);
      setShowCanvas(true);
      setAnalysisTimeoutId(null);
    }, analysisTime);
    
    setAnalysisTimeoutId(timeoutId);
  };

  // Handle canceling the analysis
  const handleCancelAnalysis = () => {
    // Clear the timeout if it exists
    if (analysisTimeoutId) {
      clearTimeout(analysisTimeoutId);
      setAnalysisTimeoutId(null);
    }
    
    setIsAnalyzing(false);
    setCurrentPrompt('');
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
          <p className="text-gray-600">Loading copilot workspace...</p>
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
        {/* Left Section - Chat Panel (30%) */}
        <div className="w-[30%] border-r border-gray-200">
          {showCanvas ? (
            <CopilotChatPanel 
              onGenerateDashboard={handleGenerateDashboard}
              isGenerating={isAnalyzing}
              selectedFiles={selectedFiles}
              fileSummaries={fileSummaries}
              summaryLoading={summaryLoading}
              summaryError={summaryError}
            />
          ) : (
            <DatasetExplorer 
              onAnalysisRequest={handleGenerateDashboard}
              onFileSelection={handleFileSelection}
              isAnalyzing={summaryLoading}
            />
          )}
        </div>

        {/* Right Section - Canvas (70%) */}
        <div className="flex-1">
          {showCanvas ? (
            <CopilotCanvas 
              dashboardPrompt={currentPrompt}
              onInteraction={logDashboardInteraction}
            />
          ) : selectedFiles.length > 0 ? (
            <div className="relative w-full h-full">
              <FileSummaryCanvas 
                summaries={fileSummaries}
                isLoading={summaryLoading}
                error={summaryError}
              />
              {isAnalyzing && (
                <AnalyzingState 
                  prompt={currentPrompt}
                  onStop={handleCancelAnalysis}
                />
              )}
            </div>
          ) : (
            <div className="relative w-full h-full">
              <EmptyCanvas />
              {isAnalyzing && (
                <AnalyzingState 
                  prompt={currentPrompt}
                  onStop={handleCancelAnalysis}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


