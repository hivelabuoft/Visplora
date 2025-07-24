import React, { useState, useCallback } from 'react';
import { VegaLite } from 'react-vega';
import { getWidgetDataForSidebar, renderWidgetForSidebar } from '@/app/dashboard2/widgets';
import { HRData } from '@/app/types/interfaces';
import { FiX, FiMove } from 'react-icons/fi';
import { ConnectionNodes } from './connection-nodes';

interface DroppedElementProps {
  element: {
    id: string;
    elementId: string;
    elementName: string;
    elementType: string;
    position: { x: number; y: number };
    gridPosition: { row: number; col: number };
    size: { width: number; height: number };
    vegaSpec?: any; // Optional vega spec for AI-generated charts
  };
  cellSize: number;
  onRemove: (id: string) => void;
  onMove?: (id: string, newPosition: { x: number; y: number }, newGridPosition: { row: number; col: number }) => void;
  onResize?: (id: string, newSize: { width: number; height: number }) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  hrData?: HRData[]; // Add HR data prop
  zoomLevel?: number; // Add zoom level prop for zoom-aware movement
  onConnectionDragStart?: (elementId: string, type: 'element' | 'note' | 'ai-assistant', position: 'top' | 'right' | 'bottom' | 'left', x: number, y: number) => void;
  isDragging?: boolean;
  isDragTarget?: boolean;
}

const DroppedElement: React.FC<DroppedElementProps> = ({ 
  element, 
  cellSize, 
  onRemove, 
  onMove,
  onResize,
  onMoveStart, 
  onMoveEnd,
  onResizeStart,
  onResizeEnd,
  hrData = [],
  zoomLevel = 100,
  onConnectionDragStart,
  isDragging = false,
  isDragTarget = false
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<'none' | 'corner' | 'right' | 'bottom'>('none');
  const [moveStartPos, setMoveStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [tempPosition, setTempPosition] = useState(element.position);
  const [tempSize, setTempSize] = useState(element.size);

  const handleRemove = () => {
    onRemove(element.id);
  };

  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsMoving(true);
    
    // Get canvas container for proper coordinate calculation
    const canvasContainer = document.querySelector('[data-dashboard-container]')?.parentElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // Calculate offset considering zoom level
      const scale = zoomLevel / 100;
      const offsetX = (e.clientX - canvasRect.left) / scale - element.position.x;
      const offsetY = (e.clientY - canvasRect.top) / scale - element.position.y;
      
      setMoveStartPos({ x: offsetX, y: offsetY });
    } else {
      setMoveStartPos({
        x: e.clientX - element.position.x,
        y: e.clientY - element.position.y
      });
    }
    
    setTempPosition(element.position);
    
    if (onMoveStart) {
      onMoveStart();
    }
  }, [element.position, onMoveStart, zoomLevel]);

  const handleMoveMove = useCallback((e: MouseEvent) => {
    if (!isMoving) return;
    
    // Get canvas container for proper coordinate calculation
    const canvasContainer = document.querySelector('[data-dashboard-container]')?.parentElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // Calculate position considering zoom level
      const scale = zoomLevel / 100;
      const newX = (e.clientX - canvasRect.left) / scale - moveStartPos.x;
      const newY = (e.clientY - canvasRect.top) / scale - moveStartPos.y;
      
      // Snap to grid
      const col = Math.floor(newX / cellSize);
      const row = Math.floor(newY / cellSize);
      const gridX = col * cellSize;
      const gridY = row * cellSize;
      
      setTempPosition({ x: gridX, y: gridY });
    }
  }, [isMoving, moveStartPos, cellSize, zoomLevel]);

  const handleMoveEnd = useCallback((e: MouseEvent) => {
    if (!isMoving) return;
    
    // Get canvas container for proper coordinate calculation
    const canvasContainer = document.querySelector('[data-dashboard-container]')?.parentElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      // Calculate final position considering zoom level
      const scale = zoomLevel / 100;
      const newX = (e.clientX - canvasRect.left) / scale - moveStartPos.x;
      const newY = (e.clientY - canvasRect.top) / scale - moveStartPos.y;
      
      // Snap to grid
      const col = Math.floor(newX / cellSize);
      const row = Math.floor(newY / cellSize);
      const gridX = col * cellSize;
      const gridY = row * cellSize;
      
      setIsMoving(false);
      
      if (onMove) {
        onMove(element.id, { x: gridX, y: gridY }, { row, col });
      }
      
      if (onMoveEnd) {
        onMoveEnd();
      }
    }
  }, [isMoving, moveStartPos, cellSize, onMove, onMoveEnd, element.id, zoomLevel]);

  // Set up mouse event listeners for moving
  React.useEffect(() => {
    if (isMoving) {
      document.addEventListener('mousemove', handleMoveMove);
      document.addEventListener('mouseup', handleMoveEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMoveMove);
        document.removeEventListener('mouseup', handleMoveEnd);
      };
    }
  }, [isMoving, handleMoveMove, handleMoveEnd]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, mode: 'corner' | 'right' | 'bottom') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeMode(mode);
    setMoveStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ width: element.size.width, height: element.size.height });
    setTempSize(element.size);
    
    if (onResizeStart) {
      onResizeStart();
    }
  }, [element.size, onResizeStart]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (resizeMode === 'none' || !isResizing) return;
    
    const deltaX = e.clientX - moveStartPos.x;
    const deltaY = e.clientY - moveStartPos.y;
    const scale = zoomLevel / 100;
    
    const scaledDeltaX = deltaX / scale;
    const scaledDeltaY = deltaY / scale;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    
    if (resizeMode === 'corner' || resizeMode === 'right') {
      newWidth = Math.max(40, startSize.width + Math.floor(scaledDeltaX / cellSize)); // Minimum 40 grid cells width
    }
    
    if (resizeMode === 'corner' || resizeMode === 'bottom') {
      newHeight = Math.max(30, startSize.height + Math.floor(scaledDeltaY / cellSize)); // Minimum 30 grid cells height
    }
    
    setTempSize({ width: newWidth, height: newHeight });
  }, [resizeMode, isResizing, moveStartPos, startSize, zoomLevel, cellSize]);

  const handleResizeEnd = useCallback(() => {
    if (resizeMode === 'none' || !isResizing) return;
    
    setIsResizing(false);
    setResizeMode('none');
    
    if (onResize) {
      onResize(element.id, tempSize);
    }
    
    if (onResizeEnd) {
      onResizeEnd();
    }
  }, [resizeMode, isResizing, onResize, onResizeEnd, element.id, tempSize]);

  // Set up mouse event listeners for resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  const renderElementContent = () => {    
    // Use real HR data if available, otherwise fall back to sample data for development
    const dataToUse = hrData.length > 0 ? hrData : [];
    
    // If this is an AI-generated chart with vega spec, render it directly
    if (element.vegaSpec) {
      const chartSpec = {
        ...element.vegaSpec,
        width: Math.max(350, (tempSize.width * cellSize) - 40),
        height: Math.max(250, (tempSize.height * cellSize) - 80),
        // Ensure data is present - use HR data if chart uses it
        data: element.vegaSpec.data || { values: dataToUse }
      };
      
      return (
        <div className="w-full h-full p-2 flex items-center justify-center">
          <VegaLite 
            spec={chartSpec} 
            actions={false} 
          />
        </div>
      );
    }
    
    try {
      // Primary approach: Use the widget renderer directly
      const renderedWidget = renderWidgetForSidebar(element.elementId, dataToUse);
      if (renderedWidget) {
        return (
          <div className="w-full h-full flex items-center justify-center p-2 overflow-hidden">
            <div className="flex items-center justify-center scale-95 origin-center max-w-full max-h-full">
              {renderedWidget}
            </div>
          </div>
        );
      }

      // Fallback: Try to get widget data and render as Vega-Lite chart
      const widgetData = getWidgetDataForSidebar(element.elementId, dataToUse, {});
      if (widgetData && widgetData.vegaSpec && widgetData.data && widgetData.data.length > 0) {
        const chartSpec = {
          ...widgetData.vegaSpec,
          width: Math.max(350, (tempSize.width * cellSize) - 40),
          height: Math.max(250, (tempSize.height * cellSize) - 80),
          data: { values: widgetData.data }
        };
        
        return (
          <div className="w-full h-full p-2 flex items-center justify-center">
            <VegaLite 
              spec={chartSpec} 
              actions={false} 
            />
          </div>
        );
      }

    } catch (error) {
      console.warn('Error rendering widget in dropped element:', error);
    }

    // Fallback rendering
    return (
      <div className="w-full h-full flex items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-700">{element.elementName}</div>
          <div className="text-sm text-gray-500">{element.elementType}</div>
          <div className="text-xs text-gray-400 mt-2">
            Element ID: {element.elementId}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Data records: {dataToUse.length}
          </div>
        </div>
      </div>
    );
  };

  const currentPosition = isMoving ? tempPosition : element.position;
  const currentSize = isResizing ? tempSize : element.size;

  return (
    <div
      className={`absolute bg-white rounded-lg shadow-lg ring-2 border border-gray-200 group hover:shadow-lg transition-shadow duration-200 ${isMoving ? 'shadow-2xl border-blue-400' : ''} ${isResizing ? 'shadow-2xl border-green-400' : ''} ${isDragTarget ? 'ring-2 ring-blue-400 ring-opacity-50' : 'ring-gray-200'}`}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        width: `${currentSize.width * cellSize}px`,
        height: `${currentSize.height * cellSize}px`,
        zIndex: isMoving || isResizing ? 1000 : 10,
        cursor: isMoving ? 'grabbing' : 'default'
      }}
      data-element-id={element.id}
    >
      {/* Connection Nodes */}
      {onConnectionDragStart && (
        <ConnectionNodes
          elementId={element.id}
          isVisible={!isDragging && !isMoving && !isResizing}
          onDragStart={onConnectionDragStart}
          isDragTarget={isDragTarget}
          isDragging={isDragging}
          isNote={false}
        />
      )}

      {/* Header with title, move handle and remove button */}
      <div className="bg-gray-100 rounded-t-lg px-3 py-2 flex items-center justify-between gap-2 border-b border-gray-200">
        <button
        onMouseDown={handleMoveStart}
        className="w-6 h-6 bg-gray-400 hover:bg-gray-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-move"
        title="Move element"
        >
            <FiMove size={12} />
        </button>
        <div className="flex items-center justify-center space-x-2 flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate">
            {element.elementName}
          </div>
          {/* Type badge */}
          <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {element.elementType}
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Remove element"
        >
          <FiX size={12} />
        </button>
      </div>

      {/* Content area */}
      <div 
        className="absolute top-8 left-0 right-0 bottom-0 overflow-hidden rounded-b-lg grid justify-center items-center"
      >
        {renderElementContent()}
      </div>

      {/* Resize handles */}
      <>
        {/* Corner resize */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize bg-slate-600 opacity-50 hover:opacity-100"
          onMouseDown={(e) => handleResizeStart(e, 'corner')}
          style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
        />
        
        {/* Right resize */}
        <div
          className="absolute top-8 right-0 w-1 bottom-4 cursor-e-resize bg-transparent hover:bg-slate-600 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        />
        
        {/* Bottom resize */}
        <div
          className="absolute bottom-0 left-3 right-4 h-1 cursor-s-resize bg-transparent hover:bg-slate-600 opacity-0 hover:opacity-50"
          onMouseDown={(e) => handleResizeStart(e, 'bottom')}
        />
      </>
    </div>
  );
};

export default DroppedElement;
