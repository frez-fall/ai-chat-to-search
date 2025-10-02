/**
 * Streaming Chat API Endpoint
 * POST /api/chat/stream - Stream AI responses
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/services/database';
import { chatEngine } from '@/lib/chat-engine';

// Request body schema
const StreamChatRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().min(1, 'Message cannot be empty'),
  user_location: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedBody = StreamChatRequestSchema.parse(body);
    
    // Check if conversation exists
    const conversation = await db.getConversation(validatedBody.conversation_id);
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if conversation is still active
    if (conversation.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Conversation is no longer active' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Save user message
    await db.createMessage({
      conversation_id: validatedBody.conversation_id,
      role: 'user',
      content: validatedBody.message,
    });
    
    // Get conversation history and current parameters
    const messages = await db.getMessages(validatedBody.conversation_id);
    const searchParams = await db.getSearchParameters(validatedBody.conversation_id);
    
    // Generate streaming response
    const result = await chatEngine.generateStreamingResponse(
      validatedBody.message,
      messages,
      searchParams || undefined
    );
    
    // Create a text encoder for streaming
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    // Create a readable stream
    const readable = new ReadableStream({
      async start(controller) {
        console.log('Stream started for conversation:', validatedBody.conversation_id);
        
        // Stream the text
        for await (const textPart of result.textStream) {
          fullResponse += textPart;
          controller.enqueue(encoder.encode(textPart));
        }
        
        // Save the complete AI response after streaming
        await db.createMessage({
          conversation_id: validatedBody.conversation_id,
          role: 'assistant',
          content: fullResponse,
          metadata: {
            streamed: true,
          },
        });
        
        console.log('Stream completed for conversation:', validatedBody.conversation_id);
        controller.close();
      },
    });
    
    // Return streaming response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Conversation-Id': validatedBody.conversation_id,
      },
    });
    
  } catch (error) {
    console.error('Error in streaming chat:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}