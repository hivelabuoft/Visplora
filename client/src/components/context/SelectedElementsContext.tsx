'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SelectedElement {
  id: string;
  name: string;
  type: string;
  description: string;
  dashboardSource: string;
  fields: string[];
  filterContext?: any; // Store filter context for widgets
  metadata: {
    createdAt: Date;
    filterContext?: any;
  };
}

interface SelectedElementsContextType {
  selectedElements: SelectedElement[];
  addElement: (element: SelectedElement) => void;
  removeElement: (id: string) => void;
  clearElements: () => void;
  isElementSelected: (id: string) => boolean;
}

const SelectedElementsContext = createContext<SelectedElementsContextType | undefined>(undefined);

export const useSelectedElements = () => {
  const context = useContext(SelectedElementsContext);
  if (!context) {
    throw new Error('useSelectedElements must be used within a SelectedElementsProvider');
  }
  return context;
};

export const SelectedElementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('visplora-selected-elements');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const elementsWithDates = parsed.map((el: any) => ({
          ...el,
          metadata: {
            ...el.metadata,
            createdAt: new Date(el.metadata.createdAt)
          }
        }));
        setSelectedElements(elementsWithDates);
      }
    } catch (error) {
      console.error('Error loading selected elements from localStorage:', error);
    }
  }, []);
  // Save to localStorage whenever selectedElements changes
  useEffect(() => {
    try {
      const lightweightElements = selectedElements.map(el => ({
        id: el.id,
        name: el.name,
        type: el.type,
        description: el.description,
        dashboardSource: el.dashboardSource,
        fields: el.fields,
        filterContext: el.filterContext,
        metadata: el.metadata
      }));
      
      localStorage.setItem('visplora-selected-elements', JSON.stringify(lightweightElements));    } catch (error) {
      console.error('Error saving selected elements to localStorage:', error);
      
      // If quota exceeded, try to save only the most recent elements
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          const recentElements = selectedElements.slice(-3); // Keep only last 3 elements
          const lightweightElements = recentElements.map(el => ({
            id: el.id,
            name: el.name,
            type: el.type,
            description: el.description,
            dashboardSource: el.dashboardSource,
            fields: el.fields,
            filterContext: el.filterContext,
            metadata: el.metadata
          }));
          
          localStorage.setItem('visplora-selected-elements', JSON.stringify(lightweightElements));
          
          // Update state to match what was saved
          setSelectedElements(recentElements);
          
          console.warn('LocalStorage quota exceeded. Reduced to most recent 3 elements.');
        } catch (secondError) {
          console.error('Failed to save even reduced elements:', secondError);
          // Clear storage if all else fails
          localStorage.removeItem('visplora-selected-elements');
        }
      }
    }
  }, [selectedElements]);

  const addElement = (element: SelectedElement) => {
    setSelectedElements(prev => {
      // Check if element already exists
      const exists = prev.some(el => el.id === element.id);
      if (exists) {
        return prev; // Don't add duplicate
      }
      return [...prev, element];
    });
  };

  const removeElement = (id: string) => {
    setSelectedElements(prev => prev.filter(el => el.id !== id));
  };

  const clearElements = () => {
    setSelectedElements([]);
  };

  const isElementSelected = (id: string) => {
    return selectedElements.some(el => el.id === id);
  };

  return (
    <SelectedElementsContext.Provider value={{
      selectedElements,
      addElement,
      removeElement,
      clearElements,
      isElementSelected
    }}>
      {children}
    </SelectedElementsContext.Provider>
  );
};
