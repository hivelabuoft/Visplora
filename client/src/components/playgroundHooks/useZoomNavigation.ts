'use client';

import { useState, useCallback, useRef } from 'react';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

export const useZoomNavigation = (
  getDashboardGridInfo: () => any
) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const dashboardPositionRef = useRef({ x: 0, y: 0 });

  const handleSliderChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(event.target.value);
    if (transformRef.current) {
      transformRef.current.setTransform(
        dashboardPositionRef.current.x,
        dashboardPositionRef.current.y,
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
  }, []);

  const handleResetView = useCallback(() => {
    if (transformRef.current) {
      // Calculate proper center position for the current canvas size
      const dashboardInfo = getDashboardGridInfo();
      const dashboardCenterX = dashboardInfo.position.x + dashboardInfo.size.width / 2;
      const dashboardCenterY = dashboardInfo.position.y + dashboardInfo.size.height / 2;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scale = 0.8; // Default scale
      
      // Calculate position to center the dashboard in the viewport
      const targetX = (viewportWidth / 2) - (dashboardCenterX * scale);
      const targetY = (viewportHeight / 2) - (dashboardCenterY * scale);
      
      transformRef.current.setTransform(targetX, targetY, scale, 500, "easeInCubic");
      setZoomLevel(80);
    }
  }, [getDashboardGridInfo]);

  return {
    zoomLevel,
    setZoomLevel,
    isPanning,
    setIsPanning,
    transformRef,
    dashboardPositionRef,
    handleSliderChange,
    handleZoomIn,
    handleZoomOut,
    handleResetView
  };
};
