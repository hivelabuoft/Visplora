// Grid and dashboard utility functions

export const CELL_SIZE = 5;
export const DASHBOARD_WIDTH = 1600; // Fixed dashboard width

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

// Calculate all occupied cells (dashboard + sticky notes + dropped elements)
export const getAllOccupiedCells = (
  canvasHeight: number,
  canvasWidth: number,
  stickyNotes: any[],
  droppedElements: any[],
  isMoving: boolean,
  selectedNoteId: string | null,
  dashboardRef?: React.RefObject<HTMLDivElement | null>
): Set<string> => {
  const allOccupied = new Set<string>();
  
  // Add dashboard cells
  const dashboardInfo = getDashboardGridInfo(canvasWidth, canvasHeight, dashboardRef);
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

  // Add dropped element cells
  droppedElements.forEach(element => {
    for (let r = element.gridPosition.row; r < element.gridPosition.row + element.size.height; r++) {
      for (let c = element.gridPosition.col; c < element.gridPosition.col + element.size.width; c++) {
        allOccupied.add(`${r}-${c}`);
      }
    }
  });    
  
  return allOccupied;
};
