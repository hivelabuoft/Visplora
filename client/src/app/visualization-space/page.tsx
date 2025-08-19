'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LinkableCard } from '@/components/ui/card-linkable';
import { createBoroughMapSpec } from '@/chartTemplates/spatial/maps';
import { renderDonut } from '@/chartTemplates/partToWhole/pieAndTreemap';
import { renderLine, renderMultiLine, renderCombo } from '@/chartTemplates/changeOverTime/lineCharts';
import { renderBarChart, renderGroupedBarChart, renderStackedBarChart, renderDivergentBarChart } from '@/chartTemplates/rankingComparison/barCharts';

// Dynamically import VegaLite to avoid SSR issues
const VegaLite = dynamic(() => import('react-vega').then(mod => ({ default: mod.VegaLite })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading chart...</div>
});

// Memoized VegaLite wrapper
const MemoizedVegaLite = React.memo(({ spec, actions = false, signalListeners, style, renderer }: any) => {
  return <VegaLite spec={spec} actions={actions} signalListeners={signalListeners} style={style} renderer={renderer} />;
});

// Size configurations based on the London dashboard analysis  
const SIZE_CONFIGS = {
  small: {
    name: 'Small (1x1)',
    className: 'col-span-1 row-span-1',
    gridSize: { cols: 1, rows: 1 },
    width: 200,
    height: 150,
    aspectRatio: 'aspect-square'
  },
  medium: {
    name: 'Medium (2x2)', 
    className: 'col-span-2 row-span-2',
    gridSize: { cols: 2, rows: 2 },
    width: 350,
    height: 250,
    aspectRatio: 'aspect-square'
  },
  large: {
    name: 'Large (3x3)',
    className: 'col-span-3 row-span-3', 
    gridSize: { cols: 3, rows: 3 },
    width: 500,
    height: 350,
    aspectRatio: 'aspect-[3/3]'
  }
};

type SizeType = keyof typeof SIZE_CONFIGS;
type ChartTypeCategory = string;
type ChartType = string;

// London Boroughs list for borough map selection
const LONDON_BOROUGHS = [
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney', 'Hammersmith and Fulham',
  'Haringey', 'Harrow', 'Havering', 'Hillingdon', 'Hounslow', 'Islington',
  'Kensington and Chelsea', 'Kingston upon Thames', 'Lambeth', 'Lewisham',
  'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames', 'Southwark',
  'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster'
];

