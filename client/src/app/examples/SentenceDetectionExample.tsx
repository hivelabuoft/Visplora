// Example usage in a parent component
import React, { useState } from 'react';
import NarrativeLayer from '../components/NarrativeLayer';

const ExampleParent: React.FC = () => {
  const [llmInsights, setLlmInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const handleSentenceEnd = async (sentence: string, confidence: number) => {
    // console.log(`Sentence detected with confidence ${confidence}: "${sentence}"`);
    
    if (confidence > 0.7) {
      setIsLoadingInsights(true);
      
      try {
        // Call your LLM API here
        const response = await fetch('/api/analyze-sentence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sentence,
            confidence,
            context: {
              // Add any chart context or other relevant data
              chartType: 'bar-chart',
              datasetInfo: 'london-housing-data',
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setLlmInsights(data.insights || 'No insights generated');
        } else {
          console.error('Failed to get LLM insights');
        }
      } catch (error) {
        console.error('Error calling LLM API:', error);
      } finally {
        setIsLoadingInsights(false);
      }
    }
  };

  return (
    <div className="example-container">
      <NarrativeLayer
        prompt=""
        onSentenceEnd={handleSentenceEnd}
        onSentenceSelect={(sentence, index) => {
          console.log(`Selected sentence ${index}: ${sentence}`);
        }}
      />
      
      {/* Optional: Display LLM insights */}
      {llmInsights && (
        <div className="llm-insights-panel">
          <h4>💡 AI Insights</h4>
          <p>{llmInsights}</p>
          {isLoadingInsights && <div className="loading">Analyzing...</div>}
        </div>
      )}
    </div>
  );
};

export default ExampleParent;
