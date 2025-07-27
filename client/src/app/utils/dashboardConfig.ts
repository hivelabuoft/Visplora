import londonConfig from '../components/dashboards/london.json';

export interface DashboardElement {
  view_id: string;
  title: string;
  view_type: string;
  variable_map: Record<string, any>;
  layout_group: string;
}

export interface InteractionLog {
  elementId: string;
  elementName: string;
  elementType: string;
  action: string;
  timestamp: string;
  metadata?: any;
  dashboardConfig?: DashboardElement;
  chartData?: any; // New field for chart data
}

// Lightweight interaction log for capture (without timestamp/metadata)
export interface CaptureInteractionLog {
  elementId: string;
  elementName: string;
  elementType: string;
  action: string;
  dashboardConfig?: DashboardElement;
  chartData?: any;
}

// Global array to store interactions for capture
export const captureInteractions: CaptureInteractionLog[] = [];

/**
 * Find dashboard element configuration by view_id
 */
export function findDashboardElement(viewId: string): DashboardElement | null {
  const element = londonConfig.find(item => item.view_id === viewId);
  return element || null;
}

/**
 * Enhanced interaction logger that includes dashboard configuration AND chart data
 */
export function logInteractionWithConfig(
  elementId: string,
  elementName: string,
  elementType: string,
  action: string,
  metadata?: any,
  chartData?: any // New parameter for chart data
): InteractionLog {
  // Find the corresponding dashboard configuration
  const dashboardConfig = findDashboardElement(elementId);
  
  const interactionLog: InteractionLog = {
    elementId,
    elementName,
    elementType,
    action,
    timestamp: new Date().toISOString(),
    metadata,
    dashboardConfig: dashboardConfig || undefined,
    chartData: chartData || undefined // Include chart data
  };

  // Store lightweight version for capture (without timestamp and metadata)
  const captureLog: CaptureInteractionLog = {
    elementId,
    elementName,
    elementType,
    action,
    dashboardConfig: dashboardConfig || undefined,
    chartData: chartData || undefined
  };
  
  // Add to capture array
  captureInteractions.push(captureLog);

  // Only log the basic interaction details to console (no verbose logging)
  console.log(`🎯 ${elementName} - ${action}`, { elementId, chartData: chartData ? 'included' : 'none' });

  return interactionLog;
}

/**
 * Get all dashboard elements by layout group
 */
export function getDashboardElementsByGroup(group: string): DashboardElement[] {
  return londonConfig.filter(item => item.layout_group === group);
}

/**
 * Get all available layout groups
 */
export function getLayoutGroups(): string[] {
  const groups = londonConfig.map(item => item.layout_group);
  return [...new Set(groups)];
}

/**
 * Capture and log all accumulated interactions, then clear the array
 */
export function captureAndLogInteractions(): CaptureInteractionLog[] {
  const snapshot = [...captureInteractions];

  console.log('🎯 Captured Interactions:', snapshot);
  console.groupEnd();
  
  // Clear the array after capture
  captureInteractions.length = 0;
  
  return snapshot;
}

/**
 * Clear all captured interactions without logging
 */
export function clearCapturedInteractions(): void {
  captureInteractions.length = 0;
  console.log('🧹 Cleared captured interactions');
}

/**
 * Get current count of captured interactions
 */
export function getCapturedInteractionCount(): number {
  return captureInteractions.length;
}
