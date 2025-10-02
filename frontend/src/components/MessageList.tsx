/**
 * Message List Component
 * Displays chat messages with appropriate styling
 */

'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { Message } from '../types/chat';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'assistant';
    
    // System messages (errors, success, etc.)
    if (isSystem) {
      const isError = message.content.toLowerCase().includes('error');
      const isSuccess = message.metadata?.url;
      
      return (
        <div
          key={message.id}
          className="flex items-start space-x-3 py-3 px-4 rounded-lg"
          style={{
            backgroundColor: isError 
              ? 'rgba(239, 68, 68, 0.1)' // error with opacity
              : isSuccess 
              ? 'var(--brand-primary-light)' 
              : 'var(--brand-primary-light)'
          }}
        >
          <div 
            className="mt-1"
            style={{
              color: isError 
                ? 'var(--brand-error)' 
                : isSuccess 
                ? '#171316' 
                : '#6b7280'
            }}
          >
            {isError ? (
              <AlertCircle className="w-5 h-5" />
            ) : isSuccess ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p 
              className="text-sm"
              style={{
                color: isError 
                  ? 'var(--brand-error)' 
                  : isSuccess 
                  ? '#171316' 
                  : '#171316'
              }}
            >
              {message.content}
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={message.id}
        className={`flex py-4 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* Message bubble */}
        <div className={`max-w-[80%]`}>
          <div 
            className="rounded-2xl px-4 py-3"
            style={{
              backgroundColor: isUser ? 'var(--brand-primary)' : '#f5f5f5',
              color: isUser ? 'var(--text-on-brand)' : '#171316'
            }}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
            
            {/* Show extracted parameters for assistant messages */}
            {isAssistant && message.metadata && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#6b7280' }}>
                  Extracted information:
                </p>
                <div className="space-y-1">
                  {message.metadata.origin_code && (
                    <div className="text-xs" style={{ color: '#6b7280' }}>
                      From: {message.metadata.origin_name || message.metadata.origin_code}
                    </div>
                  )}
                  {message.metadata.destination_code && (
                    <div className="text-xs" style={{ color: '#6b7280' }}>
                      To: {message.metadata.destination_name || message.metadata.destination_code}
                    </div>
                  )}
                  {message.metadata.departure_date && (
                    <div className="text-xs" style={{ color: '#6b7280' }}>
                      Departure: {new Date(message.metadata.departure_date).toLocaleDateString()}
                    </div>
                  )}
                  {message.metadata.return_date && (
                    <div className="text-xs" style={{ color: '#6b7280' }}>
                      Return: {new Date(message.metadata.return_date).toLocaleDateString()}
                    </div>
                  )}
                  {(message.metadata.adults !== undefined || 
                    message.metadata.children !== undefined || 
                    message.metadata.infants !== undefined) && (
                    <div className="text-xs" style={{ color: '#6b7280' }}>
                      Passengers: {
                        [
                          message.metadata.adults && `${message.metadata.adults} adult${message.metadata.adults > 1 ? 's' : ''}`,
                          message.metadata.children > 0 && `${message.metadata.children} child${message.metadata.children > 1 ? 'ren' : ''}`,
                          message.metadata.infants > 0 && `${message.metadata.infants} infant${message.metadata.infants > 1 ? 's' : ''}`
                        ].filter(Boolean).join(', ') || 'Not specified yet'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-2">
      {messages.map(renderMessage)}
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="flex py-4">
          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="flex items-center space-x-1">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6b7280' }} />
              <span className="text-sm" style={{ color: '#6b7280' }}>Assistant is typing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}