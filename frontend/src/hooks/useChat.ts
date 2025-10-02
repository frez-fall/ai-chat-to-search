import { ConversationResponse, ChatResponse } from '@/types/chat';

export function useChat() {
  const createConversation = async (initialQuery?: string): Promise<ConversationResponse> => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initial_query: initialQuery }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    return response.json();
  };

  const sendMessage = async (conversationId: string, message: string): Promise<ChatResponse> => {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || 'Failed to send message');
      (error as any).status = response.status;
      (error as any).details = errorData;
      throw error;
    }

    return response.json();
  };

  const streamMessage = async (
    conversationId: string,
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to stream message');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }
  };

  return {
    createConversation,
    sendMessage,
    streamMessage,
  };
}