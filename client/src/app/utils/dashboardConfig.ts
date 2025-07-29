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
  currBorough?: string; // Current selected borough (dashboard=1 only)
  currLSOA?: string; // Current selected LSOA (dashboard=1 only)
}

// Lightweight interaction log for capture (without timestamp/metadata)
export interface CaptureInteractionLog {
  elementId: string;
  elementName: string;
  elementType: string;
  action: string;
  dashboardConfig?: DashboardElement;
  chartData?: any;
  currBorough?: string; // Current selected borough (dashboard=1 only)
  currLSOA?: string; // Current selected LSOA (dashboard=1 only)
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
  chartData?: any, // Chart data parameter
  currBorough?: string, // Current borough context (dashboard=1 only)
  currLSOA?: string // Current LSOA context (dashboard=1 only)
): InteractionLog {
  // Check if we should include borough/LSOA context
  const isDashboard1 = process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD === '1';
  
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

  // Add borough/LSOA context only for dashboard=1
  if (isDashboard1) {
    if (currBorough) {
      interactionLog.currBorough = currBorough;
    }
    if (currLSOA) {
      interactionLog.currLSOA = currLSOA;
    }
  }

  // Store lightweight version for capture (without timestamp and metadata)
  const captureLog: CaptureInteractionLog = {
    elementId,
    elementName,
    elementType,
    action,
    dashboardConfig: dashboardConfig || undefined,
    chartData: chartData || undefined
  };
  
  // Add borough/LSOA context to capture log only for dashboard=1
  if (isDashboard1) {
    if (currBorough) {
      captureLog.currBorough = currBorough;
    }
    if (currLSOA) {
      captureLog.currLSOA = currLSOA;
    }
  }
  
  // Add to capture array
  captureInteractions.push(captureLog);

  // Only log the basic interaction details to console (no verbose logging)
  const contextInfo = isDashboard1 ? ` [Borough: ${currBorough || 'none'}, LSOA: ${currLSOA || 'none'}]` : '';
  console.log(`🎯 ${elementName} - ${action}${contextInfo}`, { elementId, chartData: chartData ? 'included' : 'none' });

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
 * Capture and log the last 5 interactions, then clear all interactions
 */
export function captureAndLogInteractions(): CaptureInteractionLog[] {
  // Get only the last 5 interactions
  const last5Interactions = captureInteractions.slice(-5);
  const snapshot = [...last5Interactions];

  // console.log(`🎯 Captured Last 5 Interactions (out of ${captureInteractions.length} total):`, snapshot);
  // console.groupEnd();
  
  // Clear all interactions after capture
  captureInteractions.length = 0;
  // console.log('🧹 All interaction logs cleared after capture');
  
  return snapshot;
}

/**
 * Clear all captured interactions without logging
 */
export function clearCapturedInteractions(): void {
  captureInteractions.length = 0;
  // console.log('🧹 Cleared captured interactions');
}

/**
 * Get current count of captured interactions
 */
export function getCapturedInteractionCount(): number {
  return captureInteractions.length;
}
