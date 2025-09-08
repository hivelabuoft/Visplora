'use client';

import React, { useState, useEffect } from 'react';

interface GenerationResult {
  sentences: Record<string, any>;
  metadata: {
    totalSentences: number;
    totalCharts: number;
    outputFile: string;
    generatedAt: string;
  };
}

interface ScenarioFile {
  name: string;
  path: string;
  scenario: string;
  fullPath?: string;
  sentenceCount?: number;
  valid?: boolean;
}

const ChartSpecGenerator: React.FC = () => {
  const [availableFiles, setAvailableFiles] = useState<ScenarioFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string>('1');

  useEffect(() => {
    loadAvailableFiles();
  }, []);

  useEffect(() => {
    if (generationResult?.sentences) {
      const firstSentenceId = Object.keys(generationResult.sentences)[0];
      if (firstSentenceId) {
        setSelectedSentence(firstSentenceId);
      }
    }
  }, [generationResult]);

  const loadAvailableFiles = async () => {
    try {
      const response = await fetch('/api/list-example-files');
      if (response.ok) {
        const files = await response.json();
        
        // Validate each file and get sentence counts
        const validatedFiles = await Promise.all(
          files.map(async (file: ScenarioFile) => {
            try {
              const validateResponse = await fetch('/api/list-example-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ validateFile: file.path })
              });
              
              if (validateResponse.ok) {
                const validation = await validateResponse.json();
                return { 
                  ...file, 
                  valid: validation.valid,
                  sentenceCount: validation.sentenceCount 
                };
              }
            } catch (error) {
              console.warn(`Validation failed for ${file.path}:`, error);
            }
            
            return { ...file, valid: false };
          })
        );
        
        setAvailableFiles(validatedFiles.filter(f => f.valid));
      } else {
        throw new Error('Failed to load example files');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      // Fallback to known files
      setAvailableFiles([
        { name: 'example2.json', path: 'public/examples/scenario1/example2.json', scenario: 'scenario1' },
        { name: 'example3.json', path: 'public/examples/scenario1/example3.json', scenario: 'scenario1' },
        { name: 'example4.json', path: 'public/examples/scenario1/example4.json', scenario: 'scenario1' },
        { name: 'example1.json', path: 'public/examples/scenario2/example1.json', scenario: 'scenario2' },
        { name: 'example2.json', path: 'public/examples/scenario2/example2.json', scenario: 'scenario2' },
        { name: 'example3.json', path: 'public/examples/scenario2/example3.json', scenario: 'scenario2' },
        { name: 'example4.json', path: 'public/examples/scenario2/example4.json', scenario: 'scenario2' }
      ]);
    }
  };

  const generateChartSpecs = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setGenerationStatus('Analyzing narrative sentences...');
    setError(null);
    setGenerationResult(null);

    try {
      const response = await fetch('/api/generate-chart-specs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputFile: selectedFile
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setGenerationResult(result.data);
        setGenerationStatus(`✅ Generated ${result.data.metadata.totalCharts} chart specifications for ${result.data.metadata.totalSentences} sentences!`);
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

  const resetGenerator = () => {
    setGenerationResult(null);
    setError(null);
    setGenerationStatus('');
    setSelectedFile('');
    setSelectedSentence('1');
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Generating Chart Specifications</h2>
          <p className="text-gray-600 mb-4">{generationStatus}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-700">
              <strong>Processing:</strong> Analyzing each sentence individually:
            </p>
            <ul className="text-xs text-blue-600 mt-2 space-y-1">
              <li>• Processing each sentence with separate LLM call</li>
              <li>• Checking sentence content for dashboard vs chart intent</li>
              <li>• Generating 204 charts for dashboard sentences</li>
              <li>• Generating 1 chart for regular sentences</li>
              <li>• Validating all chart specifications</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (generationResult) {
    const sentences = generationResult.sentences || {};
    const sentenceIds = Object.keys(sentences);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chart Specification Results</h1>
              <p className="text-sm text-gray-600">
                Generated from {selectedFile} • 
                {' '}{generationResult.metadata.totalCharts} charts for {generationResult.metadata.totalSentences} sentences
              </p>
              <p className="text-xs text-gray-500">
                Saved to: {generationResult.metadata.outputFile}
              </p>
            </div>
            <button
              onClick={resetGenerator}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              🔄 Generate New Specifications
            </button>
          </div>
        </div>

        {/* Sentence Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex space-x-1 px-6 overflow-x-auto">
            {sentenceIds.map((sentenceId) => (
              <button
                key={sentenceId}
                onClick={() => setSelectedSentence(sentenceId)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedSentence === sentenceId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Sentence {sentenceId}
                <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  {sentences[sentenceId]?.charts?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Specifications for Selected Sentence */}
        <div className="p-6">
          {selectedSentence && sentences[selectedSentence] ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Sentence {selectedSentence} - Chart Specifications
                </h2>
                <p className="text-sm text-gray-600">
                  {sentences[selectedSentence].charts?.length || 0} chart specifications generated
                </p>
              </div>
              
              <div className="grid gap-6">
                {(sentences[selectedSentence].charts || []).map((chart: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{chart.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{chart.request.userQuery}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          chart.request.constraints.chartType === 'line' ? 'bg-blue-100 text-blue-700' :
                          chart.request.constraints.chartType === 'bar' ? 'bg-green-100 text-green-700' :
                          chart.request.constraints.chartType === 'scatter' ? 'bg-purple-100 text-purple-700' :
                          chart.request.constraints.chartType === 'pie' ? 'bg-orange-100 text-orange-700' :
                          chart.request.constraints.chartType === 'map' ? 'bg-red-100 text-red-700' :
                          chart.request.constraints.chartType === 'multiType' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {chart.request.constraints.chartType}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {chart.request.constraints.nodeSize}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Chart Configuration */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Chart Configuration</h4>
                        <div className="bg-gray-50 rounded p-3 text-sm">
                          <div className="space-y-1">
                            <div><strong>Type:</strong> {chart.request.constraints.chartType}</div>
                            {chart.request.constraints.subtype && (
                              <div><strong>Subtype:</strong> {chart.request.constraints.subtype}</div>
                            )}
                            <div><strong>Category:</strong> {chart.request.constraints.dataCategory}</div>
                            <div><strong>Max Points:</strong> {chart.request.constraints.maxDataPoints}</div>
                            {chart.request.constraints.destinations && (
                              <div><strong>Destinations:</strong> {chart.request.constraints.destinations.join(', ')}</div>
                            )}
                            {chart.request.constraints.selectedCountries && (
                              <div><strong>Countries:</strong> {chart.request.constraints.selectedCountries.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Filter Configuration */}
                      {chart.request.constraints.hasFieldFilter && chart.request.constraints.filterConfig && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Configuration</h4>
                          <div className="bg-blue-50 rounded p-3 text-sm">
                            <div className="space-y-1">
                              <div><strong>Type:</strong> {chart.request.constraints.filterConfig.filterType}</div>
                              <div><strong>Label:</strong> {chart.request.constraints.filterConfig.filterLabel}</div>
                              <div><strong>Default:</strong> {chart.request.constraints.filterConfig.defaultValue}</div>
                              <div><strong>Options:</strong> {chart.request.constraints.filterConfig.options.length} options</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* JSON Preview */}
                    <details className="mt-4">
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                        View JSON Specification
                      </summary>
                      <pre className="mt-2 bg-gray-900 text-gray-100 rounded p-4 text-xs overflow-x-auto">
                        {JSON.stringify(chart, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">Select a sentence to view chart specifications</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl mx-auto p-6">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Chart Specification Generator</h1>
        <p className="text-gray-600 mb-8">
          Generate chart specifications from example JSON files using OpenAI GPT-4
        </p>

        {error && (
          <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* File Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Example File</h3>
          
          {availableFiles.length === 0 ? (
            <div className="text-gray-500">Loading available files...</div>
          ) : (
            <div className="space-y-3">
              {availableFiles.map((file) => (
                <label key={file.path} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="selectedFile"
                    value={file.path}
                    checked={selectedFile === file.path}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-gray-500">
                      {file.scenario} • {file.path}
                      {file.sentenceCount && (
                        <span className="ml-2 text-blue-600">
                          ({file.sentenceCount} sentences)
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateChartSpecs}
          disabled={!selectedFile || isGenerating}
          className={`px-8 py-4 rounded-lg font-medium text-lg transition-colors ${
            selectedFile && !isGenerating
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? 'Generating...' : '🤖 Generate Chart Specifications with AI'}
        </button>

        {selectedFile && (
          <div className="mt-4 text-sm text-gray-600">
            Output will be saved as: <code>{selectedFile.replace('.json', '_data.json')}</code>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
          <h4 className="font-medium text-blue-800 mb-2">How It Works:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Processes each sentence in the exploration_path individually</p>
            <p>• Makes separate LLM call for each sentence (e.g., 40 sentences = 40 API calls)</p>
            <p>• Analyzes sentence content to determine if it's dashboard or chart intent</p>
            <p>• Generates 204 charts for dashboard sentences, 1 chart for regular sentences</p>
            <p>• Automatically adds filter configurations for bar and pie charts</p>
            <p>• Validates all specifications against supported types</p>
            <p>• Saves results to *_data.json format for chart generation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSpecGenerator;