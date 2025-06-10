'use client';

import { useState, useEffect, useCallback } from 'react';
import { StickyNoteData } from './sticky-note';

const STORAGE_KEY = 'visplora-playground-sticky-notes';

export const useStickyNotesManager = (dashboardTitle: string) => {
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const storageKey = `${STORAGE_KEY}-${dashboardTitle}`;

  // Load sticky notes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const notes = JSON.parse(stored);
        setStickyNotes(notes);
      }
    } catch (error) {
      console.error('Failed to load sticky notes:', error);
    }
  }, [storageKey]);

  // Save sticky notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stickyNotes));
    } catch (error) {
      console.error('Failed to save sticky notes:', error);
    }
  }, [stickyNotes, storageKey]);  

  const createStickyNote = useCallback((
    row: number, 
    col: number, 
    x: number, 
    y: number, 
    linkedElementId?: string
    ): string => {
    const newNote: StickyNoteData = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      row,
      col,
      x,
      y,
      width: 2,
      height: 2,
      content: '',
      isDark: false,
      createdAt: Date.now(),
      isSelected: true, // Auto-select new notes
      linkedElementId,
      isLinked: !!linkedElementId
    };
    setStickyNotes(prev => [...prev, newNote]);
    setSelectedNoteId(newNote.id);
    return newNote.id;
  }, []);  
  
  const updateStickyNote = useCallback((noteId: string, updates: Partial<StickyNoteData>) => {
    setStickyNotes(prev => 
      prev.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  }, []);

  const deleteStickyNote = useCallback((noteId: string) => {
    setStickyNotes(prev => prev.filter(note => note.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
  }, [selectedNoteId]);

  const selectNote = useCallback((noteId: string | null) => {
    setSelectedNoteId(noteId);
    setStickyNotes(prev => 
      prev.map(note => ({
        ...note,
        isSelected: note.id === noteId
      }))
    );
  }, []);

  const getStickyNoteOccupiedCells = useCallback((): Set<string> => {
    const occupiedCells = new Set<string>();
    stickyNotes.forEach(note => {
      // Add all cells that this note occupies
      for (let r = note.row; r < note.row + note.height; r++) {
        for (let c = note.col; c < note.col + note.width; c++) {
          occupiedCells.add(`${r}-${c}`);
        }
      }
    });
    return occupiedCells;
  }, [stickyNotes]);  
  
  const clearAllNotes = useCallback(() => {
    setStickyNotes([]);
    setSelectedNoteId(null);
  }, []);
  
  const setIsResizingCallback = useCallback((value: boolean) => {
    setIsResizing(value);
  }, []);
  
  const setIsMovingCallback = useCallback((value: boolean) => {
    setIsMoving(value);
  }, []);

  return {
    stickyNotes,
    selectedNoteId,
    isResizing,
    isMoving,
    createStickyNote,
    updateStickyNote,
    deleteStickyNote,
    selectNote,
    getStickyNoteOccupiedCells,
    clearAllNotes,
    setIsResizing: setIsResizingCallback,
    setIsMoving: setIsMovingCallback,
    notesCount: stickyNotes.length
  };
};

export default useStickyNotesManager;
