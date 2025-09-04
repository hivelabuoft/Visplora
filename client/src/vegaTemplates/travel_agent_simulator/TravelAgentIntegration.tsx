// Example integration with Travel Dashboard
// This shows how to use the Travel Agent Simulator in your existing travel page

import React, { useState, useCallback } from 'react';
import { TravelAgentManager } from './TravelAgentManager';
import { TravelAgentRequest, AgentResponse, TravelChartSpec } from './types';

interface TravelAgentIntegrationProps {
  onChartGenerated?: (chartSpec: TravelChartSpec) => void;
}

export const TravelAgentIntegration: React.FC<TravelAgentIntegrationProps> = ({
  onChartGenerated
}) => {
  const [agentManager] = useState(() => new TravelAgentManager());
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [generatedChart, setGeneratedChart] = useState<TravelChartSpec | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateChart = useCallback(async () => {
    if (!userQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const request: TravelAgentRequest = {
        userQuery: userQuery.trim(),
        constraints: {
          // Add any specific constraints here
          maxDataPoints: 10
        }
      };

      const response: AgentResponse = await agentManager.generateTravelChart(request);

      if (response.success && response.chartSpec) {
        setGeneratedChart(response.chartSpec);
        onChartGenerated?.(response.chartSpec);
      } else {
        setError(response.error || 'Failed to generate chart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [userQuery, agentManager, onChartGenerated]);

  const handleExampleQuery = (query: string) => {
    setUserQuery(query);
  };

  const exampleQueries = [
    "Show monthly visitor trends for Tokyo over the past year",
    "Compare safety scores across major European cities",
    "Break down review ratings distribution for Singapore",
    "Plot relationship between cost and environmental quality",
    "Monthly arrivals with occupancy rates for Bangkok"
  ];

  return (
    <div className="space-y-4">
      {/* Query Input Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-3">🤖 AI Travel Chart Generator</h3>
        
        <div className="space-y-3">
          <div>
            <label htmlFor="userQuery" className="block text-sm font-medium text-gray-700 mb-1">
              Describe the travel visualization you need:
            </label>
            <textarea
              id="userQuery"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="e.g., Show cost trends for Tokyo over time, or Compare safety across cities"
              className="w-full p-2 border rounded-md resize-none h-20 text-sm"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleGenerateChart}
              disabled={isLoading || !userQuery.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isLoading ? 'Generating...' : 'Generate Chart'}
            </button>
            
            <button
              onClick={() => setGeneratedChart(null)}
              disabled={!generatedChart}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Example queries */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-1">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleExampleQuery(query)}
                disabled={isLoading}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                {query.length > 50 ? `${query.substring(0, 50)}...` : query}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-blue-700 text-sm">AI is generating your travel visualization...</p>
        </div>
      )}

      {/* Generated Chart Display */}
      {generatedChart && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-2">{generatedChart.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{generatedChart.description}</p>
          
          {/* Chart would be rendered here with SpecCreator */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600">Chart visualization would render here</p>
            <p className="text-xs text-gray-500 mt-2">
              Use SpecCreator.create(generatedChart) to render the actual chart
            </p>
          </div>

          <div className="text-xs text-gray-500 mt-3 space-y-1">
            <p><strong>Chart Type:</strong> {generatedChart.type} / {generatedChart.subtype}</p>
            <p><strong>Data Points:</strong> {generatedChart.data.length}</p>
            {generatedChart.insights && (
              <p><strong>AI Insights:</strong> {generatedChart.insights.join(', ')}</p>
            )}
            {generatedChart.metadata && (
              <p><strong>Generated by:</strong> {generatedChart.metadata.generatedBy} at {new Date(generatedChart.metadata.timestamp).toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="text-xs text-gray-400">
        <p>🤖 5 AI agents ready: Line, Bar, Pie, Scatter, MultiType | 🌍 135+ destinations | 📊 Pre-trained on travel data patterns</p>
      </div>
    </div>
  );
};

export default TravelAgentIntegration;