/**
 * Flight Parser Library
 * OpenAI-powered IATA code conversion and natural language processing
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Create OpenAI instance with explicit API key configuration
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IATA code validation schema - allow empty strings for partial extraction
const IATACodeSchema = z.string().regex(/^([A-Z]{3}|)$/, 'Must be a 3-letter IATA code or empty');

// Parsed flight information schema
export const ParsedFlightInfoSchema = z.object({
  origin: z.object({
    code: IATACodeSchema.optional(),
    name: z.string().optional(),
    ambiguous: z.boolean().default(false),
    alternatives: z.array(z.object({
      code: IATACodeSchema,
      name: z.string(),
    })).optional(),
  }).optional(),
  destination: z.object({
    code: IATACodeSchema.optional(),
    name: z.string().optional(),
    ambiguous: z.boolean().default(false),
    alternatives: z.array(z.object({
      code: IATACodeSchema,
      name: z.string(),
    })).optional(),
  }).optional(),
  dates: z.object({
    departure: z.string().optional(),
    return: z.string().optional(),
    flexible: z.boolean().default(false),
  }).optional(),
  passengers: z.object({
    adults: z.number().min(1).max(9).default(1),
    children: z.number().min(0).max(8).default(0),
    infants: z.number().min(0).max(8).default(0),
  }).optional(),
  preferences: z.object({
    cabin_class: z.enum(['Y', 'S', 'C', 'F']).optional().default('Y'),
    trip_type: z.enum(['return', 'oneway', 'multicity']).optional().default('return'),
  }).optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  requires_clarification: z.boolean().default(false),
  clarification_needed: z.array(z.string()).default([]),
});

export type ParsedFlightInfo = z.infer<typeof ParsedFlightInfoSchema>;

// Date validation and parsing
export class DateParser {
  private static readonly MIN_DAYS_AHEAD = 14; // Paylater requirement

  // Parse natural language date
  static async parseDate(dateText: string, context?: string): Promise<{
    parsed_date?: string;
    is_valid: boolean;
    error_message?: string;
    suggested_date?: string;
  }> {
    try {
      // Simple date parsing patterns
      const datePatterns = [
        /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
      ];

      let parsedDate: Date | null = null;

      // Try pattern matching first
      for (const pattern of datePatterns) {
        const match = dateText.match(pattern);
        if (match) {
          if (pattern === datePatterns[0]) {
            // YYYY-MM-DD
            parsedDate = new Date(dateText);
          } else {
            // Ambiguous formats - assume MM/DD/YYYY for now
            const [, first, second, year] = match;
            parsedDate = new Date(parseInt(year), parseInt(first) - 1, parseInt(second));
          }
          break;
        }
      }

      // If no pattern match, try natural language parsing
      if (!parsedDate) {
        // Use Date constructor for natural language
        parsedDate = new Date(dateText);
      }

      // Validate parsed date
      if (isNaN(parsedDate.getTime())) {
        return {
          is_valid: false,
          error_message: 'Unable to parse date from input',
        };
      }

      // Check if date is at least 14 days in the future
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + this.MIN_DAYS_AHEAD);

      const formattedDate = parsedDate.toISOString().split('T')[0];

      if (parsedDate < minDate) {
        return {
          parsed_date: formattedDate,
          is_valid: false,
          error_message: `Departure date must be at least ${this.MIN_DAYS_AHEAD} days from today for Paylater payment plan`,
          suggested_date: minDate.toISOString().split('T')[0],
        };
      }

      return {
        parsed_date: formattedDate,
        is_valid: true,
      };
    } catch (error) {
      return {
        is_valid: false,
        error_message: 'Error parsing date',
      };
    }
  }

  // Validate date range for round trips
  static validateDateRange(departureDate: string, returnDate: string): {
    is_valid: boolean;
    error_message?: string;
  } {
    const departure = new Date(departureDate);
    const returnD = new Date(returnDate);

    if (returnD <= departure) {
      return {
        is_valid: false,
        error_message: 'Return date must be after departure date',
      };
    }

    return { is_valid: true };
  }
}

// IATA code resolution using OpenAI
export class IATAResolver {
  // Common airport mappings for quick resolution
  private static readonly COMMON_AIRPORTS = {
    // Major hubs
    'new york': [
      { code: 'JFK', name: 'John F. Kennedy International' },
      { code: 'LGA', name: 'LaGuardia' },
      { code: 'EWR', name: 'Newark Liberty International' }
    ],
    'london': [
      { code: 'LHR', name: 'Heathrow' },
      { code: 'LGW', name: 'Gatwick' },
      { code: 'STN', name: 'Stansted' }
    ],
    'tokyo': [
      { code: 'NRT', name: 'Narita International' },
      { code: 'HND', name: 'Haneda' }
    ],
    'paris': [
      { code: 'CDG', name: 'Charles de Gaulle' },
      { code: 'ORY', name: 'Orly' }
    ],
    'chicago': [
      { code: 'ORD', name: 'O\'Hare International' },
      { code: 'MDW', name: 'Midway' }
    ],
    // Single airport cities
    'los angeles': [{ code: 'LAX', name: 'Los Angeles International' }],
    'sydney': [{ code: 'SYD', name: 'Sydney Kingsford Smith' }],
    'melbourne': [{ code: 'MEL', name: 'Melbourne Tullamarine' }],
    'san francisco': [{ code: 'SFO', name: 'San Francisco International' }],
    'amsterdam': [{ code: 'AMS', name: 'Amsterdam Schiphol' }],
    'frankfurt': [{ code: 'FRA', name: 'Frankfurt am Main' }],
  };

  // Resolve location to IATA code using OpenAI
  static async resolveLocation(location: string): Promise<{
    code?: string;
    name?: string;
    ambiguous: boolean;
    alternatives?: Array<{ code: string; name: string }>;
    confidence: number;
  }> {
    try {
      // First try common airports for speed
      const normalizedLocation = location.toLowerCase().trim();
      const commonMatch = this.COMMON_AIRPORTS[normalizedLocation as keyof typeof this.COMMON_AIRPORTS];
      
      if (commonMatch) {
        if (commonMatch.length === 1) {
          return {
            code: commonMatch[0].code,
            name: commonMatch[0].name,
            ambiguous: false,
            confidence: 0.95,
          };
        } else {
          return {
            ambiguous: true,
            alternatives: commonMatch,
            confidence: 0.9,
          };
        }
      }

      // Use OpenAI for complex resolution
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          airport_matches: z.array(z.object({
            iata_code: z.string().regex(/^[A-Z]{3}$/),
            airport_name: z.string(),
            city: z.string(),
            country: z.string(),
            confidence: z.number().min(0).max(1),
          })),
          is_ambiguous: z.boolean(),
          best_match: z.object({
            iata_code: z.string().regex(/^[A-Z]{3}$/),
            airport_name: z.string(),
            confidence: z.number(),
          }).optional(),
        }),
        prompt: `Convert the location "${location}" to IATA airport codes. 

Rules:
1. Return the most likely airport(s) for this location
2. If multiple airports serve the same city, mark as ambiguous
3. Consider major international airports first
4. Provide confidence scores based on how well the input matches
5. For ambiguous cities, provide up to 3 most relevant airports

Examples:
- "New York" → ambiguous (JFK, LGA, EWR)
- "Los Angeles" → LAX (not ambiguous)
- "London" → ambiguous (LHR, LGW, STN)
- "Tokyo" → ambiguous (NRT, HND)`,
      });

      const matches = result.object.airport_matches;
      if (matches.length === 0) {
        return {
          ambiguous: false,
          confidence: 0,
        };
      }

      if (result.object.is_ambiguous && matches.length > 1) {
        return {
          ambiguous: true,
          alternatives: matches.slice(0, 3).map(m => ({
            code: m.iata_code,
            name: m.airport_name,
          })),
          confidence: Math.max(...matches.map(m => m.confidence)),
        };
      }

      const bestMatch = result.object.best_match || matches[0];
      return {
        code: bestMatch.iata_code,
        name: bestMatch.airport_name,
        ambiguous: false,
        confidence: bestMatch.confidence,
      };
    } catch (error) {
      console.error('Error resolving IATA code:', error);
      return {
        ambiguous: false,
        confidence: 0,
      };
    }
  }

  // Validate IATA code
  static validateIATACode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  // Get airport info by IATA code
  static async getAirportInfo(code: string): Promise<{
    name?: string;
    city?: string;
    country?: string;
    valid: boolean;
  }> {
    if (!this.validateIATACode(code)) {
      return { valid: false };
    }

    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          airport_name: z.string(),
          city: z.string(),
          country: z.string(),
          is_valid: z.boolean(),
        }),
        prompt: `Provide information for IATA airport code "${code}". Return the airport name, city, and country. If the code is not valid, set is_valid to false.`,
      });

      return {
        name: result.object.airport_name,
        city: result.object.city,
        country: result.object.country,
        valid: result.object.is_valid,
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

// Main flight parser class
export class FlightParser {
  // Parse natural language flight query
  static async parseFlightQuery(query: string, context?: {
    user_location?: string;
    previous_searches?: string[];
  }): Promise<ParsedFlightInfo> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentYear = today.getFullYear();
      const minDepartureDate = new Date(today);
      minDepartureDate.setDate(minDepartureDate.getDate() + 14);
      const minDepartureDateStr = minDepartureDate.toISOString().split('T')[0];
      
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: ParsedFlightInfoSchema,
        prompt: `Parse this flight search query: "${query}"

CRITICAL DATE CONTEXT:
- Today's date is ${todayStr}
- Current year is ${currentYear}
- Minimum departure date is ${minDepartureDateStr} (14 days from today)
- NEVER suggest dates before ${todayStr}
- When months are mentioned without years, assume ${currentYear} or ${currentYear + 1} if the month has passed

Extract flight information including:
1. Origin and destination cities/airports
2. Travel dates (departure and return if mentioned) - MUST be in YYYY-MM-DD format with correct year
3. Number of passengers (adults, children, infants)
4. Cabin class preferences
5. Trip type (return, one-way, multi-city)

Rules:
- Convert city names to IATA codes when possible
- Mark locations as ambiguous if multiple airports serve the city
- All dates MUST be at least 14 days in the future from ${todayStr}
- Format all dates as YYYY-MM-DD with the correct year (${currentYear} or later)
- Default to 1 adult passenger if not specified
- Default to economy class if not specified
- Default trip_type to 'return' if not clearly specified
- Set requires_clarification to true if critical information is missing or ambiguous

Context: ${context?.user_location ? `User location: ${context.user_location}` : 'No context'}

Respond with structured data only.`,
      });

      return ParsedFlightInfoSchema.parse(result.object);
    } catch (error) {
      console.error('Error parsing flight query:', error);
      return {
        confidence: 0,
        requires_clarification: true,
        clarification_needed: ['Unable to parse flight query'],
      };
    }
  }

  // Parse complex multi-city queries
  static async parseMultiCityQuery(query: string): Promise<{
    segments: Array<{
      origin: { code?: string; name?: string };
      destination: { code?: string; name?: string };
      date?: string;
      sequence: number;
    }>;
    valid: boolean;
    errors: string[];
  }> {
    try {
      const result = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          segments: z.array(z.object({
            origin_code: z.string().optional(),
            origin_name: z.string(),
            destination_code: z.string().optional(),
            destination_name: z.string(),
            departure_date: z.string().optional(),
            sequence_order: z.number(),
          })),
          is_valid: z.boolean(),
          errors: z.array(z.string()),
        }),
        prompt: `Parse this multi-city flight query: "${query}"

Extract individual flight segments with:
- Origin and destination for each segment
- Departure date if mentioned
- Sequence order (1, 2, 3...)

Rules:
- Multi-city trips must have at least 2 segments
- Each segment destination should be the next segment's origin
- Convert city names to IATA codes when possible
- Order segments chronologically

Example: "Fly Sydney to Bangkok, then Bangkok to Tokyo, then back to Sydney"
Should create 3 segments: SYD→BKK, BKK→NRT, NRT→SYD`,
      });

      const segments = result.object.segments.map(seg => ({
        origin: {
          code: seg.origin_code,
          name: seg.origin_name,
        },
        destination: {
          code: seg.destination_code,
          name: seg.destination_name,
        },
        date: seg.departure_date,
        sequence: seg.sequence_order,
      }));

      return {
        segments,
        valid: result.object.is_valid,
        errors: result.object.errors,
      };
    } catch (error) {
      return {
        segments: [],
        valid: false,
        errors: ['Failed to parse multi-city query'],
      };
    }
  }

  // Extract passenger information
  static parsePassengers(query: string): {
    adults: number;
    children: number;
    infants: number;
    valid: boolean;
    errors: string[];
  } {
    const passengerPatterns = {
      adults: /(\d+)\s*adult/gi,
      children: /(\d+)\s*(child|kid)/gi,
      infants: /(\d+)\s*(infant|baby)/gi,
      family: /family/i,
    };

    let adults = 1;
    let children = 0;
    let infants = 0;
    const errors: string[] = [];

    try {
      // Extract adult count
      const adultMatch = query.match(passengerPatterns.adults);
      if (adultMatch) {
        adults = parseInt(adultMatch[0].match(/\d+/)?.[0] || '1');
      }

      // Extract children count
      const childMatch = query.match(passengerPatterns.children);
      if (childMatch) {
        children = parseInt(childMatch[0].match(/\d+/)?.[0] || '0');
      }

      // Extract infant count
      const infantMatch = query.match(passengerPatterns.infants);
      if (infantMatch) {
        infants = parseInt(infantMatch[0].match(/\d+/)?.[0] || '0');
      }

      // Handle "family" keyword
      if (passengerPatterns.family.test(query) && adults === 1) {
        adults = 2;
        children = 2; // Assume 2 children for family
      }

      // Validate passenger counts
      if (adults < 1 || adults > 9) {
        errors.push('Adults must be between 1 and 9');
        adults = Math.max(1, Math.min(9, adults));
      }

      if (children < 0 || children > 8) {
        errors.push('Children must be between 0 and 8');
        children = Math.max(0, Math.min(8, children));
      }

      if (infants < 0 || infants > 8) {
        errors.push('Infants must be between 0 and 8');
        infants = Math.max(0, Math.min(8, infants));
      }

      if (infants > adults) {
        errors.push('Number of infants cannot exceed number of adults');
        infants = adults;
      }

      return {
        adults,
        children,
        infants,
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        adults: 1,
        children: 0,
        infants: 0,
        valid: false,
        errors: ['Error parsing passenger information'],
      };
    }
  }
}

// Default parser instance
export const flightParser = new FlightParser();
export { DateParser, IATAResolver };
export default flightParser;