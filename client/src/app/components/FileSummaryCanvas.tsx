'use client';

import React from 'react';
import { FileSummary, ColumnSummary } from '../../utils/londonDataLoader';

interface FileSummaryCanvasProps {
  summaries: FileSummary[];
  isLoading: boolean;
  error?: string;
}

const FileSummaryCanvas: React.FC<FileSummaryCanvasProps> = ({ summaries, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing selected files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Selected</h3>
          <p className="text-gray-600">Select files from the dataset explorer to see their summaries here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-4">
      <div className="max-w-none">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Dataset Analysis</h2>
          <p className="text-sm text-gray-600">{summaries.length} file{summaries.length > 1 ? 's' : ''} analyzed</p>
        </div>

        <div className="space-y-4">
          {summaries.map((summary, index) => (
            <FileSummaryCard key={index} summary={summary} />
          ))}
        </div>
      </div>
    </div>
  );
};

const FileSummaryCard: React.FC<{ summary: FileSummary }> = ({ summary }) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-blue-100 text-blue-800';
      case 'categorical': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'text': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{summary.file.name}</h3>
            <p className="text-gray-600 text-sm">{summary.file.description}</p>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span>{summary.totalRows.toLocaleString()} rows</span>
              <span>{summary.totalColumns} columns</span>
              <span>{formatFileSize(summary.fileSize)}</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-sm font-medium ${
            summary.completeness > 90 ? 'bg-green-100 text-green-800' :
            summary.completeness > 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {summary.completeness}% Complete
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="border-b border-gray-200">
        <button
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          onClick={() => toggleSection('overview')}
        >
          <h4 className="font-medium text-gray-900">Overview</h4>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              expandedSections.has('overview') ? 'rotate-180' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedSections.has('overview') && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-blue-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-blue-600">{summary.totalRows.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Total Rows</div>
              </div>
              <div className="bg-green-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-green-600">{summary.completeness}%</div>
                <div className="text-xs text-green-600">Complete</div>
              </div>
              <div className="bg-purple-50 p-3 rounded text-center">
                <div className="text-lg font-semibold text-purple-600">{summary.dataQuality.duplicateRows.toLocaleString()}</div>
                <div className="text-xs text-purple-600">Duplicates</div>
              </div>
            </div>
            
            {summary.insights.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2 text-sm">Key Insights</h5>
                <ul className="space-y-1">
                  {summary.insights.map((insight, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Enhanced Metadata Information */}
            {summary.file.file_summary && (
              <div className="mt-3 p-3 bg-blue-50 rounded border">
                <h5 className="font-medium text-blue-900 mb-2 text-sm">Enhanced Metadata Available</h5>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>✓ Pre-analyzed column types and examples</div>
                  <div>✓ Statistical summaries and value ranges</div>
                  <div>✓ Data samples for quick preview</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columns Section */}
      <div className="border-b border-gray-200">
        <button
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          onClick={() => toggleSection('columns')}
        >
          <h4 className="font-medium text-gray-900">Column Analysis ({summary.columns.length})</h4>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              expandedSections.has('columns') ? 'rotate-180' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedSections.has('columns') && (
          <div className="px-4 pb-3">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unique</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Missing</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.columns.map((column, i) => (
                    <ColumnRow key={i} column={column} fileSummary={summary.file.file_summary} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Data Preview Section */}
      <div>
        <button
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
          onClick={() => toggleSection('preview')}
        >
          <h4 className="font-medium text-gray-900">Data Preview ({summary.preview.length} rows)</h4>
          <svg
            className={`w-4 h-4 transform transition-transform ${
              expandedSections.has('preview') ? 'rotate-180' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {expandedSections.has('preview') && (
          <div className="px-4 pb-3">
            {summary.preview.length > 0 ? (
              <div className="overflow-x-auto bg-gray-50 rounded border">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(summary.preview[0] || {}).map((header) => (
                        <th key={header} className="px-2 py-2 text-left font-medium text-gray-700 border-r last:border-r-0">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {summary.preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).map((value: any, j) => (
                          <td key={j} className="px-2 py-2 text-gray-900 border-r last:border-r-0 max-w-32">
                            <div className="truncate" title={String(value)}>
                              {String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No preview data available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ColumnRow: React.FC<{ column: ColumnSummary; fileSummary?: any }> = ({ column, fileSummary }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-blue-100 text-blue-800';
      case 'categorical': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'text': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStats = () => {
    if (column.type === 'numeric' && column.mean !== undefined) {
      return (
        <div className="text-xs text-gray-600">
          <div>Mean: {column.mean}</div>
          <div>Range: {column.min} - {column.max}</div>
        </div>
      );
    }
    
    if (column.type === 'categorical' && column.topValues) {
      return (
        <div className="text-xs text-gray-600">
          <div>Top: {column.topValues[0]?.value}</div>
          <div>({column.topValues[0]?.percentage}%)</div>
        </div>
      );
    }
    
    if (column.type === 'date' && column.dateRange) {
      return (
        <div className="text-xs text-gray-600">
          {column.dateRange}
        </div>
      );
    }
    
    // Enhanced: Show value examples from metadata if available
    if (fileSummary?.value_examples?.[column.name]) {
      const examples = fileSummary.value_examples[column.name];
      if (examples.length > 0) {
        return (
          <div className="text-xs text-gray-600">
            <div className="truncate" title={examples.slice(0, 3).join(', ')}>
              {examples.slice(0, 2).join(', ')}
              {examples.length > 2 ? '...' : ''}
            </div>
          </div>
        );
      }
    }
    
    return <div className="text-xs text-gray-400">-</div>;
  };

  return (
    <tr>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{column.name}</div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getTypeColor(column.type)}`}>
          {column.type}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
        {column.uniqueValues.toLocaleString()}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="text-sm text-gray-900">{column.nullPercentage}%</div>
        <div className="text-xs text-gray-500">({column.nullCount.toLocaleString()})</div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {renderStats()}
      </td>
    </tr>
  );
};

export default FileSummaryCanvas;