export async function captureInsights(interactionLog: any[], narrativeContext: string = "", currentSentence: string = "") {
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

    console.log('✅ OpenAI insights captured successfully:', data.data);
    return data.data;
  } catch (error) {
    console.error('❌ Error calling capture insights API:', error);
    throw error;
  }
}
