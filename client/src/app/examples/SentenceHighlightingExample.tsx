import React from 'react';
import NarrativeLayer from '../components/NarrativeLayer';

const SentenceHighlightingExample: React.FC = () => {
  const handleSentenceEnd = async (sentence: string, confidence: number) => {
    // console.log('Sentence completed for analysis:', sentence, 'Confidence:', confidence);
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 1000));
    // console.log('Analysis complete for:', sentence);
  };

  const handleSentenceSelect = (sentence: string, index: number) => {
    // console.log('Sentence selected:', sentence, 'Index:', index);
  };

  return (
    <div style={{ width: '800px', height: '600px', margin: '20px auto', border: '1px solid #ccc' }}>
      <h2 style={{ textAlign: 'center', margin: '20px' }}>Sentence Highlighting Demo</h2>
      <div style={{ padding: '20px' }}>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Type some sentences and watch them get highlighted when completed! 
          Try typing: "I think this is really interesting" and pause for 2 seconds.
        </p>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', height: '400px' }}>
          <NarrativeLayer
            prompt=""
            onSentenceEnd={handleSentenceEnd}
            onSentenceSelect={handleSentenceSelect}
          />
        </div>
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p><strong>Features:</strong></p>
          <ul>
            <li>Completed sentences get a light yellow background</li>
            <li>Hover over a completed sentence to see console log</li>
            <li>Click on a completed sentence to see console log</li>
            <li>Double-click on a completed sentence to edit it</li>
            <li>Auto-punctuation when sentences are detected</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SentenceHighlightingExample;
