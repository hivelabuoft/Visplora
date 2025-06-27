'use client';

import { useState, useCallback } from 'react';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

export const useNoteLinking = (
  zoomLevel: number,
  setZoomLevel: (level: number) => void,
  getDashboardGridInfo: () => any,
  transformRef: React.RefObject<ReactZoomPanPinchRef | null>,
  updateStickyNote: (id: string, updates: any) => void
) => {
  const [isNoteLinkingMode, setIsNoteLinkingMode] = useState(false);
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false);
  const [noteToLink, setNoteToLink] = useState<string | null>(null);
  const [linkingElementId, setLinkingElementId] = useState<string | null>(null);

  // Activate note linking mode and zoom out
  const activateLinkedNoteMode = useCallback((elementId?: string) => {
    if (!isNoteLinkingMode) {
      setIsNoteLinkingMode(true);
      setLinkingElementId(elementId || null);
      
      if (transformRef.current) {
        // Get dashboard position and size
        const dashboardInfo = getDashboardGridInfo();
        const dashboardCanvasX = dashboardInfo.position.x;
        const dashboardCanvasY = dashboardInfo.position.y;
        const dashboardWidth = dashboardInfo.size.width;
        const dashboardHeight = dashboardInfo.size.height;
        
        // Calculate center of dashboard in canvas coordinates
        const dashboardCenterX = dashboardCanvasX + dashboardWidth / 2;
        const dashboardCenterY = dashboardCanvasY + dashboardHeight / 2;
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        let targetScale;
        if (zoomLevel > 40) {
          targetScale = 0.4;
        } else {
          targetScale = zoomLevel / 100;
        }

        // Calculate position to center the dashboard in the viewport at 40% zoom
        const targetX = (viewportWidth / 2) - (dashboardCenterX * targetScale);
        const targetY = (viewportHeight / 2) - (dashboardCenterY * targetScale);
        
        transformRef.current.setTransform(
          targetX,
          targetY - 50,
          targetScale,
          1000,
          "easeOutCubic"
        );
        setZoomLevel(targetScale * 100);
      }
    }
  }, [isNoteLinkingMode, getDashboardGridInfo, zoomLevel, transformRef, setZoomLevel]);

  // Activate element selection mode for linking existing notes
  const activateElementSelectionMode = useCallback((noteId: string) => {
    setIsElementSelectionMode(true);
    setNoteToLink(noteId);
    
    if (transformRef.current) {
      // Get dashboard position and size
      const dashboardInfo = getDashboardGridInfo();
      const dashboardCanvasX = dashboardInfo.position.x;
      const dashboardCanvasY = dashboardInfo.position.y;
      const dashboardWidth = dashboardInfo.size.width;
      const dashboardHeight = dashboardInfo.size.height;
      
      // Calculate center of dashboard in canvas coordinates
      const dashboardCenterX = dashboardCanvasX + dashboardWidth / 2;
      const dashboardCenterY = dashboardCanvasY + dashboardHeight / 2;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let targetScale = 0.5;
      
      // Calculate position to center the dashboard in the viewport at 40% zoom
      const targetX = (viewportWidth / 2) - (dashboardCenterX * targetScale);
      const targetY = (viewportHeight / 2) - (dashboardCenterY * targetScale);
      
      transformRef.current.setTransform(
        targetX,
        targetY - 50,
        targetScale,
        1000,
        "easeOutCubic"
      );
      setZoomLevel(targetScale * 100);
    }
  }, [getDashboardGridInfo, zoomLevel, transformRef, setZoomLevel]);

  const linkNoteToElement = useCallback((noteId: string, elementId: string) => {
    updateStickyNote(noteId, {
      linkedElementId: elementId,
      isLinked: true
    });
    
    // Exit element selection mode
    setIsElementSelectionMode(false);
    setNoteToLink(null);
  }, [updateStickyNote]);

  // Remove connection between note and element
  const removeConnection = useCallback((noteId: string) => {
    updateStickyNote(noteId, {
      linkedElementId: undefined,
      isLinked: false
    });
  }, [updateStickyNote]);

  return {
    isNoteLinkingMode,
    setIsNoteLinkingMode,
    isElementSelectionMode,
    setIsElementSelectionMode,
    noteToLink,
    setNoteToLink,
    linkingElementId,
    setLinkingElementId,
    activateLinkedNoteMode,
    activateElementSelectionMode,
    linkNoteToElement,
    removeConnection
  };
};
