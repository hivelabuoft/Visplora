// Test the double detection prevention and auto-punctuation logic

// Simulate the sentence detection workflow
function testDoubleDetectionPrevention() {
  console.log('Testing double detection prevention...\n');
  
  // Simulate a Set to track processed sentences (like in the component)
  const processedSentences = new Set<string>();
  
  function simulateDetection(sentence: string, reason: string) {
    console.log(`\n--- Processing: "${sentence}" (${reason}) ---`);
    
    // Auto-append period if sentence doesn't end with punctuation
    let sentenceForAnalysis = sentence.trim();
    if (sentenceForAnalysis && !/[.!?]$/.test(sentenceForAnalysis)) {
      sentenceForAnalysis += '.';
      console.log(`Auto-appended period: "${sentenceForAnalysis}"`);
    }
    
    // Create a unique key for this sentence (normalized)
    // Remove punctuation for duplicate detection, but keep original for analysis
    const sentenceKey = sentenceForAnalysis
      .toLowerCase()
      .replace(/[.!?]+$/, '') // Remove ending punctuation for deduplication
      .replace(/\s+/g, ' ')
      .trim();
    console.log(`Sentence key: "${sentenceKey}"`);
    
    // Check if we've already processed this sentence
    if (processedSentences.has(sentenceKey)) {
      console.log('❌ BLOCKED: Sentence already processed');
      return false;
    }
    
    // Mark this sentence as processed
    processedSentences.add(sentenceKey);
    console.log('✅ PROCESSED: Sentence sent for analysis');
    return true;
  }
  
  // Test scenarios
  console.log('=== Test Case 1: No punctuation then punctuation ===');
  simulateDetection('I am starting with a hunch and a goal', 'pause_detection');
  simulateDetection('I am starting with a hunch and a goal.', 'punctuation');
  
  console.log('\n=== Test Case 2: Different punctuation ===');
  simulateDetection('This is really interesting', 'emotional_expression');
  simulateDetection('This is really interesting?', 'punctuation');
  simulateDetection('This is really interesting!', 'punctuation');
  
  console.log('\n=== Test Case 3: Different sentences ===');
  simulateDetection('I think this is amazing', 'emotional_expression');
  simulateDetection('I believe this is fantastic', 'emotional_expression');
  
  console.log('\n=== Test Case 4: Same sentence with different spacing ===');
  simulateDetection('I   am    very     excited', 'emotional_expression');
  simulateDetection('I am very excited', 'emotional_expression');
  
  console.log('\nProcessed sentences:', Array.from(processedSentences));
}

testDoubleDetectionPrevention();

export {};
