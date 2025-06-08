'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiEdit3, FiSun, FiMoon, FiSave, FiMove } from 'react-icons/fi';
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
  getOccupiedCells?: () => Set<string>;
  zoomLevel?: number;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  cellSize,
  onUpdate,
  onDelete,
  onSelect,
  isResizing,
  onResizeStart,
  onResizeEnd,
  onMoveStart,
  onMoveEnd,
  getOccupiedCells,
  zoomLevel = 100 // Default zoom level is 100%
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

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
    }
  }, [isEditing]);  const handleSave = () => {
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
    const handleMouseMove = (e: MouseEvent) => {
      // Apply zoom level scaling to mouse movements
      const zoomFactor = 100 / zoomLevel;
      const deltaX = (e.clientX - startX) * zoomFactor;
      const deltaY = (e.clientY - startY) * zoomFactor;
      
      const newPixelX = startPixelX + deltaX;
      const newPixelY = startPixelY + deltaY;
      
      // Snap to grid
      const newCol = Math.round(newPixelX / cellSize);
      const newRow = Math.round(newPixelY / cellSize);
      
      // Check if the new position would conflict with occupied cells
      if (getOccupiedCells) {
        const occupiedCells = getOccupiedCells();
        let hasConflict = false;
        
        for (let r = newRow; r < newRow + note.height; r++) {
          for (let c = newCol; c < newCol + note.width; c++) {
            const cellKey = `${r}-${c}`;
            if (occupiedCells.has(cellKey)) {
              // Check if this cell belongs to this note's current position
              const belongsToCurrentNote = 
                r >= note.row && r < note.row + note.height &&
                c >= note.col && c < note.col + note.width;
              
              if (!belongsToCurrentNote) {
                hasConflict = true;
                break;
              }
            }
          }
          if (hasConflict) break;
        }

        if (!hasConflict && newRow >= 0 && newCol >= 0) {
          onUpdate(note.id, { 
            row: newRow, 
            col: newCol, 
            x: newCol * cellSize, 
            y: newRow * cellSize 
          });
        }
      }
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
    const handleMouseMove = (e: MouseEvent) => {
      // Apply zoom level scaling to mouse movements
      const zoomFactor = 100 / zoomLevel;
      const deltaX = (e.clientX - startX) * zoomFactor;
      const deltaY = (e.clientY - startY) * zoomFactor;
      
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('right')) {
        newWidth = Math.max(1, startWidth + Math.round(deltaX / cellSize));
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(1, startHeight + Math.round(deltaY / cellSize));
      }

      // Check if the new size would conflict with occupied cells
      if (getOccupiedCells) {
        const occupiedCells = getOccupiedCells();
        let hasConflict = false;
        
        for (let r = note.row; r < note.row + newHeight; r++) {
          for (let c = note.col; c < note.col + newWidth; c++) {
            const cellKey = `${r}-${c}`;
            if (occupiedCells.has(cellKey)) {
              // Check if this cell belongs to this note
              const belongsToThisNote = 
                r >= note.row && r < note.row + note.height &&
                c >= note.col && c < note.col + note.width;
              
              if (!belongsToThisNote) {
                hasConflict = true;
                break;
              }
            }
          }
          if (hasConflict) break;
        }

        if (!hasConflict) {
          onUpdate(note.id, { width: newWidth, height: newHeight });
        }
      } else {
        onUpdate(note.id, { width: newWidth, height: newHeight });
      }
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
    document.addEventListener('mouseup', handleMouseUp);  };  
  
  return (
    <div ref={noteRef} style={getNoteStyle({ note, cellSize, isEditing, isMoving, isDragging })} onClick={handleNoteClick}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', gap: '2px' }}>
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
            style={getCornerResizeHandleStyle(note.isDark)}
            onMouseDown={(e) => handleResizeStart('bottom-right', e)}
            title="Resize note"
          />
          
          {/* Right edge handle */}
          <div
            style={getRightResizeHandleStyle(note.isDark)}
            onMouseDown={(e) => handleResizeStart('right', e)}
            title="Resize width"          />
          
          {/* Bottom edge handle */}
          <div
            style={getBottomResizeHandleStyle(note.isDark)}
            onMouseDown={(e) => handleResizeStart('bottom', e)}
            title="Resize height"
          />
        </>
      )}
    </div>
  );
};

export default StickyNote;
