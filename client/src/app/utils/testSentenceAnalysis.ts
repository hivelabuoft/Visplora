import { detectSentenceEnd, isWordComplete } from './sentenceDetector';

// Test why this specific sentence isn't detected as complete
function testSentenceAnalysis() {
  const testText = 'I think this is really interesting';
  
  console.log('Analyzing:', testText);
  console.log('Word complete:', isWordComplete(testText));
  
  const result = detectSentenceEnd(testText);
  console.log('Basic detection result:', result);
  
  // Let's test some variations that should trigger
  const variations = [
    'I think this is really amazing',      // emotional word
    'I think this is really disappointing', // negative word  
    'I think this is really good for us',   // longer
    'I really think this is interesting',   // different structure
    'I believe this is really interesting', // different verb
  ];
  
  variations.forEach(text => {
    const result = detectSentenceEnd(text);
    console.log(`"${text}" -> ${result.reason} (${result.isSentenceEnd ? 'END' : 'continue'}, ${(result.confidence * 100).toFixed(0)}%)`);
  });
}

testSentenceAnalysis();

export {};
