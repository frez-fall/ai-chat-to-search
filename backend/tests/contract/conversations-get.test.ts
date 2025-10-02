/**
 * Contract Test: GET /api/conversations/{id}
 * 
 * This test MUST FAIL initially to follow TDD principles.
 * It validates the API contract for retrieving conversation details.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('GET /api/conversations/{id}', () => {
  const testConversationId = '123e4567-e89b-12d3-a456-426614174000';
  
  beforeAll(() => {
    // Setup test data
  });

  afterAll(() => {
    // Cleanup after tests
  });

  it('should retrieve complete conversation with all details', async () => {
    // This will fail until endpoint is implemented
    const response = await fetch(`http://localhost:3000/api/conversations/${testConversationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Contract assertions
    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // Validate conversation structure
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('user_id');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('current_step');
    expect(data).toHaveProperty('messages');
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('updated_at');
    
    // Validate required fields
    expect(data.id).toBe(testConversationId);
    expect(typeof data.user_id).toBe('string');
    expect(['active', 'completed', 'abandoned']).toContain(data.status);
    expect(['initial', 'collecting', 'confirming', 'complete']).toContain(data.current_step);
    
    // Validate messages array
    expect(Array.isArray(data.messages)).toBe(true);
    
    // If messages exist, validate structure
    if (data.messages.length > 0) {
      const message = data.messages[0];
      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');
      expect(['user', 'assistant', 'system']).toContain(message.role);
      expect(typeof message.content).toBe('string');
    }
    
    // Validate timestamps
    expect(new Date(data.created_at)).toBeInstanceOf(Date);
    expect(new Date(data.updated_at)).toBeInstanceOf(Date);
  });

  it('should include search parameters when available', async () => {
    const response = await fetch(`http://localhost:3000/api/conversations/${testConversationId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    // If search_params exist, validate structure
    if (data.search_params) {
      expect(data.search_params).toHaveProperty('conversation_id');
      expect(data.search_params).toHaveProperty('trip_type');
      expect(data.search_params).toHaveProperty('adults');
      expect(data.search_params).toHaveProperty('children');
      expect(data.search_params).toHaveProperty('infants');
      expect(data.search_params).toHaveProperty('is_complete');
      
      // Validate data types
      expect(['return', 'oneway', 'multicity']).toContain(data.search_params.trip_type);
      expect(typeof data.search_params.adults).toBe('number');
      expect(typeof data.search_params.children).toBe('number');
      expect(typeof data.search_params.infants).toBe('number');
      expect(typeof data.search_params.is_complete).toBe('boolean');
      
      // Validate passenger counts
      expect(data.search_params.adults).toBeGreaterThanOrEqual(1);
      expect(data.search_params.adults).toBeLessThanOrEqual(9);
      expect(data.search_params.children).toBeGreaterThanOrEqual(0);
      expect(data.search_params.children).toBeLessThanOrEqual(8);
      expect(data.search_params.infants).toBeGreaterThanOrEqual(0);
      expect(data.search_params.infants).toBeLessThanOrEqual(8);
    }
  });

  it('should include generated URL when conversation is complete', async () => {
    const completeConversationId = '456e7890-e89b-12d3-a456-426614174001';
    
    const response = await fetch(`http://localhost:3000/api/conversations/${completeConversationId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    if (data.status === 'completed') {
      expect(data).toHaveProperty('generated_url');
      expect(data).toHaveProperty('completed_at');
      expect(typeof data.generated_url).toBe('string');
      expect(data.generated_url).toContain('https://app.paylatertravel.com.au/flightssearch/s/');
      expect(new Date(data.completed_at)).toBeInstanceOf(Date);
    }
  });

  it('should return 404 for non-existent conversation', async () => {
    const nonExistentId = '999e9999-e99b-99d9-a999-999999999999';
    
    const response = await fetch(`http://localhost:3000/api/conversations/${nonExistentId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });

  it('should return 400 for invalid UUID format', async () => {
    const invalidId = 'not-a-uuid';
    
    const response = await fetch(`http://localhost:3000/api/conversations/${invalidId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid');
  });

  it('should return messages in chronological order', async () => {
    const response = await fetch(`http://localhost:3000/api/conversations/${testConversationId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    if (data.messages.length > 1) {
      for (let i = 1; i < data.messages.length; i++) {
        const prevTime = new Date(data.messages[i - 1].timestamp);
        const currentTime = new Date(data.messages[i].timestamp);
        expect(currentTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
      }
    }
  });

  it('should handle multi-city segments if present', async () => {
    const multicityConversationId = 'abc1234-e89b-12d3-a456-426614174003';
    
    const response = await fetch(`http://localhost:3000/api/conversations/${multicityConversationId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    
    if (data.search_params?.trip_type === 'multicity' && data.search_params.multi_city_segments) {
      expect(Array.isArray(data.search_params.multi_city_segments)).toBe(true);
      
      data.search_params.multi_city_segments.forEach((segment: any, index: number) => {
        expect(segment).toHaveProperty('sequence_order', index + 1);
        expect(segment).toHaveProperty('origin_code');
        expect(segment).toHaveProperty('destination_code');
        expect(segment).toHaveProperty('departure_date');
        expect(segment.origin_code).toMatch(/^[A-Z]{3}$/);
        expect(segment.destination_code).toMatch(/^[A-Z]{3}$/);
      });
    }
  });
});