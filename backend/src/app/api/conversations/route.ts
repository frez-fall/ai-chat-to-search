// backend/src/app/api/conversations/route.ts
/**
 * Conversations API Endpoints
 * POST /api/conversations - Create new conversation
 * GET  /api/conversations - List conversations (optional)
 *
 * CORS: Handles preflight (OPTIONS) and adds headers to all responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/services/database';
import { validateCreateConversationInput } from '@/models/conversation'; // (kept in case it's used elsewhere)
import { chatEngine } from '@/lib/chat-engine';
import { v4 as uuidv4 } from 'uuid';

// If you use any Node APIs or non-Edge libs during diag, keep Node runtime:
export const runtime = 'nodejs';

// ---------- CORS CONFIG ----------
const ENV_ALLOWED = process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN ?? ''; // allow either var name
const ALLOWED_ORIGINS = new Set(
  ENV_ALLOWED ? ENV_ALLOWED.split(',').map((s) => s.trim()) : []
);

// Local dev fallbacks (optional)
ALLOWED_ORIGINS.add('http://localhost:3000');
ALLOWED_ORIGINS.add('http://127.0.0.1:3000');

const ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const DEFAULT_ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With';

function buildCorsHeaders(req: Request): Headers {
  const headers = new Headers();
  const origin = req.headers.get('origin') ?? '';

  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
  headers.set(
    'Access-Control-Allow-Headers',
    req.headers.get('Access-Control-Request-Headers') ?? DEFAULT_ALLOWED_HEADERS
  );
  headers.set('Access-Control-Max-Age', '86400'); // cache preflight for 1 day
  headers.set('Vary', 'Origin');

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true'); // enable if using cookies/auth
  }

  return headers;
}

// ---------- SCHEMAS ----------
const CreateConversationRequestSchema = z.object({
  user_id: z.string().optional(),   // Optional, will generate if not provided
  initial_query: z.string().optional(),
});

// ---------- PRE-FLIGHT ----------
export async function OPTIONS(request: NextRequest) {
  const headers = buildCorsHeaders(request);
  return new Response(null, { status: 204, headers });
}

// ---------- POST /api/conversations ----------
export async function POST(request: NextRequest) {
  const headers = buildCorsHeaders(request);

  try {
    const body = await request.json().catch(() => ({} as unknown));
    // Validate request
    const validatedBody = CreateConversationRequestSchema.parse(body);

    // ---------- STEP 1A: Minimal OpenAI diagnostic (no tools) ----------
    // Call with ?diag=minimal to quickly verify OPENAI_API_KEY + model in Production.
    const url = new URL(request.url);
    if (url.searchParams.get('diag') === 'minimal') {
      try {
        const { generateText } = await import('ai');
        const { openai } = await import('@ai-sdk/openai');

        const r = await generateText({
          model: openai('gpt-4o-mini'), // use a widely available model
          prompt: 'ping',
          maxTokens: 8,
          temperature: 0,
        });

        return NextResponse.json(
          { ok: true, diag: 'minimal', text: r.text },
          { status: 200, headers }
        );
      } catch (e: any) {
        console.error('AI minimal diag failed:', e?.stack || e);
        return NextResponse.json(
          { error: 'AI minimal diag failed', message: String(e?.message || e) },
          { status: 500, headers }
        );
      }
    }
    // ---------- END DIAGNOSTIC ----------

    // Generate user_id if not provided
    const userId = validatedBody.user_id || `anon_${uuidv4()}`;

    // Create conversation
    const conversation = await db.createConversation({ user_id: userId });

    // Create initial search parameters
    await db.createSearchParameters({
      conversation_id: conversation.id,
      trip_type: 'return', // Default
      adults: 1,           // Default
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
    let aiResponse: any;
    if (validatedBody.initial_query) {
      // Save user's initial query
      await db.createMessage({
        conversation_id: conversation.id,
        role: 'user',
        content: validatedBody.initial_query,
      });

      // Generate AI response (uses Vercel AI SDK + tools in chat-engine)
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
          current_step:
            aiResponse.next_step === 'collecting'
              ? 'collecting'
              : aiResponse.next_step === 'confirming'
              ? 'confirming'
              : 'complete',
        });
      }
    }

    return NextResponse.json(
      {
        conversation_id: conversation.id,
        user_id: userId,
        initial_message: initialMessage,
        ai_response: aiResponse,
      },
      { status: 201, headers }
    );
  } catch (error: any) {
    console.error('Error creating conversation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400, headers }
      );
    }

    // TEMP: surface provider error message during debugging
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message ?? 'Unknown error' },
      { status: 500, headers }
    );
  }
}

// ---------- GET /api/conversations ----------
export async function GET(request: NextRequest) {
  const headers = buildCorsHeaders(request);

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400, headers }
      );
    }

    // Not implemented in your current DB service
    return NextResponse.json(
      { error: 'Listing conversations not yet implemented' },
      { status: 501, headers }
    );
  } catch (error: any) {
    console.error('Error listing conversations:', error);

    return NextResponse.json(
      { error: 'Internal server error', message: error?.message ?? 'Unknown error' },
      { status: 500, headers }
    );
  }
}