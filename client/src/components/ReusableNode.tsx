'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import VegaLite and Vega to avoid SSR issues
const VegaLite = dynamic(() => import('react-vega').then(mod => ({ default: mod.VegaLite })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading chart...</div>
});

const Vega = dynamic(() => import('react-vega').then(mod => ({ default: mod.Vega })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading chart...</div>
});

// Size configuration mapping
export const NODE_SIZES = {
  'xsmall': { colSpan: 1, rowSpan: 1 },
  'small': { colSpan: 2, rowSpan: 1 },
  'medium': { colSpan: 2, rowSpan: 2 },
  'large': { colSpan: 3, rowSpan: 2 },
  'xlarge': { colSpan: 3, rowSpan: 3 },
  'wide': { colSpan: 4, rowSpan: 1 },
  'tall': { colSpan: 2, rowSpan: 3 },
  'fullwidth': { colSpan: 8, rowSpan: 1 },
  'fullHeight': { colSpan: 1, rowSpan: 8 }
} as const;

// Chart positioning presets
export const CHART_POSITIONS = {
  'left-4-bottom-0': 'absolute left-4 bottom-0',
  'left-6-bottom-0': 'absolute left-6 bottom-0', 
  'bottom-0-right-4': 'absolute bottom-0 right-4',
  'center': 'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2',
  'full': 'absolute top-9 left-2 right-2 bottom-2 rounded-lg overflow-hidden', // Match travel page positioning
  'custom': ''
} as const;

interface FilterOption {
  label: string;
  value: any;
  displayName?: string; // Custom display name for the button
}

interface ReusableNodeProps {
  // Layout & Sizing
  size: keyof typeof NODE_SIZES;
  
  // Content
  title: string;
  description?: string;
  dynamicTitle?: string;
  subtitle?: string;
  
  // Chart/Visualization  
  chartType: 'vega-lite' | 'vega' | 'kpi' | 'map' | 'custom';
  vegaSpec?: any;
  vegaRenderer?: 'canvas' | 'svg';
  chartData?: any[];
  chartColors?: string[];
  chartLegends?: boolean;
  chartLegendsExtra?: any;
  showActions?: boolean;
  signalListeners?: Record<string, (name: string, value: any) => void>;
  
  // KPI-Specific
  kpiValue?: number | string;
  kpiUnit?: string;
  kpiTrend?: 'positive' | 'negative' | 'neutral';
  kpiIcon?: React.ReactNode | string;
  secondaryMetric?: { value: string | number, label: string, color?: string };
  
  // Interactive Elements
  hasFieldFilter?: boolean;
  fieldFilterKey?: string; // The key to pass to onFilterChange
  filterOptions?: FilterOption[];
  selectedFilter?: any; // Currently selected filter value
  buttons?: Array<{ label: string, onClick: () => void, style?: string }>;
  onFilterChange?: (key: string, value: any) => void;
  isUpdating?: boolean; // New prop for showing update state
  
  // Data Conditions
  dataCondition?: boolean;
  fallbackContent?: React.ReactNode;
  
  // Positioning
  chartPosition?: keyof typeof CHART_POSITIONS;
  customChartStyle?: React.CSSProperties;
  
  // Special Features
  showMeanValue?: boolean;
  tooltipText?: string;
  hasLegend?: boolean;
  legendPosition?: 'top-right' | 'bottom' | 'custom';
  
