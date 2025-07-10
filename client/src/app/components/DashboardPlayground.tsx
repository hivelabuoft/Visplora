'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FiMove, FiZoomOut, FiZoomIn, FiMaximize2, FiLink, FiCpu } from 'react-icons/fi';
import { FilePenLine } from 'lucide-react';
import styles from './DashboardPlayground.module.css';
import { useStickyNotesManager } from '../../components/ui/sticky-notes-manager';
import { useAIAssistantManager } from '../../components/ui/ai-assistant-manager';

// Component imports
import InteractiveGrid from '../../components/ui/interactive-grid';
import StickyNote from '../../components/ui/sticky-note';
import ConnectionLines from '../../components/ui/connection-lines';
import DroppedElement from '../../components/ui/dropped-element';
import AIAssistant from '../../components/ui/ai-chat-assistant';

// Import refactored modules
import { 
  DashboardPlaygroundContext, 
  DashboardPlaygroundProps,
  DroppedElement as DroppedElementType
} from '../../components/context/DashboardPlaygroundContext';
import { useConnectionManager } from '../../components/playgroundHooks/useConnectionManager';
import { useElementDragging } from '../../components/playgroundHooks/useElementDragging';
import { useZoomNavigation } from '../../components/playgroundHooks/useZoomNavigation';
import { useNoteLinking } from '../../components/playgroundHooks/useNoteLinking';

// Export the context hook for external use
export { useDashboardPlayground } from '../../components/context/DashboardPlaygroundContext';

// ================================
// UTILITY FUNCTIONS AND CONSTANTS
// ================================

export const CELL_SIZE = 5;
export const DASHBOARD_WIDTH = 1440; // Fixed dashboard width

