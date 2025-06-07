'use client';

import React, { useState, useMemo } from 'react';

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
}

const InteractiveGrid: React.FC<InteractiveGridProps> = ({
  canvasWidth,
  canvasHeight,
  cellSize,
  showGrid = true,
  onCellClick,
  onCellHover,
  occupiedCells = new Set(),
  dashboardBounds
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const gridData = useMemo(() => {
    const cols = Math.floor(canvasWidth / cellSize);
    const rows = Math.floor(canvasHeight / cellSize);
    const cells: GridCell[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellKey = `${row}-${col}`;
        const isOccupied = occupiedCells.has(cellKey);
          // Check if this cell is part of the dashboard
        const isDashboard = dashboardBounds ? 
          row >= dashboardBounds.startRow && 
          row <= dashboardBounds.endRow &&
          col >= dashboardBounds.startCol && 
          col <= dashboardBounds.endCol : false;

        cells.push({
          row,
          col,
          x: col * cellSize,
          y: row * cellSize,
          width: cellSize,
          height: cellSize,
          isOccupied: isOccupied || isDashboard,
          occupiedBy: isDashboard ? 'dashboard' : (isOccupied ? 'sticky-note' : undefined)
        });
      }
    }
    return { cells, rows, cols };
  }, [canvasWidth, canvasHeight, cellSize, occupiedCells, dashboardBounds]);

  const handleCellMouseEnter = (cell: GridCell) => {
    const cellKey = `${cell.row}-${cell.col}`;
    setHoveredCell(cellKey);
    onCellHover?.(cell);
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
    onCellHover?.(null);
  };

  const handleCellClick = (cell: GridCell) => {
    onCellClick?.(cell);
  };

  const getCellStyle = (cell: GridCell): React.CSSProperties => {
    const cellKey = `${cell.row}-${cell.col}`;
    const isHovered = hoveredCell === cellKey;
    
    let backgroundColor = 'transparent';
    let borderColor = 'rgba(59, 130, 246, 0.2)';
    
    if (cell.occupiedBy === 'dashboard') {
      backgroundColor = isHovered ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)';
      borderColor = 'rgba(59, 130, 246, 0.3)';
    } else if (cell.isOccupied) {
      backgroundColor = isHovered ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
      borderColor = 'rgba(239, 68, 68, 0.3)';
    } else if (isHovered) {
      backgroundColor = 'rgba(34, 197, 94, 0.1)';
      borderColor = 'rgba(34, 197, 94, 0.4)';
    }

    return {
      position: 'absolute',
      left: cell.x,
      top: cell.y,
      width: cell.width,
      height: cell.height,
      backgroundColor,
      border: `1px solid ${borderColor}`,
      cursor: cell.isOccupied ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      pointerEvents: 'auto',
      zIndex: isHovered ? 15 : 10
    };
  };

  if (!showGrid) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight }}
    >
      {/* Grid cells */}
      {gridData.cells.map((cell) => {
        const cellKey = `${cell.row}-${cell.col}`;
        return (
          <div
            key={cellKey}
            style={getCellStyle(cell)}
            onMouseEnter={() => handleCellMouseEnter(cell)}
            onMouseLeave={handleCellMouseLeave}
            onClick={() => handleCellClick(cell)}
            title={`Cell (R: ${cell.row}, C: ${cell.col}) - ${cell.isOccupied ? `Occupied by ${cell.occupiedBy}` : 'Available'}`}
          />
        );
      })}
      
      {/* Grid info overlay */}
      {hoveredCell && (
        <div className="absolute -top-16 left-560 bg-black bg-opacity-75 text-white px-5 py-3 rounded-lg text-xl pointer-events-none z-20">
          Cell: {hoveredCell} | Size: {cellSize}px | {gridData.cells.find(c => `${c.row}-${c.col}` === hoveredCell)?.isOccupied ? 'Occupied' : 'Available'}
        </div>
      )}
    </div>
  );
};

export default InteractiveGrid;
