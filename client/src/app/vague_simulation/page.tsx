'use client';

import React, { useState, useEffect } from 'react';

interface OriginalChart {
  name: string;
  request: {
    userQuery: string;
    constraints: {
      chartType: string;
      subtype?: string;
      nodeSize?: string;
      dataCategory?: string;
      destinations?: string[];
      selectedCountries?: string[];
      maxDataPoints?: number;
      hasFieldFilter?: boolean;
      filterConfig?: any;
    };
  };
}

interface OriginalSentenceData {
  sentence_id: number;
  charts: OriginalChart[];
}

interface TransformedChart {
  title: string;
  type: string;
  description: string;
}

interface TransformedSentenceData {
  sentence_id: number;
  sentence_content: string;
  charts_display: TransformedChart[];
}

const VagueSimulationPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [transformedData, setTransformedData] = useState<TransformedSentenceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);

  // Available example100.x files (x=1 to 5)
  const availableFiles = [
    { value: '1', label: 'example100.1_data.json', dataFile: 'example100.1_data.json', contextFile: 'example100.1.json' },
    { value: '2', label: 'example100.2_data.json', dataFile: 'example100.2_data.json', contextFile: 'example100.2.json' },
    { value: '3', label: 'example100.3_data.json', dataFile: 'example100.3_data.json', contextFile: 'example100.3.json' },
    { value: '4', label: 'example100.4_data.json', dataFile: 'example100.4_data.json', contextFile: 'example100.4.json' },
    { value: '5', label: 'example100.5_data.json', dataFile: 'example100.5_data.json', contextFile: 'example100.5.json' },
  ];

  // Chart type mapping
  const getChartTypeDisplay = (chartType: string): string => {
    const typeMap: Record<string, string> = {
      'line': 'Line chart',
      'bar': 'Bar chart',
      'scatter': 'Bubble chart',
      'pie': 'Pie chart',
      'multiType': 'Multi-type chart',
      'map': 'Map chart'
    };
    return typeMap[chartType] || 'Chart';
  };

    // Generate description using LLM API
  const generateDescriptionsWithLLM = async (charts: OriginalChart[], sentenceContent: string): Promise<string[]> => {
    try {
      const response = await fetch('/api/generate-chart-descriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          charts: charts.map(chart => ({
            name: chart.name,
            userQuery: chart.request.userQuery,
            constraints: chart.request.constraints
          })),
          sentence_content: sentenceContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate descriptions');
      }

      const result = await response.json();
      return result.descriptions;
      
    } catch (error) {
      console.error('❌ LLM description generation failed:', error);
      // Fallback to simple descriptions
      return charts.map(chart => chart.request.userQuery + '.');
    }
  };

  // Generate description from userQuery and constraints (fallback)
  const generateDescription = (chart: OriginalChart): string => {
    const { userQuery, constraints } = chart.request;
    const { dataCategory, destinations, selectedCountries } = constraints;
    
    // Use userQuery as base and enhance with context
    let description = userQuery;
    
    // Add context about data category
    if (dataCategory) {
      const categoryContext: Record<string, string> = {
        'visitor-flow': 'tourist arrivals and travel patterns',
        'safety': 'safety scores and security metrics',
        'cost': 'travel costs and budget analysis',
        'reviews': 'user reviews and ratings',
        'cultural': 'cultural diversity and attractions',
        'environmental': 'environmental quality indicators'
      };
      
      if (categoryContext[dataCategory] && !description.toLowerCase().includes(dataCategory)) {
        // Only add category context if it's not already mentioned
        description = description.replace(/\.$/, '') + ` focusing on ${categoryContext[dataCategory]}.`;
      }
    }
    
    // Ensure proper sentence ending
    if (!description.endsWith('.')) {
      description += '.';
    }
    
    return description;
  };

  // Transform data from original format to display format
  const transformData = async (fileNumber: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const selectedFileConfig = availableFiles.find(f => f.value === fileNumber);
      if (!selectedFileConfig) {
        throw new Error('Invalid file selection');
      }

      console.log('🔄 Loading files and generating LLM descriptions...');

      // Load both data file and context file
      const [dataResponse, contextResponse] = await Promise.all([
        fetch(`/examples/scenario2/${selectedFileConfig.dataFile}`),
        fetch(`/examples/scenario2/${selectedFileConfig.contextFile}`)
      ]);

      if (!dataResponse.ok) {
        throw new Error(`Failed to load data file: ${dataResponse.status} ${dataResponse.statusText}`);
      }

      if (!contextResponse.ok) {
        throw new Error(`Failed to load context file: ${contextResponse.status} ${contextResponse.statusText}`);
      }

      const originalData: OriginalSentenceData[] = await dataResponse.json();
      const contextData = await contextResponse.json();

      // Create sentence content mapping
      const sentenceContentMap: Record<number, string> = {};
      if (contextData.exploration_path) {
        contextData.exploration_path.forEach((item: any) => {
          if (item.sentence_id && item.sentence_content) {
            sentenceContentMap[item.sentence_id] = item.sentence_content;
          }
        });
      }

      // Transform each sentence with LLM-generated descriptions
      const transformed: TransformedSentenceData[] = [];
      
      for (const sentenceData of originalData) {
        const sentenceContent = sentenceContentMap[sentenceData.sentence_id] || `Sentence ${sentenceData.sentence_id}`;
        
        console.log(`🤖 Generating LLM descriptions for sentence ${sentenceData.sentence_id} with ${sentenceData.charts.length} charts...`);
        
        // Generate descriptions using LLM
        const llmDescriptions = await generateDescriptionsWithLLM(sentenceData.charts, sentenceContent);
        
        // Transform charts with LLM-generated descriptions
        const transformedCharts: TransformedChart[] = sentenceData.charts.map((chart, index) => ({
          title: chart.name,
          type: getChartTypeDisplay(chart.request.constraints.chartType),
          description: llmDescriptions[index] || generateDescription(chart) // Fallback to manual if LLM fails
        }));

        transformed.push({
          sentence_id: sentenceData.sentence_id,
          sentence_content: sentenceContent,
          charts_display: transformedCharts
        });
      }

      setTransformedData(transformed);
      console.log('✅ Data transformation completed with LLM descriptions:', transformed);

      // Automatically save the transformed data
      await saveTransformedData(transformed, fileNumber);

    } catch (error) {
      console.error('❌ Error transforming data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Save transformed data to file
  const saveTransformedData = async (data: TransformedSentenceData[], fileNumber: string) => {
    try {
      console.log(`💾 Saving transformed data to vague_simulations/${fileNumber}.json...`);
      
      const saveResponse = await fetch('/api/save-vague-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          filename: `${fileNumber}.json`
        })
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.details || 'Failed to save file');
      }

      const saveResult = await saveResponse.json();
      setSavedFilePath(saveResult.filePath);
      console.log(`✅ Successfully saved to: ${saveResult.filePath}`);
      
    } catch (error) {
      console.error('❌ Error saving transformed data:', error);
      // Don't fail the whole process if saving fails
      setSavedFilePath(null);
    }
  };

  // Handle file selection
  const handleFileSelect = (fileNumber: string) => {
    setSelectedFile(fileNumber);
    setSavedFilePath(null); // Reset saved file path
    setError(null); // Reset any previous errors
    transformData(fileNumber);
  };

  // Download transformed data as JSON
  const downloadJSON = () => {
    if (transformedData.length === 0) return;
    
    const dataStr = JSON.stringify(transformedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `example100.${selectedFile}_transformed.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    if (transformedData.length === 0) return;
    
    const dataStr = JSON.stringify(transformedData, null, 2);
    navigator.clipboard.writeText(dataStr).then(() => {
      alert('Transformed data copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-4xl">🔄</div>
            <h1 className="text-3xl font-bold text-gray-900">Vague Simulation</h1>
          </div>
          <p className="text-lg text-gray-600">
            Transform example100.x_data.json files into clean display format
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Converts chart specifications to readable format: title, type, description
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* File Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Example File</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {availableFiles.map((file) => (
              <button
                key={file.value}
                onClick={() => handleFileSelect(file.value)}
                disabled={isLoading}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedFile === file.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-25'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium text-sm">{file.label}</div>
                <div className="text-xs text-gray-500 mt-1">Scenario 2</div>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-gray-600">Generating LLM descriptions...</span>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                🤖 Using OpenAI GPT-4 to generate natural language descriptions for chart visualizations
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Auto-saving results to public/examples/vague_simulations/{selectedFile}.json
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 text-sm">❌ Error: {error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {transformedData.length > 0 && !isLoading && (
          <>
            {/* Save Confirmation */}
            {savedFilePath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-green-600 text-sm">
                    ✅ Successfully saved to: <code className="bg-green-100 px-2 py-1 rounded text-xs">{savedFilePath}</code>
                  </span>
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">🤖 LLM Transformation Complete</h3>
                  <p className="text-sm text-gray-600">
                    Processed {transformedData.length} sentences with {transformedData.reduce((total, sentence) => total + sentence.charts_display.length, 0)} charts using OpenAI GPT-4
                  </p>
                  {savedFilePath && (
                    <p className="text-xs text-green-600 mt-1">
                      📁 Auto-saved to: {savedFilePath}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    📋 Copy JSON
                  </button>
                  <button
                    onClick={downloadJSON}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    💾 Download JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transformed Data Preview</h3>
              
              <div className="space-y-6">
                {transformedData.slice(0, 3).map((sentence) => (
                  <div key={sentence.sentence_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <h4 className="text-md font-medium text-gray-800">
                        Sentence {sentence.sentence_id}
                      </h4>
                      <p className="text-sm text-gray-600 italic mt-1">
                        "{sentence.sentence_content}"
                      </p>
                    </div>
                    
                    <div className="grid gap-3">
                      {sentence.charts_display.map((chart, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800 text-sm">{chart.title}</h5>
                              <p className="text-xs text-blue-600 font-medium mt-1">{chart.type}</p>
                              <p className="text-xs text-gray-600 mt-1">{chart.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {transformedData.length > 3 && (
                  <div className="text-center text-sm text-gray-500 py-4">
                    ... and {transformedData.length - 3} more sentences
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON Output */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Raw JSON Output</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs max-h-96">
                {JSON.stringify(transformedData, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* Instructions */}
        {transformedData.length === 0 && !isLoading && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Use</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>1. Select one of the example100.x_data.json files above</p>
              <p>2. The system will use <strong>OpenAI GPT-4</strong> to generate natural language descriptions</p>
              <p>3. Results are <strong>automatically saved</strong> to <code>public/examples/vague_simulations/x.json</code></p>
              <p>4. View the LLM-enhanced preview and download/copy additional copies</p>
              <p className="mt-4 font-medium">🤖 LLM Transformation details:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maps chart.name → title (direct)</li>
                <li>Maps chart.request.constraints.chartType → type (readable format)</li>
                <li><strong>Uses GPT-4</strong> to generate natural descriptions from userQuery + constraints</li>
                <li>Adds sentence_content from corresponding example100.x.json file</li>
                <li>Creates travel-focused, insight-driven descriptions</li>
                <li><strong>Auto-saves</strong> to vague_simulations directory with metadata</li>
              </ul>
              <p className="mt-4 text-xs text-blue-600">
                ⚡ Powered by OpenAI API - each file generates fresh, contextual descriptions and saves automatically
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VagueSimulationPage;