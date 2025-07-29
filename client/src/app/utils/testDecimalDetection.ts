/**
 * Test file for decimal number detection in sentence detection
 */
import { detectSentenceEnd } from './sentenceDetector';
import { detectNumbers, NumberMatch } from './numberDetector';

// Test cases for decimal number detection
const testCases = [
  {
    input: "The value is 70",
    expected: false,
    description: "Number without decimal - should not be sentence end"
  },
  {
    input: "The value is 70.",
    expected: false,
    description: "Number with period (start of decimal) - should not be sentence end"
  },
  {
    input: "The value is 70.46",
    expected: false,
    description: "Complete decimal number - should not be sentence end"
  },
  {
    input: "The value is 70.46 percent",
    expected: false,
    description: "Decimal number in middle of sentence - should not be sentence end"
  },
  {
    input: "The result was unexpected.",
    expected: true,
    description: "Regular sentence with period - should be sentence end"
  },
  {
    input: "I found the number 70.46 in the data.",
    expected: true,
    description: "Sentence ending with period after decimal number - should be sentence end"
  },
  {
    input: "The rate increased by 15.5",
    expected: false,
    description: "Sentence ending with decimal number only - should not be sentence end"
  }
];

function runTests() {
  console.log('🧪 Testing decimal number detection in sentence detection...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = detectSentenceEnd(testCase.input);
    const numberResult = detectNumbers(testCase.input);
    
    const isCorrect = result.isSentenceEnd === testCase.expected;
    
    if (isCorrect) {
      passed++;
      console.log(`✅ Test ${index + 1}: ${testCase.description}`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: ${testCase.description}`);
      console.log(`   Input: "${testCase.input}"`);
      console.log(`   Expected: ${testCase.expected}, Got: ${result.isSentenceEnd}`);
      console.log(`   Reason: ${result.reason}, Confidence: ${result.confidence}`);
      console.log(`   Numbers found: ${numberResult.numbers.map((n: NumberMatch) => `${n.text} (${n.type})`).join(', ')}`);
    }
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Result: ${result.isSentenceEnd} (${result.reason}, ${result.confidence})`);
    console.log(`   Numbers: ${numberResult.numbers.map((n: NumberMatch) => `${n.text}(${n.type})`).join(', ')}\n`);
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logic above.');
  }
}

// Run the tests
runTests();

export { runTests };
