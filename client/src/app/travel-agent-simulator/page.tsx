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

  // Try to load existing demo data on mount
  useEffect(() => {
    loadExistingDemoData();
  }, []);

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
                  size="large"
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

            const getNodeSize = (chartType: string) => {
              switch (chartType) {
                case 'line': return 'xlarge';
                case 'bar': return 'large';
                case 'pie': return 'medium';
                case 'scatter': return 'xlarge';
                case 'multiType': return 'xlarge';
                default: return 'large';
              }
            };

            // Use chartSpec.type as primary source, fallback to request constraints
            const chartType = chart.chartSpec?.type || chart.request.constraints?.chartType || 'bar';

            return (
              <ReusableNode
                key={chart.id}
                size={getNodeSize(chartType)}
                chartType="vega-lite"
                title={chart.name}
                description={chart.chartSpec?.description || chart.request.userQuery}
                vegaSpec={chart.vegaSpec}
                chartPosition="full"
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