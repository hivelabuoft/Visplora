// Complete test for the updated domain validation system
// Tests the new response format and validates the complete pipeline

import { validateDomain } from '../LLMs/domainValidation';

export interface TestResult {
  sentence: string;
  passed: boolean;
  expected: {
    is_data_driven_question: boolean;
    inquiry_supported: boolean;
  };
  actual: {
    is_data_driven_question: boolean;
    inquiry_supported: boolean;
  };
  matched_datasets: string[];
  explanation: string;
  error?: string;
}

export async function testCompleteDomainValidation(): Promise<TestResult[]> {
  console.log('🧪 Testing Complete Domain Validation System...\n');

  const testCases = [
    // ✅ Should be data-driven and supported
    {
      sentence: "Show me crime rates across different London boroughs",
      expected: { is_data_driven_question: true, inquiry_supported: true }
    },
    {
      sentence: "Compare housing prices with population density in London",
      expected: { is_data_driven_question: true, inquiry_supported: true }
    },
    {
      sentence: "What's the ethnic diversity breakdown in Tower Hamlets?",
      expected: { is_data_driven_question: true, inquiry_supported: true }
    },
    {
      sentence: "Analyze income levels by London borough",
      expected: { is_data_driven_question: true, inquiry_supported: true }
    },
    {
      sentence: "Show school performance data across different areas",
      expected: { is_data_driven_question: true, inquiry_supported: true }
    },

    // ❌ Should be data-driven but NOT supported (missing data)
    {
      sentence: "Show me weather patterns in London",
      expected: { is_data_driven_question: true, inquiry_supported: false }
    },
    {
      sentence: "Compare London to Paris housing prices",
      expected: { is_data_driven_question: true, inquiry_supported: false }
    },
    {
      sentence: "What's the current COVID-19 infection rate in London?",
      expected: { is_data_driven_question: true, inquiry_supported: false }
    },
    {
      sentence: "Show me hospital capacity data by borough",
      expected: { is_data_driven_question: true, inquiry_supported: false }
    },

    // ❌ Should NOT be data-driven
    {
      sentence: "I love living in London",
      expected: { is_data_driven_question: false, inquiry_supported: false }
    },
    {
      sentence: "Hello, how are you?",
      expected: { is_data_driven_question: false, inquiry_supported: false }
    },
    {
      sentence: "What do you think about London?",
      expected: { is_data_driven_question: false, inquiry_supported: false }
    },
    {
      sentence: "London is a great city",
      expected: { is_data_driven_question: false, inquiry_supported: false }
    }
  ];

  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔍 Test ${i + 1}/${testCases.length}: "${testCase.sentence}"`);
    console.log(`Expected: data-driven=${testCase.expected.is_data_driven_question}, supported=${testCase.expected.inquiry_supported}`);

    try {
      const result = await validateDomain(testCase.sentence);

      if (result.success && result.validation) {
        const validation = result.validation;
        
        const passed = 
          validation.is_data_driven_question === testCase.expected.is_data_driven_question &&
          validation.inquiry_supported === testCase.expected.inquiry_supported;

        console.log(`Actual: data-driven=${validation.is_data_driven_question}, supported=${validation.inquiry_supported}`);
        console.log(`Matched datasets: ${validation.matched_dataset.join(', ') || 'none'}`);
        console.log(`Explanation: ${validation.explanation}`);
        console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

        results.push({
          sentence: testCase.sentence,
          passed,
          expected: testCase.expected,
          actual: {
            is_data_driven_question: validation.is_data_driven_question,
            inquiry_supported: validation.inquiry_supported
          },
          matched_datasets: validation.matched_dataset,
          explanation: validation.explanation
        });

      } else {
        console.log(`❌ API Error: ${result.error || 'Unknown error'}`);
        results.push({
          sentence: testCase.sentence,
          passed: false,
          expected: testCase.expected,
          actual: { is_data_driven_question: false, inquiry_supported: false },
          matched_datasets: [],
          explanation: '',
          error: result.error || 'API call failed'
        });
      }

    } catch (error) {
      console.log(`❌ Exception: ${error}`);
      results.push({
        sentence: testCase.sentence,
        passed: false,
        expected: testCase.expected,
        actual: { is_data_driven_question: false, inquiry_supported: false },
        matched_datasets: [],
        explanation: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Add delay between API calls to avoid rate limiting
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  const passedTests = results.filter(r => r.passed);
  const failedTests = results.filter(r => !r.passed);

  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`✅ Passed: ${passedTests.length}/${results.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${results.length}`);

  if (failedTests.length > 0) {
    console.log(`\n❌ Failed tests:`);
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. "${test.sentence}"`);
      console.log(`   Expected: data-driven=${test.expected.is_data_driven_question}, supported=${test.expected.inquiry_supported}`);
      console.log(`   Actual: data-driven=${test.actual.is_data_driven_question}, supported=${test.actual.inquiry_supported}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
  }

  return results;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testCompleteDomainValidation = testCompleteDomainValidation;
}
