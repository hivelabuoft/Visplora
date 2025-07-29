import React, { useState } from 'react';
import { validateDomain } from '../LLMs/domainValidation';
import { testCompleteDomainValidation, TestResult } from '../utils/testCompleteDomainValidation';

export default function TestDomainValidation() {
  const [testInput, setTestInput] = useState('');
  const [isTestingIndividual, setIsTestingIndividual] = useState(false);
  const [isTestingComplete, setIsTestingComplete] = useState(false);
  const [individualResult, setIndividualResult] = useState<any>(null);
  const [completeResults, setCompleteResults] = useState<TestResult[] | null>(null);

  const handleIndividualTest = async () => {
    if (!testInput.trim() || isTestingIndividual) return;

    setIsTestingIndividual(true);
    setIndividualResult(null);

    try {
      const result = await validateDomain(testInput.trim());
      setIndividualResult(result);
      console.log('🔍 Individual test result:', result);
    } catch (error) {
      setIndividualResult({ success: false, error: 'Test failed', message: error });
      console.error('❌ Individual test error:', error);
    } finally {
      setIsTestingIndividual(false);
    }
  };

  const handleCompleteTest = async () => {
    if (isTestingComplete) return;

    setIsTestingComplete(true);
    setCompleteResults(null);

    try {
      const results = await testCompleteDomainValidation();
      setCompleteResults(results);
      console.log('🧪 Complete test results:', results);
    } catch (error) {
      console.error('❌ Complete test error:', error);
    } finally {
      setIsTestingComplete(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Domain Validation Testing</h1>
        
        {/* Individual Test Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Individual Question</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter a question to test..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleIndividualTest()}
            />
            <button
              onClick={handleIndividualTest}
              disabled={!testInput.trim() || isTestingIndividual}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTestingIndividual ? 'Testing...' : 'Test'}
            </button>
          </div>

          {/* Individual Result */}
          {individualResult && (
            <div className="mt-4 p-4 rounded-lg border">
              {individualResult.success && individualResult.validation ? (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Validation Result:</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Data-driven Question:</span>{' '}
                      <span className={individualResult.validation.is_data_driven_question ? 'text-green-600' : 'text-red-600'}>
                        {individualResult.validation.is_data_driven_question ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Inquiry Supported:</span>{' '}
                      <span className={individualResult.validation.inquiry_supported ? 'text-green-600' : 'text-red-600'}>
                        {individualResult.validation.inquiry_supported ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Matched Datasets:</span>{' '}
                      {individualResult.validation.matched_dataset.length > 0 
                        ? individualResult.validation.matched_dataset.join(', ')
                        : 'None'
                      }
                    </div>
                    {Object.keys(individualResult.validation.matched_columns).length > 0 && (
                      <div>
                        <span className="font-medium">Matched Columns:</span>
                        <div className="ml-4 mt-1">
                          {Object.entries(individualResult.validation.matched_columns).map(([dataset, columns]) => (
                            <div key={dataset} className="text-xs">
                              <span className="font-medium">{dataset}:</span> {(columns as string[]).join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Explanation:</span>{' '}
                      {individualResult.validation.explanation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <h3 className="font-medium mb-2">Error:</h3>
                  <p>{individualResult.error || 'Unknown error'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Complete Test Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Run Complete Test Suite</h2>
          
          <button
            onClick={handleCompleteTest}
            disabled={isTestingComplete}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingComplete ? 'Running Tests...' : 'Run All Tests'}
          </button>

          {/* Complete Test Results */}
          {completeResults && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-800 mb-4">
                Test Results: {completeResults.filter(r => r.passed).length}/{completeResults.length} Passed
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completeResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      result.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{result.sentence}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Expected: data-driven={result.expected.is_data_driven_question ? 'true' : 'false'}, 
                          supported={result.expected.inquiry_supported ? 'true' : 'false'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Actual: data-driven={result.actual.is_data_driven_question ? 'true' : 'false'}, 
                          supported={result.actual.inquiry_supported ? 'true' : 'false'}
                        </p>
                        {result.matched_datasets.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Datasets: {result.matched_datasets.join(', ')}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">Error: {result.error}</p>
                        )}
                      </div>
                      <span className={`ml-3 text-lg ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {result.passed ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-2">Domain Validation Integration:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Domain validation now happens when users click "Show View" on completed sentences in NarrativeLayer</li>
            <li>• The system validates if the sentence is data-driven and supported by available datasets</li>
            <li>• Users get immediate feedback about whether a view can be generated</li>
            <li>• Non-data questions and unsupported queries are gracefully handled with explanations</li>
          </ul>
          
          <h3 className="font-medium text-blue-800 mb-2 mt-4">Testing Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use the individual test to validate specific questions</li>
            <li>• Run the complete test suite to validate the entire system</li>
            <li>• Check the browser console for detailed logs</li>
            <li>• Tests validate both data-driven classification and dataset support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
