/**
 * Conversation Model
 * Represents a complete interaction session between user and AI assistant for flight search.
 */

import { z } from 'zod';

// Conversation status enum
export const ConversationStatus = z.enum(['active', 'completed', 'abandoned']);
export type ConversationStatus = z.infer<typeof ConversationStatus>;

// Conversation step enum
export const ConversationStep = z.enum(['initial', 'collecting', 'confirming', 'complete']);
export type ConversationStep = z.infer<typeof ConversationStep>;

// Conversation schema
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().min(1, 'User ID is required'),
  status: ConversationStatus,
  current_step: ConversationStep,
  generated_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// Input validation for creating conversations
export const CreateConversationSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  initial_query: z.string().optional(),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

// Input validation for updating conversations
export const UpdateConversationSchema = z.object({
  status: ConversationStatus.optional(),
  current_step: ConversationStep.optional(),
  generated_url: z.string().url().optional(),
});

export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>;

// Validation functions
export function validateConversation(data: unknown): Conversation {
  return ConversationSchema.parse(data);
}

export function validateCreateConversationInput(data: unknown): CreateConversationInput {
  return CreateConversationSchema.parse(data);
}

export function validateUpdateConversationInput(data: unknown): UpdateConversationInput {
  return UpdateConversationSchema.parse(data);
}

// Helper functions
export function isConversationActive(conversation: Conversation): boolean {
  return conversation.status === 'active';
}

export function isConversationComplete(conversation: Conversation): boolean {
  return conversation.status === 'completed';
}

export function canGenerateUrl(conversation: Conversation): boolean {
  return conversation.current_step === 'confirming' || conversation.current_step === 'complete';
}