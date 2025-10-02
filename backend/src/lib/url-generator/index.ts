/**
 * URL Generator Library
 * Converts search parameters to Paylater booking system URLs
 */

import type { SearchParameters } from '../../models/search-parameters.js';
import type { MultiCitySegment } from '../../models/multi-city-segment.js';

// URL configuration
export interface URLConfig {
  baseUrl: string;
  defaultCurrency?: string;
  defaultMarket?: string;
  affiliateId?: string;
}

const DEFAULT_CONFIG: URLConfig = {
  baseUrl: 'https://www.paylaterflights.com',
  defaultCurrency: 'USD',
  defaultMarket: 'US',
};

// URL parameter mapping
export interface URLParameters {
  // Common parameters
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  trip_type: 'R' | 'O' | 'M'; // Return, One-way, Multi-city
  adults: number;
  children: number;
  infants: number;
  cabin_class: 'Y' | 'S' | 'C' | 'F';
  
  // Multi-city specific
  multi_city_segments?: Array<{
    origin: string;
    destination: string;
    date: string;
  }>;
  
  // Optional parameters
  currency?: string;
  market?: string;
  affiliate_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export class URLGenerator {
  private config: URLConfig;

  constructor(config?: Partial<URLConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Generate booking URL from search parameters
  generateBookingURL(params: SearchParameters, options?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }): string {
    if (!this.validateParameters(params)) {
      throw new Error('Invalid search parameters for URL generation');
    }

    const tripType = this.mapTripType(params.trip_type || 'return');
    
    // Route to appropriate URL builder
    switch (params.trip_type) {
      case 'multicity':
        return this.generateMultiCityURL(params, options);
      case 'oneway':
        return this.generateOneWayURL(params, options);
      case 'return':
      default:
        return this.generateReturnURL(params, options);
    }
  }

  // Generate return trip URL
  private generateReturnURL(params: SearchParameters, options?: any): string {
    const baseUrl = `${this.config.baseUrl}/flights`;
    const urlParams = new URLSearchParams();

    // Required parameters
    urlParams.append('from', params.origin_code || '');
    urlParams.append('to', params.destination_code || '');
    urlParams.append('depart', this.formatDate(params.departure_date || ''));
    urlParams.append('return', this.formatDate(params.return_date || ''));
    urlParams.append('type', 'R'); // Return trip
    
    // Passenger counts
    urlParams.append('adults', String(params.adults || 1));
    if (params.children && params.children > 0) {
      urlParams.append('children', String(params.children));
    }
    if (params.infants && params.infants > 0) {
      urlParams.append('infants', String(params.infants));
    }
    
    // Cabin class
    urlParams.append('class', params.cabin_class || 'Y');
    
    // Optional parameters
    this.appendOptionalParams(urlParams, options);
    
    return `${baseUrl}?${urlParams.toString()}`;
  }

  // Generate one-way trip URL
  private generateOneWayURL(params: SearchParameters, options?: any): string {
    const baseUrl = `${this.config.baseUrl}/flights`;
    const urlParams = new URLSearchParams();

    // Required parameters
    urlParams.append('from', params.origin_code || '');
    urlParams.append('to', params.destination_code || '');
    urlParams.append('depart', this.formatDate(params.departure_date || ''));
    urlParams.append('type', 'O'); // One-way trip
    
    // Passenger counts
    urlParams.append('adults', String(params.adults || 1));
    if (params.children && params.children > 0) {
      urlParams.append('children', String(params.children));
    }
    if (params.infants && params.infants > 0) {
      urlParams.append('infants', String(params.infants));
    }
    
    // Cabin class
    urlParams.append('class', params.cabin_class || 'Y');
    
    // Optional parameters
    this.appendOptionalParams(urlParams, options);
    
    return `${baseUrl}?${urlParams.toString()}`;
  }

  // Generate multi-city trip URL
  private generateMultiCityURL(params: SearchParameters, options?: any): string {
    const baseUrl = `${this.config.baseUrl}/flights/multi-city`;
    const urlParams = new URLSearchParams();

    // Check for multi-city segments
    if (!params.multi_city_segments || params.multi_city_segments.length < 2) {
      throw new Error('Multi-city trip requires at least 2 segments');
    }

    // Sort segments by sequence order
    const sortedSegments = [...params.multi_city_segments].sort(
      (a, b) => a.sequence_order - b.sequence_order
    );

    // Add each segment
    sortedSegments.forEach((segment, index) => {
      const segmentNum = index + 1;
      urlParams.append(`from${segmentNum}`, segment.origin_code);
      urlParams.append(`to${segmentNum}`, segment.destination_code);
      urlParams.append(`date${segmentNum}`, this.formatDate(segment.departure_date));
    });

    // Trip type
    urlParams.append('type', 'M'); // Multi-city
    urlParams.append('segments', String(sortedSegments.length));
    
    // Passenger counts
    urlParams.append('adults', String(params.adults || 1));
    if (params.children && params.children > 0) {
      urlParams.append('children', String(params.children));
    }
    if (params.infants && params.infants > 0) {
      urlParams.append('infants', String(params.infants));
    }
    
    // Cabin class
    urlParams.append('class', params.cabin_class || 'Y');
    
    // Optional parameters
    this.appendOptionalParams(urlParams, options);
    
    return `${baseUrl}?${urlParams.toString()}`;
  }

  // Generate shareable URL (shortened version)
  generateShareableURL(params: SearchParameters): string {
    const fullUrl = this.generateBookingURL(params);
    
    // Create a simplified version for sharing
    const baseUrl = `${this.config.baseUrl}/s`;
    const shareParams = new URLSearchParams();
    
    // Encode essential parameters only
    const essential = {
      o: params.origin_code,
      d: params.destination_code,
      dep: this.formatDateShort(params.departure_date || ''),
      ret: params.return_date ? this.formatDateShort(params.return_date) : undefined,
      t: this.mapTripTypeShort(params.trip_type || 'return'),
      a: params.adults || 1,
      c: params.children || 0,
      i: params.infants || 0,
      cl: params.cabin_class || 'Y',
    };
    
    // Remove undefined values and encode
    Object.entries(essential).forEach(([key, value]) => {
      if (value !== undefined) {
        shareParams.append(key, String(value));
      }
    });
    
    return `${baseUrl}?${shareParams.toString()}`;
  }

  // Validate parameters before URL generation
  private validateParameters(params: SearchParameters): boolean {
    // Check required fields based on trip type
    if (!params.origin_code || !params.destination_code || !params.departure_date) {
      return false;
    }

    // Validate return date for round trips
    if (params.trip_type === 'return' && !params.return_date) {
      return false;
    }

    // Validate multi-city segments
    if (params.trip_type === 'multicity') {
      if (!params.multi_city_segments || params.multi_city_segments.length < 2) {
        return false;
      }
    }

    // Validate passenger counts
    const adults = params.adults || 1;
    const infants = params.infants || 0;
    if (adults < 1 || adults > 9) return false;
    if (infants > adults) return false;

    return true;
  }

  // Format date for URL (YYYY-MM-DD to DDMMYYYY)
  private formatDate(date: string): string {
    if (!date) return '';
    
    // Parse YYYY-MM-DD format
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    
    // Return as DDMMYYYY for Paylater format
    return `${day}${month}${year}`;
  }

  // Format date for shareable URL (YYYY-MM-DD to YYMMDD)
  private formatDateShort(date: string): string {
    if (!date) return '';
    
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return date;
    
    // Return as YYMMDD for shorter URLs
    return `${year.slice(2)}${month}${day}`;
  }

  // Map trip type to URL parameter
  private mapTripType(tripType: string): 'R' | 'O' | 'M' {
    switch (tripType) {
      case 'return':
        return 'R';
      case 'oneway':
        return 'O';
      case 'multicity':
        return 'M';
      default:
        return 'R';
    }
  }

  // Map trip type to short form
  private mapTripTypeShort(tripType: string): string {
    switch (tripType) {
      case 'return':
        return 'r';
      case 'oneway':
        return 'o';
      case 'multicity':
        return 'm';
      default:
        return 'r';
    }
  }

  // Append optional parameters
  private appendOptionalParams(urlParams: URLSearchParams, options?: any): void {
    // Add currency and market
    if (this.config.defaultCurrency) {
      urlParams.append('currency', this.config.defaultCurrency);
    }
    if (this.config.defaultMarket) {
      urlParams.append('market', this.config.defaultMarket);
    }
    
    // Add affiliate ID if configured
    if (this.config.affiliateId) {
      urlParams.append('aid', this.config.affiliateId);
    }
    
    // Add UTM parameters if provided
    if (options?.utm_source) {
      urlParams.append('utm_source', options.utm_source);
    }
    if (options?.utm_medium) {
      urlParams.append('utm_medium', options.utm_medium);
    }
    if (options?.utm_campaign) {
      urlParams.append('utm_campaign', options.utm_campaign);
    }
  }

  // Parse URL back to search parameters
  parseBookingURL(url: string): Partial<SearchParameters> {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // Determine trip type
      const type = params.get('type');
      let tripType: 'return' | 'oneway' | 'multicity' = 'return';
      if (type === 'O') tripType = 'oneway';
      if (type === 'M') tripType = 'multicity';
      
      // Parse common parameters
      const searchParams: Partial<SearchParameters> = {
        origin_code: params.get('from') || undefined,
        destination_code: params.get('to') || undefined,
        departure_date: this.parseDateFromURL(params.get('depart') || ''),
        trip_type: tripType,
        adults: parseInt(params.get('adults') || '1'),
        children: parseInt(params.get('children') || '0'),
        infants: parseInt(params.get('infants') || '0'),
        cabin_class: (params.get('class') || 'Y') as 'Y' | 'S' | 'C' | 'F',
      };
      
      // Parse return date if present
      if (tripType === 'return') {
        searchParams.return_date = this.parseDateFromURL(params.get('return') || '');
      }
      
      // Parse multi-city segments if present
      if (tripType === 'multicity') {
        const segmentCount = parseInt(params.get('segments') || '0');
        const segments: MultiCitySegment[] = [];
        
        for (let i = 1; i <= segmentCount; i++) {
          const origin = params.get(`from${i}`);
          const destination = params.get(`to${i}`);
          const date = params.get(`date${i}`);
          
          if (origin && destination && date) {
            segments.push({
              id: '', // Will be generated
              search_params_id: '', // Will be set
              sequence_order: i,
              origin_code: origin,
              origin_name: '', // Will be resolved
              destination_code: destination,
              destination_name: '', // Will be resolved
              departure_date: this.parseDateFromURL(date),
            });
          }
        }
        
        if (segments.length > 0) {
          searchParams.multi_city_segments = segments;
        }
      }
      
      return searchParams;
    } catch (error) {
      console.error('Error parsing booking URL:', error);
      return {};
    }
  }

  // Parse date from URL format (DDMMYYYY to YYYY-MM-DD)
  private parseDateFromURL(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) return '';
    
    const day = dateStr.slice(0, 2);
    const month = dateStr.slice(2, 4);
    const year = dateStr.slice(4, 8);
    
    return `${year}-${month}-${day}`;
  }

  // Generate deep link for mobile app
  generateDeepLink(params: SearchParameters): string {
    const baseUrl = 'paylaterflights://search';
    const urlParams = new URLSearchParams();
    
    // Add essential parameters in mobile-friendly format
    urlParams.append('from', params.origin_code || '');
    urlParams.append('to', params.destination_code || '');
    urlParams.append('date', params.departure_date || '');
    if (params.return_date) {
      urlParams.append('return', params.return_date);
    }
    urlParams.append('type', params.trip_type || 'return');
    urlParams.append('pax', `${params.adults || 1}-${params.children || 0}-${params.infants || 0}`);
    
    return `${baseUrl}?${urlParams.toString()}`;
  }
}

// Default URL generator instance
export const urlGenerator = new URLGenerator();
export default urlGenerator;