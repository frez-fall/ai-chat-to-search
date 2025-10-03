/**
 * Chat Engine Library
 * Core AI conversation logic with OpenAI integration
 */

import { openai } from '@ai-sdk/openai';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';

import type { Message } from '../../models/message.js';
import type { SearchParameters, UpdateSearchParametersInput } from '../../models/search-parameters.js';
import type { Conversation } from '../../models/conversation.js';

// Flight information extraction schema (TypeScript type)
export interface FlightInfo {
  origin_code?: string;
  origin_name?: string;
  destination_code?: string;
  destination_name?: string;
  departure_date?: string;
  return_date?: string;
  trip_type?: 'return' | 'oneway' | 'multicity';
  adults?: number;
  children?: number;
  infants?: number;
  cabin_class?: 'Y' | 'S' | 'C' | 'F';
  multi_city_segments?: Array<{
    origin_code: string;
    origin_name?: string;
    destination_code: string;
    destination_name?: string;
    departure_date: string;
    sequence_order: number;
  }>;
}

export interface AIResponse {
  content: string;
  extracted_params?: FlightInfo;
  requires_clarification: boolean;
  clarification_prompt?: string;
  next_step?: 'collecting' | 'confirming' | 'complete';
}

export interface ChatEngineConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: ChatEngineConfig = {
  model: 'gpt-4o-mini', // broadly available
  temperature: 0.7,
  maxTokens: 1000,
};

export class ChatEngine {
  private config: ChatEngineConfig;

