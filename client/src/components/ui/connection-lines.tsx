'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { StickyNoteData } from './sticky-note';
import { getConnectionNodePositions, ConnectionNodePosition } from './connection-nodes';

interface ConnectionLinesProps {
  stickyNotes: StickyNoteData[];
  cellSize: number;
  dashboardPosition: { x: number; y: number };
  dashboardWidth: number;
  hoveredElementId?: string | null;
}

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  stickyNotes,
  cellSize,
  dashboardPosition,
  dashboardWidth,
  hoveredElementId
}) => {
  const [elementPositions, setElementPositions] = useState<Map<string, ElementPosition>>(new Map());
  
  // Function to get element positions from the DOM
  const updateElementPositions = useCallback(() => {
    const positions = new Map<string, ElementPosition>();    
    // Find all elements with data-element-id attribute within the dashboard
    const dashboardContainer = document.querySelector('[data-dashboard-container]');
    if (!dashboardContainer) {
      return;
    }    
    const elements = dashboardContainer.querySelectorAll('[data-element-id]');
    elements.forEach((element) => {
      const elementId = element.getAttribute('data-element-id');
      if (elementId) {
        // Use offsetLeft and offsetTop for more accurate positioning within the canvas
        const htmlElement = element as HTMLElement;        
        // Get position relative to the dashboard container
        let offsetX = htmlElement.offsetLeft;
        let offsetY = htmlElement.offsetTop;        
        // Walk up the offset parent chain until we reach the dashboard container
        let offsetParent = htmlElement.offsetParent as HTMLElement;
        while (offsetParent && offsetParent !== dashboardContainer) {
          offsetX += offsetParent.offsetLeft;
          offsetY += offsetParent.offsetTop;
          offsetParent = offsetParent.offsetParent as HTMLElement;
        }        
        positions.set(elementId, {
          x: offsetX,
          y: offsetY,
          width: htmlElement.offsetWidth,
          height: htmlElement.offsetHeight
        });
      }
    });   
    setElementPositions(positions);
  }, []);
  
  // Update element positions when component mounts and when notes change
  useEffect(() => {
    // Initial update
    const initialUpdate = () => {
      updateElementPositions();
    };    
    // Delay initial update to ensure DOM is ready
    setTimeout(initialUpdate, 100);
    // Set up a mutation observer to watch for DOM changes
    const observer = new MutationObserver(() => {
      updateElementPositions();
    });    
    // Also set up an interval to periodically update positions (in case of transform changes)
    const interval = setInterval(updateElementPositions, 1000);
    // Observe changes to the dashboard area
    const dashboardElement = document.querySelector('[data-dashboard-container]');
    if (dashboardElement) {
      observer.observe(dashboardElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }    
    // Also update on resize
    const handleResize = () => {
      updateElementPositions();
    };    
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateElementPositions]);
  
  // Trigger position update when sticky notes change
  useEffect(() => {
    updateElementPositions();
  }, [stickyNotes, updateElementPositions]);

  // Filter notes that are linked to elements
  const linkedNotes = stickyNotes.filter(note => note.isLinked && note.linkedElementId);

  // Function to get edge-based connection positions (directly on element/note edges)
  const getEdgeConnectionPositions = (
    bounds: { x: number; y: number; width: number; height: number }
  ): Record<'top' | 'right' | 'bottom' | 'left', ConnectionNodePosition> => {
    return {
      top: {
        position: 'top',
        x: bounds.x + bounds.width / 2,
        y: bounds.y, // Directly on the top edge
      },
      right: {
        position: 'right',
        x: bounds.x + bounds.width, // Directly on the right edge
        y: bounds.y + bounds.height / 2,
      },
      bottom: {
        position: 'bottom',
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height, // Directly on the bottom edge
      },
      left: {
        position: 'left',
        x: bounds.x, // Directly on the left edge
        y: bounds.y + bounds.height / 2,
      },
    };
  };

  // Function to calculate connection points between note and element connection nodes
  const getConnectionPoints = (note: StickyNoteData, elementPos: ElementPosition) => {
    // Note bounds in canvas coordinates
    const noteBounds = {
      x: note.x,
      y: note.y,
      width: note.width * cellSize,
      height: note.height * cellSize
    };
    // Element bounds in canvas coordinates (add dashboard position)
    const elementBounds = {
      x: dashboardPosition.x + elementPos.x,
      y: dashboardPosition.y + elementPos.y,
      width: elementPos.width,
      height: elementPos.height
    };
    // Get edge-based connection positions (directly on edges, no offset)
    const noteNodes = getEdgeConnectionPositions(noteBounds);
    const elementNodes = getEdgeConnectionPositions(elementBounds);

    noteNodes.top.y += 5; // Adjust for note header height
    noteNodes.bottom.y -= 5; // Adjust for note footer height
    noteNodes.left.x += 5; // Adjust for note left padding
    noteNodes.right.x -= 5; // Adjust for note right padding
    
    // Find the closest pair of connection nodes
    let shortestDistance = Infinity;
    let bestNoteNode: ConnectionNodePosition | null = null;
    let bestElementNode: ConnectionNodePosition | null = null;
    
    // Check all combinations of note nodes vs element nodes
    Object.values(noteNodes).forEach(noteNode => {
      Object.values(elementNodes).forEach(elementNode => {
        const dx = elementNode.x - noteNode.x;
        const dy = elementNode.y - noteNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestNoteNode = noteNode;
          bestElementNode = elementNode;
        }
      });
    });
    
    if (!bestNoteNode || !bestElementNode) {
      // Fallback to center points
      return {
        note: { x: noteBounds.x + noteBounds.width / 2, y: noteBounds.y + noteBounds.height / 2 },
        element: { x: elementBounds.x + elementBounds.width / 2, y: elementBounds.y + elementBounds.height / 2 },
        noteConnectionPosition: 'center' as const,
        elementConnectionPosition: 'center' as const
      };
    }
      // Use type assertion to help TypeScript understand the types
    const noteNode = bestNoteNode as ConnectionNodePosition;
    const elementNode = bestElementNode as ConnectionNodePosition;
    
    return {
      note: { x: noteNode.x, y: noteNode.y },
      element: { x: elementNode.x, y: elementNode.y },
      noteConnectionPosition: noteNode.position,
      elementConnectionPosition: elementNode.position
    };
  };  // Function to create a smooth curved path directly between two nodes
  const createCurvedPath = (
    from: { x: number; y: number }, 
    to: { x: number; y: number }, 
    fromConnectionPosition?: string,
    toConnectionPosition?: string
  ) => {
    // Calculate the direct distance and direction
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create smooth control points based on the connection positions
    let cp1x, cp1y, cp2x, cp2y;
    
    // Control point distance based on total distance for natural curves
    const controlDistance = Math.min(distance * 0.4, 100);
    
    // Calculate control points based on the node positions
    switch (fromConnectionPosition) {
      case 'top':
        cp1x = from.x;
        cp1y = from.y - controlDistance;
        break;
      case 'bottom':
        cp1x = from.x;
        cp1y = from.y + controlDistance;
        break;
      case 'left':
        cp1x = from.x - controlDistance;
        cp1y = from.y;
        break;
      case 'right':
        cp1x = from.x + controlDistance;
        cp1y = from.y;
        break;
      default:
        cp1x = from.x + dx * 0.3;
        cp1y = from.y;
    }
    
    switch (toConnectionPosition) {
      case 'top':
        cp2x = to.x;
        cp2y = to.y - controlDistance;
        break;
      case 'bottom':
        cp2x = to.x;
        cp2y = to.y + controlDistance;
        break;
      case 'left':
        cp2x = to.x - controlDistance;
        cp2y = to.y;
        break;
      case 'right':
        cp2x = to.x + controlDistance;
        cp2y = to.y;
        break;
      default:
        cp2x = to.x - dx * 0.3;
        cp2y = to.y;
    }
    
    // Create a smooth cubic bezier curve directly from node to node
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ 
        width: '100%', 
        height: '100%',
        zIndex: 1, // Below notes but above dashboard
        overflow: 'visible'
      }}    >
      <defs>
        {/* Glow filter for the lines */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {linkedNotes.map((note) => {
        if (!note.linkedElementId) return null;
          const elementPosition = elementPositions.get(note.linkedElementId);
        if (!elementPosition) {
          return null;
        }        
        const { note: notePos, element: elementPoint, noteConnectionPosition, elementConnectionPosition } = getConnectionPoints(note, elementPosition);
        const pathData = createCurvedPath(notePos, elementPoint, noteConnectionPosition, elementConnectionPosition);
        
        // Check if either the note or element is hovered for glow effect
        // Note: we'll need to add hover tracking for notes in the future
        const shouldGlow = note.isSelected || (hoveredElementId === note.linkedElementId);
        
        return (
          <g key={`connection-${note.id}`}>
            {/* Glow effect line - only show when selected */}
            {shouldGlow && (
              <path
                d={pathData}
                stroke="rgba(155, 4, 230, 0.2)"
                strokeWidth="5"
                fill="none"
                filter="url(#glow)"
              />
            )}
            
            {/* Main line - simple dark purple */}
            <path
              d={pathData}
              stroke={shouldGlow ? "rgba(155, 4, 230, 0.8)" : "#000"}
              strokeWidth="2"
              fill="none"
              opacity={shouldGlow ? 1 : 0.7}
            />
            
            {/* Connection point on note */}
            <circle
              cx={notePos.x}
              cy={notePos.y}
              r="4"
              fill="rgba(155, 4, 230, 0.9)"
              stroke="white"
              strokeWidth="1"
            />

            {/* Connection point on element */}
            <circle
              cx={elementPoint.x}
              cy={elementPoint.y}
              r="4"
              fill="rgba(155, 4, 230, 0.9)"
              stroke="white"
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;
