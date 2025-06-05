'use client';

import React, { useState } from 'react';
import { FiPlus, FiLayout, FiCheck, FiExternalLink, FiChevronDown, FiPlay } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface DashboardControlsProps {
  dashboardTitle: string;
  dashboardType: string;
  onAddToCanvas?: () => void;
  onPlaygroundMode?: () => void;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({
  dashboardTitle,
  dashboardType,
  onAddToCanvas,
  onPlaygroundMode
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const router = useRouter();

  const handleAddToCanvas = () => {
    // Add dashboard to localStorage for the canvas to pick up
    const dashboardData = {
      id: `dashboard-${dashboardType}-${Date.now()}`,
      title: dashboardTitle,
      type: 'dashboard',
      dashboardType: dashboardType,
      spec: {},
      position: {
        x: Math.random() * 200 + 50,
        y: Math.random() * 200 + 50
      },
      size: {
        width: 1000,
        height: 700
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Get existing visualizations from localStorage
    const existingVisualizations = JSON.parse(localStorage.getItem('canvasVisualizations') || '[]');
    
    // Add the new dashboard
    const updatedVisualizations = [...existingVisualizations, dashboardData];
    localStorage.setItem('canvasVisualizations', JSON.stringify(updatedVisualizations));

    // Show success state
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    // Call optional callback
    if (onAddToCanvas) {
      onAddToCanvas();
    }
  };

  const handleGoToCanvas = () => {
    router.push('/');
  };

  return (
    <div className="fixed top-4 right-4 z-50 transition-transform duration-200">
      <div className="bg-white w-50 rounded-lg shadow-lg border border-slate-200">
        {/* Header with collapse toggle */}
        <div className="rounded-lg items-center justify-between p-1 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-between w-full hover:cursor-pointer p-1 rounded-lg"
          >
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 hover:bg-blue-200 bg-blue-100 rounded flex items-center justify-center">
                <FiLayout size={14} className="text-blue-600" />
                </div>
                <span className="text-sm hover:underline font-medium text-slate-900 mr-2">Canvas Controls</span>
            </div>
            <FiChevronDown size={12} className='hover:bg-slate-200 rounded text-slate-600 w-4 h-4' style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>
        </div>

        {/* Collapsible content */}
        {!isCollapsed && (
          <div className="p-2 w-50">
            {/* Canvas Actions */}
            <div className="space-y-1 text-sm font-medium">
              <button
                onClick={() => onPlaygroundMode && onPlaygroundMode()}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded bg-purple-500 hover:bg-purple-600 text-white transition-colors"
              >
                <FiPlay size={14} />
                Playground Mode
              </button>
              
              <button
                onClick={handleAddToCanvas}
                disabled={isAdded}
                className={`w-full flex items-center justify-center gap-1.5 p-2 rounded transition-all duration-200 ${
                  isAdded
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isAdded ? (<><FiCheck size={14} />Added to VISplora</>) : (<><FiPlus size={14} />Add to VISplora</>)}
              </button>

              <button
                onClick={handleGoToCanvas}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <FiExternalLink size={14} />
                VISplora
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardControls;
