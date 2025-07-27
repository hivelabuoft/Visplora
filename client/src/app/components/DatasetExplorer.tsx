'use client';

import React, { useState, useEffect } from 'react';
import '../../styles/dataExplorer.css';

interface DatasetFile {
  id: string;
  name: string;
  path: string;
  description: string;
}

interface DatasetCategory {
  name: string;
  description: string;
  files: DatasetFile[];
}

interface DatasetExplorerProps {
  onAnalysisRequest: (prompt: string) => void;
  onFileSelection: (selectedFiles: DatasetFile[]) => void;
  isAnalyzing: boolean;
}

const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ onAnalysisRequest, onFileSelection, isAnalyzing }) => {
  const [datasets, setDatasets] = useState<DatasetCategory[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Load dataset information
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        console.log('Loading datasets from /data/london_datasets.json...');
        const response = await fetch('/data/london_datasets.json');
        
        if (!response.ok) {
          console.error('Failed to fetch datasets:', response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log('Loaded dataset data:', data);
        console.log('Categories:', data.categories);
        
        setDatasets(data.categories || []);
        
        // Expand the first category by default if there are categories
        if (data.categories && data.categories.length > 0) {
          setExpandedCategories({ [data.categories[0].name]: true });
        }
      } catch (error) {
        console.error('Failed to load datasets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDatasets();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isAnalyzing) {
      onAnalysisRequest(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelection = (fileId: string, file: DatasetFile) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileId)) {
      newSelectedFiles.delete(fileId);
    } else {
      newSelectedFiles.add(fileId);
    }
    setSelectedFiles(newSelectedFiles);
    
    // Get all selected file objects
    const selectedFileObjects: DatasetFile[] = [];
    datasets.forEach(category => {
      category.files.forEach(f => {
        if (newSelectedFiles.has(f.id)) {
          selectedFileObjects.push(f);
        }
      });
    });
    
    onFileSelection(selectedFileObjects);
  };

  const handleAnalyzeSelectedFiles = () => {
    if (selectedFiles.size > 0) {
      const fileNames = Array.from(selectedFiles).map(id => {
        const file = datasets.flatMap(cat => cat.files).find(f => f.id === id);
        return file?.name || id;
      }).join(', ');
      onAnalysisRequest(`Analyze the following selected files: ${fileNames}`);
    }
  };

  if (isLoading) {
    return (
      <div className="data-explorer h-full flex items-center justify-center">
        <div className="text-center">
          <div className="analysis-spinner mb-4"></div>
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-explorer h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="data-explorer-header flex-shrink-0">
        <h1 className="data-explorer-title">Data Explorer</h1>
      </div>

      {/* Datasets Grid */}
      <div className="dataset-grid">
        {(() => {
          console.log('Rendering datasets:', datasets);
          return datasets.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-500">No datasets found</p>
              <p className="text-sm text-gray-400 mt-2">Check console for loading errors</p>
            </div>
          ) : (
            datasets.map((category, index) => {
              console.log('Rendering category:', category);
              const isExpanded = expandedCategories[category.name] || false;
              
              return (
                <div key={index} className="dataset-category">
                  <button 
                    className="dataset-category-header"
                    onClick={() => setExpandedCategories(prev => ({
                      ...prev,
                      [category.name]: !prev[category.name]
                    }))}
                  >
                    <div className="dataset-category-header-content">
                      <h3 className="dataset-category-name">
                        {category.name.replace(/-/g, ' ')}
                      </h3>
                      <p className="dataset-category-description">
                        {category.description}
                      </p>
                    </div>
                    <svg 
                      className={`dataset-category-chevron ${isExpanded ? 'expanded' : ''}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      width="20"
                      height="20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className={`dataset-files ${isExpanded ? 'expanded' : ''}`}>
                    {category.files.map((file) => (
                      <div key={file.id} className={`dataset-file ${selectedFiles.has(file.id) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => handleFileSelection(file.id, file)}
                          className="dataset-file-checkbox"
                        />
                        <svg className="dataset-file-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4.586a1 1 0 01.707.293L12 6h4a1 1 0 110 2H4v8a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 112 0v7a3 3 0 01-3 3H5a3 3 0 01-3-3V4z" clipRule="evenodd" />
                        </svg>
                        <div className="dataset-file-info">
                          <div className="dataset-file-name">{file.name}</div>
                          <div className="dataset-file-description">{file.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          );
        })()}
      </div>

      {/* Selected Files Section */}
      {/* {selectedFiles.size > 0 && (
        <div className="selected-files-section">
          <div className="selected-files-header">
            <h3>Selected Files ({selectedFiles.size})</h3>
            <button 
              className="analyze-selected-button"
              onClick={handleAnalyzeSelectedFiles}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Selected Files'}
            </button>
          </div>
        </div>
      )} */}

      {/* Upload Section */}
      <div className="upload-section">
        <button className="upload-button" disabled>
          <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Upload Dataset
        </button>
      </div>

      {/* Prompt Section */}
      <div className="prompt-section">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <label className="prompt-label">
            What would you like to explore?
          </label>
          <textarea
            className="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask me anything about London data... 

Examples:
• Show me crime rates across different boroughs
• Compare housing prices with population density
• Analyze the relationship between income and education
• What areas have the highest gym-to-population ratio?`}
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            className="prompt-submit"
            disabled={!prompt.trim() || isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Generate Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DatasetExplorer;
