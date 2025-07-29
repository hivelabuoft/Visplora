export interface NarrativeSuggestion {
  narrative_suggestion: string | null;
  source_elementId: string;
  source_view_title: string;
  explanation: string;
}

export async function captureInsights(interactionLog: any[], narrativeContext: string = "", currentSentence: string = ""): Promise<NarrativeSuggestion | null> {
  try {
    console.log('🤖 Calling API to capture insights...');
    
    // Prepare the input data in the expected format
    const inputData = {
      narrative_context: narrativeContext,
      current_sentence: currentSentence,
      interaction_log: interactionLog // Ensure we only send the last 5 interactions
    };
    
    console.log('📤 Sending data to OpenAI:', inputData);
    
    const response = await fetch('/api/capture-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inputData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to capture insights');
    }

    console.log('✅ OpenAI insights captured successfully:', data.insights);
    
    // Parse the JSON response from OpenAI
    try {
      const suggestionData = JSON.parse(data.insights) as NarrativeSuggestion;
      return suggestionData;
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI JSON response:', parseError);
      console.log('Raw response:', data.insights);
      return null;
    }
  } catch (error) {
    console.error('❌ Error calling capture insights API:', error);
    throw error;
  }
}
