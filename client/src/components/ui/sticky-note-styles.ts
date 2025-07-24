import { CSSProperties } from 'react';
import { StickyNoteData } from './sticky-note';

interface StyleProps {
  note: StickyNoteData;
  cellSize: number;
  isEditing: boolean;
  isMoving: boolean;
  isDragging: boolean;
}

export const getNoteStyle = ({ note, cellSize, isEditing, isMoving, isDragging }: StyleProps): CSSProperties => ({
  position: 'absolute',
  left: note.x + 4,
  top: note.y + 4,
  width: (note.width * cellSize) - 8,
  height: (note.height * cellSize) - 8,
  minHeight: cellSize - 8,
  backgroundColor: note.isDark ? '#1f2937' : '#fef3c7',
  border: `2px solid ${
    note.isLinked 
      ? '#9b04e6' // Purple border for linked notes
      : note.isSelected 
        ? (note.isDark ? '#60a5fa' : '#f59e0b') 
        : (note.isDark ? '#374151' : '#f59e0b')
  }`,
  borderRadius: '8px',
  padding: '8px',
  fontSize: '12px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: note.isDark ? '#f9fafb' : '#1f2937',
  cursor: isEditing ? 'text' : (isMoving ? 'grabbing' : 'pointer'),  boxShadow: note.isSelected
    ? (note.isLinked
      ? '0 0 0 3px rgba(155, 4, 230, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.2)' // Purple glow for linked notes
      : note.isDark 
        ? '0 0 0 3px rgba(96, 165, 250, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
        : '0 0 0 3px rgba(245, 158, 11, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1)')
    : (note.isDark 
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'),
  zIndex: note.isSelected ? 40 : 30,
  display: 'flex',
  flexDirection: 'column',
  transition: (isDragging || isMoving) ? 'none' : 'all 0.2s ease'
});

export const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
  minHeight: '16px'
};

export const getButtonStyle = (isDark: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px',
  borderRadius: '4px',
  color: isDark ? '#9ca3af' : '#6b7280',
  fontSize: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const getMoveButtonStyle = (isDark: boolean): CSSProperties => ({
  ...getButtonStyle(isDark),
  cursor: 'grab'
});

export const textareaStyle: CSSProperties = {
  width: '100%',
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  resize: 'none',
  fontSize: '12px',
  lineHeight: '1.3',
  color: 'inherit',
  fontFamily: 'inherit'
};

export const contentStyle: CSSProperties = {
  flex: 1,
  cursor: 'pointer',
  fontSize: '12px',
  lineHeight: '1.3',
  wordWrap: 'break-word',
  overflow: 'hidden'
};

export const getCornerResizeHandleStyle = (isDark: boolean, isLinked: boolean = false): CSSProperties => ({
  position: 'absolute',
  bottom: -2,
  right: -2,
  width: 10,
  height: 10,
  backgroundColor: isLinked ? '#9b04e6' : (isDark ? '#60a5fa' : '#f59e0b'),
  border: '1px solid white',
  borderRadius: '2px',
  cursor: 'se-resize',
  zIndex: 50
});

export const getRightResizeHandleStyle = (isDark: boolean, isLinked: boolean = false): CSSProperties => ({
  position: 'absolute',
  top: '50%',
  right: -3,
  width: 6,
  height: 30,
  backgroundColor: isLinked ? '#9b04e6' : (isDark ? '#60a5fa' : '#f59e0b'),
  border: '1px solid white',
  borderRadius: '3px',
  cursor: 'e-resize',
  transform: 'translateY(-50%)',
  zIndex: 50
});

export const getBottomResizeHandleStyle = (isDark: boolean, isLinked: boolean = false): CSSProperties => ({
  position: 'absolute',
  bottom: -3,
  left: '50%',
  width: 30,
  height: 6,
  backgroundColor: isLinked ? '#9b04e6' : (isDark ? '#60a5fa' : '#f59e0b'),
  border: '1px solid white',
  borderRadius: '3px',
  cursor: 's-resize',
  transform: 'translateX(-50%)',
  zIndex: 50
});
