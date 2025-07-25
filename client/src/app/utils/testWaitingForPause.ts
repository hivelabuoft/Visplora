import { detectSentenceEndWithTiming } from './sentenceDetector';

// Test the "waiting_for_pause" workflow specifically
function testWaitingForPause() {
  console.log('Testing "waiting_for_pause" workflow...\n');
  
  // Use a sentence that should be detected as complete by basic detection
  const testText = 'I think this is really interesting'; // Now should be emotional_expression
  
  // Step 1: Recent keystroke - should show "waiting_for_pause"
  console.log('--- Step 1: Recent keystroke (500ms ago) ---');
  const result1 = detectSentenceEndWithTiming(testText, Date.now() - 500);
  console.log('Result:', result1);
  
  // Step 2: After pause threshold - should trigger with "..._with_pause"
  console.log('\n--- Step 2: After pause threshold (3 seconds ago) ---');
  const result2 = detectSentenceEndWithTiming(testText, Date.now() - 3000);
  console.log('Result:', result2);
  
  // Test the progression through different timeframes
  console.log('\n--- Time progression for sentence that should trigger basic detection ---');
  const timeProgression = [100, 500, 1000, 1500, 2000, 2500, 3000];
  
  timeProgression.forEach(ms => {
    const result = detectSentenceEndWithTiming(testText, Date.now() - ms);
    console.log(`${ms}ms ago: ${result.reason} (${result.isSentenceEnd ? 'TRIGGER' : 'wait'}) - confidence: ${(result.confidence * 100).toFixed(0)}%`);
  });
  
  // Test with another sentence that should show waiting_for_pause
  console.log('\n--- Testing with different sentence: "This is really amazing" ---');
  const testText2 = 'This is really amazing';
  timeProgression.forEach(ms => {
    const result = detectSentenceEndWithTiming(testText2, Date.now() - ms);
    console.log(`${ms}ms ago: ${result.reason} (${result.isSentenceEnd ? 'TRIGGER' : 'wait'}) - confidence: ${(result.confidence * 100).toFixed(0)}%`);
  });
}

testWaitingForPause();

export {};
