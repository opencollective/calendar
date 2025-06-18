'use client';

import { useEffect, useState } from 'react';
import { EmbedEventCard } from '../../components/EmbedEventCard';
import { useEvents } from '../../contexts/EventsProvider';

export function EmbedPageClient() {
  const [mounted, setMounted] = useState(false);
  const { events, isLoading, error, isInitialized } = useEvents();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted and initialized
  if (!mounted || !isInitialized) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Community Events</h1>
        <div className="text-center py-4 text-gray-600">Loading events...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      
      {isLoading && (
        <div className="text-center py-4 text-gray-600">Loading events...</div>
      )}

      {error && (
        <div className="text-red-500 py-4 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {events.map((event) => (
          <EmbedEventCard key={event.id} event={event} />
        ))}
      </div>

      {events.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          No events found
        </div>
      )}
    </div>
  );
} 