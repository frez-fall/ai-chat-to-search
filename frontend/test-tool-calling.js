/**
 * Test script for chat engine tool calling
 */

import { ChatEngine } from './src/lib/chat-engine/index.ts';

async function testToolCalling() {
  const chatEngine = new ChatEngine();
  
  const testMessages = [
    "I want to fly from Sydney to Bali next month",
    "Looking for flights from Melbourne to Tokyo on March 15th, returning March 25th",
    "I need a business class flight from Perth to Singapore for 2 adults and 1 child",
    "Can you find me a multi-city trip: Sydney to Bangkok, then Bangkok to Phuket, finally Phuket back to Sydney"
  ];

  console.log('Testing Chat Engine Tool Calling\n');
  console.log('=================================\n');

  for (const message of testMessages) {
    console.log(`User: ${message}`);
    console.log('---');
    
    try {
      const response = await chatEngine.generateResponse(
        message,
        [],
        undefined,
        { user_location: 'Australia' }
      );
      
      console.log(`AI Response: ${response.content.substring(0, 200)}...`);
      
      if (response.extracted_params) {
        console.log('\nExtracted Parameters:');
        console.log(JSON.stringify(response.extracted_params, null, 2));
      } else {
        console.log('\nNo parameters extracted');
      }
      
      console.log(`\nRequires Clarification: ${response.requires_clarification}`);
      console.log(`Next Step: ${response.next_step}`);
      console.log('\n=================================\n');
      
    } catch (error) {
      console.error(`Error processing message: ${error.message}`);
    }
  }
}

// Run the test
testToolCalling().catch(console.error);