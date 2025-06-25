'use client';

import React, { useState, useCallback, useEffect, ReactNode, useRef, createContext, useContext } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FiZoomIn, FiZoomOut, FiMaximize2, FiX, FiMove, FiPlus, FiCheck, FiLink } from 'react-icons/fi';
import styles from './DashboardPlayground.module.css';
import { FilePenLine } from 'lucide-react';
import InteractiveGrid from '../../components/ui/interactive-grid';
import StickyNote from '../../components/ui/sticky-note';
import ConnectionLines, { ManualConnection } from '../../components/ui/connection-lines';
import { useStickyNotesManager } from '../../components/ui/sticky-notes-manager';

// Context for dashboard playground operations
interface DashboardPlaygroundContextType {  activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  activateElementSelectionMode: ((noteId: string) => void) | undefined;
  isElementSelectionMode: boolean;
  noteToLink: string | null;
  linkNoteToElement: ((noteId: string, elementId: string) => void) | undefined;
  isElementLinked: ((elementId: string) => boolean) | undefined;
  getLinkedElementInfo: ((noteId: string) => { elementId: string; type: 'automatic' | 'manual' } | null) | undefined;
  setHoveredElementId: (elementId: string | null) => void;
  // Manual connection drag functionality
  onConnectionDragStart?: (
    elementId: string, 
    type: 'element' | 'note', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => void;
  isDragging: boolean;
  isValidDropTarget: (elementId: string, type: 'element' | 'note') => boolean;
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
  dashboardTitle?: string;
  dashboardType?: string;
  onAddToCanvas?: () => void;
}

const DashboardPlayground: React.FC<DashboardPlaygroundProps> = ({
  children,
  isActive,
  dashboardTitle = "Dashboard",
  dashboardType = "default",
  onAddToCanvas
}) => {  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [isNoteLinkingMode, setIsNoteLinkingMode] = useState(false);
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false);
  const [noteToLink, setNoteToLink] = useState<string | null>(null);
  const [linkingElementId, setLinkingElementId] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(5000);
  const [showGrid, setShowGrid] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [occupiedCells, setOccupiedCells] = useState<Set<string>>(new Set());
  const [showTips, setShowTips] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const dashboardPositionRef = useRef({ x: 0, y: 0 });
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

  // Manual connections state
  const [manualConnections, setManualConnections] = useState<ManualConnection[]>([]);
  
