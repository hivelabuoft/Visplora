import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Example 1: Simple text response
async function createSimpleResponse() {
  try {
    console.log('Creating simple text response...');
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: "Tell me a three sentence bedtime story about a unicorn.",
      temperature: 0.7,
    });

    console.log('Response ID:', response.id);
    console.log('Status:', response.status);
    console.log('Model:', response.model);
    console.log('Output:', response.output[0]?.content?.[0]?.text);
    console.log('Usage:', response.usage);
    
    return response;
  } catch (error) {
    console.error('Error creating simple response:', error);
    throw error;
  }
}

// Example 2: Response with system instructions
async function createResponseWithInstructions() {
  try {
    console.log('\nCreating response with system instructions...');
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: "Explain quantum computing",
      instructions: "You are a helpful physics professor. Explain concepts in simple terms that a high school student would understand.",
      max_output_tokens: 200,
      temperature: 0.3,
    });

    console.log('Response with instructions:', response.output[0]?.content?.[0]?.text);
    return response;
  } catch (error) {
    console.error('Error creating response with instructions:', error);
    throw error;
  }
}

// Example 3: Multi-turn conversation
async function createConversation() {
  try {
    console.log('\nCreating multi-turn conversation...');
    
    // First response
    const firstResponse = await openai.responses.create({
      model: "gpt-4o",
      input: "What's the capital of France?",
      store: true, // Store for conversation continuation
    });

    console.log('First response:', firstResponse.output[0]?.content?.[0]?.text);

    // Second response using previous_response_id
    const secondResponse = await openai.responses.create({
      model: "gpt-4o",
      input: "What's the population of that city?",
      previous_response_id: firstResponse.id,
    });

    console.log('Second response:', secondResponse.output[0]?.content?.[0]?.text);
    
    return { firstResponse, secondResponse };
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Example 4: Structured JSON output
async function createStructuredResponse() {
  try {
    console.log('\nCreating structured JSON response...');
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: "Generate a simple recipe for chocolate chip cookies",
      text: {
        format: {
          type: "json_schema",
          json_schema: {
            name: "recipe",
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string" },
                      amount: { type: "string" }
                    },
                    required: ["item", "amount"]
                  }
                },
                instructions: {
                  type: "array",
                  items: { type: "string" }
                },
                prep_time: { type: "string" },
                cook_time: { type: "string" }
              },
              required: ["name", "ingredients", "instructions", "prep_time", "cook_time"]
            }
          }
        }
      }
    });

    console.log('Structured response:', JSON.parse(response.output[0]?.content?.[0]?.text || '{}'));
    return response;
  } catch (error) {
    console.error('Error creating structured response:', error);
    throw error;
  }
}

// Example 5: Retrieve and manage responses
async function manageResponses() {
  try {
    console.log('\nDemonstrating response management...');
    
    // Create a response
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: "Write a haiku about coding",
      store: true,
    });

    console.log('Created response:', response.id);

    // Retrieve the response
    const retrievedResponse = await openai.responses.retrieve(response.id);
    console.log('Retrieved response:', retrievedResponse.output[0]?.content?.[0]?.text);

    // List input items for the response
    const inputItems = await openai.responses.inputItems.list(response.id);
    console.log('Input items:', inputItems.data.length);

    // Optional: Delete the response (uncomment if needed)
    // const deletedResponse = await openai.responses.delete(response.id);
    // console.log('Deleted response:', deletedResponse.deleted);

    return response;
  } catch (error) {
    console.error('Error managing responses:', error);
    throw error;
  }
}

// Example 6: Background processing
async function createBackgroundResponse() {
  try {
    console.log('\nCreating background response...');
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: "Write a detailed analysis of renewable energy trends",
      background: true, // Process in background
      max_output_tokens: 1000,
    });

    console.log('Background response created:', response.id);
    console.log('Initial status:', response.status);

    // Poll for completion (in real app, you might use webhooks instead)
    let completedResponse = response;
    while (completedResponse.status === 'in_progress' || completedResponse.status === 'queued') {
      console.log('Waiting for background response to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      completedResponse = await openai.responses.retrieve(response.id);
    }

    console.log('Final status:', completedResponse.status);
    if (completedResponse.status === 'completed') {
      console.log('Background response completed:', completedResponse.output[0]?.content?.[0]?.text?.substring(0, 200) + '...');
    }

    return completedResponse;
  } catch (error) {
    console.error('Error with background response:', error);
    throw error;
  }
}

// Main function to run all examples
async function main() {
  try {
    console.log('OpenAI Responses API Examples\n');
    console.log('=================================');

    await createSimpleResponse();
    await createResponseWithInstructions();
    await createConversation();
    await createStructuredResponse();
    await manageResponses();
    await createBackgroundResponse();

    console.log('\n=================================');
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Main execution error:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  createSimpleResponse,
  createResponseWithInstructions,
  createConversation,
  createStructuredResponse,
  manageResponses,
  createBackgroundResponse,
};