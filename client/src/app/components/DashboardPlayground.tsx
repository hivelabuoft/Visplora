'use client';

import React, { useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FiZoomIn, FiZoomOut, FiMaximize2, FiX, FiMove, FiPlus, FiCheck, FiExternalLink } from 'react-icons/fi';
import styles from './DashboardPlayground.module.css';
import { FilePenLine } from 'lucide-react';
import { scale } from 'vega';

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
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(3000);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const currentPositionRef = useRef({ x: -1200, y: -450 });
  
  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(event.target.value);
    if (transformRef.current) {
        console.log(currentPositionRef.current.x, currentPositionRef.current.y, sliderValue / 100);
        transformRef.current.setTransform(
        currentPositionRef.current.x,
        currentPositionRef.current.y,
        sliderValue / 100,
        0,
        "easeInCubic"
        );
    }
    setZoomLevel(sliderValue);
  }, []);

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
      transformRef.current.resetTransform();
    }
  }, []);

  const handleAddToCanvas = useCallback(() => {
    if (onAddToCanvas) {
      onAddToCanvas();
      setIsAdded(true);
    } else {
      setIsAdded(true);
    }
  }, [onAddToCanvas, dashboardType, dashboardTitle]);

  const handleGoToCanvas = useCallback(() => {
    window.location.href = '/';
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

  // Reset transform when playground becomes active and measure dashboard height
  useEffect(() => {
    if (isActive && transformRef.current) {
      // Measure the dashboard height when playground becomes active
      if (dashboardRef.current) {
        const dashboardHeight = dashboardRef.current.scrollHeight;
        const calculatedCanvasHeight = dashboardHeight * 3;
        if (calculatedCanvasHeight > 2800) {
          setCanvasHeight(calculatedCanvasHeight + 500);
        }
      }      
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        if (transformRef.current) {
          transformRef.current.resetTransform();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

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
          {/* Zoom Controls in Header */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 px-1.5">
            <button onClick={handleZoomOut} className="p-1.5 rounded bg-none hover:cursor-pointer hover:bg-gray-200 transition-colors">
                <FiZoomOut size={16}/>
            </button>
            <input type="range" min="25" max="200" value={zoomLevel} onChange={handleSliderChange} className={`w-24 hover:w-40 transition-all duration-200 ${styles.playgroundSlider}`}/>

            <button onClick={handleZoomIn} className="p-1.5 rounded bg-none hover:cursor-pointer hover:bg-gray-200 transition-colors">
                <FiZoomIn size={16}/>
            </button>
            <button onClick={handleResetView} className="flex items-center gap-2 px-2 py-1 text-blue-700 rounded-lg hover:cursor-pointer hover:bg-blue-100 transition-colors text-sm">
                <FiMaximize2 size={16}/>
                Reset View
            </button>
          </div>
          
          
          {/* Annotations Button - Prominent Position */}
          <button
            onClick={() => setIsAnnotationMode(!isAnnotationMode)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 
                ${isAnnotationMode ? 'bg-orange-500 text-white shadow-md border-2 border-orange-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'}`
            }>
            <FilePenLine size={16} />
            {isAnnotationMode ? 'Exit Annotations' : 'Add Annotations'}
          </button>
            
          {/* Add to Canvas and View Canvas Buttons */}
            <button
            onClick={handleAddToCanvas}
            disabled={isAdded}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                isAdded
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            >
            {isAdded ? (<><FiCheck size={16} />Added to VISplora</>) : (<><FiPlus size={16} />Add to VISplora</>)}
            </button>

            <button
            onClick={handleGoToCanvas}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:cursor-pointer hover:text-gray-900 hover:bg-slate-100 transition-colors"
            >
            <FiExternalLink size={16} />
            VISplora
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
          minScale={0.25}
          maxScale={2}
          centerOnInit={true}
          limitToBounds={false}
          smooth={true}
          wheel={{
            disabled: false,
            step: 0.001,
            smoothStep: 0.0005
          }}
          doubleClick={{
            disabled: false,
            step: 0.5
          }}
          onTransformed={(ref) => {
            const newZoom = ref.state.scale * 100;
            currentPositionRef.current.x = ref.state.positionX;
            currentPositionRef.current.y = ref.state.positionY;
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
                className="relative w-[4800px] rounded-xl" 
                style={{
                    height: `${canvasHeight}px`,
                    boxShadow: '0 0 100px rgba(0, 0, 0, 0.1)', 
                    backgroundImage: 'radial-gradient(circle, #d1d5db 2px, transparent 2px)',
                    backgroundSize: '50px 50px',
                    backgroundPosition: '0 0',
                    transformOrigin: '0 0'
                }}
              >
                {/* Center the dashboard in the grid */}
                <div 
                  ref={dashboardRef}
                  className="absolute bg-white p-2 rounded-xl shadow-xl overflow-hidden" 
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
            <span>Playground Dimension: {4800}px x {canvasHeight}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPlayground;
