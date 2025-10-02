/**
 * Destination Recommendations API Endpoint
 * GET /api/destinations - Get destination recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../services/database.js';
import { validateDestinationQuery } from '../../../models/destination-recommendation.js';

// Query parameters schema
const DestinationQuerySchema = z.object({
  category: z.enum([
    'island-vibes',
    'mountain-views',
    'snowy-adventures',
    'city-escapes',
    'wine-tours',
    'none-of-these',
  ]).optional(),
  active_only: z.coerce.boolean().default(true),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = {
      category: searchParams.get('category') || undefined,
      active_only: searchParams.get('active_only') !== 'false',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    };
    
    // Validate query
    const validatedQuery = DestinationQuerySchema.parse(query);
    
    // Get destinations from database
    const destinations = await db.getDestinationRecommendations(validatedQuery);
    
    // Add cache headers for performance
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=3600, s-maxage=7200', // 1 hour client, 2 hours CDN
      'Vary': 'Accept-Encoding',
    };
    
    return NextResponse.json(destinations, {
      headers: cacheHeaders,
    });
    
  } catch (error) {
    console.error('Error getting destination recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
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