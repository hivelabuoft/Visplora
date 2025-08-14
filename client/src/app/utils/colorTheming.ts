/**
 * Color Theming System for Visplora
 * 
 * This module provides a comprehensive color theming system that extracts
 * colors from the London dashboard and creates standardized palettes for
 * all AI-generated Vega-Lite visualizations.
 */

// === LONDON DASHBOARD BRAND COLORS ===
// These are the primary brand colors used throughout the London dashboard
export const LONDON_BRAND_COLORS = {
  // Primary theme colors from London dashboard
  primary: '#2B7A9B',      // Main teal blue used for headings and primary elements
  secondary: '#4A6A7B',    // Muted blue-gray used for secondary text
  accent: '#ef9f56',       // Orange accent color (found in CSS)
  
  // Extended palette from dashboard UI
  highlight: '#8B5CF6',    // Purple for selections and highlights
  highlightAlt: '#A855F7', // Lighter purple for hover states
  
  // Text colors
  textPrimary: '#2B7A9B',
  textSecondary: '#4A6A7B',
  textMuted: '#888',
  
  // Background and neutral colors
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  border: '#e2e8f0',
  neutral: '#cacaca',
};

// === CHART COLOR PALETTES ===
// Professional color palettes derived from the London dashboard theme

/**
 * Primary categorical palette - for categorical data visualization
 * Based on London dashboard's purple-blue theme with professional variations
 */
export const CATEGORICAL_PALETTE = [
  '#2B7A9B',  // Primary teal (London brand)
  '#8B5CF6',  // Purple (dashboard highlight)
  '#3B82F6',  // Bright blue
  '#06B6D4',  // Cyan blue
  '#ef9f56',  // Orange accent
  '#1E40AF',  // Dark blue
  '#7C3AED',  // Deep purple
  '#0EA5E9',  // Sky blue
  '#22c55e',  // Green (for positive values)
  '#ef4444',  // Red (for negative/warning values)
];

/**
 * Sequential palette - for quantitative data with single hue progression
 * Light to dark progression using London's primary teal
 */
export const SEQUENTIAL_PALETTE = {
  teal: [
    '#f0fdfa',  // Very light teal
    '#ccfbf1',  // Light teal
    '#99f6e4',  // Medium light teal
    '#5eead4',  // Medium teal
    '#2dd4bf',  // Bright teal
    '#14b8a6',  // Strong teal
    '#0d9488',  // Dark teal
    '#0f766e',  // Darker teal
    '#134e4a',  // Very dark teal
  ],
  purple: [
    '#faf5ff',  // Very light purple
    '#f3e8ff',  // Light purple
    '#e9d5ff',  // Medium light purple
    '#d8b4fe',  // Medium purple
    '#c084fc',  // Bright purple
    '#a855f7',  // Strong purple
    '#9333ea',  // Dark purple
    '#7c3aed',  // Darker purple
    '#6b21b6',  // Very dark purple
  ],
  blue: [
    '#eff6ff',  // Very light blue
    '#dbeafe',  // Light blue
    '#bfdbfe',  // Medium light blue
    '#93c5fd',  // Medium blue
    '#60a5fa',  // Bright blue
    '#3b82f6',  // Strong blue
    '#2563eb',  // Dark blue
    '#1d4ed8',  // Darker blue
    '#1e3a8a',  // Very dark blue
  ],
};

/**
 * Diverging palette - for data that has a meaningful center point
 * Uses London's teal and a contrasting warm color
 */
export const DIVERGING_PALETTE = {
  tealOrange: [
    '#ef9f56',  // Orange (negative extreme)
    '#fbbf24',  // Light orange
    '#fed7aa',  // Very light orange
    '#fef3c7',  // Cream
    '#f8fafc',  // Neutral (center)
    '#e0f2fe',  // Very light teal
    '#a7f3d0',  // Light teal
    '#5eead4',  // Medium teal
    '#2B7A9B',  // Teal (positive extreme)
  ],
  purpleGreen: [
    '#8B5CF6',  // Purple (negative extreme)
    '#a78bfa',  // Light purple
    '#c4b5fd',  // Very light purple
    '#e0e7ff',  // Very light blue
    '#f8fafc',  // Neutral (center)
    '#dcfce7',  // Very light green
    '#bbf7d0',  // Light green
    '#86efac',  // Medium green
    '#22c55e',  // Green (positive extreme)
  ],
};

/**
 * Semantic color palette - for specific meanings (status, alerts, etc.)
 */
export const SEMANTIC_COLORS = {
  success: '#22c55e',     // Green
  warning: '#f59e0b',     // Amber
  error: '#ef4444',       // Red
  info: '#3b82f6',        // Blue
  neutral: '#6b7280',     // Gray
  
  // Traffic light system for heatmaps and performance indicators
  high: '#22c55e',        // Green (good performance)
  medium: '#f59e0b',      // Amber (moderate performance)
  low: '#ef4444',         // Red (poor performance)
  
  // Data quality indicators
  complete: '#22c55e',    // Green (complete data)
  partial: '#f59e0b',     // Amber (partial data)
  missing: '#ef4444',     // Red (missing data)
};

// === TYPOGRAPHY AND STYLING ===
/**
 * Typography settings that match the London dashboard
 */
