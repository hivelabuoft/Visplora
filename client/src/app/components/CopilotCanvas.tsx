'use client';

import React, { useRef, useState, useEffect } from 'react';
import ReactFlowCanvas, { ReactFlowCanvasRef } from './ReactFlowCanvas';
import LondonDashboard from '../london/page';
import { getDashboardByQuestion } from './PremadeQuestions';
import { DashboardWithCharts } from './Dashboards';

interface CopilotCanvasProps {
  dashboardPrompt?: string;
  className?: string;
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: unknown) => void;
}

const CopilotCanvas: React.FC<CopilotCanvasProps> = ({
  dashboardPrompt = '',
  className = '',
  onInteraction
}) => {
  const reactFlowCanvasRef = useRef<ReactFlowCanvasRef>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  // Generate dashboard when prompt changes (only for actual prompts, not empty ones)
  useEffect(() => {
    if (dashboardPrompt && dashboardPrompt.trim() && dashboardPrompt !== lastPrompt) {
      generateDashboardFromPrompt(dashboardPrompt);
      setLastPrompt(dashboardPrompt);
    } else if (!dashboardPrompt || !dashboardPrompt.trim()) {
      // If prompt is empty or cleared, don't generate any dashboard
      setLastPrompt('');
    }
  }, [dashboardPrompt, lastPrompt]);

  const generateDashboardFromPrompt = (prompt: string) => {
    console.log('🔍 Generating dashboard for prompt:', prompt);
    setIsGenerating(true);
    setError(null);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      // Look for premade dashboard
      const dashboard = getDashboardByQuestion(prompt);
      console.log('📊 Found dashboard:', dashboard);
      
      if (dashboard && reactFlowCanvasRef.current) {
        // Convert DashboardWithCharts to VegaDashboardData format
        const vegaDashboardData = {
          dashboardTitle: dashboard.title,
          views: dashboard.charts.map(chart => ({
            description: chart.title,
            vegaLiteSpec: chart.spec
          })),
          insightPanels: dashboard.insights,
          onInteraction: (chartIndex: number, name: string, value: any) => {
            const chart = dashboard.charts[chartIndex];
            if (chart && onInteraction) {
              onInteraction(chart.id, chart.title, 'chart', 'interaction', { name, value });
            }
          }
        };

        // Add the dashboard as a node to the ReactFlow canvas
        reactFlowCanvasRef.current.addVegaDashboardNode(vegaDashboardData);
        setIsGenerating(false);
        setError(null);
        console.log('✅ Dashboard node added successfully:', dashboard.title);
      } else {
        console.log('❌ No dashboard found for prompt:', prompt);
        setError(`No premade dashboard available for: "${prompt}"`);
        setIsGenerating(false);
      }
    }, 500);
  };

  const handleDashboardInteraction = (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
    console.log('Dashboard interaction:', { elementId, elementName, elementType, action, metadata });
    if (onInteraction) {
      onInteraction(elementId, elementName, elementType, action, metadata);
    }
  };

  return (
    <div className={`h-full bg-gray-100 ${className}`}>
      {/* Canvas Area - Full height */}
      <div className="h-full relative">
        <ReactFlowCanvas 
          ref={reactFlowCanvasRef}
          showDashboard={true} // Always show London dashboard when canvas is displayed
          dashboardConfig={{
            name: 'London Dashboard',
            width: 1400,
            height: 1050,
            minWidth: 500,
            minHeight: 500,
            maxWidth: 1600,
            maxHeight: 1100,
          }}
        >
          <LondonDashboard onInteraction={handleDashboardInteraction} />
        </ReactFlowCanvas>
      </div>
    </div>
  );
};

export default CopilotCanvas;
