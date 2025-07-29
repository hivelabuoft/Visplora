import React from 'react';
import { logInteractionWithConfig } from './dashboardConfig';

interface HoverState {
  elementId: string;
  elementName: string;
  elementType: string;
  timeoutId: NodeJS.Timeout | null;
  isHovering: boolean;
}

/**
 * Targeted Hover Tracking for Meaningful Chart Interactions
 * 
 * This system tracks only meaningful hover interactions that trigger UI changes
 * or reveal additional information, such as:
 * - Hovering on chart data points to show tooltips
 * - Hovering on map regions to highlight areas
 * - Hovering on pie chart segments to show details
 * - Hovering on interactive buttons that change state
 * 
 * It does NOT track general container hovers.
 */
class HoverTracker {
  private hoverStates: Map<string, HoverState> = new Map();
  private readonly HOVER_THRESHOLD = 1000; // Reduced to 1 second for meaningful interactions

  /**
   * Log an immediate interactive hover (for buttons, selectors, etc.)
   */
  logInteractiveHover(elementId: string, elementName: string, elementType: string, interactionDetails: any, chartData?: any, currBorough?: string, currLSOA?: string): void {
    logInteractionWithConfig(elementId, elementName, elementType, 'interactive_hover', {
      description: `Interactive hover on ${elementName}`,
      interactionType: 'immediate',
      ...interactionDetails
    }, chartData, currBorough, currLSOA);
  }

  /**
   * Start tracking meaningful hover for chart elements that may show tooltips
   */
  startMeaningfulHover(elementId: string, elementName: string, elementType: string, metadata?: any, chartData?: any, currBorough?: string, currLSOA?: string): void {
    // Clear any existing hover state for this element
    this.endHover(elementId);

    const timeoutId = setTimeout(() => {
      // Log the meaningful hover interaction
      logInteractionWithConfig(elementId, elementName, elementType, 'chart_exploration_hover', {
        description: `Explored ${elementName} via sustained hover`,
        hoverDuration: this.HOVER_THRESHOLD,
        interactionType: 'exploration',
        ...metadata
      }, chartData, currBorough, currLSOA);

      // Mark as captured
      const state = this.hoverStates.get(elementId);
      if (state) {
        state.isHovering = true;
      }
    }, this.HOVER_THRESHOLD);

    this.hoverStates.set(elementId, {
      elementId,
      elementName,
      elementType,
      timeoutId,
      isHovering: false
    });
  }

  /**
   * End tracking hover for an element
   */
  endHover(elementId: string): void {
    const state = this.hoverStates.get(elementId);
    if (state) {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
      this.hoverStates.delete(elementId);
    }
  }

  /**
   * Check if element is currently being hovered
   */
  isHovering(elementId: string): boolean {
    const state = this.hoverStates.get(elementId);
    return state?.isHovering || false;
  }

  /**
   * Clear all hover states
   */
  clearAll(): void {
    for (const [elementId] of this.hoverStates) {
      this.endHover(elementId);
    }
  }
}

// Global hover tracker instance
export const hoverTracker = new HoverTracker();

/**
 * React hook for meaningful chart exploration hovers
 * Use this for charts where users hover to explore data (show tooltips, etc.)
 */
export function useChartExplorationHover(elementId: string, elementName: string, elementType: string, chartData?: any, currBorough?: string, currLSOA?: string) {
  const handleMouseEnter = (metadata?: any) => {
    hoverTracker.startMeaningfulHover(elementId, elementName, elementType, metadata, chartData, currBorough, currLSOA);
  };

  const handleMouseLeave = () => {
    hoverTracker.endHover(elementId);
  };

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  };
}

/**
 * Function to log interactive hovers immediately (for buttons, selectors, etc.)
 */
export function logInteractiveHover(elementId: string, elementName: string, elementType: string, interactionDetails: any, chartData?: any, currBorough?: string, currLSOA?: string) {
  hoverTracker.logInteractiveHover(elementId, elementName, elementType, interactionDetails, chartData, currBorough, currLSOA);
}