export const TYPOGRAPHY = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  titleFont: 'Inter, system-ui, -apple-system, sans-serif',
  
  fontSize: {
    small: 10,
    normal: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    title: 20,
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

/**
 * Standard chart dimensions that work well with the London dashboard layout
 */
export const CHART_DIMENSIONS = {
  small: { width: 280, height: 200 },
  medium: { width: 400, height: 280 },
  large: { width: 600, height: 400 },
  dashboard: { width: 280, height: 200 }, // For dashboard grid layouts
  standalone: { width: 500, height: 350 }, // For standalone charts
};

// === UTILITY FUNCTIONS ===

/**
 * Get a color palette based on the type of visualization and data
 */
export function getColorPalette(
  type: 'categorical' | 'sequential' | 'diverging' | 'semantic',
  variant?: string,
  count?: number
): string[] {
  switch (type) {
    case 'categorical':
      return count ? CATEGORICAL_PALETTE.slice(0, count) : CATEGORICAL_PALETTE;
    
    case 'sequential':
      const seqVariant = variant as keyof typeof SEQUENTIAL_PALETTE || 'teal';
      const seqPalette = SEQUENTIAL_PALETTE[seqVariant] || SEQUENTIAL_PALETTE.teal;
      return count ? seqPalette.slice(0, count) : seqPalette;
    
    case 'diverging':
      const divVariant = variant as keyof typeof DIVERGING_PALETTE || 'tealOrange';
      return DIVERGING_PALETTE[divVariant] || DIVERGING_PALETTE.tealOrange;
    
    case 'semantic':
      return Object.values(SEMANTIC_COLORS);
    
    default:
      return CATEGORICAL_PALETTE;
  }
}

/**
 * Get color based on data value and range for heatmaps
 */
export function getHeatmapColor(value: number, min: number, max: number): string {
  const ratio = (value - min) / (max - min);
  
  if (ratio <= 0.33) return SEMANTIC_COLORS.low;
  if (ratio <= 0.66) return SEMANTIC_COLORS.medium;
  return SEMANTIC_COLORS.high;
}

/**
 * Get color for positive/negative values
 */
export function getChangeColor(value: number): string {
  return value >= 0 ? SEMANTIC_COLORS.success : SEMANTIC_COLORS.error;
}

/**
 * Generate a Vega-Lite color scale configuration
 */
export function createVegaColorScale(
  type: 'categorical' | 'sequential' | 'diverging',
  variant?: string
): object {
  const colors = getColorPalette(type, variant);
  
  switch (type) {
    case 'categorical':
      return {
        type: 'ordinal',
        range: colors,
      };
    
    case 'sequential':
      return {
        type: 'linear',
        range: colors,
        interpolate: 'hcl',
      };
    
    case 'diverging':
      return {
        type: 'linear',
        range: colors,
        interpolate: 'hcl',
        domainMid: 0,
      };
    
    default:
      return {
        type: 'ordinal',
        range: colors,
      };
  }
}

/**
 * Get the complete Vega-Lite theme configuration
 */
export function getVegaTheme(): object {
  return {
    background: LONDON_BRAND_COLORS.background,
    font: TYPOGRAPHY.fontFamily,
    
    // Axis styling
    axis: {
      labelFont: TYPOGRAPHY.fontFamily,
      titleFont: TYPOGRAPHY.fontFamily,
      labelFontSize: TYPOGRAPHY.fontSize.small,
      titleFontSize: TYPOGRAPHY.fontSize.normal,
      labelColor: LONDON_BRAND_COLORS.textMuted,
      titleColor: LONDON_BRAND_COLORS.textSecondary,
      gridColor: LONDON_BRAND_COLORS.border,
      tickColor: LONDON_BRAND_COLORS.border,
      domainColor: LONDON_BRAND_COLORS.border,
      gridOpacity: 0.5,
      tickSize: 4,
      labelPadding: 4,
      titlePadding: 8,
    },
    
    // Legend styling
    legend: {
      labelFont: TYPOGRAPHY.fontFamily,
      titleFont: TYPOGRAPHY.fontFamily,
      labelFontSize: TYPOGRAPHY.fontSize.small,
      titleFontSize: TYPOGRAPHY.fontSize.normal,
      labelColor: LONDON_BRAND_COLORS.textMuted,
      titleColor: LONDON_BRAND_COLORS.textSecondary,
      symbolSize: 80,
      symbolType: 'square',
      cornerRadius: 2,
      padding: 8,
    },
    
    // Title styling
    title: {
      font: TYPOGRAPHY.fontFamily,
      fontSize: TYPOGRAPHY.fontSize.large,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      color: LONDON_BRAND_COLORS.textPrimary,
      anchor: 'start',
      offset: 12,
    },
    
    // Mark defaults
    mark: {
      tooltip: true,
    },
    
    // Range configurations for different chart types
    range: {
      category: CATEGORICAL_PALETTE,
      ordinal: SEQUENTIAL_PALETTE.teal,
      heatmap: SEQUENTIAL_PALETTE.teal,
      diverging: DIVERGING_PALETTE.tealOrange,
    },
  };
}

/**
 * Apply London dashboard styling to a Vega-Lite specification
 */
export function applyLondonTheme(spec: any): any {
  return {
    ...spec,
    config: {
      ...getVegaTheme(),
      ...spec.config,
    },
    background: LONDON_BRAND_COLORS.background,
  };
}

// Export everything for easy access
export default {
  LONDON_BRAND_COLORS,
  CATEGORICAL_PALETTE,
  SEQUENTIAL_PALETTE,
  DIVERGING_PALETTE,
  SEMANTIC_COLORS,
  TYPOGRAPHY,
  CHART_DIMENSIONS,
  getColorPalette,
  getHeatmapColor,
  getChangeColor,
  createVegaColorScale,
  getVegaTheme,
  applyLondonTheme,
};
