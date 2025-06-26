'use client';

import { useState, useCallback } from 'react';
import { DroppedElement, ElementDragData } from '../../../components/context/DashboardPlaygroundContext';
import { CELL_SIZE } from '../playgroundComponents/DashboardPlaygroundUtils';

export const useElementDragging = (
  getDashboardGridInfo: () => any,
  droppedElements: DroppedElement[],
  setDroppedElements: React.Dispatch<React.SetStateAction<DroppedElement[]>>,
  setConnectionFeedback: (feedback: string | null) => void
) => {
  const [isElementDragging, setIsElementDragging] = useState(false);
  const [elementDragData, setElementDragData] = useState<ElementDragData | null>(null);
  const [elementDragPosition, setElementDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDroppedElementMoving, setIsDroppedElementMoving] = useState(false);

  const handleElementDragStart = useCallback((
    elementId: string,
    elementName: string, 
    elementType: string,
    x: number,
    y: number
  ) => {
    setIsElementDragging(true);
    setElementDragData({ elementId, elementName, elementType, startX: x, startY: y });
    setElementDragPosition({ x, y });
  }, []);

  const handleElementDragMove = useCallback((e: MouseEvent) => {
    if (!isElementDragging || !elementDragData) return;
    
    // Use viewport coordinates for the preview position
    const viewportX = e.clientX;
    const viewportY = e.clientY;
    
    setElementDragPosition({ x: viewportX, y: viewportY });
  }, [isElementDragging, elementDragData]);

  const handleElementDragEnd = useCallback((e: MouseEvent) => {
    if (!isElementDragging || !elementDragData) {
      setIsElementDragging(false);
      setElementDragData(null);
      setElementDragPosition(null);
      return;
    }

    // Always place elements near the dashboard (to the right side)
    const dashboardInfo = getDashboardGridInfo();
    const elementWidth = 80; // Grid cells wide
    const elementHeight = 80; // Grid cells high
    
    // Calculate position to the right of the dashboard with some spacing
    const spacing = 20; // Grid cells spacing from dashboard
    const col = dashboardInfo.bounds.endCol + spacing;
    const row = dashboardInfo.bounds.startRow + (droppedElements.length * (elementHeight + 10)); // Stack vertically
    
    const gridX = col * CELL_SIZE;
    const gridY = row * CELL_SIZE;
    
    const newElement: DroppedElement = {
      id: `dropped-${elementDragData.elementId}-${Date.now()}`,
      elementId: elementDragData.elementId,
      elementName: elementDragData.elementName,
      elementType: elementDragData.elementType,
      position: { x: gridX, y: gridY },
      gridPosition: { row, col },
      size: { width: elementWidth, height: elementHeight }
    };
    
    setDroppedElements(prev => [...prev, newElement]);
    setConnectionFeedback(`✓ ${elementDragData.elementName} copied to playground`);
    setTimeout(() => setConnectionFeedback(null), 3000);

    setIsElementDragging(false);
    setElementDragData(null);
    setElementDragPosition(null);
  }, [isElementDragging, elementDragData, CELL_SIZE, getDashboardGridInfo, droppedElements.length, setDroppedElements, setConnectionFeedback]);

  const handleDroppedElementMove = useCallback((
    elementId: string,
    newPosition: { x: number; y: number },
    newGridPosition: { row: number; col: number }
  ) => {
    setDroppedElements(prev => prev.map(element => 
      element.id === elementId 
        ? { ...element, position: newPosition, gridPosition: newGridPosition }
        : element
    ));
    setIsDroppedElementMoving(false);
  }, [setDroppedElements]);

  const handleDroppedElementMoveStart = useCallback(() => {
    setIsDroppedElementMoving(true);
  }, []);

  const handleDroppedElementMoveEnd = useCallback(() => {
    setIsDroppedElementMoving(false);
  }, []);

  return {
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
  };
};
