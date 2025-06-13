import React, { useState, useRef, useEffect } from 'react';
import { VegaLite } from 'react-vega';

interface DashboardPreviewProps {
  dashboardId: string;
  position: { x: number; y: number };
  onMove?: (id: string, x: number, y: number) => void;
  isEmpty?: boolean;
  draggable?: boolean;
  title?: string;
  onTitleChange?: (id: string, newTitle: string) => void;
  onClick?: () => void;
}

const DashboardPreview: React.FC<DashboardPreviewProps> = ({ 
  dashboardId, 
  position, 
  onMove,
  isEmpty = false,
  draggable = true,
  title,
  onTitleChange,
  onClick
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sample data for the preview
  const previewData = {
    values: [
      { category: 'A', value: 28 },
      { category: 'B', value: 55 },
      { category: 'C', value: 43 },
      { category: 'D', value: 91 },
      { category: 'E', value: 81 }
    ]
  };

  const previewChartSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json' as const,
    width: 200,
    height: 120,
    mark: { type: 'bar' as const },
    encoding: {
      x: { field: 'category', type: 'nominal' as const, axis: { title: null } },
      y: { field: 'value', type: 'quantitative' as const, axis: { title: null } },
      color: { field: 'category', type: 'nominal' as const, legend: null }
    },
    data: { name: 'values' },
    config: {
      axis: { labelFontSize: 10, grid: false },
      view: { stroke: null }
    }
  };

  // 🔧 FIXED: Separate click and drag handling
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Handle arrow mode click
    if (onClick && !draggable) {
      console.log('Dashboard clicked for arrow:', dashboardId); // Debug log
      onClick();
      return;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't handle mouse down for arrow mode - use click instead
    if (onClick && !draggable) {
      return;
    }

    // Don't start dragging if we're editing the title
    if (isEditingTitle || !draggable || !onMove) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      onMove(dashboardId, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getDashboardUrl = () => {
    if (isEmpty) return '/dashboard-empty';
    return `/dashboard${dashboardId}`;
  };

  const getDashboardTitle = () => {
    if (title) return title;
    if (isEmpty) return 'Empty Dashboard';
    return `Dashboard ${dashboardId}`;
  };

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    if (!draggable && onTitleChange) {
      e.stopPropagation();
      setEditTitle(getDashboardTitle());
      setIsEditingTitle(true);
    }
  };

  const handleTitleSubmit = () => {
    if (onTitleChange && editTitle.trim()) {
      onTitleChange(dashboardId, editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: onClick && !draggable ? 'crosshair' : draggable ? 'move' : 'pointer',
        userSelect: 'none',
        zIndex: 10, // 🔧 ADDED: Ensure it's above SVG
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick} // 🔧 ADDED: Separate click handler
      className={`bg-white rounded-lg shadow-md border-2 p-4 hover:shadow-lg transition-all ${
        onClick && !draggable 
          ? 'border-blue-400 hover:border-blue-500 hover:shadow-blue-200' // 🔧 ENHANCED: Better visual feedback
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="text-sm font-semibold text-slate-700 bg-transparent border-b border-blue-500 outline-none min-w-0 flex-1 mr-2"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 
            className={`text-sm font-semibold text-slate-700 ${
              !draggable && onTitleChange ? 'cursor-text hover:bg-slate-50 px-1 py-0.5 rounded' : ''
            }`}
            onDoubleClick={handleTitleDoubleClick}
            title={!draggable && onTitleChange ? 'Double-click to edit' : ''}
          >
            {getDashboardTitle()}
          </h3>
        )}
        <div className={`w-2 h-2 rounded-full ${isEmpty ? 'bg-slate-400' : 'bg-green-400'}`}></div>
      </div>
      
      <div className="mb-2" style={{ pointerEvents: draggable ? 'none' : 'auto' }}>
        {isEmpty ? (
          <div className="w-[200px] h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded flex flex-col items-center justify-center">
            <svg 
              className="h-8 w-8 text-slate-300 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
              />
            </svg>
            <span className="text-xs text-slate-400">No Data</span>
          </div>
        ) : (
          <VegaLite spec={previewChartSpec} data={previewData} />
        )}
      </div>
      
      <div className="text-xs text-slate-500 space-y-1">
        {isEmpty ? (
          <>
            <div className="flex justify-between">
              <span>Components:</span>
              <span className="font-medium">0</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium">Empty</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Total Value:</span>
              <span className="font-medium">297</span>
            </div>
            <div className="flex justify-between">
              <span>Categories:</span>
              <span className="font-medium">5</span>
            </div>
          </>
        )}
      </div>
      
      <button 
        onClick={(e) => {
          if (!draggable && !onClick) { // 🔧 FIXED: Don't open dashboard in arrow mode
            e.stopPropagation();
            window.open(getDashboardUrl(), '_blank');
          }
        }}
        disabled={draggable || (onClick && !draggable)} // 🔧 FIXED: Disable in arrow mode too
        className={`w-full mt-3 px-3 py-1.5 text-xs rounded transition-colors ${
          draggable || (onClick && !draggable)
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : isEmpty 
              ? 'bg-slate-50 hover:bg-slate-100 text-slate-600' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
        }`}
      >
        Open Dashboard
      </button>
    </div>
  );
};

export default DashboardPreview;