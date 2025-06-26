'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './DashboardPlayground.module.css';
import { useStickyNotesManager } from '../../components/ui/sticky-notes-manager';

// Import refactored modules
import { 
  DashboardPlaygroundContext, 
  DashboardPlaygroundProps,
  DroppedElement
} from '../../components/context/DashboardPlaygroundContext';
import { getDashboardGridInfo, getAllOccupiedCells, CELL_SIZE } from './playgroundComponents/DashboardPlaygroundUtils';
import { useConnectionManager } from './hooks/useConnectionManager';
import { useElementDragging } from './hooks/useElementDragging';
import { useZoomNavigation } from './hooks/useZoomNavigation';
import { useNoteLinking } from './hooks/useNoteLinking';
import { DashboardPlaygroundHeader } from './playgroundComponents/DashboardPlaygroundHeader';
import { DashboardPlaygroundFooter } from './playgroundComponents/DashboardPlaygroundFooter';
import { DashboardPlaygroundCanvas } from './playgroundComponents/DashboardPlaygroundCanvas';

// Export the context hook for external use
export { useDashboardPlayground } from '../../components/context/DashboardPlaygroundContext';

const DashboardPlayground: React.FC<DashboardPlaygroundProps> = ({
  children,
  isActive,
  dashboardTitle = "Dashboard",
  dashboardType = "default",
  onAddToCanvas,
  hrData = [] // Default to empty array if no data provided
}) => {
  // Basic state
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(5000);
  const [showGrid, setShowGrid] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [occupiedCells, setOccupiedCells] = useState<Set<string>>(new Set());
  const [showTips, setShowTips] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [droppedElements, setDroppedElements] = useState<DroppedElement[]>([]);
  
  // Refs
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Grid configuration
  const canvasWidth = 6000;
  
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

  // Get dashboard grid info
  const getDashboardGridInfoCallback = useCallback(() => 
    getDashboardGridInfo(canvasWidth, canvasHeight, dashboardRef), 
    [canvasHeight]
  );

  // Custom hooks
  const {
    zoomLevel,
    setZoomLevel,
    isPanning,
    setIsPanning,
    transformRef,
    dashboardPositionRef,
    handleSliderChange,
    handleZoomIn,
    handleZoomOut,
    handleResetView
  } = useZoomNavigation(getDashboardGridInfoCallback);

  const {
    manualConnections,
    connectionFeedback,
    setConnectionFeedback,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    dragPreview,
    setDragPreview,
    handleAddManualConnection,
    handleRemoveManualConnection,
    isElementLinked,
    getLinkedElementInfo,
    handleConnectionDragStart,
    isValidDropTarget
  } = useConnectionManager(stickyNotes, updateStickyNote);

  const {
    isNoteLinkingMode,
    setIsNoteLinkingMode,
    isElementSelectionMode,
    setIsElementSelectionMode,
    noteToLink,
    setNoteToLink,
    linkingElementId,
    setLinkingElementId,
    activateLinkedNoteMode,
    activateElementSelectionMode,
    linkNoteToElement,
    removeConnection
  } = useNoteLinking(zoomLevel, setZoomLevel, getDashboardGridInfoCallback, transformRef, updateStickyNote);

  const {
    isElementDragging,
    elementDragData,
    elementDragPosition,
    isDroppedElementMoving,
    handleElementDragStart,
    handleElementDragMove,
    handleElementDragEnd,
    handleDroppedElementMove,
    handleDroppedElementMoveStart,
    handleDroppedElementMoveEnd
  } = useElementDragging(getDashboardGridInfoCallback, droppedElements, setDroppedElements, setConnectionFeedback);

  // Get all occupied cells
  const getAllOccupiedCellsCallback = useCallback((): Set<string> => {
    return getAllOccupiedCells(
      canvasHeight,
      canvasWidth,
      stickyNotes,
      droppedElements,
      isMoving,
      selectedNoteId,
      dashboardRef
    );
  }, [canvasHeight, stickyNotes, droppedElements, isMoving, selectedNoteId]);

  // Update occupied cells when dashboard or sticky notes change
  useEffect(() => {
    const allOccupied = getAllOccupiedCellsCallback();
    setOccupiedCells(allOccupied);
  }, [getAllOccupiedCellsCallback]);

  // Handle grid cell click for sticky note creation
  const handleGridCellClick = useCallback((cell: any) => {
    if (!cell.isOccupied && (isAnnotationMode || isNoteLinkingMode)) {
      // Check if there's enough space for a 2x2 note
      const noteWidth = 50;
      const noteHeight = 50;
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
          // Calculate the center position of the note in canvas coordinates
          const centerX = cell.x + (noteWidth * CELL_SIZE / 2);
          const centerY = cell.y + (noteHeight * CELL_SIZE / 2);
          
          // Get current viewport dimensions and calculate scale
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const scale = 1;
          
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
  }, [isAnnotationMode, isNoteLinkingMode, linkingElementId, createStickyNote, CELL_SIZE, occupiedCells, transformRef, setZoomLevel, setIsNoteLinkingMode, setLinkingElementId]);

  // Handle drag movement
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    // Get mouse position relative to the canvas
    const canvasRect = document.querySelector('[data-dashboard-container]')?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    setDragPreview({ x, y });
  }, [isDragging, dragStart, setDragPreview]);

  // Handle drag end - check for valid drop target
  const handleDragEnd = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart) {
      setIsDragging(false);
      setDragStart(null);
      setDragPreview(null);
      return;
    }

    // Find connection node under mouse
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const connectionNode = target?.closest('[data-connection-node]') as HTMLElement;
    
    if (connectionNode) {
      const targetElementId = connectionNode.getAttribute('data-connection-element-id');
      const targetPosition = connectionNode.getAttribute('data-connection-node') as 'top' | 'right' | 'bottom' | 'left';
      const targetType = connectionNode.getAttribute('data-note-id') ? 'note' : 'element';
      
      if (targetElementId && targetPosition && 
          (targetElementId !== dragStart.id || targetPosition !== dragStart.position)) {
        
        // Create connection
        const connection = {
          id: `manual-${dragStart.id}-${dragStart.position}-${targetElementId}-${targetPosition}`,
          sourceId: dragStart.id,
          sourceType: dragStart.type,
          sourcePosition: dragStart.position,
          targetId: targetElementId,
          targetType: targetType as 'element' | 'note',
          targetPosition: targetPosition
        };
        
        handleAddManualConnection(connection);
        
        // Update note states
        if (dragStart.type === 'note') {
          const sourceNote = stickyNotes.find(note => note.id === dragStart.id);
          const updateData: any = { isLinked: true };
          if (targetType === 'element' && sourceNote?.linkedElementId === targetElementId) {
            updateData.linkedElementId = undefined;
          }
          updateStickyNote(dragStart.id, updateData);
        }
        if (targetType === 'note') {
          const targetNote = stickyNotes.find(note => note.id === targetElementId);
          const updateData: any = { isLinked: true };
          if (dragStart.type === 'element' && targetNote?.linkedElementId === dragStart.id) {
            updateData.linkedElementId = undefined;
          }
          updateStickyNote(targetElementId, updateData);
        }
        
        setConnectionFeedback(`✓ Connection created between ${dragStart.type} and ${targetType}`);
        setTimeout(() => setConnectionFeedback(null), 5000);
      }
    } else {
      setConnectionFeedback(`Connection cancelled - drag to a connection node to create a link`);
      setTimeout(() => setConnectionFeedback(null), 5000);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragPreview(null);
  }, [isDragging, dragStart, handleAddManualConnection, stickyNotes, updateStickyNote, setConnectionFeedback, setIsDragging, setDragStart, setDragPreview]);

  // Set up global drag event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Set up global element drag event listeners
  useEffect(() => {
    if (isElementDragging) {
      document.addEventListener('mousemove', handleElementDragMove);
      document.addEventListener('mouseup', handleElementDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleElementDragMove);
        document.removeEventListener('mouseup', handleElementDragEnd);
      };
    }
  }, [isElementDragging, handleElementDragMove, handleElementDragEnd]);

  // Additional handlers
  const handleAddToCanvas = useCallback(() => {
    if (onAddToCanvas) {
      onAddToCanvas();
      setIsAdded(true);
    } else {
      setIsAdded(true);
    }
  }, [onAddToCanvas]);

  const handleGoToCanvas = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Handle mouse movement for note preview
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnnotationMode && !isPanning && !isMoving) {
      // Use offsetX/offsetY which are relative to the canvas element
      const mouseX = e.nativeEvent.offsetX;
      const mouseY = e.nativeEvent.offsetY;
      
      // Snap to grid - find the top-left corner of the current grid cell
      const col = Math.floor(mouseX / CELL_SIZE);
      const row = Math.floor(mouseY / CELL_SIZE);
      const gridX = col * CELL_SIZE;
      const gridY = row * CELL_SIZE;
      
      // Position the note preview at the exact grid position (top-left corner)
      setMousePosition({
        x: gridX,
        y: gridY
      });
    }
  }, [isAnnotationMode, isPanning, isMoving]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      selectNote(null);
    }
  }, [selectNote]);

  // Handle escape key to close playground or exit modes
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        // Exit modes in priority order (most specific to least specific)
        if (isDragging) {
          // Cancel drag operation
          setIsDragging(false);
          setDragStart(null);
          setDragPreview(null);
          setConnectionFeedback('Connection cancelled');
          setTimeout(() => setConnectionFeedback(null), 5000);
        } else if (isElementDragging) {
          // Cancel element drag operation - would need access to setters from hook
          setConnectionFeedback('Element drag cancelled');
          setTimeout(() => setConnectionFeedback(null), 5000);
        } else if (showTips) {
          setShowTips(false);
        } else if (isElementSelectionMode) {
          setIsElementSelectionMode(false);
          setNoteToLink(null);
        } else if (isNoteLinkingMode) {
          setIsNoteLinkingMode(false);
          setLinkingElementId(null);
          setShowGrid(false);
        } else if (isAnnotationMode) {
          setIsAnnotationMode(false);
          setShowGrid(false);        
        } else if (selectedNoteId) {
          selectNote(null);
        }
      }
    };
    
    if (isActive) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isActive, showTips, isResizing, isMoving, isElementSelectionMode, isNoteLinkingMode, 
    isAnnotationMode, selectedNoteId, isDragging, isElementDragging, selectNote, 
    setIsDragging, setDragStart, setDragPreview, setConnectionFeedback, setIsElementSelectionMode,
    setNoteToLink, setIsNoteLinkingMode, setLinkingElementId, setShowTips]);

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
          handleResetView();
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
  }, [isActive, handleResetView, setIsNoteLinkingMode, setIsElementSelectionMode, 
      setNoteToLink, setLinkingElementId]);

  // Disable/enable panning function
  const disablePanning = useCallback((disabled: boolean) => {
    // The transform wrapper handles this through wheel and doubleClick settings
  }, []);

  // Helper function to determine if an element is a valid drop target for connections
  const isValidDropTargetForConnections = useCallback((elementId: string, elementType: 'element' | 'note') => {
    if (!isDragging || !dragStart) return false;
    
    // Can't drop on self
    if (dragStart.id === elementId) return false;
    
    // Apply connection rules
    if (dragStart.type === 'element' && elementType === 'element') return false; // Element to Element not allowed
    
    // Check if connection already exists
    const connectionExists = manualConnections.some(conn => 
      (conn.sourceId === dragStart.id && conn.targetId === elementId) ||
      (conn.sourceId === elementId && conn.targetId === dragStart.id)
    );
    
    return !connectionExists;
  }, [isDragging, dragStart, manualConnections]);

  if (!isActive) {
    return null;
  }

  const dashboardGridInfo = getDashboardGridInfoCallback();

  return (
    <DashboardPlaygroundContext.Provider value={{ 
      activateLinkedNoteMode, 
      activateElementSelectionMode,
      isElementSelectionMode,
      noteToLink,
      linkNoteToElement,
      isElementLinked,
      getLinkedElementInfo,
      setHoveredElementId,
      onConnectionDragStart: handleConnectionDragStart,
      isDragging,
      isValidDropTarget,
      onElementDragStart: handleElementDragStart,
      isElementDragging,
      disablePanning
    }}>
      <div className={styles.playgroundContainer}>
        {/* Header */}
        <DashboardPlaygroundHeader
          dashboardTitle={dashboardTitle}
          zoomLevel={zoomLevel}
          notesCount={notesCount}
          isAnnotationMode={isAnnotationMode}
          isAdded={isAdded}
          onZoomOut={handleZoomOut}
          onZoomIn={handleZoomIn}
          onSliderChange={handleSliderChange}
          onResetView={handleResetView}
          onClearAllNotes={clearAllNotes}
          onToggleAnnotations={() => {
            setIsAnnotationMode(!isAnnotationMode);
            setShowGrid(!showGrid);
          }}
          onAddToCanvas={handleAddToCanvas}
          onGoToCanvas={handleGoToCanvas}
        />

        {/* Canvas */}
        <DashboardPlaygroundCanvas
          transformRef={transformRef}
          dashboardRef={dashboardRef}
          dashboardPositionRef={dashboardPositionRef}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          isPanning={isPanning}
          setIsPanning={setIsPanning}
          isElementDragging={isElementDragging}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          showGrid={showGrid || isNoteLinkingMode}
          isAnnotationMode={isAnnotationMode}
          isResizing={isResizing}
          isMoving={isMoving}
          mousePosition={mousePosition}
          hoveredCell={hoveredCell}
          elementDragPosition={elementDragPosition}
          elementDragData={elementDragData}
          occupiedCells={occupiedCells}
          dashboardGridInfo={dashboardGridInfo}
          onCellHover={(cell) => setHoveredCell(cell ? `Row: ${cell.row} - Col: ${cell.col}` : null)}
          onCellClick={handleGridCellClick}
          onCanvasMouseMove={handleCanvasMouseMove}
          onCanvasClick={handleCanvasClick}
          stickyNotes={stickyNotes}
          updateStickyNote={updateStickyNote}
          deleteStickyNote={deleteStickyNote}
          selectNote={selectNote}
          onResizeStart={() => setIsResizing(true)}
          onResizeEnd={() => setIsResizing(false)}
          onMoveStart={() => setIsMoving(true)}
          onMoveEnd={() => setIsMoving(false)}
          getAllOccupiedCells={getAllOccupiedCellsCallback}
          onConnectionDragStart={handleConnectionDragStart}
          isDragging={isDragging}
          isValidDropTarget={isValidDropTarget}
          hoveredElementId={hoveredElementId}
          removeConnection={removeConnection}
          manualConnections={manualConnections}
          handleAddManualConnection={handleAddManualConnection}
          handleRemoveManualConnection={handleRemoveManualConnection}
          dragStart={dragStart}
          dragPreview={dragPreview}
          droppedElements={droppedElements}
          setDroppedElements={setDroppedElements}
          handleDroppedElementMove={handleDroppedElementMove}
          handleDroppedElementMoveStart={handleDroppedElementMoveStart}
          handleDroppedElementMoveEnd={handleDroppedElementMoveEnd}
          isValidDropTargetForConnections={isValidDropTargetForConnections}
          hrData={hrData}
        >
          {children}
        </DashboardPlaygroundCanvas>

        {/* Footer */}
        <DashboardPlaygroundFooter
          showTips={showTips}
          setShowTips={setShowTips}
          isAnnotationMode={isAnnotationMode}
          isNoteLinkingMode={isNoteLinkingMode}
          isElementSelectionMode={isElementSelectionMode}
          isResizing={isResizing}
          isMoving={isMoving}
          isDragging={isDragging}
          isElementDragging={isElementDragging}
          isDroppedElementMoving={isDroppedElementMoving}
          connectionFeedback={connectionFeedback}
          linkingElementId={linkingElementId}
          isPanning={isPanning}
          zoomLevel={zoomLevel}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      </div>
    </DashboardPlaygroundContext.Provider>
  );
};

export default DashboardPlayground;
