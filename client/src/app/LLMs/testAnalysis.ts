/**
 * Test Analysis - Dummy LLM Call
 * Simple test to verify content is received correctly
 */

export interface TestAnalysisResult {
  sentence: string;
  wordCount: number;
  characterCount: number;
  timestamp: string;
  received: boolean;
  message: string;
  context: {
    fullText: string;
    completedSentences: string[];
    previousSentences: string[];
  };
}

export async function testAnalysis(
  sentence: string, 
  fullText?: string,
  completedSentences?: string[]
): Promise<TestAnalysisResult> {
  // Simulate a small delay like a real API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('🧪 Test Analysis received:', {
    sentence,
    fullText,
    completedSentences,
    timestamp: new Date().toISOString()
  });

  
  // Simple analysis without actual LLM
  const result: TestAnalysisResult = {
    sentence,
    wordCount: sentence.split(/\s+/).filter(Boolean).length,
    characterCount: sentence.length,
    timestamp: new Date().toISOString(),
    received: true,
    message: `Successfully received and analyzed: "${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}"`,
    context: {
      fullText: fullText || '',
      completedSentences: completedSentences || [],
      previousSentences: completedSentences?.slice(-3) || [] // Last 3 completed sentences
    }
  };
  
  console.log('🧪 Test Analysis result:', result);
  
  return result;
}
