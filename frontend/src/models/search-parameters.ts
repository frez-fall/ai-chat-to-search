/**
 * Search Parameters Model
 * Contains structured flight search criteria extracted from conversation.
 */

import { z } from 'zod';

// Trip type enum
export const TripType = z.enum(['return', 'oneway', 'multicity']);
export type TripType = z.infer<typeof TripType>;

// Cabin class enum (IATA codes)
export const CabinClass = z.enum(['Y', 'S', 'C', 'F']); // Economy, Premium, Business, First
export type CabinClass = z.infer<typeof CabinClass>;

// IATA code validation
const IATACode = z.string().regex(/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters');

// Date validation (must be at least 14 days from today)
const FutureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsedDate = new Date(date);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 14); // 14 days from today
    return parsedDate >= minDate;
  }, 'Departure date must be at least 14 days from today (Paylater requirement)');

// Passenger validation
const PassengerCount = z.object({
  adults: z.number().int().min(1, 'At least 1 adult required').max(9, 'Maximum 9 adults'),
  children: z.number().int().min(0).max(8, 'Maximum 8 children'),
  infants: z.number().int().min(0).max(8, 'Maximum 8 infants'),
}).refine((data) => data.infants <= data.adults, {
  message: 'Number of infants cannot exceed number of adults',
  path: ['infants'],
});

export type PassengerCount = z.infer<typeof PassengerCount>;

// Multi-city segment schema
export const MultiCitySegmentSchema = z.object({
  id: z.string().uuid().optional(),
  search_params_id: z.string().uuid().optional(),
  sequence_order: z.number().int().positive(),
  origin_code: IATACode,
  origin_name: z.string().min(1),
  destination_code: IATACode,
  destination_name: z.string().min(1),
  departure_date: FutureDate,
}).refine((data) => data.origin_code !== data.destination_code, {
  message: 'Origin and destination must be different',
  path: ['destination_code'],
});

export type MultiCitySegment = z.infer<typeof MultiCitySegmentSchema>;

// Main search parameters schema
export const SearchParametersSchema = z.object({
  id: z.string().uuid().optional(),
  conversation_id: z.string().uuid(),
  origin_code: IATACode.optional(),
  origin_name: z.string().optional(),
  destination_code: IATACode.optional(),
  destination_name: z.string().optional(),
  departure_date: FutureDate.optional(),
  return_date: FutureDate.optional(),
  trip_type: TripType.default('return'),
  adults: z.number().int().min(1).max(9).default(1),
  children: z.number().int().min(0).max(8).default(0),
  infants: z.number().int().min(0).max(8).default(0),
  cabin_class: CabinClass.optional(),
  multi_city_segments: z.array(MultiCitySegmentSchema).optional(),
  is_complete: z.boolean().default(false),
}).refine((data) => {
  // Validate passenger counts
  return data.infants <= data.adults;
}, {
  message: 'Number of infants cannot exceed number of adults',
  path: ['infants'],
}).refine((data) => {
  // Validate return date is after departure date
  if (data.trip_type === 'return' && data.departure_date && data.return_date) {
    return new Date(data.return_date) > new Date(data.departure_date);
  }
  return true;
}, {
  message: 'Return date must be after departure date',
  path: ['return_date'],
}).refine((data) => {
  // Validate origin and destination are different
  if (data.origin_code && data.destination_code) {
    return data.origin_code !== data.destination_code;
  }
  return true;
}, {
  message: 'Origin and destination must be different',
  path: ['destination_code'],
}).refine((data) => {
  // Validate multi-city segments
  if (data.trip_type === 'multicity') {
    return data.multi_city_segments && data.multi_city_segments.length >= 2;
  }
  return true;
}, {
  message: 'Multi-city trips must have at least 2 segments',
  path: ['multi_city_segments'],
});

export type SearchParameters = z.infer<typeof SearchParametersSchema>;

// Input validation for creating/updating search parameters
export const CreateSearchParametersSchema = SearchParametersSchema.omit({ id: true });
export const UpdateSearchParametersSchema = SearchParametersSchema.partial().omit({ id: true, conversation_id: true });

export type CreateSearchParametersInput = z.infer<typeof CreateSearchParametersSchema>;
export type UpdateSearchParametersInput = z.infer<typeof UpdateSearchParametersSchema>;

// Validation functions
export function validateSearchParameters(data: unknown): SearchParameters {
  return SearchParametersSchema.parse(data);
}

export function validateCreateSearchParametersInput(data: unknown): CreateSearchParametersInput {
  return CreateSearchParametersSchema.parse(data);
}

export function validateUpdateSearchParametersInput(data: unknown): UpdateSearchParametersInput {
  return UpdateSearchParametersSchema.parse(data);
}

export function validateMultiCitySegment(data: unknown): MultiCitySegment {
  return MultiCitySegmentSchema.parse(data);
}

// Helper functions
export function isSearchComplete(params: SearchParameters): boolean {
  const hasOrigin = !!params.origin_code;
  const hasDestination = !!params.destination_code;
  const hasDepartureDate = !!params.departure_date;
  const hasReturnDate = params.trip_type !== 'return' || !!params.return_date;
  const hasValidSegments = params.trip_type !== 'multicity' || 
    (params.multi_city_segments && params.multi_city_segments.length >= 2);

  return hasOrigin && hasDestination && hasDepartureDate && hasReturnDate && hasValidSegments;
}

export function calculateCompletionPercentage(params: SearchParameters): number {
  let completed = 0;
  let total = 0;

  // Required fields
  const requiredFields = [
    'origin_code',
    'destination_code', 
    'departure_date'
  ];

  requiredFields.forEach(field => {
    total++;
    if (params[field as keyof SearchParameters]) {
      completed++;
    }
  });

  // Return date for return trips
  if (params.trip_type === 'return') {
    total++;
    if (params.return_date) {
      completed++;
    }
  }

  // Multi-city segments
  if (params.trip_type === 'multicity') {
    total++;
    if (params.multi_city_segments && params.multi_city_segments.length >= 2) {
      completed++;
    }
  }

  return Math.round((completed / total) * 100);
}

export function getMissingFields(params: SearchParameters): string[] {
  const missing: string[] = [];

  if (!params.origin_code) missing.push('origin_code');
  if (!params.destination_code) missing.push('destination_code');
  if (!params.departure_date) missing.push('departure_date');
  
  if (params.trip_type === 'return' && !params.return_date) {
    missing.push('return_date');
  }
  
  if (params.trip_type === 'multicity') {
    if (!params.multi_city_segments || params.multi_city_segments.length < 2) {
      missing.push('multi_city_segments');
    }
  }

  return missing;
}