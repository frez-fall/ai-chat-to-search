/**
 * Message Model
 * Individual chat messages within a conversation.
 */

import { z } from 'zod';

// Message role enum
export const MessageRole = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRole>;

// Message metadata schema (flexible JSON structure)
export const MessageMetadataSchema = z.record(z.any()).optional();
export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;

// Main message schema
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: MessageRole,
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.string().datetime(),
  metadata: MessageMetadataSchema,
});

export type Message = z.infer<typeof MessageSchema>;

// Input validation for creating messages
export const CreateMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  role: MessageRole,
  content: z.string().min(1, 'Message content cannot be empty'),
  metadata: MessageMetadataSchema,
});

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;

// Input validation for user messages (from API)
export const UserMessageInputSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  context: z.object({
    user_location: z.string().optional(),
  }).optional(),
});

export type UserMessageInput = z.infer<typeof UserMessageInputSchema>;

// Validation functions
export function validateMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

export function validateCreateMessageInput(data: unknown): CreateMessageInput {
  return CreateMessageSchema.parse(data);
}

export function validateUserMessageInput(data: unknown): UserMessageInput {
  return UserMessageInputSchema.parse(data);
}

// Helper functions
export function isUserMessage(message: Message): boolean {
  return message.role === 'user';
}

export function isAssistantMessage(message: Message): boolean {
  return message.role === 'assistant';
}

export function isSystemMessage(message: Message): boolean {
  return message.role === 'system';
}

// Create message helpers
export function createUserMessage(
  conversationId: string,
  content: string,
  metadata?: MessageMetadata
): Omit<CreateMessageInput, 'id' | 'timestamp'> {
  return {
    conversation_id: conversationId,
    role: 'user',
    content,
    metadata,
  };
}

export function createAssistantMessage(
  conversationId: string,
  content: string,
  metadata?: MessageMetadata
): Omit<CreateMessageInput, 'id' | 'timestamp'> {
  return {
    conversation_id: conversationId,
    role: 'assistant',
    content,
    metadata,
  };
}

export function createSystemMessage(
  conversationId: string,
  content: string,
  metadata?: MessageMetadata
): Omit<CreateMessageInput, 'id' | 'timestamp'> {
  return {
    conversation_id: conversationId,
    role: 'system',
    content,
    metadata,
  };
}

// Sort messages chronologically
export function sortMessagesByTimestamp(messages: Message[]): Message[] {
  return messages.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// Filter messages by role
export function filterMessagesByRole(messages: Message[], role: MessageRole): Message[] {
  return messages.filter(message => message.role === role);
}