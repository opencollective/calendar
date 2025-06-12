'use client';

import { useEffect, useState, useRef } from 'react';
import {
  SimplePool,
  type EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  VerifiedEvent,
  verifyEvent,
  type NostrEvent,
} from "nostr-tools";
import Link from 'next/link';

import { CalendarTemplateEvent } from '@/lib/nip-52';
import { EventCard } from './components/EventCard';
import { getCommunityATag } from '@/lib/nip-72';

const community_id = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_ID;
const community_identifier = process.env.NEXT_PUBLIC_NOSTR_COMMUNITY_IDENTIFIER;

export default function Home() {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [secretKey, setSecretKey] = useState<Uint8Array | null>(null);
  const [pubKey, setPubKey] = useState<string | null>(null);
  const poolRef = useRef(new SimplePool());
  const relays = ['wss://relay.chorus.community'];
  
  // Initialize secret key
  useEffect(() => {
    const sk = generateSecretKey();
    setSecretKey(sk);
    let pk = getPublicKey(sk) // `pk` is a hex string
    setPubKey(pk);
  }, []);

  useEffect(() => {
    if (!community_id || !community_identifier) {
      console.error('Community ID or identifier not found in environment variables');
      return;
    }
    const community_a_tag = getCommunityATag(community_id, community_identifier);
    console.log('community_a_tag', community_a_tag);
    const asyncFetchEvents = async () => {
      console.log('fetching events');
      if (!pubKey) {
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
  }, [pubKey]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="text-sm text-gray-700 font-semibold">Community ID: <span className="font-mono">{community_id}</span></div>
          <div className="text-sm text-gray-700 font-semibold">Community Identifier: <span className="font-mono">{community_identifier}</span></div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Nostr Events</h1>
        <div className="mb-4">
          Connection status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        <Link
          href="/create"
          className="inline-block mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Create New Event
        </Link>

        <a
          href="/api/calendar"
          className="inline-block mb-4 ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Download Community Calendar
        </a>

        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
} 