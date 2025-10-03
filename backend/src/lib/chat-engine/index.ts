// backend/src/lib/chat-engine/index.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

type Msg = { role: "system" | "user" | "assistant"; content: string };

export const chatEngine = {
  /**
   * Minimal helper to stream a reply using prior messages.
   * Returns the AI SDK StreamTextResult (caller can call toTextStreamResponse()).
   */
  async streamWithHistory(args: {
    message: string;
    history?: Msg[];
    searchParams?: unknown;
    model?: string; // override if needed
  }) {
    const { message, history = [], searchParams, model = "gpt-4o-mini" } = args;

    const messages: Msg[] = [
      searchParams
        ? {
            role: "system",
            content:
              "You are a flight-search assistant. Current parameters: " +
              JSON.stringify(searchParams),
          }
        : undefined,
      ...history,
      { role: "user", content: message },
    ].filter(Boolean) as Msg[];

    return streamText({
      model: openai(model),
      messages,
      // temperature: 0.2,
      // maxOutputTokens: 512,
    });
  },
};

export default chatEngine;