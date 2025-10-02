/**
 * Contract Test: POST /api/chat/{id}/generate-url
 * 
 * This test MUST FAIL initially to follow TDD principles.
 * It validates the API contract for generating flight search URLs.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('POST /api/chat/{id}/generate-url', () => {
  const testConversationId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeAll(() => {
    // Setup test data
  });

  afterAll(() => {
    // Cleanup after tests
  });

  it('should generate URL for complete search parameters', async () => {
    // This will fail until endpoint is implemented
    const response = await fetch(`http://localhost:3000/api/chat/${testConversationId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Contract assertions
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('search_url');
    expect(data).toHaveProperty('search_params');
    expect(data).toHaveProperty('is_complete', true);
    
    // Validate URL format for Paylater booking system
    expect(data.search_url).toContain('https://app.paylatertravel.com.au/flightssearch/s/');
    
    // URL should contain IATA codes
    expect(data.search_url).toMatch(/[A-Z]{3}\/[A-Z]{3}/);
    
    // URL should contain required parameters
    expect(data.search_url).toContain('adults=');
    expect(data.search_url).toContain('children=');
    expect(data.search_url).toContain('infants=');
    expect(data.search_url).toContain('cabinClass=');
    
    // Validate search_params structure
    expect(data.search_params).toHaveProperty('origin_code');
    expect(data.search_params).toHaveProperty('destination_code');
    expect(data.search_params).toHaveProperty('departure_date');
    expect(data.search_params).toHaveProperty('adults');
    expect(data.search_params).toHaveProperty('trip_type');
  });

  it('should return 400 for incomplete search parameters', async () => {
    const incompleteConversationId = '456e7890-e89b-12d3-a456-426614174001';
    
    const response = await fetch(`http://localhost:3000/api/chat/${incompleteConversationId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('missing_fields');
    expect(data).toHaveProperty('completion_percentage');
    
    // Validate missing_fields is an array
    expect(Array.isArray(data.missing_fields)).toBe(true);
    
    // Validate completion_percentage is a number
    expect(typeof data.completion_percentage).toBe('number');
    expect(data.completion_percentage).toBeGreaterThanOrEqual(0);
    expect(data.completion_percentage).toBeLessThanOrEqual(100);
  });

  it('should generate return trip URL correctly', async () => {
    const response = await fetch(`http://localhost:3000/api/chat/${testConversationId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    if (data.search_params.trip_type === 'return') {
      // Return trip should have both departure and return dates in URL
      expect(data.search_url).toMatch(/\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}\?/);
      expect(data.search_params).toHaveProperty('return_date');
    }
  });

  it('should generate one-way trip URL correctly', async () => {
    const onewayConversationId = '789e0123-e89b-12d3-a456-426614174002';
    
    const response = await fetch(`http://localhost:3000/api/chat/${onewayConversationId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    if (data.search_params.trip_type === 'oneway') {
      // One-way should have only departure date in URL
      expect(data.search_url).toMatch(/\/\d{4}-\d{2}-\d{2}\?/);
      expect(data.search_url).not.toMatch(/\/\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}\?/);
    }
  });

  it('should generate multi-city URL correctly', async () => {
    const multicityConversationId = 'abc1234-e89b-12d3-a456-426614174003';
    
    const response = await fetch(`http://localhost:3000/api/chat/${multicityConversationId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    if (data.search_params.trip_type === 'multicity') {
      // Multi-city should have encoded JSON array in URL
      expect(data.search_url).toContain('%5B'); // Encoded [
      expect(data.search_url).toContain('%5D'); // Encoded ]
      expect(data.search_url).toContain('tripType=multi-city');
      expect(data.search_params).toHaveProperty('multi_city_segments');
      expect(Array.isArray(data.search_params.multi_city_segments)).toBe(true);
    }
  });

  it('should return 404 for non-existent conversation', async () => {
    const nonExistentId = '999e9999-e99b-99d9-a999-999999999999';
    
    const response = await fetch(`http://localhost:3000/api/chat/${nonExistentId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should validate IATA codes in generated URL', async () => {
    const response = await fetch(`http://localhost:3000/api/chat/${testConversationId}/generate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Extract IATA codes from URL
    const urlMatch = data.search_url.match(/\/([A-Z]{3})\/([A-Z]{3})\//);
    if (urlMatch) {
      const [, origin, destination] = urlMatch;
      expect(origin).toMatch(/^[A-Z]{3}$/);
      expect(destination).toMatch(/^[A-Z]{3}$/);
      expect(origin).not.toBe(destination); // Should be different airports
    }
  });
});