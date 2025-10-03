// backend/src/app/api/conversations/[conversationId]/parameters/route.ts

/**
 * Search Parameters API Endpoints
 * GET /api/conversations/:conversationId/parameters - Get search parameters
 * PUT /api/conversations/:conversationId/parameters - Update search parameters
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/services/database";
import { UpdateSearchParametersSchema } from "@/models/search-parameters";
import { urlGenerator } from "@/lib/url-generator";

// GET /api/conversations/:conversationId/parameters
export async function GET(
  _request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;

    // Check if conversation exists
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get search parameters
    const searchParams = await db.getSearchParameters(conversationId);
    if (!searchParams) {
      return NextResponse.json({ error: "Search parameters not found" }, { status: 404 });
    }

    // Generate URL if parameters are complete
    let bookingUrl: string | undefined;
    if (searchParams.is_complete) {
      bookingUrl = urlGenerator.generateBookingURL(searchParams, {
        utm_source: "chat",
        utm_medium: "ai",
        utm_campaign: "natural_language_search",
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
    console.error("Error getting search parameters:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/:conversationId/parameters
export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const body = await request.json();

    // Validate request
    const validatedBody = UpdateSearchParametersSchema.parse(body);

    // Check if conversation exists and is active
    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.status !== "active") {
      return NextResponse.json({ error: "Conversation is no longer active" }, { status: 400 });
    }

    // Ensure existing parameters record exists
    const existingParams = await db.getSearchParameters(conversationId);
    if (!existingParams) {
      return NextResponse.json({ error: "Search parameters not found" }, { status: 404 });
    }

    // Update parameters
    const updatedParams = await db.updateSearchParameters(conversationId, validatedBody);

    // Handle multi-city segments if provided
    if (validatedBody.trip_type === "multicity" && body.multi_city_segments) {
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

      await db.createMultiCitySegments