  constructor(config?: Partial<ChatEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getSystemPrompt(): string {
    return `You are a friendly, empathetic, and enthusiastic flight search assistant with comprehensive IATA airport code knowledge.

IMPORTANT RULES:
1. Always maintain a warm, helpful, and excited tone about travel
2. Convert locations to IATA codes and ask for clarification when multiple airports exist
3. Departure dates must be at least 14 days from today due to Paylater payment plan requirements
4. If user requests dates sooner than 14 days, explain the Paylater requirement politely
5. For customer support requests, direct them to the orange Intercom button on the page
6. Always extract and validate flight parameters from user input

COMMON AIRPORTS (use these for quick reference):
- New York: JFK (Kennedy), LGA (LaGuardia), EWR (Newark)
- London: LHR (Heathrow), LGW (Gatwick), STN (Stansted)
- Los Angeles: LAX
- Tokyo: NRT (Narita), HND (Haneda)
- Paris: CDG (Charles de Gaulle), ORY (Orly)
- Sydney: SYD
- Melbourne: MEL
- San Francisco: SFO
- Chicago: ORD (O'Hare), MDW (Midway)

PASSENGER CATEGORIES:
- Adults: 1-9 passengers
- Children: 2-11 years old (0-8 passengers)
- Infants: Under 2 years (0-8 passengers, cannot exceed adult count)

CABIN CLASSES (IATA codes):
- Y = Economy
- S = Premium Economy
- C = Business
- F = First Class

TRIP TYPES:
- return: Round trip with departure and return dates
- oneway: Single direction flight
- multicity: Multiple destinations in sequence

When user mentions ambiguous cities (e.g., "London", "New York"), always ask:
"Which [City] airport would you prefer - [Airport 1] ([CODE1]), [Airport 2] ([CODE2]), or [Airport 3] ([CODE3])? If you're unsure, I'd recommend [most common] as it has [reason]."

For dates less than 14 days away, respond with:
"I'd love to help you get to [destination]! However, with Paylater's payment plan, you need to pay off your trip before you fly, so I can only search for flights departing at least 2 weeks from today. This gives you time to complete your payment schedule. What dates work for you after [14 days from now]?"

Extract flight information and respond naturally while being helpful and excited about their travel plans.`;
  }

  async generateResponse(
  userMessage: string,
  conversationHistory: Message[],
  currentParams?: SearchParameters,
  context?: { user_location?: string }
): Promise<AIResponse> {
  try {
    const messages = this.buildMessageHistory(conversationHistory, userMessage);

    const flightInfoParameters = z.object({
      origin_code: z.string().optional(),
      origin_name: z.string().optional(),
      destination_code: z.string().optional(),
      destination_name: z.string().optional(),
      departure_date: z.string().optional(),  // YYYY-MM-DD
      return_date: z.string().optional(),     // YYYY-MM-DD
      trip_type: z.enum(['return', 'oneway', 'multicity']).optional(),
      adults: z.number().optional(),
      children: z.number().optional(),
      infants: z.number().optional(),
      cabin_class: z.enum(['Y', 'S', 'C', 'F']).optional(),
      multi_city_segments: z.array(
        z.object({
          origin_code: z.string(),
          origin_name: z.string().optional(),
          destination_code: z.string(),
          destination_name: z.string().optional(),
          departure_date: z.string(),
          sequence_order: z.number(),
        })
      ).optional(),
    });

    const extractFlightInfo = tool({
      name: 'extractFlightInfo',
      description: 'Extract flight search parameters from user input',
      parameters: flightInfoParameters,
    });

    // 1) First pass: ask model to call the tool if helpful
    let result = await generateText({
      model: openai(this.config.model || 'gpt-4o-mini'),
      system: this.getSystemPrompt(),
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      tools: [extractFlightInfo],
      toolChoice: 'auto',
    });

    // 2) If it did NOT call the tool, run a second pass that FORCES the tool call
    let extractedParams: FlightInfo | undefined;
    if (result.toolCalls?.length) {
      const call = result.toolCalls.find(c => c.toolName === 'extractFlightInfo');
      if (call) extractedParams = call.args as FlightInfo;
    } else {
      const forced = await generateText({
        model: openai(this.config.model || 'gpt-4o-mini'),
        system: this.getSystemPrompt(),
        messages,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        tools: [extractFlightInfo],
        toolChoice: { type: 'tool', toolName: 'extractFlightInfo' }, // ← force
      });
      result = forced;
      if (forced.toolCalls?.length) {
        const call = forced.toolCalls.find(c => c.toolName === 'extractFlightInfo');
        if (call) extractedParams = call.args as FlightInfo;
      }
    }

    // 3) Compute clarification based on what’s still missing
    const needOrigin = !(extractedParams?.origin_code || currentParams?.origin_code);
    const needDestination = !(extractedParams?.destination_code || currentParams?.destination_code);
    const needDeparture = !(extractedParams?.departure_date || currentParams?.departure_date);

    const requiresClarification = needOrigin || needDestination || needDeparture;

    const clarification_prompt = requiresClarification
      ? (() => {
          const asks: string[] = [];
          if (needOrigin) asks.push('your departure airport (e.g., SYD, MEL)');
          if (needDestination) asks.push('your arrival airport in Japan (e.g., NRT, HND)');
          if (needDeparture) asks.push('your departure date (YYYY-MM-DD)');
          return `Got it! To search the best options, could you confirm ${asks.join(', ')}?`;
        })()
      : this.generateClarificationPrompt(extractedParams);

    const next_step = requiresClarification
      ? 'collecting'
      : this.determineNextStep(extractedParams, currentParams);

    return {
      content: result.text ?? '',
      extracted_params: extractedParams,
      requires_clarification: requiresClarification,
      clarification_prompt,
      next_step,
    };
  } catch (error: any) {
    try {
      console.error(
        'Error generating AI response (full):',
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
    } catch {
      console.error('Error generating AI response:', error?.stack || error);
    }
    throw new Error(error?.message || 'Failed to generate AI response');
  }
}

  async generateStreamingResponse(
    userMessage: string,
    conversationHistory: Message[],
    currentParams?: SearchParameters
  ) {
    const messages = this.buildMessageHistory(conversationHistory, userMessage);

    return streamText({
      model: openai(this.config.model || 'gpt-4o-mini'),
      system: this.getSystemPrompt(),
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  generateInitialMessage(initialQuery?: string): string {
    if (initialQuery) {
      return `Hi! I can help you search for flights. I see you're interested in "${initialQuery}" - that sounds like an amazing trip! Let me help you find the perfect flights. Can you tell me more about your travel plans?`;
    }
    return `Hi! I'm here to help you find amazing flights for your next adventure! :airplane: Where would you like to go? Just tell me your travel plans in your own words - like "I want to visit Tokyo in spring" or "Family trip to Europe next summer" - and I'll help you find the perfect flights!`;
  }

  private buildMessageHistory(history: Message[], newMessage: string) {
    const messages = history.map((msg) => ({
      role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }));
    messages.push({ role: 'user' as const, content: newMessage });
    return messages;
  }

  private needsClarification(response: string, params?: FlightInfo): boolean {
    if (!params) return false;
    const clarificationKeywords = [
      'which airport', 'which city', 'multiple airports', 'airport preference',
      'LHR, LGW', 'JFK, LGA', 'NRT, HND',
    ];
    return clarificationKeywords.some((k) =>
      response.toLowerCase().includes(k.toLowerCase())
    );
  }

  private generateClarificationPrompt(params?: FlightInfo): string | undefined {
    if (!params) return undefined;
    const ambiguousDestinations: Record<string, string> = {
      LON: 'Which London airport - Heathrow (LHR), Gatwick (LGW), or Stansted (STN)?',
      NYC: 'Which New York airport - JFK, LaGuardia (LGA), or Newark (EWR)?',
      TYO: 'Which Tokyo airport - Narita (NRT) or Haneda (HND)?',
      PAR: 'Which Paris airport - Charles de Gaulle (CDG) or Orly (ORY)?',
      CHI: "Which Chicago airport - O'Hare (ORD) or Midway (MDW)?",
    };
    if (params.destination_name) {
      const city = params.destination_name.toLowerCase();
      if (city.includes('london')) return ambiguousDestinations.LON;
      if (city.includes('new york') || city.includes('nyc')) return ambiguousDestinations.NYC;
      if (city.includes('tokyo')) return ambiguousDestinations.TYO;
      if (city.includes('paris')) return ambiguousDestinations.PAR;
      if (city.includes('chicago')) return ambiguousDestinations.CHI;
    }
    return undefined;
  }

  private determineNextStep(
    extractedParams?: FlightInfo,
    currentParams?: SearchParameters
  ): 'collecting' | 'confirming' | 'complete' {
    if (!extractedParams) return 'collecting';

    const hasOrigin = extractedParams.origin_code || currentParams?.origin_code;
    const hasDestination = extractedParams.destination_code || currentParams?.destination_code;
    const hasDeparture = extractedParams.departure_date || currentParams?.departure_date;

    const tripType = extractedParams.trip_type || currentParams?.trip_type || 'return';
    const hasReturn =
      tripType !== 'return' ||
      extractedParams.return_date ||
      currentParams?.return_date;

    const hasMultiCity =
      tripType !== 'multicity' ||
      (extractedParams.multi_city_segments &&
        extractedParams.multi_city_segments.length >= 2);

    if (hasOrigin && hasDestination && hasDeparture && hasReturn && hasMultiCity) {
      return 'confirming';
    }
    return 'collecting';
  }

  mergeParameters(
    extracted: FlightInfo,
    current?: SearchParameters
  ): UpdateSearchParametersInput {
    return {
      origin_code: extracted.origin_code || current?.origin_code,
      origin_name: extracted.origin_name || current?.origin_name,
      destination_code: extracted.destination_code || current?.destination_code,
      destination_name: extracted.destination_name || current?.destination_name,
      departure_date: extracted.departure_date || current?.departure_date,
      return_date: extracted.return_date || current?.return_date,
      trip_type: extracted.trip_type || current?.trip_type,
      adults: extracted.adults || current?.adults || 1,
      children: extracted.children || current?.children || 0,
      infants: extracted.infants || current?.infants || 0,
      cabin_class: extracted.cabin_class || current?.cabin_class,
      is_complete: false,
    };
  }
}

export const chatEngine = new ChatEngine();
export default chatEngine;