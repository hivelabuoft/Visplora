'use client';

import React, { useState, useEffect } from 'react';
import ReusableNode from '../../components/ReusableNode';
import ReusableGrid from '../../components/ReusableGrid';

interface DemoChart {
  id: string;
  name: string;
  request: any;
  chartSpec: any;
  vegaSpec: any;
  generationTime: number;
  success: boolean;
  error: string | null;
}

interface ViewGeneratorProps {
  sentence_id: number;
  charts: DemoChart[];
  onInteraction?: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => void;
  customGridConfig?: {columns: number, rows: number} | null;
}

const ViewGenerator: React.FC<ViewGeneratorProps> = ({ sentence_id, charts, onInteraction, customGridConfig }) => {
  // State for interactive chart filters
  const [chartFilters, setChartFilters] = useState<Record<string, any>>({});
  const [isUpdatingChart, setIsUpdatingChart] = useState<string | null>(null);

  // Initialize filter state when charts load
  useEffect(() => {
    if (charts) {
      const initialFilters: Record<string, any> = {};
      charts.forEach((chart) => {
        if (chart.success && chart.request?.constraints?.hasFieldFilter && chart.request?.constraints?.filterConfig) {
          const filterConfig = chart.request.constraints.filterConfig;
          initialFilters[chart.id] = {
            [filterConfig.filterKey]: filterConfig.defaultValue
          };
        }
      });
      
      // Only set initial filters if chartFilters is empty (prevent overwriting user changes)
      setChartFilters(prev => {
        if (Object.keys(prev).length === 0) {
          return initialFilters;
        }
        return prev;
      });
    }
  }, [charts]);

  // Handle filter changes for interactive charts
  const handleFilterChange = (chartId: string, filterKey: string, newValue: any) => {
    setIsUpdatingChart(chartId);
    
    try {
      // Update local filter state immediately
      setChartFilters(prev => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [filterKey]: newValue
        }
      }));

      // Find the chart to update
      const chartToUpdate = charts?.find(c => c.id === chartId);
      if (!chartToUpdate || !chartToUpdate.request?.constraints?.hasFieldFilter) {
        return;
      }

      // Since we don't have setCharts in ViewGenerator, we'll skip the dynamic update
      // This would need to be handled by the parent component if needed

    } catch (error) {
      // Revert filter state on error
      const originalChart = charts?.find(c => c.id === chartId);
      setChartFilters(prev => ({
        ...prev,
        [chartId]: {
          ...prev[chartId],
          [filterKey]: originalChart?.request?.constraints?.filterConfig?.defaultValue
        }
      }));
    } finally {
      // Remove loading state quickly since this is just a local data swap
      setTimeout(() => setIsUpdatingChart(null), 200);
    }
  };

  if (!charts || charts.length === 0) {
    return <div>No charts available for this sentence.</div>;
  }

  return (
    <div 
      className="bg-gray-50 w-full h-full" 
      style={{ 
        width: '100%',
        height: '100%', // Use full container height
        overflow: 'auto' // Add scrolling if content exceeds container
      }}
    >
      <ReusableGrid 
        config={customGridConfig ? "custom" : "travel-dashboard"}
        customConfig={customGridConfig ? {
          columns: customGridConfig.columns,
          rows: customGridConfig.rows,
          gap: 4,
          rowSizes: customGridConfig.rows <= 1 
            ? ['100px'] 
            : customGridConfig.rows <= 4
            ? Array(customGridConfig.rows).fill('100px')
            : ['100px', ...Array(customGridConfig.rows - 1).fill('80px')],
          containerStyle: {
            width: '100%',
            backgroundColor: '#E3F2FA',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          },
          className: 'travel-dashboard p-6 rounded-lg text-[#1A3C4A]'
        } : undefined}
        isLoading={false}
      >
        {charts.map((chart) => {
          if (!chart.success) {
            return (
              <ReusableNode
                key={chart.id}
                size="xlarge"
                chartType="custom"
                title={chart.name}
                subtitle="Generation Failed"
                description={`Error: ${chart.error}`}
                chartPosition="full"
                vegaRenderer="svg"
              >
                <div className="h-40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">❌</div>
                    <p className="text-sm text-red-600 font-medium">Generation Failed</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">{chart.error}</p>
                  </div>
                </div>
              </ReusableNode>
            );
          }

          const getNodeSize = (chart: any) => {
            // Use nodeSize from the demo configuration if available
            const configuredNodeSize = chart.request?.constraints?.nodeSize;
            if (configuredNodeSize) {
              return configuredNodeSize;
            }
            
            // Fallback to chart type defaults
            const chartType = chart.chartSpec?.type || chart.request.constraints?.chartType || 'bar';
            switch (chartType) {
              case 'line': return 'xlarge';        // Always xlarge for multiType
              case 'bar': 
                // Bar charts can be medium or xlarge based on demo config
                return 'xlarge';  // Default to xlarge, but prefer configured size
              case 'pie': return 'medium';         // Always medium
              case 'scatter': return 'xlarge';     // Always xlarge for multiType  
              case 'multiType': return 'xlarge';   // Always xlarge
              default: return 'xlarge';
            }
          };

          // Use chartSpec.type as primary source, fallback to request constraints
          const chartType = chart.chartSpec?.type || chart.request.constraints?.chartType || 'bar';
          const hasFieldFilter = chart.request?.constraints?.hasFieldFilter;
          const filterConfig = chart.request?.constraints?.filterConfig;
          const currentFilterValue = chartFilters[chart.id];
          const isUpdating = isUpdatingChart === chart.id;

          // Prepare filter options from filterConfig
          const filterOptions = filterConfig?.options || [];
          const selectedFilter = currentFilterValue?.[filterConfig?.filterKey] || filterConfig?.defaultValue;
          const fieldFilterKey = filterConfig?.filterKey || 'filter';

          return (
            <ReusableNode
              key={`${chart.id}-${selectedFilter || 'default'}`}
              size={getNodeSize(chart)}
              chartType={chartType === 'map' ? 'vega' : 'vega-lite'}
              title={chart.name}
              subtitle={chart.chartSpec?.subtitle || null}
              description={hasFieldFilter ? undefined : (chart.chartSpec?.description || chart.request.userQuery)}
              vegaSpec={chart.vegaSpec}
              chartPosition="full"
              // Interactive filter props (using ReusableNode's existing interface)
              hasFieldFilter={hasFieldFilter}
              fieldFilterKey={fieldFilterKey}
              filterOptions={filterOptions}
              selectedFilter={selectedFilter}
              onFilterChange={(filterKey: string, newValue: any) => 
                handleFilterChange(chart.id, filterKey, newValue)
              }
              isUpdating={isUpdating}
            >
              {chart.chartSpec?.insights && (
                <div className="mt-2 text-xs text-gray-500">
                  <p><strong>AI Insights:</strong> {chart.chartSpec.insights.join(', ')}</p>
                </div>
              )}
              {chart.chartSpec?.metadata && (
                <div className="mt-1 text-xs text-gray-400">
                  <p>Generated at {new Date(chart.chartSpec.metadata.timestamp).toLocaleTimeString()}</p>
                </div>
              )}
            </ReusableNode>
          );
        })}
      </ReusableGrid>
    </div>
  );
};

export default ViewGenerator;
