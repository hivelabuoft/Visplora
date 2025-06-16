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
  className?: string;
}

export const ConnectionNodes: React.FC<ConnectionNodesProps> = ({
  elementId,
  isVisible = false,
  isLinked = false,
  onNodeClick,
  className = ''
}) => {
  const handleNodeClick = (position: 'top' | 'right' | 'bottom' | 'left') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Connection node clicked: ${position} on element ${elementId}`);
    if (onNodeClick) {
      onNodeClick(elementId, position);
    }
  };

  const getNodeStyle = (position: 'top' | 'right' | 'bottom' | 'left') => {
    const baseStyle = {
      position: 'absolute' as const,
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      border: '1px solid white',
      cursor: 'crosshair',
      zIndex: 60,
      transition: 'all 0.2s ease',
      opacity: isVisible ? 1 : 0,
    } as React.CSSProperties;

    const positionStyles = {
      top: {
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      right: {
        right: '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
      bottom: {
        bottom: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      left: {
        left: '-4px',
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
    const baseClass = 'connection-node transition-colors hover:bg-blue-500';
    const colorClass = isLinked ? 'bg-purple-600' : 'bg-gray-400';
    return `${baseClass} ${colorClass}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Top Node */}
      <div
        style={getNodeStyle('top')}
        className={getNodeClass('top')}
        onClick={handleNodeClick('top')}
        title={`Connect from top of ${elementId}`}
        data-connection-node="top"
        data-element-id={elementId}
      />
      
      {/* Right Node */}
      <div
        style={getNodeStyle('right')}
        className={getNodeClass('right')}
        onClick={handleNodeClick('right')}
        title={`Connect from right of ${elementId}`}
        data-connection-node="right"
        data-element-id={elementId}
      />
      
      {/* Bottom Node */}
      <div
        style={getNodeStyle('bottom')}
        className={getNodeClass('bottom')}
        onClick={handleNodeClick('bottom')}
        title={`Connect from bottom of ${elementId}`}
        data-connection-node="bottom"
        data-element-id={elementId}
      />
      
      {/* Left Node */}
      <div
        style={getNodeStyle('left')}
        className={getNodeClass('left')}
        onClick={handleNodeClick('left')}
        title={`Connect from left of ${elementId}`}
        data-connection-node="left"
        data-element-id={elementId}
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
