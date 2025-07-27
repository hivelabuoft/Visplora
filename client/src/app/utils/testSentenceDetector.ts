import { detectSentenceEndWithTiming, isWordComplete } from './sentenceDetector';

// Test the specific examples with both apostrophe and non-apostrophe versions
const testSentences = [
  "wait a moment, did that just worked I am so surprised",
  "this isnt exactly what I was hoping for",
  "this isn't exactly what I was hoping for", // With apostrophe
  "I dont think this is right",
  "I don't think this is right", // With apostrophe
  "you cant be serious about this",
  "you can't be serious about this" // With apostrophe
];

// Simulate typing pause (2+ seconds ago)
const twoSecondsAgo = Date.now() - 2500;

testSentences.forEach((sentence, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  console.log('Testing sentence:', sentence);
  console.log('Word complete check:', isWordComplete(sentence));

  const result = detectSentenceEndWithTiming(sentence, twoSecondsAgo, 2000);

  console.log('Detection result:', {
    isSentenceEnd: result.isSentenceEnd,
    reason: result.reason,
    confidence: result.confidence
  });
});

// Expected outputs:
// Both "isnt" and "isn't" should be normalized to "is not" and detected properly
// Both "dont" and "don't" should be normalized to "do not" and detected properly
// Both "cant" and "can't" should be normalized to "can not" and detected properly

export { }; // Make this a module
