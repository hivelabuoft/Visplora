'use client';

import { useState, useCallback } from 'react';
import { AIAssistantData } from './ai-chat-assistant';

export const useAIAssistantManager = (dashboardTitle: string) => {
  const [aiAssistant, setAiAssistant] = useState<AIAssistantData | null>(null);

  const createAIAssistant = useCallback((row: number, col: number, cellSize: number) => {
    // Only allow one AI assistant per dashboard
    if (aiAssistant) return;

    const x = col * cellSize;
    const y = row * cellSize;

    const newAssistant: AIAssistantData = {
      id: `ai-assistant-${Date.now()}`,
      row,
      col,
      x,
      y,
      width: 500, // Fixed width in pixels
      height: 350, // Fixed height in pixels
      createdAt: Date.now(),
      connectedElements: [],
      chatHistory: [],
      showContext: false
    };

    setAiAssistant(newAssistant);
  }, [aiAssistant]);

  const updateAIAssistant = useCallback((assistantId: string, updates: Partial<AIAssistantData>) => {
    setAiAssistant(prev => {
      if (!prev || prev.id !== assistantId) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const deleteAIAssistant = useCallback(() => {
    setAiAssistant(null);
  }, []);

  const addConnectionToAssistant = useCallback((elementId: string, type: 'element' | 'note' | 'ai-assistant', data: any) => {
    setAiAssistant(prev => {
      if (!prev) return prev;
      
      // Don't allow AI assistant to connect to itself or other AI assistants
      if (type === 'ai-assistant') return prev;
      
      // Check if already connected
      const alreadyConnected = prev.connectedElements.some(el => el.id === elementId && el.type === type);
      if (alreadyConnected) return prev;

      return {
        ...prev,
        connectedElements: [
          ...prev.connectedElements,
          { id: elementId, type, data }
        ]
      };
    });
  }, []);

  const removeConnectionFromAssistant = useCallback((elementId: string, type: 'element' | 'note' | 'ai-assistant') => {
    setAiAssistant(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        connectedElements: prev.connectedElements.filter(
          el => !(el.id === elementId && el.type === type)
        )
      };
    });
  }, []);

  const hasAIAssistant = useCallback(() => {
    return aiAssistant !== null;
  }, [aiAssistant]);

  return {
    aiAssistant,
    createAIAssistant,
    updateAIAssistant,
    deleteAIAssistant,
    addConnectionToAssistant,
    removeConnectionFromAssistant,
    hasAIAssistant
  };
};
