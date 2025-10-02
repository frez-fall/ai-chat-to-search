/**
 * Conversations API Endpoints
 * POST /api/conversations - Create new conversation
 * GET /api/conversations - List conversations (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../services/database.js';
import { validateCreateConversationInput } from '../../../models/conversation.js';
import { chatEngine } from '../../../lib/chat-engine/index.js';
import { v4 as uuidv4 } from 'uuid';

// Request body schema
const CreateConversationRequestSchema = z.object({
  user_id: z.string().optional(), // Optional, will generate if not provided
  initial_query: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedBody = CreateConversationRequestSchema.parse(body);
    
    // Generate user_id if not provided
    const userId = validatedBody.user_id || `anon_${uuidv4()}`;
    
    // Create conversation
    const conversation = await db.createConversation({
      user_id: userId,
    });
    
    // Create initial search parameters
    await db.createSearchParameters({
      conversation_id: conversation.id,
      trip_type: 'return', // Default
      adults: 1, // Default
      children: 0,
      infants: 0,
      is_complete: false,
    });
    
    // Generate initial message
    const initialMessage = chatEngine.generateInitialMessage(validatedBody.initial_query);
    
    // Save assistant's initial message
    await db.createMessage({
      conversation_id: conversation.id,
      role: 'assistant',
      content: initialMessage,
    });
    
    // If there's an initial query, process it
    let aiResponse;
    if (validatedBody.initial_query) {
      // Save user's initial query
      await db.createMessage({
        conversation_id: conversation.id,
        role: 'user',
        content: validatedBody.initial_query,
      });
      
      // Generate AI response
      const messages = await db.getMessages(conversation.id);
      const searchParams = await db.getSearchParameters(conversation.id);
      
      aiResponse = await chatEngine.generateResponse(
        validatedBody.initial_query,
        messages,
        searchParams || undefined
      );
      
      // Save AI response
      await db.createMessage({
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        metadata: {
          extracted_params: aiResponse.extracted_params,
          requires_clarification: aiResponse.requires_clarification,
        },
      });
      
      // Update search parameters if extracted
      if (aiResponse.extracted_params && searchParams) {
        const merged = chatEngine.mergeParameters(
          aiResponse.extracted_params,
          searchParams
        );
        await db.updateSearchParameters(conversation.id, merged);
      }
      
      // Update conversation step
      if (aiResponse.next_step) {
        await db.updateConversation(conversation.id, {
          current_step: aiResponse.next_step === 'collecting' ? 'collecting' : 
                       aiResponse.next_step === 'confirming' ? 'confirming' : 'complete',
        });
      }
    }
    
    return NextResponse.json({
      conversation_id: conversation.id,
      user_id: userId,
      initial_message: initialMessage,
      ai_response: aiResponse,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating conversation:', error);
    
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

// Optional: List conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }
    
    // This would require adding a method to database service
    // For now, return not implemented
    return NextResponse.json(
      { error: 'Listing conversations not yet implemented' },
      { status: 501 }
    );
    
  } catch (error) {
    console.error('Error listing conversations:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}