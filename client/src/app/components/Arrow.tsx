import React from 'react';

interface ArrowProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromDashboardId: string;
  toDashboardId: string;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const Arrow: React.FC<ArrowProps> = ({
  id,
  from,
  to,
  fromDashboardId,
  toDashboardId,
  onDelete,
  isSelected = false,
  onSelect
}) => {
  // Calculate arrow path
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction vector
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Arrowhead size
  const arrowSize = 12;
  
  // Calculate arrowhead points
  const arrowX1 = to.x - arrowSize * unitX - arrowSize * 0.5 * unitY;
  const arrowY1 = to.y - arrowSize * unitY + arrowSize * 0.5 * unitX;
  const arrowX2 = to.x - arrowSize * unitX + arrowSize * 0.5 * unitY;
  const arrowY2 = to.y - arrowSize * unitY - arrowSize * 0.5 * unitX;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Main arrow line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isSelected ? '#3b82f6' : '#64748b'}
        strokeWidth={isSelected ? 3 : 2}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Arrowhead */}
      <polygon
        points={`${to.x},${to.y} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={isSelected ? '#3b82f6' : '#64748b'}
      />
      
      {/* Delete button (visible when selected) */}
      {isSelected && (
        <g>
          <circle
            cx={(from.x + to.x) / 2}
            cy={(from.y + to.y) / 2 - 15}
            r="10"
            fill="white"
            stroke="#ef4444"
            strokeWidth="2"
          />
          <text
            x={(from.x + to.x) / 2}
            y={(from.y + to.y) / 2 - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#ef4444"
            style={{ cursor: 'pointer' }}
            onClick={handleDelete}
          >
            ×
          </text>
        </g>
      )}
      
      {/* Connection info tooltip */}
      {isSelected && (
        <g>
          <rect
            x={(from.x + to.x) / 2 - 40}
            y={(from.y + to.y) / 2 + 10}
            width="80"
            height="20"
            fill="black"
            fillOpacity="0.8"
            rx="4"
          />
          <text
            x={(from.x + to.x) / 2}
            y={(from.y + to.y) / 2 + 23}
            textAnchor="middle"
            fontSize="10"
            fill="white"
          >
            {fromDashboardId} → {toDashboardId}
          </text>
        </g>
      )}
    </g>
  );
};

export default Arrow;