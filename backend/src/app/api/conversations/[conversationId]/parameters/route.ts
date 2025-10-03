/**
 * Search Parameters API Endpoints
 * GET /api/conversations/:conversationId/parameters
 * PUT /api/conversations/:conversationId/parameters
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/services/database";
import { UpdateSearchParametersSchema } from "@/models/search-parameters";
import { urlGenerator } from "@/lib/url-generator";

export const runtime = "edge";

// ---------- GET ----------
export async function GET(_req: Request, context: any) {
  try {
    const conversationId = context?.params?.conversationId as string | undefined;
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const conversation = await db.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const searchParams = await db.getSearchParameters(conversationId);
    if (!searchParams) {
      return NextResponse.json({ error: "Search parameters not found" }, { status: 404 });
    }

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
    console.error("GET parameters error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ---------- PUT ----------
export async function PUT(req: Request, context: any) {
  try {
    const conversationId = context?.params?.conversationId as string | undefined;
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const body = await req.json();
    const validatedBody = UpdateSearchParametersSchema.parse(body);

    const conversation = await db.getConversation(conversationId);
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    if (conversation.status !== "active") {
      return NextResponse.json({ error: "Conversation is no longer active" }, { status: 400 });
    }

    const existingParams = await db.getSearchParameters(conversationId);
    if (!existingParams) {
      return NextResponse.json({ error: "Search parameters not found" }, { status: 404 });
    }

    // Update main parameters
    const updatedParams = await db.updateSearchParameters(conversationId, validatedBody);

    // Handle multi-city segments if provided
    if (validatedBody.trip_type === "multicity" && body.multi_city_segments) {
      // Ensure we have a definite params row with an id
      const paramsRow =
        (updatedParams && (updatedParams as any).id)
          ? updatedParams
          : await db.getSearchParameters(conversationId);

      const paramsId = (paramsRow as any)?.id as string | undefined;
      if (!paramsId) {
        return NextResponse.json(
          { error: "Could not resolve search parameters ID after update" },
          { status: 500 }
        );
      }

      // Delete existing segments for this params row
      await db.deleteMultiCitySegments(paramsId);

      // Create new segments
      const segments = (body.multi_city_segments as any[]).map((seg, index) => ({
        search_params_id: paramsId,
        sequence_order: index + 1,
        origin_code: seg.origin_code,
        origin_name: seg.origin_name,
        destination_code: seg.destination_code,
        destination_name: seg.destination_name,
        departure_date: seg.departure_date,
      }));

      await db.createMultiCitySegments(segments);
    }

    // Determine completeness
    const isComplete = !!(
      updatedParams.origin_code &&
      updatedParams.destination_code &&
      updatedParams.departure_date &&
      (updatedParams.trip_type !== "return" || updatedParams.return_date) &&
      (updatedParams.trip_type !== "multicity" || body.multi_city_segments?.length >= 2)
    );

    if (isComplete !== updatedParams.is_complete) {
      await db.updateSearchParameters(conversationId, { is_complete: isComplete });
    }

    const finalParams = await db.getSearchParameters(conversationId);
    let generatedUrl: string | undefined;

    if (isComplete && finalParams) {
      generatedUrl = urlGenerator.generateBookingURL(finalParams, {
        utm_source: "chat",
        utm_medium: "ai",
        utm_campaign: "natural_language_search",
      });

      await db.updateConversation(conversationId, {
        generated_url: generatedUrl,
        current_step: "complete",
      });
    }

    return NextResponse.json({
      conversation_id: conversationId,
      parameters: finalParams,
      booking_url: generatedUrl,
      shareable_url:
        isComplete && finalParams ? urlGenerator.generateShareableURL(finalParams) : undefined,
      is_complete: isComplete,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("PUT parameters error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}