/**
 * Chat Engine Library
 * Core AI conversation logic with OpenAI integration
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText, tool } from 'ai';

// Create OpenAI instance with explicit API key configuration
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});
import { z } from 'zod';
import type { Message } from '@/models/message';
import type { SearchParameters, UpdateSearchParametersInput } from '@/models/search-parameters';
import type { Conversation } from '@/models/conversation';

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
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
};

export class ChatEngine {
  private config: ChatEngineConfig;

  constructor(config?: Partial<ChatEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Define the flight extraction tool
  private getFlightExtractionTool() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const minDepartureDate = new Date(today);
    minDepartureDate.setDate(minDepartureDate.getDate() + 14);
    const minDepartureDateStr = minDepartureDate.toISOString().split('T')[0];
    
    return {
      extractFlightParams: tool({
        description: `Extract flight search parameters from user input. Today is ${todayStr}. All dates must be ${minDepartureDateStr} or later (14 days from today). Use year ${today.getFullYear()} or later for all dates.`,
        inputSchema: z.object({
          origin_code: z.string().length(3).toUpperCase().optional()
            .describe('IATA airport code for origin (3 letters, e.g., SYD, MEL)'),
          origin_name: z.string().optional()
            .describe('Full name of the origin city or airport'),
          destination_code: z.string().length(3).toUpperCase().optional()
            .describe('IATA airport code for destination (3 letters, e.g., DPS, SIN)'),
          destination_name: z.string().optional()
            .describe('Full name of the destination city or airport'),
          departure_date: z.string().optional()
            .describe(`Departure date in YYYY-MM-DD format (must be ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} or later)`),
          return_date: z.string().optional()
            .describe(`Return date in YYYY-MM-DD format for return trips (must be after departure date)`),
          trip_type: z.enum(['return', 'oneway', 'multicity']).optional()
            .describe('Type of trip: return (round trip), oneway, or multicity'),
          adults: z.number().int().min(1).max(9).optional()
            .describe('Number of adult passengers (1-9)'),
          children: z.number().int().min(0).max(8).optional()
            .describe('Number of child passengers aged 2-11 (0-8)'),
          infants: z.number().int().min(0).max(8).optional()
            .describe('Number of infant passengers under 2 (0-8)'),
          cabin_class: z.enum(['Y', 'S', 'C', 'F']).optional()
            .describe('Cabin class: Y=Economy, S=Premium Economy, C=Business, F=First'),
          multi_city_segments: z.array(z.object({
            origin_code: z.string().length(3).toUpperCase()
              .describe('IATA airport code for segment origin'),
            origin_name: z.string()
              .describe('Full name of segment origin'),
            destination_code: z.string().length(3).toUpperCase()
              .describe('IATA airport code for segment destination'),
            destination_name: z.string()
              .describe('Full name of segment destination'),
            departure_date: z.string()
              .describe('Departure date for this segment in YYYY-MM-DD format'),
            sequence_order: z.number().int()
              .describe('Order of this segment in the journey (1, 2, 3, etc.)')
          })).optional()
            .describe('Array of flight segments for multi-city trips')
        }),
        execute: async (params) => {
          // The tool simply returns the extracted parameters
          // The actual processing happens in the generateResponse method
          return params as FlightInfo;
        }
      })
    };
  }

  // System prompt with IATA knowledge and travel assistant persona
  private getSystemPrompt(): string {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const minDepartureDate = new Date(today);
    minDepartureDate.setDate(minDepartureDate.getDate() + 14);
    const minDepartureDateStr = minDepartureDate.toISOString().split('T')[0];
    
    return `You are a friendly, empathetic, and enthusiastic flight search assistant helping Australian travelers find flights. You have comprehensive IATA airport code knowledge and understand popular Australian travel routes.

IMPORTANT CONTEXT:
- Today's date is ${todayStr}
- The current year is ${today.getFullYear()}
- You are assisting users who are based in AUSTRALIA
- Default to Australian airports as origins unless specified otherwise
- Be aware of Australian travel patterns, school holidays, and popular destinations

IMPORTANT DATE RULES:
- When users mention months without years, assume the current year (${today.getFullYear()}) or next year if the month has already passed
- All departure dates must be at least 14 days from today (earliest possible departure: ${minDepartureDateStr})
- NEVER suggest dates in the past (before ${todayStr})
- If a user mentions "next month" or "December" without a year, calculate based on today being ${todayStr}

IMPORTANT RULES:
1. Always maintain a warm, helpful, and excited tone about travel
2. Convert locations to IATA codes and ask for clarification when multiple airports exist
3. Departure dates must be at least 14 days from today due to Paylater payment plan requirements
4. If user requests dates sooner than 14 days, explain the Paylater requirement politely
5. For customer support requests, direct them to the orange Intercom button on the page
6. Always extract and validate flight parameters from user input
7. When users don't specify an origin, assume they're departing from an Australian city
8. CRITICAL: Keep asking for missing information until you have ALL required details to generate a booking URL

REQUIRED INFORMATION FOR BOOKING:
- Origin airport (IATA code)
- Destination airport (IATA code)
- Departure date (at least 14 days from today)
- Trip type (one-way or return) - ASK if not specified
- Return date (if return trip) - ASK if trip is return but no return date given

RESPONSE TEMPLATES FOR MISSING INFORMATION:
- Missing origin: "Which Australian city would you like to depart from?"
- Missing destination: "Where would you like to fly to?"
- Missing departure date: "What date would you like to depart? (Remember, it needs to be at least 14 days from today - ${minDepartureDateStr} or later)"
- Trip type unclear: "Would you like a one-way ticket or a return trip?"
- Missing return date (for return trip): "When would you like to return?"
- Multiple missing: List what's needed, e.g., "To find flights for you, I'll need to know: 1) Your departure city, 2) Your travel dates"

IMPORTANT: If you don't have all required information, ALWAYS end your response by asking for the specific missing details

AUSTRALIAN AIRPORTS (primary references):
- Sydney: SYD (Kingsford Smith)
- Melbourne: MEL (Tullamarine), AVV (Avalon)
- Brisbane: BNE
- Perth: PER
- Adelaide: ADL
- Gold Coast: OOL
- Cairns: CNS
- Hobart: HBA
- Darwin: DRW
- Canberra: CBR

POPULAR DESTINATIONS FROM AUSTRALIA:
- Southeast Asia: Bali (DPS), Singapore (SIN), Bangkok (BKK), Phuket (HKT), Kuala Lumpur (KUL)
- New Zealand: Auckland (AKL), Queenstown (ZQN), Wellington (WLG), Christchurch (CHC)
- Japan: Tokyo (NRT/HND), Osaka (KIX), Sapporo (CTS)
- USA: Los Angeles (LAX), San Francisco (SFO), Honolulu (HNL)
- Europe: London (LHR), Paris (CDG), Rome (FCO)
- Middle East: Dubai (DXB), Doha (DOH)
- Pacific: Fiji (NAN), Vanuatu (VLI), New Caledonia (NOU)

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

      // Get the flight extraction tool
      const tools = this.getFlightExtractionTool();

      // Generate response with tool calling
      const result = await generateText({
        model: openai(this.config.model),
        system: this.getSystemPrompt(),
        messages,
        temperature: this.config.temperature,
        maxRetries: 2,
        tools,
        toolChoice: 'auto', // Let the model decide when to use the tool
      });

      // Extract parameters from tool results
      let extractedParams: FlightInfo | undefined;
      
      // Check if any tools were called
      if (result.toolResults && result.toolResults.length > 0) {
        // Find the extractFlightParams tool result
        const flightParamsResult = result.toolResults.find(
          (tr) => tr.toolName === 'extractFlightParams'
        );
        
        if (flightParamsResult && 'output' in flightParamsResult) {
          extractedParams = flightParamsResult.output as FlightInfo;
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
        clarification_prompt: clarificationPrompt,
        next_step: nextStep,
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
    const tools = this.getFlightExtractionTool();

    return streamText({
      model: openai(this.config.model),
      system: this.getSystemPrompt(),
      messages,
      temperature: this.config.temperature,
      maxRetries: 2,
      tools,
      toolChoice: 'auto',
    });
  }

  // Generate initial greeting message
  generateInitialMessage(initialQuery?: string): string {
    if (initialQuery) {
      return `G'day! I can help you search for flights from Australia. I see you're interested in "${initialQuery}" - that sounds like an amazing trip! Let me help you find the perfect flights. Which Australian city would you like to depart from, and when are you planning to travel?`;
    }
    
    return `G'day! I'm here to help you find amazing flights from Australia to anywhere in the world! ✈️ Whether you're after a quick trip to Bali, a New Zealand adventure, or planning that dream European holiday - I've got you covered. Just tell me where you'd like to go and when, and I'll find the best flights for you!`;
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
    if (!extractedParams && !currentParams) return 'collecting';

    // Merge parameters to check completeness
    const hasOrigin = extractedParams?.origin_code || currentParams?.origin_code;
    const hasDestination = extractedParams?.destination_code || currentParams?.destination_code;
    const hasDeparture = extractedParams?.departure_date || currentParams?.departure_date;
    
    // Determine trip type - if no return date mentioned, assume one-way
    const hasReturnInfo = extractedParams?.return_date || currentParams?.return_date;
    const tripType = extractedParams?.trip_type || currentParams?.trip_type || (hasReturnInfo ? 'return' : 'oneway');
    
    // Log for debugging
    console.log('Determining next step:', {
      hasOrigin,
      hasDestination,
      hasDeparture,
      tripType,
      hasReturnInfo,
      extractedParams,
      currentParams
    });
    
    // Check if we have all required fields based on trip type
    const hasRequiredForOneWay = hasOrigin && hasDestination && hasDeparture;
    const hasRequiredForReturn = hasRequiredForOneWay && hasReturnInfo;
    const hasRequiredForMultiCity = tripType !== 'multicity' || 
      (extractedParams?.multi_city_segments && extractedParams.multi_city_segments.length >= 2);
    
    // Determine if complete based on trip type
    if (tripType === 'oneway' && hasRequiredForOneWay && hasRequiredForMultiCity) {
      return 'complete';
    }
    
    if (tripType === 'return' && hasRequiredForReturn && hasRequiredForMultiCity) {
      return 'complete';
    }
    
    if (tripType === 'multicity' && hasOrigin && hasDestination && hasRequiredForMultiCity) {
      return 'complete';
    }

    return 'collecting';
  }

  // Merge extracted parameters with existing parameters
  mergeParameters(
    extracted: FlightInfo,
    current?: SearchParameters
  ): UpdateSearchParametersInput {
    // Determine trip type based on available information
    let tripType = extracted.trip_type || current?.trip_type;
    
    // If no trip type specified, infer from return date presence
    if (!tripType) {
      const hasReturnDate = extracted.return_date || current?.return_date;
      tripType = hasReturnDate ? 'return' : 'oneway';
    }
    
    return {
      origin_code: extracted.origin_code || current?.origin_code,
      origin_name: extracted.origin_name || current?.origin_name,
      destination_code: extracted.destination_code || current?.destination_code,
      destination_name: extracted.destination_name || current?.destination_name,
      departure_date: extracted.departure_date || current?.departure_date,
      return_date: extracted.return_date || current?.return_date,
      trip_type: tripType,
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