/**
 * Conversation State Store
 * Manages conversation persistence with 10-minute session timeout
 */

import type { Message } from '@/types/chat';
import type { SearchParameters } from '@/types/search';

export interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  searchParams: SearchParameters | null;
  bookingUrl: string | null;
  lastActivity: number;
  isActive: boolean;
}

const STORAGE_KEY = 'chat_conversation_state';
const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

class ConversationStore {
  private state: ConversationState | null = null;

  /**
   * Initialize and load existing conversation if valid
   */
  initialize(): ConversationState | null {
    const stored = this.loadFromStorage();
    
    if (stored && this.isSessionValid(stored)) {
      this.state = stored;
      return stored;
    }
    
    // Clear expired session
    if (stored) {
      this.clear();
    }
    
    return null;
  }

  /**
   * Save current conversation state
   */
  save(state: Partial<ConversationState>): void {
    this.state = {
      conversationId: state.conversationId ?? this.state?.conversationId ?? null,
      messages: state.messages ?? this.state?.messages ?? [],
      searchParams: state.searchParams ?? this.state?.searchParams ?? null,
      bookingUrl: state.bookingUrl ?? this.state?.bookingUrl ?? null,
      lastActivity: Date.now(),
      isActive: true
    };
    
    this.saveToStorage(this.state);
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    if (this.state) {
      this.state.lastActivity = Date.now();
      this.saveToStorage(this.state);
    }
  }

  /**
   * Get current state
   */
  getState(): ConversationState | null {
    if (this.state && this.isSessionValid(this.state)) {
      return this.state;
    }
    return null;
  }

  /**
   * Clear conversation state
   */
  clear(): void {
    this.state = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Clear conversation if it matches the given ID
   * Used to clear stale/invalid conversations
   */
  clearIfMatches(conversationId: string): void {
    if (this.state?.conversationId === conversationId) {
      this.clear();
    }
  }

  /**
   * Mark conversation as completed but keep in storage
   */
  markCompleted(): void {
    if (this.state) {
      this.state.isActive = false;
      this.saveToStorage(this.state);
    }
  }

  /**
   * Check if session is still valid (within 10 minutes)
   */
  private isSessionValid(state: ConversationState): boolean {
    const now = Date.now();
    const timeSinceActivity = now - state.lastActivity;
    return timeSinceActivity < SESSION_TIMEOUT_MS;
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): ConversationState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ConversationState;
      }
    } catch (error) {
      console.error('Failed to load conversation state:', error);
    }
    
    return null;
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(state: ConversationState): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save conversation state:', error);
    }
  }

  /**
   * Check if user can continue after booking
   */
  canContinueAfterBooking(): boolean {
    if (!this.state) return false;
    
    // User can continue if session is valid and they have a booking URL
    return this.isSessionValid(this.state) && !!this.state.bookingUrl;
  }

  /**
   * Get time remaining in session (in seconds)
   */
  getSessionTimeRemaining(): number {
    if (!this.state) return 0;
    
    const timeSinceActivity = Date.now() - this.state.lastActivity;
    const timeRemaining = SESSION_TIMEOUT_MS - timeSinceActivity;
    
    return Math.max(0, Math.floor(timeRemaining / 1000));
  }
}

// Create singleton instance
export const conversationStore = new ConversationStore();