  // Additional props
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ReusableNode: React.FC<ReusableNodeProps> = ({
  size,
  title,
  description,
  dynamicTitle,
  subtitle,
  chartType,
  vegaSpec,
  vegaRenderer = 'svg',
  chartData = [],
  chartColors,
  chartLegends = true,
  chartLegendsExtra,
  showActions = false,
  signalListeners,
  kpiValue,
  kpiUnit,
  kpiTrend,
  kpiIcon,
  secondaryMetric,
  hasFieldFilter,
  fieldFilterKey = 'filter',
  filterOptions = [],
  selectedFilter,
  buttons = [],
  onFilterChange,
  isUpdating = false, // New prop with default value
  dataCondition = true,
  fallbackContent,
  chartPosition = 'left-4-bottom-0',
  customChartStyle,
  showMeanValue,
  tooltipText,
  className = '',
  style,
  children
}) => {
  const sizeConfig = NODE_SIZES[size];
  const positionClass = CHART_POSITIONS[chartPosition];
  
  // Apply size classes
  const containerClasses = `
    relative bg-white rounded-lg p-4 shadow-sm border border-gray-200 overflow-hidden
    col-span-${sizeConfig.colSpan} row-span-${sizeConfig.rowSpan}
    ${className}
  `.trim();

  // Render KPI content
  const renderKPIContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
          {dynamicTitle || title}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-800">
            {kpiValue}
          </div>
          {kpiUnit && (
            <div className="text-[12px] text-blue-600 font-medium">
              {kpiUnit}
            </div>
          )}
        </div>
        {kpiIcon && (
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            {typeof kpiIcon === 'string' ? (
              <span className="text-[10px] text-green-600 font-bold">{kpiIcon}</span>
            ) : (
              kpiIcon
            )}
          </div>
        )}
        {secondaryMetric && (
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">
              {secondaryMetric.value}
            </div>
            <div className={`text-[10px] ${secondaryMetric.color || 'text-gray-500'}`}>
              {secondaryMetric.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render chart content
  const renderChartContent = () => {
    if (!dataCondition && fallbackContent) {
      return fallbackContent;
    }

    if (!dataCondition) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          No data available
        </div>
      );
    }

    // For map charts, ensure proper containment similar to travel page
    const isMapChart = chartType === 'vega' && vegaSpec && (
      vegaSpec.data?.url?.includes('countries') || 
      vegaSpec.marks?.some((mark: any) => mark.type === 'geoshape') ||
      vegaSpec.mark?.type === 'geoshape'
    );

    const chartStyle = customChartStyle || { width: '100%', height: '100%' };
    
    switch (chartType) {
      case 'vega-lite':
        return (
          <VegaLite 
            spec={vegaSpec}
            actions={showActions}
            renderer={vegaRenderer}
            style={chartStyle}
            signalListeners={signalListeners}
          />
        );
      case 'vega':
        return (
          <Vega 
            spec={vegaSpec}
            actions={showActions}
            renderer={vegaRenderer}
            style={chartStyle}
            signalListeners={signalListeners}
          />
        );
      case 'custom':
        return children;
      default:
        return null;
    }
  };

  // Render header with filters and controls
  const renderHeader = () => (
    <>
        <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700" style={{color: '#2B7A9B'}}>
            {dynamicTitle || title}
            </div>
            {subtitle && (
                <div className="text-xs text-gray-400">
                {subtitle}
            </div>
            )}
        </div>
      
        {/* Controls */}
        {description && (
            <div className={`text-xs text-gray-500 ${hasFieldFilter && filterOptions.length > 0 ? 'mb-2' : 'mb-1'}`}>
            {description}
            </div>
        )}    
        {/* Field Filter Buttons */}
        {hasFieldFilter && filterOptions.length > 0 && (
            <div className="flex gap-1 mb-3 mt-1">
            {filterOptions.map((option, index) => {
                const isSelected = selectedFilter === option.value;
                const displayText = option.displayName || option.label;
                
                return (
                    <button
                    key={option.value || index}
                    className={`
                    px-2 py-1 text-[10px] rounded transition-colors duration-200
                    ${isSelected 
                        ? 'bg-purple-600 text-white shadow-sm font-medium hover:bg-purple-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                    ${typeof option.value === 'number' || !isNaN(Number(option.value))
                        ? 'min-w-[32px] text-center'
                        : ''
                    }
                    `}
                    onClick={() => onFilterChange?.(fieldFilterKey, option.value)}
                >
                    {displayText}
                </button>
                );
            })}
            </div>
        )}
        
        {buttons.map((button, index) => (
            <button
            key={index}
            className={button.style || "text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"}
            onClick={button.onClick}
            >
            {button.label}
          </button>
        ))}
    </>
  );

  // Render mean value display
  const renderMeanValue = () => {
    if (!showMeanValue || !chartData.length) return null;
    
    // Calculate mean based on chartData structure
    const meanValue = chartData.reduce((sum, item) => {
      // Assume the main value field - adjust based on actual data structure
      const value = item.value || item.visitors || item.arrivals || 0;
      return sum + value;
    }, 0) / chartData.length;

    return (
      <div className="absolute top-4 right-4 text-right">
        <div className="text-xs text-gray-500">Mean</div>
        <div className="text-sm font-semibold text-gray-700">
          {meanValue > 1000000 
            ? `${(meanValue / 1000000).toFixed(1)}M`
            : meanValue > 1000 
            ? `${(meanValue / 1000).toFixed(1)}K`
            : Math.round(meanValue)
          }
        </div>
      </div>
    );
  };

  return (
    <div 
      className={containerClasses}
      style={style}
      title={tooltipText}
    >
      {chartType === 'kpi' ? (
        renderKPIContent()
      ) : (
        <>
          {renderHeader()}
          {renderMeanValue()}
          
          {/* Chart Container */}
          <div 
            className={chartPosition === 'custom' ? '' : 
              hasFieldFilter && filterOptions.length > 0 
                ? positionClass.replace('top-9', 'top-16') 
                : positionClass
            }
            style={chartPosition === 'custom' ? customChartStyle : undefined}
          >
            {renderChartContent()}
          </div>
          
          {/* Update Overlay */}
          {isUpdating && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <div className="text-sm text-gray-600 font-medium">Updating chart...</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReusableNode;