/**
 * Messages API Endpoints
 * POST /api/conversations/:conversationId/messages - Send message
 * GET /api/conversations/:conversationId/messages - Get message history
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../../../services/database.js';
import { chatEngine } from '../../../../../lib/chat-engine/index.js';
import { flightParser } from '../../../../../lib/flight-parser/index.js';
import { urlGenerator } from '../../../../../lib/url-generator/index.js';

// Request body schema
const SendMessageRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  user_location: z.string().optional(),
});

interface Params {
  params: {
    conversationId: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { conversationId } = params;
    const body = await request.json();
    
    // Validate request
    const validatedBody = SendMessageRequestSchema.parse(body);
    
    // Check if conversation exists
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Check if conversation is still active
    if (conversation.status !== 'active') {
      return NextResponse.json(
        { error: 'Conversation is no longer active' },
        { status: 400 }
      );
    }
    
    // Save user message
    await db.createMessage({
      conversation_id: conversationId,
      role: 'user',
      content: validatedBody.message,
    });
    
    // Get conversation history and current parameters
    const messages = await db.getMessages(conversationId);
    const searchParams = await db.getSearchParameters(conversationId);
    
    // Parse flight information from message
    const parsedFlight = await flightParser.parseFlightQuery(
      validatedBody.message,
      {
        user_location: validatedBody.user_location,
        previous_searches: messages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .slice(-3), // Last 3 user messages for context
      }
    );
    
    // Generate AI response
    const aiResponse = await chatEngine.generateResponse(
      validatedBody.message,
      messages,
      searchParams || undefined,
      { user_location: validatedBody.user_location }
    );
    
    // Save AI response
    await db.createMessage({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse.content,
      metadata: {
        extracted_params: aiResponse.extracted_params,
        parsed_flight: parsedFlight,
        requires_clarification: aiResponse.requires_clarification,
      },
    });
    
    // Update search parameters if extracted
    if (aiResponse.extracted_params && searchParams) {
      const merged = chatEngine.mergeParameters(
        aiResponse.extracted_params,
        searchParams
      );
      
      // Check if parameters are complete
      const isComplete = !!(
        merged.origin_code &&
        merged.destination_code &&
        merged.departure_date &&
        (merged.trip_type !== 'return' || merged.return_date) &&
        (merged.trip_type !== 'multicity' || searchParams.multi_city_segments?.length >= 2)
      );
      
      merged.is_complete = isComplete;
      
      await db.updateSearchParameters(conversationId, merged);
      
      // Generate URL if parameters are complete
      let generatedUrl;
      if (isComplete) {
        const updatedParams = await db.getSearchParameters(conversationId);
        if (updatedParams) {
          generatedUrl = urlGenerator.generateBookingURL(updatedParams, {
            utm_source: 'chat',
            utm_medium: 'ai',
            utm_campaign: 'natural_language_search',
          });
          
          // Update conversation with generated URL
          await db.updateConversation(conversationId, {
            generated_url: generatedUrl,
            current_step: 'complete',
            status: 'completed',
          });
        }
      }
      
      // Update conversation step
      if (aiResponse.next_step && !isComplete) {
        await db.updateConversation(conversationId, {
          current_step: aiResponse.next_step === 'collecting' ? 'collecting' : 
                       aiResponse.next_step === 'confirming' ? 'confirming' : 'complete',
        });
      }
    }
    
    // Get updated conversation state
    const updatedConversation = await db.getConversation(conversationId);
    const updatedParams = await db.getSearchParameters(conversationId);
    
    return NextResponse.json({
      message_id: messages.length + 2, // User message + AI response
      ai_response: aiResponse,
      parsed_flight: parsedFlight,
      search_parameters: updatedParams,
      generated_url: updatedConversation?.generated_url,
      conversation_status: updatedConversation?.status,
      conversation_step: updatedConversation?.current_step,
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { conversationId } = params;
    
    // Check if conversation exists
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Get all messages
    const messages = await db.getMessages(conversationId);
    
    return NextResponse.json({
      conversation_id: conversationId,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      })),
      total: messages.length,
    });
    
  } catch (error) {
    console.error('Error getting messages:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}