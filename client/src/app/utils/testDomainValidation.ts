// Test utility for domain validation API
// Run in browser console or as a utility script

import { validateDomain, quickDomainCheck, getOutOfScopeFeedback } from '../LLMs/domainValidation';

export async function testDomainValidation() {
  console.log('🧪 Testing Domain Validation API...\n');

  const testCases = [
    // In-scope examples
    {
      sentence: "Show me crime rates across different London boroughs",
      expectedSupported: true,
      expectedDataDriven: true,
      description: "Crime data inquiry"
    },
    {
      sentence: "Compare housing prices with population density",
      expectedSupported: true,
      expectedDataDriven: true,
      description: "Housing and population analysis"
    },
    {
      sentence: "What's the ethnic diversity in Tower Hamlets?",
      expectedSupported: true,
      expectedDataDriven: true,
      description: "Ethnicity in specific borough"
    },
    {
      sentence: "Analyze income levels by borough",
      expectedSupported: true,
      expectedDataDriven: true,
      description: "Income analysis"
    },
    // Out-of-scope examples
    {
      sentence: "Show me weather patterns in London",
      expectedSupported: false,
      expectedDataDriven: true,
      description: "Weather data (not available)"
    },
    {
      sentence: "Compare London to Paris housing prices",
      expectedSupported: false,
      expectedDataDriven: true,
      description: "Paris data (not available)"
    },
    {
      sentence: "Find me the best restaurants in Shoreditch",
      expectedSupported: false,
      expectedDataDriven: true,
      description: "Specific restaurant recommendations"
    },
    {
      sentence: "What's the current COVID situation in London?",
      expectedSupported: false,
      expectedDataDriven: true,
      description: "Healthcare data (not available)"
    },
    // Non-data-driven examples
    {
      sentence: "I love living in London",
      expectedSupported: false,
      expectedDataDriven: false,
      description: "Personal opinion (not data question)"
    },
    {
      sentence: "Hello, how are you?",
      expectedSupported: false,
      expectedDataDriven: false,
      description: "General greeting (not data question)"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.description}`);
    console.log(`💬 Sentence: "${testCase.sentence}"`);
    
    // Quick check first
    const quickResult = quickDomainCheck(testCase.sentence);
    console.log(`⚡ Quick check: ${quickResult ? '✅ In scope' : '❌ Out of scope'}`);
    
    if (!quickResult) {
      const feedback = getOutOfScopeFeedback(testCase.sentence);
      console.log(`💡 Quick feedback: ${feedback}`);
    }
    
    // Full API validation
    try {
      const result = await validateDomain(testCase.sentence);
      
      if (result.success && result.validation) {
        const validation = result.validation;
        console.log(`🤖 LLM result: Data-driven: ${validation.is_data_driven_question ? '✅' : '❌'}, Supported: ${validation.inquiry_supported ? '✅' : '❌'}`);
        console.log(`� Matched datasets: ${validation.matched_dataset.join(', ') || 'none'}`);
        
        if (Object.keys(validation.matched_columns).length > 0) {
          console.log(`� Matched columns:`);
          Object.entries(validation.matched_columns).forEach(([dataset, columns]) => {
            console.log(`  ${dataset}: ${columns.join(', ')}`);
          });
        }
        
        console.log(`� Explanation: ${validation.explanation}`);
        
        // Check if result matches expectation
        const isDataDrivenCorrect = validation.is_data_driven_question === testCase.expectedDataDriven;
        const isSupportedCorrect = validation.inquiry_supported === testCase.expectedSupported;
        const isCorrect = isDataDrivenCorrect && isSupportedCorrect;
        console.log(`${isCorrect ? '✅' : '❌'} Result matches expectation: ${isCorrect}`);
        if (!isCorrect) {
          console.log(`  Expected: data-driven=${testCase.expectedDataDriven}, supported=${testCase.expectedSupported}`);
          console.log(`  Got: data-driven=${validation.is_data_driven_question}, supported=${validation.inquiry_supported}`);
        }
        
      } else {
        console.log(`❌ API Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error}`);
    }
    
    console.log('─'.repeat(80));
  }
  
  console.log('\n🏁 Domain validation testing completed!');
}

// Quick test function for individual sentences
export async function testSingleSentence(sentence: string) {
  console.log(`\n🧪 Testing single sentence: "${sentence}"`);
  
  const quickResult = quickDomainCheck(sentence);
  console.log(`⚡ Quick check: ${quickResult ? '✅ In scope' : '❌ Out of scope'}`);
  
  try {
    const result = await validateDomain(sentence);
    
    if (result.success && result.validation) {
      const validation = result.validation;
      console.log(`🤖 LLM result: Data-driven: ${validation.is_data_driven_question ? '✅' : '❌'}, Supported: ${validation.inquiry_supported ? '✅' : '❌'}`);
      console.log(`� Matched datasets: ${validation.matched_dataset.join(', ') || 'none'}`);
      
      if (Object.keys(validation.matched_columns).length > 0) {
        console.log(`� Matched columns:`);
        Object.entries(validation.matched_columns).forEach(([dataset, columns]) => {
          console.log(`  ${dataset}: ${columns.join(', ')}`);
        });
      }
      
      console.log(`� Explanation: ${validation.explanation}`);
    } else {
      console.log(`❌ API Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error}`);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testDomainValidation = testDomainValidation;
  (window as any).testSingleSentence = testSingleSentence;
  console.log('🧪 Domain validation test functions loaded!');
  console.log('Run: testDomainValidation() or testSingleSentence("your question here")');
}
