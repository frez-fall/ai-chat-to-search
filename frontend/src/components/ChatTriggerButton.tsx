/**
 * Chat Trigger Button Component
 * Button to open the chat modal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles, X } from 'lucide-react';

interface ChatTriggerButtonProps {
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showPulse?: boolean;
  showTooltip?: boolean;
  customText?: string;
}

export default function ChatTriggerButton({
  onClick,
  position = 'bottom-right',
  showPulse = true,
  showTooltip = true,
  customText,
}: ChatTriggerButtonProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  useEffect(() => {
    // Check if user has interacted before
    const hasInteracted = localStorage.getItem('chatButtonClicked');
    if (hasInteracted) {
      setHasBeenClicked(true);
    }

    // Show tooltip after 3 seconds for first-time users
    if (!hasInteracted && showTooltip) {
      const timer = setTimeout(() => {
        setIsTooltipVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const handleClick = () => {
    onClick();
    setIsTooltipVisible(false);
    if (!hasBeenClicked) {
      setHasBeenClicked(true);
      localStorage.setItem('chatButtonClicked', 'true');
    }
  };

  const dismissTooltip = () => {
    setIsTooltipVisible(false);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const tooltipPositionClasses = {
    'bottom-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'bottom-full left-0 mb-2',
    'top-right': 'top-full right-0 mt-2',
    'top-left': 'top-full left-0 mt-2',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      {/* Tooltip */}
      {isTooltipVisible && (
        <div className={`absolute ${tooltipPositionClasses[position]} animate-fade-in`}>
          <div className="bg-gray-900 text-white rounded-lg p-3 pr-8 shadow-lg max-w-xs">
            <button
              onClick={dismissTooltip}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium mb-1">
              {customText || "Need help finding flights?"}
            </p>
            <p className="text-xs text-gray-300">
              I can help you search for flights using natural language. Just tell me where you want to go!
            </p>
            <div className="mt-2 flex items-center space-x-1 text-xs text-blue-300">
              <Sparkles className="w-3 h-3" />
              <span>AI-powered search</span>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className={`absolute ${position.includes('right') ? 'right-6' : 'left-6'} ${position.includes('bottom') ? 'top-full' : 'bottom-full'} transform ${position.includes('bottom') ? '-translate-y-1' : 'translate-y-1'}`}>
            <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent ${position.includes('bottom') ? 'border-t-[8px] border-t-gray-900' : 'border-b-[8px] border-b-gray-900'}`} />
          </div>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={handleClick}
        className="group relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
        aria-label="Open flight search assistant"
      >
        {/* Pulse animation for new users */}
        {showPulse && !hasBeenClicked && (
          <>
            <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping animation-delay-200 opacity-50" />
          </>
        )}

        {/* Icon */}
        <MessageCircle className="w-6 h-6 relative z-10" />

        {/* Sparkle badge for new users */}
        {!hasBeenClicked && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 animate-bounce">
            <Sparkles className="w-3 h-3 text-yellow-900" />
          </div>
        )}
      </button>

      {/* Extended button variant (optional) */}
      {customText && (
        <button
          onClick={handleClick}
          className="group flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full pl-4 pr-6 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          aria-label="Open flight search assistant"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {!hasBeenClicked && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                <Sparkles className="w-2 h-2 text-yellow-900" />
              </div>
            )}
          </div>
          <span className="text-sm font-medium">{customText}</span>
        </button>
      )}
    </div>
  );
}