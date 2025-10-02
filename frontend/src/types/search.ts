export interface SearchParameters {
  origin_code?: string;
  origin_name?: string;
  destination_code?: string;
  destination_name?: string;
  departure_date?: string;
  return_date?: string;
  trip_type: 'return' | 'oneway' | 'multicity';
  adults: number;
  children: number;
  infants: number;
  cabin_class?: 'Y' | 'S' | 'C' | 'F';
  is_complete: boolean;
}

export interface MultiCitySegment {
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  departure_date: string;
  sequence_order: number;
}