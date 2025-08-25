'use client';

import React, { useRef, useState, useEffect } from 'react';
import ReactFlowCanvas, { ReactFlowCanvasRef, ViewGeneratorData } from '../components/ReactFlowCanvas';

const TestViewGenerator: React.FC = () => {
  const canvasRef = useRef<ReactFlowCanvasRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadError, setLoadError] = useState<string>('');

  // Load actual data from example2_data.json on component mount
  useEffect(() => {
    const loadExampleData = async () => {
      setLoadingDatasets(true);
      setLoadError('');
      
      try {
        const response = await fetch('/examples/scenario2/example2_data.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load example2_data.json: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setDatasets(Array.isArray(data) ? data : [data]);
        
        console.log('📊 Loaded ViewGenerator test data:', {
          sentences: data.length,
          totalCharts: data.reduce((total: number, sentence: any) => total + (sentence.charts?.length || 0), 0)
        });
        
      } catch (error) {
        console.error('❌ Failed to load example data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load example data');
        setDatasets([]);
      } finally {
        setLoadingDatasets(false);
      }
    };
    
    loadExampleData();
  }, []);

  const addViewGeneratorNode = (data: any) => {
    if (canvasRef.current) {
      setIsLoading(true);
      
      const viewGeneratorData: ViewGeneratorData = {
        sentence_id: data.sentence_id,
        charts: data.charts,
        onInteraction: (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
          console.log('ViewGenerator interaction:', { elementId, elementName, elementType, action, metadata });
        },
        isGreyedOut: false
      };

      canvasRef.current.addViewGeneratorNode(viewGeneratorData);
      
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearAllNodes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ViewGenerator Canvas Test</h1>
              <p className="text-gray-600 mt-1">
                Testing ViewGenerator integration with ReactFlowCanvas using example2_data.json format
              </p>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={isLoading}
              >
                Clear Canvas
              </button>
              <div className="text-sm text-gray-500">
                {loadingDatasets 
                  ? 'Loading datasets...' 
                  : loadError 
                    ? 'Failed to load data' 
                    : `${datasets.length} datasets available`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Selection */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Sample Datasets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingDatasets ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading example data...</p>
              </div>
            ) : loadError ? (
              <div className="col-span-full text-center py-8">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <p className="text-red-600 mb-2">Failed to Load Data</p>
                <p className="text-sm text-gray-500">{loadError}</p>
              </div>
            ) : datasets.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <p className="text-gray-600">No ViewGenerator data found</p>
              </div>
            ) : (
              datasets.map((dataset: any) => (
                <div key={dataset.sentence_id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                      Sentence #{dataset.sentence_id}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {dataset.charts?.length || 0} charts
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">Chart types:</div>
                    <div className="flex flex-wrap gap-1">
                      {dataset.charts ? (Array.from(new Set(dataset.charts.map((c: any) => c.chart_type))) as string[]).map((type: string) => (
                        <span 
                          key={type}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                        >
                          {type}
                        </span>
                      )) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => addViewGeneratorNode(dataset)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading ? 'Loading...' : 'Add to Canvas'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1" style={{ height: 'calc(100vh - 220px)' }}>
        <ReactFlowCanvas ref={canvasRef} />
      </div>

      {/* Instructions */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Add to Canvas" on any dataset to create a ViewGenerator node</li>
            <li>• Drag nodes around the canvas to organize them</li>
            <li>• Select nodes to resize them using the resize handles</li>
            <li>• Each ViewGenerator shows charts based on the example2_data.json format</li>
            <li>• Use "Clear Canvas" to remove all nodes and start fresh</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestViewGenerator;