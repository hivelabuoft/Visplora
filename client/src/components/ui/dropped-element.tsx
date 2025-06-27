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
  };
  cellSize: number;
  onRemove: (id: string) => void;
  onMove?: (id: string, newPosition: { x: number; y: number }, newGridPosition: { row: number; col: number }) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
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
  onMoveStart, 
  onMoveEnd, 
  hrData = [],
  zoomLevel = 100,
  onConnectionDragStart,
  isDragging = false,
  isDragTarget = false
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [moveStartPos, setMoveStartPos] = useState({ x: 0, y: 0 });
  const [tempPosition, setTempPosition] = useState(element.position);

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

  const renderElementContent = () => {    
    // Use real HR data if available, otherwise fall back to sample data for development
    const dataToUse = hrData.length > 0 ? hrData : [];
    
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
          width: Math.max(350, (element.size.width * cellSize) - 40),
          height: Math.max(250, (element.size.height * cellSize) - 80),
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

  return (
    <div
      className={`absolute bg-white rounded-lg shadow-lg ring-2 border border-gray-200 group hover:shadow-lg transition-shadow duration-200 ${isMoving ? 'shadow-2xl border-blue-400' : ''} ${isDragTarget ? 'ring-2 ring-blue-400 ring-opacity-50' : 'ring-gray-200'}`}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        width: `${element.size.width * cellSize}px`,
        height: `${element.size.height * cellSize}px`,
        zIndex: isMoving ? 1000 : 10,
        cursor: isMoving ? 'grabbing' : 'default'
      }}
      data-element-id={element.id}
    >
      {/* Connection Nodes */}
      {onConnectionDragStart && (
        <ConnectionNodes
          elementId={element.id}
          isVisible={!isDragging && !isMoving}
          onDragStart={onConnectionDragStart}
          isDragTarget={isDragTarget}
          isDragging={isDragging}
          isNote={false}
        />
      )}

      {/* Header with title, move handle and remove button */}
      <div className="absolute top-0 left-0 right-0 bg-gray-100 rounded-t-lg px-3 py-2 flex items-center justify-between border-b border-gray-200">
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
    </div>
  );
};

export default DroppedElement;
