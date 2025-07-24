'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiEdit3, FiSun, FiMoon, FiSave, FiMove, FiLink } from 'react-icons/fi';
import { useDashboardPlayground } from '../../app/components/DashboardPlayground';
import { ConnectionNodes } from './connection-nodes';
import { 
  getNoteStyle, 
  headerStyle, 
  textareaStyle, 
  contentStyle,
  getCornerResizeHandleStyle,
  getRightResizeHandleStyle,
  getBottomResizeHandleStyle
} from './sticky-note-styles';
import styles from './sticky-note.module.css';

// Add throttle function to prevent too many updates
const throttle = (func: Function, delay: number) => {
  let lastCall = 0;
  let lastArgs: any[] | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(...args: any[]) {
    const now = Date.now();
    lastArgs = args;
    
    // If enough time has passed since last call, execute immediately
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
    
    // Otherwise schedule for later and ensure only the last call gets executed
    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          lastCall = Date.now();
          func(...lastArgs);
        }
        timeoutId = null;
        lastArgs = null;
      }, delay - (now - lastCall));
    }
  };
};

export interface StickyNoteData {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  width: number; // width in cells
  height: number; // height in cells
  content: string;
  isDark: boolean;
  createdAt: number;
  isSelected?: boolean;
  linkedElementId?: string; // ID of the linked dashboard element
  isLinked?: boolean; // Whether this note is linked to an element
}