  // Connection feedback state for footer
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);

  // Grid configuration
  const canvasWidth = 6000;
  const CELL_SIZE = 5;
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
      // Calculate proper center position for the current canvas size
      const dashboardInfo = getDashboardGridInfo();
      const dashboardCenterX = dashboardInfo.position.x + dashboardInfo.size.width / 2;
      const dashboardCenterY = dashboardInfo.position.y + dashboardInfo.size.height / 2;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scale = 0.8; // Default scale
      
      // Calculate position to center the dashboard in the viewport
      const targetX = (viewportWidth / 2) - (dashboardCenterX * scale);
      const targetY = (viewportHeight / 2) - (dashboardCenterY * scale);
      
      transformRef.current.setTransform(targetX, targetY, scale, 500, "easeInCubic");
      setZoomLevel(80);
    }
  }, [getDashboardGridInfo]);

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

  // Remove connection between note and element
  const removeConnection = useCallback((noteId: string) => {
    updateStickyNote(noteId, {
      linkedElementId: undefined,
      isLinked: false
    });
  }, [updateStickyNote]);
  
  // Check if an element is linked to any note (either automatic or manual connection)
  const isElementLinked = useCallback((elementId: string): boolean => {
    // Check for automatic connections
    const hasAutomaticConnection = stickyNotes.some(note => note.isLinked && note.linkedElementId === elementId);
    
    // Check for manual connections
    const hasManualConnection = manualConnections.some(conn => 
      (conn.sourceId === elementId && conn.sourceType === 'element') ||
      (conn.targetId === elementId && conn.targetType === 'element')
    );
    
    return hasAutomaticConnection || hasManualConnection;
  }, [stickyNotes, manualConnections]);

  // Get linked element information for a note (checks both automatic and manual connections)
  const getLinkedElementInfo = useCallback((noteId: string): { elementId: string; type: 'automatic' | 'manual' } | null => {
    // Check for automatic connection
    const note = stickyNotes.find(n => n.id === noteId);
    if (note?.linkedElementId) {
      return { elementId: note.linkedElementId, type: 'automatic' };
    }
    
    // Check for manual connections
    const manualConnection = manualConnections.find(conn => 
      (conn.sourceId === noteId && conn.sourceType === 'note' && conn.targetType === 'element') ||
      (conn.targetId === noteId && conn.targetType === 'note' && conn.sourceType === 'element')
    );
    
    if (manualConnection) {
      const elementId = manualConnection.sourceId === noteId ? manualConnection.targetId : manualConnection.sourceId;
      return { elementId, type: 'manual' };
    }
    
    return null;
  }, [stickyNotes, manualConnections]);

  // Manual connection handlers
  const handleAddManualConnection = useCallback((connection: ManualConnection) => {
    setManualConnections(prev => [...prev, connection]);
  }, []);
  const handleRemoveManualConnection = useCallback((connectionId: string) => {
    const connectionToRemove = manualConnections.find(conn => conn.id === connectionId);
    if (!connectionToRemove) return;
    
    setManualConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    // Check if notes should be unlinked after removing this connection
    const remainingConnections = manualConnections.filter(conn => conn.id !== connectionId);
    // Check source note
    if (connectionToRemove.sourceType === 'note') {
      const sourceHasOtherConnections = remainingConnections.some(conn => 
        conn.sourceId === connectionToRemove.sourceId || conn.targetId === connectionToRemove.sourceId
      );
      const sourceHasAutomaticConnection = stickyNotes.find(note => 
        note.id === connectionToRemove.sourceId && note.linkedElementId
      );
      
      if (!sourceHasOtherConnections && !sourceHasAutomaticConnection) {
        updateStickyNote(connectionToRemove.sourceId, { 
          isLinked: false, 
          linkedElementId: undefined 
        });
      } else if (connectionToRemove.targetType === 'element') {
        // If removing connection to element, clear the linkedElementId
        const sourceNote = stickyNotes.find(note => note.id === connectionToRemove.sourceId);
        if (sourceNote?.linkedElementId === connectionToRemove.targetId) {
          updateStickyNote(connectionToRemove.sourceId, { 
            linkedElementId: undefined 
          });
        }
      }
    }
    
    // Check target note
    if (connectionToRemove.targetType === 'note') {
      const targetHasOtherConnections = remainingConnections.some(conn => 
        conn.sourceId === connectionToRemove.targetId || conn.targetId === connectionToRemove.targetId
      );
      const targetHasAutomaticConnection = stickyNotes.find(note => 
        note.id === connectionToRemove.targetId && note.linkedElementId
      );
      
      if (!targetHasOtherConnections && !targetHasAutomaticConnection) {
        updateStickyNote(connectionToRemove.targetId, { 
          isLinked: false, 
          linkedElementId: undefined 
        });
      } else if (connectionToRemove.sourceType === 'element') {
        // If removing connection from element, clear the linkedElementId
        const targetNote = stickyNotes.find(note => note.id === connectionToRemove.targetId);
        if (targetNote?.linkedElementId === connectionToRemove.sourceId) {
          updateStickyNote(connectionToRemove.targetId, { 
            linkedElementId: undefined 
          });
        }
      }
    }
  }, [manualConnections, stickyNotes, updateStickyNote]);// Drag state for manual connections
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    id: string;
    type: 'element' | 'note';
    position: 'top' | 'right' | 'bottom' | 'left';
    x: number;
    y: number;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);
  const handleConnectionDragStart = useCallback((
    elementId: string, 
    type: 'element' | 'note', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => {
    setConnectionFeedback(`Dragging from ${type === 'note' ? 'note' : 'element'} (${position} edge) - drag to another connection node to create link`);
    setIsDragging(true);
    setDragStart({ id: elementId, type, position, x, y });
    setDragPreview({ x, y });
  }, []);

  // Handle drag movement
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    // Get mouse position relative to the canvas
    const canvasRect = document.querySelector('[data-dashboard-container]')?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
      setDragPreview({ x, y });
  }, [isDragging, dragStart]);

  // Validate connection rules
  const validateConnection = useCallback((
    sourceId: string, 
    sourceType: 'element' | 'note',
    targetId: string, 
    targetType: 'element' | 'note'
  ): boolean => {
    // Rule: Connections are only allowed between:
    // 1. Note to Note
    // 2. Note to Element  
    // 3. Element to Note
    if (sourceType === 'element' && targetType === 'element') {
      return false; // Element to Element not allowed
    }
    
    // Don't allow self-connections
    if (sourceId === targetId) {
      return false;
    }
      // Check if connection already exists (manual connections)
    const manualConnectionExists = manualConnections.some(conn => 
      (conn.sourceId === sourceId && conn.targetId === targetId) ||
      (conn.sourceId === targetId && conn.targetId === sourceId)
    );
    
    // Check if automatic connection already exists
    const automaticConnectionExists = (
      (sourceType === 'note' && targetType === 'element' && 
       stickyNotes.some(note => note.id === sourceId && note.linkedElementId === targetId)) ||
      (sourceType === 'element' && targetType === 'note' && 
       stickyNotes.some(note => note.id === targetId && note.linkedElementId === sourceId))
    );
    
    return !manualConnectionExists && !automaticConnectionExists;
  }, [manualConnections, stickyNotes]);

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
        
        // Validate connection rules
        const isValidConnection = validateConnection(
          dragStart.id, dragStart.type,
          targetElementId, targetType
        );
          if (isValidConnection) {
          const connection: ManualConnection = {
            id: `manual-${dragStart.id}-${dragStart.position}-${targetElementId}-${targetPosition}`,
            sourceId: dragStart.id,
            sourceType: dragStart.type,
            sourcePosition: dragStart.position,
            targetId: targetElementId,
            targetType: targetType,
            targetPosition: targetPosition
          };
            handleAddManualConnection(connection);
          
          // Activate linked state for connected notes and clear any conflicting automatic connections
          if (dragStart.type === 'note') {
            // Check if this note was automatically linked to the target element, if so clear it
            const sourceNote = stickyNotes.find(note => note.id === dragStart.id);
            const updateData: any = { isLinked: true };
            if (targetType === 'element' && sourceNote?.linkedElementId === targetElementId) {
              updateData.linkedElementId = undefined;
            }
            updateStickyNote(dragStart.id, updateData);
          }
          if (targetType === 'note') {
            // Check if this note was automatically linked to the source element, if so clear it
            const targetNote = stickyNotes.find(note => note.id === targetElementId);
            const updateData: any = { isLinked: true };
            if (dragStart.type === 'element' && targetNote?.linkedElementId === dragStart.id) {
              updateData.linkedElementId = undefined;
            }
            updateStickyNote(targetElementId, updateData);
          }
          
          setConnectionFeedback(`✓ Connection created between ${dragStart.type} and ${targetType}`);
          // Clear feedback after a delay
          setTimeout(() => setConnectionFeedback(null), 5000);
        } else {
          setConnectionFeedback(`✗ Invalid connection: cannot connect ${dragStart.type} to ${targetType} (or connection already exists)`);
          // Clear feedback after a delay
          setTimeout(() => setConnectionFeedback(null), 5000);
        }
      } else {
        // No valid target found
        setConnectionFeedback(`Connection cancelled - no valid target found`);
        // Clear feedback after a delay
        setTimeout(() => setConnectionFeedback(null), 5000);
      }
    } else {
      // Drag ended without finding any connection node
      setConnectionFeedback(`Connection cancelled - drag to a connection node to create a link`);
      // Clear feedback after a delay
      setTimeout(() => setConnectionFeedback(null), 5000);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragPreview(null);
  }, [isDragging, dragStart, handleAddManualConnection, manualConnections, updateStickyNote, stickyNotes]);
  // Validate connection rules  // Set up global drag event listeners
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

  // Helper function to determine if a note is a valid drop target
  const isValidDropTarget = useCallback((noteId: string, noteType: 'element' | 'note') => {
    if (!isDragging || !dragStart) return false;
    
    // Can't drop on self
    if (dragStart.id === noteId) return false;
    
    // Apply connection rules
    if (dragStart.type === 'element' && noteType === 'element') return false; // Element to Element not allowed
    
    // Check if connection already exists
    const connectionExists = manualConnections.some(conn => 
      (conn.sourceId === dragStart.id && conn.targetId === noteId) ||
      (conn.sourceId === noteId && conn.targetId === dragStart.id)
    );
    
    return !connectionExists;
  }, [isDragging, dragStart, manualConnections]);

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
        if (isDragging) {
          // Cancel drag operation
          setIsDragging(false);
          setDragStart(null);
          setDragPreview(null);
          setConnectionFeedback('Connection cancelled');
          // Clear feedback after a delay
          setTimeout(() => setConnectionFeedback(null), 5000);
        } else if (showTips) {
          // Close tips first if open
          setShowTips(false);
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
          // Deselect any selected note
        } else if (selectedNoteId) {
          selectNote(null);
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
    };  }, [isActive, showTips, isResizing, isMoving, isElementSelectionMode, isNoteLinkingMode, 
    isAnnotationMode, selectedNoteId, isDragging, setIsResizing, setIsMoving, selectNote]);

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
          // Use handleResetView to properly center the dashboard instead of resetTransform
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
  }, [isActive, handleResetView]);
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
      // This matches where the actual note will be placed
      setMousePosition({
        x: gridX,
        y: gridY
      });
    }
  }, [isAnnotationMode, isPanning, isMoving, CELL_SIZE]);

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
      isElementLinked,
      getLinkedElementInfo,
      setHoveredElementId,
      onConnectionDragStart: handleConnectionDragStart,
      isDragging,
      isValidDropTarget
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
                min="25" 
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
            {/* Add to Canvas and View Canvas Buttons */}
              <button
              onClick={handleAddToCanvas}
              disabled={isAdded}
              className={`${styles.addToCanvasButton} ${isAdded ? styles.added : styles.notAdded}`}
              >
              {isAdded ? (<><FiCheck size={16} />Added to VISplora</>) : (<><FiPlus size={16} />Add to VISplora</>)}
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

        {/* Playground Canvas */}
        <div className={styles.canvasContainer}>
          <TransformWrapper
            ref={transformRef}
            initialScale={0.8}
            initialPositionX={-getDashboardGridInfo().position.x}
            initialPositionY={-getDashboardGridInfo().position.y}
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
                  className={`${styles.canvasBackground} ${
                    isPanning ? styles.panning : 
                    isAnnotationMode ? styles.annotationMode : 
                    styles.default
                  }`}
                  style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`
                  }}
                  // Deselect notes when clicking on canvas background (not on notes or dashboard)
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      selectNote(null);
                    }
                  }}
                  onMouseMove={handleCanvasMouseMove}
                >{/* Interactive Grid */}
                  <InteractiveGrid
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    cellSize={CELL_SIZE}
                    showGrid={showGrid || isResizing || isMoving || isNoteLinkingMode}
                    dashboardBounds={getDashboardGridInfo().bounds}
                    occupiedCells={occupiedCells}
                    onCellHover={(cell) => setHoveredCell(cell ? `Row: ${cell.row} - Col: ${cell.col}` : null)}
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
                      left: `${getDashboardGridInfo().position.x}px`,
                      top: `${getDashboardGridInfo().position.y}px`
                    }}
                    onClick={(e) => {
                      // Deselect notes when clicking on dashboard area
                      if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
                        selectNote(null);
                      }
                    }}
                    data-dashboard-container
                  >
                    {children}
                  </div>
                  {/* Connection Lines - between linked notes and dashboard elements */}
                  <ConnectionLines
                    stickyNotes={stickyNotes}
                    cellSize={CELL_SIZE}
                    dashboardPosition={getDashboardGridInfo().position}
                    dashboardWidth={DASHBOARD_WIDTH}
                    hoveredElementId={hoveredElementId}
                    onRemoveConnection={removeConnection}
                    manualConnections={manualConnections}
                    onAddManualConnection={handleAddManualConnection}
                    onRemoveManualConnection={handleRemoveManualConnection}
                    onConnectionDragStart={handleConnectionDragStart}
                    isDragging={isDragging}
                    dragStart={dragStart}
                    dragPreview={dragPreview}
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
                      getOccupiedCells={getAllOccupiedCells}
                      zoomLevel={zoomLevel}
                      onConnectionDragStart={handleConnectionDragStart}
                      isDragging={isDragging}
                      isDragTarget={isValidDropTarget(note.id, 'note')}
                    />
                  ))}
                  {/* Note Preview - follows cursor in annotation mode */}
                  {isAnnotationMode && !isPanning && !isMoving && (
                    <div
                      className={styles.notePreview}
                      style={{
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`,
                        width: `${CELL_SIZE * 50}px`,
                        height: `${CELL_SIZE * 50}px`,
                        opacity: hoveredCell ? '0.75' : '0.25'
                      }}
                    >
                      <div className={styles.notePreviewContent}>
                        <div className={styles.notePreviewHeader}>
                          <div className={styles.notePreviewTitle}>
                            📝 New Note
                          </div>
                          <div className={styles.notePreviewDot}></div>
                        </div>
                        <div className={styles.notePreviewBody}>
                          <div className={styles.notePreviewText}>
                            Click to place
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
              </div>
            )}
            {(isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || isResizing || isMoving || isDragging || connectionFeedback) && (
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
                {(isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || isDragging) && (
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
