/**
 * Multi-City Segment Model
 * Represents individual flight segments for multi-city trips.
 */

import { z } from 'zod';

// IATA code validation
const IATACode = z.string().regex(/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters');

// Date validation (must be at least 14 days from today)
const FutureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsedDate = new Date(date);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 14); // 14 days from today
    return parsedDate >= minDate;
  }, 'Departure date must be at least 14 days from today');

// Multi-city segment schema
export const MultiCitySegmentSchema = z.object({
  id: z.string().uuid().optional(),
  search_params_id: z.string().uuid(),
  sequence_order: z.number().int().positive('Sequence order must be positive'),
  origin_code: IATACode,
  origin_name: z.string().min(1, 'Origin name is required'),
  destination_code: IATACode,
  destination_name: z.string().min(1, 'Destination name is required'),
  departure_date: FutureDate,
}).refine((data) => data.origin_code !== data.destination_code, {
  message: 'Origin and destination must be different',
  path: ['destination_code'],
});

export type MultiCitySegment = z.infer<typeof MultiCitySegmentSchema>;

// Input validation for creating segments
export const CreateMultiCitySegmentSchema = MultiCitySegmentSchema.omit({ id: true });
export type CreateMultiCitySegmentInput = z.infer<typeof CreateMultiCitySegmentSchema>;

// Input validation for updating segments
export const UpdateMultiCitySegmentSchema = MultiCitySegmentSchema.partial()
  .omit({ id: true, search_params_id: true });
export type UpdateMultiCitySegmentInput = z.infer<typeof UpdateMultiCitySegmentSchema>;

// Validation functions
export function validateMultiCitySegment(data: unknown): MultiCitySegment {
  return MultiCitySegmentSchema.parse(data);
}

export function validateCreateMultiCitySegmentInput(data: unknown): CreateMultiCitySegmentInput {
  return CreateMultiCitySegmentSchema.parse(data);
}

export function validateUpdateMultiCitySegmentInput(data: unknown): UpdateMultiCitySegmentInput {
  return UpdateMultiCitySegmentSchema.parse(data);
}

// Validation for multiple segments
export function validateMultiCitySegments(data: unknown): MultiCitySegment[] {
  const segments = z.array(MultiCitySegmentSchema).parse(data);
  
  // Additional validation for segment sequence
  validateSegmentSequence(segments);
  validateSegmentDates(segments);
  
  return segments;
}

// Helper functions
export function validateSegmentSequence(segments: MultiCitySegment[]): void {
  const sortedSegments = [...segments].sort((a, b) => a.sequence_order - b.sequence_order);
  
  for (let i = 0; i < sortedSegments.length; i++) {
    if (sortedSegments[i].sequence_order !== i + 1) {
      throw new Error(`Invalid segment sequence. Expected sequence order ${i + 1}, got ${sortedSegments[i].sequence_order}`);
    }
  }
}

export function validateSegmentDates(segments: MultiCitySegment[]): void {
  const sortedSegments = [...segments].sort((a, b) => a.sequence_order - b.sequence_order);
  
  for (let i = 1; i < sortedSegments.length; i++) {
    const prevDate = new Date(sortedSegments[i - 1].departure_date);
    const currentDate = new Date(sortedSegments[i].departure_date);
    
    if (currentDate <= prevDate) {
      throw new Error(`Multi-city segment dates must be in chronological order. Segment ${i + 1} date must be after segment ${i} date`);
    }
  }
}

export function validateSegmentConnections(segments: MultiCitySegment[]): void {
  const sortedSegments = [...segments].sort((a, b) => a.sequence_order - b.sequence_order);
  
  for (let i = 1; i < sortedSegments.length; i++) {
    const prevDestination = sortedSegments[i - 1].destination_code;
    const currentOrigin = sortedSegments[i].origin_code;
    
    if (prevDestination !== currentOrigin) {
      throw new Error(`Multi-city segments must connect. Segment ${i} origin (${currentOrigin}) must match segment ${i} destination (${prevDestination})`);
    }
  }
}

// Sort segments by sequence order
export function sortSegmentsByOrder(segments: MultiCitySegment[]): MultiCitySegment[] {
  return [...segments].sort((a, b) => a.sequence_order - b.sequence_order);
}

// Get total journey duration
export function getJourneyDuration(segments: MultiCitySegment[]): number {
  if (segments.length === 0) return 0;
  
  const sortedSegments = sortSegmentsByOrder(segments);
  const startDate = new Date(sortedSegments[0].departure_date);
  const endDate = new Date(sortedSegments[sortedSegments.length - 1].departure_date);
  
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Get all unique destinations
export function getUniqueDestinations(segments: MultiCitySegment[]): string[] {
  const destinations = new Set<string>();
  
  segments.forEach(segment => {
    destinations.add(segment.origin_code);
    destinations.add(segment.destination_code);
  });
  
  return Array.from(destinations);
}

// Create segment helper
export function createMultiCitySegment(
  searchParamsId: string,
  sequenceOrder: number,
  originCode: string,
  originName: string,
  destinationCode: string,
  destinationName: string,
  departureDate: string
): CreateMultiCitySegmentInput {
  return {
    search_params_id: searchParamsId,
    sequence_order: sequenceOrder,
    origin_code: originCode,
    origin_name: originName,
    destination_code: destinationCode,
    destination_name: destinationName,
    departure_date: departureDate,
  };
}