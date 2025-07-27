import { detectSentenceEndWithTiming } from './sentenceDetector';

// Test the pause detection workflow
function testPauseDetection() {
  console.log('Testing pause detection workflow...\n');
  
  const testText = 'I think this is really interesting';
  
  // Simulate recent keystroke (should show "waiting_for_pause")
  console.log('--- Step 1: Recent keystroke (500ms ago) ---');
  const result1 = detectSentenceEndWithTiming(testText, Date.now() - 500);
  console.log('Result:', result1);
  console.log(`Expected: waiting_for_pause, Got: ${result1.reason}\n`);
  
  // Simulate pause threshold reached (should trigger sentence detection)
  console.log('--- Step 2: After pause threshold (3 seconds ago) ---');
  const result2 = detectSentenceEndWithTiming(testText, Date.now() - 3000);
  console.log('Result:', result2);
  console.log(`Expected: complete_thought_with_pause, Got: ${result2.reason}\n`);
  
  // Test with incomplete word
  console.log('--- Step 3: Incomplete word with pause ---');
  const result3 = detectSentenceEndWithTiming('I think this is interes', Date.now() - 3000);
  console.log('Result:', result3);
  console.log(`Expected: incomplete_word, Got: ${result3.reason}\n`);
  
  // Test gradual progression
  console.log('--- Step 4: Gradual time progression ---');
  const timeProgression = [100, 500, 1000, 1500, 2000, 2500, 3000];
  
  timeProgression.forEach(ms => {
    const result = detectSentenceEndWithTiming(testText, Date.now() - ms);
    console.log(`${ms}ms ago: ${result.reason} (${result.isSentenceEnd ? 'TRIGGER' : 'wait'}) - confidence: ${(result.confidence * 100).toFixed(0)}%`);
  });
}

// Run the test
testPauseDetection();

export {};