// Function to randomly select boroughs
const getRandomBoroughs = (count: number = Math.floor(Math.random() * 3) + 1): string[] => {
  const shuffled = [...LONDON_BOROUGHS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

interface ComponentData {
  id: string;
  size: SizeType;
  chartCategory: ChartTypeCategory;
  chartType: ChartType;
  gridPosition: string;
  elementName: string;
  elementType: string;
  selectedBoroughs?: string[]; // For borough maps
  vegaLiteSpec?: any; // For storing the actual chart specification
  donutDataType?: '2d' | '3d'; // For donut charts
  donutDimensions?: string[]; // Available dimensions for 3D donut charts
  selectedDimension?: string; // Current dimension for 3D donut charts
  lineDataType?: '2d' | '3d'; // For line charts
  lineDimensions?: string[]; // Available dimensions for 3D line charts
  lineSelectedDimension?: string; // Current dimension for 3D line charts
  smallMultiplesLineDataType?: '2d' | '3d'; // For small_multiples_line charts
  smallMultiplesLineDimensions?: string[]; // Available dimensions for 3D small_multiples_line charts
  smallMultiplesLineSelectedDimension?: string; // Current dimension for 3D small_multiples_line charts
  comboBarLineDataType?: '2d' | '3d'; // For combo_bar_line charts
  comboBarLineDimensions?: string[]; // Available dimensions for 3D combo_bar_line charts
  comboBarLineSelectedDimension?: string; // Current dimension for 3D combo_bar_line charts
  barDataType?: '2d' | '3d'; // For bar charts
  barDimensions?: string[]; // Available dimensions for 3D bar charts
  barSelectedDimension?: string; // Current dimension for 3D bar charts
  barChartType?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both'; // Bar chart variation type
  groupedBarDataType?: '2d' | '3d'; // For grouped bar charts
  groupedBarDimensions?: string[]; // Available dimensions for 3D grouped bar charts
  groupedBarSelectedDimension?: string; // Current dimension for 3D grouped bar charts
  groupedBarChartType?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both'; // Grouped bar chart variation type
  stackedBarDataType?: '2d' | '3d'; // For stacked bar charts
  stackedBarDimensions?: string[]; // Available dimensions for 3D stacked bar charts
  stackedBarSelectedDimension?: string; // Current dimension for 3D stacked bar charts
  stackedBarChartType?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both'; // Stacked bar chart variation type
  divergentBarDataType?: '2d' | '3d'; // For divergent bar charts
  divergentBarDimensions?: string[]; // Available dimensions for 3D divergent bar charts
  divergentBarSelectedDimension?: string; // Current dimension for 3D divergent bar charts
  divergentBarChartType?: 'simple' | 'with_mean' | 'with_threshold' | 'with_both' | 'comparison'; // Divergent bar chart variation type
}

// Generate visual preview for different chart types
const getChartPreview = (chartType: string, size: SizeType, selectedBoroughs?: string[]) => {
  const isSmall = size === 'small';
  const isMedium = size === 'medium';
  const isLarge = size === 'large';
  
  const baseSize = isSmall ? 'w-16 h-16' : isMedium ? 'w-24 h-24' : 'w-32 h-32';
  
  // Special handling for borough maps
  if (chartType === 'boroughMap') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <svg className={`${baseSize} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          {selectedBoroughs && selectedBoroughs.length > 0 && (
            <>
              <circle cx="12" cy="8" r="1" fill="currentColor" />
              <circle cx="8" cy="12" r="1" fill="currentColor" />
              <circle cx="16" cy="14" r="1" fill="currentColor" />
            </>
          )}
        </svg>
        {selectedBoroughs && selectedBoroughs.length > 0 && !isSmall && (
          <div className="text-xs text-gray-600 mt-1 text-center">
            {selectedBoroughs.length} selected
          </div>
        )}
      </div>
    );
  }
  
  switch (chartType) {
    case 'line':
      return (
        <svg className={`${baseSize} text-blue-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l6 6 4-4 8 8M3 21l6-6 4 4 8-8" />
          <circle cx="9" cy="9" r="2" fill="currentColor" />
          <circle cx="13" cy="13" r="2" fill="currentColor" />
          <circle cx="21" cy="5" r="2" fill="currentColor" />
        </svg>
      );
    
    case 'small_multiples_line':
      return (
        <svg className={`${baseSize} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4l6 3 4-2 8 4" stroke="#3B82F6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l6 2 4-3 8 6" stroke="#8B5CF6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l6 1 4-1 8 2" stroke="#06B6D4" />
          <circle cx="9" cy="7" r="1.5" fill="#3B82F6" />
          <circle cx="13" cy="5" r="1.5" fill="#3B82F6" />
          <circle cx="21" cy="8" r="1.5" fill="#3B82F6" />
          <circle cx="9" cy="10" r="1.5" fill="#8B5CF6" />
          <circle cx="13" cy="7" r="1.5" fill="#8B5CF6" />
          <circle cx="21" cy="14" r="1.5" fill="#8B5CF6" />
        </svg>
      );
    
    case 'multiline':
      return (
        <svg className={`${baseSize} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4l6 3 4-2 8 4" stroke="#3B82F6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l6 2 4-3 8 6" stroke="#8B5CF6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l6 1 4-1 8 2" stroke="#06B6D4" />
          <circle cx="9" cy="7" r="1.5" fill="#3B82F6" />
          <circle cx="13" cy="5" r="1.5" fill="#3B82F6" />
          <circle cx="21" cy="8" r="1.5" fill="#3B82F6" />
          <circle cx="9" cy="10" r="1.5" fill="#8B5CF6" />
          <circle cx="13" cy="7" r="1.5" fill="#8B5CF6" />
          <circle cx="21" cy="14" r="1.5" fill="#8B5CF6" />
        </svg>
      );
    
    case 'bar':
    case 'grouped_bar':
    case 'stacked_bar':
    case 'grouped_bar_with_filter':
      return (
        <svg className={`${baseSize} text-green-400`} fill="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="8" width="3" height="13" rx="1" />
          <rect x="8" y="4" width="3" height="17" rx="1" />
          <rect x="13" y="12" width="3" height="9" rx="1" />
          <rect x="18" y="6" width="3" height="15" rx="1" />
        </svg>
      );
    
    case 'area':
      return (
        <svg className={`${baseSize} text-purple-400`} fill="currentColor" opacity="0.6" viewBox="0 0 24 24">
          <path d="M3 21l6-6 4 4 8-8v11H3z" />
          <path fill="none" stroke="currentColor" strokeWidth="2" d="M3 15l6-6 4 4 8-8" />
        </svg>
      );
    
    case 'scatter':
    case 'bubble':
      return (
        <svg className={`${baseSize} text-orange-400`} fill="currentColor" viewBox="0 0 24 24">
          <circle cx="6" cy="18" r="2" />
          <circle cx="12" cy="10" r="2.5" />
          <circle cx="18" cy="14" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="14" cy="18" r="1" />
        </svg>
      );
    
    case 'donut':
      return (
        <svg className={`${baseSize} text-pink-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="4" strokeDasharray="12 6 8 4 6 2" strokeDashoffset="0" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      );
    
    case 'heatmap':
      return (
        <svg className={`${baseSize} text-red-400`} fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="4" height="4" opacity="0.8" />
          <rect x="7" y="2" width="4" height="4" opacity="0.4" />
          <rect x="12" y="2" width="4" height="4" opacity="0.9" />
          <rect x="17" y="2" width="4" height="4" opacity="0.3" />
          <rect x="2" y="7" width="4" height="4" opacity="0.6" />
          <rect x="7" y="7" width="4" height="4" opacity="0.9" />
          <rect x="12" y="7" width="4" height="4" opacity="0.2" />
          <rect x="17" y="7" width="4" height="4" opacity="0.7" />
          <rect x="2" y="12" width="4" height="4" opacity="0.3" />
          <rect x="7" y="12" width="4" height="4" opacity="0.8" />
          <rect x="12" y="12" width="4" height="4" opacity="0.5" />
          <rect x="17" y="12" width="4" height="4" opacity="0.9" />
        </svg>
      );
    
    case 'histogram':
      return (
        <svg className={`${baseSize} text-indigo-400`} fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="16" width="2" height="6" />
          <rect x="5" y="12" width="2" height="10" />
          <rect x="8" y="8" width="2" height="14" />
          <rect x="11" y="10" width="2" height="12" />
          <rect x="14" y="6" width="2" height="16" />
          <rect x="17" y="14" width="2" height="8" />
          <rect x="20" y="18" width="2" height="4" />
        </svg>
      );
    
    case 'boxplot':
      return (
        <svg className={`${baseSize} text-teal-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="8" width="12" height="8" strokeWidth="1.5" />
          <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" />
          <line x1="12" y1="4" x2="12" y2="8" strokeWidth="1" />
          <line x1="12" y1="16" x2="12" y2="20" strokeWidth="1" />
          <line x1="10" y1="4" x2="14" y2="4" strokeWidth="1" />
          <line x1="10" y1="20" x2="14" y2="20" strokeWidth="1" />
        </svg>
      );
    
    case 'slope':
      return (
        <svg className={`${baseSize} text-cyan-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="12" strokeWidth="2" />
          <line x1="4" y1="10" x2="20" y2="8" strokeWidth="2" />
          <line x1="4" y1="14" x2="20" y2="16" strokeWidth="2" />
          <circle cx="4" cy="6" r="2" fill="currentColor" />
          <circle cx="4" cy="10" r="2" fill="currentColor" />
          <circle cx="4" cy="14" r="2" fill="currentColor" />
          <circle cx="20" cy="8" r="2" fill="currentColor" />
          <circle cx="20" cy="12" r="2" fill="currentColor" />
          <circle cx="20" cy="16" r="2" fill="currentColor" />
        </svg>
      );
    
    case 'dumbbell':
      return (
        <svg className={`${baseSize} text-yellow-400`} fill="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" />
          <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
          <circle cx="4" cy="6" r="2" />
          <circle cx="20" cy="6" r="2" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="20" cy="12" r="2" />
          <circle cx="4" cy="18" r="2" />
          <circle cx="20" cy="18" r="2" />
        </svg>
      );
    
    case 'dot_plot':
      return (
        <svg className={`${baseSize} text-rose-400`} fill="currentColor" viewBox="0 0 24 24">
          <circle cx="8" cy="4" r="1.5" />
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="16" cy="8" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="18" cy="12" r="1.5" />
          <circle cx="6" cy="14" r="1.5" />
          <circle cx="14" cy="16" r="1.5" />
          <circle cx="11" cy="18" r="1.5" />
          <circle cx="20" cy="20" r="1.5" />
        </svg>
      );
    
    case 'combo_bar_line':
      return (
        <svg className={`${baseSize} text-emerald-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="13" width="3" height="8" fill="#2B7A9B" opacity="0.7" />
          <rect x="8" y="11" width="3" height="10" fill="#2B7A9B" opacity="0.7" />
          <rect x="13" y="15" width="3" height="6" fill="#2B7A9B" opacity="0.7" />
          <rect x="18" y="9" width="3" height="12" fill="#2B7A9B" opacity="0.7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 7l6 2 4-3 6 1" stroke="#8B5CF6" />
          <circle cx="4.5" cy="7" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <circle cx="10.5" cy="9" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <circle cx="14.5" cy="6" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <circle cx="20.5" cy="7" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
        </svg>
      );
    
    case 'combo':
      return (
        <svg className={`${baseSize} text-emerald-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="13" width="3" height="8" fill="#2B7A9B" opacity="0.7" />
          <rect x="8" y="11" width="3" height="10" fill="#2B7A9B" opacity="0.7" />
          <rect x="13" y="15" width="3" height="6" fill="#2B7A9B" opacity="0.7" />
          <rect x="18" y="9" width="3" height="12" fill="#2B7A9B" opacity="0.7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 7l6 2 4-3 6 1" stroke="#8B5CF6" />
          <circle cx="4.5" cy="7" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <circle cx="10.5" cy="9" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <circle cx="14.5" cy="6" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <circle cx="20.5" cy="7" r="2" fill="white" stroke="#8B5CF6" strokeWidth="2" />
        </svg>
      );

    
    case 'boroughMap':
      return (
        <svg className={`${baseSize} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
        </svg>
      );
    
    default:
      return (
        <svg className={`${baseSize} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 9l6 6M15 9l-6 6" />
        </svg>
      );
  }
};

// Custom Node Component using LinkableCard
const ChartNode = ({ data }: { data: ComponentData }) => {
  const sizeConfig = SIZE_CONFIGS[data.size];
  const [currentDimension, setCurrentDimension] = React.useState(data.selectedDimension || '2022');
  const [currentVegaSpec, setCurrentVegaSpec] = React.useState(data.vegaLiteSpec);
  
  const handleAddToSidebar = (elementId: string, elementName: string, elementType: string) => {
    console.log(`Added to sidebar: ${elementName} (${elementId})`);
    // Add your sidebar logic here
  };

  // Handle dimension change for 3D donut charts
  const handleDimensionChange = (newDimension: string) => {
    if (data.chartType === 'donut' && data.donutDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const donutParams = {
        charttitle: "Sample Donut Chart",
        description: "Interactive donut chart showing data distribution by category",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        dimension: "Year",
        size: data.size
      };
      
      const donutResult = renderDonut(donutParams);
      if (typeof donutResult === 'object' && 'getSpec' in donutResult && donutResult.getSpec) {
        const newSpec = donutResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'line' && data.lineDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const lineParams = {
        charttitle: "Sample Line Chart",
        description: "Interactive line chart showing data trends over time",
        categories: { csv: "/dataset/sample/time.csv", column: "Year" },
        metric: "Value",
        dimension: "Category",
        size: data.size
      };
      
      const lineResult = renderLine(lineParams);
      if (typeof lineResult === 'object' && 'getSpec' in lineResult && lineResult.getSpec) {
        const newSpec = lineResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'small_multiples_line' && data.smallMultiplesLineDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const multiLineParams = {
        charttitle: "Sample Multi-Line Chart",
        description: "Interactive multi-line chart showing multiple series over time",
        categories: { csv: "/dataset/sample/time.csv", column: "Year" },
        metric: "Value",
        seriesField: "Series",
        dimension: "Category",
        size: data.size
      };
      
      const multiLineResult = renderMultiLine(multiLineParams);
      if (typeof multiLineResult === 'object' && 'getSpec' in multiLineResult && multiLineResult.getSpec) {
        const newSpec = multiLineResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'combo_bar_line' && data.comboBarLineDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const comboParams = {
        charttitle: "Sample Combo Chart",
        description: "Interactive combo chart with bars and line overlay",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        barMetric: "Count",
        lineMetric: "Rate",
        dimension: "Analysis",
        size: data.size
      };
      
      const comboResult = renderCombo(comboParams);
      if (typeof comboResult === 'object' && 'getSpec' in comboResult && comboResult.getSpec) {
        const newSpec = comboResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'bar' && data.barDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const barParams = {
        charttitle: "Sample Bar Chart",
        description: "Interactive bar chart for ranking comparisons",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        dimension: "Analysis",
        size: data.size,
        type: data.barChartType || 'simple',
        orientation: 'horizontal' as const
      };
      
      const barResult = renderBarChart(barParams);
      if (typeof barResult === 'object' && 'getSpec' in barResult && barResult.getSpec) {
        const newSpec = barResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'grouped_bar' && data.groupedBarDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const groupedBarParams = {
        charttitle: "Sample Grouped Bar Chart",
        description: "Interactive grouped bar chart for comparative ranking",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        seriesField: "Series",
        dimension: "Analysis",
        size: data.size,
        type: data.groupedBarChartType || 'simple',
        orientation: 'horizontal' as const
      };
      
      const groupedBarResult = renderGroupedBarChart(groupedBarParams);
      if (typeof groupedBarResult === 'object' && 'getSpec' in groupedBarResult && groupedBarResult.getSpec) {
        const newSpec = groupedBarResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'stacked_bar' && data.stackedBarDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const stackedBarParams = {
        charttitle: "Sample Stacked Bar Chart",
        description: "Interactive stacked bar chart showing part-to-whole relationships",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        seriesField: "Series",
        dimension: "Analysis",
        size: data.size,
        type: data.stackedBarChartType || 'simple',
        orientation: 'horizontal' as const
      };
      
      const stackedBarResult = renderStackedBarChart(stackedBarParams);
      if (typeof stackedBarResult === 'object' && 'getSpec' in stackedBarResult && stackedBarResult.getSpec) {
        const newSpec = stackedBarResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    } else if (data.chartType === 'divergent_bar' && data.divergentBarDataType === '3d') {
      setCurrentDimension(newDimension);
      
      // Regenerate the spec with new dimension
      const divergentBarParams = {
        charttitle: "Sample Divergent Bar Chart",
        description: "Interactive divergent bar chart for comparative analysis",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        positiveMetric: "Count2022",
        negativeMetric: "Count2023",
        dimension: "Analysis",
        size: data.size,
        type: 'simple' as const,
        orientation: 'horizontal' as const,
        comparisonYears: ['2022', '2023'] as [string, string]
      };
      
      const divergentBarResult = renderDivergentBarChart(divergentBarParams);
      if (typeof divergentBarResult === 'object' && 'getSpec' in divergentBarResult && divergentBarResult.getSpec) {
        const newSpec = divergentBarResult.getSpec(newDimension);
        setCurrentVegaSpec(newSpec);
      }
    }
  };

  // Render charts with VegaLite specs
  const renderChart = () => {
    // For 3D donut charts, show dimension switching UI
    if (data.chartType === 'donut' && data.donutDataType === '3d' && data.donutDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.donutDimensions.map(dimension => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded-md transition-colors ${
                  currentDimension === dimension
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ fontSize: data.size === 'small' ? '10px' : '12px' }}
                title={dimension} // Show full text on hover
              >
                {data.size === 'small' 
                  ? (dimension.length > 6 ? dimension.substring(0, 6) + '...' : dimension)
                  : data.size === 'medium'
                  ? (dimension.length > 10 ? dimension.substring(0, 10) + '...' : dimension)
                  : (dimension.length > 12 ? dimension.substring(0, 12) + '...' : dimension)
                }
              </button>
            ))}
          </div>
          
          {/* Chart container */}
          <div className="flex-1 flex items-center justify-center -mt-1">
            <VegaLite
              style={{
                minHeight: data.size === 'small' ? '70px' : data.size === 'medium' ? '140px' : '200px',
                maxHeight: data.size === 'small' ? '90px' : data.size === 'medium' ? '160px' : '230px'
              }}
              spec={currentVegaSpec}
              actions={false}
            />
          </div>
        </div>
      );
    }
    
    // For 3D line charts, show dimension switching UI
    if (data.chartType === 'line' && data.lineDataType === '3d' && data.lineDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.lineDimensions.map(dimension => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded-md transition-colors ${
                  currentDimension === dimension
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ fontSize: data.size === 'small' ? '10px' : '12px' }}
                title={dimension} // Show full text on hover
              >
                {data.size === 'small' 
                  ? (dimension.length > 6 ? dimension.substring(0, 6) + '...' : dimension)
                  : data.size === 'medium'
                  ? (dimension.length > 10 ? dimension.substring(0, 10) + '...' : dimension)
                  : (dimension.length > 12 ? dimension.substring(0, 12) + '...' : dimension)
                }
              </button>
            ))}
          </div>
          
          {/* Chart container */}
          <div className="flex-1 flex items-center justify-center -mt-1">
            <VegaLite
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '70px' : data.size === 'medium' ? '120px' : '170px'
              }}
              spec={currentVegaSpec}
              actions={false}
            />
          </div>
        </div>
      );
    }
    
    // For 3D small multiples line charts, show dimension switching UI
    if (data.chartType === 'small_multiples_line' && data.smallMultiplesLineDataType === '3d' && data.smallMultiplesLineDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.smallMultiplesLineDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded-md transition-colors ${
                  currentDimension === dimension
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ fontSize: data.size === 'small' ? '10px' : '12px' }}
                title={dimension} // Show full text on hover
              >
                {data.size === 'small' 
                  ? (dimension.length > 6 ? dimension.substring(0, 6) + '...' : dimension)
                  : data.size === 'medium'
                  ? (dimension.length > 10 ? dimension.substring(0, 10) + '...' : dimension)
                  : (dimension.length > 12 ? dimension.substring(0, 12) + '...' : dimension)
                }
              </button>
            ))}
          </div>
          
          {/* Chart container */}
          <div className="flex-1 flex items-center justify-center -mt-1">
            <VegaLite
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '70px' : data.size === 'medium' ? '120px' : '170px'
              }}
              spec={currentVegaSpec}
              actions={false}
            />
          </div>
        </div>
      );
    }
    
    // For 3D combo bar-line charts, show dimension switching UI
    if (data.chartType === 'combo_bar_line' && data.comboBarLineDataType === '3d' && data.comboBarLineDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.comboBarLineDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded-md transition-colors ${
                  currentDimension === dimension
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ fontSize: data.size === 'small' ? '10px' : '12px' }}
                title={dimension} // Show full text on hover
              >
                {data.size === 'small' 
                  ? (dimension.length > 6 ? dimension.substring(0, 6) + '...' : dimension)
                  : data.size === 'medium'
                  ? (dimension.length > 10 ? dimension.substring(0, 10) + '...' : dimension)
                  : (dimension.length > 12 ? dimension.substring(0, 12) + '...' : dimension)
                }
              </button>
            ))}
          </div>
          
          {/* Chart container */}
          <div className="flex-1 flex items-center justify-center -mt-1">
            <VegaLite
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '70px' : data.size === 'medium' ? '120px' : '170px'
              }}
              spec={currentVegaSpec}
              actions={false}
            />
          </div>
        </div>
      );
    }
    
    // For 3D bar charts, show dimension switching UI
    if (data.chartType === 'bar' && data.barDataType === '3d' && data.barDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.barDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded-md transition-colors ${
                  currentDimension === dimension
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ fontSize: data.size === 'small' ? '10px' : '12px' }}
                title={dimension} // Show full text on hover
              >
                {data.size === 'small' 
                  ? (dimension.length > 6 ? dimension.substring(0, 6) + '...' : dimension)
                  : data.size === 'medium'
                  ? (dimension.length > 10 ? dimension.substring(0, 10) + '...' : dimension)
                  : (dimension.length > 12 ? dimension.substring(0, 12) + '...' : dimension)
                }
              </button>
            ))}
          </div>
          
          {/* Chart container */}
          <div className="flex-1 flex items-center justify-center -mt-1">
            <VegaLite
              style={{
                minHeight: data.size === 'small' ? '60px' : data.size === 'medium' ? '120px' : '180px',
                maxHeight: data.size === 'small' ? '80px' : data.size === 'medium' ? '140px' : '200px'
              }}
              spec={currentVegaSpec}
              actions={false}
            />
          </div>
        </div>
      );
    }
    
    // For 3D grouped bar charts, show dimension switching UI
    if (data.chartType === 'grouped_bar' && data.groupedBarDataType === '3d' && data.groupedBarDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.groupedBarDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded ${
                  currentDimension === dimension
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {dimension}
              </button>
            ))}
          </div>
          
          {/* Chart */}
          <div className="flex-1">
            <MemoizedVegaLite 
              spec={currentVegaSpec} 
              renderer='svg'
              actions={false}
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '80px' : data.size === 'medium' ? '150px' : '220px'
              }}
            />
          </div>
        </div>
      );
    }

    // For 3D stacked bar charts, show dimension switching UI
    if (data.chartType === 'stacked_bar' && data.stackedBarDataType === '3d' && data.stackedBarDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.stackedBarDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded ${
                  currentDimension === dimension
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {dimension}
              </button>
            ))}
          </div>
          
          {/* Chart */}
          <div className="flex-1">
            <MemoizedVegaLite 
              spec={currentVegaSpec} 
              renderer='svg'
              actions={false}
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '80px' : data.size === 'medium' ? '150px' : '220px'
              }}
            />
          </div>
        </div>
      );
    }
    
    // For 3D stacked bar charts, show dimension switching UI
    if (data.chartType === 'stacked_bar' && data.stackedBarDataType === '3d' && data.stackedBarDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.stackedBarDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded ${
                  currentDimension === dimension
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {dimension}
              </button>
            ))}
          </div>
          
          {/* Chart */}
          <div className="flex-1">
            <MemoizedVegaLite 
              spec={currentVegaSpec} 
              renderer='svg'
              actions={false}
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '80px' : data.size === 'medium' ? '150px' : '220px'
              }}
            />
          </div>
        </div>
      );
    }
    
    // For 3D divergent bar charts, show dimension switching UI
    if (data.chartType === 'divergent_bar' && data.divergentBarDataType === '3d' && data.divergentBarDimensions) {
      return (
        <div className="w-full h-full flex-1 flex flex-col">
          {/* Dimension switching buttons */}
          <div className="flex-shrink-0 mb-0.5 flex gap-0.5 justify-center flex-wrap">
            {data.divergentBarDimensions.map((dimension: string) => (
              <button
                key={dimension}
                onClick={() => handleDimensionChange(dimension)}
                className={`px-1.5 py-0.5 text-xs rounded ${
                  currentDimension === dimension
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {dimension}
              </button>
            ))}
          </div>
          
          {/* Chart */}
          <div className="flex-1">
            <MemoizedVegaLite 
              spec={currentVegaSpec} 
              renderer='svg'
              actions={false}
              style={{
                minHeight: data.size === 'small' ? '50px' : data.size === 'medium' ? '100px' : '150px',
                maxHeight: data.size === 'small' ? '80px' : data.size === 'medium' ? '150px' : '220px'
              }}
            />
          </div>
        </div>
      );
    }
    
    // For other charts with VegaLite specs (including 2D donut charts and line charts)
    if ((data.chartType === 'boroughMap' || data.chartType === 'donut' || data.chartType === 'line' || data.chartType === 'small_multiples_line' || data.chartType === 'combo_bar_line' || data.chartType === 'bar' || data.chartType === 'grouped_bar' || data.chartType === 'stacked_bar' || data.chartType === 'divergent_bar') && currentVegaSpec) {
      return (
        <div className="w-full h-full flex-1 flex items-center justify-center">
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              minHeight: (data.chartType === 'line' || data.chartType === 'small_multiples_line' || data.chartType === 'combo_bar_line' || data.chartType === 'bar' || data.chartType === 'grouped_bar' || data.chartType === 'divergent_bar')
                ? (data.size === 'small' ? '60px' : data.size === 'medium' ? '120px' : '180px')
                : (data.size === 'small' ? '100px' : data.size === 'medium' ? '180px' : '250px'),
              maxHeight: (data.chartType === 'line' || data.chartType === 'small_multiples_line' || data.chartType === 'combo_bar_line' || data.chartType === 'bar' || data.chartType === 'grouped_bar' || data.chartType === 'divergent_bar')
                ? (data.size === 'small' ? '80px' : data.size === 'medium' ? '140px' : '200px')
                : (data.size === 'small' ? '120px' : data.size === 'medium' ? '200px' : '280px')
            }}
          >
            <MemoizedVegaLite 
              spec={currentVegaSpec} 
              actions={false}
              renderer='svg'
            />
          </div>
        </div>
      );
    }
    
    // Default chart preview for other types
    return (
      <div className="flex-1 flex items-center justify-center min-h-0">
        {getChartPreview(data.chartType, data.size, data.selectedBoroughs)}
      </div>
    );
  };

  return (
    <LinkableCard
      className="bg-white border-2 border-dashed border-blue-300 rounded-lg shadow-lg hover:border-blue-500 transition-all duration-200"
      elementId={data.id}
      elementName={data.elementName}
      elementType={data.elementType}
      onAddToSidebar={handleAddToSidebar}
      styles={{
        width: `${sizeConfig.width}px`,
        height: `${sizeConfig.height}px`,
        minWidth: `${sizeConfig.width}px`,
        minHeight: `${sizeConfig.height}px`,
      }}
    >
      <div className="h-full flex flex-col p-4">
        {/* Component Header */}
        <div className="flex-shrink-0 mb-2">
          {/* Show selected boroughs for borough maps - hide for small size to save space */}
          {data.chartType === 'boroughMap' && data.selectedBoroughs && data.selectedBoroughs.length > 0 && data.size !== 'small' && (
            <div className="text-xs text-gray-500 mb-1">
              Target boroughs: {data.selectedBoroughs.join(', ')}
            </div>
          )}
        </div>
        
        {/* Visualization Preview */}
        {renderChart()}
        
      </div>
    </LinkableCard>
  );
};

// Define node types
const nodeTypes: NodeTypes = {
  chartNode: ChartNode,
};

const VisualizationSpace: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<SizeType>('medium');
  const [selectedChartCategory, setSelectedChartCategory] = useState<ChartTypeCategory>('');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('');
  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>([]);
  const [chartTypes, setChartTypes] = useState<any>({});
  const [nextId, setNextId] = useState(1);
  
  // Donut chart configuration
  const [donutDataType, setDonutDataType] = useState<'2d' | '3d'>('2d');
  const [selectedDimension, setSelectedDimension] = useState<string>('2022');
  
  // Line chart configuration
  const [lineDataType, setLineDataType] = useState<'2d' | '3d'>('2d');
  const [lineSelectedDimension, setLineSelectedDimension] = useState<string>('Anti-social behaviour');
  
  // Small multiples line chart configuration
  const [smallMultiplesLineDataType, setSmallMultiplesLineDataType] = useState<'2d' | '3d'>('2d');
  const [smallMultiplesLineSelectedDimension, setSmallMultiplesLineSelectedDimension] = useState<string>('Crime Type');
  
  // Combo bar-line chart configuration
  const [comboBarLineDataType, setComboBarLineDataType] = useState<'2d' | '3d'>('2d');
  const [comboBarLineSelectedDimension, setComboBarLineSelectedDimension] = useState<string>('By Region');
  
  // Bar chart configuration
  const [barDataType, setBarDataType] = useState<'2d' | '3d'>('2d');
  const [barSelectedDimension, setBarSelectedDimension] = useState<string>('Crime Type');
  const [barChartType, setBarChartType] = useState<'simple' | 'with_mean' | 'with_threshold' | 'with_both'>('simple');
  
  // Grouped Bar chart configuration
  const [groupedBarDataType, setGroupedBarDataType] = useState<'2d' | '3d'>('2d');
  const [groupedBarSelectedDimension, setGroupedBarSelectedDimension] = useState<string>('Year Comparison');
  const [groupedBarChartType, setGroupedBarChartType] = useState<'simple' | 'with_mean' | 'with_threshold' | 'with_both'>('simple');
  
  // Stacked Bar Chart state
  const [stackedBarDataType, setStackedBarDataType] = useState<'2d' | '3d'>('2d');
  const [stackedBarSelectedDimension, setStackedBarSelectedDimension] = useState<string>('Crime Categories');
  const [stackedBarChartType, setStackedBarChartType] = useState<'simple' | 'with_mean' | 'with_threshold' | 'with_both'>('simple');
  
  // Divergent Bar Chart state
  const [divergentBarDataType, setDivergentBarDataType] = useState<'2d' | '3d'>('2d');
  const [divergentBarSelectedDimension, setDivergentBarSelectedDimension] = useState<string>('Crime Comparison (2022 vs 2023)');
  const [divergentBarChartType, setDivergentBarChartType] = useState<'simple'>('simple');
  
  const [nodes, setNodes, onNodesChange] = useNodesState<ComponentData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load chart types on component mount
  React.useEffect(() => {
    fetch('/data/chart_types.json')
      .then(response => response.json())
      .then(data => {
        setChartTypes(data);
        // Set default selections
        const firstCategory = Object.keys(data)[0];
        setSelectedChartCategory(firstCategory);
        if (data[firstCategory]) {
          const firstChartType = Object.keys(data[firstCategory])[0];
          setSelectedChartType(firstChartType);
        }
      })
      .catch(error => console.error('Error loading chart types:', error));
  }, []);

  // Generate grid position based on existing components
  const generateGridPosition = (size: SizeType): string => {
    const sizeConfig = SIZE_CONFIGS[size];
    const { cols, rows } = sizeConfig.gridSize;
    
    // Simple placement algorithm - find next available position
    const gridCols = 8; // Same as London dashboard
    
    let bestPosition = null;
    let currentRow = 1;
    
    // Try to find a position that doesn't overlap with existing components
    while (currentRow <= 8 && !bestPosition) {
      for (let col = 1; col <= gridCols - cols + 1; col++) {
        const position = {
          colStart: col,
          colEnd: col + cols,
          rowStart: currentRow,
          rowEnd: currentRow + rows
        };
        
        // Check if this position overlaps with any existing component
        const overlaps = nodes.some(node => {
          const existingPos = parseGridPosition(node.data.gridPosition);
          return !(position.colEnd <= existingPos.colStart || 
                  position.colStart >= existingPos.colEnd ||
                  position.rowEnd <= existingPos.rowStart ||
                  position.rowStart >= existingPos.rowEnd);
        });
        
        if (!overlaps) {
          bestPosition = position;
          break;
        }
      }
      currentRow++;
    }
    
    // If no position found, place at the end
    if (!bestPosition) {
      bestPosition = {
        colStart: 1,
        colEnd: 1 + cols,
        rowStart: currentRow,
        rowEnd: currentRow + rows
      };
    }
    
    return `col-start-${bestPosition.colStart} col-end-${bestPosition.colEnd} row-start-${bestPosition.rowStart} row-end-${bestPosition.rowEnd}`;
  };

  // Helper function to parse grid position string
  const parseGridPosition = (gridPosition: string) => {
    const parts = gridPosition.split(' ');
    const colStart = parseInt(parts[0].split('-')[2]);
    const colEnd = parseInt(parts[1].split('-')[2]);
    const rowStart = parseInt(parts[2].split('-')[2]);
    const rowEnd = parseInt(parts[3].split('-')[2]);
    
    return { colStart, colEnd, rowStart, rowEnd };
  };

  // Generate position for React Flow nodes  
  const getNodePosition = (index: number, size: SizeType) => {
    const sizeConfig = SIZE_CONFIGS[size];
    const cols = 3; // Number of columns in flow layout
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const padding = 50;
    const x = col * (sizeConfig.width + padding);
    const y = row * (sizeConfig.height + padding);
    
    return { x, y };
  };

  // Handle adding a new component
  const handleAddComponent = useCallback(() => {
    if (!selectedChartCategory || !selectedChartType) return;
    
    const gridPosition = generateGridPosition(selectedSize);
    const sizeConfig = SIZE_CONFIGS[selectedSize];
    
    // Handle special chart types that need VegaLite specs
    let boroughsToUse = selectedBoroughs;
    let vegaSpec = null;
    let donutDimensions: string[] = [];
    let lineDimensions: string[] = [];
    
    if (selectedChartType === 'boroughMap') {
      // If no boroughs are selected, randomly select some
      if (selectedBoroughs.length === 0) {
        boroughsToUse = getRandomBoroughs();
      }
      
      // Create Vega-Lite spec for borough map
      vegaSpec = createBoroughMapSpec(
        "data/londonBoroughs.json",
        {
          title: "London Borough Map",
          width: sizeConfig.width - 40, // Account for padding
          height: sizeConfig.height - 100, // Account for padding and header
          colors: ['#E5E7EB', '#3B82F6', '#1E40AF'], // gray, blue, dark blue
          strokeWidth: 2,
          strokeColor: '#374151'
        },
        boroughsToUse // Pass the array of selected boroughs
      );
    } else if (selectedChartType === 'donut') {
      // Create Vega-Lite spec for donut chart
      const donutParams = {
        charttitle: "Sample Donut Chart",
        description: "Interactive donut chart showing data distribution by category",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        dimension: donutDataType === '3d' ? "Year" : undefined,
        size: selectedSize
      };
      
      const donutResult = renderDonut(donutParams);
      
      if (donutDataType === '3d' && typeof donutResult === 'object' && 'getSpec' in donutResult && donutResult.getSpec) {
        // 3D donut chart
        vegaSpec = donutResult.getSpec(selectedDimension);
        donutDimensions = donutResult.dimensions || [];
      } else {
        // 2D donut chart
        vegaSpec = donutResult;
      }
    } else if (selectedChartType === 'line') {
      // Create Vega-Lite spec for line chart
      const lineParams = {
        charttitle: "Sample Line Chart",
        description: "Interactive line chart showing data trends over time",
        categories: { csv: "/dataset/sample/time.csv", column: "Year" },
        metric: "Value",
        dimension: lineDataType === '3d' ? "Category" : undefined,
        size: selectedSize
      };
      
      const lineResult = renderLine(lineParams);
      
      if (lineDataType === '3d' && typeof lineResult === 'object' && 'getSpec' in lineResult && lineResult.getSpec) {
        // 3D line chart
        vegaSpec = lineResult.getSpec(lineSelectedDimension);
        lineDimensions = lineResult.dimensions || [];
      } else {
        // 2D line chart
        vegaSpec = lineResult;
      }
    } else if (selectedChartType === 'small_multiples_line') {
      // Create Vega-Lite spec for multi-line chart
      const multiLineParams = {
        charttitle: "Sample Multi-Line Chart",
        description: "Interactive multi-line chart showing multiple series over time",
        categories: { csv: "/dataset/sample/time.csv", column: "Year" },
        metric: "Value",
        seriesField: "Series",
        dimension: smallMultiplesLineDataType === '3d' ? "Category" : undefined,
        size: selectedSize
      };
      
      const multiLineResult = renderMultiLine(multiLineParams);
      
      if (smallMultiplesLineDataType === '3d' && typeof multiLineResult === 'object' && 'getSpec' in multiLineResult && multiLineResult.getSpec) {
        // 3D multi-line chart
        vegaSpec = multiLineResult.getSpec(smallMultiplesLineSelectedDimension);
        lineDimensions = multiLineResult.dimensions || [];
      } else {
        // 2D multi-line chart
        vegaSpec = multiLineResult;
      }
    } else if (selectedChartType === 'combo_bar_line') {
      // Create Vega-Lite spec for combo chart
      const comboParams = {
        charttitle: "Sample Combo Chart",
        description: "Interactive combo chart with bars and line overlay",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        barMetric: "Count",
        lineMetric: "Rate",
        dimension: comboBarLineDataType === '3d' ? "Analysis" : undefined,
        size: selectedSize
      };
      
      const comboResult = renderCombo(comboParams);
      
      if (comboBarLineDataType === '3d' && typeof comboResult === 'object' && 'getSpec' in comboResult && comboResult.getSpec) {
        // 3D combo chart
        vegaSpec = comboResult.getSpec(comboBarLineSelectedDimension);
        lineDimensions = comboResult.dimensions || [];
      } else {
        // 2D combo chart
        vegaSpec = comboResult;
      }
    } else if (selectedChartType === 'bar') {
      // Create Vega-Lite spec for bar chart
      const barParams = {
        charttitle: "Sample Bar Chart",
        description: "Interactive bar chart for ranking comparisons",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        dimension: barDataType === '3d' ? "Analysis" : undefined,
        size: selectedSize,
        type: barChartType,
        orientation: 'horizontal' as const
      };
      
      const barResult = renderBarChart(barParams);
      
      if (barDataType === '3d' && typeof barResult === 'object' && 'getSpec' in barResult && barResult.getSpec) {
        // 3D bar chart
        vegaSpec = barResult.getSpec(barSelectedDimension);
        lineDimensions = barResult.dimensions || [];
      } else {
        // 2D bar chart
        vegaSpec = barResult;
      }
    } else if (selectedChartType === 'grouped_bar') {
      // Create Vega-Lite spec for grouped bar chart
      const groupedBarParams = {
        charttitle: "Sample Grouped Bar Chart",
        description: "Interactive grouped bar chart for comparative ranking",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        seriesField: "Series",
        dimension: groupedBarDataType === '3d' ? "Analysis" : undefined,
        size: selectedSize,
        type: groupedBarChartType,
        orientation: 'horizontal' as const
      };
      
      const groupedBarResult = renderGroupedBarChart(groupedBarParams);
      
      if (groupedBarDataType === '3d' && typeof groupedBarResult === 'object' && 'getSpec' in groupedBarResult && groupedBarResult.getSpec) {
        // 3D grouped bar chart
        vegaSpec = groupedBarResult.getSpec(groupedBarSelectedDimension);
        lineDimensions = groupedBarResult.dimensions || [];
      } else {
        // 2D grouped bar chart
        vegaSpec = groupedBarResult;
      }
    } else if (selectedChartType === 'stacked_bar') {
      // Create Vega-Lite spec for stacked bar chart
      const stackedBarParams = {
        charttitle: "Sample Stacked Bar Chart",
        description: "Interactive stacked bar chart showing part-to-whole relationships",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        metric: "Count",
        seriesField: "Series",
        dimension: stackedBarDataType === '3d' ? "Analysis" : undefined,
        size: selectedSize,
        type: stackedBarChartType,
        orientation: 'horizontal' as const
      };
      
      const stackedBarResult = renderStackedBarChart(stackedBarParams);
      
      if (stackedBarDataType === '3d' && typeof stackedBarResult === 'object' && 'getSpec' in stackedBarResult && stackedBarResult.getSpec) {
        // 3D stacked bar chart
        vegaSpec = stackedBarResult.getSpec(stackedBarSelectedDimension);
        lineDimensions = stackedBarResult.dimensions || [];
      } else {
        // 2D stacked bar chart
        vegaSpec = stackedBarResult;
      }
    } else if (selectedChartType === 'divergent_bar') {
      // Create Vega-Lite spec for divergent bar chart
      const divergentBarParams = {
        charttitle: "Sample Divergent Bar Chart",
        description: "Interactive divergent bar chart for comparative analysis",
        categories: { csv: "/dataset/sample/categories.csv", column: "Category" },
        positiveMetric: "Count2022",
        negativeMetric: "Count2023",
        dimension: divergentBarDataType === '3d' ? "Analysis" : undefined,
        size: selectedSize,
        type: 'simple' as const,
        orientation: 'horizontal' as const,
        comparisonYears: ['2022', '2023'] as [string, string]
      };
      
      const divergentBarResult = renderDivergentBarChart(divergentBarParams);
      
      if (divergentBarDataType === '3d' && typeof divergentBarResult === 'object' && 'getSpec' in divergentBarResult && divergentBarResult.getSpec) {
        // 3D divergent bar chart
        vegaSpec = divergentBarResult.getSpec(divergentBarSelectedDimension);
        lineDimensions = divergentBarResult.dimensions || [];
      } else {
        // 2D divergent bar chart
        vegaSpec = divergentBarResult;
      }
    }
    
    const componentData: ComponentData = {
      id: `component-${nextId}`,
      size: selectedSize,
      chartCategory: selectedChartCategory,
      chartType: selectedChartType,
      gridPosition,
      elementName: selectedChartType === 'boroughMap' ? 'London Borough Map' : 
                   selectedChartType === 'donut' ? 'Donut Chart' :
                   selectedChartType === 'line' ? 'Line Chart' :
                   selectedChartType === 'small_multiples_line' ? 'Multi-Line Chart' :
                   selectedChartType === 'combo_bar_line' ? 'Combo Chart' :
                   selectedChartType === 'bar' ? 'Bar Chart' :
                   selectedChartType === 'grouped_bar' ? 'Grouped Bar Chart' :
                   selectedChartType === 'stacked_bar' ? 'Stacked Bar Chart' :
                   selectedChartType === 'divergent_bar' ? 'Divergent Bar Chart' :
                   selectedChartType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      elementType: 'chart',
      selectedBoroughs: selectedChartType === 'boroughMap' ? boroughsToUse : undefined,
      vegaLiteSpec: vegaSpec,
      donutDataType: selectedChartType === 'donut' ? donutDataType : undefined,
      donutDimensions: selectedChartType === 'donut' && donutDataType === '3d' ? donutDimensions : undefined,
      selectedDimension: selectedChartType === 'donut' && donutDataType === '3d' ? selectedDimension : undefined,
      lineDataType: selectedChartType === 'line' ? lineDataType : undefined,
      lineDimensions: selectedChartType === 'line' && lineDataType === '3d' ? lineDimensions : undefined,
      lineSelectedDimension: selectedChartType === 'line' && lineDataType === '3d' ? lineSelectedDimension : undefined,
      smallMultiplesLineDataType: selectedChartType === 'small_multiples_line' ? smallMultiplesLineDataType : undefined,
      smallMultiplesLineDimensions: selectedChartType === 'small_multiples_line' && smallMultiplesLineDataType === '3d' ? lineDimensions : undefined,
      smallMultiplesLineSelectedDimension: selectedChartType === 'small_multiples_line' && smallMultiplesLineDataType === '3d' ? smallMultiplesLineSelectedDimension : undefined,
      comboBarLineDataType: selectedChartType === 'combo_bar_line' ? comboBarLineDataType : undefined,
      comboBarLineDimensions: selectedChartType === 'combo_bar_line' && comboBarLineDataType === '3d' ? lineDimensions : undefined,
      comboBarLineSelectedDimension: selectedChartType === 'combo_bar_line' && comboBarLineDataType === '3d' ? comboBarLineSelectedDimension : undefined,
      barDataType: selectedChartType === 'bar' ? barDataType : undefined,
      barDimensions: selectedChartType === 'bar' && barDataType === '3d' ? lineDimensions : undefined,
      barSelectedDimension: selectedChartType === 'bar' && barDataType === '3d' ? barSelectedDimension : undefined,
      barChartType: selectedChartType === 'bar' ? barChartType : undefined,
      groupedBarDataType: selectedChartType === 'grouped_bar' ? groupedBarDataType : undefined,
      groupedBarDimensions: selectedChartType === 'grouped_bar' && groupedBarDataType === '3d' ? lineDimensions : undefined,
      groupedBarSelectedDimension: selectedChartType === 'grouped_bar' && groupedBarDataType === '3d' ? groupedBarSelectedDimension : undefined,
      groupedBarChartType: selectedChartType === 'grouped_bar' ? groupedBarChartType : undefined,
      stackedBarDataType: selectedChartType === 'stacked_bar' ? stackedBarDataType : undefined,
      stackedBarDimensions: selectedChartType === 'stacked_bar' && stackedBarDataType === '3d' ? lineDimensions : undefined,
      stackedBarSelectedDimension: selectedChartType === 'stacked_bar' && stackedBarDataType === '3d' ? stackedBarSelectedDimension : undefined,
      stackedBarChartType: selectedChartType === 'stacked_bar' ? stackedBarChartType : undefined,
      divergentBarDataType: selectedChartType === 'divergent_bar' ? divergentBarDataType : undefined,
      divergentBarDimensions: selectedChartType === 'divergent_bar' && divergentBarDataType === '3d' ? lineDimensions : undefined,
      divergentBarSelectedDimension: selectedChartType === 'divergent_bar' && divergentBarDataType === '3d' ? divergentBarSelectedDimension : undefined,
      divergentBarChartType: selectedChartType === 'divergent_bar' ? divergentBarChartType : undefined
    };
    
    const newNode: Node<ComponentData> = {
      id: componentData.id,
      type: 'chartNode',
      position: getNodePosition(nodes.length, selectedSize),
      data: componentData,
      draggable: true,
      selectable: true,
    };
    
    setNodes((nds) => nds.concat(newNode));
    setNextId(nextId + 1);
  }, [selectedSize, selectedChartCategory, selectedChartType, selectedBoroughs, donutDataType, selectedDimension, lineDataType, lineSelectedDimension, smallMultiplesLineDataType, smallMultiplesLineSelectedDimension, comboBarLineDataType, comboBarLineSelectedDimension, barDataType, barSelectedDimension, barChartType, groupedBarDataType, groupedBarSelectedDimension, groupedBarChartType, stackedBarDataType, stackedBarSelectedDimension, stackedBarChartType, divergentBarDataType, divergentBarSelectedDimension, divergentBarChartType, nextId, nodes.length, generateGridPosition, setNodes]);

  // Handle chart category change
  const handleChartCategoryChange = (category: ChartTypeCategory) => {
    setSelectedChartCategory(category);
    if (chartTypes[category]) {
      const firstChartType = Object.keys(chartTypes[category])[0];
      setSelectedChartType(firstChartType);
      
      // Clear borough selection if not selecting boroughMap
      if (firstChartType !== 'boroughMap') {
        setSelectedBoroughs([]);
      }
      
      // Reset donut configuration if not selecting donut
      if (firstChartType !== 'donut') {
        setDonutDataType('2d');
        setSelectedDimension('2022');
      }
      
      // Reset line configuration if not selecting line
      if (firstChartType !== 'line') {
        setLineDataType('2d');
        setLineSelectedDimension('Anti-social behaviour');
      }
      
      // Reset multi-line configuration if not selecting small_multiples_line
      if (firstChartType !== 'small_multiples_line') {
        setSmallMultiplesLineDataType('2d');
        setSmallMultiplesLineSelectedDimension('Crime Type');
      }
      
      // Reset combo configuration if not selecting combo_bar_line
      if (firstChartType !== 'combo_bar_line') {
        setComboBarLineDataType('2d');
        setComboBarLineSelectedDimension('By Region');
      }
      
      // Reset bar configuration if not selecting bar
      if (firstChartType !== 'bar') {
        setBarDataType('2d');
        setBarSelectedDimension('Crime Type');
        setBarChartType('simple');
      }
      
      // Reset grouped bar configuration if not selecting grouped_bar
      if (firstChartType !== 'grouped_bar') {
        setGroupedBarDataType('2d');
        setGroupedBarSelectedDimension('Year Comparison');
        setGroupedBarChartType('simple');
      }
      
      // Reset stacked bar configuration if not selecting stacked_bar
      if (firstChartType !== 'stacked_bar') {
        setStackedBarDataType('2d');
        setStackedBarSelectedDimension('Crime Categories');
        setStackedBarChartType('simple');
      }
      
      // Reset divergent bar configuration if not selecting divergent_bar
      if (firstChartType !== 'divergent_bar') {
        setDivergentBarDataType('2d');
        setDivergentBarSelectedDimension('Crime Comparison (2022 vs 2023)');
        setDivergentBarChartType('simple');
      }
    }
    
    // Clear borough selection if not in spatial category
    if (category !== 'spatial') {
      setSelectedBoroughs([]);
    }
    
    // Reset donut configuration if not in part-to-whole category
    if (category !== 'part-to-whole') {
      setDonutDataType('2d');
      setSelectedDimension('2022');
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (chartType: ChartType) => {
    setSelectedChartType(chartType);
    
    // Clear borough selection if not borough map
    if (chartType !== 'boroughMap') {
      setSelectedBoroughs([]);
    }
    
    // Reset donut configuration if not donut chart
    if (chartType !== 'donut') {
      setDonutDataType('2d');
      setSelectedDimension('2022');
    }
    
    // Reset line configuration if not line chart
    if (chartType !== 'line') {
      setLineDataType('2d');
      setLineSelectedDimension('Anti-social behaviour');
    }
    
    // Reset multi-line configuration if not small_multiples_line chart
    if (chartType !== 'small_multiples_line') {
      setSmallMultiplesLineDataType('2d');
      setSmallMultiplesLineSelectedDimension('Crime Type');
    }
    
    // Reset combo configuration if not combo_bar_line chart
    if (chartType !== 'combo_bar_line') {
      setComboBarLineDataType('2d');
      setComboBarLineSelectedDimension('By Region');
    }
    
    // Reset bar configuration if not bar chart
    if (chartType !== 'bar') {
      setBarDataType('2d');
      setBarSelectedDimension('Crime Type');
      setBarChartType('simple');
    }
    
    // Reset grouped bar configuration if not grouped_bar chart
    if (chartType !== 'grouped_bar') {
      setGroupedBarDataType('2d');
      setGroupedBarSelectedDimension('Year Comparison');
      setGroupedBarChartType('simple');
    }
    
    // Reset stacked bar configuration if not stacked_bar chart
    if (chartType !== 'stacked_bar') {
      setStackedBarDataType('2d');
      setStackedBarSelectedDimension('Crime Categories');
      setStackedBarChartType('simple');
    }
    
    // Reset divergent bar configuration if not divergent_bar chart
    if (chartType !== 'divergent_bar') {
      setDivergentBarDataType('2d');
      setDivergentBarSelectedDimension('Crime Comparison (2022 vs 2023)');
      setDivergentBarChartType('simple');
    }
  };

  // Update existing borough map nodes when borough selection changes
  const updateBoroughMapNodes = useCallback((newBoroughs: string[]) => {
    setNodes((currentNodes) => 
      currentNodes.map((node) => {
        if (node.data.chartType === 'boroughMap') {
          // Regenerate the Vega-Lite spec with new borough selection
          const sizeConfig = SIZE_CONFIGS[node.data.size];
          const newVegaSpec = createBoroughMapSpec(
            "data/londonBoroughs.json",
            {
              title: "London Borough Map",
              width: sizeConfig.width - 40,
              height: sizeConfig.height - 100,
              colors: ['#E5E7EB', '#3B82F6', '#1E40AF'],
              strokeWidth: 2,
              strokeColor: '#374151'
            },
            newBoroughs
          );

          return {
            ...node,
            data: {
              ...node.data,
              selectedBoroughs: newBoroughs,
              vegaLiteSpec: newVegaSpec
            }
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle borough selection changes
  const handleBoroughToggle = (borough: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedBoroughs(prev => [...prev, borough]);
    } else {
      setSelectedBoroughs(prev => prev.filter(b => b !== borough));
    }
  };

  const handleClearAllBoroughs = () => {
    setSelectedBoroughs([]);
  };

  const handleRandomBoroughSelection = () => {
    setSelectedBoroughs(getRandomBoroughs());
  };

  // Effect to update existing borough map nodes when selection changes
  React.useEffect(() => {
    if (selectedChartType === 'boroughMap') {
      updateBoroughMapNodes(selectedBoroughs);
    }
  }, [selectedBoroughs, selectedChartType, updateBoroughMapNodes]);

  // Handle connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const availableChartTypes = selectedChartCategory ? Object.keys(chartTypes[selectedChartCategory] || {}) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Visualization Space</h1>
          <p className="text-gray-600 text-sm">Create and arrange visualization components using React Flow</p>
        </div>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Controls Sidebar */}
          <div className="w-80 bg-white shadow-sm border-r p-4 flex-shrink-0 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Component Builder</h2>
            
            <div className="space-y-4">
              {/* Size Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value as SizeType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(SIZE_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name} - {config.width}×{config.height}px
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Category</label>
                <select
                  value={selectedChartCategory}
                  onChange={(e) => handleChartCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(chartTypes).map(category => (
                    <option key={category} value={category}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                <select
                  value={selectedChartType}
                  onChange={(e) => handleChartTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableChartTypes.map(chartType => (
                    <option key={chartType} value={chartType}>
                      {chartType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Borough Selection (only for borough maps) */}
              {selectedChartType === 'boroughMap' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Boroughs ({selectedBoroughs.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                    {LONDON_BOROUGHS.map(borough => (
                      <label key={borough} className="flex items-center space-x-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedBoroughs.includes(borough)}
                          onChange={(e) => handleBoroughToggle(borough, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-700">{borough}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleClearAllBoroughs}
                      className="text-xs px-2 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleRandomBoroughSelection}
                      className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Random Selection
                    </button>
                  </div>
                  {selectedBoroughs.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                      Selected: {selectedBoroughs.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {/* Donut Chart Configuration (only for donut charts) */}
              {selectedChartType === 'donut' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="donutDataType"
                        value="2d"
                        checked={donutDataType === '2d'}
                        onChange={(e) => setDonutDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple donut chart)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="donutDataType"
                        value="3d"
                        checked={donutDataType === '3d'}
                        onChange={(e) => setDonutDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {donutDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={selectedDimension}
                        onChange={(e) => setSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="2020">2020</option>
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setSelectedDimension(['2020', '2021', '2022', '2023'][Math.floor(Math.random() * 4)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {donutDataType === '2d' ? 
                      'Simple donut chart with category breakdown' : 
                      `Interactive donut chart with ${selectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {/* Line Chart Configuration (only for line charts) */}
              {selectedChartType === 'line' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="lineDataType"
                        value="2d"
                        checked={lineDataType === '2d'}
                        onChange={(e) => setLineDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple time series)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="lineDataType"
                        value="3d"
                        checked={lineDataType === '3d'}
                        onChange={(e) => setLineDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Multiple series/dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {lineDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={lineSelectedDimension}
                        onChange={(e) => setLineSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="Anti-social behaviour">Anti-social behaviour</option>
                        <option value="Burglary">Burglary</option>
                        <option value="Vehicle crime">Vehicle crime</option>
                        <option value="Violent crime">Violent crime</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setLineSelectedDimension(['Anti-social behaviour', 'Burglary', 'Vehicle crime', 'Violent crime'][Math.floor(Math.random() * 4)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {lineDataType === '2d' ? 
                      'Simple line chart showing trend over time' : 
                      `Interactive line chart with ${lineSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {/* Multi-Line Chart Configuration (only for small_multiples_line charts) */}
              {selectedChartType === 'small_multiples_line' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="smallMultiplesLineDataType"
                        value="2d"
                        checked={smallMultiplesLineDataType === '2d'}
                        onChange={(e) => setSmallMultiplesLineDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple multi-series)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="smallMultiplesLineDataType"
                        value="3d"
                        checked={smallMultiplesLineDataType === '3d'}
                        onChange={(e) => setSmallMultiplesLineDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {smallMultiplesLineDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={smallMultiplesLineSelectedDimension}
                        onChange={(e) => setSmallMultiplesLineSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="Crime Type">Crime Type</option>
                        <option value="Borough Comparison">Borough Comparison</option>
                        <option value="Age Groups">Age Groups</option>
                        <option value="Income Levels">Income Levels</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setSmallMultiplesLineSelectedDimension(['Crime Type', 'Borough Comparison', 'Age Groups', 'Income Levels'][Math.floor(Math.random() * 4)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {smallMultiplesLineDataType === '2d' ? 
                      'Multi-line chart showing multiple series over time' : 
                      `Interactive multi-line chart with ${smallMultiplesLineSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {/* Combo Chart Configuration (only for combo_bar_line charts) */}
              {selectedChartType === 'combo_bar_line' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="comboBarLineDataType"
                        value="2d"
                        checked={comboBarLineDataType === '2d'}
                        onChange={(e) => setComboBarLineDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple bar + line)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="comboBarLineDataType"
                        value="3d"
                        checked={comboBarLineDataType === '3d'}
                        onChange={(e) => setComboBarLineDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {comboBarLineDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={comboBarLineSelectedDimension}
                        onChange={(e) => setComboBarLineSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="By Region">By Region</option>
                        <option value="By Product">By Product</option>
                        <option value="By Season">By Season</option>
                        <option value="By Department">By Department</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setComboBarLineSelectedDimension(['By Region', 'By Product', 'By Season', 'By Department'][Math.floor(Math.random() * 4)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {comboBarLineDataType === '2d' ? 
                      'Combo chart with bars and line overlay showing dual metrics' : 
                      `Interactive combo chart with ${comboBarLineSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {/* Bar Chart Configuration (only for bar charts) */}
              {selectedChartType === 'bar' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="barChartType"
                        value="simple"
                        checked={barChartType === 'simple'}
                        onChange={(e) => setBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Simple</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="barChartType"
                        value="with_mean"
                        checked={barChartType === 'with_mean'}
                        onChange={(e) => setBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Mean Line</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="barChartType"
                        value="with_threshold"
                        checked={barChartType === 'with_threshold'}
                        onChange={(e) => setBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Threshold</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="barChartType"
                        value="with_both"
                        checked={barChartType === 'with_both'}
                        onChange={(e) => setBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Mean & Threshold</span>
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="barDataType"
                        value="2d"
                        checked={barDataType === '2d'}
                        onChange={(e) => setBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple ranking)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="barDataType"
                        value="3d"
                        checked={barDataType === '3d'}
                        onChange={(e) => setBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {barDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={barSelectedDimension}
                        onChange={(e) => setBarSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="Crime Type">Crime Type</option>
                        <option value="Borough Ranking">Borough Ranking</option>
                        <option value="Seasonal Analysis">Seasonal Analysis</option>
                        <option value="Age Group Analysis">Age Group Analysis</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setBarSelectedDimension(['Crime Type', 'Borough Ranking', 'Seasonal Analysis', 'Age Group Analysis'][Math.floor(Math.random() * 4)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {barDataType === '2d' ? 
                      `${barChartType === 'simple' ? 'Simple' : 
                        barChartType === 'with_mean' ? 'Bar chart with mean line' : 
                        barChartType === 'with_threshold' ? 'Bar chart with threshold line' : 
                        'Bar chart with mean and threshold lines'} ranking bar chart` : 
                      `Interactive bar chart with ${barSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {/* Grouped Bar Chart Configuration (only for grouped_bar charts) */}
              {selectedChartType === 'grouped_bar' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="groupedBarChartType"
                        value="simple"
                        checked={groupedBarChartType === 'simple'}
                        onChange={(e) => setGroupedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Simple</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="groupedBarChartType"
                        value="with_mean"
                        checked={groupedBarChartType === 'with_mean'}
                        onChange={(e) => setGroupedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Mean Line</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="groupedBarChartType"
                        value="with_threshold"
                        checked={groupedBarChartType === 'with_threshold'}
                        onChange={(e) => setGroupedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Threshold</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="groupedBarChartType"
                        value="with_both"
                        checked={groupedBarChartType === 'with_both'}
                        onChange={(e) => setGroupedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Mean & Threshold</span>
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="groupedBarDataType"
                        value="2d"
                        checked={groupedBarDataType === '2d'}
                        onChange={(e) => setGroupedBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple grouped comparison)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="groupedBarDataType"
                        value="3d"
                        checked={groupedBarDataType === '3d'}
                        onChange={(e) => setGroupedBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {groupedBarDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={groupedBarSelectedDimension}
                        onChange={(e) => setGroupedBarSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="Year Comparison">Year Comparison</option>
                        <option value="Crime Type Analysis">Crime Type Analysis</option>
                        <option value="Regional Analysis">Regional Analysis</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setGroupedBarSelectedDimension(['Year Comparison', 'Crime Type Analysis', 'Regional Analysis'][Math.floor(Math.random() * 3)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {groupedBarDataType === '2d' ? 
                      `${groupedBarChartType === 'simple' ? 'Simple' : 
                        groupedBarChartType === 'with_mean' ? 'Grouped bar chart with mean line' : 
                        groupedBarChartType === 'with_threshold' ? 'Grouped bar chart with threshold line' : 
                        'Grouped bar chart with mean and threshold lines'} grouped comparison chart` : 
                      `Interactive grouped bar chart with ${groupedBarSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {selectedChartType === 'stacked_bar' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chart Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stackedBarChartType"
                        value="simple"
                        checked={stackedBarChartType === 'simple'}
                        onChange={(e) => setStackedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Simple</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stackedBarChartType"
                        value="with_mean"
                        checked={stackedBarChartType === 'with_mean'}
                        onChange={(e) => setStackedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Mean Line</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stackedBarChartType"
                        value="with_threshold"
                        checked={stackedBarChartType === 'with_threshold'}
                        onChange={(e) => setStackedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Threshold</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stackedBarChartType"
                        value="with_both"
                        checked={stackedBarChartType === 'with_both'}
                        onChange={(e) => setStackedBarChartType(e.target.value as 'simple' | 'with_mean' | 'with_threshold' | 'with_both')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">With Mean & Threshold</span>
                    </label>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stackedBarDataType"
                        value="2d"
                        checked={stackedBarDataType === '2d'}
                        onChange={(e) => setStackedBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple stacked comparison)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="stackedBarDataType"
                        value="3d"
                        checked={stackedBarDataType === '3d'}
                        onChange={(e) => setStackedBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {stackedBarDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={stackedBarSelectedDimension}
                        onChange={(e) => setStackedBarSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="Crime Categories">Crime Categories</option>
                        <option value="Age Group Distribution">Age Group Distribution</option>
                        <option value="Seasonal Breakdown">Seasonal Breakdown</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setStackedBarSelectedDimension(['Crime Categories', 'Age Group Distribution', 'Seasonal Breakdown'][Math.floor(Math.random() * 3)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {stackedBarDataType === '2d' ? 
                      `${stackedBarChartType === 'simple' ? 'Simple' : 
                        stackedBarChartType === 'with_mean' ? 'Stacked bar chart with mean line' : 
                        stackedBarChartType === 'with_threshold' ? 'Stacked bar chart with threshold line' : 
                        'Stacked bar chart with mean and threshold lines'} part-to-whole comparison chart` : 
                      `Interactive stacked bar chart with ${stackedBarSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {selectedChartType === 'divergent_bar' && (
                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="divergentBarDataType"
                        value="2d"
                        checked={divergentBarDataType === '2d'}
                        onChange={(e) => setDivergentBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">2D Data (Simple comparison)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="divergentBarDataType"
                        value="3d"
                        checked={divergentBarDataType === '3d'}
                        onChange={(e) => setDivergentBarDataType(e.target.value as '2d' | '3d')}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">3D Data (Interactive with dimensions)</span>
                    </label>
                  </div>
                  
                  {/* Dimension selection for 3D data */}
                  {divergentBarDataType === '3d' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Dimension
                      </label>
                      <select
                        value={divergentBarSelectedDimension}
                        onChange={(e) => setDivergentBarSelectedDimension(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="Crime Comparison (2022 vs 2023)">Crime Comparison (2022 vs 2023)</option>
                        <option value="Budget vs Actual Spending">Budget vs Actual Spending</option>
                        <option value="Income vs Expenditure">Income vs Expenditure</option>
                        <option value="Population Growth/Decline">Population Growth/Decline</option>
                      </select>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setDivergentBarSelectedDimension(['Crime Comparison (2022 vs 2023)', 'Budget vs Actual Spending', 'Income vs Expenditure', 'Population Growth/Decline'][Math.floor(Math.random() * 4)])}
                          className="text-xs px-2 py-1 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Random Dimension
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {divergentBarDataType === '2d' ? 
                      'Simple divergent comparison chart' : 
                      `Interactive divergent bar chart with ${divergentBarSelectedDimension} as default dimension`
                    }
                  </div>
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={handleAddComponent}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Component
              </button>
            </div>

            {/* Chart Type Info */}
            {selectedChartCategory && selectedChartType && chartTypes[selectedChartCategory]?.[selectedChartType] && (
              <div className="bg-gray-50 rounded-md p-4 mt-4">
                <h3 className="font-medium text-gray-800 mb-2">Chart Requirements:</h3>
                <div className="text-sm text-gray-600">
                  {chartTypes[selectedChartCategory][selectedChartType].required && (
                    <div className="mb-1">
                      <strong>Required:</strong> {chartTypes[selectedChartCategory][selectedChartType].required.join(', ')}
                    </div>
                  )}
                  {chartTypes[selectedChartCategory][selectedChartType].optional && chartTypes[selectedChartCategory][selectedChartType].optional.length > 0 && (
                    <div className="mb-1">
                      <strong>Optional:</strong> {chartTypes[selectedChartCategory][selectedChartType].optional.join(', ')}
                    </div>
                  )}
                  {chartTypes[selectedChartCategory][selectedChartType].notes && (
                    <div>
                      <strong>Notes:</strong> {chartTypes[selectedChartCategory][selectedChartType].notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-gray-800 mb-2">Canvas Stats</h3>
              <div className="text-sm text-gray-600">
                <div>Components: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
              </div>
            </div>
          </div>

          {/* React Flow Canvas */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="bg-gray-50"
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              
              {/* Info Panel */}
              <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-md border">
                <div className="text-sm text-gray-600">
                  <div className="font-medium mb-1">Dashboard Canvas</div>
                  <div>Drag nodes to rearrange</div>
                  <div>Connect nodes to show relationships</div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationSpace;
