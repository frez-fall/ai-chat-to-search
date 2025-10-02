# Data Model: AI-Powered Natural Language Flight Search

**Date**: 2025-09-09  
**Status**: Complete  
**Phase**: 1 - Design & Contracts

## Entity Definitions

### Chat Conversation

Represents a complete interaction session between user and AI assistant for flight search.

**Fields**:
- `id`: UUID - Unique conversation identifier
- `user_id`: String - Anonymous user identifier (session-based)
- `status`: Enum - 'active', 'completed', 'abandoned'
- `current_step`: Enum - 'initial', 'collecting', 'confirming', 'complete'
- `messages`: Message[] - Array of conversation messages
- `search_params`: SearchParameters - Extracted flight search data
- `generated_url`: String? - Final booking system URL (if completed)
- `created_at`: DateTime - Conversation start timestamp
- `updated_at`: DateTime - Last activity timestamp
- `completed_at`: DateTime? - Search completion timestamp

**Relationships**:
- One-to-many with Message entities
- One-to-one with SearchParameters

**Validation Rules**:
- `user_id` must be non-empty string
- `status` must be valid enum value
- `messages` array must contain at least one message
- `generated_url` required when status = 'completed'

**State Transitions**:
```
initial → collecting → confirming → complete
     ↓         ↓           ↓
  abandoned  abandoned  abandoned
```

### Search Parameters

Contains structured flight search criteria extracted from conversation.

**Fields**:
- `conversation_id`: UUID - Reference to parent conversation
- `origin_code`: String? - Departure IATA airport code
- `origin_name`: String? - Human-readable departure location
- `destination_code`: String? - Arrival IATA airport code  
- `destination_name`: String? - Human-readable arrival location
- `departure_date`: Date? - Departure date (YYYY-MM-DD)
- `return_date`: Date? - Return date for round-trip (YYYY-MM-DD)
- `trip_type`: Enum - 'return', 'oneway', 'multicity'
- `adults`: Integer - Adult passenger count (default: 1)
- `children`: Integer - Child passenger count 2-11 years (default: 0)
- `infants`: Integer - Infant passenger count <2 years (default: 0)
- `cabin_class`: Enum - 'Y', 'S', 'C', 'F' (Economy, Premium, Business, First)
- `multi_city_segments`: MultiCitySegment[]? - For multi-city trips
- `is_complete`: Boolean - All required fields populated

**Relationships**:
- Belongs to one Conversation
- One-to-many with MultiCitySegment (if applicable)

**Validation Rules**:
- `origin_code` and `destination_code` must be 3-letter format (validated by OpenAI during conversation)
- `departure_date` must be >= 14 days from current date
- `return_date` must be > `departure_date` (if provided)
- `adults` must be >= 1, <= 9
- `children` must be >= 0, <= 8
- `infants` must be >= 0, <= 8, and <= `adults` count
- `cabin_class` must be valid IATA code (Y/S/C/F)
- At least one passenger (`adults`) required

### Multi-City Segment

Represents individual flight segments for multi-city trips.

**Fields**:
- `id`: UUID - Unique segment identifier
- `search_params_id`: UUID - Reference to parent search parameters
- `sequence_order`: Integer - Segment order (1, 2, 3...)
- `origin_code`: String - Segment departure IATA code
- `origin_name`: String - Human-readable departure location
- `destination_code`: String - Segment arrival IATA code
- `destination_name`: String - Human-readable arrival location
- `departure_date`: Date - Segment departure date

**Relationships**:
- Belongs to SearchParameters

**Validation Rules**:
- `sequence_order` must be > 0 and sequential
- IATA codes validated by OpenAI during conversation
- `departure_date` validation with logical sequence

### Message

Individual chat messages within a conversation.

**Fields**:
- `id`: UUID - Unique message identifier
- `conversation_id`: UUID - Reference to parent conversation
- `role`: Enum - 'user', 'assistant', 'system'
- `content`: Text - Message text content
- `timestamp`: DateTime - Message creation time
- `metadata`: JSON? - Additional message data (function calls, parameters)

**Relationships**:
- Belongs to one Conversation

**Validation Rules**:
- `role` must be valid enum value
- `content` must be non-empty for user/assistant messages
- `timestamp` must be chronologically ordered within conversation

### Destination Recommendation

Pre-configured destination suggestions for guided discovery flow.

**Fields**:
- `id`: UUID - Unique recommendation identifier
- `category`: String - Recommendation category (e.g., 'island-vibes', 'mountain-views')
- `category_display_name`: String - Human-readable category name
- `name`: String - Destination name
- `iata_code`: String - Primary airport IATA code
- `description`: Text - Marketing description
- `image_url`: String? - Destination image URL
- `display_order`: Integer - Ordering within category
- `is_active`: Boolean - Available for recommendations

