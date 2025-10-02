export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: any;
  isStreaming?: boolean;
}

export interface ConversationResponse {
  conversation_id: string;
  user_id: string;
  initial_message: string;
  ai_response?: {
    content: string;
    extracted_params?: any;
    requires_clarification?: boolean;
  };
}

export interface ChatResponse {
  ai_response: {
    content: string;
    extracted_params?: any;
    requires_clarification?: boolean;
  };
  search_parameters?: any;
  generated_url?: string;
}