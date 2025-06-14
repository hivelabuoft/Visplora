'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  occupiedBy?: string;
}

interface InteractiveGridProps {
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  showGrid?: boolean;
  onCellClick?: (cell: GridCell) => void;
  onCellHover?: (cell: GridCell | null) => void;
  occupiedCells?: Set<string>; // Set of "row-col" strings
  dashboardBounds?: { startRow: number; endRow: number; startCol: number; endCol: number };
  isMoving?: boolean; // Disable interactions when moving notes
  isPanning?: boolean; // Disable expensive operations during panning
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({
  canvasWidth,
  canvasHeight,
  cellSize,
  showGrid = true,
  onCellClick,
  onCellHover,
  occupiedCells = new Set(),
  dashboardBounds,
  isMoving = false,
  isPanning = false
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const throttleRef = useRef<number | null>(null);

  // Efficient grid data calculation - avoid expensive operations during panning
  const gridData = useMemo(() => {
    // Don't recalculate during movement or panning to improve performance
    if (isMoving || isPanning) {
      return { rows: 0, cols: 0 };
    }
    
    const cols = Math.floor(canvasWidth / cellSize);
    const rows = Math.floor(canvasHeight / cellSize);
    return { rows, cols };
  }, [canvasWidth, canvasHeight, cellSize, isMoving, isPanning]);  // Handle click using coordinate calculation instead of pre-rendered cells
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMoving || isPanning || !onCellClick) return;
    
    // Use offsetX/offsetY to get coordinates relative to the element itself
    // This should work correctly with the transformed canvas
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    
    // Calculate grid cell position
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    // Ensure we're within grid bounds
    if (col >= 0 && col < gridData.cols && row >= 0 && row < gridData.rows) {
      const cellKey = `${row}-${col}`;
      const isOccupied = occupiedCells.has(cellKey);
      const isDashboard = dashboardBounds ? 
        row >= dashboardBounds.startRow && 
        row <= dashboardBounds.endRow &&
        col >= dashboardBounds.startCol && 
        col <= dashboardBounds.endCol : false;

      // Only allow clicks on unoccupied, non-dashboard cells
      if (!isOccupied && !isDashboard) {
        const cell: GridCell = {
          row,
          col,
          x: col * cellSize,
          y: row * cellSize,
          width: cellSize,
          height: cellSize,
          isOccupied: false,
          occupiedBy: undefined
        };
        
        console.log('Grid click:', { 
          mouseX: x, 
          mouseY: y, 
          col, 
          row, 
          cellX: cell.x, 
          cellY: cell.y,
          cellSize,
          canvasWidth,
          canvasHeight
        });
        
        onCellClick(cell);
      }
    }
  }, [cellSize, gridData.cols, gridData.rows, occupiedCells, dashboardBounds, onCellClick, isMoving, isPanning]);
  // Handle hover using coordinate calculation with throttling for performance
  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMoving || isPanning || !onCellHover) return;
    
    // Throttle mouse move events to improve performance during rapid movement
    if (throttleRef.current) {
      return;
    }
      throttleRef.current = window.requestAnimationFrame(() => {
      // Use offsetX/offsetY for consistent coordinate calculation
      const x = e.nativeEvent.offsetX;
      const y = e.nativeEvent.offsetY;
      
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      
      if (col >= 0 && col < gridData.cols && row >= 0 && row < gridData.rows) {
        const cellKey = `${row}-${col}`;
        if (hoveredCell !== cellKey) {
          const isOccupied = occupiedCells.has(cellKey);
          const isDashboard = dashboardBounds ? 
            row >= dashboardBounds.startRow && 
            row <= dashboardBounds.endRow &&
            col >= dashboardBounds.startCol && 
            col <= dashboardBounds.endCol : false;

          if (!isOccupied && !isDashboard) {
            const cell: GridCell = {
              row,
              col,
              x: col * cellSize,
              y: row * cellSize,
              width: cellSize,
              height: cellSize,
              isOccupied: false,
              occupiedBy: undefined
            };
            setHoveredCell(cellKey);
            onCellHover(cell);
          } else {
            // Clear hover if over occupied/dashboard area
            if (hoveredCell) {
              setHoveredCell(null);
              onCellHover(null);
            }
          }
        }
      } else {
        // Clear hover if outside grid bounds
        if (hoveredCell) {
          setHoveredCell(null);
          onCellHover(null);
        }
      }
      
      throttleRef.current = null;
    });
  }, [cellSize, gridData.cols, gridData.rows, occupiedCells, dashboardBounds, onCellHover, hoveredCell, isMoving, isPanning]);
  const handleContainerMouseLeave = useCallback(() => {
    if (isMoving || isPanning) return;
    
    // Cancel any pending throttled updates
    if (throttleRef.current) {
      cancelAnimationFrame(throttleRef.current);
      throttleRef.current = null;
    }
    
    setHoveredCell(null);
    onCellHover?.(null);  }, [onCellHover, isMoving, isPanning]);

  // Cleanup throttled animations on unmount
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        cancelAnimationFrame(throttleRef.current);
      }
    };
  }, []);
  
  if (!showGrid) 
    return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ 
        width: canvasWidth, 
        height: canvasHeight,
        cursor: (isMoving || isPanning) ? 'default' : 'crosshair',
        // Disable mouse events completely during panning for performance
        pointerEvents: isPanning ? 'none' : 'auto'
      }}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      onClick={handleContainerClick}
    />
  );
};

export default InteractiveGrid;
