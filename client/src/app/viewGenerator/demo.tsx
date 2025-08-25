'use client';

import React, { useState, useEffect } from 'react';
import ViewGenerator from './page';

// Sample data in the example2_data.json format
const sampleData = [
  {
    "sentence_id": 1,
    "charts": [
      {
        "chart_type": "Choropleth",
        "description": "Median housing price by borough",
        "size": "large",
        "data": {}
      },
      {
        "chart_type": "Bar",
        "description": "Average housing price per borough - Distance from the city center",
        "variation": ["with_mean", "3d"],
        "size": "medium",
        "data": {}
      },
      {
        "chart_type": "Bar",
        "description": "Top 5 boroughs by average housing price",
        "variation": ["with_mean"],
        "size": "medium",
        "data": {}
      },
      {
        "chart_type": "Bar",
        "description": "Bottom 5 boroughs by average housing price",
        "variation": ["with_mean"],
        "size": "small",
        "data": {}
      }
    ]
  },
  {
    "sentence_id": 2,
    "charts": [
      {
        "chart_type": "Line",
        "description": "Population trends over the past decade",
        "size": "large",
        "data": {}
      },
      {
        "chart_type": "Pie",
        "description": "Crime distribution by category",
        "size": "medium",
        "data": {}
      },
      {
        "chart_type": "Scatter",
        "description": "Income vs House Price correlation",
        "size": "medium",
        "data": {}
      }
    ]
  }
];

const ViewGeneratorDemo: React.FC = () => {
  const [selectedSentence, setSelectedSentence] = useState<number>(1);
  const [currentData, setCurrentData] = useState(sampleData[0]);

  useEffect(() => {
    const sentenceData = sampleData.find(data => data.sentence_id === selectedSentence);
    if (sentenceData) {
      setCurrentData(sentenceData);
    }
  }, [selectedSentence]);

  const handleInteraction = (elementId: string, elementName: string, elementType: string, action: string, metadata?: any) => {
    console.log('Interaction:', { elementId, elementName, elementType, action, metadata });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">ViewGenerator Demo</h1>
            <p className="text-sm text-gray-600">Demonstrating chart generation from example2_data.json format</p>
          </div>
          
          {/* Sentence Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Select Sentence:</span>
            {sampleData.map((data) => (
              <button
                key={data.sentence_id}
                onClick={() => setSelectedSentence(data.sentence_id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSentence === data.sentence_id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sentence #{data.sentence_id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ViewGenerator Component */}
      <div className="max-w-7xl mx-auto p-6">
        <ViewGenerator
          sentence_id={currentData.sentence_id}
          charts={currentData.charts}
          onInteraction={handleInteraction}
        />
      </div>

      {/* Debug Information */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Current Data Structure:</h3>
          <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
            {JSON.stringify(currentData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ViewGeneratorDemo;