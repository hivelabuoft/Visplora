'use client';

import React, { useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FiZoomIn, FiZoomOut, FiMaximize2, FiX, FiMove, FiSettings, FiEye, FiEyeOff, FiPlus, FiCheck, FiExternalLink } from 'react-icons/fi';
import styles from './DashboardPlayground.module.css';

interface DashboardPlaygroundProps {
  children: ReactNode;
  isActive: boolean;
  onClose: () => void;
  dashboardTitle?: string;
  dashboardType?: string;
  onAddToCanvas?: () => void;
}

const DashboardPlayground: React.FC<DashboardPlaygroundProps> = ({
  children,
  isActive,
  onClose,
  dashboardTitle = "Dashboard",
  dashboardType = "default",
  onAddToCanvas
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  
  // Convert between slider value (0-100) and actual zoom level (50-200)
  const sliderToZoom = useCallback((sliderValue: number): number => {
    return 50 + (sliderValue / 100) * 150;
  }, []);

  const zoomToSlider = useCallback((zoomValue: number): number => {
    return ((zoomValue - 50) / 150) * 100;
  }, []);

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(event.target.value);
    const zoomValue = sliderToZoom(sliderValue);
    const clampedZoom = Math.max(50, Math.min(200, zoomValue));
    
    if (transformRef.current) {
      transformRef.current.setTransform(
        transformRef.current.state.positionX,
        transformRef.current.state.positionY,
        clampedZoom / 100
      );
    }
    setZoomLevel(clampedZoom);
  }, [sliderToZoom]);

  const handleZoomIn = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.zoomIn(0.2);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.zoomOut(0.2);
    }
  }, [])

  const handleResetView = useCallback(() => {
    if (transformRef.current) {
      // Use resetTransform to go back to initial centered position
      transformRef.current.resetTransform();
      setZoomLevel(100);
    }
  }, []);

  const handleAddToCanvas = useCallback(() => {
    if (onAddToCanvas) {
      onAddToCanvas();
      setIsAdded(true);
    } else {
      // Fallback implementation if onAddToCanvas is not provided
      const dashboardData = {
        id: `dashboard-${dashboardType}-${Date.now()}`,
        title: dashboardTitle,
        type: 'dashboard',
        dashboardType: dashboardType,
        spec: {},
        position: {
          x: Math.random() * 200 + 50,
          y: Math.random() * 200 + 50
        },
        size: {
          width: 1000,
          height: 700
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const existingVisualizations = JSON.parse(localStorage.getItem('canvasVisualizations') || '[]');
      const updatedVisualizations = [...existingVisualizations, dashboardData];
      localStorage.setItem('canvasVisualizations', JSON.stringify(updatedVisualizations));
      setIsAdded(true);
    }
  }, [onAddToCanvas, dashboardType, dashboardTitle]);

  const handleGoToCanvas = useCallback(() => {
    window.open('/', '_blank');
  }, []);

  // Handle escape key to close playground
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isActive) {
        onClose();
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when playground is active
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isActive, onClose]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-2 px-4 flex-col xl:flex-row flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
            <FiMove size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-900">
              Playground Mode - {dashboardTitle} 
            </h3>
          </div>
        </div>

        {/* Controls in Header */}
        <div className="flex justify-center items-center gap-4 flex-wrap">          
          {/* Dashboard Controller */}
          {showControls && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1.5 shadow-xs">
              <button
                onClick={handleAddToCanvas}
                disabled={isAdded}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  isAdded
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isAdded ? (<><FiCheck size={12} />Added</>) : (<><FiPlus size={12} />Add to Canvas</>)}
              </button>

              <button
                onClick={handleGoToCanvas}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <FiExternalLink size={12} />
                View Canvas
              </button>
            </div>
          )}
          
          {/* Zoom Controls in Header */}
          {showControls && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 px-1.5">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded bg-none hover:cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <FiZoomOut size={14} />
              </button>
              
              <input
                type="range"
                min="0"
                max="100"
                value={zoomToSlider(zoomLevel)}
                onChange={handleSliderChange}
                className={`w-24 ${styles.playgroundSlider}`}
              />
              
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded bg-none hover:cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <FiZoomIn size={14} />
              </button>
                <button
                onClick={handleResetView}
                className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:cursor-pointer hover:bg-blue-200 transition-colors text-sm"
              >
                <FiMaximize2 size={12} />
                Reset View
              </button>
            </div>
          )}
          {/* Toggle Controls Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:cursor-pointer text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showControls ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </button>
          
          {/* Exit Playground Button */}
          <button
            onClick={onClose}
            className="flex text-sm items-center gap-2 px-3 py-2 text-gray-600 hover:cursor-pointer hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={16} />
            Exit Playground
          </button>
        </div>
      </div>
      
      {/* Playground Canvas */}
      <div className="flex-1 relative overflow-hidden bg-slate-50">
        <TransformWrapper
          ref={transformRef}
          initialScale={0.8}
          initialPositionX={-1200}
          initialPositionY={-450}
          minScale={0.5}
          maxScale={2}
          centerOnInit={true}
          limitToBounds={false}
          smooth={true}
          wheel={{
            disabled: false,
            step: 0.05,
            smoothStep: 0.01
          }}
          doubleClick={{
            disabled: false,
            step: 0.3
          }}
          onTransformed={(ref) => {
            const newZoom = ref.state.scale * 100;
            setZoomLevel(Math.round(newZoom));
          }}
          onPanning={(ref) => {
            setIsPanning(true);
          }}
          onPanningStop={(ref) => {
            setTimeout(() => setIsPanning(false), 100);
          }}>
          <React.Fragment>
            {/* Dashboard Content */}
            <TransformComponent>
              <div 
                className="relative w-[4800px] h-[2400px]" 
                style={{
                  backgroundImage: 'radial-gradient(circle, #d1d5db 2px, transparent 2px)',
                  backgroundSize: '50px 50px',
                  backgroundPosition: '0 0',
                  transformOrigin: '0 0'
                }}
              >
                {/* Center the dashboard in the grid */}
                <div 
                  className="absolute bg-white rounded-xl shadow-lg overflow-hidden" 
                  style={{ 
                    maxWidth: '1600px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {children}
                </div>
              </div>
            </TransformComponent>
          </React.Fragment>
        </TransformWrapper>
      </div>      
      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-1 px-6">
        <div className="flex items-center justify-between text-sm text-gray-500">   
            <div className="flex items-center gap-4">
            <span>• Drag to pan around the dashboard</span>
            <span>• Scroll or use controls to zoom</span>
            <span>• Use "Reset View" to return to center</span>
            <span>• Press ESC to exit</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${isPanning ? 'bg-green-400 ' + styles.panningIndicator : 'bg-gray-300'}`}></span>
              <span>Interactive Mode {isPanning ? '(Panning)' : ''}</span>
            </div>
            <span>Zoom: {Math.round(zoomLevel)}%</span>
            <span>Grid Scale: 50px per division</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPlayground;
