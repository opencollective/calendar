'use client';

import Link from 'next/link';
import { EventCard } from '../components/EventCard';
import { useKey } from '../contexts/KeyProvider';
import { useEvents } from '../contexts/EventsProvider';

export default function Home() {
  const { publicKey } = useKey();
  const { events, communityInfo, moderators, isLoading, error } = useEvents();
  
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-700 font-semibold">Community ID: <span className="font-mono">{process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID}</span></div>
          <div className="text-sm text-gray-700 font-semibold">Community Identifier: <span className="font-mono">{process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER}</span></div>
          {communityInfo && (
            <>
              <div className="text-sm text-gray-700 font-semibold mt-2">Community Name: <span className="font-mono">{communityInfo.tags.find(tag => tag[0] === 'name')?.[1]}</span></div>
              <div className="text-sm text-gray-700 font-semibold">Description: <span className="font-mono">{communityInfo.content}</span></div>
              <div className="text-sm text-gray-700 font-semibold mt-2">
                Moderators:
                <div className="mt-1 space-y-1">
                  {moderators
                    .map((moderator, index) => (
                      <div key={index} className="ml-4">
                        <span className="font-mono">{moderator}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
          {communityInfo && (
            <div className="text-sm text-gray-700 font-semibold mt-2">
              Raw Tags:
              <pre className="mt-1 p-2 bg-gray-200 rounded overflow-x-auto">
                {JSON.stringify(communityInfo.tags, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="flex gap-4 mb-4">
          <Link
            href="/create"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create New Event
          </Link>

          <Link
            href="/settings"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Moderate Events
            </Link>
          )}

          <a
            href="/api/calendar"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
} 