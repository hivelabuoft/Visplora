import React, { useState, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import VisualizationCard from './VisualizationCard';
import { Visualization } from '../types/visualization';

interface CanvasProps {
  visualizations: Visualization[];
  onVisualizationMove: (id: string, x: number, y: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({ visualizations, onVisualizationMove }) => {
  const [zoomLevel, setZoomLevel] = useState(100); // 100%
  
  // Updated to provide consistent zoom steps and update the slider
  // Convert between slider value (0-100) and actual zoom level (1-500)
  const sliderToZoom = useCallback((sliderValue: number): number => {
    // Non-linear mapping: 
    // - First 80% of slider (0-80) maps to zoom 1-100
    // - Last 20% of slider (80-100) maps to zoom 100-500
    if (sliderValue <= 80) {
      // Linear mapping from 0-80 to 1-100
      return 1 + (sliderValue / 80) * 99;
    } else {
      // Linear mapping from 80-100 to 100-500
      return 100 + ((sliderValue - 80) / 20) * 400;
    }
  }, []);

  const zoomToSlider = useCallback((zoomValue: number): number => {
    // Inverse mapping of sliderToZoom
    if (zoomValue <= 100) {
      // Linear mapping from 1-100 to 0-80
      return ((zoomValue - 1) / 99) * 80;
    } else {
      // Linear mapping from 100-500 to 80-100
      return 80 + ((zoomValue - 100) / 400) * 20;
    }
  }, []);

  const handleZoomChange = useCallback((newZoom: number, setTransformValue: any) => {
    // Ensure zoom is within valid range
    const clampedZoom = Math.max(1, Math.min(500, newZoom));
    setZoomLevel(clampedZoom);
    // Apply zoom transformation
    setTransformValue(0, 0, clampedZoom / 100);
  }, []);
  
  const handleSave = useCallback(() => {
    // Implement save functionality here
    console.log('Saving canvas state...');
    // You could trigger a save action to your backend or state management
  }, []);

  return (
    <div className="w-full h-full overflow-hidden bg-slate-50 rounded-lg">
      <TransformWrapper
        initialScale={1}
        minScale={0.01} // 1%
        maxScale={5} // 500%
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        onZoom={({ state }) => {
          setZoomLevel(Math.round(state.scale * 100));
        }}
      >
        {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
          <React.Fragment>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10 bg-white p-2 rounded-lg shadow-lg">
              <button 
                onClick={() => {
                  // Update zoom level first, then apply zoom out
                  const newZoom = Math.max(1, zoomLevel - 10);
                  handleZoomChange(newZoom, setTransform);
                }}
                className="bg-white p-2 rounded-full shadow hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={zoomToSlider(zoomLevel)}
                  onChange={(e) => {
                    const sliderValue = parseFloat(e.target.value);
                    const newZoom = Math.round(sliderToZoom(sliderValue));
                    handleZoomChange(newZoom, setTransform);
                  }}
                  className="w-96"
                />
                <span className="text-xs font-medium">{zoomLevel}%</span>
              </div>
              
              <button 
                onClick={() => {
                  // Update zoom level first, then apply zoom in
                  const newZoom = Math.min(500, zoomLevel + 10);
                  handleZoomChange(newZoom, setTransform);
                }}
                className="bg-white p-2 rounded-full shadow hover:bg-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  resetTransform();
                  setZoomLevel(100);
                }}
                className="bg-white p-2 rounded-full shadow hover:bg-slate-50 ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              </button>
            </div>
            <TransformComponent>
              <div className="relative w-[5000px] h-[5000px]" 
                  style={{
                    backgroundImage: 'radial-gradient(circle, #d1d5db 2px, transparent 2px)',
                    backgroundSize: '50px 50px',
                    backgroundPosition: '0 0',
                    transformOrigin: '0 0'
                  }}>
                {visualizations.map((vis) => (
                  <VisualizationCard 
                    key={vis.id}
                    visualization={vis}
                    onMove={onVisualizationMove}
                  />
                ))}
              </div>
            </TransformComponent>
          </React.Fragment>
        )}
      </TransformWrapper>
    </div>
  );
};

export default Canvas;