interface StickyNoteProps {
  note: StickyNoteData;
  cellSize: number;
  onUpdate: (noteId: string, updates: Partial<StickyNoteData>) => void;
  onDelete: (noteId: string) => void;
  onSelect?: (noteId: string | null) => void;
  isResizing?: boolean;
  onResizeStart?: (noteId: string) => void;
  onResizeEnd?: () => void;
  onMoveStart?: (noteId: string) => void;
  onMoveEnd?: () => void;
  zoomLevel?: number;
  onConnectionDragStart?: (
    elementId: string, 
    type: 'element' | 'note' | 'ai-assistant', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => void;
  isDragging?: boolean; // Whether a drag operation is currently active
  isDragTarget?: boolean; // Whether this note is a valid drop target during drag
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  cellSize,
  onUpdate,  onDelete,
  onSelect,
  isResizing,
  onResizeStart,
  onResizeEnd,
  onMoveStart,
  onMoveEnd,
  zoomLevel = 100, // Default zoom level is 100%
  onConnectionDragStart,
  isDragging: globalIsDragging = false,
  isDragTarget = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const wasSelectedRef = useRef(note.isSelected);  // Get the dashboard playground context
  let activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  let activateElementSelectionMode: ((noteId: string) => void) | undefined;
  let getLinkedElementInfo: ((noteId: string) => { elementId: string; type: 'automatic' | 'manual' } | null) | undefined;
  try {
    const context = useDashboardPlayground();
    activateLinkedNoteMode = context.activateLinkedNoteMode;
    activateElementSelectionMode = context.activateElementSelectionMode;
    getLinkedElementInfo = context.getLinkedElementInfo;
  } catch {
    // Context not available, component used outside of DashboardPlayground
    activateLinkedNoteMode = undefined;
    activateElementSelectionMode = undefined;
    getLinkedElementInfo = undefined;
  }
  // Get linked element display information
  const getLinkedElementDisplay = (): { id: string; type: 'automatic' | 'manual' } | null => {
    if (getLinkedElementInfo) {
      const result = getLinkedElementInfo(note.id);
      return result ? { id: result.elementId, type: result.type } : null;
    }
    // Fallback to the old method for backward compatibility
    if (note.linkedElementId) {
      return { id: note.linkedElementId, type: 'automatic' };
    }
    return null;
  };

  // Auto-select and focus new notes (empty content means new)
  useEffect(() => {
    if (!note.content && onSelect) {
      onSelect(note.id);
      setIsEditing(true);
    }
  }, [note.content, note.id, onSelect]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }  }, [isEditing]);

  const handleSave = () => {
    onUpdate(note.id, { content: content.trim() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(note.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const toggleTheme = () => {
    onUpdate(note.id, { isDark: !note.isDark });
  };

  const handleNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect && !isEditing && !isMoving) {
      onSelect(note.id);
    }
  };

  const handleMoveStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveStart) {
      onMoveStart(note.id);
    }
    setIsMoving(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startRow = note.row;
    const startCol = note.col;
    const startPixelX = note.x;
    const startPixelY = note.y;    
      // Use throttling to prevent too many updates
    const throttledMouseMove = throttle((e: MouseEvent) => {
      // Apply zoom level scaling to mouse movements
      const zoomFactor = 100 / zoomLevel;
      const deltaX = (e.clientX - startX) * zoomFactor;
      const deltaY = (e.clientY - startY) * zoomFactor;
      
      // Calculate new position
      const newPixelX = startPixelX + deltaX;
      const newPixelY = startPixelY + deltaY;
      
      // Snap to grid
      const newCol = Math.round(newPixelX / cellSize);
      const newRow = Math.round(newPixelY / cellSize);

      // Ensure we're not trying to move to a negative position
      if (newRow < 0 || newCol < 0) {
        return;
      }
      
      // No collision checking - allow free movement within bounds
      const exactX = newCol * cellSize;
      const exactY = newRow * cellSize;
      
      // Update note position
      onUpdate(note.id, { 
        row: newRow, 
        col: newCol, 
        x: exactX, 
        y: exactY 
      });
    }, 30); // Decrease throttle time for smoother movement

    const handleMouseMove = (e: MouseEvent) => {
      throttledMouseMove(e);
    };

    const handleMouseUp = () => {
      setIsMoving(false);
      if (onMoveEnd) {
        onMoveEnd();
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (direction: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onResizeStart) {
      onResizeStart(note.id);
    }
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = note.width;
    const startHeight = note.height;    
      // Use throttling to prevent too many updates
    const throttledMouseMove = throttle((e: MouseEvent) => {
      // Apply zoom level scaling to mouse movements
      const zoomFactor = 100 / zoomLevel;
      const deltaX = (e.clientX - startX) * zoomFactor;
      const deltaY = (e.clientY - startY) * zoomFactor;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      // Define minimum sizes for better usability
      const MIN_WIDTH = 30; // Minimum 3 cells wide
      const MIN_HEIGHT = 15; // Minimum 2 cells high

      if (direction.includes('right')) {
        newWidth = Math.max(MIN_WIDTH, startWidth + Math.round(deltaX / cellSize));
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(MIN_HEIGHT, startHeight + Math.round(deltaY / cellSize));
      }

      // Limit maximum size to prevent performance issues with very large notes
      const MAX_SIZE = 500;
      newWidth = Math.min(newWidth, MAX_SIZE);
      newHeight = Math.min(newHeight, MAX_SIZE);

      // No collision checking - allow free resizing
      if (newWidth !== note.width || newHeight !== note.height) {
        onUpdate(note.id, { width: newWidth, height: newHeight });
      }
    }, 30); // Decreased throttle time for smoother resizing

    const handleMouseMove = (e: MouseEvent) => {
      throttledMouseMove(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onResizeEnd) {
        onResizeEnd();
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };  

  // Auto-save when note becomes unselected while being edited
  useEffect(() => {
    // If note was selected and editing, but now is not selected, auto-save
    if (wasSelectedRef.current && !note.isSelected && isEditing) {
      handleSave();
    }
    
    // Update the ref for next render
    wasSelectedRef.current = note.isSelected;
  }, [note.isSelected, isEditing]);

    return (
    <div ref={noteRef} style={getNoteStyle({ note, cellSize, isEditing, isMoving, isDragging })} onClick={handleNoteClick}>
      {/* Linked indicator badge */}
      {note.isLinked && (
        <div 
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-20 bg-purple-600"
          style={{
            color: '#ffffff'
          }}
          title={(() => {
            const linkedInfo = getLinkedElementDisplay();
            if (!linkedInfo) return 'Linked to: Unknown';
            const connectionType = linkedInfo.type === 'manual' ? ' (manual)' : '';
            return `Linked to: ${linkedInfo.id}${connectionType}`;
          })()}
        >
          <FiLink size={12} />
        </div>
      )}
      
      <div style={headerStyle}>
        <div className='flex items-center gap-1 flex-wrap'>
          <button
            className={`${styles.stickyNoteButton} ${note.isDark ? styles.darkModeButton : styles.lightModeButton}`}
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {note.isDark ? <FiSun size={14} /> : <FiMoon size={14} />}
          </button>
          {!isEditing && (
            <button
              className={`${styles.stickyNoteButton} ${note.isDark ? styles.darkModeButton : styles.lightModeButton}`}
              onClick={() => setIsEditing(true)}
              title="Edit note"
            >
              <FiEdit3 size={14} />
            </button>
          )}
          {isEditing && (
            <button
              className={`${styles.stickyNoteButton} ${note.isDark ? styles.darkModeButton : styles.lightModeButton}`}
              onClick={handleSave}
              title="Save note"
            >
              <FiSave size={14} />
            </button>
          )}
          {!isEditing && (
            <button
              className={`${styles.stickyNoteButton} ${styles.moveButton} ${note.isDark ? styles.darkModeButton : styles.lightModeButton}`}
              onMouseDown={handleMoveStart}
              title="Move note"
            >
              <FiMove size={14} />
            </button>
          )}
          {/* Link status button */}
          {!isEditing && (
            <button
              className={`${styles.stickyNoteButton} ${note.isDark ? styles.darkModeButton : styles.lightModeButton} ${
                note.isLinked ? 'opacity-100' : 'opacity-50'
              }`}              onClick={() => {
                if (note.isLinked && note.linkedElementId) {
                  // If note is linked, unlink it
                  onUpdate(note.id, { 
                    linkedElementId: undefined, 
                    isLinked: false 
                  });
                } else {
                  // If note is unlinked, activate element selection mode
                  if (activateElementSelectionMode) {
                    activateElementSelectionMode(note.id);
                  } else {
                    alert('This note is not linked to any dashboard element');
                  }
                }
              }}              title={(() => {
                if (!note.isLinked) return 'Unlinked. Click to link.';
                const linkedInfo = getLinkedElementDisplay();
                if (!linkedInfo) return 'Linked to Unknown. Click to unlink.';
                const connectionType = linkedInfo.type === 'manual' ? ' (manual)' : '';
                return `Linked to ${linkedInfo.id}${connectionType}. Click to unlink.`;
              })()}
              style={{
                color: note.isLinked 
                  ? (note.isDark ? '#fbbf24' : '#d97706') 
                  : undefined
              }}
            >
              <FiLink size={14} />
            </button>
          )}
        </div>
        <button
          className={`${styles.stickyNoteButton} ${note.isDark ? styles.darkModeButton : styles.lightModeButton} ${styles.deleteButton} ${note.isDark ? styles.darkModeDeleteButton : ''}`}
          onClick={() => onDelete(note.id)}
          title="Delete note"
        >
          <FiX size={14} />
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          ref={textareaRef}
          style={textareaStyle}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder="Type your note..."
        />      ) : (
        <div
          className={`${styles.noteContent} ${note.isDark ? styles.darkModeContent : ''}`}
          onClick={() => setIsEditing(true)}
        >
          {note.content || 'Click to edit...'}
        </div>
      )}
      {/* Resize Handles */}
      {note.isSelected && !isEditing && (
        <>
          {/* Bottom-right corner handle */}
          <div
            style={getCornerResizeHandleStyle(note.isDark, note.isLinked)}
            onMouseDown={(e) => handleResizeStart('bottom-right', e)}
            title="Resize note"
          />
          
          {/* Right edge handle */}
          <div
            style={getRightResizeHandleStyle(note.isDark, note.isLinked)}
            onMouseDown={(e) => handleResizeStart('right', e)}
            title="Resize width"
          />
          
          {/* Bottom edge handle */}
          <div
            style={getBottomResizeHandleStyle(note.isDark, note.isLinked)}
            onMouseDown={(e) => handleResizeStart('bottom', e)}
            title="Resize height"
          />
        </>
      )}
        {/* Connection Nodes */}
      <ConnectionNodes
        elementId={note.id}
        isVisible={note.isSelected || isEditing || globalIsDragging}
        isLinked={note.isLinked}
        onDragStart={onConnectionDragStart}
        isNote={true}
        isDragging={globalIsDragging}
        isDragTarget={isDragTarget}
      />
    </div>
  );
};

export default StickyNote;
