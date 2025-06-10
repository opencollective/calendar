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

import { bytesToHex, hexToBytes } from '@noble/hashes/utils' // already an installed dependency
import { CalendarTemplateEvent } from '@/lib/nip-52';
import { EventCard } from './components/EventCard';

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
  
  const publishEvent = async () => {
    try {
      if (!secretKey || !pubKey) {
        console.error('No secret key available');
        return;
      }
      const calendarEvent: CalendarTemplateEvent = {
        kind: 31922,
        tags: [
          ['d', '1234567890'],
          ['title', 'My Event'],
          ['start', '2025-01-01'],
          ['end', '2025-01-02'],
          ['location', '123 Main St, Anytown, USA'],
          ['g', 'dr5r234'],
        ],
        content: 'This is a test event',
        created_at: Math.floor(Date.now() / 1000),
      };

      let event = finalizeEvent(calendarEvent, secretKey);
      
      let isGood = verifyEvent(event);
      console.log('event', event);
      if (isGood) {
        poolRef.current.publish(relays, event);
        // Refresh events after publishing
        const newEvents = await poolRef.current.querySync(
          relays,
          {
            kinds: [11, 1, 31922],
            limit: 20,
            // authors: ['bc072411cb5a2c5651c8a5cfd92975cef68c165928c5e98b0705edff4301b6db', pubKey]
          },
        );
        if (newEvents) {
          setEvents(newEvents);
        }
      }
    } catch (error) {
      console.error('Error publishing event:', error);
    }
  };

  useEffect(() => {
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
          // authors: ['bc072411cb5a2c5651c8a5cfd92975cef68c165928c5e98b0705edff4301b6db', pubKey]
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
        <h1 className="text-3xl font-bold mb-4">Nostr Events</h1>
        <div className="mb-4">
          Connection status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <button
          onClick={publishEvent}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Publish New Event
        </button>
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
} 