/**
 * Search Parameters API Endpoints
 * GET /api/conversations/:conversationId/parameters - Get search parameters
 * PUT /api/conversations/:conversationId/parameters - Update search parameters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../../../services/database.js';
import { UpdateSearchParametersSchema } from '../../../../../models/search-parameters.js';
import { urlGenerator } from '../../../../../lib/url-generator/index.js';

interface Params {
  params: {
    conversationId: string;
  };
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
    
    // Get search parameters
    const searchParams = await db.getSearchParameters(conversationId);
    if (!searchParams) {
      return NextResponse.json(
        { error: 'Search parameters not found' },
        { status: 404 }
      );
    }
    
    // Generate URL if parameters are complete
    let bookingUrl;
    if (searchParams.is_complete) {
      bookingUrl = urlGenerator.generateBookingURL(searchParams, {
        utm_source: 'chat',
        utm_medium: 'ai',
        utm_campaign: 'natural_language_search',
      });
    }
    
    return NextResponse.json({
      conversation_id: conversationId,
      parameters: searchParams,
      booking_url: bookingUrl,
      shareable_url: searchParams.is_complete 
        ? urlGenerator.generateShareableURL(searchParams)
        : undefined,
    });
    
  } catch (error) {
    console.error('Error getting search parameters:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { conversationId } = params;
    const body = await request.json();
    
    // Validate request
    const validatedBody = UpdateSearchParametersSchema.parse(body);
    
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
    
    // Get existing parameters
    const existingParams = await db.getSearchParameters(conversationId);
    if (!existingParams) {
      return NextResponse.json(
        { error: 'Search parameters not found' },
        { status: 404 }
      );
    }
    
    // Update parameters
    const updatedParams = await db.updateSearchParameters(conversationId, validatedBody);
    
    // Handle multi-city segments if provided
    if (validatedBody.trip_type === 'multicity' && body.multi_city_segments) {
      // Delete existing segments
      await db.deleteMultiCitySegments(updatedParams.id);
      
      // Create new segments
      const segments = body.multi_city_segments.map((seg: any, index: number) => ({
        search_params_id: updatedParams.id,
        sequence_order: index + 1,
        origin_code: seg.origin_code,
        origin_name: seg.origin_name,
        destination_code: seg.destination_code,
        destination_name: seg.destination_name,
        departure_date: seg.departure_date,
      }));
      
      await db.createMultiCitySegments(segments);
    }
    
    // Check if parameters are complete
    const isComplete = !!(
      updatedParams.origin_code &&
      updatedParams.destination_code &&
      updatedParams.departure_date &&
      (updatedParams.trip_type !== 'return' || updatedParams.return_date) &&
      (updatedParams.trip_type !== 'multicity' || body.multi_city_segments?.length >= 2)
    );
    
    // Update completeness
    if (isComplete !== updatedParams.is_complete) {
      await db.updateSearchParameters(conversationId, { is_complete: isComplete });
    }
    
    // Generate URL if complete
    let generatedUrl;
    if (isComplete) {
      const finalParams = await db.getSearchParameters(conversationId);
      if (finalParams) {
        generatedUrl = urlGenerator.generateBookingURL(finalParams, {
          utm_source: 'chat',
          utm_medium: 'ai',
          utm_campaign: 'natural_language_search',
        });
        
        // Update conversation with generated URL
        await db.updateConversation(conversationId, {
          generated_url: generatedUrl,
          current_step: 'complete',
        });
      }
    }
    
    // Get final state
    const finalParams = await db.getSearchParameters(conversationId);
    
    return NextResponse.json({
      conversation_id: conversationId,
      parameters: finalParams,
      booking_url: generatedUrl,
      shareable_url: isComplete && finalParams
        ? urlGenerator.generateShareableURL(finalParams)
        : undefined,
      is_complete: isComplete,
    });
    
  } catch (error) {
    console.error('Error updating search parameters:', error);
    
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