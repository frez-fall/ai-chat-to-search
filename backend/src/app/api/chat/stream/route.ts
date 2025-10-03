/**
 * Streaming Chat API Endpoint (AI SDK v5)
 * POST /api/chat/stream - Stream AI responses as plain text
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import { db } from "@/services/database";

const StreamChatRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().min(1, "Message cannot be empty"),
  user_location: z.string().optional()
});

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, message } = StreamChatRequestSchema.parse(body);

    const conversation = await db.getConversation(conversation_id);
    if (!conversation) return json(404, { error: "Conversation not found" });
    if (conversation.status !== "active") return json(400, { error: "Conversation is no longer active" });

    await db.createMessage({ conversation_id, role: "user", content: message });

    const history = await db.getMessages(conversation_id);
    const searchParams = await db.getSearchParameters(conversation_id);

    const modelMessages = history.map((m: { role: "user" | "assistant" | "system"; content: string }) => ({
      role: m.role,
      content: m.content
    }));

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        searchParams
          ? {
              role: "system" as const,
              content: `You are a flight-search assistant. Current parameters: ${JSON.stringify(searchParams)}. Answer succinctly and ask for missing info when needed.`
            }
          : undefined,
        ...modelMessages,
        { role: "user" as const, content: message }
      ].filter(Boolean) as { role: "system" | "user" | "assistant"; content: string }[],
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

    const res = result.toTextStreamResponse();
    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.headers.set("X-Conversation-Id", conversation_id);
    return res;
  } catch (error) {
    console.error("Error in streaming chat:", error);
    if (error instanceof z.ZodError) return json(400, { error: "Validation error", details: error.errors });
    return json(500, { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" });
  }
}

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}