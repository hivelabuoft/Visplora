import React, { useRef, useEffect, useState } from 'react';
import { Visualization } from '../types/visualization';
import vegaEmbed from 'vega-embed';

interface VisualizationCardProps {
  visualization: Visualization;
  onMove: (id: string, x: number, y: number) => void;
}

const VisualizationCard: React.FC<VisualizationCardProps> = ({ visualization, onMove }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const vegaContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Effect to render the Vega-Lite visualization
  useEffect(() => {
    if (vegaContainerRef.current && visualization.spec) {
      vegaEmbed(vegaContainerRef.current, visualization.spec, {
        actions: false,
        renderer: 'svg',
      }).catch(console.error);
    }
  }, [visualization.spec]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && cardRef.current) {
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      cardRef.current.style.left = `${x}px`;
      cardRef.current.style.top = `${y}px`;
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      onMove(visualization.id, x, y);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={cardRef}
      className={`absolute bg-white rounded-lg shadow-lg p-4 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: `${visualization.position.x}px`,
        top: `${visualization.position.y}px`,
        width: `${visualization.size.width}px`,
        height: `${visualization.size.height}px`,
        zIndex: isDragging ? 10 : 1,
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">{visualization.title}</h3>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div 
        ref={vegaContainerRef}
        className="w-full h-[calc(100%-30px)] overflow-hidden"
        onMouseDown={handleMouseDown}
      ></div>
    </div>
  );
};

export default VisualizationCard;
