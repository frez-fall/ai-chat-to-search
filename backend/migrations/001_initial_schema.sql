-- AI-Powered Flight Search Database Schema
-- Migration: 001_initial_schema
-- Date: 2025-09-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Destination recommendations table
CREATE TABLE destination_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Seed destination recommendations
INSERT INTO destination_recommendations (category, category_display_name, name, iata_code, description, display_order, is_active) VALUES
('island-vibes', 'Island vibes', 'Fiji', 'NAN', 'Tropical paradise with crystal clear waters and friendly locals', 1, true),
('island-vibes', 'Island vibes', 'Bali', 'DPS', 'Indonesian island known for temples, beaches, and yoga retreats', 2, true),
('island-vibes', 'Island vibes', 'Maldives', 'MLE', 'Luxury overwater bungalows and pristine coral reefs', 3, true),
('mountain-views', 'Mountain views', 'Queenstown', 'ZQN', 'Adventure capital with stunning Southern Alps scenery', 1, true),
('mountain-views', 'Mountain views', 'Banff', 'YYC', 'Canadian Rockies with world-class skiing and hiking', 2, true),
('mountain-views', 'Mountain views', 'Nepal', 'KTM', 'Home to Mount Everest and incredible trekking opportunities', 3, true),
('snowy-adventures', 'Snowy adventures', 'Japan', 'NRT', 'World-famous powder snow and hot springs', 1, true),
('snowy-adventures', 'Snowy adventures', 'Switzerland', 'ZUR', 'Alpine skiing and charming mountain villages', 2, true),
('snowy-adventures', 'Snowy adventures', 'Canada', 'YVR', 'Whistler skiing and winter sports paradise', 3, true),
('city-escapes', 'City escapes', 'Tokyo', 'NRT', 'Modern metropolis blending tradition with innovation', 1, true),
('city-escapes', 'City escapes', 'New York', 'JFK', 'The city that never sleeps with world-class culture', 2, true),
('city-escapes', 'City escapes', 'London', 'LHR', 'Historic capital with museums, theaters, and pubs', 3, true),
('wine-tours', 'Wine tours', 'France', 'CDG', 'Bordeaux and Champagne regions with vineyard tours', 1, true),
('wine-tours', 'Wine tours', 'Italy', 'FCO', 'Tuscany and Chianti wine country experiences', 2, true),
('wine-tours', 'Wine tours', 'Australia', 'ADL', 'Barossa Valley and world-renowned wineries', 3, true);