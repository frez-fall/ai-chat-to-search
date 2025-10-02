/**
 * Destination Recommendation Model
 * Pre-configured destination suggestions for guided discovery flow.
 */

import { z } from 'zod';

// Valid destination categories
export const DestinationCategory = z.enum([
  'island-vibes',
  'mountain-views',
  'snowy-adventures',
  'city-escapes',
  'wine-tours',
  'none-of-these'
]);
export type DestinationCategory = z.infer<typeof DestinationCategory>;

// IATA code validation
const IATACode = z.string().regex(/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters');

// Destination recommendation schema
export const DestinationRecommendationSchema = z.object({
  id: z.string().uuid(),
  category: DestinationCategory,
  category_display_name: z.string().min(1, 'Category display name is required'),
  name: z.string().min(1, 'Destination name is required'),
  iata_code: IATACode,
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  display_order: z.number().int().min(0, 'Display order must be non-negative').default(0),
  is_active: z.boolean().default(true),
});

export type DestinationRecommendation = z.infer<typeof DestinationRecommendationSchema>;

// Input validation for creating recommendations
export const CreateDestinationRecommendationSchema = DestinationRecommendationSchema.omit({ id: true });
export type CreateDestinationRecommendationInput = z.infer<typeof CreateDestinationRecommendationSchema>;

// Input validation for updating recommendations
export const UpdateDestinationRecommendationSchema = DestinationRecommendationSchema.partial()
  .omit({ id: true });
export type UpdateDestinationRecommendationInput = z.infer<typeof UpdateDestinationRecommendationSchema>;

// Query parameters for filtering recommendations
export const DestinationQuerySchema = z.object({
  category: DestinationCategory.optional(),
  active_only: z.boolean().default(true),
  limit: z.number().int().positive().max(100).optional(),
});
export type DestinationQuery = z.infer<typeof DestinationQuerySchema>;

// Grouped destinations by category
export const GroupedDestinationsSchema = z.object({
  categories: z.array(z.object({
    category: DestinationCategory,
    display_name: z.string(),
    destinations: z.array(DestinationRecommendationSchema),
  })),
});
export type GroupedDestinations = z.infer<typeof GroupedDestinationsSchema>;

// Validation functions
export function validateDestinationRecommendation(data: unknown): DestinationRecommendation {
  return DestinationRecommendationSchema.parse(data);
}

export function validateCreateDestinationRecommendationInput(data: unknown): CreateDestinationRecommendationInput {
  return CreateDestinationRecommendationSchema.parse(data);
}

export function validateUpdateDestinationRecommendationInput(data: unknown): UpdateDestinationRecommendationInput {
  return UpdateDestinationRecommendationSchema.parse(data);
}

export function validateDestinationQuery(data: unknown): DestinationQuery {
  return DestinationQuerySchema.parse(data);
}

export function validateDestinationCategory(category: string): DestinationCategory {
  return DestinationCategory.parse(category);
}

// Helper functions
export function isValidCategory(category: string): boolean {
  try {
    DestinationCategory.parse(category);
    return true;
  } catch {
    return false;
  }
}

export function getCategoryDisplayName(category: DestinationCategory): string {
  const displayNames: Record<DestinationCategory, string> = {
    'island-vibes': 'Island vibes',
    'mountain-views': 'Mountain views',
    'snowy-adventures': 'Snowy adventures',
    'city-escapes': 'City escapes',
    'wine-tours': 'Wine tours',
    'none-of-these': 'None of these',
  };
  
  return displayNames[category];
}

export function getAllCategories(): DestinationCategory[] {
  return ['island-vibes', 'mountain-views', 'snowy-adventures', 'city-escapes', 'wine-tours'];
}

export function getAllCategoriesWithDisplayNames(): Array<{ category: DestinationCategory; display_name: string }> {
  return getAllCategories().map(category => ({
    category,
    display_name: getCategoryDisplayName(category),
  }));
}

// Sort destinations by display order
export function sortDestinationsByOrder(destinations: DestinationRecommendation[]): DestinationRecommendation[] {
  return [...destinations].sort((a, b) => a.display_order - b.display_order);
}

// Filter active destinations only
export function filterActiveDestinations(destinations: DestinationRecommendation[]): DestinationRecommendation[] {
  return destinations.filter(dest => dest.is_active);
}

// Group destinations by category
export function groupDestinationsByCategory(destinations: DestinationRecommendation[]): GroupedDestinations {
  const grouped = new Map<DestinationCategory, DestinationRecommendation[]>();
  
  // Initialize all categories
  getAllCategories().forEach(category => {
    grouped.set(category, []);
  });
  
  // Group destinations
  destinations.forEach(dest => {
    const categoryDests = grouped.get(dest.category) || [];
    categoryDests.push(dest);
    grouped.set(dest.category, categoryDests);
  });
  
  // Convert to array format with display names
  const categories = Array.from(grouped.entries())
    .filter(([, dests]) => dests.length > 0) // Only include categories with destinations
    .map(([category, dests]) => ({
      category,
      display_name: getCategoryDisplayName(category),
      destinations: sortDestinationsByOrder(dests),
    }));
  
  return { categories };
}

// Create destination helper
export function createDestinationRecommendation(
  category: DestinationCategory,
  name: string,
  iataCode: string,
  description?: string,
  imageUrl?: string,
  displayOrder?: number
): CreateDestinationRecommendationInput {
  return {
    category,
    category_display_name: getCategoryDisplayName(category),
    name,
    iata_code: iataCode,
    description,
    image_url: imageUrl,
    display_order: displayOrder ?? 0,
    is_active: true,
  };
}

// Find destination by IATA code
export function findDestinationByIataCode(
  destinations: DestinationRecommendation[],
  iataCode: string
): DestinationRecommendation | undefined {
  return destinations.find(dest => dest.iata_code === iataCode.toUpperCase());
}

// Get destinations by category
export function getDestinationsByCategory(
  destinations: DestinationRecommendation[],
  category: DestinationCategory
): DestinationRecommendation[] {
  return destinations
    .filter(dest => dest.category === category)
    .filter(dest => dest.is_active)
    .sort((a, b) => a.display_order - b.display_order);
}