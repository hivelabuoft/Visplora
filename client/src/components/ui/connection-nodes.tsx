'use client';

import React from 'react';

export interface ConnectionNodePosition {
  position: 'top' | 'right' | 'bottom' | 'left';
  x: number;
  y: number;
}

interface ConnectionNodesProps {
  elementId: string;
  isVisible?: boolean;
  isLinked?: boolean;
  onNodeClick?: (elementId: string, position: 'top' | 'right' | 'bottom' | 'left') => void;
  onDragStart?: (
    elementId: string, 
    type: 'element' | 'note', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => void;
  className?: string;
  isNote?: boolean; // Flag to indicate if this is for a note instead of an element
  isDragTarget?: boolean; // Whether this node is a valid drop target during drag
  isDragging?: boolean; // Whether a drag operation is currently active
}

export const ConnectionNodes: React.FC<ConnectionNodesProps> = ({
  elementId,
  isVisible = false,
  isLinked = false,
  onNodeClick,
  onDragStart,
  className = '',
  isNote = false,
  isDragTarget = false,
  isDragging = false
}) => {const handleNodeClick = (position: 'top' | 'right' | 'bottom' | 'left') => (e: React.MouseEvent) => {
    // Only handle click if there's no drag functionality
    if (!onDragStart && onNodeClick) {
      e.preventDefault();
      e.stopPropagation();
      onNodeClick(elementId, position);
    }
  };
  const handleMouseDown = (position: 'top' | 'right' | 'bottom' | 'left') => (e: React.MouseEvent) => {
    if (!onDragStart) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Get the position of the connection node
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const canvasRect = document.querySelector('[data-dashboard-container]')?.getBoundingClientRect();
    
    if (canvasRect) {
      const x = rect.left + rect.width / 2 - canvasRect.left;
      const y = rect.top + rect.height / 2 - canvasRect.top;
      
      onDragStart(elementId, isNote ? 'note' : 'element', position, x, y);
    }
  };// Show nodes during drag even if not normally visible (for drop targets)
  const shouldShow = isVisible || (isDragging && isDragTarget);

  const getNodeStyle = (position: 'top' | 'right' | 'bottom' | 'left') => {
    const baseStyle = {
      position: 'absolute' as const,
      width: isDragTarget ? '10px' : '8px',
      height: isDragTarget ? '10px' : '8px',
      borderRadius: '50%',
      border: isDragTarget ? '2px solid white' : '1px solid white',
      cursor: 'crosshair',
      zIndex: 60,
      transition: 'all 0.2s ease',
      opacity: shouldShow ? 1 : 0,
    } as React.CSSProperties;

    const positionStyles = {
      top: {
        top: isDragTarget ? '-6px' : '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      right: {
        right: isDragTarget ? '-6px' : '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
      bottom: {
        bottom: isDragTarget ? '-6px' : '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      left: {
        left: isDragTarget ? '-6px' : '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
    };

    return {
      ...baseStyle,
      ...positionStyles[position],
    };
  };

  const getNodeClass = (position: 'top' | 'right' | 'bottom' | 'left') => {
    const baseClass = 'connection-node transition-all duration-200';
    
    let colorClass = '';
    if (isDragging && isDragTarget) {
      // Valid drop target during drag
      colorClass = 'bg-green-400 hover:bg-green-500 ring-2 hover:ring-4 ring-green-300 hover:ring-green-500';
    } else if (isDragging) {
      // Not a valid drop target during drag
      colorClass = 'bg-gray-300 opacity-50';
    } else if (isLinked) {
      // Node is linked
      colorClass = 'bg-purple-600 hover:bg-purple-700';
    } else {
      // Normal state
      colorClass = 'bg-gray-400 hover:bg-blue-500';
    }
    
    return `${baseClass} ${colorClass}`;
  };
  if (!isVisible && !isDragging) {
    return null;
  }

  return (
    <>
      {/* Top Node */}
      <div
        style={getNodeStyle('top')}
        className={getNodeClass('top')}
        onClick={handleNodeClick('top')}
        onMouseDown={handleMouseDown('top')}
        title={`Connect from top of ${elementId}`}
        data-connection-node="top"
        data-element-id={elementId}
        data-note-id={isNote ? elementId : undefined}
      />
      
      {/* Right Node */}
      <div
        style={getNodeStyle('right')}
        className={getNodeClass('right')}
        onClick={handleNodeClick('right')}
        onMouseDown={handleMouseDown('right')}
        title={`Connect from right of ${elementId}`}
        data-connection-node="right"
        data-element-id={elementId}
        data-note-id={isNote ? elementId : undefined}
      />
      
      {/* Bottom Node */}
      <div
        style={getNodeStyle('bottom')}
        className={getNodeClass('bottom')}
        onClick={handleNodeClick('bottom')}
        onMouseDown={handleMouseDown('bottom')}
        title={`Connect from bottom of ${elementId}`}
        data-connection-node="bottom"
        data-element-id={elementId}
        data-note-id={isNote ? elementId : undefined}
      />
      
      {/* Left Node */}
      <div
        style={getNodeStyle('left')}
        className={getNodeClass('left')}
        onClick={handleNodeClick('left')}
        onMouseDown={handleMouseDown('left')}
        title={`Connect from left of ${elementId}`}
        data-connection-node="left"
        data-element-id={elementId}
        data-note-id={isNote ? elementId : undefined}
      />
    </>
  );
};

// Helper function to get connection node positions for a given element
export const getConnectionNodePositions = (
  elementBounds: { x: number; y: number; width: number; height: number }
): Record<'top' | 'right' | 'bottom' | 'left', ConnectionNodePosition> => {
  return {
    top: {
      position: 'top',
      x: elementBounds.x + elementBounds.width / 2,
      y: elementBounds.y - 6,
    },
    right: {
      position: 'right',
      x: elementBounds.x + elementBounds.width + 6,
      y: elementBounds.y + elementBounds.height / 2,
    },
    bottom: {
      position: 'bottom',
      x: elementBounds.x + elementBounds.width / 2,
      y: elementBounds.y + elementBounds.height + 6,
    },
    left: {
      position: 'left',
      x: elementBounds.x - 6,
      y: elementBounds.y + elementBounds.height / 2,
    },
  };
};

export default ConnectionNodes;
