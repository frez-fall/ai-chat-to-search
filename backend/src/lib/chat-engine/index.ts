/**
 * Chat Engine Library
 * Core AI conversation logic with OpenAI integration
 */

import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { Message } from '../../models/message.js';
import type { SearchParameters, UpdateSearchParametersInput } from '../../models/search-parameters.js';
import type { Conversation } from '../../models/conversation.js';

// Flight information extraction schema
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
    origin_name: string;
    destination_code: string;
    destination_name: string;
    departure_date: string;
    sequence_order: number;
  }>;
}

// AI response interface
export interface AIResponse {
  content: string;
  extracted_params?: FlightInfo;
  requires_clarification: boolean;
  clarification_prompt?: string;
  next_step?: 'collecting' | 'confirming' | 'complete';
}

// Chat engine configuration
export interface ChatEngineConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: ChatEngineConfig = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1000,
};

export class ChatEngine {
  private config: ChatEngineConfig;

  constructor(config?: Partial<ChatEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // System prompt with IATA knowledge and travel assistant persona
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

  // Generate AI response for user message
  async generateResponse(
    userMessage: string,
    conversationHistory: Message[],
    currentParams?: SearchParameters,
    context?: { user_location?: string }
  ): Promise<AIResponse> {
    try {
      // Build conversation context
      const messages = this.buildMessageHistory(conversationHistory, userMessage);

      // Generate response with function calling for parameter extraction
      const result = await generateText({
        model: openai(this.config.model),
        system: this.getSystemPrompt(),
        messages,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        tools: {
          extractFlightInfo: {
            description: 'Extract flight search parameters from user input',
            parameters: {
              type: 'object',
              properties: {
                origin_code: { type: 'string', description: '3-letter IATA airport code for departure' },
                origin_name: { type: 'string', description: 'Human-readable departure location' },
                destination_code: { type: 'string', description: '3-letter IATA airport code for arrival' },
                destination_name: { type: 'string', description: 'Human-readable arrival location' },
                departure_date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
                return_date: { type: 'string', description: 'Return date in YYYY-MM-DD format (for round trips)' },
                trip_type: { 
                  type: 'string', 
                  enum: ['return', 'oneway', 'multicity'],
                  description: 'Type of trip'
                },
                adults: { type: 'number', description: 'Number of adult passengers (1-9)' },
                children: { type: 'number', description: 'Number of child passengers 2-11 years (0-8)' },
                infants: { type: 'number', description: 'Number of infant passengers under 2 years (0-8)' },
                cabin_class: { 
                  type: 'string',
                  enum: ['Y', 'S', 'C', 'F'],
                  description: 'Cabin class preference'
                },
                multi_city_segments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      origin_code: { type: 'string' },
                      origin_name: { type: 'string' },
                      destination_code: { type: 'string' },
                      destination_name: { type: 'string' },
                      departure_date: { type: 'string' },
                      sequence_order: { type: 'number' }
                    }
                  },
                  description: 'Flight segments for multi-city trips'
                }
              }
            }
          }
        },
      });

      // Extract flight information from function calls
      let extractedParams: FlightInfo | undefined;
      if (result.toolCalls && result.toolCalls.length > 0) {
        const flightInfoCall = result.toolCalls.find(call => call.toolName === 'extractFlightInfo');
        if (flightInfoCall) {
          extractedParams = flightInfoCall.args as FlightInfo;
        }
      }

      // Determine if clarification is needed
      const requiresClarification = this.needsClarification(result.text, extractedParams);
      const clarificationPrompt = requiresClarification ? this.generateClarificationPrompt(extractedParams) : undefined;

      // Determine next conversation step
      const nextStep = this.determineNextStep(extractedParams, currentParams);

      return {
        content: result.text,
        extracted_params: extractedParams,
        requires_clarification: requiresClarification,
        clarification_prompt,
        next_step,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // Generate streaming response
  async generateStreamingResponse(
    userMessage: string,
    conversationHistory: Message[],
    currentParams?: SearchParameters
  ) {
    const messages = this.buildMessageHistory(conversationHistory, userMessage);

    return streamText({
      model: openai(this.config.model),
      system: this.getSystemPrompt(),
      messages,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  // Generate initial greeting message
  generateInitialMessage(initialQuery?: string): string {
    if (initialQuery) {
      return `Hi! I can help you search for flights. I see you're interested in "${initialQuery}" - that sounds like an amazing trip! Let me help you find the perfect flights. Can you tell me more about your travel plans?`;
    }
    
    return `Hi! I'm here to help you find amazing flights for your next adventure! ✈️ Where would you like to go? Just tell me your travel plans in your own words - like "I want to visit Tokyo in spring" or "Family trip to Europe next summer" - and I'll help you find the perfect flights!`;
  }

  // Build message history for AI context
  private buildMessageHistory(history: Message[], newMessage: string) {
    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    }));

    messages.push({
      role: 'user' as const,
      content: newMessage,
    });

    return messages;
  }

  // Check if clarification is needed
  private needsClarification(response: string, params?: FlightInfo): boolean {
    if (!params) return false;

    // Check for ambiguous airports mentioned in response
    const clarificationKeywords = [
      'which airport',
      'which city',
      'multiple airports',
      'airport preference',
      'LHR, LGW',
      'JFK, LGA',
      'NRT, HND',
    ];

    return clarificationKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Generate clarification prompt
  private generateClarificationPrompt(params?: FlightInfo): string | undefined {
    if (!params) return undefined;

    // Common airport disambiguations
    const ambiguousDestinations = {
      'LON': 'Which London airport - Heathrow (LHR), Gatwick (LGW), or Stansted (STN)?',
      'NYC': 'Which New York airport - JFK, LaGuardia (LGA), or Newark (EWR)?',
      'TYO': 'Which Tokyo airport - Narita (NRT) or Haneda (HND)?',
      'PAR': 'Which Paris airport - Charles de Gaulle (CDG) or Orly (ORY)?',
      'CHI': 'Which Chicago airport - O\'Hare (ORD) or Midway (MDW)?',
    };

    // Check if destination needs clarification
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

  // Determine next conversation step
  private determineNextStep(
    extractedParams?: FlightInfo,
    currentParams?: SearchParameters
  ): 'collecting' | 'confirming' | 'complete' {
    if (!extractedParams) return 'collecting';

    // Check completeness
    const hasOrigin = extractedParams.origin_code || currentParams?.origin_code;
    const hasDestination = extractedParams.destination_code || currentParams?.destination_code;
    const hasDeparture = extractedParams.departure_date || currentParams?.departure_date;
    
    const tripType = extractedParams.trip_type || currentParams?.trip_type || 'return';
    const hasReturn = tripType !== 'return' || extractedParams.return_date || currentParams?.return_date;
    
    const hasMultiCity = tripType !== 'multicity' || 
      (extractedParams.multi_city_segments && extractedParams.multi_city_segments.length >= 2);

    if (hasOrigin && hasDestination && hasDeparture && hasReturn && hasMultiCity) {
      return 'confirming';
    }

    return 'collecting';
  }

  // Merge extracted parameters with existing parameters
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
      is_complete: false, // Will be calculated later
    };
  }
}

// Default chat engine instance
export const chatEngine = new ChatEngine();
export default chatEngine;