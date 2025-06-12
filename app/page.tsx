'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SimplePool,
  type EventTemplate,
  finalizeEvent,
  VerifiedEvent,
  verifyEvent,
  type NostrEvent,
} from "nostr-tools";
import Link from 'next/link';

import { CalendarTemplateEvent } from '@/lib/nip-52';
import { EventCard } from './components/EventCard';
import { getCommunityATag } from '@/lib/nip-72';
import { useKey } from './contexts/KeyProvider';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;

export default function Home() {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const poolRef = useRef(new SimplePool());
  const relays = ['wss://relay.chorus.community'];
  const { publicKey } = useKey();
  
  useEffect(() => {
    if (!community_id || !community_identifier) {
      console.error('Community ID or identifier not found in environment variables');
      return;
    }
    const community_a_tag = getCommunityATag(community_id, community_identifier);
    console.log('community_a_tag', community_a_tag);
    const asyncFetchEvents = async () => {
      console.log('fetching events');
      if (!publicKey) {
        return;
      }
      const events = await poolRef.current.querySync(
        relays,
        {
          kinds: [11, 1, 31922],
          limit: 20,
          '#a': [community_a_tag],
        },
      );
      console.log('events', events);
      if (events) {
        console.log('it exists indeed on this relay:', events)
        setEvents(events);
      }
    }
    asyncFetchEvents();
  }, [publicKey]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-700 font-semibold">Community ID: <span className="font-mono">{community_id}</span></div>
          <div className="text-sm text-gray-700 font-semibold">Community Identifier: <span className="font-mono">{community_identifier}</span></div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Nostr Events</h1>
        
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

          <a
            href="/api/calendar"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Download Community Calendar
          </a>
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
} 