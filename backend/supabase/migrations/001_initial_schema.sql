-- Initial database schema for AI Flight Search

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    current_step VARCHAR(20) NOT NULL DEFAULT 'initial' CHECK (current_step IN ('initial', 'collecting', 'confirming', 'complete')),
    generated_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Search parameters table
CREATE TABLE IF NOT EXISTS search_parameters (
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
    is_complete BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Multi-city segments table
CREATE TABLE IF NOT EXISTS multi_city_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_params_id UUID NOT NULL REFERENCES search_parameters(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
    origin_code VARCHAR(3) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    destination_code VARCHAR(3) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    departure_date DATE NOT NULL,
    UNIQUE(search_params_id, sequence_order)
);

-- Destination recommendations table
CREATE TABLE IF NOT EXISTS destination_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('island-vibes', 'mountain-views', 'snowy-adventures', 'city-escapes', 'wine-tours', 'none-of-these')),
    category_display_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    iata_code VARCHAR(3) NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_search_parameters_conversation_id ON search_parameters(conversation_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_multi_city_segments_search_params_id ON multi_city_segments(search_params_id);
CREATE INDEX idx_destination_recommendations_category ON destination_recommendations(category);
CREATE INDEX idx_destination_recommendations_active ON destination_recommendations(is_active);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add check constraint for infant count
ALTER TABLE search_parameters ADD CONSTRAINT check_infants_not_exceed_adults 
    CHECK (infants <= adults);

-- Row Level Security (RLS) - Optional but recommended
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_city_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth strategy)
-- Example: Allow users to see their own conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (true); -- Adjust based on auth

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (true); -- Adjust based on auth

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (true); -- Adjust based on auth

-- Similar policies for other tables
CREATE POLICY "Users can view search parameters" ON search_parameters
    FOR ALL USING (true);

CREATE POLICY "Users can view messages" ON messages
    FOR ALL USING (true);

CREATE POLICY "Users can view segments" ON multi_city_segments
    FOR ALL USING (true);

CREATE POLICY "Anyone can view destinations" ON destination_recommendations
    FOR SELECT USING (is_active = true);