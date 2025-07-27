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
            setUserSession(user);
          } else {
            router.push('/narrative-login');
            return;
          }
        } else {
          // Demo mode
          setUserSession({
            userId: 'demo_user',
            participantId: 'DEMO',
            firstName: 'Demo',
            lastName: 'User',
            username: 'demo_user'
          });
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

  // Handle analysis request
  const handleAnalysisRequest = async (prompt: string) => {
    setCurrentPrompt(prompt);
    setIsAnalyzing(true);
    
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
              onClick={() => {
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
            {showDashboard && shouldShowLondonDashboard ? (
              <ReactFlowCanvas 
                key="london-flow-canvas"
                showDashboard={true}
              >
                <LondonDashboard />
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
              {showDashboard ? (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Analysis Timeline</h3>
                  <div className="flex items-center gap-2 h-8">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <div className="flex-1 h-1 bg-cyan-200 rounded"></div>
                    <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                    <div className="flex-1 h-1 bg-cyan-200 rounded"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Data Loading</span>
                    <span>Processing</span>
                    <span>Visualization</span>
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
