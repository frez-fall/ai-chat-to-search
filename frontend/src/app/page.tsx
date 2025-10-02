'use client';

import React, { useState } from 'react';
import QuickSearchWidget from '@/components/QuickSearchWidget';
import ChatModal from '@/components/ChatModal';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string>('');

  const handleSearch = (query: string) => {
    setInitialQuery(query);
    setIsChatOpen(true);
  };


  const handleBookingUrlGenerated = (url: string) => {
    console.log('Booking URL generated:', url);
    // You could add analytics or other tracking here
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#171316'
      }}
    >
      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-5xl mb-8"
            style={{ 
              color: '#FDFEFD',
              fontFamily: 'var(--font-brand)',
              fontWeight: 600
            }}
          >
            Where do you want to go?
          </h1>
          
          {/* Search Widget */}
          <QuickSearchWidget 
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery={initialQuery}
        onBookingUrlGenerated={handleBookingUrlGenerated}
      />

    </div>
  );
}