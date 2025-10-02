/**
 * Message Input Component
 * Input field for sending messages
 */

'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Mic, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export default function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type your message...',
  suggestions = [],
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      setShowSuggestions(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  // Default suggestions for first-time users
  const defaultSuggestions = [
    "Flights from NYC to Tokyo in April",
    "Cheap flights to Bali next month",
    "London to Paris for 2 adults and 1 child",
    "Business class to Dubai in summer",
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className="space-y-3">

      {/* Input container */}
      <div className="relative flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 text-black rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/500
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          {/* Voice input (placeholder) */}
          <button
            type="button"
            disabled={isLoading}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voice input (coming soon)"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Attachment (placeholder) */}
          <button
            type="button"
            disabled={isLoading}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file (coming soon)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {message.length > 400 && (
          <span className="text-orange-500">
            {500 - message.length} characters remaining
          </span>
        )}
      </div>
    </div>
  );
}