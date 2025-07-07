'use client';

import Link from 'next/link';
import { EventCard } from '../components/EventCard';
import { useKey } from '../contexts/KeyProvider';
import { useEvents } from '../contexts/EventsProvider';

export default function Home() {
  const { publicKey } = useKey();
  const { events, communityInfo, moderators, isLoading, error, updateEvent, deleteEvent } = useEvents();
  
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {communityInfo && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {communityInfo.tags.find(tag => tag[0] === 'name')?.[1] || 'Community'}
              </h2>
              {communityInfo.content && (
                <p className="text-gray-600 mt-1">{communityInfo.content}</p>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Community Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-sm text-gray-600 flex-1">Community ID:</span>
                      <span className="text-sm font-mono text-gray-900 flex-1 truncate overflow-hidden">{process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID}</span>
                    </div>
                    <div className="flex">
                      <span className="text-sm text-gray-600 flex-1">Identifier:</span>
                      <span className="text-sm font-mono text-gray-900 flex-1 truncate overflow-hidden">{process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER}</span>
                    </div>
                  </div>
                </div>
                
                {moderators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Moderators ({moderators.length})
                    </h3>
                    <div className="space-y-1">
                      {moderators.map((moderator, index) => (
                        <div key={index} className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">
                          {moderator}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 mb-4">
          <Link
            href="/create"
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-center"
          >
            Create New Event
          </Link>

          <Link
            href="/settings"
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-center"
          >
            Settings
          </Link>

          {communityInfo && publicKey && communityInfo.tags.some(tag => 
            tag[0] === 'p' && 
            tag[1] === publicKey && 
            tag[3] === 'moderator'
          ) && (
            <Link
              href="/moderation"
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-center"
            >
              Moderate Events
            </Link>
          )}

          <a
            href="/api/calendar"
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-center"
          >
            Download Community Calendar
          </a>
        </div>

        {isLoading && (
          <div className="text-center py-4">Loading events...</div>
        )}

        {error && (
          <div className="text-red-500 py-4">{error}</div>
        )}

        <div className="space-y-4">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onEventUpdate={updateEvent}
              onEventDelete={deleteEvent}
            />
          ))}
        </div>
      </div>
    </main>
  );
} 