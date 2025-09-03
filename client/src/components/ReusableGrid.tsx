'use client';

import React from 'react';

// Grid configuration options
export const GRID_CONFIGS = {
  'travel-dashboard': {
    columns: 8,
    rows: 8,
    gap: 4,
    rowSizes: ['100px', 'repeat(3, 100px)', 'repeat(6, 80px)'],
    containerStyle: {
      width: '100%',
      backgroundColor: '#E3F2FA',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    className: 'travel-dashboard p-6 rounded-lg text-[#1A3C4A]'
  },
  'london-dashboard': {
    columns: 8,
    rows: 6,
    gap: 4,
    rowSizes: ['80px', '280px', '200px', '180px'],
    containerStyle: {
      width: '100%',
      backgroundColor: '#F0F4F8',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    className: 'london-dashboard p-6 rounded-lg text-[#2C3E50]'
  },
  'default': {
    columns: 4,
    rows: 4,
    gap: 4,
    rowSizes: ['repeat(4, 1fr)'],
    containerStyle: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    className: 'default-dashboard p-4 rounded-lg'
  }
} as const;

// Custom grid configuration interface
interface CustomGridConfig {
  columns: number;
  rows: number;
  gap: number;
  rowSizes: string[];
  containerStyle: React.CSSProperties;
  className: string;
}

interface ReusableGridProps {
  config: keyof typeof GRID_CONFIGS | 'custom';
  customConfig?: CustomGridConfig;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  loadingState?: React.ReactNode;
  isLoading?: boolean;
}

const ReusableGrid: React.FC<ReusableGridProps> = ({
  config,
  customConfig,
  children,
  className = '',
  style = {},
  loadingState,
  isLoading = false
}) => {
  // Use custom config if provided, otherwise use predefined config
  const gridConfig = config === 'custom' 
    ? customConfig 
    : GRID_CONFIGS[config as keyof typeof GRID_CONFIGS];
  
  if (!gridConfig) {
    throw new Error('Grid configuration is required. Provide either a valid config key or customConfig.');
  }
  
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
    gridTemplateRows: gridConfig.rowSizes.join(' '),
    gap: `${gridConfig.gap * 0.25}rem`, // Convert to rem (gap-4 = 1rem)
    overflow: 'hidden',
    ...gridConfig.containerStyle,
    ...style
  };

  const containerClasses = `${gridConfig.className} ${className}`.trim();

  if (isLoading && loadingState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        {loadingState}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} style={gridStyle}>
      {children}
    </div>
  );
};

export default ReusableGrid;