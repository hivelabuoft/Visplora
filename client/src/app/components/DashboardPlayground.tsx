'use client';

import React, { useState, useCallback, useEffect, ReactNode, useRef, createContext, useContext } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FiZoomIn, FiZoomOut, FiMaximize2, FiX, FiMove, FiPlus, FiCheck, FiLink } from 'react-icons/fi';
import styles from './DashboardPlayground.module.css';
import { FilePenLine } from 'lucide-react';
import InteractiveGrid from '../../components/ui/interactive-grid';
import StickyNote from '../../components/ui/sticky-note';
import { useStickyNotesManager } from '../../components/ui/sticky-notes-manager';

// Context for dashboard playground operations
interface DashboardPlaygroundContextType {
  activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  activateElementSelectionMode: ((noteId: string) => void) | undefined;
  isElementSelectionMode: boolean;
  noteToLink: string | null;
  linkNoteToElement: ((noteId: string, elementId: string) => void) | undefined;
  isElementLinked: ((elementId: string) => boolean) | undefined;
}

const DashboardPlaygroundContext = createContext<DashboardPlaygroundContextType | undefined>(undefined);

export const useDashboardPlayground = () => {
  const context = useContext(DashboardPlaygroundContext);
  if (!context) {
    throw new Error('useDashboardPlayground must be used within a DashboardPlayground');
  }
  return context;
};

interface DashboardPlaygroundProps {
  children: ReactNode;
  isActive: boolean;
  onClose: () => void;
  dashboardTitle?: string;
  dashboardType?: string;
  onAddToCanvas?: () => void;
}

const DashboardPlayground: React.FC<DashboardPlaygroundProps> = ({
  children,
  isActive,
  onClose,
  dashboardTitle = "Dashboard",
  dashboardType = "default",
  onAddToCanvas
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [isNoteLinkingMode, setIsNoteLinkingMode] = useState(false);
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false);
  const [noteToLink, setNoteToLink] = useState<string | null>(null);
  const [linkingElementId, setLinkingElementId] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(3000);
  const [showGrid, setShowGrid] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [occupiedCells, setOccupiedCells] = useState<Set<string>>(new Set());
  const [showTips, setShowTips] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const dashboardPositionRef = useRef({ x: -1200, y: -450 });
  // Sticky notes manager
  const {
    stickyNotes,
    selectedNoteId,
    isResizing,
    isMoving,
    createStickyNote,
    updateStickyNote,
    deleteStickyNote,
    selectNote,
    clearAllNotes,
    setIsResizing,
    setIsMoving,
    notesCount
  } = useStickyNotesManager(dashboardTitle);

  // Grid configuration
  const canvasWidth = 4800;
  const CELL_SIZE = 100;
  const DASHBOARD_WIDTH = 1600; // Fixed dashboard width

  // Calculate dashboard bounds and position for the grid
  const getDashboardGridInfo = useCallback(() => {
    const cols = Math.floor(canvasWidth / CELL_SIZE);
    const rows = Math.floor(canvasHeight / CELL_SIZE);
    
    // Calculate how many cells the dashboard needs
    const cellsWide = Math.ceil(DASHBOARD_WIDTH / CELL_SIZE);
    
    // Measure actual dashboard height if available, otherwise estimate
    let dashboardHeight = 1600; // default estimate
    if (dashboardRef.current) {
      dashboardHeight = dashboardRef.current.scrollHeight || 1600;
    }
    const cellsHigh = Math.ceil(dashboardHeight / CELL_SIZE);
    
    // Calculate center position
    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);
    
    // Calculate starting position to center the dashboard
    const startRow = Math.max(0, centerRow - Math.floor(cellsHigh / 2));
    const startCol = Math.max(0, centerCol - Math.floor(cellsWide / 2));
    const endRow = Math.min(rows - 1, startRow + cellsHigh - 1);
    const endCol = Math.min(cols - 1, startCol + cellsWide - 1);
    
    // Calculate actual pixel position (centered within the grid cells)
    const x = startCol * CELL_SIZE + (cellsWide * CELL_SIZE - DASHBOARD_WIDTH) / 2;
    const y = startRow * CELL_SIZE + (cellsHigh * CELL_SIZE - dashboardHeight) / 2;
    
    return {
      bounds: { startRow, endRow, startCol, endCol },
      position: { x, y },
      size: { width: DASHBOARD_WIDTH, height: dashboardHeight },
      cells: { cellsWide, cellsHigh }
    };
  }, [canvasHeight]);

  // Calculate all occupied cells (dashboard + sticky notes) - stable version
  const getAllOccupiedCells = useCallback((): Set<string> => {
    const allOccupied = new Set<string>();
    
    // Add dashboard cells
    const dashboardInfo = getDashboardGridInfo();
    for (let row = dashboardInfo.bounds.startRow; row <= dashboardInfo.bounds.endRow; row++) {
      for (let col = dashboardInfo.bounds.startCol; col <= dashboardInfo.bounds.endCol; col++) {
        allOccupied.add(`${row}-${col}`);
      }
    }    
    // Add sticky note cells except for the currently selected note which might be moving
    stickyNotes.forEach(note => {
      // Skip the currently selected note if we're moving it
      if (isMoving && note.id === selectedNoteId) {
        return;
      }      
      for (let r = note.row; r < note.row + note.height; r++) {
        for (let c = note.col; c < note.col + note.width; c++) {
          allOccupied.add(`${r}-${c}`);
        }
      }
    });    
    return allOccupied;
  }, [canvasHeight, stickyNotes, isMoving, selectedNoteId, getDashboardGridInfo]);

  // Update occupied cells when dashboard or sticky notes change
  useEffect(() => {
    const allOccupied = new Set<string>();
    // Add dashboard cells
    const dashboardInfo = getDashboardGridInfo();
    for (let row = dashboardInfo.bounds.startRow; row <= dashboardInfo.bounds.endRow; row++) {
      for (let col = dashboardInfo.bounds.startCol; col <= dashboardInfo.bounds.endCol; col++) {
        allOccupied.add(`${row}-${col}`);
      }
    }    
    // Add sticky note cells
    stickyNotes.forEach(note => {
      for (let r = note.row; r < note.row + note.height; r++) {
        for (let c = note.col; c < note.col + note.width; c++) {
          allOccupied.add(`${r}-${c}`);
        }
      }
    });    
    setOccupiedCells(allOccupied);
  }, [stickyNotes, canvasHeight]); // Only depend on stickyNotes and canvasHeight

  // Handle grid cell click for sticky note creation
  const handleGridCellClick = useCallback((cell: any) => {
    if (!cell.isOccupied && (isAnnotationMode || isNoteLinkingMode)) {
      // Check if there's enough space for a 2x2 note
      const noteWidth = 2;
      const noteHeight = 2;
      let hasEnoughSpace = true;
      
      // Check if all cells for the 2x2 note are available
      for (let r = cell.row; r < cell.row + noteHeight; r++) {
        for (let c = cell.col; c < cell.col + noteWidth; c++) {
          const cellKey = `${r}-${c}`;
          if (occupiedCells.has(cellKey)) {
            hasEnoughSpace = false;
            break;
          }
        }
        if (!hasEnoughSpace) break;
      }
        if (hasEnoughSpace) {
        // Create note with linking information if in note linking mode
        if (isNoteLinkingMode && linkingElementId) {
          createStickyNote(cell.row, cell.col, cell.x, cell.y, linkingElementId);
        } else {
          createStickyNote(cell.row, cell.col, cell.x, cell.y);
        }
        
        // Exit the appropriate mode
        if (isAnnotationMode) {
          setIsAnnotationMode(false);
        }
        if (isNoteLinkingMode) {
          setIsNoteLinkingMode(false);
          setLinkingElementId(null);
        }
        setShowGrid(false);

        // Zoom to 110% and center on the new note
        if (transformRef.current) {
          // Calculate the center position of the note
          const centerX = cell.x + (noteWidth * CELL_SIZE / 2);
          const centerY = cell.y + (noteHeight * CELL_SIZE / 2);
          
          // Get current viewport dimensions and calculate scale
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const scale = 1.1;
          
          // Calculate position to center the note in the viewport
          const targetX = (viewportWidth / 2) - (centerX * scale);
          const targetY = (viewportHeight / 2) - (centerY * scale);
          
          // Apply the transform with animation
          transformRef.current.setTransform(
            targetX, 
            targetY, 
            scale, 
            1000, 
            "easeOutCubic"
          );
          setZoomLevel(110);
        }
      }
    }
  }, [isAnnotationMode, isNoteLinkingMode, linkingElementId, createStickyNote, CELL_SIZE, occupiedCells, transformRef]);

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(event.target.value);
    if (transformRef.current) {
        transformRef.current.setTransform(
        dashboardPositionRef.current.x,
        dashboardPositionRef.current.y,
        sliderValue / 100,
        0,
        "easeInCubic"
        );
    }
    setZoomLevel(sliderValue);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.zoomIn(0.2);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.zoomOut(0.2);
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
  }, []);

  // Activate note linking mode and zoom out
  const activateLinkedNoteMode = useCallback((elementId?: string) => {
    if (!isNoteLinkingMode) {
      setIsNoteLinkingMode(true);
      setLinkingElementId(elementId || null);
      setShowGrid(true);
      
      if (transformRef.current) {
        // Get dashboard position and size
        const dashboardInfo = getDashboardGridInfo();
        const dashboardCanvasX = dashboardInfo.position.x;
        const dashboardCanvasY = dashboardInfo.position.y;
        const dashboardWidth = dashboardInfo.size.width;
        const dashboardHeight = dashboardInfo.size.height;
        
        // Calculate center of dashboard in canvas coordinates
        const dashboardCenterX = dashboardCanvasX + dashboardWidth / 2;
        const dashboardCenterY = dashboardCanvasY + dashboardHeight / 2;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let targetScale;
        if (zoomLevel > 40) {
          targetScale = 0.4;
        } else {
          targetScale = zoomLevel / 100;
        }

        // Calculate position to center the dashboard in the viewport at 40% zoom
        const targetX = (viewportWidth / 2) - (dashboardCenterX * targetScale);
        const targetY = (viewportHeight / 2) - (dashboardCenterY * targetScale);
        
        transformRef.current.setTransform(
          targetX,
          targetY - 50,
          targetScale,
          1000,
          "easeOutCubic"
        );
        setZoomLevel(targetScale * 100);
      }
    }
  }, [isNoteLinkingMode, getDashboardGridInfo, zoomLevel]);

  // Activate element selection mode for linking existing notes
  const activateElementSelectionMode = useCallback((noteId: string) => {
    setIsElementSelectionMode(true);
    setNoteToLink(noteId);
    
    if (transformRef.current) {
      // Get dashboard position and size
      const dashboardInfo = getDashboardGridInfo();
      const dashboardCanvasX = dashboardInfo.position.x;
      const dashboardCanvasY = dashboardInfo.position.y;
      const dashboardWidth = dashboardInfo.size.width;
      const dashboardHeight = dashboardInfo.size.height;
      
      // Calculate center of dashboard in canvas coordinates
      const dashboardCenterX = dashboardCanvasX + dashboardWidth / 2;
      const dashboardCenterY = dashboardCanvasY + dashboardHeight / 2;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let targetScale = 0.5;
      
      // Calculate position to center the dashboard in the viewport at 40% zoom
      const targetX = (viewportWidth / 2) - (dashboardCenterX * targetScale);
      const targetY = (viewportHeight / 2) - (dashboardCenterY * targetScale);
      
      transformRef.current.setTransform(
        targetX,
        targetY - 50,
        targetScale,
        1000,
        "easeOutCubic"
      );
      setZoomLevel(targetScale * 100);
    }
  }, [getDashboardGridInfo, zoomLevel]);

  const linkNoteToElement = useCallback((noteId: string, elementId: string) => {
    updateStickyNote(noteId, {
      linkedElementId: elementId,
      isLinked: true
    });
    
    // Exit element selection mode
    setIsElementSelectionMode(false);
    setNoteToLink(null);
  }, [updateStickyNote]);

  // Check if an element is linked to any note
  const isElementLinked = useCallback((elementId: string): boolean => {
    return stickyNotes.some(note => note.isLinked && note.linkedElementId === elementId);
  }, [stickyNotes]);

  const handleAddToCanvas = useCallback(() => {
    if (onAddToCanvas) {
      onAddToCanvas();
      setIsAdded(true);
    } else {
      setIsAdded(true);
    }
  }, [onAddToCanvas, dashboardType, dashboardTitle]);

  const handleGoToCanvas = useCallback(() => {
    window.location.href = '/';
  }, []);
  // Handle escape key to close playground or exit modes
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        // Exit modes in priority order (most specific to least specific)
        if (showTips) {
          // Close tips first if open
          setShowTips(false);
        } else if (isResizing) {
          // Exit resize mode
          setIsResizing(false);
        } else if (isMoving) {
          // Exit move mode
          setIsMoving(false);
        } else if (isElementSelectionMode) {
          // Exit element selection mode
          setIsElementSelectionMode(false);
          setNoteToLink(null);
        } else if (isNoteLinkingMode) {
          // Exit note linking mode
          setIsNoteLinkingMode(false);
          setLinkingElementId(null);
          setShowGrid(false);
        } else if (isAnnotationMode) {
          // Exit annotation mode
          setIsAnnotationMode(false);
          setShowGrid(false);
        } else if (selectedNoteId) {
          // Deselect any selected note
          selectNote(null);
        } else {
          // Finally, close the playground
          onClose();
        }
      }
    };
    if (isActive) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when playground is active
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isActive, onClose, showTips, isResizing, isMoving, isElementSelectionMode, isNoteLinkingMode, isAnnotationMode, selectedNoteId, setIsResizing, setIsMoving, selectNote]);

  // Reset transform when playground becomes active and measure dashboard height
  useEffect(() => {
    if (isActive && transformRef.current) {
      // Measure the dashboard height when playground becomes active
      if (dashboardRef.current) {
        const dashboardHeight = dashboardRef.current.scrollHeight;
        const calculatedCanvasHeight = dashboardHeight * 3;
        if (calculatedCanvasHeight > 2800) {
          setCanvasHeight(calculatedCanvasHeight + 500);
        }
      }      
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        if (transformRef.current) {
          transformRef.current.resetTransform();
          handleResetView
        }
        setIsAnnotationMode(false);
        setIsNoteLinkingMode(false);
        setIsElementSelectionMode(false);
        setNoteToLink(null);
        setLinkingElementId(null);
        setShowGrid(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <DashboardPlaygroundContext.Provider value={{ 
      activateLinkedNoteMode, 
      activateElementSelectionMode,
      isElementSelectionMode,
      noteToLink,
      linkNoteToElement,
      isElementLinked
    }}>
      <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-2 px-4 flex-col xl:flex-row flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <FiMove size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-md font-semibold text-gray-900">
                Playground Mode - {dashboardTitle} 
              </h3>
            </div>
          </div>

          {/* Controls in Header */}
          <div className="flex justify-center items-center gap-4 flex-wrap">
            {/* Zoom Controls in Header */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 px-1.5">
              <button onClick={handleZoomOut} className="p-1.5 rounded bg-none hover:cursor-pointer hover:bg-gray-200 transition-colors">
                  <FiZoomOut size={16}/>
              </button>
              <input type="range" min="25" max="200" value={zoomLevel} onChange={handleSliderChange} className={`w-24 hover:w-40 transition-all duration-200 ${styles.playgroundSlider}`}/>

              <button onClick={handleZoomIn} className="p-1.5 rounded bg-none hover:cursor-pointer hover:bg-gray-200 transition-colors">
                  <FiZoomIn size={16}/>
              </button>
              <button onClick={handleResetView} className="flex items-center gap-2 px-2 py-1 text-blue-700 rounded-lg hover:cursor-pointer hover:bg-blue-100 transition-colors text-sm">
                  <FiMaximize2 size={16}/>
                  Reset View
              </button>
            </div>

            {/* Annotations Button - Prominent Position */}
            <button
              onClick={() => {
                setIsAnnotationMode(!isAnnotationMode);
                setShowGrid(!showGrid);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 
                  ${isAnnotationMode ? 'bg-orange-500 text-white shadow-md border-2 border-orange-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'}`
              }>
              <FilePenLine size={16} />
              <span>{isAnnotationMode ? 'Exit Annotations' : 'Add Annotations'}</span>
              {notesCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full 
                      ${isAnnotationMode ? 'bg-orange-600 text-orange-100' : 'bg-orange-500 text-white'}`}>
                      {notesCount}
                  </span>
              )}
            </button>
              {notesCount > 0 && (
                  <button
                  onClick={clearAllNotes}
                  className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition-colors"
                  >
                  Clear All Notes ({notesCount})
                  </button>
              )}
              
            {/* Add to Canvas and View Canvas Buttons */}
              <button
              onClick={handleAddToCanvas}
              disabled={isAdded}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isAdded
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              >
              {isAdded ? (<><FiCheck size={16} />Added to VISplora</>) : (<><FiPlus size={16} />Add to VISplora</>)}
              </button>

              <button
              onClick={handleGoToCanvas}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:cursor-pointer hover:text-gray-900 hover:bg-slate-100 transition-colors"
              >
              <FiLink size={16} />
              VISplora
              </button>

            {/* Exit Playground Button */}
            <button
              onClick={onClose}
              className="flex text-sm items-center gap-2 px-3 py-2 text-gray-600 hover:cursor-pointer hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={16} />
              Exit Playground
            </button>
          </div>
        </div>
        
        {/* Playground Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-50">
          <TransformWrapper
            ref={transformRef}
            initialScale={0.8}
            initialPositionX={-getDashboardGridInfo().position.x + 400}
            initialPositionY={-getDashboardGridInfo().position.y + 400}
            minScale={0.25}
            maxScale={2}
            centerOnInit={true}
            limitToBounds={false}
            smooth={true}
            wheel={{
              disabled: false,
              step: 0.001,
              smoothStep: 0.0005
            }}
            doubleClick={{
              disabled: false,
              step: 0.5
            }}
            onTransformed={(ref) => {
              const newZoom = ref.state.scale * 100;
              dashboardPositionRef.current.x = ref.state.positionX;
              dashboardPositionRef.current.y = ref.state.positionY;
              setZoomLevel(Math.round(newZoom));
            }}
            onPanning={(ref) => {
              setIsPanning(true);
            }}
            onPanningStop={(ref) => {
              setTimeout(() => setIsPanning(false), 100);
            }}>
            <React.Fragment>
              <TransformComponent>
                <div 
                  className="relative w-[4800px] rounded-xl" 
                  style={{
                      height: `${canvasHeight}px`,
                      boxShadow: '0 0 100px rgba(0, 0, 0, 0.1)', 
                      backgroundImage: 'radial-gradient(circle, #d1d5db 2px, transparent 2px)',
                      backgroundSize: '50px 50px',
                      backgroundPosition: '0 0',
                      transformOrigin: '0 0'
                  }}
                  // Deselect notes when clicking on canvas background (not on notes or dashboard)
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      selectNote(null);
                    }
                  }}
                >
                  {/* Interactive Grid */}
                  <InteractiveGrid
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    cellSize={CELL_SIZE}
                    showGrid={showGrid || isResizing || isMoving || isNoteLinkingMode}
                    dashboardBounds={getDashboardGridInfo().bounds}
                    occupiedCells={occupiedCells}
                    onCellHover={(cell) => setHoveredCell(cell ? `Row: ${cell.row} - Col: ${cell.col}` : null)}
                    onCellClick={handleGridCellClick}
                  />
                  
                  {/* Center the dashboard in the grid */}
                  <div 
                    ref={dashboardRef}
                    className="absolute bg-white p-2 rounded-xl shadow-xl overflow-hidden" 
                    style={{ 
                      width: `${DASHBOARD_WIDTH}px`,
                      left: `${getDashboardGridInfo().position.x}px`,
                      top: `${getDashboardGridInfo().position.y}px`
                    }}
                    onClick={(e) => {
                      // Deselect notes when clicking on dashboard area
                      if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
                        selectNote(null);
                      }
                    }}
                  >
                    {children}
                  </div>

                  {/* Sticky Notes */}
                  {stickyNotes.map((note) => (
                    <StickyNote
                      key={note.id}
                      note={note}
                      cellSize={CELL_SIZE}
                      onUpdate={updateStickyNote}
                      onDelete={deleteStickyNote}
                      onSelect={selectNote}
                      isResizing={isResizing}
                      onResizeStart={() => setIsResizing(true)}
                      onResizeEnd={() => setIsResizing(false)}
                      onMoveStart={() => setIsMoving(true)}
                      onMoveEnd={() => setIsMoving(false)}
                      getOccupiedCells={getAllOccupiedCells}
                      zoomLevel={zoomLevel}
                    />
                  ))}
                </div>
              </TransformComponent>
            </React.Fragment>
          </TransformWrapper>
        </div>
        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-1 px-6">
          <div className="flex items-center gap-2 justify-between text-sm text-gray-500">   
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-md transition-colors duration-200"
            >
              <span>Help</span>
              <span className={`transform transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {showTips && (              <div className="absolute bottom-10 left-2 flex flex-col bg-white gap-3 p-3 rounded-lg shadow-lg text-xs text-gray-700 border border-gray-200">
                <span>• Drag to pan around the dashboard.</span>
                <span>• Scroll or use controls to zoom.</span>
                <span>• Use "Reset View" to return to center.</span>
                <span>• Click "Add to VISplora" to save dashboard.</span>
                <span className="text-blue-600 font-semibold">• Press ESC to exit current mode or close playground.</span>
                <span>• Click "Add Annotations" to toggle sticky notes.</span>
                <span>• Click a grid cell to add a sticky note.</span>
                <span>• Resize or move notes by dragging edges or title bar.</span>
                <span>• Use the "Clear All Notes" button to remove all sticky notes.</span>
                <span>• Click link button on notes to link/unlink from elements.</span>
              </div>
            )}
            {(isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || isResizing || isMoving) && (
              <div className="flex items-center justify-center gap-4">
                {isAnnotationMode && 
                <span className="text-orange-600 font-bold">Select a grid cell to add sticky note
                </span>}
                {isNoteLinkingMode && (
                  <span className="text-sky-500 font-bold">
                    Place linked note
                    {linkingElementId && ` for element: ${linkingElementId}`}
                  </span>)}
                {isElementSelectionMode && (
                  <span className="text-purple-600 font-bold">
                    Select the dashboard element to link selected note with
                  </span>)}
                {isResizing && <span className="text-blue-600 font-semibold">
                  Resizing note - drop note to confirm size
                  </span>}
                {isMoving && <span className="text-green-600 font-semibold">
                  Moving note - drop note to confirm placement
                  </span>}
                {(isAnnotationMode || isNoteLinkingMode) ? (
                  <span className={isAnnotationMode ? 'text-orange-600' : 'text-sky-500'}>
                      Dashboard Size: {getDashboardGridInfo().cells.cellsWide}×{getDashboardGridInfo().cells.cellsHigh} | Occupied Cells: {occupiedCells.size}
                      {hoveredCell && ` | ${hoveredCell}`}
                  </span>
                ): <></> }
                <span>Press ESC to exit</span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${isPanning ? 'bg-green-400 ' + styles.panningIndicator : 'bg-gray-300'}`}></span>
                <span>Interactive Mode {isPanning ? '(Panning)' : ''}</span>
              </div>
              <span>Zoom: {Math.round(zoomLevel)}%</span>
              <span>Dimension: {Math.floor(canvasWidth / CELL_SIZE)}×{Math.floor(canvasHeight / CELL_SIZE)} ({CELL_SIZE}px cells)</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardPlaygroundContext.Provider>
  );
};

export default DashboardPlayground;