// Calculate dashboard bounds and position for the grid
export const getDashboardGridInfo = (canvasWidth: number, canvasHeight: number, dashboardRef?: React.RefObject<HTMLDivElement | null>) => {
  const cols = Math.floor(canvasWidth / CELL_SIZE);
  const rows = Math.floor(canvasHeight / CELL_SIZE);
  
  // Calculate how many cells the dashboard needs
  const cellsWide = Math.ceil(DASHBOARD_WIDTH / CELL_SIZE);
  
  // Measure actual dashboard height if available, otherwise estimate
  let dashboardHeight = 1600; // default estimate
  if (dashboardRef?.current) {
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
};

// ================================
// MAIN DASHBOARD PLAYGROUND COMPONENT
// ================================

const DashboardPlayground: React.FC<DashboardPlaygroundProps> = ({
  children,
  isActive,
  dashboardTitle = "Dashboard",
  dashboardType = "default",
  hrData = [], // Default to empty array if no data provided
  onApplyFilters
}) => {
  // Basic state
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [isAIAssistantMode, setIsAIAssistantMode] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(5000);
  const [showGrid, setShowGrid] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [canPlaceAtHoveredCell, setCanPlaceAtHoveredCell] = useState<boolean>(true);
  const [showTips, setShowTips] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [droppedElements, setDroppedElements] = useState<DroppedElementType[]>([]);
  
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

  // AI Assistant manager
  const {
    aiAssistant,
    createAIAssistant,
    updateAIAssistant,
    deleteAIAssistant,
    addConnectionToAssistant,
    removeConnectionFromAssistant,
    hasAIAssistant
  } = useAIAssistantManager(dashboardTitle);

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
    validateConnection,
    handleAddManualConnection,
    handleRemoveManualConnection,
    isElementLinked,
    getLinkedElementInfo,
    handleConnectionDragStart,
    handleConnectionDrop,
    handleConnectionDragEnd,
    isValidDropTarget
  } = useConnectionManager(stickyNotes, updateStickyNote, aiAssistant, addConnectionToAssistant, removeConnectionFromAssistant);

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

  // Function to create dropped element from AI response
  const handleCreateElementFromAI = useCallback((elementData: {
    elementName: string;
    elementType: string;
    vegaSpec: any;
    description: string;
  }) => {
    const dashboardInfo = getDashboardGridInfoCallback();
    
    // Create element dimensions
    const elementWidth = 100; // Grid cells wide
    const elementHeight = 100; // Grid cells high
    
    // Calculate position to the right of the dashboard with some spacing
    const spacing = 20; // Grid cells spacing from dashboard
    const col = dashboardInfo.bounds.endCol + spacing;
    const row = dashboardInfo.bounds.startRow + (droppedElements.length * (elementHeight + 10)); // Stack vertically
    
    const gridX = col * CELL_SIZE;
    const gridY = row * CELL_SIZE;
    
    const newElement: DroppedElementType = {
      id: `ai-chart-${Date.now()}`,
      elementId: `ai-generated-${Date.now()}`, // Unique element ID for AI charts
      elementName: elementData.elementName,
      elementType: elementData.elementType,
      position: { x: gridX, y: gridY },
      gridPosition: { row, col },
      size: { width: elementWidth, height: elementHeight },
      vegaSpec: elementData.vegaSpec // Store the vega spec directly in the element
    };
    
    setDroppedElements(prev => [...prev, newElement]);
    setConnectionFeedback(`✓ "${elementData.elementName}" converted to movable element`);
    setTimeout(() => setConnectionFeedback(null), 3000);
  }, [getDashboardGridInfoCallback, droppedElements.length, setDroppedElements, setConnectionFeedback]);

  // Function to handle dropped element resize
  const handleDroppedElementResize = useCallback((
    elementId: string,
    newSize: { width: number; height: number }
  ) => {
    setDroppedElements(prev => prev.map(element => 
      element.id === elementId 
        ? { ...element, size: newSize }
        : element
    ));
  }, [setDroppedElements]);

  // Reset canPlaceAtHoveredCell when not in AI assistant mode
  useEffect(() => {
    if (!isAIAssistantMode) {
      setCanPlaceAtHoveredCell(true);
    }
  }, [isAIAssistantMode]);

  // Handle grid cell click for sticky note creation or AI assistant
  const handleGridCellClick = useCallback((cell: any) => {
    if (isAIAssistantMode) {
      // Create or move AI assistant (fixed 500x350 pixels) - no space checking needed
      if (hasAIAssistant()) {
        // Move existing AI assistant to new position
        const newX = cell.col * CELL_SIZE;
        const newY = cell.row * CELL_SIZE;
        updateAIAssistant(aiAssistant!.id, {
          row: cell.row,
          col: cell.col,
          x: newX,
          y: newY
        });
        setIsAIAssistantMode(false);
        setCanPlaceAtHoveredCell(true);
        setShowGrid(false);
      } else {
        // Create new AI assistant
        createAIAssistant(cell.row, cell.col, CELL_SIZE);
        setIsAIAssistantMode(false);
        setCanPlaceAtHoveredCell(true); // Reset the placement flag
        // Automatically enable annotation mode so users can place notes
        setIsAnnotationMode(true);
        setShowGrid(true);
      }
      return;
    }
    
    // Allow sticky note placement when in annotation mode or note linking mode
    if (isAnnotationMode || isNoteLinkingMode) {
      const noteWidth = 20;  // 20 cells wide (100 pixels)
      const noteHeight = 20; // 20 cells tall (100 pixels)
      
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
  }, [isAnnotationMode, isNoteLinkingMode, isAIAssistantMode, linkingElementId, createStickyNote, createAIAssistant, updateAIAssistant, hasAIAssistant, aiAssistant, transformRef, setZoomLevel, setIsNoteLinkingMode, setLinkingElementId, setIsAIAssistantMode]);

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

  const handleGoToCanvas = useCallback(() => {
    window.location.href = '/';
  }, []);

  // Handle mouse movement for note preview and AI assistant preview
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((isAnnotationMode || isAIAssistantMode || isNoteLinkingMode) && !isPanning && !isMoving) {
      // Use offsetX/offsetY which are relative to the canvas element
      const mouseX = e.nativeEvent.offsetX;
      const mouseY = e.nativeEvent.offsetY;
      
      // Snap to grid - find the top-left corner of the current grid cell
      const col = Math.floor(mouseX / CELL_SIZE);
      const row = Math.floor(mouseY / CELL_SIZE);
      const gridX = col * CELL_SIZE;
      const gridY = row * CELL_SIZE;
      
      // Position the preview at the exact grid position (top-left corner)
      setMousePosition({
        x: gridX,
        y: gridY
      });
    }
  }, [isAnnotationMode, isAIAssistantMode, isNoteLinkingMode, isPanning, isMoving]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      // Handle note creation when in note linking mode
      if (isNoteLinkingMode) {        
        // Use offsetX/offsetY which are relative to the canvas element and account for transforms
        const mouseX = e.nativeEvent.offsetX;
        const mouseY = e.nativeEvent.offsetY;
        
        // Snap to grid - find the top-left corner of the current grid cell
        const col = Math.floor(mouseX / CELL_SIZE);
        const row = Math.floor(mouseY / CELL_SIZE);
        const gridX = col * CELL_SIZE;
        const gridY = row * CELL_SIZE;
                
        // Create the note
        const newNoteId = createStickyNote(row, col, gridX, gridY, linkingElementId || undefined);
        
        // Exit note linking mode
        setIsNoteLinkingMode(false);
        setLinkingElementId(null);
        setShowGrid(false);
        
        // Select the newly created note
        selectNote(newNoteId);
      } else {
        selectNote(null);
      }
    }
  }, [selectNote, isNoteLinkingMode, linkingElementId, createStickyNote, setIsNoteLinkingMode, setLinkingElementId, setShowGrid]);

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
        } else if (isAIAssistantMode) {
          setIsAIAssistantMode(false);
          setShowGrid(false);
          setCanPlaceAtHoveredCell(true); // Reset the placement flag        
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
    isAnnotationMode, isAIAssistantMode, selectedNoteId, isDragging, isElementDragging, selectNote, 
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
        setIsAIAssistantMode(false);
        setCanPlaceAtHoveredCell(true); // Reset the placement flag
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
  const isValidDropTargetForConnections = useCallback((elementId: string, elementType: 'element' | 'note' | 'ai-assistant') => {
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
        <div className={styles.playgroundHeader}>
          <div className={styles.headerTitleSection}>
            <div className={styles.headerIcon}>
              <FiMove size={16} />
            </div>
            <div>
              <h3 className={styles.headerTitle}>
                Playground Mode - {dashboardTitle} 
              </h3>
            </div>
          </div>
          
          {/* Controls in Header */}
          <div className={styles.headerControls}>
            {/* Zoom Controls in Header */}
            <div className={styles.zoomControls}>
              <button onClick={handleZoomOut} className={styles.zoomButton}>
                <FiZoomOut size={16}/>
              </button>
              <input 
                type="range" 
                min="15" 
                max="200" 
                value={zoomLevel} 
                onChange={handleSliderChange} 
                className={styles.playgroundSlider}
              />
              <button onClick={handleZoomIn} className={styles.zoomButton}>
                <FiZoomIn size={16}/>
              </button>
              <button onClick={handleResetView} className={styles.resetViewButton}>
                <FiMaximize2 size={16}/>
                Reset View
              </button>
            </div>
            
            {/* Annotations Button */}
            {notesCount > 0 && (
              <button
                onClick={clearAllNotes}
                className={styles.clearNotesButton}
              >
                Clear All Notes
              </button>
            )}
            
            <button
              onClick={() => {
                setIsAnnotationMode(!isAnnotationMode);
                setShowGrid(!showGrid);
              }}
              className={`${styles.annotationsButton} ${isAnnotationMode ? styles.active : styles.inactive}`}
            >
              <FilePenLine size={16} />
              <span>{isAnnotationMode ? 'Exit Annotations' : 'Add Annotations'}</span>
              {notesCount > 0 && (
                <span className={`${styles.notesCountBadge} ${isAnnotationMode ? styles.active : styles.inactive}`}
                    title='Number of notes'>
                    {notesCount}
                </span>
              )}
            </button>
            
            {/* AI Assistant Button */}
            <button
              onClick={() => {
                if (hasAIAssistant()) {
                  // If AI assistant exists, activate move mode
                  setIsAIAssistantMode(true);
                  setShowGrid(true);
                } else {
                  // If no AI assistant, activate placement mode
                  setIsAIAssistantMode(!isAIAssistantMode);
                  setShowGrid(!showGrid);
                }
              }}
              className={`${styles.aiAssistantButton} ${isAIAssistantMode ? styles.active : (hasAIAssistant() ? styles.added : styles.inactive)}`}
            >
              <FiCpu size={16} />
              <span>
                {isAIAssistantMode ? 'Move AI Assistant' : 
                 hasAIAssistant() ? 'Move AI Assistant' : 'Add AI Assistant'}
              </span>
            </button>

            <button
              onClick={handleGoToCanvas}
              className={styles.viewCanvasButton}
            >
              <FiLink size={16} />
              VISplora
            </button>            
          </div>
        </div>

        {/* Canvas */}
        <div className={styles.canvasContainer}>
          <TransformWrapper
            ref={transformRef}
            initialScale={0.8}
            initialPositionX={-dashboardGridInfo.position.x}
            initialPositionY={-dashboardGridInfo.position.y}
            minScale={0.15}
            maxScale={2}
            centerOnInit={true}
            limitToBounds={false}
            smooth={true}
            disabled={isElementDragging}
            wheel={{
              disabled: isElementDragging,
              step: 0.001,
              smoothStep: 0.0005
            }}
            doubleClick={{
              disabled: isElementDragging,
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
                  className={`${styles.canvasBackground} ${
                    isPanning ? styles.panning : 
                    isAnnotationMode ? styles.annotationMode : 
                    isAIAssistantMode ? (canPlaceAtHoveredCell ? styles.aiAssistantMode : styles.aiAssistantModeBlocked) :
                    styles.default
                  }`}
                  style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`
                  }}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  data-panzoom-container
                >
                  {/* Interactive Grid */}
                  <InteractiveGrid
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    cellSize={CELL_SIZE}
                    showGrid={showGrid || isResizing || isMoving}
                    dashboardBounds={dashboardGridInfo.bounds}
                    onCellHover={(cell) => {
                      setHoveredCell(cell ? `Row: ${cell.row} - Col: ${cell.col}` : null);
                      
                      // Always allow placement when not in AI assistant mode
                      if (!isAIAssistantMode) {
                        setCanPlaceAtHoveredCell(true);
                      }
                    }}
                    onCellClick={handleGridCellClick}
                    isMoving={isMoving}
                    isPanning={isPanning}
                  />
                  
                  {/* Center the dashboard in the grid */}
                  <div 
                    ref={dashboardRef}
                    className={styles.dashboardContainer}
                    style={{ 
                      width: `${DASHBOARD_WIDTH}px`,
                      left: `${dashboardGridInfo.position.x}px`,
                      top: `${dashboardGridInfo.position.y}px`
                    }}
                    onClick={handleCanvasClick}
                    data-dashboard-container
                  >
                    {children}
                  </div>
                  
                  {/* Connection Lines - between linked notes and dashboard elements */}
                  <ConnectionLines
                    stickyNotes={stickyNotes}
                    cellSize={CELL_SIZE}
                    dashboardPosition={dashboardGridInfo.position}
                    dashboardWidth={DASHBOARD_WIDTH}
                    hoveredElementId={hoveredElementId}
                    onRemoveConnection={removeConnection}
                    manualConnections={manualConnections}
                    onAddManualConnection={handleAddManualConnection}
                    onRemoveManualConnection={handleRemoveManualConnection}
                    onConnectionDragStart={handleConnectionDragStart}
                    isDragging={isDragging}
                    dragStart={dragStart as any}
                    dragPreview={dragPreview}
                    droppedElements={droppedElements}
                    aiAssistant={aiAssistant}
                  />
                  
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
                      zoomLevel={zoomLevel}
                      onConnectionDragStart={handleConnectionDragStart}
                      isDragging={isDragging}
                      isDragTarget={isValidDropTarget(note.id, 'note')}
                    />
                  ))}
                  
                  {/* AI Assistant */}
                  {aiAssistant && (
                    <AIAssistant
                      assistant={aiAssistant}
                      cellSize={CELL_SIZE}
                      onUpdate={updateAIAssistant}
                      onDelete={deleteAIAssistant}
                      isResizing={isResizing}
                      onResizeStart={() => setIsResizing(true)}
                      onResizeEnd={() => setIsResizing(false)}
                      onMoveStart={() => setIsMoving(true)}
                      onMoveEnd={() => setIsMoving(false)}
                      zoomLevel={zoomLevel}
                      onConnectionDragStart={handleConnectionDragStart}
                      onConnectionDrop={handleConnectionDrop}
                      onConnectionDragEnd={handleConnectionDragEnd}
                      isDragging={isDragging}
                      isDragTarget={isValidDropTarget(aiAssistant.id, 'ai-assistant')}
                      hrData={hrData}
                      droppedElements={droppedElements}
                      stickyNotes={stickyNotes}
                      onApplyFilters={onApplyFilters}
                      onCreateElement={handleCreateElementFromAI}
                    />
                  )}
                  
                  {/* Dropped Elements */}
                  {droppedElements.map((element) => (
                    <DroppedElement
                      key={element.id}
                      element={element}
                      cellSize={CELL_SIZE}
                      hrData={hrData}
                      zoomLevel={zoomLevel}
                      onRemove={(id) => setDroppedElements(prev => prev.filter(el => el.id !== id))}
                      onMove={handleDroppedElementMove}
                      onResize={handleDroppedElementResize}
                      onMoveStart={handleDroppedElementMoveStart}
                      onMoveEnd={handleDroppedElementMoveEnd}
                      onResizeStart={() => setIsResizing(true)}
                      onResizeEnd={() => setIsResizing(false)}
                      onConnectionDragStart={handleConnectionDragStart}
                      isDragging={isDragging}
                      isDragTarget={isValidDropTargetForConnections(element.id, 'element')}
                    />
                  ))}
                  
                  {/* Note Preview - follows cursor in annotation mode or note linking mode */}
                  {(isAnnotationMode || isNoteLinkingMode) && !isPanning && !isMoving && (
                    <div
                      className={styles.notePreview}
                      style={{
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`,
                        width: `200px`,
                        height: `200px`,
                        opacity: hoveredCell ? '0.75' : '0.25'
                      }}
                    >
                      <div className={styles.notePreviewContent}>
                        <div className={styles.notePreviewHeader}>
                          <div className={styles.notePreviewTitle}>
                            📝 {isNoteLinkingMode && linkingElementId ? 'Linked Note' : 'New Note'}
                          </div>
                          <div className={styles.notePreviewDot}></div>
                        </div>
                        <div className={styles.notePreviewBody}>
                          <div className={styles.notePreviewText}>
                            {isNoteLinkingMode && linkingElementId ? 'Click to link note to element' : 'Click to place'}
                          </div>
                          {hoveredCell && (
                            <div className={styles.notePreviewPosition}>
                              {hoveredCell}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Assistant Preview - follows cursor in AI assistant mode */}
                  {isAIAssistantMode && !isPanning && !isMoving && (
                    <div
                      className="absolute bg-slate-800 border-2 border-blue-400 rounded-lg shadow-xl opacity-75 pointer-events-none z-50"
                      style={{
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`,
                        width: `500px`,
                        height: `350px`,
                        opacity: hoveredCell ? '0.75' : '0.25'
                      }}
                    >
                      <div className="bg-slate-700 px-3 py-2 border-b border-slate-600 flex items-center">
                        <FiCpu className="text-blue-400 mr-2" size={16} />
                        <div className="text-white font-medium text-sm">
                          🤖 AI Assistant
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-center text-center text-white">
                        <div>
                          <div className="text-sm mb-1">
                            {hasAIAssistant() ? 'Click to move AI Assistant' : 'Click to place AI Assistant'}
                          </div>
                          {hoveredCell && (
                            <div className="text-xs text-blue-300">
                              {hoveredCell}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Element Drag Preview - follows cursor during element dragging */}
                  {isElementDragging && elementDragPosition && elementDragData && (
                    <div
                      className="fixed bg-white border-2 border-orange-400 rounded-lg shadow-xl opacity-75 pointer-events-none z-50"
                      style={{
                        left: `${elementDragPosition.x - 200}px`,
                        top: `${elementDragPosition.y - 150}px`,
                        width: `400px`,
                        height: `300px`,
                      }}
                    >
                      <div className="bg-orange-100 px-3 py-2 border-b border-orange-200 flex items-center">
                        <FiMove size={12} className="text-orange-600 mr-2" />
                        <div className="text-xl font-medium text-orange-800 truncate">
                          {elementDragData.elementName}
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-center text-center">
                        <div>
                          <div className="text-2xl mb-2">📊</div>
                          <div className="text-lg text-gray-600">Dragging {elementDragData.elementType}</div>
                          <div className="text-lg text-gray-500 mt-2">Drop anywhere to copy</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TransformComponent>
            </React.Fragment>
          </TransformWrapper>
        </div>

        {/* Footer */}
        <div className={styles.playgroundFooter}>
          <div className={styles.footerContent}>   
            <button
              onClick={() => setShowTips(!showTips)}
              className={styles.helpButton}
            >
              <span>Help</span>
              <span className={`${styles.helpArrow} ${showTips ? styles.rotated : ''}`}>
                ▼
              </span>
            </button>
            
            {showTips && (              
              <div className={styles.helpTooltip}>
                {/* Navigation */}
                <span><strong>Navigation:</strong> Drag to pan around the dashboard.</span>
                <span><strong>Zooming:</strong> Scroll or use controls to zoom.</span>
                <span><strong>Centering:</strong> Use "Reset View" to return to center.</span>

                {/* Dashboard Management */}
                <span><strong>Saving:</strong> Click "Add to VISplora" to save dashboard.</span>
                <span><strong>Exiting:</strong> Press ESC to exit current mode or close playground.</span>

                {/* Sticky Notes */}
                <span><strong>Notes Mode:</strong> Click "Add Annotations" to toggle sticky notes.</span>
                <span><strong>Adding Notes:</strong> Click a grid cell to add a sticky note.</span>
                <span><strong>Note Controls:</strong> Resize or move notes by dragging edges or title bar.</span>
                <span><strong>Note Clearing:</strong> Use the "Clear All Notes" button to remove all sticky notes.</span>
                <span><strong>Linking:</strong> Click link button on notes to link/unlink from elements.</span>

                {/* Copied Elements */}
                <span><strong>Copying Elements:</strong> Use drag button on linkable elements to copy to playground.</span>
                <span><strong>Moving Copies:</strong> Click the move button on copied elements to reposition them.</span>
                <span><strong>Connecting Copies:</strong> Use connection nodes on copied elements to link with notes or other elements.</span>
                <span><strong>Removing Copies:</strong> Click the X button on copied elements to remove them.</span>
              </div>
            )}
            
            {(isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || 
             isResizing || isMoving || isDragging || isElementDragging || 
             isDroppedElementMoving || connectionFeedback) && (
              <div className={styles.feedbackCenter}>
                {isAnnotationMode && 
                <span className={`${styles.feedbackText} ${styles.annotation}`}>Select a grid cell to add sticky note
                </span>}
                {isNoteLinkingMode && (
                  <span className={`${styles.feedbackText} ${styles.noteLinking}`}>
                    Place linked note
                    {linkingElementId && ` for element: ${linkingElementId}`}
                  </span>)}
                {isElementSelectionMode && (
                  <span className={`${styles.feedbackText} ${styles.elementSelection}`}>
                    Select the dashboard element to link selected note with
                  </span>)}
                {isResizing && <span className={`${styles.feedbackText} ${styles.resizing}`}>
                  Resizing note - drop note to confirm size
                  </span>}
                {isMoving && <span className={`${styles.feedbackText} ${styles.moving}`}>
                  Moving note - drop note to confirm placement
                  </span>}
                {isDroppedElementMoving && <span className={`${styles.feedbackText} ${styles.moving}`}>
                  Moving copied element - drop to confirm placement
                  </span>}
                {isElementDragging && (
                  <span className={`${styles.feedbackText} ${styles.dragging}`}>
                    Dragging element - will be placed near dashboard (movable after drop)
                  </span>)}
                {isDragging && !connectionFeedback && (
                  <span className={`${styles.feedbackText} ${styles.dragging}`}>
                    Creating connection - drag to a connection node to link
                  </span>)}
                {connectionFeedback && (
                  <span className={`${styles.feedbackText} ${
                    connectionFeedback.startsWith('✓') ? styles.success : 
                    connectionFeedback.startsWith('✗') ? styles.error : 
                    styles.info
                  }`}>
                    {connectionFeedback}
                  </span>)}
                {(isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || isDragging || isElementDragging) && (
                  <span>Press ESC to exit</span>
                )}
              </div>
            )}            
            
            <div className={styles.statusIndicators}>
              <div className={styles.statusIndicator}>
                <span className={`${styles.statusDot} ${isPanning ? styles.active + ' ' + styles.panningIndicator : styles.inactive}`}></span>
                <span>Interactive Mode</span>
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
