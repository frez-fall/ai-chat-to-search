// backend/src/app/api/conversations/[conversationId]/messages/route.ts
import { z } from "zod";
import { db } from "@/services/database";

export const runtime = "edge";

const CreateMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "content is required"),
  metadata: z.record(z.any()).optional()
});

// GET /api/conversations/:conversationId/messages
export async function GET(_req: Request, { params }: any) {
  try {
    const { conversationId } = params ?? {};
    if (!conversationId) return json(400, { error: "conversationId is required" });

    const convo = await db.getConversation(conversationId);
    if (!convo) return json(404, { error: "Conversation not found" });

    const messages = await db.getMessages(conversationId);
    return json(200, { messages });
  } catch (err) {
    console.error("GET messages error:", err);
    return json(500, { error: "Internal server error" });
  }
}

// POST /api/conversations/:conversationId/messages
export async function POST(req: Request, { params }: any) {
  try {
    const { conversationId } = params ?? {};
    if (!conversationId) return json(400, { error: "conversationId is required" });

    const body = await req.json();
    const data = CreateMessageSchema.parse(body);

    const convo = await db.getConversation(conversationId);
    if (!convo) return json(404, { error: "Conversation not found" });
    if (convo.status !== "active") return json(400, { error: "Conversation is no longer active" });

    await db.createMessage({
      conversation_id: conversationId,
      role: data.role,
      content: data.content,
      metadata: data.metadata
    });

    return json(201, { ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return json(400, { error: "Validation error", details: err.errors });
    }
    console.error("POST message error:", err);
    return json(500, { error: "Internal server error" });
  }
}

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}