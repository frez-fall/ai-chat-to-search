/**
 * Streaming Chat API Endpoint (AI SDK v5)
 * POST /api/chat/stream - Stream AI responses as plain text
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import { db } from '@/services/database';

// If you still need business logic from your engine, you can keep it;
// for now we do the LLM call here to align with AI SDK v5 streaming.
// import { chatEngine } from "../../../../lib/chat-engine/index.js";

// Request body schema
const StreamChatRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().min(1, "Message cannot be empty"),
  user_location: z.string().optional()
});

// optional: Next Edge runtime for lower latency
export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, message } = StreamChatRequestSchema.parse(body);

    // 1) Validate conversation
    const conversation = await db.getConversation(conversation_id);
    if (!conversation) {
      return json(404, { error: "Conversation not found" });
    }
    if (conversation.status !== "active") {
      return json(400, { error: "Conversation is no longer active" });
    }

    // 2) Persist user message
    await db.createMessage({
      conversation_id,
      role: "user",
      content: message
    });

    // 3) Load history + parameters (if you use them in the prompt)
    const history = await db.getMessages(conversation_id); // [{role, content}, ...]
    const searchParams = await db.getSearchParameters(conversation_id); // your shape

    // Build model messages from history (simple text-only)
    // If you previously injected tools/system prompts, add them here.
    const modelMessages = history.map((m: { role: "user" | "assistant" | "system"; content: string }) => ({
      role: m.role,
      content: m.content
    }));

    // 4) Stream from the model and save the final completion when done
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      // Either use conversation messages...
      messages: [
        // Optionally, add a system primer that includes your searchParams
        searchParams
          ? {
              role: "system" as const,
              content: `You are a flight-search assistant. Current parameters: ${JSON.stringify(
                searchParams
              )}. Answer succinctly and ask for missing info when needed.`
            }
          : undefined,
        ...modelMessages,
        { role: "user" as const, content: message }
      ].filter(Boolean) as { role: "system" | "user" | "assistant"; content: string }[],

      // You can tweak generation settings here:
      // temperature: 0.2,
      // maxOutputTokens: 512,

      // Persist final text when the stream finishes
      onFinish: async ({ text }) => {
        try {
          await db.createMessage({
            conversation_id,
            role: "assistant",
            content: text,
            metadata: { streamed: true }
          });
        } catch (err) {
          console.error("Failed saving assistant message:", err);
        }
      }
    });

    // 5) Return a **text stream** (fits your Webflow widget decoder)
    const res = result.toTextStreamResponse(); // <- v5 helper for plain text streaming
    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.headers.set("X-Conversation-Id", conversation_id);
    return res;
  } catch (error) {
    console.error("Error in streaming chat:", error);

    if (error instanceof z.ZodError) {
      return json(400, {
        error: "Validation error",
        details: error.errors
      });
    }

    return json(500, {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// If you’re also using the global CORS middleware, you don’t need this.
// Keeping an OPTIONS handler is harmless during transition.
export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // replace with your middleware allowlist in prod
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}

/** Helpers */
function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
