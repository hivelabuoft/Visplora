'use client';

import React from 'react';
import styles from '../DashboardPlayground.module.css';
import { CELL_SIZE } from './DashboardPlaygroundUtils';

interface DashboardPlaygroundFooterProps {
  showTips: boolean;
  setShowTips: (show: boolean) => void;
  isAnnotationMode: boolean;
  isNoteLinkingMode: boolean;
  isElementSelectionMode: boolean;
  isResizing: boolean;
  isMoving: boolean;
  isDragging: boolean;
  isElementDragging: boolean;
  isDroppedElementMoving: boolean;
  connectionFeedback: string | null;
  linkingElementId: string | null;
  isPanning: boolean;
  zoomLevel: number;
  canvasWidth: number;
  canvasHeight: number;
}

export const DashboardPlaygroundFooter: React.FC<DashboardPlaygroundFooterProps> = ({
  showTips,
  setShowTips,
  isAnnotationMode,
  isNoteLinkingMode,
  isElementSelectionMode,
  isResizing,
  isMoving,
  isDragging,
  isElementDragging,
  isDroppedElementMoving,
  connectionFeedback,
  linkingElementId,
  isPanning,
  zoomLevel,
  canvasWidth,
  canvasHeight
}) => {
  const hasActiveModes = isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || 
                         isResizing || isMoving || isDragging || isElementDragging || 
                         isDroppedElementMoving || connectionFeedback;

  return (
    <div className={styles.playgroundFooter}>
      <div className={styles.footerContent}>   
        <button
          onClick={() => setShowTips(!showTips)}
          className={styles.helpButton}
        >
          <span>Help</span>
          <span className={`${styles.helpArrow} ${showTips ? styles.rotated : ''}`}>
            ▼
          </span>
        </button>
        
        {showTips && (              
          <div className={styles.helpTooltip}>
            {/* Navigation */}
            <span><strong>Navigation:</strong> Drag to pan around the dashboard.</span>
            <span><strong>Zooming:</strong> Scroll or use controls to zoom.</span>
            <span><strong>Centering:</strong> Use "Reset View" to return to center.</span>

            {/* Dashboard Management */}
            <span><strong>Saving:</strong> Click "Add to VISplora" to save dashboard.</span>
            <span><strong>Exiting:</strong> Press ESC to exit current mode or close playground.</span>

            {/* Sticky Notes */}
            <span><strong>Notes Mode:</strong> Click "Add Annotations" to toggle sticky notes.</span>
            <span><strong>Adding Notes:</strong> Click a grid cell to add a sticky note.</span>
            <span><strong>Note Controls:</strong> Resize or move notes by dragging edges or title bar.</span>
            <span><strong>Note Clearing:</strong> Use the "Clear All Notes" button to remove all sticky notes.</span>
            <span><strong>Linking:</strong> Click link button on notes to link/unlink from elements.</span>

            {/* Copied Elements */}
            <span><strong>Copying Elements:</strong> Use drag button on linkable elements to copy to playground.</span>
            <span><strong>Moving Copies:</strong> Click the move button on copied elements to reposition them.</span>
            <span><strong>Connecting Copies:</strong> Use connection nodes on copied elements to link with notes or other elements.</span>
            <span><strong>Removing Copies:</strong> Click the X button on copied elements to remove them.</span>
          </div>
        )}
        
        {hasActiveModes && (
          <div className={styles.feedbackCenter}>
            {isAnnotationMode && 
            <span className={`${styles.feedbackText} ${styles.annotation}`}>Select a grid cell to add sticky note
            </span>}
            {isNoteLinkingMode && (
              <span className={`${styles.feedbackText} ${styles.noteLinking}`}>
                Place linked note
                {linkingElementId && ` for element: ${linkingElementId}`}
              </span>)}
            {isElementSelectionMode && (
              <span className={`${styles.feedbackText} ${styles.elementSelection}`}>
                Select the dashboard element to link selected note with
              </span>)}
            {isResizing && <span className={`${styles.feedbackText} ${styles.resizing}`}>
              Resizing note - drop note to confirm size
              </span>}
            {isMoving && <span className={`${styles.feedbackText} ${styles.moving}`}>
              Moving note - drop note to confirm placement
              </span>}
            {isDroppedElementMoving && <span className={`${styles.feedbackText} ${styles.moving}`}>
              Moving copied element - drop to confirm placement
              </span>}
            {isElementDragging && (
              <span className={`${styles.feedbackText} ${styles.dragging}`}>
                Dragging element - will be placed near dashboard (movable after drop)
              </span>)}
            {isDragging && !connectionFeedback && (
              <span className={`${styles.feedbackText} ${styles.dragging}`}>
                Creating connection - drag to a connection node to link
              </span>)}
            {connectionFeedback && (
              <span className={`${styles.feedbackText} ${
                connectionFeedback.startsWith('✓') ? styles.success : 
                connectionFeedback.startsWith('✗') ? styles.error : 
                styles.info
              }`}>
                {connectionFeedback}
              </span>)}
            {(isAnnotationMode || isNoteLinkingMode || isElementSelectionMode || isDragging || isElementDragging) && (
              <span>Press ESC to exit</span>
            )}
          </div>
        )}            
        
        <div className={styles.statusIndicators}>
          <div className={styles.statusIndicator}>
            <span className={`${styles.statusDot} ${isPanning ? styles.active + ' ' + styles.panningIndicator : styles.inactive}`}></span>
            <span>Interactive Mode</span>
          </div>
          <span>Zoom: {Math.round(zoomLevel)}%</span>
          <span>Dimension: {Math.floor(canvasWidth / CELL_SIZE)}×{Math.floor(canvasHeight / CELL_SIZE)} ({CELL_SIZE}px cells)</span>
        </div>
      </div>
    </div>
  );
};
