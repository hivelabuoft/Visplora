// Travel Agent Demo Dashboard
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

interface DemoData {
  metadata: {
    generatedAt: string;
    totalRequests: number;
    successful: number;
    failed: number;
    agentTypes: string[];
  };
  charts: DemoChart[];
  autoDetectionTests: Array<{
    query: string;
    suggestions: string[];
  }>;
  systemInfo: {
    availableAgents: Array<{
      type: string;
      info: any;
    }>;
  };
}

const TravelAgentDemo: React.FC = () => {
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // State for interactive chart filters
  const [chartFilters, setChartFilters] = useState<Record<string, any>>({});
  const [isUpdatingChart, setIsUpdatingChart] = useState<string | null>(null);

  // Try to load existing demo data on mount
  useEffect(() => {
    loadExistingDemoData();
  }, []);

  // Initialize filter state when demo data loads
  useEffect(() => {
    if (demoData) {
      const initialFilters: Record<string, any> = {};
      demoData.charts.forEach((chart) => {
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
          console.log('🔧 Initializing filter state:', initialFilters);
          return initialFilters;
        }
        console.log('🔧 Skipping filter initialization - filters already set');
        return prev;
      });
    }
  }, [demoData]);

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
      const chartToUpdate = demoData?.charts.find(c => c.id === chartId);
      if (!chartToUpdate || !chartToUpdate.request?.constraints?.hasFieldFilter) {
        return;
      }

      // Get the backup data for this filter value
      const backupData = chartToUpdate.chartSpec?.backupData;
      const newData = backupData?.[newValue] || chartToUpdate.chartSpec?.originalData || chartToUpdate.chartSpec?.data;

      // Debug logging
      console.log('🔍 Filter Debug Info:', {
        chartId,
        filterKey,
        newValue,
        hasBackupData: !!backupData,
        backupDataKeys: backupData ? Object.keys(backupData) : 'None',
        hasNewData: !!newData,
        currentDataLength: chartToUpdate.chartSpec?.data?.length,
        newDataLength: newData?.length,
        filterConfig: chartToUpdate.request?.constraints?.filterConfig,
        chartSpec: {
          hasBackupData: !!chartToUpdate.chartSpec?.backupData,
          hasOriginalData: !!chartToUpdate.chartSpec?.originalData,
          dataLength: chartToUpdate.chartSpec?.data?.length
        }
      });

      // Update the chart data locally by swapping from backup data
      setDemoData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          charts: prev.charts.map(chart => 
            chart.id === chartId 
              ? { 
                  ...chart, 
                  chartSpec: { 
                    ...chart.chartSpec, 
                    data: newData 
                  },
                  // Also update the vega spec data since it has embedded values
                  vegaSpec: {
                    ...chart.vegaSpec,
                    // Handle different vega spec structures
                    ...(chart.vegaSpec.layer ? {
                      // Multi-layer charts (like pie charts) - need to recalculate center text
                      layer: chart.vegaSpec.layer.map((layer: any, index: number) => {
                        // Update data layer (usually index 0)
                        if (layer.data?.values && index === 0) {
                          return {
                            ...layer,
                            data: {
                              ...layer.data,
                              values: newData
                            }
                          };
                        }
                        
                        // Update center text layers for pie charts (indices 1 and 2)
                        if (layer.mark?.type === "text" && newData && newData.length > 0) {
                          // For center value text (main number)
                          if (layer.mark.dy === -10) {
                            const valueField = chart.chartSpec?.config?.fields?.value || 'value';
                            const totalValue = newData.reduce((sum: number, d: any) => sum + (d[valueField] || 0), 0);
                            const averageValue = totalValue / newData.length;
                            
                            return {
                              ...layer,
                              data: {
                                values: [{ 
                                  text: Math.round(averageValue).toString(),
                                  category: "center"
                                }]
                              }
                            };
                          }
                          
                          // For center subtitle text (keep as "Average")
                          if (layer.mark.dy === 8) {
                            return {
                              ...layer,
                              data: {
                                values: [{ 
                                  text: "Average",
                                  category: "subtitle"
                                }]
                              }
                            };
                          }
                        }
                        
                        return layer;
                      })
                    } : chart.vegaSpec.data ? {
                      // Single data charts
                      data: {
                        ...chart.vegaSpec.data,
                        values: newData
                      }
                    } : {})
                  }
                }
              : chart
          )
        };
      });

      console.log('📊 Updated chart data:', {
        chartId,
        originalDataSample: chartToUpdate.chartSpec?.data?.slice(0, 2),
        newDataSample: newData?.slice(0, 2),
        vegaStructure: {
          hasLayer: !!chartToUpdate.vegaSpec?.layer,
          hasDirectData: !!chartToUpdate.vegaSpec?.data,
          layerCount: chartToUpdate.vegaSpec?.layer?.length || 0
        }
      });

    } catch (error) {
      console.error('Failed to update chart filter:', error);
      // Revert filter state on error
      const originalChart = demoData?.charts.find(c => c.id === chartId);
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

  const loadExistingDemoData = async () => {
    try {
      // First try the API endpoint which handles file system access
      const response = await fetch('/api/load-demo');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDemoData(result.data);
          console.log(`✅ Loaded existing demo data from ${result.source}`);
          return;
        }
      }
      
      // Fallback: try direct HTTP access to public files
      const publicResponse = await fetch('/demo_output.json');
      if (publicResponse.ok) {
        const data = await publicResponse.json();
        setDemoData(data);
        console.log('✅ Loaded demo data from public directory');
        return;
      }
      
      // Fallback: try vegaTemplates directory path
      const vegaResponse = await fetch('/vegaTemplates/travel_agent_simulator/demo_output.json');
      if (vegaResponse.ok) {
        const data = await vegaResponse.json();
        setDemoData(data);
        console.log('✅ Loaded demo data from vegaTemplates directory');
        return;
      }
      
      throw new Error('No demo data found in any location');
      
    } catch (error) {
      console.log('No existing demo data found:', error);
      setError('No demo data found. Please generate new demo data or check if demo_output.json exists.');
    }
  };

  const generateDemoData = async () => {
    setIsGenerating(true);
    setGenerationStatus('Initializing AI agents...');
    setError(null);

    try {
      const response = await fetch('/api/generate-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDemoData(result.data);
        setGenerationStatus(`✅ Generated ${result.summary.successful}/${result.summary.totalCharts} charts successfully!`);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setGenerationStatus('❌ Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!demoData && !isGenerating && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-lg mx-auto p-6">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Travel Agent Simulator</h1>
          <p className="text-gray-600 mb-8">
            Interactive demonstration of 5 specialized AI agents generating travel visualizations with GPT-4
          </p>
          
          {/* Two Options */}
          <div className="space-y-4">
            {/* Option 1: Load Existing Demo Data */}
            <div className="bg-white border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-3">
                <span className="text-2xl mr-2">📊</span>
                <h3 className="text-lg font-semibold text-gray-800">Option 1: Load Demo Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                View pre-generated travel charts with AI insights (instant loading)
              </p>
              <button
                onClick={loadExistingDemoData}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium w-full"
              >
                📁 Load Existing Demo
              </button>
              <p className="text-xs text-green-600 mt-2">
                ✅ 12 pre-generated charts • Instant viewing • No API calls needed
              </p>
            </div>

            {/* Option 2: Generate Fresh Data */}
            <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-3">
                <span className="text-2xl mr-2">🚀</span>
                <h3 className="text-lg font-semibold text-gray-800">Option 2: Generate Fresh Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Create new travel charts using live GPT-4 API calls (takes 12-15 minutes)
              </p>
              <button
                onClick={generateDemoData}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium w-full"
              >
                🤖 Generate Fresh Demo
              </button>
              <p className="text-xs text-purple-600 mt-2">
                🧠 Live GPT-4 calls • New insights • Fresh data variations
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">What You'll See:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Line Charts: Cost trends over time with AI-generated insights</p>
              <p>• Bar Charts: Destination comparisons and safety rankings</p>
              <p>• Pie Charts: Travel expense and cultural diversity breakdowns</p>
              <p>• Scatter Charts: Environmental quality bubble plots</p>
              <p>• Multi-Type: Combined revenue and growth rate visualizations</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Generating AI Charts</h2>
          <p className="text-gray-600 mb-4">{generationStatus}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> This process takes 12-15 minutes as we generate each chart using GPT-4 
              with realistic travel data and insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-700 mb-4">Generation Failed</h2>
          <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={loadExistingDemoData}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium w-full"
            >
              � Load Existing Demo Data
            </button>
            <button
              onClick={generateDemoData}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium w-full"
            >
              � Retry Generation
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            If generation fails, you can still view the pre-generated demo data
          </p>
        </div>
      </div>
    );
  }

  // Main dashboard view with generated data
  if (!demoData) {
    return null; // This shouldn't happen given our logic above, but TypeScript needs this
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Reset Option */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Travel Agent Simulator</h1>
            <p className="text-sm text-gray-600">
              Generated {demoData.metadata.successful}/{demoData.metadata.totalRequests} charts • 
              {' '}Created at {new Date(demoData.metadata.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => {
              setDemoData(null);
              setError(null);
              setGenerationStatus('');
            }}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            🔄 New Generation
          </button>
        </div>
      </div>

      {/* Main Content */}
        <ReusableGrid 
          config="travel-dashboard"
          isLoading={false}
        >
          {demoData.charts.map((chart) => {
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

            // Debug filter state only for chart-1 to reduce noise
            if (hasFieldFilter && chart.id === 'chart-1') {
              console.log('🎛️ Filter State Debug (chart-1 only):', {
                chartId: chart.id,
                filterKey: filterConfig?.filterKey,
                currentFilterValue,
                selectedFilter,
                defaultValue: filterConfig?.defaultValue,
                filterOptions: filterOptions.map((opt: any) => opt.value),
                chartFiltersState: chartFilters,
                currentValueForChart: chartFilters[chart.id]
              });
            }

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

export default TravelAgentDemo;