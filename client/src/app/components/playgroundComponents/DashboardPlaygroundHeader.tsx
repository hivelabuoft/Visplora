'use client';

import React from 'react';
import { FiMove, FiZoomOut, FiZoomIn, FiMaximize2, FiPlus, FiCheck, FiLink } from 'react-icons/fi';
import { FilePenLine } from 'lucide-react';
import styles from '../DashboardPlayground.module.css';

interface DashboardPlaygroundHeaderProps {
  dashboardTitle: string;
  zoomLevel: number;
  notesCount: number;
  isAnnotationMode: boolean;
  isAdded: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onSliderChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetView: () => void;
  onClearAllNotes: () => void;
  onToggleAnnotations: () => void;
  onAddToCanvas: () => void;
  onGoToCanvas: () => void;
}

export const DashboardPlaygroundHeader: React.FC<DashboardPlaygroundHeaderProps> = ({
  dashboardTitle,
  zoomLevel,
  notesCount,
  isAnnotationMode,
  isAdded,
  onZoomOut,
  onZoomIn,
  onSliderChange,
  onResetView,
  onClearAllNotes,
  onToggleAnnotations,
  onAddToCanvas,
  onGoToCanvas
}) => {
  return (
    <div className={styles.playgroundHeader}>
      <div className={styles.headerTitleSection}>
        <div className={styles.headerIcon}>
          <FiMove size={16} />
        </div>
        <div>
          <h3 className={styles.headerTitle}>
            Playground Mode - {dashboardTitle} 
          </h3>
        </div>
      </div>
      
      {/* Controls in Header */}
      <div className={styles.headerControls}>
        {/* Zoom Controls in Header */}
        <div className={styles.zoomControls}>
          <button onClick={onZoomOut} className={styles.zoomButton}>
            <FiZoomOut size={16}/>
          </button>
          <input 
            type="range" 
            min="15" 
            max="200" 
            value={zoomLevel} 
            onChange={onSliderChange} 
            className={styles.playgroundSlider}
          />
          <button onClick={onZoomIn} className={styles.zoomButton}>
            <FiZoomIn size={16}/>
          </button>
          <button onClick={onResetView} className={styles.resetViewButton}>
            <FiMaximize2 size={16}/>
            Reset View
          </button>
        </div>
        
        {/* Annotations Button */}
        {notesCount > 0 && (
          <button
            onClick={onClearAllNotes}
            className={styles.clearNotesButton}
          >
            Clear All Notes
          </button>
        )}
        
        <button
          onClick={onToggleAnnotations}
          className={`${styles.annotationsButton} ${isAnnotationMode ? styles.active : styles.inactive}`}
        >
          <FilePenLine size={16} />
          <span>{isAnnotationMode ? 'Exit Annotations' : 'Add Annotations'}</span>
          {notesCount > 0 && (
            <span className={`${styles.notesCountBadge} ${isAnnotationMode ? styles.active : styles.inactive}`}
                title='Number of notes'>
                {notesCount}
            </span>
          )}
        </button>
        
        {/* Add to Canvas and View Canvas Buttons */}
        <button
          onClick={onAddToCanvas}
          disabled={isAdded}
          className={`${styles.addToCanvasButton} ${isAdded ? styles.added : styles.notAdded}`}
        >
          {isAdded ? (<><FiCheck size={16} />Added to VISplora</>) : (<><FiPlus size={16} />Add to VISplora</>)}
        </button>

        <button
          onClick={onGoToCanvas}
          className={styles.viewCanvasButton}
        >
          <FiLink size={16} />
          VISplora
        </button>            
      </div>
    </div>
  );
};