**Relationships**:
- Independent entity (no direct relationships)

**Validation Rules**:
- `iata_code` must be 3-letter format
- `category` must match predefined category list
- `display_order` must be > 0

## Database Schema (PostgreSQL)

```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  current_step VARCHAR(20) NOT NULL CHECK (current_step IN ('initial', 'collecting', 'confirming', 'complete')),
  generated_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Search parameters table
CREATE TABLE search_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  origin_code VARCHAR(3),
  origin_name VARCHAR(255),
  destination_code VARCHAR(3),
  destination_name VARCHAR(255),
  departure_date DATE,
  return_date DATE,
  trip_type VARCHAR(20) NOT NULL DEFAULT 'return' CHECK (trip_type IN ('return', 'oneway', 'multicity')),
  adults INTEGER NOT NULL DEFAULT 1 CHECK (adults >= 1 AND adults <= 9),
  children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0 AND children <= 8),
  infants INTEGER NOT NULL DEFAULT 0 CHECK (infants >= 0 AND infants <= 8),
  cabin_class VARCHAR(1) CHECK (cabin_class IN ('Y', 'S', 'C', 'F')),
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT valid_passenger_count CHECK (infants <= adults),
  CONSTRAINT valid_return_date CHECK (return_date IS NULL OR return_date > departure_date),
  CONSTRAINT valid_departure_date CHECK (departure_date IS NULL OR departure_date >= CURRENT_DATE + INTERVAL '14 days')
);

-- Multi-city segments table
CREATE TABLE multi_city_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_params_id UUID NOT NULL REFERENCES search_parameters(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
  origin_code VARCHAR(3) NOT NULL,
  origin_name VARCHAR(255) NOT NULL,
  destination_code VARCHAR(3) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  departure_date DATE NOT NULL,
  UNIQUE (search_params_id, sequence_order)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Destination recommendations table
CREATE TABLE destination_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  category_display_name VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  iata_code VARCHAR(3) NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_search_parameters_conversation_id ON search_parameters(conversation_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_destination_recommendations_category ON destination_recommendations(category);
CREATE INDEX idx_multi_city_segments_search_params ON multi_city_segments(search_params_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## TypeScript Interfaces

```typescript
// Core entity types
export interface Conversation {
  id: string;
  user_id: string;
  status: 'active' | 'completed' | 'abandoned';
  current_step: 'initial' | 'collecting' | 'confirming' | 'complete';
  messages: Message[];
  search_params?: SearchParameters;
  generated_url?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SearchParameters {
  id?: string;
  conversation_id: string;
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
  multi_city_segments?: MultiCitySegment[];
  is_complete: boolean;
}

export interface MultiCitySegment {
  id?: string;
  search_params_id: string;
  sequence_order: number;
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  departure_date: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DestinationRecommendation {
  id: string;
  category: string;
  category_display_name: string;
  name: string;
  iata_code: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
}

// Validation schemas using Zod
export const SearchParametersSchema = z.object({
  origin_code: z.string().regex(/^[A-Z]{3}$/).optional(),
  destination_code: z.string().regex(/^[A-Z]{3}$/).optional(),
  departure_date: z.string().refine(date => {
    const departure = new Date(date);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 14);
    return departure >= minDate;
  }, "Departure date must be at least 14 days from today").optional(),
  return_date: z.string().optional(),
  adults: z.number().min(1).max(9),
  children: z.number().min(0).max(8),
  infants: z.number().min(0).max(8),
  cabin_class: z.enum(['Y', 'S', 'C', 'F']).optional(),
  trip_type: z.enum(['return', 'oneway', 'multicity'])
}).refine(data => data.infants <= data.adults, {
  message: "Number of infants cannot exceed number of adults"
});
```

## Data Relationships Diagram

```
Conversation (1) ←→ (1) SearchParameters
     ↓                        ↓
Message (*) ←→ (1)    MultiCitySegment (*)

DestinationRecommendation (independent)
```

## Migration Strategy

### Phase 1: Core Tables
1. Create `conversations` table with basic fields
2. Create `messages` table for chat history
3. Create `search_parameters` table for flight data

### Phase 2: Advanced Features  
4. Create `multi_city_segments` table for complex trips
5. Create `destination_recommendations` table for guided flow
6. Add indexes and constraints for performance

### Phase 3: Optimization
7. Add database triggers for automatic timestamp updates
8. Implement archival strategy for old conversations
9. Add analytics tracking fields if needed

This data model supports all functional requirements while maintaining data integrity and performance for the expected scale of 1000+ daily conversations.