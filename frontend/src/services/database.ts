/**
 * Database Service
 * Supabase client and database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  Conversation, 
  CreateConversationInput, 
  UpdateConversationInput 
} from '@/models/conversation';
import type { 
  SearchParameters, 
  CreateSearchParametersInput, 
  UpdateSearchParametersInput 
} from '@/models/search-parameters';
import type { 
  Message, 
  CreateMessageInput 
} from '@/models/message';
import type { 
  MultiCitySegment, 
  CreateMultiCitySegmentInput 
} from '@/models/multi-city-segment';
import type { 
  DestinationRecommendation, 
  DestinationQuery,
  GroupedDestinations 
} from '@/models/destination-recommendation';

// Database types (matches our schema)
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          status: 'active' | 'completed' | 'abandoned';
          current_step: 'initial' | 'collecting' | 'confirming' | 'complete';
          generated_url: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'active' | 'completed' | 'abandoned';
          current_step?: 'initial' | 'collecting' | 'confirming' | 'complete';
          generated_url?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'active' | 'completed' | 'abandoned';
          current_step?: 'initial' | 'collecting' | 'confirming' | 'complete';
          generated_url?: string | null;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      search_parameters: {
        Row: {
          id: string;
          conversation_id: string;
          origin_code: string | null;
          origin_name: string | null;
          destination_code: string | null;
          destination_name: string | null;
          departure_date: string | null;
          return_date: string | null;
          trip_type: 'return' | 'oneway' | 'multicity';
          adults: number;
          children: number;
          infants: number;
          cabin_class: 'Y' | 'S' | 'C' | 'F' | null;
          is_complete: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          timestamp: string;
          metadata: any | null;
        };
      };
      multi_city_segments: {
        Row: {
          id: string;
          search_params_id: string;
          sequence_order: number;
          origin_code: string;
          origin_name: string;
          destination_code: string;
          destination_name: string;
          departure_date: string;
        };
      };
      destination_recommendations: {
        Row: {
          id: string;
          category: string;
          category_display_name: string;
          name: string;
          iata_code: string;
          description: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
        };
      };
    };
  };
}

class DatabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

    // During build time, we allow placeholder values
    if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey)) {
      console.error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details?: string }> {
    try {
      const { error } = await this.supabase.from('conversations').select('id').limit(1);
      if (error) {
        return { status: 'error', details: error.message };
      }
      return { status: 'connected' };
    } catch (error) {
      return { status: 'error', details: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Conversation operations
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        user_id: input.user_id,
        status: 'active',
        current_step: 'initial',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        search_parameters (*,
          multi_city_segments (*)
        ),
        messages (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return data as any; // Type assertion needed due to join
  }

  async updateConversation(id: string, input: UpdateConversationInput): Promise<Conversation> {
    const updateData: any = { ...input };
    if (input.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    return data as Conversation;
  }

  // Message operations
  async createMessage(input: CreateMessageInput): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }

    return data as Message;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    return data as Message[];
  }

  // Search parameters operations
  async createSearchParameters(input: CreateSearchParametersInput): Promise<SearchParameters> {
    const { data, error } = await this.supabase
      .from('search_parameters')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create search parameters: ${error.message}`);
    }

    return data as SearchParameters;
  }

  async getSearchParameters(conversationId: string): Promise<SearchParameters | null> {
    const { data, error } = await this.supabase
      .from('search_parameters')
      .select(`
        *,
        multi_city_segments (*)
      `)
      .eq('conversation_id', conversationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get search parameters: ${error.message}`);
    }

    return data as any; // Type assertion needed due to join
  }

  async updateSearchParameters(conversationId: string, input: UpdateSearchParametersInput): Promise<SearchParameters> {
    const { data, error } = await this.supabase
      .from('search_parameters')
      .update(input)
      .eq('conversation_id', conversationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update search parameters: ${error.message}`);
    }

    return data as SearchParameters;
  }

  // Multi-city segments operations
  async createMultiCitySegments(segments: CreateMultiCitySegmentInput[]): Promise<MultiCitySegment[]> {
    const { data, error } = await this.supabase
      .from('multi_city_segments')
      .insert(segments)
      .select();

    if (error) {
      throw new Error(`Failed to create multi-city segments: ${error.message}`);
    }

    return data as MultiCitySegment[];
  }

  async deleteMultiCitySegments(searchParamsId: string): Promise<void> {
    const { error } = await this.supabase
      .from('multi_city_segments')
      .delete()
      .eq('search_params_id', searchParamsId);

    if (error) {
      throw new Error(`Failed to delete multi-city segments: ${error.message}`);
    }
  }

  // Destination recommendations operations
  async getDestinationRecommendations(query?: DestinationQuery): Promise<GroupedDestinations> {
    let supabaseQuery = this.supabase
      .from('destination_recommendations')
      .select('*');

    if (query?.category) {
      supabaseQuery = supabaseQuery.eq('category', query.category);
    }

    if (query?.active_only !== false) {
      supabaseQuery = supabaseQuery.eq('is_active', true);
    }

    supabaseQuery = supabaseQuery.order('category').order('display_order');

    if (query?.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      throw new Error(`Failed to get destination recommendations: ${error.message}`);
    }

    // Group by category
    const grouped = new Map<string, DestinationRecommendation[]>();
    
    (data as DestinationRecommendation[]).forEach(dest => {
      if (!grouped.has(dest.category)) {
        grouped.set(dest.category, []);
      }
      grouped.get(dest.category)!.push(dest);
    });

    const categories = Array.from(grouped.entries()).map(([category, destinations]) => ({
      category: category as any,
      display_name: destinations[0]?.category_display_name || category,
      destinations: destinations,
    }));

    return { categories };
  }

  // Utility method to execute raw SQL (for migrations, etc.)
  async executeRawQuery(query: string): Promise<any> {
    const { data, error } = await this.supabase.rpc('execute_sql', { query });

    if (error) {
      throw new Error(`Failed to execute query: ${error.message}`);
    }

    return data;
  }
}

// Singleton instance
export const db = new DatabaseService();
export default db;