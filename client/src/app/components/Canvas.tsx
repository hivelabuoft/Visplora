import React, { useState, useCallback, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import VisualizationCard from './VisualizationCard';
import DashboardPreview from './DashboardPreview';
import Toolbar from './Toolbar';
import Arrow from './Arrow';
import { Visualization } from '../types/visualization';

type Mode = 'interact' | 'move' | 'arrow';

interface DashboardPreviewData {
  id: string;
  position: { x: number; y: number };
  isEmpty?: boolean;
  title?: string;
}

interface ArrowData {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromDashboardId: string;
  toDashboardId: string;
}

interface CanvasProps {
  visualizations: Visualization[];
  onVisualizationMove: (id: string, x: number, y: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  visualizations, 
  onVisualizationMove
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mode, setMode] = useState<Mode>('interact');
  const [arrows, setArrows] = useState<ArrowData[]>([]);
  const [selectedArrow, setSelectedArrow] = useState<string | null>(null);
  const [arrowDrawing, setArrowDrawing] = useState<{
    isDrawing: boolean;
    fromDashboard: string | null;
    startPos: { x: number; y: number } | null;
    currentPos: { x: number; y: number } | null;
  }>({
    isDrawing: false,
    fromDashboard: null,
    startPos: null,
    currentPos: null
  });
  
  // Dashboard previews including custom titles
  const [dashboardPreviews, setDashboardPreviews] = useState<DashboardPreviewData[]>([
    {
      id: '1',
      position: { x: 300, y: 200 },
      title: 'Sales Analytics'
    },
    {
      id: 'empty',
      position: { x: 600, y: 200 },
      isEmpty: true,
      title: 'New Project Dashboard'
    }
  ]);

  const handleDashboardPreviewMove = useCallback((id: string, x: number, y: number) => {
    setDashboardPreviews(prev =>
      prev.map((dashboard) =>
        dashboard.id === id
          ? { ...dashboard, position: { x, y } }
          : dashboard
      )
    );
    
    // Update arrow positions when dashboards move
    setArrows(prev =>
      prev.map(arrow => {
        const updatedArrow = { ...arrow };
        
        if (arrow.fromDashboardId === id) {
          updatedArrow.from = { x: x + 125, y: y + 75 }; // Center of dashboard preview
        }
        if (arrow.toDashboardId === id) {
          updatedArrow.to = { x: x + 125, y: y + 75 }; // Center of dashboard preview
        }
        
        return updatedArrow;
      })
    );
  }, []);

  const handleDashboardTitleChange = useCallback((id: string, newTitle: string) => {
    setDashboardPreviews(prev =>
      prev.map((dashboard) =>
        dashboard.id === id
          ? { ...dashboard, title: newTitle }
          : dashboard
      )
    );
  }, []);

  // Handle dashboard click for arrow creation
  const handleDashboardClick = useCallback((dashboardId: string, position: { x: number; y: number }) => {
    console.log('handleDashboardClick called:', { dashboardId, mode, arrowDrawing }); // Debug log
    
    if (mode !== 'arrow') return;

    const centerPos = { x: position.x + 125, y: position.y + 75 }; // Center of dashboard

    if (!arrowDrawing.isDrawing) {
      // Start drawing arrow
      console.log('Starting arrow from:', dashboardId); // Debug log
      setArrowDrawing({
        isDrawing: true,
        fromDashboard: dashboardId,
        startPos: centerPos,
        currentPos: centerPos
      });
    } else {
      // Finish drawing arrow
      console.log('Finishing arrow to:', dashboardId, 'from:', arrowDrawing.fromDashboard); // Debug log
      
      if (arrowDrawing.fromDashboard && arrowDrawing.fromDashboard !== dashboardId) {
        const newArrow: ArrowData = {
          id: `arrow-${Date.now()}`,
          from: arrowDrawing.startPos!,
          to: centerPos,
          fromDashboardId: arrowDrawing.fromDashboard,
          toDashboardId: dashboardId
        };
        
        console.log('Creating new arrow:', newArrow); // Debug log
        setArrows(prev => [...prev, newArrow]);
      }
      
      // Reset drawing state
      setArrowDrawing({
        isDrawing: false,
        fromDashboard: null,
        startPos: null,
        currentPos: null
      });
    }
  }, [mode, arrowDrawing]);

  // Handle mouse move during arrow drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === 'arrow' && arrowDrawing.isDrawing) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setArrowDrawing(prev => ({
        ...prev,
        currentPos: { x, y }
      }));
    }
  }, [mode, arrowDrawing.isDrawing]);

  // Handle arrow selection
  const handleArrowSelect = useCallback((arrowId: string) => {
    setSelectedArrow(arrowId === selectedArrow ? null : arrowId);
  }, [selectedArrow]);

  // Handle arrow deletion
  const handleArrowDelete = useCallback((arrowId: string) => {
    setArrows(prev => prev.filter(arrow => arrow.id !== arrowId));
    setSelectedArrow(null);
  }, []);

  // Clear selection when mode changes
  useEffect(() => {
    if (mode !== 'arrow') {
      setSelectedArrow(null);
      setArrowDrawing({
        isDrawing: false,
        fromDashboard: null,
        startPos: null,
        currentPos: null
      });
    }
  }, [mode]);

  // Updated to provide consistent zoom steps and update the slider
  // Convert between slider value (0-100) and actual zoom level (1-500)
  const sliderToZoom = useCallback((sliderValue: number): number => {
    // Non-linear mapping: 
    // - First 80% of slider (0-80) maps to zoom 1-100
    // - Last 20% of slider (80-100) maps to zoom 100-500
    if (sliderValue <= 80) {
      // Linear mapping from 0-80 to 1-100
      return 1 + (sliderValue / 80) * 99;
    } else {
      // Linear mapping from 80-100 to 100-500
      return 100 + ((sliderValue - 80) / 20) * 400;
    }
  }, []);

  const zoomToSlider = useCallback((zoomValue: number): number => {
    // Inverse mapping of sliderToZoom
    if (zoomValue <= 100) {
      // Linear mapping from 1-100 to 0-80
      return ((zoomValue - 1) / 99) * 80;
    } else {
      // Linear mapping from 100-500 to 80-100
      return 80 + ((zoomValue - 100) / 400) * 20;
    }
  }, []);

  const handleZoomChange = useCallback((newZoom: number, setTransformValue: any) => {
    // Ensure zoom is within valid range
    const clampedZoom = Math.max(1, Math.min(500, newZoom));
    setZoomLevel(clampedZoom);
    // Apply zoom transformation
    setTransformValue(0, 0, clampedZoom / 100);
  }, []);
  
  const handleSave = useCallback(() => {
    // Implement save functionality here
    console.log('Saving canvas state...');
    // You could trigger a save action to your backend or state management
  }, []);

  const [dashboardCount, setDashboardCount] = useState(0);
  
  // Load dashboard count from localStorage
  useEffect(() => {
    const count = localStorage.getItem('dashboardCount');
    setDashboardCount(count ? parseInt(count) : 0);
    
    // Event listener for when dashboard count changes
    const handleDashboardUpdate = (event: Event) => {
      const count = localStorage.getItem('dashboardCount');
      setDashboardCount(count ? parseInt(count) : 0);
    };
    
    window.addEventListener('dashboardsUpdated', handleDashboardUpdate);
    
    return () => {
      window.removeEventListener('dashboardsUpdated', handleDashboardUpdate);
    };
  }, []);

  // Method to add more dashboard previews programmatically
  const addDashboardPreview = useCallback((dashboardId: string, position?: { x: number; y: number }, isEmpty?: boolean) => {
    const newPreview: DashboardPreviewData = {
      id: dashboardId,
      position: position || { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 },
      isEmpty: isEmpty || false
    };
    setDashboardPreviews(prev => [...prev, newPreview]);
  }, []);
  
  return (
    <div className="w-full h-full overflow-hidden bg-slate-50 rounded-lg">
      <Toolbar mode={mode} onModeChange={setMode} />
      
      {/* Arrow mode instructions */}
      {mode === 'arrow' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-blue-100 border border-blue-300 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-800">
            {arrowDrawing.isDrawing 
              ? 'Click on a destination dashboard to create arrow'
              : 'Click on a dashboard to start drawing an arrow'
            }
          </p>
        </div>
      )}
      
      <TransformWrapper
        initialScale={1}
        minScale={0.01}
        maxScale={5}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        panning={{ disabled: mode === 'move' || mode === 'arrow' }}
        doubleClick={{ disabled: mode === 'move' || mode === 'arrow' }}
        onZoom={({ state }) => {
          setZoomLevel(Math.round(state.scale * 100));
        }}
      >
        {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
          <React.Fragment>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10 bg-white p-2 rounded-lg shadow-lg">
              {/* Dashboard counter - enhanced styling */}
              <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-md shadow-sm">
                <div className="mr-2 bg-blue-500 text-white p-1 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">Dashboards</span>
                  <span className="ml-2 text-sm font-bold text-blue-700">{dashboardPreviews.length}</span>
                </div>
              </div>
              
              {/* 🔧 ADDED: Disable zoom controls in move mode */}
              <button 
                onClick={() => {
                  const newZoom = Math.max(1, zoomLevel - 10);
                  handleZoomChange(newZoom, setTransform);
                }}
                disabled={mode === 'move'}
                className={`p-2 rounded-full shadow ${
                  mode === 'move' 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={zoomToSlider(zoomLevel)}
                  onChange={(e) => {
                    if (mode !== 'move') { // 🔧 ADDED: Only allow zoom changes in interact mode
                      const sliderValue = parseFloat(e.target.value);
                      const newZoom = Math.round(sliderToZoom(sliderValue));
                      handleZoomChange(newZoom, setTransform);
                    }
                  }}
                  disabled={mode === 'move'} // 🔧 ADDED: Disable slider in move mode
                  className={`w-96 ${mode === 'move' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className="text-xs font-medium">{zoomLevel}%</span>
              </div>
              
              <button 
                onClick={() => {
                  const newZoom = Math.min(500, zoomLevel + 10);
                  handleZoomChange(newZoom, setTransform);
                }}
                disabled={mode === 'move'}
                className={`p-2 rounded-full shadow ${
                  mode === 'move' 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  resetTransform();
                  setZoomLevel(100);
                }}
                disabled={mode === 'move'}
                className={`p-2 rounded-full shadow ml-2 ${
                  mode === 'move' 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              </button>
            </div>
            <TransformComponent>
              <div 
                className="relative w-[5000px] h-[5000px]" 
                style={{
                  backgroundImage: 'radial-gradient(circle, #d1d5db 2px, transparent 2px)',
                  backgroundSize: '50px 50px',
                  backgroundPosition: '0 0',
                  transformOrigin: '0 0',
                  cursor: mode === 'move' ? 'default' : mode === 'arrow' ? 'crosshair' : 'grab'
                }}
                onMouseMove={handleMouseMove}
              >
                {/* SVG for arrows */}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: mode === 'arrow' ? 'auto' : 'none',
                    zIndex: 1
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#64748b"
                      />
                    </marker>
                  </defs>
                  
                  {/* Render existing arrows */}
                  {arrows.map(arrow => (
                    <Arrow
                      key={arrow.id}
                      id={arrow.id}
                      from={arrow.from}
                      to={arrow.to}
                      fromDashboardId={arrow.fromDashboardId}
                      toDashboardId={arrow.toDashboardId}
                      isSelected={selectedArrow === arrow.id}
                      onSelect={handleArrowSelect}
                      onDelete={handleArrowDelete}
                    />
                  ))}
                  
                  {/* Render drawing arrow */}
                  {arrowDrawing.isDrawing && arrowDrawing.startPos && arrowDrawing.currentPos && (
                    <line
                      x1={arrowDrawing.startPos.x}
                      y1={arrowDrawing.startPos.y}
                      x2={arrowDrawing.currentPos.x}
                      y2={arrowDrawing.currentPos.y}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  )}
                </svg>

                {visualizations.map((vis) => (
                  <VisualizationCard 
                    key={vis.id}
                    visualization={vis}
                    onMove={onVisualizationMove}
                    draggable={mode === 'move'}
                  />
                ))}
                {dashboardPreviews.map((dashboard) => (
                  <DashboardPreview
                    key={dashboard.id}
                    dashboardId={dashboard.id}
                    position={dashboard.position}
                    onMove={handleDashboardPreviewMove}
                    isEmpty={dashboard.isEmpty}
                    draggable={mode === 'move'}
                    title={dashboard.title}
                    onTitleChange={handleDashboardTitleChange}
                    onClick={mode === 'arrow' ? () => {
                      console.log('DashboardPreview onClick called for:', dashboard.id); // Debug log
                      handleDashboardClick(dashboard.id, dashboard.position);
                    } : undefined}
                  />
                ))}
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default Canvas;
