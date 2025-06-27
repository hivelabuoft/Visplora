'use client';

import { useState, useCallback } from 'react';
import { ManualConnection } from '../ui/connection-lines';
import { DragState } from '../context/DashboardPlaygroundContext';

export const useConnectionManager = (
  stickyNotes: any[],
  updateStickyNote: (id: string, updates: any) => void,
  aiAssistant?: any,
  addConnectionToAssistant?: (elementId: string, type: 'element' | 'note', data: any) => void,
  removeConnectionFromAssistant?: (elementId: string, type: 'element' | 'note') => void
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
    sourceType: 'element' | 'note' | 'ai-assistant',
    targetId: string, 
    targetType: 'element' | 'note' | 'ai-assistant'
  ): boolean => {
    // Rule: Connections are allowed between:
    // 1. Note to Note
    // 2. Note to Element  
    // 3. Element to Note
    // 4. Note to AI Assistant
    // 5. Element to AI Assistant
    // 6. AI Assistant to Note
    // 7. AI Assistant to Element
    
    if (sourceType === 'element' && targetType === 'element') {
      return false; // Element to Element not allowed
    }
    
    if (sourceType === 'ai-assistant' && targetType === 'ai-assistant') {
      return false; // AI Assistant to AI Assistant not allowed
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
    
    // Check if AI assistant connection already exists
    const aiAssistantConnectionExists = aiAssistant && (
      (sourceType === 'ai-assistant' && 
       aiAssistant.connectedElements.some((el: any) => el.id === targetId && el.type === targetType)) ||
      (targetType === 'ai-assistant' && 
       aiAssistant.connectedElements.some((el: any) => el.id === sourceId && el.type === sourceType))
    );
    
    return !manualConnectionExists && !automaticConnectionExists && !aiAssistantConnectionExists;
  }, [manualConnections, stickyNotes, aiAssistant]);

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
    
    // Handle AI assistant connection removal
    if (connectionToRemove.sourceType === 'ai-assistant' && removeConnectionFromAssistant && connectionToRemove.targetType !== 'ai-assistant') {
      removeConnectionFromAssistant(connectionToRemove.targetId, connectionToRemove.targetType);
    } else if (connectionToRemove.targetType === 'ai-assistant' && removeConnectionFromAssistant && connectionToRemove.sourceType !== 'ai-assistant') {
      removeConnectionFromAssistant(connectionToRemove.sourceId, connectionToRemove.sourceType);
    }
  }, [manualConnections, stickyNotes, updateStickyNote, removeConnectionFromAssistant]);

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

  // Update connection drag start to support AI assistant
  const handleConnectionDragStart = useCallback((
    elementId: string, 
    type: 'element' | 'note' | 'ai-assistant', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => {
    setConnectionFeedback(`Dragging from ${type === 'ai-assistant' ? 'AI assistant' : type === 'note' ? 'note' : 'element'} (${position} edge) - drag to another connection node to create link`);
    setIsDragging(true);
    setDragStart({ id: elementId, type, position, x, y });
    setDragPreview({ x, y });
  }, []);

  // Handle connection drop
  const handleConnectionDrop = useCallback((
    targetId: string,
    targetType: 'element' | 'note' | 'ai-assistant',
    targetPosition: 'top' | 'right' | 'bottom' | 'left'
  ) => {
    if (!isDragging || !dragStart) return false;

    // Validate the connection
    if (!validateConnection(dragStart.id, dragStart.type, targetId, targetType)) {
      setConnectionFeedback('Invalid connection - check connection rules');
      setTimeout(() => setConnectionFeedback(null), 2000);
      return false;
    }

    // Handle AI assistant connections
    if (dragStart.type === 'ai-assistant' || targetType === 'ai-assistant') {
      if (dragStart.type === 'ai-assistant' && addConnectionToAssistant && targetType !== 'ai-assistant') {
        // Find the data for the target element/note
        let targetData = null;
        if (targetType === 'element') {
          // Find in dropped elements (you may need to pass this data)
          targetData = { id: targetId, type: 'element' };
        } else if (targetType === 'note') {
          targetData = stickyNotes.find(note => note.id === targetId);
        }
        if (targetData) {
          addConnectionToAssistant(targetId, targetType, targetData);
        }
        
        // Also create a manual connection for visual rendering
        const connection: ManualConnection = {
          id: `ai-connection-${Date.now()}`,
          sourceId: dragStart.id,
          sourceType: dragStart.type,
          sourcePosition: dragStart.position,
          targetId,
          targetType,
          targetPosition,
          createdAt: Date.now()
        };
        handleAddManualConnection(connection);
        
      } else if (targetType === 'ai-assistant' && addConnectionToAssistant && dragStart.type !== 'ai-assistant') {
        // Find the data for the source element/note
        let sourceData = null;
        if (dragStart.type === 'element') {
          sourceData = { id: dragStart.id, type: 'element' };
        } else if (dragStart.type === 'note') {
          sourceData = stickyNotes.find(note => note.id === dragStart.id);
        }
        if (sourceData) {
          addConnectionToAssistant(dragStart.id, dragStart.type, sourceData);
        }
        
        // Also create a manual connection for visual rendering
        const connection: ManualConnection = {
          id: `ai-connection-${Date.now()}`,
          sourceId: dragStart.id,
          sourceType: dragStart.type,
          sourcePosition: dragStart.position,
          targetId,
          targetType,
          targetPosition,
          createdAt: Date.now()
        };
        handleAddManualConnection(connection);
      }
      
      setConnectionFeedback('AI assistant connection created!');
      setTimeout(() => setConnectionFeedback(null), 2000);
      return true;
    }

    // Handle regular manual connections
    const connection: ManualConnection = {
      id: `connection-${Date.now()}`,
      sourceId: dragStart.id,
      sourceType: dragStart.type,
      sourcePosition: dragStart.position,
      targetId,
      targetType,
      targetPosition,
      createdAt: Date.now()
    };

    handleAddManualConnection(connection);
    setConnectionFeedback('Connection created!');
    setTimeout(() => setConnectionFeedback(null), 2000);
    
    return true;
  }, [isDragging, dragStart, validateConnection, addConnectionToAssistant, stickyNotes, handleAddManualConnection]);

  // Update drop handling
  const handleConnectionDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDragPreview(null);
    if (connectionFeedback && !connectionFeedback.includes('created')) {
      setConnectionFeedback(null);
    }
  }, [connectionFeedback]);

  // Helper function to determine if a target is valid for drop
  const isValidDropTarget = useCallback((targetId: string, targetType: 'element' | 'note' | 'ai-assistant') => {
    if (!isDragging || !dragStart) return false;
    
    // Can't drop on self
    if (dragStart.id === targetId) return false;
    
    // Use the validation function
    return validateConnection(dragStart.id, dragStart.type, targetId, targetType);
  }, [isDragging, dragStart, validateConnection]);

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
    handleConnectionDrop,
    handleConnectionDragEnd,
    isValidDropTarget
  };
};
