'use client';

import { useState, useCallback } from 'react';
import { ManualConnection } from '../../../components/ui/connection-lines';
import { DragState } from '../../../components/context/DashboardPlaygroundContext';

export const useConnectionManager = (
  stickyNotes: any[],
  updateStickyNote: (id: string, updates: any) => void
) => {
  const [manualConnections, setManualConnections] = useState<ManualConnection[]>([]);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);
  
  // Drag state for manual connections
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null);

  // Validate connection rules
  const validateConnection = useCallback((
    sourceId: string, 
    sourceType: 'element' | 'note',
    targetId: string, 
    targetType: 'element' | 'note'
  ): boolean => {
    // Rule: Connections are only allowed between:
    // 1. Note to Note
    // 2. Note to Element  
    // 3. Element to Note
    if (sourceType === 'element' && targetType === 'element') {
      return false; // Element to Element not allowed
    }
    
    // Don't allow self-connections
    if (sourceId === targetId) {
      return false;
    }
      
    // Check if connection already exists (manual connections)
    const manualConnectionExists = manualConnections.some(conn => 
      (conn.sourceId === sourceId && conn.targetId === targetId) ||
      (conn.sourceId === targetId && conn.targetId === sourceId)
    );
    
    // Check if automatic connection already exists
    const automaticConnectionExists = (
      (sourceType === 'note' && targetType === 'element' && 
       stickyNotes.some(note => note.id === sourceId && note.linkedElementId === targetId)) ||
      (sourceType === 'element' && targetType === 'note' && 
       stickyNotes.some(note => note.id === targetId && note.linkedElementId === sourceId))
    );
    
    return !manualConnectionExists && !automaticConnectionExists;
  }, [manualConnections, stickyNotes]);

  const handleAddManualConnection = useCallback((connection: ManualConnection) => {
    setManualConnections(prev => [...prev, connection]);
  }, []);

  const handleRemoveManualConnection = useCallback((connectionId: string) => {
    const connectionToRemove = manualConnections.find(conn => conn.id === connectionId);
    if (!connectionToRemove) return;
    
    setManualConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    // Check if notes should be unlinked after removing this connection
    const remainingConnections = manualConnections.filter(conn => conn.id !== connectionId);
    
    // Check source note
    if (connectionToRemove.sourceType === 'note') {
      const sourceHasOtherConnections = remainingConnections.some(conn => 
        conn.sourceId === connectionToRemove.sourceId || conn.targetId === connectionToRemove.sourceId
      );
      const sourceHasAutomaticConnection = stickyNotes.find(note => 
        note.id === connectionToRemove.sourceId && note.linkedElementId
      );
      
      if (!sourceHasOtherConnections && !sourceHasAutomaticConnection) {
        updateStickyNote(connectionToRemove.sourceId, { 
          isLinked: false, 
          linkedElementId: undefined 
        });
      } else if (connectionToRemove.targetType === 'element') {
        // If removing connection to element, clear the linkedElementId
        const sourceNote = stickyNotes.find(note => note.id === connectionToRemove.sourceId);
        if (sourceNote?.linkedElementId === connectionToRemove.targetId) {
          updateStickyNote(connectionToRemove.sourceId, { 
            linkedElementId: undefined 
          });
        }
      }
    }
    
    // Check target note
    if (connectionToRemove.targetType === 'note') {
      const targetHasOtherConnections = remainingConnections.some(conn => 
        conn.sourceId === connectionToRemove.targetId || conn.targetId === connectionToRemove.targetId
      );
      const targetHasAutomaticConnection = stickyNotes.find(note => 
        note.id === connectionToRemove.targetId && note.linkedElementId
      );
      
      if (!targetHasOtherConnections && !targetHasAutomaticConnection) {
        updateStickyNote(connectionToRemove.targetId, { 
          isLinked: false, 
          linkedElementId: undefined 
        });
      } else if (connectionToRemove.sourceType === 'element') {
        // If removing connection from element, clear the linkedElementId
        const targetNote = stickyNotes.find(note => note.id === connectionToRemove.targetId);
        if (targetNote?.linkedElementId === connectionToRemove.sourceId) {
          updateStickyNote(connectionToRemove.targetId, { 
            linkedElementId: undefined 
          });
        }
      }
    }
  }, [manualConnections, stickyNotes, updateStickyNote]);

  // Check if an element is linked to any note (either automatic or manual connection)
  const isElementLinked = useCallback((elementId: string): boolean => {
    // Check for automatic connections
    const hasAutomaticConnection = stickyNotes.some(note => note.isLinked && note.linkedElementId === elementId);
    
    // Check for manual connections (including dropped elements)
    const hasManualConnection = manualConnections.some(conn => 
      (conn.sourceId === elementId && conn.sourceType === 'element') ||
      (conn.targetId === elementId && conn.targetType === 'element')
    );
    
    return hasAutomaticConnection || hasManualConnection;
  }, [stickyNotes, manualConnections]);

  // Get linked element information for a note (checks both automatic and manual connections)
  const getLinkedElementInfo = useCallback((noteId: string): { elementId: string; type: 'automatic' | 'manual' } | null => {
    // Check for automatic connection
    const note = stickyNotes.find(n => n.id === noteId);
    if (note?.linkedElementId) {
      return { elementId: note.linkedElementId, type: 'automatic' };
    }
    
    // Check for manual connections
    const manualConnection = manualConnections.find(conn => 
      (conn.sourceId === noteId && conn.sourceType === 'note' && conn.targetType === 'element') ||
      (conn.targetId === noteId && conn.targetType === 'note' && conn.sourceType === 'element')
    );
    
    if (manualConnection) {
      const elementId = manualConnection.sourceId === noteId ? manualConnection.targetId : manualConnection.sourceId;
      return { elementId, type: 'manual' };
    }
    
    return null;
  }, [stickyNotes, manualConnections]);

  const handleConnectionDragStart = useCallback((
    elementId: string, 
    type: 'element' | 'note', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => {
    setConnectionFeedback(`Dragging from ${type === 'note' ? 'note' : 'element'} (${position} edge) - drag to another connection node to create link`);
    setIsDragging(true);
    setDragStart({ id: elementId, type, position, x, y });
    setDragPreview({ x, y });
  }, []);

  // Helper function to determine if a note is a valid drop target
  const isValidDropTarget = useCallback((noteId: string, noteType: 'element' | 'note') => {
    if (!isDragging || !dragStart) return false;
    
    // Can't drop on self
    if (dragStart.id === noteId) return false;
    
    // Apply connection rules
    if (dragStart.type === 'element' && noteType === 'element') return false; // Element to Element not allowed
    
    // Check if connection already exists
    const connectionExists = manualConnections.some(conn => 
      (conn.sourceId === dragStart.id && conn.targetId === noteId) ||
      (conn.sourceId === noteId && conn.targetId === dragStart.id)
    );
    
    return !connectionExists;
  }, [isDragging, dragStart, manualConnections]);

  return {
    manualConnections,
    connectionFeedback,
    setConnectionFeedback,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    dragPreview,
    setDragPreview,
    validateConnection,
    handleAddManualConnection,
    handleRemoveManualConnection,
    isElementLinked,
    getLinkedElementInfo,
    handleConnectionDragStart,
    isValidDropTarget
  };
};
