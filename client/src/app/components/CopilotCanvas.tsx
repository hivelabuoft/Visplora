'use client';

import React, { useRef } from 'react';
import ReactFlowCanvas, { ReactFlowCanvasRef } from './ReactFlowCanvas';
import LondonDashboard from '../london/page';

interface CopilotCanvasProps {
  dashboardPrompt?: string;
  className?: string;
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
}

const CopilotCanvas: React.FC<CopilotCanvasProps> = ({
  dashboardPrompt = '',
  className = '',
  onInteraction
}) => {
  const reactFlowCanvasRef = useRef<ReactFlowCanvasRef>(null);

  const handleDashboardInteraction = (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
    console.log('Dashboard interaction:', { elementId, elementName, elementType, action, metadata });
    if (onInteraction) {
      onInteraction(elementId, elementName, elementType, action, metadata);
    }
  };

  return (
    <div className={`h-full bg-gray-100 ${className}`}>
      {/* Canvas Area - Full height without toolbar */}
      <div className="h-full relative">
        <ReactFlowCanvas 
          ref={reactFlowCanvasRef}
          showDashboard={!!dashboardPrompt}
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
