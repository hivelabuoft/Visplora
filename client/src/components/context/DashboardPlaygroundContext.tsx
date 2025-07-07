'use client';

import { createContext, useContext } from 'react';

// Context for dashboard playground operations
export interface DashboardPlaygroundContextType {
  activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  activateElementSelectionMode: ((noteId: string) => void) | undefined;
  isElementSelectionMode: boolean;
  noteToLink: string | null;
  linkNoteToElement: ((noteId: string, elementId: string) => void) | undefined;
  isElementLinked: ((elementId: string) => boolean) | undefined;
  getLinkedElementInfo: ((noteId: string) => { elementId: string; type: 'automatic' | 'manual' } | null) | undefined;
  setHoveredElementId: (elementId: string | null) => void;
  // Manual connection drag functionality
  onConnectionDragStart?: (
    elementId: string, 
    type: 'element' | 'note' | 'ai-assistant', 
    position: 'top' | 'right' | 'bottom' | 'left',
    x: number,
    y: number
  ) => void;
  isDragging: boolean;
  isValidDropTarget: (elementId: string, type: 'element' | 'note' | 'ai-assistant') => boolean;
  // Element dragging functionality
  onElementDragStart?: (elementId: string, elementName: string, elementType: string, x: number, y: number) => void;
  isElementDragging: boolean;
  disablePanning: (disabled: boolean) => void;
}

export const DashboardPlaygroundContext = createContext<DashboardPlaygroundContextType | undefined>(undefined);

export const useDashboardPlayground = () => {
  const context = useContext(DashboardPlaygroundContext);
  if (!context) {
    throw new Error('useDashboardPlayground must be used within a DashboardPlayground');
  }
  return context;
};

// Additional interfaces
export interface DashboardPlaygroundProps {
  children: React.ReactNode;
  isActive: boolean;
  dashboardTitle?: string;
  dashboardType?: string;
  onAddToCanvas?: () => void;
  hrData?: any[]; // HRData type
  onApplyFilters?: (filters: {
    department?: string;
    jobRole?: string;
    gender?: string;
    showOnlyAttrition?: boolean;
  }) => void;
}

export interface DroppedElement {
  id: string;
  elementId: string;
  elementName: string;
  elementType: string;
  position: { x: number; y: number };
  gridPosition: { row: number; col: number };
  size: { width: number; height: number };
  vegaSpec?: any; // Optional vega spec for AI-generated charts
}

export interface DragState {
  id: string;
  type: 'element' | 'note' | 'ai-assistant';
  position: 'top' | 'right' | 'bottom' | 'left';
  x: number;
  y: number;
}

export interface ElementDragData {
  elementId: string;
  elementName: string;
  elementType: string;
  startX: number;
  startY: number;
}
